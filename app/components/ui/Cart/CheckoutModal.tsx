'use client';

import { FormEvent, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  FaArrowLeft,
  FaBoxOpen,
  FaBuilding,
  FaTruck,
  FaXmark,
} from 'react-icons/fa6';
import { toast } from 'react-hot-toast';

import { cn } from '@/lib/utils';
import { useCartStore } from '@/app/store/cartStore';
import { useOrderStore } from '@/app/store/orderStore';
import type {
  FulfillmentMethod,
  OrderShort,
} from '@/types/store.types';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBackToCart?: () => void;
  onSuccess?: (order: OrderShort) => void;
}

const formatMoney = (value: number) =>
  new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 2,
  }).format(value);

export function CheckoutModal({
  isOpen,
  onClose,
  onBackToCart,
  onSuccess,
}: CheckoutModalProps) {
  const { items, clearCart } = useCartStore();
  const { createOrder, isLoading } = useOrderStore();

  const totalQuantity = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + item.quantity,
        0
      ),
    [items]
  );

  const totalAmount = useMemo(
    () =>
      items.reduce(
        (sum, item) =>
          sum + item.price * item.quantity,
        0
      ),
    [items]
  );

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (items.length === 0) {
      toast.error('Корзина пуста');
      return;
    }

    const form = new FormData(event.currentTarget);

    const firstName = String(
      form.get('firstName') ?? ''
    ).trim();
    const lastName = String(
      form.get('lastName') ?? ''
    ).trim();
    const phone = String(
      form.get('phone') ?? ''
    ).trim();
    const email = String(
      form.get('email') ?? ''
    ).trim();
    const comment = String(
      form.get('comment') ?? ''
    ).trim();

    const fulfillmentMethod = String(
      form.get('fulfillmentMethod') ?? 'pickup'
    ) as FulfillmentMethod;

    if (!firstName || !lastName || !phone || !email) {
      toast.error('Заполните имя, фамилию, телефон и email');
      return;
    }

    if (
      fulfillmentMethod !== 'pickup' &&
      fulfillmentMethod !== 'transport_company'
    ) {
      toast.error('Выберите способ получения');
      return;
    }

    const result = await createOrder({
      items: items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
      fulfillmentMethod,
      customer: {
        firstName,
        lastName,
        email,
        phone,
      },
      comment: comment || undefined,
    });

    if (!result.success || !result.data) {
      toast.error(
        result.error || 'Не удалось оформить заказ'
      );
      return;
    }

    const createdOrder = result.data;

    clearCart();
    toast.success(
      `Заказ ${createdOrder.orderNumber} создан`
    );

    onSuccess?.(createdOrder);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.button
            type="button"
            aria-label="Закрыть оформление заказа"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => {
              if (!isLoading) onClose();
            }}
            className="fixed inset-0 z-80 cursor-default bg-black/55 backdrop-blur-sm"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="checkout-title"
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{
              duration: 0.22,
              ease: 'easeOut',
            }}
            className={cn(
              'fixed left-1/2 top-1/2 z-90 w-[calc(100%-2rem)] max-w-3xl',
              '-translate-x-1/2 -translate-y-1/2',
              'max-h-[90vh] overflow-y-auto rounded-3xl border border-foreground/15',
              'bg-background/95 backdrop-blur-2xl shadow-2xl'
            )}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-foreground/10 bg-background/90 px-5 py-4 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                {onBackToCart && (
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={onBackToCart}
                    aria-label="Вернуться в корзину"
                    className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-foreground/10 bg-foreground/5 transition-colors hover:bg-foreground/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <FaArrowLeft />
                  </button>
                )}

                <div>
                  <h2
                    id="checkout-title"
                    className="text-xl font-semibold"
                  >
                    Оформление заказа
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {totalQuantity} шт. ·{' '}
                    {formatMoney(totalAmount)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={isLoading}
                onClick={onClose}
                aria-label="Закрыть"
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-foreground/10 bg-foreground/5 transition-colors hover:bg-foreground/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FaXmark />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="grid gap-6 p-5 md:grid-cols-[1fr_0.85fr]"
            >
              <div className="space-y-5">
                <section>
                  <div className="mb-3 flex items-center gap-2">
                    <FaBuilding className="text-sm text-foreground/55" />
                    <h3 className="font-semibold">
                      Контактные данные
                    </h3>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="space-y-1.5">
                      <span className="text-xs text-muted-foreground">
                        Имя *
                      </span>
                      <input
                        name="firstName"
                        type="text"
                        required
                        autoComplete="given-name"
                        placeholder="Иван"
                        className="w-full rounded-xl border border-foreground/10 bg-foreground/5 px-3 py-2.5 text-sm outline-none transition-colors focus:border-foreground/25"
                      />
                    </label>

                    <label className="space-y-1.5">
                      <span className="text-xs text-muted-foreground">
                        Фамилия *
                      </span>
                      <input
                        name="lastName"
                        type="text"
                        required
                        autoComplete="family-name"
                        placeholder="Иванов"
                        className="w-full rounded-xl border border-foreground/10 bg-foreground/5 px-3 py-2.5 text-sm outline-none transition-colors focus:border-foreground/25"
                      />
                    </label>

                    <label className="space-y-1.5">
                      <span className="text-xs text-muted-foreground">
                        Email *
                      </span>
                      <input
                        name="email"
                        type="email"
                        required
                        autoComplete="email"
                        placeholder="user@example.com"
                        className="w-full rounded-xl border border-foreground/10 bg-foreground/5 px-3 py-2.5 text-sm outline-none transition-colors focus:border-foreground/25"
                      />
                    </label>

                    <label className="space-y-1.5">
                      <span className="text-xs text-muted-foreground">
                        Телефон *
                      </span>
                      <input
                        name="phone"
                        type="tel"
                        required
                        autoComplete="tel"
                        placeholder="+7 999 000-00-00"
                        className="w-full rounded-xl border border-foreground/10 bg-foreground/5 px-3 py-2.5 text-sm outline-none transition-colors focus:border-foreground/25"
                      />
                    </label>
                  </div>
                </section>

                <section>
                  <h3 className="mb-3 font-semibold">
                    Способ получения
                  </h3>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="cursor-pointer">
                      <input
                        className="peer sr-only"
                        type="radio"
                        name="fulfillmentMethod"
                        value="pickup"
                        defaultChecked
                      />

                      <div className="h-full rounded-2xl border border-foreground/10 bg-foreground/5 p-4 transition-all peer-checked:border-teal-500/40 peer-checked:bg-teal-500/10">
                        <div className="flex items-center gap-2 font-medium">
                          <FaBoxOpen />
                          Самовывоз
                        </div>
                        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                          После комплектации заказ получит
                          статус «Готов к самовывозу».
                        </p>
                      </div>
                    </label>

                    <label className="cursor-pointer">
                      <input
                        className="peer sr-only"
                        type="radio"
                        name="fulfillmentMethod"
                        value="transport_company"
                      />

                      <div className="h-full rounded-2xl border border-foreground/10 bg-foreground/5 p-4 transition-all peer-checked:border-teal-500/40 peer-checked:bg-teal-500/10">
                        <div className="flex items-center gap-2 font-medium">
                          <FaTruck />
                          Транспортная компания
                        </div>
                        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                          Система отслеживает заказ до
                          передачи транспортной компании.
                        </p>
                      </div>
                    </label>
                  </div>
                </section>

                <label className="block space-y-1.5">
                  <span className="text-xs text-muted-foreground">
                    Комментарий
                  </span>
                  <textarea
                    name="comment"
                    rows={4}
                    maxLength={2000}
                    placeholder="Дополнительная информация по заказу"
                    className="w-full resize-none rounded-xl border border-foreground/10 bg-foreground/5 px-3 py-2.5 text-sm outline-none transition-colors focus:border-foreground/25"
                  />
                </label>
              </div>

              <aside className="h-fit rounded-2xl border border-foreground/10 bg-foreground/5 p-4">
                <h3 className="font-semibold">
                  Ваш заказ
                </h3>

                <div className="mt-4 max-h-64 space-y-3 overflow-y-auto pr-1">
                  {items.map((item) => (
                    <div
                      key={item.productId}
                      className="flex items-start justify-between gap-3 border-b border-foreground/10 pb-3 last:border-b-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {item.name}
                        </p>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {item.quantity} ×{' '}
                          {formatMoney(item.price)}
                        </p>
                      </div>

                      <p className="shrink-0 text-sm font-semibold">
                        {formatMoney(
                          item.price * item.quantity
                        )}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 space-y-2 border-t border-foreground/10 pt-4">
                  <div className="flex justify-between gap-3 text-sm text-muted-foreground">
                    <span>Количество</span>
                    <span>{totalQuantity} шт.</span>
                  </div>

                  <div className="flex items-end justify-between gap-3">
                    <span className="font-semibold">
                      Итого
                    </span>
                    <span className="text-xl font-bold">
                      {formatMoney(totalAmount)}
                    </span>
                  </div>
                </div>

                <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
                  Итоговая стоимость будет повторно
                  рассчитана сервером по актуальным ценам
                  товаров в базе данных.
                </p>

                <button
                  type="submit"
                  disabled={isLoading || items.length === 0}
                  className="mt-4 w-full cursor-pointer rounded-xl border border-teal-500/20 bg-teal-500/10 px-4 py-3 text-sm font-semibold text-teal-600 transition-colors hover:bg-teal-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:text-teal-400"
                >
                  {isLoading
                    ? 'Оформляем...'
                    : 'Подтвердить заказ'}
                </button>
              </aside>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
