import { AccountShort, AccountStoreState } from "@/types/store.types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAccountStore = create<AccountStoreState>()(
  persist(
    (set) => ({
      account: null,
      
      fetchAccount: async () => {
        try {
          set({ isLoading: true, error: null });
          const res = await fetch('/api/accounts');
          if (!res.ok) throw new Error('Failed to fetch account data');
          const data = await res.json();
          const account = data.data ?? null;
          set({ account, isLoading: false });
        } catch (error) {
          set({ 
            account: null, 
            error: error instanceof Error ? error.message : 'Unknown error', 
            isLoading: false 
          });
        }
      },
      deleteAccount: async (accountId: string) => {
        try {
          set({ isLoading: true, error: null });
          const res = await fetch(`/api/accounts`, { 
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ _id: accountId }), 
          });
          if (!res.ok) throw new Error('Failed to delete account');
          const data = await res.json();
          const account = data.data ?? null;
          set({ account, isLoading: false, selectedAccount: null });
        } catch (error) {
          set({ 
            account: null, 
            error: error instanceof Error ? error.message : 'Unknown error', 
            isLoading: false 
          });
        }
      },
      setSelectedAccount: (account: AccountShort | null) => 
        set({ selectedAccount: account }),
      
      selectedAccount: null,
      isLoading: false,
      error: null,
    }),
    { 
      name: 'accountStore'
    }
  )
);