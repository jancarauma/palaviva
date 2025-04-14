import React from "react";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onChange: (dir: "prev" | "next") => void;
}

export const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalPages,
  onChange,
}) => (
  <div className="flex justify-between items-center border-t pt-6 border-gray-100 dark:border-gray-700">
    <button
      onClick={() => onChange("prev")}
      disabled={currentPage === 0}
      className="px-6 cursor-pointer py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors disabled:opacity-50"
    >
      Previous Page
    </button>
    <span className="text-sm">
      Page {currentPage + 1} of {totalPages}
    </span>
    <button
      onClick={() => onChange("next")}
      disabled={currentPage === totalPages - 1}
      className="px-6 cursor-pointer py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors disabled:opacity-50"
    >
      Next Page
    </button>
  </div>
);
