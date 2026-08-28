'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FaBoxOpen,
  FaCalendarDays,
  FaCartShopping,
  FaTruck,
} from 'react-icons/fa6';

import { BackgroundPaths } from '@/app/components/ui/paths';
import { cn } from '@/lib/utils';
import { useOrderStore } from '@/app/store/orderStore';
import {
  FULFILLMENT_METHOD_LABELS,
  ORDER_STATUS_LABELS,
  type OrderShort,
  type OrderStatus,
} from '@/types/store.types';
import { MyOrderDetailModal } from '@/app/components/ui/Orders/MyOrderDetailModal';

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

export default function MyOrdersPage() {
  const {
    orders,
    fetchOrders,
    isLoading,
    error,
  } = useOrderStore();

  // ВАЖНО:
  // выбранный заказ пользовательской страницы хранится локально.
  // Admin → Orders использует своё store-состояние selectedOrder,
  // поэтому пользовательская страница от него не зависит.
  const [mySelectedOrder, setMySelectedOrder] =
    useState<OrderShort | null>(null);

  useEffect(() => {
    void fetchOrders();
  }, [fetchOrders]);

  const sortedOrders = useMemo(
    () =>
      [...orders].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
      ),
    [orders]
  );

  const activeCount = useMemo(
    () =>
      orders.filter(
        (order) =>
          order.status !== 'issued' &&
          order.status !== 'handed_to_carrier' &&
          order.status !== 'cancelled'
      ).length,
    [orders]
  );

  const completedCount = useMemo(
    () =>
      orders.filter(
        (order) =>
          order.status === 'issued' ||
          order.status === 'handed_to_carrier'
      ).length,
    [orders]
  );

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background text-foreground">
      <BackgroundPaths className="absolute inset-0 z-0 bg-background text-foreground" />

      <main className="relative z-10 mx-auto w-[92%] max-w-6xl py-10 md:py-14">
        <section className="mb-6 rounded-3xl border border-foreground/15 bg-background/80 p-6 shadow-2xl backdrop-blur-2xl">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                <FaCartShopping />
                Личный кабинет
              </div>

              <h1 className="text-3xl font-bold md:text-4xl">
                Мои заказы
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                Здесь отображаются оформленные вами заказы,
                их состав и текущий этап обработки.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-2xl border border-foreground/10 bg-foreground/5 px-4 py-3">
                <div className="text-xl font-bold">
                  {orders.length}
                </div>
                <div className="mt-1 text-[11px] text-muted-foreground">
                  Всего
                </div>
              </div>

              <div className="rounded-2xl border border-foreground/10 bg-foreground/5 px-4 py-3">
                <div className="text-xl font-bold">
                  {activeCount}
                </div>
                <div className="mt-1 text-[11px] text-muted-foreground">
                  В работе
                </div>
              </div>

              <div className="rounded-2xl border border-foreground/10 bg-foreground/5 px-4 py-3">
                <div className="text-xl font-bold">
                  {completedCount}
                </div>
                <div className="mt-1 text-[11px] text-muted-foreground">
                  Завершено
                </div>
              </div>
            </div>
          </div>
        </section>

        {isLoading && orders.length === 0 ? (
          <div className="rounded-3xl border border-foreground/10 bg-background/75 p-10 text-center text-sm text-muted-foreground backdrop-blur-xl">
            Загрузка заказов...
          </div>
        ) : error && orders.length === 0 ? (
          <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-8 text-center">
            <p className="font-medium text-red-500">
              Не удалось загрузить заказы
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {error}
            </p>

            <button
              type="button"
              onClick={() => void fetchOrders()}
              className="mt-4 cursor-pointer rounded-xl border border-foreground/15 bg-foreground/5 px-4 py-2 text-sm font-medium transition-colors hover:bg-foreground/10"
            >
              Повторить
            </button>
          </div>
        ) : sortedOrders.length === 0 ? (
          <div className="rounded-3xl border border-foreground/10 bg-background/75 p-10 text-center backdrop-blur-xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-foreground/10 bg-foreground/5">
              <FaBoxOpen className="text-2xl text-foreground/30" />
            </div>

            <h2 className="mt-4 text-lg font-semibold">
              Заказов пока нет
            </h2>

            <p className="mt-2 text-sm text-muted-foreground">
              После оформления заказа он появится на этой странице.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {sortedOrders.map((order, index) => {
              const itemCount = order.items.reduce(
                (sum, item) => sum + item.quantity,
                0
              );

              const isTransport =
                order.fulfillmentMethod === 'transport_company';

              return (
                <motion.button
                  key={order._id}
                  type="button"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.22,
                    delay: Math.min(index * 0.035, 0.25),
                  }}
                  onClick={() => setMySelectedOrder(order)}
                  className={cn(
                    'group w-full cursor-pointer rounded-3xl border border-foreground/10',
                    'bg-background/80 p-5 text-left shadow-lg backdrop-blur-xl',
                    'transition-all hover:-translate-y-0.5 hover:border-foreground/20 hover:bg-foreground/4 hover:shadow-xl'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs text-muted-foreground">
                        Заказ
                      </div>
                      <h2 className="mt-1 truncate text-lg font-bold">
                        {order.orderNumber}
                      </h2>
                    </div>

                    <span
                      className={cn(
                        'shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium',
                        STATUS_CLASS[order.status]
                      )}
                    >
                      {ORDER_STATUS_LABELS[order.status]}
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-2xl border border-foreground/8 bg-foreground/5 p-3">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {isTransport ? <FaTruck /> : <FaBoxOpen />}
                        Получение
                      </div>
                      <div className="mt-1.5 font-medium">
                        {
                          FULFILLMENT_METHOD_LABELS[
                            order.fulfillmentMethod
                          ]
                        }
                      </div>
                    </div>

                    <div className="rounded-2xl border border-foreground/8 bg-foreground/5 p-3">
                      <div className="text-xs text-muted-foreground">
                        Товаров
                      </div>
                      <div className="mt-1.5 font-medium">
                        {itemCount} шт.
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-end justify-between gap-3 border-t border-foreground/10 pt-4">
                    <div>
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <FaCalendarDays />
                        {formatDate(order.createdAt)}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[11px] text-muted-foreground">
                        Итого
                      </div>
                      <div className="mt-0.5 text-lg font-bold">
                        {formatMoney(order.totalAmount)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 text-right text-xs font-medium text-teal-600 opacity-70 transition-opacity group-hover:opacity-100 dark:text-teal-400">
                    Подробнее →
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </main>

      <MyOrderDetailModal
        order={mySelectedOrder}
        onClose={() => setMySelectedOrder(null)}
      />
    </div>
  );
}
