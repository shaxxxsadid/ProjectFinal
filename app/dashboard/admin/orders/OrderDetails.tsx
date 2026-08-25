'use client';

import { useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { useOrderStore } from '@/app/store/orderStore';
import {
  FULFILLMENT_METHOD_LABELS,
  ORDER_STATUS_LABELS,
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

const buttonLabel: Partial<Record<OrderStatus, string>> = {
  confirmed: 'Подтвердить заказ',
  assembling: 'Начать сборку',
  ready_for_pickup: 'Готов к самовывозу',
  ready_for_shipment: 'Готов к отправке',
  handed_to_carrier: 'Передан транспортной компании',
  issued: 'Заказ выдан',
  cancelled: 'Отменить заказ',
};

export const OrderDetails = () => {
  const {
    selectedOrder,
    updateOrderStatus,
    isLoading,
  } = useOrderStore();

  const nextStatuses = useMemo<OrderStatus[]>(() => {
    if (!selectedOrder) return [];

    switch (selectedOrder.status) {
      case 'new':
        return ['confirmed', 'cancelled'];

      case 'confirmed':
        return ['assembling', 'cancelled'];

      case 'assembling':
        return selectedOrder.fulfillmentMethod === 'pickup'
          ? ['ready_for_pickup', 'cancelled']
          : ['ready_for_shipment', 'cancelled'];

      case 'ready_for_pickup':
        return ['issued', 'cancelled'];

      case 'ready_for_shipment':
        return ['handed_to_carrier', 'cancelled'];

      default:
        return [];
    }
  }, [selectedOrder]);

  if (!selectedOrder) {
    return (
      <div className="h-full min-h-90 rounded-3xl border border-foreground/10 bg-background/70 backdrop-blur-xl p-5 flex items-center justify-center text-center text-sm text-muted-foreground">
        Выберите заказ, чтобы посмотреть подробности
      </div>
    );
  }

  const handleStatus = async (status: OrderStatus) => {
    const result = await updateOrderStatus(
      selectedOrder._id,
      status
    );

    if (result.success) {
      toast.success(
        `Статус: ${ORDER_STATUS_LABELS[status]}`
      );
    } else {
      toast.error(
        result.error || 'Не удалось изменить статус'
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
          {ORDER_STATUS_LABELS[selectedOrder.status]}
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
                selectedOrder.fulfillmentMethod
              ]
            }
          </div>
        </section>

        <section>
          <div className="text-xs uppercase tracking-wide text-foreground/35 mb-2">
            Товары
          </div>

          <div className="space-y-2">
            {selectedOrder.items.map((item) => (
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
                    {formatMoney(item.subtotal)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between mt-3 font-bold">
            <span>Итого</span>
            <span>
              {formatMoney(selectedOrder.totalAmount)}
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
                    {ORDER_STATUS_LABELS[history.status]}
                  </div>
                  <div className="text-[11px] text-foreground/40 mt-0.5">
                    {formatDate(history.changedAt)}
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
              {nextStatuses.map((status) => {
                const isCancel = status === 'cancelled';

                return (
                  <button
                    key={status}
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleStatus(status)}
                    className={
                      isCancel
                        ? 'w-full rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-500/15 disabled:opacity-50 cursor-pointer'
                        : 'w-full rounded-xl border border-teal-500/20 bg-teal-500/10 px-3 py-2 text-sm font-medium text-teal-500 hover:bg-teal-500/15 disabled:opacity-50 cursor-pointer'
                    }
                  >
                    {buttonLabel[status] ||
                      ORDER_STATUS_LABELS[status]}
                  </button>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
