// app/services/Order.service.ts
import { Types } from 'mongoose';
import { logger } from '@/app/lib/logger';

import { Products } from '@/app/models/Products';
import { CreateOrderInput, FulfillmentMethod, OrderShort, OrderStatus } from '@/types/store.types';
import { FULFILLMENT_METHOD_VALUES, ORDER_STATUS_VALUES, OrderCounters, Orders } from '../models/Order';


type ProductSnapshot = {
  _id: Types.ObjectId;
  sku: string;
  name: string;
  price: number;
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

const BASE_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  new: ['confirmed', 'cancelled'],
  confirmed: ['assembling', 'cancelled'],
  ready_for_pickup: ['issued', 'cancelled'],
  ready_for_shipment: ['handed_to_carrier', 'cancelled'],
};

class OrderService {
  private normalizeString(value: unknown): string {
    return String(value ?? '').trim();
  }

  private async generateOrderNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const key = `orders-${year}`;

    const counter = await OrderCounters.findOneAndUpdate(
      { key },
      { $inc: { seq: 1 } },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    ).lean() as { seq: number } | null;

    const seq = Number(counter?.seq ?? 1);

    return `ORD-${year}-${String(seq).padStart(6, '0')}`;
  }

  private validateCustomer(customer: CreateOrderInput['customer']): void {
    if (!customer) {
      throw new OrderServiceError(
        'Customer data is required',
        'VALIDATION_ERROR'
      );
    }

    const firstName = this.normalizeString(customer.firstName);
    const lastName = this.normalizeString(customer.lastName);
    const email = this.normalizeString(customer.email).toLowerCase();
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

  private validateFulfillmentMethod(value: unknown): FulfillmentMethod {
    const method = this.normalizeString(value) as FulfillmentMethod;

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

      if (!Array.isArray(input?.items) || input.items.length === 0) {
        throw new OrderServiceError(
          'Order must contain at least one item',
          'VALIDATION_ERROR'
        );
      }

      this.validateCustomer(input.customer);
      const fulfillmentMethod = this.validateFulfillmentMethod(
        input.fulfillmentMethod
      );

      if (
        input.warehouseId &&
        !Types.ObjectId.isValid(String(input.warehouseId))
      ) {
        throw new OrderServiceError(
          'Invalid warehouse id',
          'VALIDATION_ERROR'
        );
      }

      // Объединяем одинаковые товары, если клиент случайно прислал их
      // несколькими строками.
      const quantities = new Map<string, number>();

      for (const rawItem of input.items) {
        const productId = this.normalizeString(rawItem?.productId);
        const quantity = Number(rawItem?.quantity);

        if (!Types.ObjectId.isValid(productId)) {
          throw new OrderServiceError(
            `Invalid product id: ${productId || 'empty'}`,
            'VALIDATION_ERROR'
          );
        }

        if (!Number.isInteger(quantity) || quantity <= 0) {
          throw new OrderServiceError(
            'Product quantity must be a positive integer',
            'VALIDATION_ERROR'
          );
        }

        quantities.set(
          productId,
          (quantities.get(productId) ?? 0) + quantity
        );
      }

      const productIds = Array.from(quantities.keys());

      const products = await Products.find({
        _id: { $in: productIds },
      })
        .select('_id sku name price')
        .lean() as ProductSnapshot[];

      if (products.length !== productIds.length) {
        const found = new Set(products.map((p) => String(p._id)));
        const missing = productIds.filter((id) => !found.has(id));

        throw new OrderServiceError(
          `Product not found: ${missing.join(', ')}`,
          'PRODUCT_NOT_FOUND'
        );
      }

      const productsById = new Map(
        products.map((product) => [String(product._id), product])
      );

      // Цена, название и SKU берутся ТОЛЬКО из БД.
      // Клиент не может подменить стоимость заказа.
      const orderItems = productIds.map((productId) => {
        const product = productsById.get(productId);

        if (!product) {
          throw new OrderServiceError(
            `Product not found: ${productId}`,
            'PRODUCT_NOT_FOUND'
          );
        }

        const price = Number(product.price);
        const quantity = quantities.get(productId) ?? 0;

        if (!Number.isFinite(price) || price < 0) {
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
          subtotal: Number((price * quantity).toFixed(2)),
        };
      });

      const totalAmount = Number(
        orderItems
          .reduce((sum, item) => sum + item.subtotal, 0)
          .toFixed(2)
      );

      const orderNumber = await this.generateOrderNumber();
      const now = new Date();
      const userObjectId = new Types.ObjectId(userId);

      const order = await Orders.create({
        orderNumber,
        userId: userObjectId,
        items: orderItems,
        totalAmount,
        fulfillmentMethod,
        warehouseId: input.warehouseId
          ? new Types.ObjectId(String(input.warehouseId))
          : null,
        status: 'new',
        statusHistory: [
          {
            status: 'new',
            changedAt: now,
            changedBy: userObjectId,
          },
        ],
        customer: {
          firstName: this.normalizeString(input.customer.firstName),
          lastName: this.normalizeString(input.customer.lastName),
          email: this.normalizeString(input.customer.email).toLowerCase(),
          phone: this.normalizeString(input.customer.phone),
        },
        comment: this.normalizeString(input.comment) || undefined,
      });

      return order.toObject() as unknown as OrderShort;
    } catch (error) {
      logger.error(
        `Failed to create order: ${
          error instanceof Error ? error.message : error
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

  async getOrdersByUser(userId: string): Promise<OrderShort[]> {
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

  async getOrderById(orderId: string): Promise<OrderShort | null> {
    if (!Types.ObjectId.isValid(orderId)) {
      return null;
    }

    const order = await Orders.findById(orderId).lean();

    return order as unknown as OrderShort | null;
  }

  async getOrderForRequester(
    orderId: string,
    requesterId: string,
    isAdmin: boolean
  ): Promise<OrderShort | null> {
    const order = await this.getOrderById(orderId);
    if (!order) return null;

    if (
      !isAdmin &&
      String(order.userId) !== String(requesterId)
    ) {
      throw new OrderServiceError('Forbidden', 'FORBIDDEN');
    }

    return order;
  }

  async updateOrderStatus(
    orderId: string,
    nextStatus: OrderStatus,
    changedBy: string
  ): Promise<OrderShort> {
    if (!Types.ObjectId.isValid(orderId)) {
      throw new OrderServiceError('Invalid order id', 'VALIDATION_ERROR');
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

    const order = await Orders.findById(orderId);

    if (!order) {
      throw new OrderServiceError('Order not found', 'NOT_FOUND');
    }

    const currentStatus = order.status as OrderStatus;
    const fulfillmentMethod =
      order.fulfillmentMethod as FulfillmentMethod;

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

    order.status = nextStatus;
    order.statusHistory.push({
      status: nextStatus,
      changedAt: new Date(),
      changedBy: new Types.ObjectId(changedBy),
    });

    await order.save();

    return order.toObject() as OrderShort;
  }
}

export const orderService = new OrderService();
