"use client";
import { motion } from "framer-motion";
import { Building2, Package, Users, Warehouse } from "lucide-react";

type Stats = { totalWarehouses: number; totalProducts: number; activeUsers: number; totalStock: number; };

const CARDS = [
  { title: "Активные Склады", key: "totalWarehouses", icon: Building2, color: "bg-blue-500" },
  { title: "Товары", key: "totalProducts", icon: Package, color: "bg-emerald-500" },
  { title: "Пользователи", key: "activeUsers", icon: Users, color: "bg-violet-500" },
  { title: "Всего мест", key: "totalStock", icon: Warehouse, color: "bg-amber-500" }, // ✅ Более точная подпись
] as const;

export default function StatsCards({ stats }: { stats: Stats }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {CARDS.map((card, i) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="rounded-xl p-5 shadow-sm border bg-card border-border text-card-foreground hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">{card.title}</span>
              <div className={`p-2 rounded-lg ${card.color} text-white`}><Icon size={18} /></div>
            </div>
            <p className="text-2xl font-bold">{(stats[card.key] ?? 0).toLocaleString("ru-RU")}</p>
          </motion.div>
        );
      })}
    </div>
  );
}