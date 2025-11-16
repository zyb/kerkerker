import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  hasMore: boolean;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, hasMore, onPageChange }: PaginationProps) {
  return (
    <div className="flex justify-center items-center gap-2.5 mt-6 pb-6">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
          currentPage === 1
            ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
            : 'bg-gray-800 text-white hover:bg-gray-700'
        }`}
      >
        <ChevronLeft size={16} />
        <span>上一页</span>
      </button>

      <div className="px-5 py-2 bg-blue-600 text-white rounded-lg font-medium">
        第 {currentPage} 页
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!hasMore}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
          !hasMore
            ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
            : 'bg-gray-800 text-white hover:bg-gray-700'
        }`}
      >
        <span>下一页</span>
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
