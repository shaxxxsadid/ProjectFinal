'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  FaBoxOpen,
  FaCalendarDays,
  FaTruck,
  FaXmark,
} from 'react-icons/fa6';

import { cn } from '@/lib/utils';
import {
  FULFILLMENT_METHOD_LABELS,
  ORDER_STATUS_LABELS,
  type OrderShort,
  type OrderStatus,
} from '@/types/store.types';

interface MyOrderDetailModalProps {
  order: OrderShort | null;
  onClose: () => void;
}

const STATUS_CLASS: Record<OrderStatus, string> = {
  new: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  confirmed: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
  assembling: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  ready_for_pickup: 'bg-teal-500/10 text-teal-500 border-teal-500/20',
  ready_for_shipment: 'bg-teal-500/10 text-teal-500 border-teal-500/20',
  handed_to_carrier: 'bg-violet-500/10 text-violet-500 border-violet-500/20',
  issued: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  cancelled: 'bg-red-500/10 text-red-500 border-red-500/20',
};

const formatMoney = (value: number) =>
  new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 2,
  }).format(value);

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));

export function MyOrderDetailModal({
  order,
  onClose,
}: MyOrderDetailModalProps) {
  useEffect(() => {
    if (!order) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [order, onClose]);

  return (
    <AnimatePresence>
      {order && (
        <>
          <motion.button
            type="button"
            aria-label="Закрыть детали заказа"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-80 cursor-default bg-black/55 backdrop-blur-sm"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="my-order-title"
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.98 }}
            transition={{
              duration: 0.22,
              ease: 'easeOut',
            }}
            className={cn(
              'fixed left-1/2 top-1/2 z-90 w-[calc(100%-2rem)] max-w-2xl',
              '-translate-x-1/2 -translate-y-1/2',
              'max-h-[90vh] overflow-y-auto rounded-3xl border border-foreground/15',
              'bg-background/95 shadow-2xl backdrop-blur-2xl'
            )}
          >
            <header className="sticky top-0 z-10 border-b border-foreground/10 bg-background/90 px-5 py-4 backdrop-blur-xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs text-muted-foreground">
                    Заказ
                  </div>

                  <h2
                    id="my-order-title"
                    className="mt-1 text-xl font-bold"
                  >
                    {order.orderNumber}
                  </h2>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        'rounded-full border px-2.5 py-1 text-[11px] font-medium',
                        STATUS_CLASS[order.status]
                      )}
                    >
                      {ORDER_STATUS_LABELS[order.status]}
                    </span>

                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <FaCalendarDays />
                      {formatDate(order.createdAt)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Закрыть"
                  className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-foreground/10 bg-foreground/5 transition-colors hover:bg-foreground/10"
                >
                  <FaXmark />
                </button>
              </div>
            </header>

            <div className="space-y-6 p-5">
              <section>
                <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-foreground/40">
                  Получение
                </div>

                <div className="flex items-start gap-3 rounded-2xl border border-foreground/10 bg-foreground/5 p-4">
                  <div className="mt-0.5 text-foreground/55">
                    {order.fulfillmentMethod ===
                    'transport_company' ? (
                      <FaTruck />
                    ) : (
                      <FaBoxOpen />
                    )}
                  </div>

                  <div>
                    <div className="font-medium">
                      {
                        FULFILLMENT_METHOD_LABELS[
                          order.fulfillmentMethod
                        ]
                      }
                    </div>

                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {order.fulfillmentMethod ===
                      'transport_company'
                        ? 'После передачи транспортной компании дальнейшая доставка выполняется перевозчиком.'
                        : 'После комплектации заказ можно получить в пункте самовывоза.'}
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-foreground/40">
                  Состав заказа
                </div>

                <div className="space-y-2">
                  {order.items.map((item) => (
                    <div
                      key={`${item.productId}-${item.sku}`}
                      className="rounded-2xl border border-foreground/10 bg-foreground/5 p-3.5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="font-medium">
                            {item.name}
                          </div>

                          <div className="mt-1 font-mono text-[11px] text-muted-foreground">
                            SKU: {item.sku || '—'}
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          <div className="font-semibold">
                            {formatMoney(item.subtotal)}
                          </div>

                          <div className="mt-1 text-[11px] text-muted-foreground">
                            {item.quantity} ×{' '}
                            {formatMoney(item.price)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex items-end justify-between gap-4 rounded-2xl border border-foreground/10 bg-foreground/3 p-4">
                  <span className="font-semibold">
                    Итого
                  </span>

                  <span className="text-xl font-bold">
                    {formatMoney(order.totalAmount)}
                  </span>
                </div>
              </section>

              <section>
                <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-foreground/40">
                  Контактные данные
                </div>

                <div className="grid gap-2 rounded-2xl border border-foreground/10 bg-foreground/5 p-4 text-sm sm:grid-cols-2">
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Получатель
                    </div>
                    <div className="mt-1 font-medium">
                      {order.customer.firstName}{' '}
                      {order.customer.lastName}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-muted-foreground">
                      Телефон
                    </div>
                    <div className="mt-1 font-medium">
                      {order.customer.phone}
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <div className="text-xs text-muted-foreground">
                      Email
                    </div>
                    <div className="mt-1 break-all font-medium">
                      {order.customer.email}
                    </div>
                  </div>
                </div>
              </section>

              {order.comment && (
                <section>
                  <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-foreground/40">
                    Комментарий
                  </div>

                  <div className="whitespace-pre-wrap rounded-2xl border border-foreground/10 bg-foreground/5 p-4 text-sm leading-relaxed text-foreground/75">
                    {order.comment}
                  </div>
                </section>
              )}

              <section>
                <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-foreground/40">
                  История статусов
                </div>

                <div className="space-y-0">
                  {order.statusHistory.map(
                    (history, index) => {
                      const isLast =
                        index ===
                        order.statusHistory.length - 1;

                      return (
                        <div
                          key={`${history.status}-${history.changedAt}-${index}`}
                          className="relative flex gap-3"
                        >
                          <div className="flex w-4 flex-col items-center">
                            <div className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-foreground/45" />

                            {!isLast && (
                              <div className="min-h-10 w-px flex-1 bg-foreground/15" />
                            )}
                          </div>

                          <div className="pb-4">
                            <div className="text-sm font-medium">
                              {
                                ORDER_STATUS_LABELS[
                                  history.status
                                ]
                              }
                            </div>

                            <div className="mt-1 text-[11px] text-muted-foreground">
                              {formatDate(history.changedAt)}
                            </div>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </section>

              <div className="rounded-2xl border border-foreground/10 bg-foreground/3 p-4 text-xs leading-relaxed text-muted-foreground">
                Изменение статуса заказа выполняется
                сотрудником компании. Пользовательская
                страница предназначена только для просмотра
                состояния заказа.
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
