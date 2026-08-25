// app/store/orderStore.ts
import { CreateOrderInput, OrderShort, OrderStatus, OrderStoreState } from '@/types/store.types';
import { create } from 'zustand';


export const useOrderStore = create<OrderStoreState>((set) => ({
  orders: [],
  selectedOrder: null,
  isLoading: false,
  hasLoaded: false,
  error: null,

  setSelectedOrder: (order) => {
    set({ selectedOrder: order });
  },

  fetchOrders: async () => {
    try {
      set({ isLoading: true, error: null });

      const response = await fetch('/api/orders', {
        method: 'GET',
        cache: 'no-store',
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || result.success === false) {
        throw new Error(result.error || 'Ошибка загрузки заказов');
      }

      const orders: OrderShort[] = Array.isArray(result.data)
        ? result.data
        : [];

      set((state) => {
        const selectedId = state.selectedOrder?._id;
        const selectedOrder = selectedId
          ? orders.find((order) => order._id === selectedId) ?? null
          : null;

        return {
          orders,
          selectedOrder,
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
            : 'Ошибка загрузки заказов',
      });
    }
  },

  createOrder: async (data: CreateOrderInput) => {
    try {
      set({ isLoading: true, error: null });

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || result.success === false) {
        throw new Error(result.error || 'Ошибка оформления заказа');
      }

      const created = result.data as OrderShort;

      set((state) => ({
        orders: [created, ...state.orders],
        selectedOrder: created,
        isLoading: false,
        hasLoaded: true,
        error: null,
      }));

      return { success: true, data: created };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Ошибка оформления заказа';

      set({
        isLoading: false,
        error: message,
      });

      return {
        success: false,
        error: message,
      };
    }
  },

  updateOrderStatus: async (
    orderId: string,
    status: OrderStatus
  ) => {
    try {
      set({ isLoading: true, error: null });

      const response = await fetch(
        `/api/orders/${encodeURIComponent(orderId)}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status }),
        }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok || result.success === false) {
        throw new Error(result.error || 'Ошибка изменения статуса');
      }

      const updated = result.data as OrderShort;

      set((state) => ({
        orders: state.orders.map((order) =>
          order._id === updated._id ? updated : order
        ),
        selectedOrder:
          state.selectedOrder?._id === updated._id
            ? updated
            : state.selectedOrder,
        isLoading: false,
        error: null,
      }));

      return { success: true, data: updated };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Ошибка изменения статуса';

      set({
        isLoading: false,
        error: message,
      });

      return {
        success: false,
        error: message,
      };
    }
  },
}));
