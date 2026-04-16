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
  const [activeTab, setActiveTab] = useState('tab1');

  useEffect(() => {
    if (!user) fetchUser();
    if (!roles) fetchRoles();
    if (!businessProfiles) fetchBusinessProfiles();
  }, [ fetchUser, fetchRoles, fetchBusinessProfiles, user, roles, businessProfiles ]);

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
        <div className="bg-background border border-foreground/20 backdrop-blur-2xl h-[70%] rounded-3xl p-6 shadow-2xl min-w-0">
          <h1 className="text-center text-3xl md:text-4xl font-bold mb-4 truncate">{TAB_TITLES[activeTab]}</h1>
          <div className="flex justify-center my-6"><HorizontalWrapper height={2} width="50%" expand /></div>

          {isLoading && <p className="text-sm text-muted-foreground text-center py-8">Loading...</p>}
          {error && <p className="text-sm text-destructive text-center py-8">{error}</p>}

          {!isLoading && !error && (
            <>
              {activeTab === 'tab1' && <UserTable />}
              {activeTab !== 'tab1' && <p className="text-muted-foreground text-center py-8">Coming soon</p>}
            </>
          )}
        </div>

        {/* 3. ПРАВАЯ КОЛОНКА (Всегда смонтирована, резервирует высоту) */}
        <div className="min-h-90 w-72 shrink-0">
          {activeTab === 'tab1' && <UserDetails />}
        </div>
      </div>
    </div>
  );
}