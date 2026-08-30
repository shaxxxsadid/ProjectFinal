// app/services/Order.service.ts
import { Types } from 'mongoose';
import { logger } from '@/app/lib/logger';
import {
  Orders,
  OrderCounters,
  ORDER_STATUS_VALUES,
  FULFILLMENT_METHOD_VALUES,
} from '@/app/models/Order';
import { Products } from '@/app/models/Products';
import {
  stokeService,
  StokeReservationError,
  type StockReservationAllocation,
} from '@/app/services/Stoke.service';
import { stockMovementService } from '@/app/services/StockMovement.service';
import type { StockMovementType, StockMutationResult } from '@/types/stockMovement.types';
import type {
  CreateOrderInput,
  FulfillmentMethod,
  OrderItemShort,
  OrderShort,
  OrderStatus,
  StockReservationState,
} from '@/types/store.types';

type ProductSnapshot = {
  _id: Types.ObjectId;
  sku: string;
  name: string;
  price: number;
};

type ReservationLike = {
  stockId?: unknown;
  productId?: unknown;
  warehouseId?: unknown;
  batchNumber?: unknown;
  quantity?: unknown;
};

export class OrderServiceError extends Error {
  code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = 'OrderServiceError';
    this.code = code;
  }
}

const TERMINAL_STATUSES = new Set<OrderStatus>([
  'handed_to_carrier',
  'issued',
  'cancelled',
]);

const BASE_TRANSITIONS: Partial<
  Record<OrderStatus, OrderStatus[]>
> = {
  new: ['confirmed', 'cancelled'],
  confirmed: ['assembling', 'cancelled'],
  ready_for_pickup: ['issued', 'cancelled'],
  ready_for_shipment: ['handed_to_carrier', 'cancelled'],
};

class OrderService {
  private normalizeString(value: unknown): string {
    return String(value ?? '').trim();
  }

  /**
   * История склада пишется только после успешного order.save().
   *
   * Если MongoDB не смогла записать историю, сам заказ и склад уже
   * находятся в корректном состоянии. Не возвращаем клиенту ложную
   * ошибку статуса, а фиксируем критическую проблему в logger.
   */
  private async recordStockMovementsSafely(input: {
    type: Extract<
      StockMovementType,
      'reservation' | 'release' | 'issue'
    >;
    orderId: string;
    orderNumber: string;
    actorId: string;
    mutations: StockMutationResult[];
  }): Promise<void> {
    try {
      await stockMovementService.recordOrderMovements(
        input
      );
    } catch (error) {
      logger.error(
        `Critical: order ${input.orderNumber} was updated, but StockMovement was not written: ${
          error instanceof Error
            ? error.message
            : error
        }`
      );
    }
  }

  private async generateOrderNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const key = `orders-${year}`;

    const counter = (await OrderCounters.findOneAndUpdate(
      { key },
      { $inc: { seq: 1 } },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    ).lean()) as { seq: number } | null;

    const seq = Number(counter?.seq ?? 1);

    return `ORD-${year}-${String(seq).padStart(6, '0')}`;
  }

  private validateCustomer(
    customer: CreateOrderInput['customer']
  ): void {
    if (!customer) {
      throw new OrderServiceError(
        'Customer data is required',
        'VALIDATION_ERROR'
      );
    }

    const firstName = this.normalizeString(
      customer.firstName
    );
    const lastName = this.normalizeString(
      customer.lastName
    );
    const email = this.normalizeString(
      customer.email
    ).toLowerCase();
    const phone = this.normalizeString(customer.phone);

    if (!firstName || !lastName || !email || !phone) {
      throw new OrderServiceError(
        'First name, last name, email and phone are required',
        'VALIDATION_ERROR'
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new OrderServiceError(
        'Invalid customer email',
        'VALIDATION_ERROR'
      );
    }
  }

  private validateFulfillmentMethod(
    value: unknown
  ): FulfillmentMethod {
    const method = this.normalizeString(
      value
    ) as FulfillmentMethod;

    if (
      !FULFILLMENT_METHOD_VALUES.includes(
        method as (typeof FULFILLMENT_METHOD_VALUES)[number]
      )
    ) {
      throw new OrderServiceError(
        'Invalid fulfillment method',
        'VALIDATION_ERROR'
      );
    }

    return method;
  }

  private getAllowedTransitions(
    status: OrderStatus,
    fulfillmentMethod: FulfillmentMethod
  ): OrderStatus[] {
    if (status === 'assembling') {
      return fulfillmentMethod === 'pickup'
        ? ['ready_for_pickup', 'cancelled']
        : ['ready_for_shipment', 'cancelled'];
    }

    return BASE_TRANSITIONS[status] ?? [];
  }

  private toStockAllocations(
    value: unknown
  ): StockReservationAllocation[] {
    if (!Array.isArray(value)) return [];

    return value.map((raw) => {
      const item = raw as ReservationLike;

      return {
        stockId: String(item.stockId ?? ''),
        productId: String(item.productId ?? ''),
        warehouseId: String(item.warehouseId ?? ''),
        batchNumber: String(item.batchNumber ?? ''),
        quantity: Number(item.quantity ?? 0),
      };
    });
  }

  private translateStokeError(
    error: unknown
  ): never {
    if (error instanceof StokeReservationError) {
      throw new OrderServiceError(
        error.message,
        error.code
      );
    }

    throw error;
  }

  async createOrder(
    userId: string,
    input: CreateOrderInput
  ): Promise<OrderShort> {
    try {
      if (!Types.ObjectId.isValid(userId)) {
        throw new OrderServiceError(
          'Invalid authenticated user',
          'INVALID_USER'
        );
      }

      if (
        !Array.isArray(input?.items) ||
        input.items.length === 0
      ) {
        throw new OrderServiceError(
          'Order must contain at least one item',
          'VALIDATION_ERROR'
        );
      }

      this.validateCustomer(input.customer);

      const fulfillmentMethod =
        this.validateFulfillmentMethod(
          input.fulfillmentMethod
        );

      const quantities = new Map<string, number>();

      for (const rawItem of input.items) {
        const productId = this.normalizeString(
          rawItem?.productId
        );
        const quantity = Number(rawItem?.quantity);

        if (!Types.ObjectId.isValid(productId)) {
          throw new OrderServiceError(
            `Invalid product id: ${
              productId || 'empty'
            }`,
            'VALIDATION_ERROR'
          );
        }

        if (
          !Number.isInteger(quantity) ||
          quantity <= 0
        ) {
          throw new OrderServiceError(
            'Product quantity must be a positive integer',
            'VALIDATION_ERROR'
          );
        }

        quantities.set(
          productId,
          (quantities.get(productId) ?? 0) +
            quantity
        );
      }

      const productIds = Array.from(
        quantities.keys()
      );

      const products = (await Products.find({
        _id: { $in: productIds },
      })
        .select('_id sku name price')
        .lean()) as ProductSnapshot[];

      if (products.length !== productIds.length) {
        const found = new Set(
          products.map((p) => String(p._id))
        );

        const missing = productIds.filter(
          (id) => !found.has(id)
        );

        throw new OrderServiceError(
          `Product not found: ${missing.join(', ')}`,
          'PRODUCT_NOT_FOUND'
        );
      }

      const productsById = new Map(
        products.map((product) => [
          String(product._id),
          product,
        ])
      );

      const orderItems = productIds.map(
        (productId) => {
          const product =
            productsById.get(productId);

          if (!product) {
            throw new OrderServiceError(
              `Product not found: ${productId}`,
              'PRODUCT_NOT_FOUND'
            );
          }

          const price = Number(product.price);
          const quantity =
            quantities.get(productId) ?? 0;

          if (
            !Number.isFinite(price) ||
            price < 0
          ) {
            throw new OrderServiceError(
              `Invalid price for product ${productId}`,
              'INVALID_PRODUCT_PRICE'
            );
          }

          return {
            productId: product._id,
            sku: product.sku,
            name: product.name,
            price,
            quantity,
            subtotal: Number(
              (price * quantity).toFixed(2)
            ),
          };
        }
      );

      const totalAmount = Number(
        orderItems
          .reduce(
            (sum, item) =>
              sum + item.subtotal,
            0
          )
          .toFixed(2)
      );

      const orderNumber =
        await this.generateOrderNumber();
      const now = new Date();
      const userObjectId =
        new Types.ObjectId(userId);

      const order = await Orders.create({
        orderNumber,
        userId: userObjectId,
        items: orderItems,
        totalAmount,
        fulfillmentMethod,

        // Клиент не выбирает склад.
        // Его назначает администратор при new -> confirmed.
        warehouseId: null,
        stockReservations: [],
        stockReservationState: 'none',

        status: 'new',
        statusHistory: [
          {
            status: 'new',
            changedAt: now,
            changedBy: userObjectId,
          },
        ],
        customer: {
          firstName: this.normalizeString(
            input.customer.firstName
          ),
          lastName: this.normalizeString(
            input.customer.lastName
          ),
          email: this.normalizeString(
            input.customer.email
          ).toLowerCase(),
          phone: this.normalizeString(
            input.customer.phone
          ),
        },
        comment:
          this.normalizeString(input.comment) ||
          undefined,
      });

      return order.toObject() as unknown as OrderShort;
    } catch (error) {
      logger.error(
        `Failed to create order: ${
          error instanceof Error
            ? error.message
            : error
        }`
      );
      throw error;
    }
  }

  async getAllOrders(): Promise<OrderShort[]> {
    const orders = await Orders.find()
      .sort({ createdAt: -1 })
      .lean();

    return orders as unknown as OrderShort[];
  }

  async getOrdersByUser(
    userId: string
  ): Promise<OrderShort[]> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new OrderServiceError(
        'Invalid authenticated user',
        'INVALID_USER'
      );
    }

    const orders = await Orders.find({
      userId: new Types.ObjectId(userId),
    })
      .sort({ createdAt: -1 })
      .lean();

    return orders as unknown as OrderShort[];
  }

  async getOrderById(
    orderId: string
  ): Promise<OrderShort | null> {
    if (!Types.ObjectId.isValid(orderId)) {
      return null;
    }

    const order = await Orders.findById(
      orderId
    ).lean();

    return order as unknown as OrderShort | null;
  }

  async getOrderForRequester(
    orderId: string,
    requesterId: string,
    isAdmin: boolean
  ): Promise<OrderShort | null> {
    const order =
      await this.getOrderById(orderId);

    if (!order) return null;

    if (
      !isAdmin &&
      String(order.userId) !==
        String(requesterId)
    ) {
      throw new OrderServiceError(
        'Forbidden',
        'FORBIDDEN'
      );
    }

    return order;
  }

  async updateOrderStatus(
    orderId: string,
    nextStatus: OrderStatus,
    changedBy: string,
    warehouseId?: string
  ): Promise<OrderShort> {
    if (!Types.ObjectId.isValid(orderId)) {
      throw new OrderServiceError(
        'Invalid order id',
        'VALIDATION_ERROR'
      );
    }

    if (!Types.ObjectId.isValid(changedBy)) {
      throw new OrderServiceError(
        'Invalid authenticated user',
        'INVALID_USER'
      );
    }

    if (
      !ORDER_STATUS_VALUES.includes(
        nextStatus as (typeof ORDER_STATUS_VALUES)[number]
      )
    ) {
      throw new OrderServiceError(
        'Invalid order status',
        'VALIDATION_ERROR'
      );
    }

    const order = await Orders.findById(
      orderId
    );

    if (!order) {
      throw new OrderServiceError(
        'Order not found',
        'NOT_FOUND'
      );
    }

    const currentStatus =
      order.status as OrderStatus;
    const fulfillmentMethod =
      order.fulfillmentMethod as FulfillmentMethod;

    const reservationState = String(
      order.stockReservationState ?? 'none'
    ) as StockReservationState;

    if (currentStatus === nextStatus) {
      return order.toObject() as unknown as OrderShort;
    }

    if (TERMINAL_STATUSES.has(currentStatus)) {
      throw new OrderServiceError(
        'Order is already in a final status',
        'INVALID_TRANSITION'
      );
    }

    const allowed = this.getAllowedTransitions(
      currentStatus,
      fulfillmentMethod
    );

    if (!allowed.includes(nextStatus)) {
      throw new OrderServiceError(
        `Transition ${currentStatus} -> ${nextStatus} is not allowed`,
        'INVALID_TRANSITION'
      );
    }

    const changedByObjectId =
      new Types.ObjectId(changedBy);

    // --------------------------------------------------------------
    // NEW -> CONFIRMED:
    // администратор выбирает склад и создаётся резерв.
    // --------------------------------------------------------------
    if (nextStatus === 'confirmed') {
      if (
        !warehouseId ||
        !Types.ObjectId.isValid(warehouseId)
      ) {
        throw new OrderServiceError(
          'Выберите склад перед подтверждением заказа',
          'WAREHOUSE_REQUIRED'
        );
      }

      if (reservationState !== 'none') {
        throw new OrderServiceError(
          'Для заказа уже выполнялось резервирование',
          'RESERVATION_ALREADY_EXISTS'
        );
      }

      let reservations: StockMutationResult[];

      try {
        reservations =
          await stokeService.reserveOrderItems(
            warehouseId,
            order.items.map((item: OrderItemShort) => ({
              productId: String(item.productId),
              quantity: Number(item.quantity),
              name: String(item.name),
            }))
          );
      } catch (error) {
        this.translateStokeError(error);
      }

      try {
        order.warehouseId =
          new Types.ObjectId(warehouseId);

        order.stockReservations =
          reservations!.map((reservation) => ({
            stockId: new Types.ObjectId(
              reservation.stockId
            ),
            productId: new Types.ObjectId(
              reservation.productId
            ),
            warehouseId: new Types.ObjectId(
              reservation.warehouseId
            ),
            batchNumber:
              reservation.batchNumber,
            quantity: reservation.quantity,
          }));

        order.stockReservationState =
          'reserved';

        order.status = 'confirmed';

        order.statusHistory.push({
          status: 'confirmed',
          changedAt: new Date(),
          changedBy: changedByObjectId,
        });

        await order.save();

        await this.recordStockMovementsSafely({
          type: 'reservation',
          orderId: String(order._id),
          orderNumber: String(order.orderNumber),
          actorId: changedBy,
          mutations: reservations!,
        });

        return order.toObject() as unknown as OrderShort;
      } catch (error) {
        // Склад уже изменён, а заказ не сохранился:
        // обязательно освобождаем только что созданный резерв.
        try {
          await stokeService.releaseReservationAllocations(
            reservations!
          );
        } catch (rollbackError) {
          logger.error(
            `Critical order reservation rollback failed: ${
              rollbackError instanceof Error
                ? rollbackError.message
                : rollbackError
            }`
          );

          throw new OrderServiceError(
            'Критическая ошибка: заказ не сохранён и резерв не удалось автоматически откатить',
            'RESERVATION_ROLLBACK_FAILED'
          );
        }

        throw error;
      }
    }

    const stockReservations =
      this.toStockAllocations(
        order.stockReservations
      );

    // После подтверждения нельзя продолжать обработку,
    // если у заказа отсутствует активный резерв.
    if (
      (
        nextStatus === 'assembling' ||
        nextStatus === 'ready_for_pickup' ||
        nextStatus === 'ready_for_shipment'
      ) &&
      reservationState !== 'reserved'
    ) {
      throw new OrderServiceError(
        'У заказа отсутствует активный складской резерв',
        'STOCK_NOT_RESERVED'
      );
    }

    // --------------------------------------------------------------
    // CANCEL:
    // если товар был зарезервирован — возвращаем available.
    // Новый заказ без резерва просто отменяется.
    // --------------------------------------------------------------
    if (
      nextStatus === 'cancelled' &&
      reservationState === 'reserved'
    ) {
      if (stockReservations.length === 0) {
        throw new OrderServiceError(
          'В заказе нет данных складского резерва',
          'STOCK_NOT_RESERVED'
        );
      }

      let releaseMutations: StockMutationResult[];

      try {
        releaseMutations =
          await stokeService.releaseReservationAllocations(
            stockReservations
          );
      } catch (error) {
        this.translateStokeError(error);
      }

      try {
        order.stockReservationState =
          'released';

        order.status = 'cancelled';

        order.statusHistory.push({
          status: 'cancelled',
          changedAt: new Date(),
          changedBy: changedByObjectId,
        });

        await order.save();

        await this.recordStockMovementsSafely({
          type: 'release',
          orderId: String(order._id),
          orderNumber: String(order.orderNumber),
          actorId: changedBy,
          mutations: releaseMutations!,
        });

        return order.toObject() as unknown as OrderShort;
      } catch (error) {
        // Заказ не сохранился после возврата резерва:
        // восстанавливаем резерв.
        try {
          await stokeService.restoreReservationAllocations(
            stockReservations
          );
        } catch (rollbackError) {
          logger.error(
            `Critical release rollback failed: ${
              rollbackError instanceof Error
                ? rollbackError.message
                : rollbackError
            }`
          );

          throw new OrderServiceError(
            'Критическая ошибка восстановления резерва после отмены',
            'RESERVATION_ROLLBACK_FAILED'
          );
        }

        throw error;
      }
    }

    // --------------------------------------------------------------
    // ФИНАЛЬНОЕ СПИСАНИЕ:
    // pickup -> issued
    // transport_company -> handed_to_carrier
    // --------------------------------------------------------------
    const isStockCommit =
      nextStatus === 'issued' ||
      nextStatus === 'handed_to_carrier';

    if (isStockCommit) {
      if (
        reservationState !== 'reserved' ||
        stockReservations.length === 0
      ) {
        throw new OrderServiceError(
          'Нельзя завершить заказ без активного складского резерва',
          'STOCK_NOT_RESERVED'
        );
      }

      let commitMutations: StockMutationResult[];

      try {
        commitMutations =
          await stokeService.commitReservationAllocations(
            stockReservations
          );
      } catch (error) {
        this.translateStokeError(error);
      }

      try {
        order.stockReservationState =
          'committed';

        order.status = nextStatus;

        order.statusHistory.push({
          status: nextStatus,
          changedAt: new Date(),
          changedBy: changedByObjectId,
        });

        await order.save();

        await this.recordStockMovementsSafely({
          type: 'issue',
          orderId: String(order._id),
          orderNumber: String(order.orderNumber),
          actorId: changedBy,
          mutations: commitMutations!,
        });

        return order.toObject() as unknown as OrderShort;
      } catch (error) {
        // Списание уже применилось, но Order не сохранился:
        // возвращаем quantity/reserved.
        try {
          await stokeService.restoreCommittedAllocations(
            stockReservations
          );
        } catch (rollbackError) {
          logger.error(
            `Critical commit rollback failed: ${
              rollbackError instanceof Error
                ? rollbackError.message
                : rollbackError
            }`
          );

          throw new OrderServiceError(
            'Критическая ошибка восстановления склада после списания',
            'COMMIT_ROLLBACK_FAILED'
          );
        }

        throw error;
      }
    }

    // Обычный переход статуса без изменения склада.
    order.status = nextStatus;

    order.statusHistory.push({
      status: nextStatus,
      changedAt: new Date(),
      changedBy: changedByObjectId,
    });

    await order.save();

    return order.toObject() as unknown as OrderShort;
  }
}

export const orderService = new OrderService();
