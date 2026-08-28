// app/store/cartStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { ProductShort } from '@/types/store.types';
import type {
  CartActionResult,
  CartStoreState,
} from '@/types/cart.types';

const MAX_CART_QUANTITY = 999;

const normalizeQuantity = (quantity: number): number => {
  if (!Number.isFinite(quantity)) return 1;

  return Math.min(
    MAX_CART_QUANTITY,
    Math.max(1, Math.floor(quantity))
  );
};

export const useCartStore = create<CartStoreState>()(
  persist(
    (set) => ({
      items: [],

      addProduct: (
        product: ProductShort,
        quantity = 1
      ): CartActionResult => {
        const price = Number(product.price);

        if (!Number.isFinite(price) || price < 0) {
          return {
            success: false,
            error: 'У товара не указана корректная цена',
          };
        }

        const productId = String(product._id);
        const normalizedQuantity = normalizeQuantity(quantity);

        set((state) => {
          const existing = state.items.find(
            (item) => item.productId === productId
          );

          if (existing) {
            return {
              items: state.items.map((item) =>
                item.productId === productId
                  ? {
                      ...item,
                      // Одновременно освежаем отображаемые данные товара.
                      name: product.name,
                      sku: product.sku,
                      price,
                      quantity: Math.min(
                        MAX_CART_QUANTITY,
                        item.quantity + normalizedQuantity
                      ),
                    }
                  : item
              ),
            };
          }

          return {
            items: [
              ...state.items,
              {
                productId,
                sku: product.sku,
                name: product.name,
                price,
                quantity: normalizedQuantity,
              },
            ],
          };
        });

        return { success: true };
      },

      removeProduct: (productId) => {
        const id = String(productId);

        set((state) => ({
          items: state.items.filter(
            (item) => item.productId !== id
          ),
        }));
      },

      setQuantity: (productId, quantity) => {
        const id = String(productId);

        // Если пользователь передал 0 или отрицательное значение —
        // удаляем позицию из корзины.
        if (!Number.isFinite(quantity) || quantity <= 0) {
          set((state) => ({
            items: state.items.filter(
              (item) => item.productId !== id
            ),
          }));
          return;
        }

        const normalizedQuantity = normalizeQuantity(quantity);

        set((state) => ({
          items: state.items.map((item) =>
            item.productId === id
              ? { ...item, quantity: normalizedQuantity }
              : item
          ),
        }));
      },

      increment: (productId) => {
        const id = String(productId);

        set((state) => ({
          items: state.items.map((item) =>
            item.productId === id
              ? {
                  ...item,
                  quantity: Math.min(
                    MAX_CART_QUANTITY,
                    item.quantity + 1
                  ),
                }
              : item
          ),
        }));
      },

      decrement: (productId) => {
        const id = String(productId);

        set((state) => ({
          items: state.items.flatMap((item) => {
            if (item.productId !== id) return [item];
            if (item.quantity <= 1) return [];

            return [
              {
                ...item,
                quantity: item.quantity - 1,
              },
            ];
          }),
        }));
      },

      clearCart: () => {
        set({ items: [] });
      },
    }),
    {
      name: 'diplom-cart',
      version: 1,

      // В localStorage сохраняем только данные корзины.
      partialize: (state) => ({
        items: state.items,
      }),
    }
  )
);
