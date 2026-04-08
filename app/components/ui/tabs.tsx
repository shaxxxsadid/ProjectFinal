// app/components/ui/tabs.tsx
'use client';

import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export const Tabs = ({ tabs, activeTab, onTabChange, className = '' }: TabsProps) => {
  return (
    <div className={cn('', className)}>
      {tabs.map((tab) => (
        <motion.button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          whileTap={{ scale: 0.95 }}
          className={cn(
            'relative px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200',
            activeTab === tab.id
              ? 'text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {activeTab === tab.id && (
            <motion.span
              layoutId="tab-active"
              className="absolute inset-0 rounded-lg -z-10 shadow-lg"
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-2">
            {tab.icon && <span className="w-4 h-4">{tab.icon}</span>}
            {tab.label}
          </span>
        </motion.button>
      ))}
    </div>
  );
};