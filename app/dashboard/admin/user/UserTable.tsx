'use client';
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Pagination } from "@/app/components/ui/pagination";
import UserAvatar from "@/app/components/ui/userAvatar";
import { useUserStore } from "@/app/store/userStore";
import { UserShort } from "@/types/store.types";

const ITEMS_PER_PAGE = 6;
const ITEM_HEIGHT = 52;

export const UserTable = ({ searchQuery = '' }: { searchQuery?: string }) => {
  const { user, selectedUser, setSelectedUser, avatarVersions } = useUserStore();
  const activeUser: UserShort | null = selectedUser ?? null;
  const [currentPage, setCurrentPage] = useState(1);

  const filteredUsers = useMemo(() => {
    if (!user) return [];
    if (!searchQuery.trim()) return user;
    const q = searchQuery.toLowerCase();
    return user.filter(u =>
      u.username?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)
    );
  }, [user, searchQuery]);

  const totalPages = useMemo(
    () => Math.ceil((filteredUsers.length || 0) / ITEMS_PER_PAGE),
    [filteredUsers]
  );

  const safePage = Math.min(currentPage, Math.max(1, totalPages));
  const currentUsers = useMemo(() => {
    const start = (safePage - 1) * ITEMS_PER_PAGE;
    return filteredUsers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredUsers, safePage]);

  return (
    <div className="flex flex-col gap-3 h-full">
      <div
        className="flex flex-col relative"
        style={{ height: `${ITEM_HEIGHT * ITEMS_PER_PAGE + (ITEMS_PER_PAGE - 1) * 8}px` }}
      >
        {currentUsers.length > 0 ? (
          <motion.div
            key={`page-${currentPage}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-2 absolute inset-0"
          >
            {currentUsers.map((u, index) => (
              <div
                key={u._id ?? index}
                onClick={() => setSelectedUser(activeUser?._id === u._id ? null : u)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer border border-transparent shrink-0 ${activeUser?._id === u._id ? 'bg-foreground/10 border-foreground/20' : 'hover:bg-foreground/5 hover:border-foreground/10'}`}
                style={{ height: `${ITEM_HEIGHT}px` }}
              >
                <UserAvatar
                  size="sm"
                  email={u.email}
                  name={u.username ?? `${u.firstName} ${u.lastName}`}
                  avatarVersion={avatarVersions?.[u.email] ?? avatarVersions?.[u._id]}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{u.username ?? `${u.firstName} ${u.lastName}`}</p>
                  <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                </div>
                <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-md border shrink-0 ${u.isActive ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/10' : 'border-slate-500/30 text-slate-500 bg-slate-500/10'}`}>
                  {u.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            ))}
            {Array.from({ length: ITEMS_PER_PAGE - currentUsers.length }).map((_, i) => (
              <div key={`empty-${i}`} className="shrink-0 invisible" style={{ height: `${ITEM_HEIGHT}px` }} aria-hidden="true" />
            ))}
          </motion.div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">No users found</p>
        )}
      </div>

      {user && user.length > 0 && (
        <div className="relative flex justify-center items-center pt-4 border-t border-foreground/10">
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      )}
    </div>
  );
};