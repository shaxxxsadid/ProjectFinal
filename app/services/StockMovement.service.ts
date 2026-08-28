import { Types } from 'mongoose';

import { logger } from '@/app/lib/logger';
import { StockMovements } from '@/app/models/StockMovement';
import type {
  StockMovementShort,
  StockMovementType,
  StockMutationResult,
} from '@/types/stockMovement.types';

interface RecordOrderMovementsInput {
  type: Extract<
    StockMovementType,
    'reservation' | 'release' | 'issue'
  >;
  orderId: string;
  orderNumber: string;
  actorId: string;
  mutations: StockMutationResult[];
}

class StockMovementService {
  /**
   * Записывает только УСПЕШНУЮ бизнес-операцию заказа.
   *
   * Вызывается Order.service только после успешного order.save().
   * Поэтому технические rollback не попадают в историю.
   */
  async recordOrderMovements(
    input: RecordOrderMovementsInput
  ): Promise<void> {
    if (!Array.isArray(input.mutations)) {
      return;
    }

    const mutations = input.mutations.filter(
      (mutation) =>
        mutation &&
        Number.isFinite(Number(mutation.quantity)) &&
        Number(mutation.quantity) > 0
    );

    if (mutations.length === 0) {
      return;
    }

    if (
      !Types.ObjectId.isValid(input.orderId) ||
      !Types.ObjectId.isValid(input.actorId)
    ) {
      throw new Error(
        'Invalid order/actor id for stock movement'
      );
    }

    const documents = mutations.map(
      (mutation) => {
        if (
          !Types.ObjectId.isValid(
            mutation.stockId
          ) ||
          !Types.ObjectId.isValid(
            mutation.productId
          ) ||
          !Types.ObjectId.isValid(
            mutation.warehouseId
          )
        ) {
          throw new Error(
            'Invalid stock movement reference id'
          );
        }

        return {
          type: input.type,
          source: 'order' as const,

          stockId: new Types.ObjectId(
            mutation.stockId
          ),
          productId: new Types.ObjectId(
            mutation.productId
          ),
          warehouseId: new Types.ObjectId(
            mutation.warehouseId
          ),

          batchNumber:
            String(
              mutation.batchNumber ?? ''
            ),

          quantity: Number(
            mutation.quantity
          ),

          before: {
            quantity: Number(
              mutation.before.quantity
            ),
            reserved: Number(
              mutation.before.reserved
            ),
            available: Number(
              mutation.before.available
            ),
          },

          after: {
            quantity: Number(
              mutation.after.quantity
            ),
            reserved: Number(
              mutation.after.reserved
            ),
            available: Number(
              mutation.after.available
            ),
          },

          orderId: new Types.ObjectId(
            input.orderId
          ),
          orderNumber: String(
            input.orderNumber
          ),
          actorId: new Types.ObjectId(
            input.actorId
          ),
        };
      }
    );

    try {
      await StockMovements.insertMany(
        documents,
        {
          ordered: true,
        }
      );
    } catch (error) {
      logger.error(
        `Failed to write StockMovement: ${
          error instanceof Error
            ? error.message
            : error
        }`
      );
      throw error;
    }
  }

  async getAllMovements(
    limit = 500
  ): Promise<StockMovementShort[]> {
    const safeLimit = Math.min(
      Math.max(
        Number.isFinite(limit)
          ? Math.floor(limit)
          : 500,
        1
      ),
      1000
    );

    const movements =
      await StockMovements.find()
        .sort({ createdAt: -1 })
        .limit(safeLimit)
        .lean();

    return movements as unknown as
      StockMovementShort[];
  }
}

export const stockMovementService =
  new StockMovementService();
