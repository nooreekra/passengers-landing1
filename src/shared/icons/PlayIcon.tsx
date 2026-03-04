import React from "react";

type Props = {
    stroke?: string;
    size?: number;
};

export default function PlayIcon({ stroke = "currentColor", size = 20 }: Props) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 5v14l11-7L8 5z" fill={stroke} />
        </svg>
    );
}











