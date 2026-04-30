'use client';
import { useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Pagination } from "@/app/components/ui/pagination";
import UserAvatar from "@/app/components/ui/userAvatar";
import { useUserStore } from "@/app/store/userStore";
import { AccountShort, UserShort } from "@/types/store.types";
import { useAccountStore } from "@/app/store/accountStore";
import Image from "next/image";

const ITEMS_PER_PAGE = 6;
const ITEM_HEIGHT = 52;

interface GroupedUserAccount {
  userId: string;
  accounts: AccountShort[];
  user: UserShort | undefined;
}

export const AccountTable = ({ searchQuery = '' }: { searchQuery?: string }) => {
  const { account, selectedAccount, setSelectedAccount } = useAccountStore();
  const { user, avatarVersions } = useUserStore();

  const [currentPage, setCurrentPage] = useState(1);

  const userMap = useMemo(() => {
    if (!user) return new Map<string, UserShort>();
    return new Map(user.map(u => [u._id, u]));
  }, [user]);

  // 1. Группируем аккаунты по userId
  const groupedAccounts = useMemo<GroupedUserAccount[]>(() => {
    if (!account) return [];
    const map = new Map<string, GroupedUserAccount>();
    for (const acc of account) {
      if (!map.has(acc.userId)) {
        map.set(acc.userId, { userId: acc.userId, accounts: [acc], user: userMap.get(acc.userId) });
      } else {
        map.get(acc.userId)!.accounts.push(acc);
      }
    }
    return Array.from(map.values());
  }, [account, userMap]);

  // 2. Фильтрация групп по имени/почте
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return groupedAccounts;
    const q = searchQuery.toLowerCase();
    return groupedAccounts.filter(g => {
      const u = g.user;
      const name = u?.username || `${u?.firstName || ''} ${u?.lastName || ''}`.trim() || 'Unknown';
      const email = u?.email || '';
      return name.toLowerCase().includes(q) || email.toLowerCase().includes(q);
    });
  }, [groupedAccounts, searchQuery]);

  // 3. Пагинация по сгруппированным данным
  const totalPages = useMemo(() => Math.ceil((filteredGroups.length || 0) / ITEMS_PER_PAGE), [filteredGroups]);
  const safePage = Math.min(currentPage, Math.max(1, totalPages));

  const currentGroups = useMemo(() => {
    const start = (safePage - 1) * ITEMS_PER_PAGE;
    return filteredGroups.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredGroups, safePage]);

  const getUserData = useCallback((group: GroupedUserAccount) => {
    const u = group.user;
    if (!u) return { name: 'Unknown', email: '', isActive: false };
    const name = u.username || `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Unknown';
    return { name, email: u.email || '', isActive: u.isActive };
  }, []);

  return (
    <div className="flex flex-col relative" style={{ height: `${ITEM_HEIGHT * ITEMS_PER_PAGE + (ITEMS_PER_PAGE - 1) * 8}px` }}>
      {currentGroups.length > 0 ? (
        <AnimatePresence mode="wait">
          <motion.div
            key={`page-${safePage}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-2 absolute inset-0"
          >
            {currentGroups.map((group) => {
              const userData = getUserData(group);
              const firstAcc = group.accounts[0];
              const avatarUrl = firstAcc?.avatar;
              const avatarKey = `${group.userId}-${avatarVersions?.[group.userId] || 0}`;

              const handleRowClick = () => {
                // Переключаем выделение: если уже выбран аккаунт из этой группы — снимаем, иначе выделяем первый
                const isAlreadySelected = selectedAccount && group.accounts.some(a => a._id === selectedAccount._id);
                setSelectedAccount(isAlreadySelected ? null : firstAcc);
              };

              return (
                <div
                  key={group.userId}
                  onClick={handleRowClick}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer border border-transparent shrink-0 ${
                    selectedAccount && group.accounts.some(a => a._id === selectedAccount._id)
                      ? 'bg-foreground/10 border-foreground/20'
                      : 'hover:bg-foreground/5 hover:border-foreground/10'
                  }`}
                  style={{ height: `${ITEM_HEIGHT}px` }}
                >
                  {avatarUrl ? (
                    <div className="relative w-11 h-11 rounded-full overflow-hidden">
                      <Image
                        fill
                        src={(() => {
                          const baseVersion = avatarVersions?.[group.userId] || 0;
                          if (baseVersion === 0) return avatarUrl;
                          const sep = avatarUrl.includes('?') ? '&' : '?';
                          return `${avatarUrl}${sep}t=${baseVersion}`;
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
                      fallbackImage={avatarUrl}
                    />
                  )}

                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-sm font-semibold truncate">{userData.name}</span>
                    <span className="text-xs text-muted-foreground truncate">{userData.email}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-bold px-2 py-1 rounded-md border bg-muted/30 border-foreground/10">
                      {group.accounts.length} acc
                    </span>
                    <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-md border shrink-0 ${
                      userData.isActive ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/10' : 'border-slate-500/30 text-slate-500 bg-slate-500/10'
                    }`}>
                      {userData.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              );
            })}

            {Array.from({ length: ITEMS_PER_PAGE - currentGroups.length }).map((_, i) => (
              <div key={`empty-${i}`} className="shrink-0 invisible" style={{ height: `${ITEM_HEIGHT}px` }} aria-hidden="true" />
            ))}
          </motion.div>
        </AnimatePresence>
      ) : (
        <p className="text-sm text-muted-foreground text-center absolute inset-0 flex items-center justify-center">
          No users found
        </p>
      )}

      {filteredGroups.length > 0 && (
        <div className="flex justify-center pt-4 border-t border-foreground/10">
          <Pagination currentPage={safePage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      )}
    </div>
  );
};