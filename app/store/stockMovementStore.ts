import { create } from 'zustand';

import type {
  StockMovementShort,
  StockMovementStoreState,
} from '@/types/stockMovement.types';

export const useStockMovementStore =
  create<StockMovementStoreState>(
    (set) => ({
      movements: [],
      selectedMovement: null,
      isLoading: false,
      hasLoaded: false,
      error: null,

      setSelectedMovement: (
        movement
      ) => {
        set({
          selectedMovement: movement,
        });
      },

      fetchMovements: async () => {
        try {
          set({
            isLoading: true,
            error: null,
          });

          const response = await fetch(
            '/api/stock-movements?limit=500',
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
                'Ошибка загрузки истории склада'
            );
          }

          const movements:
            StockMovementShort[] =
              Array.isArray(result.data)
                ? result.data
                : [];

          set((state) => {
            const selectedId =
              state.selectedMovement?._id;

            const selectedMovement =
              selectedId
                ? movements.find(
                    (movement) =>
                      movement._id ===
                      selectedId
                  ) ?? null
                : null;

            return {
              movements,
              selectedMovement,
              isLoading: false,
              hasLoaded: true,
              error: null,
            };
          });
        } catch (error) {
          set({
            isLoading: false,
            hasLoaded: true,
            error:
              error instanceof Error
                ? error.message
                : 'Ошибка загрузки истории склада',
          });
        }
      },
    })
  );
