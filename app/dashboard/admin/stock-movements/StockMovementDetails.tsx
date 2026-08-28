'use client';

import { useMemo } from 'react';

import { useProductsStore } from '@/app/store/productStore';
import { useStockMovementStore } from '@/app/store/stockMovementStore';
import { useWarehouseStore } from '@/app/store/warehouseStore';
import {
  STOCK_MOVEMENT_SOURCE_LABELS,
  STOCK_MOVEMENT_TYPE_LABELS,
} from '@/types/stockMovement.types';

const formatDate = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return new Intl.DateTimeFormat(
    'ru-RU',
    {
      dateStyle: 'medium',
      timeStyle: 'short',
    }
  ).format(date);
};

const Snapshot = ({
  title,
  quantity,
  reserved,
  available,
}: {
  title: string;
  quantity: number;
  reserved: number;
  available: number;
}) => (
  <div className="rounded-2xl border border-border bg-muted/35 p-3">
    <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
      {title}
    </div>

    <div className="space-y-1.5 text-xs">
      <div className="flex items-center justify-between gap-3">
        <span className="text-muted-foreground">
          Всего
        </span>
        <span className="font-semibold tabular-nums text-foreground">
          {quantity}
        </span>
      </div>

      <div className="flex items-center justify-between gap-3">
        <span className="text-muted-foreground">
          Свободно
        </span>
        <span className="font-semibold tabular-nums text-foreground">
          {available}
        </span>
      </div>

      <div className="flex items-center justify-between gap-3">
        <span className="text-muted-foreground">
          В резерве
        </span>
        <span className="font-semibold tabular-nums text-foreground">
          {reserved}
        </span>
      </div>
    </div>
  </div>
);

export const StockMovementDetails =
  () => {
    const selectedMovement =
      useStockMovementStore(
        (state) =>
          state.selectedMovement
      );

    const products =
      useProductsStore(
        (state) => state.products.items
      );

    const warehouses =
      useWarehouseStore(
        (state) => state.warehouses
      ) ?? [];

    const productName = useMemo(
      () =>
        (products ?? []).find(
          (product) =>
            String(product._id) ===
            String(
              selectedMovement?.productId
            )
        )?.name ?? null,
      [
        products,
        selectedMovement?.productId,
      ]
    );

    const warehouseName = useMemo(
      () =>
        warehouses.find(
          (warehouse) =>
            String(
              warehouse._id
            ) ===
            String(
              selectedMovement?.warehouseId
            )
        )?.name ?? null,
      [
        warehouses,
        selectedMovement?.warehouseId,
      ]
    );

    if (!selectedMovement) {
      return (
        <div className="flex h-full min-h-90 items-center justify-center rounded-3xl border border-border bg-background/70 p-5 text-center text-sm text-muted-foreground backdrop-blur-xl">
          Выберите операцию, чтобы
          посмотреть изменения склада
        </div>
      );
    }

    return (
      <div className="max-h-[76vh] overflow-auto rounded-3xl border border-border bg-background/75 p-5 backdrop-blur-xl custom-scrollbar">
        <div className="border-b border-border pb-4">
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-box/80">
            Stock movement
          </div>

          <h2 className="mt-1 text-lg font-bold text-foreground">
            {
              STOCK_MOVEMENT_TYPE_LABELS[
                selectedMovement.type
              ]
            }
          </h2>

          <p className="mt-1 text-xs text-muted-foreground">
            {formatDate(
              selectedMovement.createdAt
            )}
          </p>
        </div>

        <div className="mt-4 space-y-3">
          <div className="rounded-2xl border border-border bg-card/60 p-3 text-xs">
            <div className="space-y-2">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Товар
                </div>
                <div className="mt-0.5 font-semibold text-foreground">
                  {productName ??
                    selectedMovement.productId}
                </div>
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Склад
                </div>
                <div className="mt-0.5 font-semibold text-foreground">
                  {warehouseName ??
                    selectedMovement.warehouseId}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Партия
                  </div>
                  <div className="mt-0.5 font-medium text-foreground">
                    {selectedMovement.batchNumber ||
                      '—'}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Количество
                  </div>
                  <div className="mt-0.5 font-semibold tabular-nums text-foreground">
                    {selectedMovement.quantity}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2">
            <Snapshot
              title="До операции"
              quantity={
                selectedMovement.before
                  .quantity
              }
              reserved={
                selectedMovement.before
                  .reserved
              }
              available={
                selectedMovement.before
                  .available
              }
            />

            <Snapshot
              title="После операции"
              quantity={
                selectedMovement.after
                  .quantity
              }
              reserved={
                selectedMovement.after
                  .reserved
              }
              available={
                selectedMovement.after
                  .available
              }
            />
          </div>

          <div className="rounded-2xl border border-border bg-muted/30 p-3">
            <div className="space-y-2 text-xs">
              <div className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground">
                  Источник
                </span>
                <span className="text-right font-medium text-foreground">
                  {
                    STOCK_MOVEMENT_SOURCE_LABELS[
                      selectedMovement.source
                    ]
                  }
                </span>
              </div>

              <div className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground">
                  Заказ
                </span>
                <span className="text-right font-medium text-foreground">
                  {selectedMovement.orderNumber ??
                    '—'}
                </span>
              </div>

              <div className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground">
                  Пользователь
                </span>
                <span
                  className="max-w-36 truncate text-right font-medium text-foreground"
                  title={
                    selectedMovement.actorId ??
                    ''
                  }
                >
                  {selectedMovement.actorId ??
                    '—'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
