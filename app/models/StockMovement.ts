import {
  Schema,
  model,
  models,
} from 'mongoose';

import {
  STOCK_MOVEMENT_SOURCE_VALUES,
  STOCK_MOVEMENT_TYPE_VALUES,
} from '@/types/stockMovement.types';

const stockSnapshotSchema = new Schema(
  {
    quantity: {
      type: Number,
      required: true,
    },
    reserved: {
      type: Number,
      required: true,
    },
    available: {
      type: Number,
      required: true,
    },
  },
  {
    _id: false,
  }
);

const stockMovementSchema = new Schema(
  {
    type: {
      type: String,
      enum: STOCK_MOVEMENT_TYPE_VALUES,
      required: true,
      index: true,
    },

    source: {
      type: String,
      enum: STOCK_MOVEMENT_SOURCE_VALUES,
      required: true,
      default: 'order',
      index: true,
    },

    stockId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Stoke',
      index: true,
    },

    productId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Products',
      index: true,
    },

    warehouseId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    batchNumber: {
      type: String,
      default: '',
      trim: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    before: {
      type: stockSnapshotSchema,
      required: true,
    },

    after: {
      type: stockSnapshotSchema,
      required: true,
    },

    orderId: {
      type: Schema.Types.ObjectId,
      required: false,
      default: null,
      ref: 'Orders',
      index: true,
    },

    orderNumber: {
      type: String,
      required: false,
      default: null,
      trim: true,
      index: true,
    },

    actorId: {
      type: Schema.Types.ObjectId,
      required: false,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

stockMovementSchema.index({
  createdAt: -1,
});

stockMovementSchema.index({
  warehouseId: 1,
  createdAt: -1,
});

stockMovementSchema.index({
  productId: 1,
  createdAt: -1,
});

stockMovementSchema.index({
  orderId: 1,
  createdAt: 1,
});

export const StockMovements =
  models['StockMovements'] ||
  model(
    'StockMovements',
    stockMovementSchema,
    'StockMovements'
  );
