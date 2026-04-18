'use client';
import { BackgroundPaths } from "@/app/components/ui/paths";
import { MotionEffect } from "@/app/components/ui/motion-highlight";
import { useEffect, useState } from "react";
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

export default function AdminDashboard() {
  const { user, fetchUser, isLoading, error } = useUserStore();
  const { roles, fetchRoles } = useRoleStore();
  const { businessProfiles, fetchBusinessProfiles } = useBusinessProfileStore();
  const { account, fetchAccount } = useAccountStore();
  const { providers, fetchProviders } = useProviderStore();
  const { products, fetchProducts } = useProductsStore();
  const [activeTab, setActiveTab] = useState('tab1');
  useEffect(() => {
    if (!user) fetchUser();
    if (!roles) fetchRoles();
    if (!businessProfiles) fetchBusinessProfiles();
    if (!account) fetchAccount();
    if (!providers) fetchProviders();
    if (products.items.length === 0) fetchProducts();
  }, [fetchUser, fetchRoles, fetchBusinessProfiles, user, roles, businessProfiles, fetchAccount, account, providers, fetchProviders, products.items.length, fetchProducts]);

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
                onTabChange={(tab) => setActiveTab(tab)}
              />
            </MotionEffect>
          </div>
        </div>

        {/* 2. ЦЕНТРАЛЬНАЯ КОЛОНКА */}
        <div className={cn(
          "bg-background border border-foreground/20 backdrop-blur-2xl rounded-3xl p-6 shadow-2xl min-w-0",
          activeTab === 'tab6' ? "h-[80%]" : "h-[70%]"
        )}>
          <h1 className="text-center text-3xl md:text-4xl font-bold mb-4 truncate">{TAB_TITLES[activeTab]}</h1>
          <div className="flex justify-center my-6"><HorizontalWrapper height={2} width="50%" expand /></div>

          {isLoading && <p className="text-sm text-muted-foreground text-center py-8">Loading...</p>}
          {error && <p className="text-sm text-destructive text-center py-8">{error}</p>}

          {!isLoading && !error && (
            <>
              {activeTab === 'tab1' && <UserTable />}
              {activeTab === 'tab2' && <AccountTable />}
              {activeTab === 'tab3' && <BusinessTable />}
              {activeTab === 'tab4' && <ProviderTable />}
              {activeTab === 'tab5' && <RoleTable />}
              {activeTab === 'tab6' && <ProductGrid />}
              {activeTab !== 'tab1' && activeTab !== 'tab2' && activeTab !== 'tab3' && activeTab !== 'tab4' && activeTab !== 'tab5' && activeTab !== 'tab6' && <p className="text-muted-foreground text-center py-8">Coming soon</p>}
            </>
          )}
        </div>

        {/* 3. ПРАВАЯ КОЛОНКА (Всегда смонтирована, резервирует высоту) */}
        <div className="min-h-90 w-72 shrink-0">
          {activeTab === 'tab1' && <UserDetails />}
          {activeTab === 'tab2' && <AccountDetails />}
          {activeTab === 'tab3' && <BusinessDetails />}
          {activeTab === 'tab4' && <ProviderDetails />}
          {activeTab === 'tab5' && <RoleDetails />}


        </div>
      </div>
    </div>
  );
}