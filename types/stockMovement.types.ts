export const STOCK_MOVEMENT_TYPE_VALUES = [
  'reservation',
  'release',
  'issue',
  'receipt',
  'adjustment',
] as const;

export type StockMovementType =
  (typeof STOCK_MOVEMENT_TYPE_VALUES)[number];

export const STOCK_MOVEMENT_SOURCE_VALUES = [
  'order',
  'manual',
] as const;

export type StockMovementSource =
  (typeof STOCK_MOVEMENT_SOURCE_VALUES)[number];

export interface StockQuantitySnapshot {
  quantity: number;
  reserved: number;
  available: number;
}

/**
 * Результат одного атомарного изменения конкретной партии.
 * Используется Stoke.service -> Order.service -> StockMovement.service.
 */
export interface StockMutationResult {
  stockId: string;
  productId: string;
  warehouseId: string;
  batchNumber: string;
  quantity: number;
  before: StockQuantitySnapshot;
  after: StockQuantitySnapshot;
}

export interface StockMovementShort {
  _id: string;
  type: StockMovementType;
  source: StockMovementSource;

  stockId: string;
  productId: string;
  warehouseId: string;
  batchNumber: string;

  quantity: number;

  before: StockQuantitySnapshot;
  after: StockQuantitySnapshot;

  orderId?: string | null;
  orderNumber?: string | null;
  actorId?: string | null;

  createdAt: string;
  updatedAt: string;
}

export const STOCK_MOVEMENT_TYPE_LABELS:
  Record<StockMovementType, string> = {
    reservation: 'Резервирование',
    release: 'Снятие резерва',
    issue: 'Выдача / списание',
    receipt: 'Поступление',
    adjustment: 'Корректировка',
  };

export const STOCK_MOVEMENT_SOURCE_LABELS:
  Record<StockMovementSource, string> = {
    order: 'Заказ',
    manual: 'Ручная операция',
  };

export interface StockMovementStoreState {
  movements: StockMovementShort[];
  selectedMovement: StockMovementShort | null;
  isLoading: boolean;
  hasLoaded: boolean;
  error: string | null;

  setSelectedMovement: (
    movement: StockMovementShort | null
  ) => void;

  fetchMovements: () => Promise<void>;
}
