import React from "react";
import { ArrowUpIcon, ArrowDownIcon } from "@/shared/icons";
import clsx from "clsx";

interface SortableHeaderProps {
    children: React.ReactNode;
    field: string;
    currentSortOrder?: 'asc' | 'desc';
    isSorted: boolean;
    onSort: (field: string, order: 'asc' | 'desc') => void;
    className?: string;
}

const SortableHeader: React.FC<SortableHeaderProps> = ({
    children,
    field,
    currentSortOrder,
    isSorted,
    onSort,
    className
}) => {
    const isAsc = isSorted && currentSortOrder === 'asc';
    const isDesc = isSorted && currentSortOrder === 'desc';

    const handleClick = () => {
        if (isSorted) {
            // Если уже сортируем по этому полю, меняем направление
            onSort(field, currentSortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            // Если новое поле, начинаем с возрастающего порядка
            onSort(field, 'asc');
        }
    };

    return (
        <th 
            className={clsx(
                "px-4 py-3 border border-border-default whitespace-nowrap cursor-pointer select-none hover:bg-gray-50 transition-colors",
                className
            )}
            onClick={handleClick}
        >
            <div className="flex items-center justify-between">
                <span className="body-M-semibold text-label-secondary">
                    {children}
                </span>
                <div className="flex flex-col ml-2">
                    <ArrowUpIcon 
                        className={clsx(
                            "w-3 h-3 transition-colors",
                            isAsc ? "text-blue-600" : isSorted ? "text-gray-500" : "text-gray-400"
                        )}
                    />
                    <ArrowDownIcon 
                        className={clsx(
                            "w-3 h-3 -mt-1 transition-colors",
                            isDesc ? "text-blue-600" : isSorted ? "text-gray-500" : "text-gray-400"
                        )}
                    />
                </div>
            </div>
        </th>
    );
};

export default SortableHeader;
