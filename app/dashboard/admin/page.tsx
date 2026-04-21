'use client';
import { BackgroundPaths } from "@/app/components/ui/paths";
import { MotionEffect } from "@/app/components/ui/motion-highlight";
import { useEffect, useState, useCallback } from "react";
import { Tabs } from "@/app/components/ui/tabs";
import { FaBasketShopping, FaShareNodes, FaUser } from "react-icons/fa6";
import { FaBox, FaBusinessTime, FaDolly, FaLink, FaUserLock } from "react-icons/fa";
import { HorizontalWrapper } from "@/app/components/ui/horizontalWrapper";
import { useUserStore } from "@/app/store/userStore";
import { useRoleStore } from "@/app/store/roleStore";
import { useBusinessProfileStore } from "@/app/store/businessProfileStore";
import { UserTable } from "./user/UserTable";
import { UserDetails } from "./user/UserDetails";
import { useAccountStore } from "@/app/store/accountStore";
import { useProviderStore } from "@/app/store/providerStore";
import { AccountDetails } from "./account/AccountDetails";
import { AccountTable } from "./account/AccountTable";
import { BusinessTable } from "./business/BusinessTable";
import { BusinessDetails } from "./business/BusinessDetails";
import { ProviderTable } from "./provider/ProviderTable";
import { ProviderDetails } from "./provider/ProviderDetails";
import { RoleTable } from "./role/RoleTable";
import { RoleDetails } from "./role/RoleDetails";
import { ProductGrid } from "./products/ProductsGrid";
import { useProductsStore } from "@/app/store/productStore";
import { cn } from "@/lib/utils";
import { ProductDetails } from "./products/ProductDetails";
import { useStokeStore } from "@/app/store/stokeStore";
import { StockTable } from "./stock/StockTable";
import { StockDetails } from "./stock/StockDetails";
import { useWarehouseStore } from "@/app/store/warehouseStore";
import { WarehouseTable } from "./warehouse/WarehouseTable";
import { WarehouseDetails } from "./warehouse/WarehouseDetails";
import { useDebounce } from "@/app/hooks/debounce";
import { AnimatePresence, motion } from "framer-motion";

const TAB_TITLES: Record<string, string> = {
  tab1: 'User Statistics',
  tab2: 'Account Statistics',
  tab3: 'Business Statistics',
  tab4: 'Provider Statistics',
  tab5: 'Role Statistics',
  tab6: 'Product Statistics',
  tab7: 'Stock Statistics',
  tab8: 'Warehouse Statistics',
};

const TAB_SEARCH_PLACEHOLDER: Record<string, string> = {
  tab1: 'Search users...',
  tab2: 'Search accounts...',
  tab3: 'Search business profiles...',
  tab4: 'Search providers...',
  tab5: 'Search roles...',
  tab6: 'Search products...',
  tab7: 'Search stock...',
  tab8: 'Search warehouses...',
};

export default function AdminDashboard() {
  const { user, fetchUser, isLoading, error } = useUserStore();
  const { roles, fetchRoles } = useRoleStore();
  const { businessProfiles, fetchBusinessProfiles } = useBusinessProfileStore();
  const { account, fetchAccount } = useAccountStore();
  const { providers, fetchProviders } = useProviderStore();
  const { products, fetchProducts, searchProducts } = useProductsStore();
  const { stock, fetchStock } = useStokeStore();
  const { warehouses, fetchWarehouses } = useWarehouseStore();
  const [activeTab, setActiveTab] = useState('tab1');
  const [searchQuery, setSearchQuery] = useState('');
  const debounceSearchQuery = useDebounce(searchQuery, 500);
  useEffect(() => {
    if (!user) fetchUser();
    if (!roles) fetchRoles();
    if (!businessProfiles) fetchBusinessProfiles();
    if (!account) fetchAccount();
    if (!providers) fetchProviders();
    if (products.items.length === 0) fetchProducts();
    if (!stock) fetchStock();
    if (!warehouses) fetchWarehouses();
  }, [fetchUser, fetchRoles, fetchBusinessProfiles, user, roles, businessProfiles, fetchAccount, account, providers, fetchProviders, products.items.length, fetchProducts, fetchStock, stock, fetchWarehouses, warehouses]);

  // Сбрасываем поиск при смене таба
  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    setSearchQuery('');
    if (activeTab === 'tab6') searchProducts('');
  }, [activeTab, searchProducts]);

  // Поиск для продуктов через стор, для остальных — локально
  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (activeTab === 'tab6') searchProducts(q);
  }, [activeTab, searchProducts]);

  const renderContent = () => {
    switch (activeTab) {
      case 'tab1': return <UserTable searchQuery={debounceSearchQuery} />;
      case 'tab2': return <AccountTable searchQuery={debounceSearchQuery} />;
      case 'tab3': return <BusinessTable searchQuery={debounceSearchQuery} />;
      case 'tab4': return <ProviderTable searchQuery={debounceSearchQuery} />;
      case 'tab5': return <RoleTable />;
      case 'tab6': return <ProductGrid />;
      case 'tab7': return <StockTable searchQuery={debounceSearchQuery} />;
      case 'tab8': return <WarehouseTable searchQuery={debounceSearchQuery} />;
      default: return <p className="text-muted-foreground text-center py-8">Coming soon</p>;
    }
  };

  const renderDetails = () => {
    switch (activeTab) {
      case 'tab1': return <UserDetails />;
      case 'tab2': return <AccountDetails />;
      case 'tab3': return <BusinessDetails />;
      case 'tab4': return <ProviderDetails />;
      case 'tab5': return <RoleDetails />;
      case 'tab6': return <ProductDetails />;
      case 'tab7': return <StockDetails />;
      case 'tab8': return <WarehouseDetails />;
      default: return null;
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-background text-foreground overflow-hidden flex items-center justify-center">
      <BackgroundPaths className="absolute text-foreground bg-background inset-0 z-0" />

      <div className="relative grid w-[85%] min-h-screen max-w-7xl z-10 grid-cols-[auto_1fr_auto] items-center justify-center gap-6 py-10">

        {/* 1. ЛЕВАЯ КОЛОНКА */}
        <div className="flex items-start justify-center sticky top-10">
          <div className="flex flex-col gap-4 bg-background border border-foreground/20 backdrop-blur-2xl rounded-3xl p-6 shadow-2xl">
            <MotionEffect fade slide={{ direction: "up", offset: 20 }} blur="5px" transition={{ duration: 0.8, ease: "easeOut" }}>
              <Tabs
                className="flex flex-col gap-2"
                tabs={[
                  { id: 'tab1', label: 'Users', icon: <FaUser /> },
                  { id: 'tab2', label: 'Accounts', icon: <FaLink /> },
                  { id: 'tab3', label: 'Business', icon: <FaBusinessTime /> },
                  { id: 'tab4', label: 'Providers', icon: <FaShareNodes /> },
                  { id: 'tab5', label: 'Roles', icon: <FaUserLock /> },
                  { id: 'tab6', label: 'Products', icon: <FaBasketShopping /> },
                  { id: 'tab7', label: 'Stock', icon: <FaBox /> },
                  { id: 'tab8', label: 'Warehouses', icon: <FaDolly /> },
                ]}
                textSize="lg"
                activeTab={activeTab}
                onTabChange={handleTabChange}
              />
            </MotionEffect>
          </div>
        </div>

        {/* 2. ЦЕНТРАЛЬНАЯ КОЛОНКА */}
        <div className={cn(
          "bg-background border border-foreground/20 backdrop-blur-2xl rounded-3xl p-6  shadow-2xl min-w-0",
          activeTab === 'tab6' ? "h-[80%]" : "h-[70%]"
        )}>
          <h1 className="text-center text-3xl md:text-4xl font-bold mb-4 truncate">
            {TAB_TITLES[activeTab]}
          </h1>
          <div className="flex justify-center my-4">
            <HorizontalWrapper height={2} width="50%" expand />
          </div>

          {/* Поиск */}
          {
            activeTab === 'tab6' || activeTab === 'tab5' ? (
              <></>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="flex mb-3 items-center gap-2 px-4 py-2.5 rounded-2xl border bg-foreground/5 border-foreground/10 focus-within:bg-foreground/8 focus-within:border-foreground/25 transition-all duration-200"
              >
                <svg
                  className="w-4 h-4 text-foreground/30 shrink-0 self-center"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearch}
                  placeholder={TAB_SEARCH_PLACEHOLDER[activeTab]}
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-foreground/25 text-foreground leading-none py-0"
                />
                <AnimatePresence>
                  {searchQuery && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.7 }}
                      transition={{ duration: 0.15 }}
                      onClick={() => { setSearchQuery(''); if (activeTab === 'tab6') searchProducts(''); }}
                      className="w-5 h-5 rounded-full bg-foreground/15 hover:bg-foreground/25 flex items-center justify-center transition-colors shrink-0 self-center cursor-pointer"
                    >
                      <svg
                        className="w-2.5 h-2.5 text-foreground/50"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </motion.button>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          }
          {isLoading && <p className="text-sm text-muted-foreground text-center py-8">Loading...</p>}
          {error && <p className="text-sm text-destructive text-center py-8">{error}</p>}

          {!isLoading && !error && renderContent()}
        </div>

        {/* 3. ПРАВАЯ КОЛОНКА */}
        <div className="min-h-90 w-72 shrink-0">
          {renderDetails()}
        </div>
      </div>
    </div>
  );
}