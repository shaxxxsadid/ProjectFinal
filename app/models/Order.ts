// app/models/Order.ts
import { Schema, model, models } from 'mongoose';

export const ORDER_STATUS_VALUES = [
  'new',
  'confirmed',
  'assembling',
  'ready_for_pickup',
  'ready_for_shipment',
  'handed_to_carrier',
  'issued',
  'cancelled',
] as const;

export const FULFILLMENT_METHOD_VALUES = [
  'pickup',
  'transport_company',
] as const;

const orderItemSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Products',
    },
    // Снимок товара на момент оформления заказа.
    // Даже если товар потом переименуют или изменят цену,
    // старый заказ останется неизменным.
    sku: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    subtotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const statusHistorySchema = new Schema(
  {
    status: {
      type: String,
      enum: ORDER_STATUS_VALUES,
      required: true,
    },
    changedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    changedBy: {
      type: Schema.Types.ObjectId,
      required: true,
    },
  },
  { _id: false }
);

const customerSchema = new Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const carrierSchema = new Schema(
  {
    name: { type: String, trim: true },
    trackingNumber: { type: String, trim: true },
  },
  { _id: false }
);

const orderSchema = new Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (items: unknown[]) => Array.isArray(items) && items.length > 0,
        message: 'Order must contain at least one item',
      },
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    fulfillmentMethod: {
      type: String,
      enum: FULFILLMENT_METHOD_VALUES,
      required: true,
    },

    // Пока необязателен. Когда подключим резервирование,
    // сюда будет сохраняться склад комплектации заказа.
    warehouseId: {
      type: Schema.Types.ObjectId,
      required: false,
      default: null,
    },

    status: {
      type: String,
      enum: ORDER_STATUS_VALUES,
      default: 'new',
      required: true,
      index: true,
    },

    statusHistory: {
      type: [statusHistorySchema],
      default: [],
    },

    customer: {
      type: customerSchema,
      required: true,
    },

    comment: {
      type: String,
      trim: true,
      maxlength: 2000,
    },

    carrier: {
      type: carrierSchema,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

orderSchema.index({ createdAt: -1 });
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });

const orderCounterSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    seq: { type: Number, required: true, default: 0 },
  },
  {
    versionKey: false,
  }
);

export const Orders =
  models['Orders'] || model('Orders', orderSchema, 'Orders');

export const OrderCounters =
  models['OrderCounters'] ||
  model('OrderCounters', orderCounterSchema, 'OrderCounters');
