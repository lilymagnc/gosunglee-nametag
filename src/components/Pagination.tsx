import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [30, 50, 100],
}) => {
  if (totalItems === 0) return null;

  const startIdx = Math.min((currentPage - 1) * pageSize + 1, totalItems);
  const endIdx = Math.min(currentPage * pageSize, totalItems);

  // 화면에 표시할 페이지 번호 계산 (최대 5개 노출)
  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxButtons = 5;
    let start = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let end = Math.min(totalPages, start + maxButtons - 1);

    if (end - start + 1 < maxButtons) {
      start = Math.max(1, end - maxButtons + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="bg-slate-50 border-t border-slate-200 px-4 py-3 rounded-b-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
      {/* 1. 항목 카운트 정보 */}
      <div className="font-medium text-slate-500 order-2 sm:order-1 text-center sm:text-left">
        총 <span className="font-bold text-slate-900">{totalItems.toLocaleString()}</span>명 중{' '}
        <span className="font-bold text-sky-700">{startIdx} ~ {endIdx}</span>번째 종친 표시{' '}
        <span className="text-slate-400 font-normal">
          ({currentPage} / {Math.max(1, totalPages)} 페이지)
        </span>
      </div>

      {/* 2. 페이지네이션 버튼 네비게이션 */}
      <div className="flex items-center gap-1 order-1 sm:order-2">
        {/* 처음으로 */}
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-slate-600"
          title="첫 페이지"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>

        {/* 이전 */}
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-slate-600"
          title="이전 페이지"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* 페이지 번호 버튼 목록 */}
        <div className="flex items-center gap-1 mx-1">
          {pageNumbers.map((p) => {
            const isActive = p === currentPage;
            return (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                className={`min-w-[32px] h-8 px-2 rounded-lg font-bold text-xs transition-all ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-xs scale-105'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* 다음 */}
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages || totalPages === 0}
          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-slate-600"
          title="다음 페이지"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* 마지막으로 */}
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages || totalPages === 0}
          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-slate-600"
          title="마지막 페이지"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>

      {/* 3. 페이지당 개수 선택 */}
      <div className="flex items-center gap-2 order-3">
        <span className="text-[11px] text-slate-400 hidden md:inline">페이지당</span>
        <select
          value={pageSize}
          onChange={(e) => {
            onPageSizeChange(Number(e.target.value));
            onPageChange(1);
          }}
          className="px-2.5 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg text-slate-700 focus:ring-2 focus:ring-sky-500 cursor-pointer shadow-2xs"
        >
          {pageSizeOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}개씩 보기
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
