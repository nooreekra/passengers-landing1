import React from "react";

interface ArrowDownIconProps {
    className?: string;
    stroke?: string;
    strokeWidth?: number;
}

const ArrowDownIcon: React.FC<ArrowDownIconProps> = ({ 
    className = "", 
    stroke = "currentColor", 
    strokeWidth = 2 
}) => {
    return (
        <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <path
                d="M3 6L6 9L9 6"
                stroke={stroke}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default ArrowDownIcon;
