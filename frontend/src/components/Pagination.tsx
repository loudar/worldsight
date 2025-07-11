import React from 'react';
import { PaginationMeta } from '../types';
import './Pagination.css';

interface PaginationProps {
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
}

/**
 * Pagination component for navigating through pages of data
 */
const Pagination: React.FC<PaginationProps> = ({ pagination, onPageChange }) => {
  const { page, totalPages } = pagination;

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pageNumbers: number[] = [];

    // Always show first page
    pageNumbers.push(1);

    // Show pages around current page
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pageNumbers.push(i);
    }

    // Always show last page if there is more than one page
    if (totalPages > 1) {
      pageNumbers.push(totalPages);
    }

    // Remove duplicates and sort
    return [...new Set(pageNumbers)].sort((a, b) => a - b);
  };

  return (
    <div className="pagination">
      <button 
        onClick={() => onPageChange(page - 1)} 
        disabled={page === 1}
        className="pagination-button"
      >
        Previous
      </button>

      {getPageNumbers().map((pageNum, index, array) => (
        <React.Fragment key={pageNum}>
          {index > 0 && array[index - 1] !== pageNum - 1 && (
            <span className="pagination-ellipsis">...</span>
          )}
          <button
            onClick={() => onPageChange(pageNum)}
            className={`pagination-button ${pageNum === page ? 'active' : ''}`}
          >
            {pageNum}
          </button>
        </React.Fragment>
      ))}

      <button 
        onClick={() => onPageChange(page + 1)} 
        disabled={page === totalPages}
        className="pagination-button"
      >
        Next
      </button>
    </div>
  );
};

export default Pagination;
