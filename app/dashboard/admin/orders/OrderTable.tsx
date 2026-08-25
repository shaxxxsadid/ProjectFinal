'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Pagination } from '@/app/components/ui/pagination';
import { cn } from '@/lib/utils';
import { useOrderStore } from '@/app/store/orderStore';
import {
  FULFILLMENT_METHOD_LABELS,
  ORDER_STATUS_LABELS,
  type OrderShort,
  type OrderStatus,
} from '@/types/store.types';

const ITEMS_PER_PAGE = 6;

const statusClass: Record<OrderStatus, string> = {
  new: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  confirmed: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
  assembling: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  ready_for_pickup: 'bg-teal-500/10 text-teal-500 border-teal-500/20',
  ready_for_shipment: 'bg-teal-500/10 text-teal-500 border-teal-500/20',
  handed_to_carrier: 'bg-violet-500/10 text-violet-500 border-violet-500/20',
  issued: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  cancelled: 'bg-red-500/10 text-red-500 border-red-500/20',
};

interface OrderTableProps {
  searchQuery?: string;
}

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

export const OrderTable = ({
  searchQuery = '',
}: OrderTableProps) => {
  const {
    orders,
    selectedOrder,
    setSelectedOrder,
    isLoading,
    error,
  } = useOrderStore();

  const [page, setPage] = useState(1);

  const filteredOrders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) return orders;

    return orders.filter((order) => {
      const customerName =
        `${order.customer.firstName} ${order.customer.lastName}`.toLowerCase();

      return (
        order.orderNumber.toLowerCase().includes(query) ||
        customerName.includes(query) ||
        order.customer.email.toLowerCase().includes(query) ||
        order.customer.phone.toLowerCase().includes(query) ||
        ORDER_STATUS_LABELS[order.status]
          .toLowerCase()
          .includes(query)
      );
    });
  }, [orders, searchQuery]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredOrders.length / ITEMS_PER_PAGE)
  );

  const safePage = Math.min(page, totalPages);

  const currentOrders = useMemo(() => {
    const start = (safePage - 1) * ITEMS_PER_PAGE;
    return filteredOrders.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredOrders, safePage]);

  if (isLoading && orders.length === 0) {
    return (
      <div className="min-h-134 flex items-center justify-center text-sm text-muted-foreground">
        Загрузка заказов...
      </div>
    );
  }

  if (error && orders.length === 0) {
    return (
      <div className="min-h-134 flex items-center justify-center text-sm text-destructive text-center">
        {error}
      </div>
    );
  }

  if (filteredOrders.length === 0) {
    return (
      <div className="min-h-134 flex items-center justify-center text-sm text-muted-foreground">
        {searchQuery.trim()
          ? 'Заказы по запросу не найдены'
          : 'Заказов пока нет'}
      </div>
    );
  }

  return (
    <div className="w-full min-h-134 flex flex-col justify-between gap-4">
      <div className="space-y-2">
        {currentOrders.map((order: OrderShort, index) => {
          const active =
            selectedOrder?._id === order._id;

          return (
            <motion.button
              key={order._id}
              type="button"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.2,
                delay: index * 0.03,
              }}
              onClick={() => setSelectedOrder(order)}
              className={cn(
                'w-full text-left rounded-2xl border p-3 transition-all cursor-pointer',
                active
                  ? 'bg-foreground/10 border-foreground/25 ring-1 ring-foreground/20'
                  : 'bg-foreground/5 border-foreground/10 hover:bg-foreground/8 hover:border-foreground/20'
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold truncate">
                    {order.orderNumber}
                  </div>
                  <div className="text-xs text-foreground/55 mt-1 truncate">
                    {order.customer.firstName}{' '}
                    {order.customer.lastName} ·{' '}
                    {order.customer.email}
                  </div>
                </div>

                <span
                  className={cn(
                    'shrink-0 rounded-full border px-2 py-1 text-[11px] font-medium',
                    statusClass[order.status]
                  )}
                >
                  {ORDER_STATUS_LABELS[order.status]}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                <div>
                  <div className="text-foreground/40">
                    Получение
                  </div>
                  <div className="font-medium mt-0.5">
                    {
                      FULFILLMENT_METHOD_LABELS[
                        order.fulfillmentMethod
                      ]
                    }
                  </div>
                </div>

                <div>
                  <div className="text-foreground/40">
                    Позиций
                  </div>
                  <div className="font-medium mt-0.5">
                    {order.items.reduce(
                      (sum, item) => sum + item.quantity,
                      0
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-foreground/40">
                    Сумма
                  </div>
                  <div className="font-semibold mt-0.5">
                    {formatMoney(order.totalAmount)}
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-foreground/35 mt-2">
                {formatDate(order.createdAt)}
              </div>
            </motion.button>
          );
        })}
      </div>

      {totalPages > 1 && (
        <Pagination
          currentPage={safePage}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
};
