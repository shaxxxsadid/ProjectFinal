'use client';

import { motion } from 'motion/react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export const Pagination = ({ currentPage, totalPages, onPageChange, className = '' }: PaginationProps) => {
  if (totalPages <= 1) return null;

  const getPages = (): (number | '...')[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | '...')[] = [1];
    if (currentPage > 3) pages.push('...');
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
    return pages;
  };

  const btnBase =
    'relative w-9 h-9 flex items-center justify-center text-sm font-mono rounded-lg border transition-all duration-200 outline-none';

  return (
    <div className={`flex items-center gap-1 ${className}`}>

      {/* Назад */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`${btnBase} text-muted-foreground hover:cursor-pointer
                    hover:bg-muted hover:text-foreground hover:border-foreground/20
                    disabled:opacity-30 disabled:cursor-not-allowed`}
        aria-label="Предыдущая страница"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Страницы */}
      {getPages().map((page, i) =>
        page === '...' ? (
          <span key={`dots-${i}`} className="w-9 h-9 flex items-center justify-center text-muted-foreground text-sm select-none">
            ···
          </span>
        ) : (
          <motion.button
            key={page}
            onClick={() => onPageChange(page)}
            whileTap={{ scale: 0.92 }}
            className={`${btnBase}
              ${currentPage === page
                ? 'bg-foreground text-background border-foreground '
                : ' text-muted-foreground hover:bg-muted hover:text-foreground hover:border-foreground/20 hover:cursor-pointer'
              }`}
          >
            {currentPage === page && (
              <motion.span
                layoutId="pagination-active"
                className="absolute inset-0 bg-foreground rounded-lg -z-10"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            {page}
          </motion.button>
        )
      )}

      {/* Вперёд */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`${btnBase} text-muted-foreground hover:cursor-pointer
                    hover:bg-muted hover:text-foreground hover:border-foreground/20
                    disabled:opacity-30 disabled:cursor-not-allowed`}
        aria-label="Следующая страница"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>

    </div>
  );
};