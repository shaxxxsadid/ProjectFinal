'use client';

import { useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  FaMinus,
  FaPlus,
  FaTrash,
  FaXmark,
  FaCartShopping,
} from 'react-icons/fa6';

import { cn } from '@/lib/utils';
import { useCartStore } from '@/app/store/cartStore';
import { useProductsStore } from '@/app/store/productStore';
import ProductAvatar from '@/app/components/ui/ProductAvatar';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout: () => void;
}

const formatMoney = (value: number) =>
  new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 2,
  }).format(value);

export function CartDrawer({
  isOpen,
  onClose,
  onCheckout,
}: CartDrawerProps) {
  const {
    items,
    increment,
    decrement,
    removeProduct,
    clearCart,
  } = useCartStore();

  const { avatarVersions } = useProductsStore();

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

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener(
        'keydown',
        handleKeyDown
      );
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.button
            type="button"
            aria-label="Закрыть корзину"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-60 cursor-default bg-black/45 backdrop-blur-sm"
          />

          <motion.aside
            initial={{ x: '100%', opacity: 0.8 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0.8 }}
            transition={{
              type: 'spring',
              stiffness: 320,
              damping: 32,
            }}
            className={cn(
              'fixed right-0 top-0 z-70 h-dvh w-full sm:w-120',
              'border-l border-foreground/15 bg-background/95 backdrop-blur-2xl',
              'shadow-2xl flex flex-col'
            )}
          >
            <div className="flex items-center justify-between gap-4 border-b border-foreground/10 px-5 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <FaCartShopping className="text-foreground/70" />
                  <h2 className="text-xl font-semibold">
                    Корзина
                  </h2>
                </div>

                <p className="mt-1 text-xs text-muted-foreground">
                  {totalQuantity > 0
                    ? `${totalQuantity} шт. в корзине`
                    : 'Корзина пуста'}
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Закрыть"
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-foreground/10 bg-foreground/5 transition-colors hover:bg-foreground/10"
              >
                <FaXmark />
              </button>
            </div>

            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-foreground/10 bg-foreground/5">
                  <FaCartShopping className="text-2xl text-foreground/30" />
                </div>

                <div>
                  <p className="font-medium">
                    В корзине пока ничего нет
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Добавьте товары из каталога
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="mt-2 cursor-pointer rounded-xl border border-foreground/15 bg-foreground/5 px-4 py-2 text-sm font-medium transition-colors hover:bg-foreground/10"
                >
                  Вернуться к товарам
                </button>
              </div>
            ) : (
              <>
                <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
                  {items.map((item) => (
                    <div
                      key={item.productId}
                      className="rounded-2xl border border-foreground/10 bg-foreground/5 p-3"
                    >
                      <div className="flex gap-3">
                        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-foreground/5">
                          <ProductAvatar
                            name={item.name}
                            productId={item.productId}
                            size="lg"
                            avatarVersion={
                              avatarVersions[item.productId] ?? 0
                            }
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h3 className="truncate text-sm font-semibold">
                                {item.name}
                              </h3>
                              <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                                SKU: {item.sku || '—'}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                removeProduct(item.productId)
                              }
                              aria-label={`Удалить ${item.name}`}
                              className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-red-500 transition-colors hover:bg-red-500/10"
                            >
                              <FaTrash className="text-xs" />
                            </button>
                          </div>

                          <div className="mt-3 flex items-end justify-between gap-3">
                            <div className="inline-flex items-center overflow-hidden rounded-xl border border-foreground/10 bg-background/40">
                              <button
                                type="button"
                                onClick={() =>
                                  decrement(item.productId)
                                }
                                aria-label="Уменьшить количество"
                                className="flex h-8 w-8 cursor-pointer items-center justify-center transition-colors hover:bg-foreground/10"
                              >
                                <FaMinus className="text-[10px]" />
                              </button>

                              <span className="min-w-9 px-1 text-center font-mono text-sm">
                                {item.quantity}
                              </span>

                              <button
                                type="button"
                                onClick={() =>
                                  increment(item.productId)
                                }
                                aria-label="Увеличить количество"
                                className="flex h-8 w-8 cursor-pointer items-center justify-center transition-colors hover:bg-foreground/10"
                              >
                                <FaPlus className="text-[10px]" />
                              </button>
                            </div>

                            <div className="text-right">
                              <div className="text-[11px] text-muted-foreground">
                                {formatMoney(item.price)} ×{' '}
                                {item.quantity}
                              </div>
                              <div className="mt-0.5 font-semibold">
                                {formatMoney(
                                  item.price * item.quantity
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-foreground/10 bg-background/80 px-5 py-4">
                  <div className="mb-4 flex items-end justify-between gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Товаров
                      </p>
                      <p className="font-mono text-sm">
                        {totalQuantity} шт.
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        Итого
                      </p>
                      <p className="text-xl font-bold">
                        {formatMoney(totalAmount)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-[auto_1fr] gap-2">
                    <button
                      type="button"
                      onClick={clearCart}
                      className="cursor-pointer rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-sm font-medium text-red-500 transition-colors hover:bg-red-500/15"
                    >
                      Очистить
                    </button>

                    <button
                      type="button"
                      onClick={onCheckout}
                      className="cursor-pointer rounded-xl border border-teal-500/20 bg-teal-500/10 px-4 py-2.5 text-sm font-semibold text-teal-600 transition-colors hover:bg-teal-500/20 dark:text-teal-400"
                    >
                      Оформить заказ
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
