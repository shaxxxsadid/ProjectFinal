'use client';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';
import { toast } from 'react-hot-toast';
import { useOrderStore } from '@/app/store/orderStore';
import { useWarehouseStore } from '@/app/store/warehouseStore';
import { useStokeStore } from '@/app/store/stokeStore';
import {
  FULFILLMENT_METHOD_LABELS,
  ORDER_STATUS_LABELS,
  STOCK_RESERVATION_STATE_LABELS,
  type OrderStatus,
} from '@/types/store.types';

const formatMoney = (value: number) =>
  new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 2,
  }).format(value);

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));

const buttonLabel: Partial<
  Record<OrderStatus, string>
> = {
  confirmed:
    'Подтвердить и зарезервировать',
  assembling: 'Начать сборку',
  ready_for_pickup:
    'Готов к самовывозу',
  ready_for_shipment:
    'Готов к отправке',
  handed_to_carrier:
    'Передан транспортной компании',
  issued: 'Заказ выдан',
  cancelled: 'Отменить заказ',
};

export const OrderDetails = () => {
  const {
    selectedOrder,
    updateOrderStatus,
    isLoading,
  } = useOrderStore();

  const {
    warehouses,
    fetchWarehouses,
  } = useWarehouseStore();

  // Используем только для синхронизации Stock UI после
  // серверного резерва / возврата / списания.
  const fetchStock = useStokeStore(
    (state) => state.fetchStock
  );

  // Выбор склада хранится отдельно для каждого заказа.
  // Нет setState при смене selectedOrder в useEffect,
  // поэтому не будет react-hooks/set-state-in-effect.
  const [
    warehouseSelection,
    setWarehouseSelection,
  ] = useState<Record<string, string>>({});

  type EligibilityResult = {
    orderId: string;
    requestKey: number;
    warehouseIds: string[];
    error: string | null;
  };

  const [
    eligibilityResult,
    setEligibilityResult,
  ] = useState<EligibilityResult | null>(null);

  const [
    eligibilityRefreshKey,
    setEligibilityRefreshKey,
  ] = useState(0);

  const selectedOrderId =
    selectedOrder?._id ?? null;

  const selectedOrderStatus =
    selectedOrder?.status ?? null;

  // Обновляем список складов из Warehouse API.
  // Не используем persisted snapshot как источник наличия товара.
  useEffect(() => {
    void fetchWarehouses();
  }, [fetchWarehouses]);

  // Наличие товаров определяется ТОЛЬКО сервером из MongoDB.
  useEffect(() => {
    if (
      !selectedOrderId ||
      selectedOrderStatus !== 'new'
    ) {
      return;
    }

    let cancelled = false;
    const requestKey = eligibilityRefreshKey;

    void (async () => {
      try {
        const response = await fetch(
          `/api/orders/${encodeURIComponent(
            selectedOrderId
          )}/eligible-warehouses`,
          {
            method: 'GET',
            cache: 'no-store',
          }
        );

        const result = await response
          .json()
          .catch(() => ({}));

        if (
          !response.ok ||
          result.success === false
        ) {
          throw new Error(
            result.error ||
              'Не удалось проверить остатки складов'
          );
        }

        const warehouseIds =
          Array.isArray(
            result.data?.warehouseIds
          )
            ? result.data.warehouseIds.map(
                (id: unknown) => String(id)
              )
            : [];

        if (!cancelled) {
          setEligibilityResult({
            orderId: selectedOrderId,
            requestKey,
            warehouseIds,
            error: null,
          });
        }
      } catch (error) {
        if (!cancelled) {
          setEligibilityResult({
            orderId: selectedOrderId,
            requestKey,
            warehouseIds: [],
            error:
              error instanceof Error
                ? error.message
                : 'Ошибка проверки складов',
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    selectedOrderId,
    selectedOrderStatus,
    eligibilityRefreshKey,
  ]);

  const activeWarehouses = useMemo(
    () =>
      (warehouses ?? []).filter(
        (warehouse) => warehouse.isActive
      ),
    [warehouses]
  );

  const eligibilityReady =
    Boolean(selectedOrderId) &&
    eligibilityResult?.orderId ===
      selectedOrderId &&
    eligibilityResult?.requestKey ===
      eligibilityRefreshKey;

  const eligibilityLoading =
    selectedOrderStatus === 'new' &&
    !eligibilityReady;

  const eligibleWarehouses = useMemo(() => {
    if (
      selectedOrderStatus !== 'new'
    ) {
      return activeWarehouses;
    }

    if (!eligibilityReady) {
      return [];
    }

    const allowedIds = new Set(
      eligibilityResult?.warehouseIds ?? []
    );

    return activeWarehouses.filter(
      (warehouse) =>
        allowedIds.has(
          String(warehouse._id)
        )
    );
  }, [
    activeWarehouses,
    selectedOrderStatus,
    eligibilityReady,
    eligibilityResult,
  ]);

  const eligibilityError =
    eligibilityReady
      ? eligibilityResult?.error ?? null
      : null;

  const nextStatuses =
    useMemo<OrderStatus[]>(() => {
      if (!selectedOrder) return [];

      switch (selectedOrder.status) {
        case 'new':
          return [
            'confirmed',
            'cancelled',
          ];

        case 'confirmed':
          return [
            'assembling',
            'cancelled',
          ];

        case 'assembling':
          return selectedOrder
            .fulfillmentMethod === 'pickup'
            ? [
                'ready_for_pickup',
                'cancelled',
              ]
            : [
                'ready_for_shipment',
                'cancelled',
              ];

        case 'ready_for_pickup':
          return [
            'issued',
            'cancelled',
          ];

        case 'ready_for_shipment':
          return [
            'handed_to_carrier',
            'cancelled',
          ];

        default:
          return [];
      }
    }, [selectedOrder]);

  if (!selectedOrder) {
    return (
      <div className="h-full min-h-90 rounded-3xl border border-foreground/10 bg-background/70 backdrop-blur-xl p-5 flex items-center justify-center text-center text-sm text-muted-foreground">
        Выберите заказ, чтобы посмотреть
        подробности
      </div>
    );
  }

  const rawSelectedWarehouseId =
    warehouseSelection[
      selectedOrder._id
    ] ??
    (selectedOrder.warehouseId
      ? String(selectedOrder.warehouseId)
      : '');

  const selectedWarehouseId =
    selectedOrder.status === 'new' &&
    eligibilityReady &&
    rawSelectedWarehouseId &&
    !eligibleWarehouses.some(
      (warehouse) =>
        String(warehouse._id) ===
        String(rawSelectedWarehouseId)
    )
      ? ''
      : rawSelectedWarehouseId;

  const selectedWarehouse =
    (warehouses ?? []).find(
      (warehouse) =>
        String(warehouse._id) ===
        String(selectedOrder.warehouseId)
    );

  const reservationState =
    selectedOrder.stockReservationState ??
    'none';

  const handleStatus = async (
    status: OrderStatus
  ) => {
    if (
      status === 'confirmed' &&
      !selectedWarehouseId
    ) {
      toast.error(
        'Выберите склад перед подтверждением заказа'
      );
      return;
    }

    if (
      status === 'confirmed' &&
      !eligibleWarehouses.some(
        (warehouse) =>
          String(warehouse._id) ===
          String(selectedWarehouseId)
      )
    ) {
      toast.error(
        'Выбранный склад не может полностью выполнить заказ. Требуется Transfer или обновление остатков.'
      );
      return;
    }

    const result =
      await updateOrderStatus(
        selectedOrder._id,
        status,
        status === 'confirmed'
          ? {
              warehouseId:
                selectedWarehouseId,
            }
          : undefined
      );

    if (result.success) {
      const stockWasChanged =
        status === 'confirmed' ||
        status === 'cancelled' ||
        status === 'issued' ||
        status === 'handed_to_carrier';

      if (stockWasChanged) {
        await fetchStock();
      }

      toast.success(
        `Статус: ${
          ORDER_STATUS_LABELS[status]
        }`
      );
    } else {
      toast.error(
        result.error ||
          'Не удалось изменить статус'
      );
    }
  };

  return (
    <div className="rounded-3xl border border-foreground/10 bg-background/80 backdrop-blur-xl p-5 shadow-xl max-h-[83vh] overflow-y-auto">
      <div className="mb-4">
        <div className="text-xs text-foreground/40">
          Заказ
        </div>

        <h2 className="text-xl font-bold mt-1 break-all">
          {selectedOrder.orderNumber}
        </h2>

        <div className="mt-2 inline-flex rounded-full border border-foreground/15 bg-foreground/5 px-2.5 py-1 text-xs font-medium">
          {
            ORDER_STATUS_LABELS[
              selectedOrder.status
            ]
          }
        </div>
      </div>

      <div className="space-y-4 text-sm">
        <section>
          <div className="text-xs uppercase tracking-wide text-foreground/35 mb-2">
            Покупатель
          </div>

          <div className="font-medium">
            {selectedOrder.customer.firstName}{' '}
            {selectedOrder.customer.lastName}
          </div>

          <div className="text-foreground/55 mt-1 break-all">
            {selectedOrder.customer.email}
          </div>

          <div className="text-foreground/55 mt-1">
            {selectedOrder.customer.phone}
          </div>
        </section>

        <section>
          <div className="text-xs uppercase tracking-wide text-foreground/35 mb-2">
            Получение
          </div>

          <div className="font-medium">
            {
              FULFILLMENT_METHOD_LABELS[
                selectedOrder
                  .fulfillmentMethod
              ]
            }
          </div>
        </section>

        <section>
          <div className="text-xs uppercase tracking-wide text-foreground/35 mb-2">
            Склад
          </div>

          {selectedOrder.status ===
          'new' ? (
            <>
              <select
                value={selectedWarehouseId}
                onChange={(event) =>
                  setWarehouseSelection(
                    (current) => ({
                      ...current,
                      [selectedOrder._id]:
                        event.target.value,
                    })
                  )
                }
                disabled={isLoading || eligibilityLoading || Boolean(eligibilityError)}
                className="w-full rounded-xl border border-foreground/10 bg-background px-3 py-2 text-sm outline-none focus:border-foreground/25 disabled:opacity-50"
              >
                <option value="">
                  Выберите склад
                </option>

                {eligibleWarehouses.map(
                  (warehouse) => (
                    <option
                      key={warehouse._id}
                      value={warehouse._id}
                    >
                      {warehouse.name} (
                      {warehouse.code})
                    </option>
                  )
                )}
              </select>

              {eligibilityLoading && (
                <div className="mt-2 text-xs text-foreground/45">
                  Проверяем реальные остатки в MongoDB...
                </div>
              )}

              {eligibilityError && (
                <div className="mt-2 rounded-xl border border-red-500/20 bg-red-500/10 p-2.5 text-xs leading-relaxed text-red-500">
                  {eligibilityError}
                </div>
              )}

              {eligibilityReady &&
                !eligibilityError &&
                activeWarehouses.length === 0 && (
                  <div className="mt-2 text-xs text-amber-500">
                    Нет активных складов
                  </div>
                )}

              {eligibilityReady &&
                !eligibilityError &&
                activeWarehouses.length > 0 &&
                eligibleWarehouses.length === 0 && (
                  <div className="mt-2 rounded-xl border border-amber-500/20 bg-amber-500/10 p-2.5 text-xs leading-relaxed text-amber-500">
                    Ни один склад не может полностью
                    выполнить заказ по текущим остаткам
                    MongoDB. Требуется перемещение товаров
                    между складами (Transfer).
                  </div>
                )}

              {eligibilityReady &&
                !eligibilityError &&
                eligibleWarehouses.length > 0 && (
                  <div className="mt-2 text-[11px] leading-relaxed text-foreground/40">
                    Показаны только склады, которые сервер
                    подтвердил по актуальным остаткам
                    MongoDB. Перед резервом остатки будут
                    проверены ещё раз.
                  </div>
                )}

              <button
                type="button"
                onClick={() =>
                  setEligibilityRefreshKey(
                    (value) => value + 1
                  )
                }
                disabled={eligibilityLoading}
                className="mt-2 cursor-pointer text-[11px] text-teal-500 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
              >
                Обновить доступные склады
              </button>
            </>
          ) : (
            <div className="rounded-xl border border-foreground/10 bg-foreground/5 p-3">
              <div className="font-medium">
                {selectedWarehouse
                  ? `${selectedWarehouse.name} (${selectedWarehouse.code})`
                  : selectedOrder.warehouseId ||
                    'Не назначен'}
              </div>

              <div className="mt-1 text-xs text-foreground/45">
                Резерв:{' '}
                {
                  STOCK_RESERVATION_STATE_LABELS[
                    reservationState
                  ]
                }
              </div>
            </div>
          )}
        </section>

        <section>
          <div className="text-xs uppercase tracking-wide text-foreground/35 mb-2">
            Товары
          </div>

          <div className="space-y-2">
            {selectedOrder.items.map(
              (item) => (
                <div
                  key={`${item.productId}-${item.sku}`}
                  className="rounded-xl border border-foreground/10 bg-foreground/5 p-2.5"
                >
                  <div className="font-medium">
                    {item.name}
                  </div>

                  <div className="text-xs text-foreground/45 mt-1">
                    SKU: {item.sku}
                  </div>

                  <div className="flex justify-between gap-2 mt-2 text-xs">
                    <span>
                      {item.quantity} ×{' '}
                      {formatMoney(item.price)}
                    </span>

                    <span className="font-semibold">
                      {formatMoney(
                        item.subtotal
                      )}
                    </span>
                  </div>
                </div>
              )
            )}
          </div>

          <div className="flex justify-between mt-3 font-bold">
            <span>Итого</span>

            <span>
              {formatMoney(
                selectedOrder.totalAmount
              )}
            </span>
          </div>
        </section>

        {selectedOrder.comment && (
          <section>
            <div className="text-xs uppercase tracking-wide text-foreground/35 mb-2">
              Комментарий
            </div>

            <div className="text-foreground/65 whitespace-pre-wrap">
              {selectedOrder.comment}
            </div>
          </section>
        )}

        {selectedOrder.stockReservations
          ?.length > 0 && (
          <section>
            <div className="text-xs uppercase tracking-wide text-foreground/35 mb-2">
              Зарезервированные партии
            </div>

            <div className="space-y-2">
              {selectedOrder.stockReservations.map(
                (reservation, index) => (
                  <div
                    key={`${reservation.stockId}-${index}`}
                    className="rounded-xl border border-foreground/10 bg-foreground/5 p-2.5 text-xs"
                  >
                    <div className="flex justify-between gap-2">
                      <span className="text-foreground/45">
                        Партия
                      </span>

                      <span className="font-mono font-medium">
                        {reservation.batchNumber ||
                          '—'}
                      </span>
                    </div>

                    <div className="mt-1 flex justify-between gap-2">
                      <span className="text-foreground/45">
                        Количество
                      </span>

                      <span className="font-medium">
                        {reservation.quantity}
                      </span>
                    </div>
                  </div>
                )
              )}
            </div>
          </section>
        )}

        <section>
          <div className="text-xs uppercase tracking-wide text-foreground/35 mb-2">
            История статусов
          </div>

          <div className="space-y-2">
            {selectedOrder.statusHistory.map(
              (history, index) => (
                <div
                  key={`${history.status}-${history.changedAt}-${index}`}
                  className="border-l-2 border-foreground/15 pl-3 py-0.5"
                >
                  <div className="font-medium text-xs">
                    {
                      ORDER_STATUS_LABELS[
                        history.status
                      ]
                    }
                  </div>

                  <div className="text-[11px] text-foreground/40 mt-0.5">
                    {formatDate(
                      history.changedAt
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        </section>

        {nextStatuses.length > 0 && (
          <section className="pt-1">
            <div className="text-xs uppercase tracking-wide text-foreground/35 mb-2">
              Изменить статус
            </div>

            <div className="space-y-2">
              {nextStatuses.map(
                (status) => {
                  const isCancel =
                    status === 'cancelled';

                  const confirmDisabled =
                    status === 'confirmed' &&
                    (
                      !selectedWarehouseId ||
                      eligibilityLoading ||
                      Boolean(eligibilityError) ||
                      eligibleWarehouses.length === 0
                    );

                  return (
                    <button
                      key={status}
                      type="button"
                      disabled={
                        isLoading ||
                        confirmDisabled
                      }
                      onClick={() =>
                        handleStatus(status)
                      }
                      className={
                        isCancel
                          ? 'w-full rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-500/15 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'
                          : 'w-full rounded-xl border border-teal-500/20 bg-teal-500/10 px-3 py-2 text-sm font-medium text-teal-500 hover:bg-teal-500/15 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'
                      }
                    >
                      {buttonLabel[status] ||
                        ORDER_STATUS_LABELS[
                          status
                        ]}
                    </button>
                  );
                }
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
