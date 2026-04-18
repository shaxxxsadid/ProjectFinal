'use client';
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Pagination } from "@/app/components/ui/pagination";
import { RoleShort } from "@/types/store.types";
import { useRoleStore } from "@/app/store/roleStore";

const ITEMS_PER_PAGE = 6;

// Цвета для бейджей — назначаются по индексу
const ROLE_COLORS = [
    "bg-violet-500/10 text-violet-400 border-violet-500/20",
    "bg-sky-500/10 text-sky-400 border-sky-500/20",
    "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    "bg-amber-500/10 text-amber-400 border-amber-500/20",
    "bg-rose-500/10 text-rose-400 border-rose-500/20",
    "bg-teal-500/10 text-teal-400 border-teal-500/20",
];

export const RoleTable = () => {
    const { roles, selectedRole, setSelectedRole } = useRoleStore();
    const activeRole: RoleShort | null = selectedRole ?? null;
    const [currentPage, setCurrentPage] = useState(1);

    const totalPages = useMemo(
        () => Math.ceil((roles?.length || 0) / ITEMS_PER_PAGE),
        [roles]
    );

    const currentRoles = useMemo(() => {
        if (!roles) return [];
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return roles.slice(start, start + ITEMS_PER_PAGE);
    }, [roles, currentPage]);

    return (
        <div className="w-full justify-between flex flex-col min-h-114 gap-2">
            <div className="flex flex-col gap-2">
                <AnimatePresence mode="popLayout">
                    {currentRoles.map((role, index) => {
                        const isActive = activeRole?._id === role._id;
                        const color = ROLE_COLORS[index % ROLE_COLORS.length];

                        return (
                            <motion.div
                                key={role._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                onClick={() => setSelectedRole(role)}
                                className={`flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer border transition-all duration-200 ${
                                    isActive
                                        ? 'bg-foreground/10 border-foreground/20'
                                        : 'border-transparent hover:bg-foreground/5 hover:border-foreground/10'
                                }`}
                            >
                                {/* Бейдж с первой буквой */}
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border shrink-0 ${color}`}>
                                    {role.name.slice(0, 1).toUpperCase()}
                                </div>

                                {/* Название и описание */}
                                <div className="flex flex-col min-w-0 flex-1">
                                    <span className="font-medium truncate">{role.name}</span>
                                    <span className="text-[11px] font-semibold tracking-widest uppercase text-foreground/35 truncate">
                                        {role.priority != null ? `Priority: ${role.priority}` : 'No priority'}
                                    </span>
                                </div>

                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {totalPages > 1 && (
                <div className="flex justify-center pt-4 border-t border-foreground/10">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                </div>
            )}
        </div>
    );
};