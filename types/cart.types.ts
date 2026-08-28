// types/cart.types.ts
import type { ProductShort } from '@/types/store.types';

export interface CartItem {
  productId: string;
  sku: string;
  name: string;
  price: number;
  quantity: number;
}

export interface CartActionResult {
  success: boolean;
  error?: string;
}

export interface CartStoreState {
  items: CartItem[];

  addProduct: (product: ProductShort, quantity?: number) => CartActionResult;
  removeProduct: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  increment: (productId: string) => void;
  decrement: (productId: string) => void;
  clearCart: () => void;
}
