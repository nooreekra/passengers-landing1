"use client";

import React from "react";
import clsx from "clsx";

interface PaginationProps {
    total: number;
    limit: number;
    offset: number;
    onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ total, limit, offset, onPageChange }) => {
    const totalPages = Math.ceil(total / limit);
    const currentPage = Math.floor(offset / limit) + 1;

    const handleClick = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            onPageChange((page - 1) * limit);
        }
    };

    const renderPages = () => {
        const pages = [];

        for (let i = 1; i <= totalPages; i++) {
            // Покажем первые 2, последние 2, текущую и соседа
            if (
                i <= 2 ||
                i > totalPages - 2 ||
                Math.abs(i - currentPage) <= 1
            ) {
                pages.push(
                    <button
                        key={i}
                        onClick={() => handleClick(i)}
                        className={clsx(
                            "w-9 h-9 rounded-xl mx-1",
                            currentPage === i ? "bg-blue-600 text-white" : "border border-gray-300 bg-white"
                        )}
                    >
                        {i}
                    </button>
                );
            } else if (
                (i === 3 && currentPage > 4) ||
                (i === totalPages - 2 && currentPage < totalPages - 3)
            ) {
                pages.push(
                    <span key={i} className="mx-1 text-gray-500">
            ...
          </span>
                );
            }
        }

        return pages;
    };

    return (
        <div className="flex mt-6 space-x-4">
            <div className="flex space-x-1">
                {renderPages()}
            </div>
            <div className="flex space-x-1">
                <button
                    className="w-9 h-9 border border-gray-300 rounded-xl disabled:opacity-50"
                    onClick={() => handleClick(currentPage - 1)}
                    disabled={currentPage === 1}
                >
                    {"<"}
                </button>
                <button
                    className="w-9 h-9 border border-gray-300 rounded-xl disabled:opacity-50"
                    onClick={() => handleClick(currentPage + 1)}
                    disabled={currentPage === totalPages}
                >
                    {">"}
                </button>
            </div>
        </div>
    );
};

export default Pagination;
