'use client';
import { BackgroundPaths } from "@/app/components/ui/paths";
import { MotionEffect } from "@/app/components/ui/motion-highlight";
import { useEffect, useState, useMemo, useRef } from "react";
import { toast } from 'react-hot-toast';
import { Tabs } from "@/app/components/ui/tabs";
import { Pagination } from "@/app/components/ui/pagination";
import { FaBasketShopping, FaShareNodes, FaUser, FaCamera } from "react-icons/fa6";
import { FaBox, FaBusinessTime, FaDolly, FaLink, FaUserLock } from "react-icons/fa";
import { HorizontalWrapper } from "@/app/components/ui/horizontalWrapper";
import { useUserStore } from "@/app/store/userStore";
import UserAvatar from "@/app/components/ui/userAvatar";
import { AnimatePresence, motion } from "framer-motion";
import { UserShort } from "@/types/store.types";
import { useRoleStore } from "@/app/store/roleStore";
import { UserCrudModal } from "@/app/components/ui/UserCrudModal";
import { useBusinessProfileStore } from "@/app/store/businessProfileStore";

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

const ITEMS_PER_PAGE = 6;
const ITEM_HEIGHT = 52;

export default function AdminDashboard() {
    const { user, selectedUser, setSelectedUser, toggleUserActive, updateUser, deleteUser, fetchUser, uploadAvatar, isLoading, error, avatarVersions } = useUserStore();
    const [activeTab, setActiveTab] = useState('tab1');
    const [currentPage, setCurrentPage] = useState(1);
    const { roles, fetchRoles } = useRoleStore();
    const activeUser: UserShort | null = selectedUser?.[0] ?? null;
    const { businessProfiles, fetchBusinessProfiles } = useBusinessProfileStore();
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const [avatarUploading, setAvatarUploading] = useState(false);

    useEffect(() => {
        if (!user) fetchUser();
        if (!roles) fetchRoles();
        if (!businessProfiles) fetchBusinessProfiles();
    }, [fetchUser, fetchRoles, fetchBusinessProfiles, user, roles, businessProfiles]);

    const totalPages = useMemo(() => Math.ceil((user?.length || 0) / ITEMS_PER_PAGE), [user]);

    const currentUsers = useMemo(() => {
        if (!user) return [];
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return user.slice(start, start + ITEMS_PER_PAGE);
    }, [user, currentPage]);

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        setSelectedUser(null);
        setCurrentPage(1);
    };

    // ─── Загрузка аватара (через стор) ─────────────────────────
    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !activeUser) return;
        setAvatarUploading(true);
        try {
            await uploadAvatar(activeUser._id, file);
            toast.success('Avatar updated successfully');
        } catch (err) {
            console.error('Avatar upload error:', err);
            toast.error(err instanceof Error ? err.message : 'Failed to upload avatar');
        } finally {
            setAvatarUploading(false);
            if (avatarInputRef.current) avatarInputRef.current.value = '';
        }
    };

    const triggerAvatarInput = () => {
        avatarInputRef.current?.click();
    };

    return (
        <div className="relative min-h-screen w-full bg-background text-foreground overflow-hidden flex items-center justify-center">
            <BackgroundPaths className="absolute inset-0 z-0" />

            <div className="relative grid w-[80%] z-10 grid-cols-[auto_1fr_auto] items-center justify-center gap-6 py-10">

                {/* 1. ЛЕВАЯ КОЛОНКА (Табы) */}
                <div className="w-full flex items-center justify-center">
                    <div className="flex flex-col gap-4 bg-background border border-foreground/20 backdrop-blur-2xl rounded-3xl p-6 shadow-2xl w-full">
                        <MotionEffect
                            fade
                            slide={{ direction: "up", offset: 20 }}
                            blur="5px"
                            transition={{ duration: 0.8, ease: "easeOut" }}
                        >
                            <Tabs
                                className="flex flex-col text-xl gap-2 w-full"
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
                                textSize={'lg'}
                                activeTab={activeTab}
                                onTabChange={handleTabChange}
                            />
                        </MotionEffect>
                    </div>
                </div>

                {/* 2. ЦЕНТРАЛЬНАЯ КОЛОНКА (Список пользователей) */}
                <div className="relative flex flex-col bg-background border border-foreground/20 backdrop-blur-2xl rounded-3xl p-8 shadow-2xl w-full min-w-0">
                    <h1 className="text-center text-3xl md:text-4xl font-bold mb-4 w-full truncate">
                        {TAB_TITLES[activeTab]}
                    </h1>

                    <div className="w-full flex items-center justify-center my-6">
                        <div className="w-1/2 flex items-center justify-center">
                            <HorizontalWrapper height={2} width={"50%"} expand />
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        <div
                            className="flex flex-col relative"
                            style={{
                                height: `${ITEM_HEIGHT * ITEMS_PER_PAGE + (ITEMS_PER_PAGE - 1) * 8}px`,
                            }}
                        >
                            {isLoading ? (
                                <p className="text-sm text-muted-foreground text-center py-8 absolute inset-0 flex items-center justify-center">Loading...</p>
                            ) : error ? (
                                <p className="text-sm text-destructive text-center py-8 absolute inset-0 flex items-center justify-center">{error}</p>
                            ) : activeTab === 'tab1' && currentUsers.length > 0 ? (
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={`page-${currentPage}`}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.2 }}
                                        className="flex flex-col gap-2 absolute inset-0"
                                    >
                                        {currentUsers.map((u) => (
                                            <div
                                                key={u._id}
                                                onClick={() => setSelectedUser(activeUser?._id === u._id ? null : u)}
                                                className={`group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer border border-transparent shrink-0 ${
                                                    activeUser?._id === u._id
                                                        ? 'bg-foreground/10 border-foreground/20 shadow-sm'
                                                        : 'hover:bg-foreground/5 hover:border-foreground/10'
                                                }`}
                                                style={{ height: `${ITEM_HEIGHT}px` }}
                                            >
                                                <UserAvatar size="sm" email={u.email} name={u.username ?? `${u.firstName} ${u.lastName}`} avatarVersion={avatarVersions?.[u.email] ?? avatarVersions?.[u._id]} />
                                                <div className="flex flex-col min-w-0 flex-1">
                                                    <span className="text-sm font-semibold truncate text-foreground">
                                                        {u.username ?? `${u.firstName} ${u.lastName}`}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground truncate">
                                                        {u.email}
                                                    </span>
                                                </div>
                                                <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-md border shrink-0 ${
                                                    u.isActive
                                                        ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/10'
                                                        : 'border-slate-500/30 text-slate-500 bg-slate-500/10'
                                                }`}>
                                                    {u.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                        ))}
                                        {Array.from({ length: ITEMS_PER_PAGE - currentUsers.length }).map((_, i) => (
                                            <div key={`empty-${i}`} className="shrink-0 invisible" style={{ height: `${ITEM_HEIGHT}px` }} aria-hidden="true" />
                                        ))}
                                    </motion.div>
                                </AnimatePresence>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center absolute inset-0 flex items-center justify-center">No users found</p>
                            )}
                        </div>

                        {/* Пагинация */}
                        {!isLoading && !error && activeTab === 'tab1' && user && user.length > 0 && (
                            <div className="flex justify-center pt-4 border-t border-foreground/10 mt-4">
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={setCurrentPage}
                                    className="mt-2"
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* 3. ПРАВАЯ КОЛОНКА (Детали пользователя) */}
                <div className="w-[320px]">
                    <AnimatePresence mode="wait">
                        {activeUser ? (
                            <motion.div
                                key="details-panel"
                                initial={{ opacity: 0, x: 20, scale: 0.95 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                exit={{ opacity: 0, x: 20, scale: 0.95 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                                className="flex flex-col gap-5 p-6 bg-background border border-foreground/20 backdrop-blur-2xl rounded-3xl shadow-2xl w-full"
                            >
                                {/* Header */}
                                <div className="flex items-center justify-between border-b border-foreground/10 pb-4">
                                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Details</span>
                                    <button
                                        onClick={() => setSelectedUser(null)}
                                        className="p-1 rounded-full hover:bg-foreground/10 transition-colors text-muted-foreground hover:text-foreground"
                                        aria-label="Close"
                                    >
                                        ✕
                                    </button>
                                </div>

                                {/* Avatar + Info */}
                                <div className="flex flex-col items-center gap-3">
                                    <div className="relative group">
                                        <UserAvatar 
                                            size="lg" 
                                            email={activeUser.email} 
                                            name={activeUser.username ?? `${activeUser.firstName} ${activeUser.lastName}`}
                                            avatarVersion={avatarVersions?.[activeUser.email] ?? avatarVersions?.[activeUser._id]}
                                        />
                                        
                                        {/* Hidden file input */}
                                        <input
                                            ref={avatarInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleAvatarChange}
                                            className="hidden"
                                            id={`avatar-input-${activeUser._id}`}
                                        />
                                        
                                        {/* Overlay button */}
                                        <button
                                            type="button"
                                            onClick={triggerAvatarInput}
                                            disabled={avatarUploading}
                                            className="absolute cursor-pointer inset-0 flex flex-col items-center justify-center gap-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                                            aria-label="Change avatar"
                                        >
                                            {avatarUploading ? (
                                                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <>
                                                    <FaCamera className="w-5 h-5" />
                                                    <span className="text-[10px] font-medium">Change</span>
                                                </>
                                            )}
                                        </button>
                                    </div>

                                    <div className="text-center">
                                        <h3 className="font-bold text-lg leading-tight truncate w-full">
                                            {activeUser.username ?? `${activeUser.firstName} ${activeUser.lastName}`}
                                        </h3>
                                        <p className="text-xs text-muted-foreground mt-1 truncate w-full">
                                            {activeUser.email}
                                        </p>
                                    </div>

                                    {/* Active toggle */}
                                    <div className="flex items-center gap-3">
                                        <span className={`text-xs font-medium ${activeUser.isActive ? 'text-emerald-500' : 'text-slate-500'}`}>
                                            {activeUser.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                        <button
                                            onClick={() => toggleUserActive(activeUser._id)}
                                            className={`relative w-11 h-6 rounded-full border transition-all duration-300 ${
                                                activeUser.isActive
                                                    ? 'bg-emerald-500/20 border-emerald-500/30'
                                                    : 'bg-foreground/5 border-foreground/20'
                                            }`}
                                            aria-label={activeUser.isActive ? 'Deactivate user' : 'Activate user'}
                                        >
                                            <motion.span
                                                layout
                                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                                className={`absolute top-0.5 w-5 h-5 rounded-full ${
                                                    activeUser.isActive ? 'bg-emerald-500 left-5' : 'bg-foreground/30 left-0.5'
                                                }`}
                                            />
                                        </button>
                                    </div>
                                </div>

                                {/* Details list */}
                                <div className="space-y-3 pt-2">
                                    {[
                                        {
                                            label: 'Role',
                                            value: roles?.find(r => r._id === activeUser.roleId)?.name || '—',
                                            badge: true,
                                        },
                                        {
                                            label: 'Business ID',
                                            value: activeUser.businessProfileId || '—',
                                        },
                                        {
                                            label: 'Created',
                                            value: new Date(activeUser.createdAt).toLocaleDateString('ru-RU', {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric',
                                            }),
                                        },
                                        {
                                            label: 'Updated',
                                            value: new Date(activeUser.updatedAt).toLocaleDateString('ru-RU', {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric',
                                            }),
                                        },
                                    ].map(({ label, value, badge }) => (
                                        <div key={label} className="flex items-center justify-between gap-4 py-2.5 border-b border-foreground/5 last:border-0">
                                            <span className="text-xs uppercase text-muted-foreground font-bold tracking-wider shrink-0">
                                                {label}
                                            </span>
                                            {badge ? (
                                                <span className="text-sm px-3 py-1 rounded-lg border border-foreground/20 text-foreground font-medium">
                                                    {value}
                                                </span>
                                            ) : (
                                                <span className="text-sm text-right truncate font-medium" title={value}>
                                                    {value}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Action buttons */}
                                <div className="flex gap-2 pt-2 border-t border-foreground/10">
                                    <button
                                        onClick={() => setIsModalOpen(true)}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-teal-500/20 text-teal-500 cursor-pointer text-sm font-medium hover:bg-foreground/5 transition-colors duration-200"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 3.487a2.25 2.25 0 1 1 3.182 3.182L7.5 19.213l-4.5 1.125 1.125-4.5L16.862 3.487z" />
                                        </svg>
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => deleteUser(activeUser._id)}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-red-500/20 text-red-500 cursor-pointer text-sm font-medium hover:bg-red-500/10 transition-colors duration-200"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                        Delete
                                    </button>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="w-full" />
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Modal: Edit User */}
            {activeUser && (
                <UserCrudModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSubmit={(data) => updateUser(activeUser!._id, data)}
                    mode="edit"
                    initialValues={{
                        username: activeUser?.username,
                        firstName: activeUser?.firstName,
                        lastName: activeUser?.lastName,
                        email: activeUser?.email,
                        roleId: activeUser?.roleId,
                        businessProfileId: activeUser?.businessProfileId,
                    }}
                />
            )}
        </div>
    );
}