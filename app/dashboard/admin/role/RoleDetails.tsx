'use client';
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { RoleShort } from "@/types/store.types";
import { useRoleStore } from "@/app/store/roleStore";

const ROLE_COLORS = [
    "bg-violet-500/10 text-violet-400 border-violet-500/20",
    "bg-sky-500/10 text-sky-400 border-sky-500/20",
    "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    "bg-amber-500/10 text-amber-400 border-amber-500/20",
    "bg-rose-500/10 text-rose-400 border-rose-500/20",
    "bg-teal-500/10 text-teal-400 border-teal-500/20",
];

const PRIORITY_META: Record<number, { label: string; color: string }> = {
    1: { label: 'Critical', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
    2: { label: 'High', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
    3: { label: 'Medium', color: 'text-sky-400 bg-sky-500/10 border-sky-500/20' },
    4: { label: 'Low', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
};

export const RoleDetails = () => {
    const { selectedRole, setSelectedRole } = useRoleStore();
    const activeRole: RoleShort | null = selectedRole ?? null;
    const [isModalOpen, setIsModalOpen] = useState(false);

    if (!activeRole) {
        return <div className="w-full h-90 rounded-3xl border border-transparent" />;
    }

    const color = ROLE_COLORS[(activeRole.priority ?? 0) % ROLE_COLORS.length];
    const priorityMeta = PRIORITY_META[activeRole.priority] ?? { label: `P${activeRole.priority}`, color: 'text-foreground/40 bg-foreground/5 border-foreground/10' };

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key="details-panel"
                initial={{ opacity: 0, x: 20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="flex flex-col gap-5 p-6 bg-background border border-foreground/20 backdrop-blur-2xl rounded-3xl shadow-2xl w-full shrink-0 overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-foreground/10 pb-4">
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Details</span>
                    <button
                        onClick={() => setSelectedRole(null)}
                        className="p-1 rounded-full hover:bg-foreground/10 transition-colors text-muted-foreground hover:text-foreground"
                    >✕</button>
                </div>

                {/* Avatar + Name */}
                <div className="flex flex-col items-center gap-3">
                    <div className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold border ${color}`}>
                        {activeRole.name.slice(0, 1).toUpperCase()}
                    </div>

                    <div className="text-center">
                        <h3 className="font-bold text-lg">{activeRole.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-3 leading-relaxed">
                            {activeRole.description}
                        </p>
                    </div>
                </div>

                {/* Info Fields */}
                <div className="space-y-3 pt-2">
                    {[
                        { label: 'Role ID', value: activeRole._id.toString() },
                        { label: 'Role Name', value: activeRole.name },
                        { label: 'Description', value: activeRole.description },
                        { label: 'Priority', value: activeRole.priority?.toString() ?? 'Unknown' },
                        { label: 'Created At', value: new Date(activeRole.createdAt).toLocaleString() },
                        { label: 'Updated At', value: new Date(activeRole.updatedAt).toLocaleString() },
                    ].map(({ label, value }) => (
                        <div key={label} className="flex items-center justify-between gap-4 py-2.5 border-b border-foreground/5 last:border-0">
                            <span className="text-xs uppercase text-muted-foreground font-bold tracking-wider shrink-0">{label}</span>
                            <span className="text-sm text-right truncate font-medium" title={value}>{value}</span>
                        </div>
                    ))}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t border-foreground/10">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-teal-500/20 text-teal-500 text-sm font-medium hover:bg-foreground/5 transition-colors duration-200"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 3.487a2.25 2.25 0 1 1 3.182 3.182L7.5 19.213l-4.5 1.125 1.125-4.5L16.862 3.487z" />
                        </svg>
                        Edit
                    </button>
                    <button
                        onClick={() => { }}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-red-500/20 text-red-500 text-sm font-medium hover:bg-red-500/10 transition-colors duration-200"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Delete
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};