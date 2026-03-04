import { PulseLoader } from "react-spinners";
import React from "react";
import PlaneIcon from "@/shared/icons/PlaneIcon";

interface LoaderProps {
    text?: string;
    size?: number;
    color?: string;
    textColor?: string;
}

const Loader: React.FC<LoaderProps> = ({
                                           text = "Loading...",
                                           size = 10,
                                           color = "#1D4ED8",
                                           textColor,
                                       }) => {
    return (
        <div className="flex flex-col items-center justify-center gap-4 py-6">
            <div className={`flex items-center gap-2 animate-bounce ${textColor || 'text-blue-600'}`}>
                <PlaneIcon />
                <span className={`text-sm ${textColor || 'text-gray-500'}`}>{text}</span>
            </div>
            <PulseLoader size={size} color={color} />
        </div>
    );
};

export default Loader;
