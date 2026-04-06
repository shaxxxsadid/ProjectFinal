'use client';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export const Pagination = ({ currentPage, totalPages, onPageChange, className = '' }: PaginationProps) => {
  if (totalPages <= 1) return null;

  return (
    <div className={`flex justify-center items-center gap-2 mt-6 ${className}`}>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-1.5 rounded-md border border-gray-300 text-sm font-medium transition-colors
                   disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 active:bg-gray-200"
      >
        ← Назад
      </button>

      <div className="flex gap-1">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors border
              ${currentPage === page 
                ? 'bg-blue-600 text-white border-blue-600' 
                : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
          >
            {page}
          </button>
        ))}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-1.5 rounded-md border border-gray-300 text-sm font-medium transition-colors
                   disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 active:bg-gray-200"
      >
        Вперёд →
      </button>
    </div>
  );
};