'use client';
import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Pagination } from "@/app/components/ui/pagination";
import UserAvatar from "@/app/components/ui/userAvatar";
import { useUserStore } from "@/app/store/userStore";
import { AccountShort, UserShort } from "@/types/store.types";
import { useAccountStore } from "@/app/store/accountStore";
import Image from "next/image";

const ITEMS_PER_PAGE = 6;
const ITEM_HEIGHT = 52;

export const AccountTable = ({ searchQuery = '' }: { searchQuery?: string }) => {
  const { account, selectedAccount, setSelectedAccount } = useAccountStore();
  const { user, avatarVersions } = useUserStore();
  const activeAccount: AccountShort | null = selectedAccount ?? null;
  const [currentPage, setCurrentPage] = useState(1);

  const userMap = useMemo(() => {
    if (!user) return new Map<string, UserShort>();
    return new Map(user.map((u) => [u._id, u]));
  }, [user]);

  const getUserData = useCallback((userId: string) => {
    const u = userMap.get(userId);
    if (!u) return { name: 'Unknown', email: '', isActive: false };
    const name = u.username || `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Unknown';
    return { name, email: u.email || '', isActive: u.isActive };
  }, [userMap]);

  const filteredAccounts = useMemo(() => {
    if (!account) return [];
    if (!searchQuery.trim()) return account;
    const q = searchQuery.toLowerCase();
    return account.filter(a => {
      const userData = getUserData(a.userId);
      return (
        userData.name.toLowerCase().includes(q) ||
        userData.email.toLowerCase().includes(q)
      );
    });
  }, [account, searchQuery, getUserData]);

  const totalPages = useMemo(
    () => Math.ceil((filteredAccounts.length || 0) / ITEMS_PER_PAGE),
    [filteredAccounts]
  );

  const safePage = Math.min(currentPage, Math.max(1, totalPages));

  const currentAccounts = useMemo(() => {
    const start = (safePage - 1) * ITEMS_PER_PAGE;
    return filteredAccounts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAccounts, safePage]);

  return (
    <div className="w-full flex flex-col gap-4">
      <div
        className="flex flex-col relative"
        style={{ height: `${ITEM_HEIGHT * ITEMS_PER_PAGE + (ITEMS_PER_PAGE - 1) * 8}px` }}
      >
        {currentAccounts.length > 0 ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={`page-${currentPage}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-2 absolute inset-0"
            >
              {currentAccounts.map((acc) => {
                const userData = getUserData(acc.userId);
                const avatarKey = `${acc.userId}-${avatarVersions?.[acc.userId] || 0}`;

                return (
                  <div
                    key={acc._id}
                    onClick={() => setSelectedAccount(activeAccount?._id === acc._id ? null : acc)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer border border-transparent shrink-0 ${activeAccount?._id === acc._id
                      ? 'bg-foreground/10 border-foreground/20'
                      : 'hover:bg-foreground/5 hover:border-foreground/10'
                      }`}
                    style={{ height: `${ITEM_HEIGHT}px` }}
                  >

                    {acc.avatarUrl ? (
                      <div
                        key={`${acc.userId}-avatar-${avatarVersions?.[acc.userId] || 0}`}
                        className="relative w-11 h-11 text-sm rounded-full overflow-hidden"
                      >
                        <Image
                          fill
                          src={(() => {
                            const baseVersion = avatarVersions?.[acc.userId] || 0;
                            if (baseVersion === 0) return acc.avatarUrl;
                            const separator = acc.avatarUrl.includes('?') ? '&' : '?';
                            return `${acc.avatarUrl}${separator}t=${baseVersion}`;
                          })()}
                          alt="Avatar"
                          sizes="44px"
                          className="object-cover"
                          priority={false}
                        />
                      </div>
                    ) : (
                      <UserAvatar
                        key={avatarKey}
                        size="sm"
                        name={userData.name}
                        email={userData.email}
                        fallbackImage={acc.avatarUrl}
                      />
                    )}
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-sm font-semibold truncate">
                        {userData.name}
                      </span>
                      <span className="text-xs text-muted-foreground truncate">
                        {userData.email}
                      </span>
                    </div>

                    <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-md border shrink-0 ${userData.isActive
                      ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/10'
                      : 'border-slate-500/30 text-slate-500 bg-slate-500/10'
                      }`}>
                      {userData.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                );
              })}

              {/* Пустые блоки для сохранения высоты */}
              {Array.from({ length: ITEMS_PER_PAGE - currentAccounts.length }).map((_, i) => (
                <div key={`empty-${i}`} className="shrink-0 invisible" style={{ height: `${ITEM_HEIGHT}px` }} aria-hidden="true" />
              ))}
            </motion.div>
          </AnimatePresence>
        ) : (
          <p className="text-sm text-muted-foreground text-center absolute inset-0 flex items-center justify-center">
            No users found
          </p>
        )}
      </div>

      {filteredAccounts.length > 0 && (
        <div className="flex justify-center pt-4 border-t border-foreground/10">
          <Pagination currentPage={safePage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      )}
    </div >
  );
};