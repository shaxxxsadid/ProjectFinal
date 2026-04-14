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
  textSize?: 'sm' | 'md' | 'lg';
}

export const Tabs = ({ tabs, textSize, activeTab, onTabChange, className = '' }: TabsProps) => {
  return (
    <div className={cn('flex flex-col gap-0.5', className)}>
      {tabs.map((tab) => (
        <motion.button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          whileTap={{ scale: 0.98 }}
          whileHover={activeTab !== tab.id ? { x: 4 } : {}}
          className={cn(
            `relative px-4 py-2 text-${textSize || 'md'} font-medium text-left  bg-foreground/0 hover:bg-foreground/20  transition-colors duration-200`,
            activeTab === tab.id
              ? 'text-foreground cursor-default bg-foreground/20 rounded-r-lg'
              : 'text-muted-foreground hover:text-foreground cursor-pointer rounded-lg'
          )}
        >
          {/* hover bg */}
          {activeTab !== tab.id && (
            <span className="absolute inset-0 rounded-lg />" />
          )}

          {activeTab === tab.id && (
            <motion.span
              layoutId="tab-active"
              className='cursor-default'
              style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '2px', backgroundColor: 'var(--foreground)', cursor: 'default' }}
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