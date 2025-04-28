import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from './Button';

const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  showPrevNext = true,
  showPageNumbers = true,
  maxPageNumbers = 5 
}) => {
  const getVisiblePages = () => {
    const pages = [];
    const start = Math.max(1, currentPage - Math.floor(maxPageNumbers / 2));
    const end = Math.min(totalPages, start + maxPageNumbers - 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-center space-x-2">
      {/* Previous Button */}
      {showPrevNext && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Anterior
        </Button>
      )}

      {/* Page Numbers */}
      {showPageNumbers && (
        <>
          {/* First page */}
          {getVisiblePages()[0] > 1 && (
            <>
              <Button
                variant={1 === currentPage ? 'primary' : 'outline'}
                size="sm"
                onClick={() => onPageChange(1)}
              >
                1
              </Button>
              {getVisiblePages()[0] > 2 && <span className="px-2">...</span>}
            </>
          )}

          {/* Visible page numbers */}
          {getVisiblePages().map((page) => (
            <Button
              key={page}
              variant={page === currentPage ? 'primary' : 'outline'}
              size="sm"
              onClick={() => onPageChange(page)}
            >
              {page}
            </Button>
          ))}

          {/* Last page */}
          {getVisiblePages()[getVisiblePages().length - 1] < totalPages && (
            <>
              {getVisiblePages()[getVisiblePages().length - 1] < totalPages - 1 && (
                <span className="px-2">...</span>
              )}
              <Button
                variant={totalPages === currentPage ? 'primary' : 'outline'}
                size="sm"
                onClick={() => onPageChange(totalPages)}
              >
                {totalPages}
              </Button>
            </>
          )}
        </>
      )}

      {/* Next Button */}
      {showPrevNext && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Próximo
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      )}
    </div>
  );
};

export default Pagination;