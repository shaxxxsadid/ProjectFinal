'use client';
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Pagination } from "@/app/components/ui/pagination";
import UserAvatar from "@/app/components/ui/userAvatar";
import { useUserStore } from "@/app/store/userStore";
import { UserShort } from "@/types/store.types";

const ITEMS_PER_PAGE = 6;
const ITEM_HEIGHT = 52;

export const UserTable = () => {
  const { user, selectedUser, setSelectedUser, avatarVersions } = useUserStore();
  const activeUser: UserShort | null = selectedUser ?? null;
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = useMemo(() => Math.ceil((user?.length || 0) / ITEMS_PER_PAGE), [user]);

  const currentUsers = useMemo(() => {
    if (!user) return [];
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return user.slice(start, start + ITEMS_PER_PAGE);
  }, [user, currentPage]);

  return (
    <div className="w-full flex flex-col gap-4">
      <div
        className="flex flex-col relative"
        style={{ height: `${ITEM_HEIGHT * ITEMS_PER_PAGE + (ITEMS_PER_PAGE - 1) * 8}px` }}
      >
        {currentUsers.length > 0 ? (
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
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer border border-transparent shrink-0 ${
                    activeUser?._id === u._id
                      ? 'bg-foreground/10 border-foreground/20'
                      : 'hover:bg-foreground/5 hover:border-foreground/10'
                  }`}
                  style={{ height: `${ITEM_HEIGHT}px` }}
                >
                  <UserAvatar 
                    size="sm" 
                    email={u.email} 
                    name={u.username ?? `${u.firstName} ${u.lastName}`} 
                    avatarVersion={avatarVersions?.[u.email] ?? avatarVersions?.[u._id]}
                  />
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-sm font-semibold truncate">
                      {u.username ?? `${u.firstName} ${u.lastName}`}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">{u.email}</span>
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
              {/* Пустые блоки для сохранения высоты */}
              {Array.from({ length: ITEMS_PER_PAGE - currentUsers.length }).map((_, i) => (
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

      {user && user.length > 0 && (
        <div className="flex justify-center pt-4 border-t border-foreground/10">
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      )}
    </div>
  );
};