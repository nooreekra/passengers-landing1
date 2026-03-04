import React from "react";
import clsx from "clsx";

type Variant = "primary" | "secondary" | "outline" | "ghost";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    children?: React.ReactNode;
    variant?: Variant;
    loading?: boolean;
};

export const Button = ({
                           children,
                           className = "",
                           variant = "primary",
                           loading = false,
                           ...props
                       }: ButtonProps) => {
    const variantClasses = {
        primary: "bg-blue-600 hover:bg-blue-700 text-white shadow-sm",
        secondary: "bg-gray-100 hover:bg-gray-200 text-gray-800 shadow-sm",
        outline: "border border-border-default text-label-primary shadow-sm",
        ghost: "text-blue-600",
    };

    return (
        <button
            className={clsx(
                "body-M-semibold px-8 py-4 rounded-xl flex justify-center items-center gap-2",
                variantClasses[variant],
                loading && "opacity-50 cursor-not-allowed",
                className
            )}
            disabled={loading || props.disabled}
            {...props}
        >
            {loading ? "Загрузка..." : children}
        </button>
    );
};

export default Button;
