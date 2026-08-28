'use client';

import { useEffect, useMemo } from 'react';

import { useProductsStore } from '@/app/store/productStore';
import { useStockMovementStore } from '@/app/store/stockMovementStore';
import { useWarehouseStore } from '@/app/store/warehouseStore';
import {
  STOCK_MOVEMENT_TYPE_LABELS,
  type StockMovementShort,
} from '@/types/stockMovement.types';

interface StockMovementTableProps {
  searchQuery?: string;
}

const formatDate = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return new Intl.DateTimeFormat(
    'ru-RU',
    {
      dateStyle: 'short',
      timeStyle: 'short',
    }
  ).format(date);
};

const movementClass = (
  type: StockMovementShort['type']
) => {
  switch (type) {
    case 'reservation':
      return 'border-box/20 bg-box/10 text-box';

    case 'release':
      return 'border-border bg-muted text-foreground/70';

    case 'issue':
      return 'border-foreground/15 bg-foreground/10 text-foreground/75';

    default:
      return 'border-border bg-muted text-muted-foreground';
  }
};

export const StockMovementTable = ({
  searchQuery = '',
}: StockMovementTableProps) => {
  const {
    movements,
    selectedMovement,
    setSelectedMovement,
    fetchMovements,
    isLoading,
    hasLoaded,
    error,
  } = useStockMovementStore();

  const products =
    useProductsStore(
      (state) => state.products.items
    );

  const warehouses =
    useWarehouseStore(
      (state) => state.warehouses
    ) ?? [];

  useEffect(() => {
    if (!hasLoaded) {
      void fetchMovements();
    }
  }, [
    hasLoaded,
    fetchMovements,
  ]);

  const productNames = useMemo(
    () =>
      new Map(
        (products ?? []).map(
          (product) => [
            String(product._id),
            String(product.name),
          ]
        )
      ),
    [products]
  );

  const warehouseNames = useMemo(
    () =>
      new Map(
        warehouses.map(
          (warehouse) => [
            String(warehouse._id),
            String(warehouse.name),
          ]
        )
      ),
    [warehouses]
  );

  const filtered = useMemo(() => {
    const query =
      searchQuery
        .trim()
        .toLowerCase();

    if (!query) {
      return movements;
    }

    return movements.filter(
      (movement) => {
        const product =
          productNames.get(
            String(
              movement.productId
            )
          ) ?? '';

        const warehouse =
          warehouseNames.get(
            String(
              movement.warehouseId
            )
          ) ?? '';

        const searchable = [
          movement._id,
          movement.batchNumber,
          movement.orderNumber,
          movement.type,
          STOCK_MOVEMENT_TYPE_LABELS[
            movement.type
          ],
          product,
          warehouse,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return searchable.includes(
          query
        );
      }
    );
  }, [
    movements,
    searchQuery,
    productNames,
    warehouseNames,
  ]);

  if (
    isLoading &&
    !hasLoaded
  ) {
    return (
      <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">
        Загружаем историю склада...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-72 flex-col items-center justify-center gap-3 text-center">
        <p className="text-sm text-destructive">
          {error}
        </p>

        <button
          type="button"
          onClick={() =>
            void fetchMovements()
          }
          className="rounded-xl border border-border bg-muted px-4 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted/70"
        >
          Повторить
        </button>
      </div>
    );
  }

  if (
    hasLoaded &&
    filtered.length === 0
  ) {
    return (
      <div className="flex h-72 items-center justify-center text-center text-sm text-muted-foreground">
        {searchQuery
          ? 'По вашему запросу операций не найдено'
          : 'История складских операций пока пуста'}
      </div>
    );
  }

  return (
    <div className="max-h-[58vh] overflow-auto rounded-2xl border border-border custom-scrollbar">
      <table className="w-full min-w-185 border-collapse text-left">
        <thead className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl">
          <tr className="border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground">
            <th className="px-3 py-3 font-semibold">
              Дата
            </th>
            <th className="px-3 py-3 font-semibold">
              Операция
            </th>
            <th className="px-3 py-3 font-semibold">
              Товар
            </th>
            <th className="px-3 py-3 font-semibold">
              Склад
            </th>
            <th className="px-3 py-3 font-semibold">
              Партия
            </th>
            <th className="px-3 py-3 text-right font-semibold">
              Количество
            </th>
            <th className="px-3 py-3 font-semibold">
              Заказ
            </th>
          </tr>
        </thead>

        <tbody>
          {filtered.map(
            (movement) => {
              const selected =
                selectedMovement?._id ===
                movement._id;

              const productName =
                productNames.get(
                  String(
                    movement.productId
                  )
                ) ??
                String(
                  movement.productId
                );

              const warehouseName =
                warehouseNames.get(
                  String(
                    movement.warehouseId
                  )
                ) ??
                String(
                  movement.warehouseId
                );

              return (
                <tr
                  key={movement._id}
                  onClick={() =>
                    setSelectedMovement(
                      movement
                    )
                  }
                  className={[
                    'cursor-pointer border-b border-border/70 transition-colors last:border-b-0',
                    selected
                      ? 'bg-box/8'
                      : 'hover:bg-muted/45',
                  ].join(' ')}
                >
                  <td className="whitespace-nowrap px-3 py-3 text-xs text-muted-foreground">
                    {formatDate(
                      movement.createdAt
                    )}
                  </td>

                  <td className="px-3 py-3">
                    <span
                      className={[
                        'inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold',
                        movementClass(
                          movement.type
                        ),
                      ].join(' ')}
                    >
                      {
                        STOCK_MOVEMENT_TYPE_LABELS[
                          movement.type
                        ]
                      }
                    </span>
                  </td>

                  <td className="max-w-48 px-3 py-3">
                    <div
                      className="truncate text-xs font-medium text-foreground"
                      title={productName}
                    >
                      {productName}
                    </div>
                  </td>

                  <td className="max-w-44 px-3 py-3">
                    <div
                      className="truncate text-xs text-foreground/70"
                      title={warehouseName}
                    >
                      {warehouseName}
                    </div>
                  </td>

                  <td className="px-3 py-3 text-xs text-foreground/60">
                    {movement.batchNumber ||
                      '—'}
                  </td>

                  <td className="px-3 py-3 text-right text-xs font-semibold tabular-nums text-foreground">
                    {movement.quantity}
                  </td>

                  <td className="px-3 py-3 text-xs text-foreground/65">
                    {movement.orderNumber ??
                      '—'}
                  </td>
                </tr>
              );
            }
          )}
        </tbody>
      </table>
    </div>
  );
};
