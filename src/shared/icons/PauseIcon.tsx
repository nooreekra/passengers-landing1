import React from "react";

type Props = {
    stroke?: string;
    size?: number;
};

export default function PauseIcon({ stroke = "currentColor", size = 20 }: Props) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="6" y="5" width="4" height="14" fill={stroke} />
            <rect x="14" y="5" width="4" height="14" fill={stroke} />
        </svg>
    );
}











