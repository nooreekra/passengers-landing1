"use client";

import React, { useState } from "react";
import { QuestionIcon } from "@/shared/icons";

interface InfoTooltipProps {
  text: string;
  className?: string;
  iconClassName?: string;
  tooltipClassName?: string;
  position?: "top" | "bottom" | "left" | "right";
  bgColor?: "gray" | "blue";
  iconColor?: "gray" | "blue";
}

export default function InfoTooltip({
  text,
  className = "",
  iconClassName = "",
  tooltipClassName = "",
  position = "top",
  bgColor = "gray",
  iconColor = "gray"
}: InfoTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  
  // Проверяем, задана ли ширина в tooltipClassName
  const hasCustomWidth = tooltipClassName.includes('w-[') || tooltipClassName.includes('!w-') || tooltipClassName.includes('w-');
  const tooltipStyle = hasCustomWidth ? {} : { maxWidth: '400px', minWidth: '280px' };

  const getPositionClasses = () => {
    switch (position) {
      case "top":
        return "bottom-full left-1/2 transform -translate-x-1/2 mb-2";
      case "bottom":
        return "top-full left-1/2 transform -translate-x-1/2 mt-2";
      case "left":
        return "right-full top-1/2 transform -translate-y-1/2 mr-2";
      case "right":
        return "left-full top-1/2 transform -translate-y-1/2 ml-2";
      default:
        return "bottom-full left-1/2 transform -translate-x-1/2 mb-2";
    }
  };

  const getArrowClasses = () => {
    const borderColor = bgColor === "blue" ? "border-t-brand-blue" : "border-t-gray-800";
    const borderColorBottom = bgColor === "blue" ? "border-b-brand-blue" : "border-b-gray-800";
    const borderColorLeft = bgColor === "blue" ? "border-l-brand-blue" : "border-l-gray-800";
    const borderColorRight = bgColor === "blue" ? "border-r-brand-blue" : "border-r-gray-800";
    
    switch (position) {
      case "top":
        return `top-full left-1/2 transform -translate-x-1/2 ${borderColor}`;
      case "bottom":
        return `bottom-full left-1/2 transform -translate-x-1/2 ${borderColorBottom}`;
      case "left":
        return `left-full top-1/2 transform -translate-y-1/2 ${borderColorLeft}`;
      case "right":
        return `right-full top-1/2 transform -translate-y-1/2 ${borderColorRight}`;
      default:
        return `top-full left-1/2 transform -translate-x-1/2 ${borderColor}`;
    }
  };

  return (
    <div
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      <QuestionIcon
        className={`h-4 w-4 ${iconColor === "blue" ? "text-brand-blue hover:text-action-primary-hovered" : "text-gray-400 hover:text-gray-600"} transition-colors cursor-help ${iconClassName}`}
      />
      
      {isVisible && (
        <div
          className={`absolute z-[9999] px-3 py-2 text-sm text-white ${bgColor === "blue" ? "bg-brand-blue" : "bg-gray-800"} rounded-lg shadow-lg ${getPositionClasses()} ${tooltipClassName}`}
          style={tooltipStyle}
        >
          <div className="text-center">{text}</div>
          <div
            className={`absolute w-0 h-0 border-4 border-transparent ${getArrowClasses()}`}
          />
        </div>
      )}
    </div>
  );
}
