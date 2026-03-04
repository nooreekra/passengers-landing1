"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { DateRange, DayPicker } from "react-day-picker";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import type { Locale} from "date-fns";
import { enUS } from "date-fns/locale";
import clsx from "clsx";
import "react-day-picker/dist/style.css";

type Props = {
    value?: DateRange;
    onChange: (range: DateRange | undefined) => void;
    placeholder?: string;
    resetText?: string;
    applyText?: string;
    cancelText?: string;
    locale?: Locale;
    className?: string;
    buttonClassName?: string;
};

export default function DateRangePicker({
                                            value,
                                            onChange,
                                            placeholder = "Choose date",
                                            resetText = "Reset",
                                            applyText = "Apply",
                                            cancelText = "Cancel",
                                            locale = enUS,
                                            className,
                                            buttonClassName,
                                        }: Props) {
    const [open, setOpen] = useState(false);
    const [draft, setDraft] = useState<DateRange | undefined>(value);
    const ref = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!open) return;
        const h = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, [open]);

    const label = useMemo(() => {
        if (!value?.from) return placeholder;
        if (value.to)
            return `${format(value.from, "MMM dd, yyyy", { locale })} - ${format(value.to, "MMM dd, yyyy", { locale })}`;
        return format(value.from, "MMM dd, yyyy", { locale });
    }, [value, placeholder, locale]);

    const openPicker = () => {
        setDraft(value);
        setOpen((p) => !p);
    };

    return (
        <div className={clsx("relative", className)}>
            <button
                onClick={openPicker}
                className={clsx(
                    "bg-white h-14 flex items-center justify-between border border-border-default rounded-xl px-5 py-4 w-full text-sm shadow-sm",
                    !value?.from && "text-gray-400",
                    buttonClassName
                )}
            >
                <span>{label}</span>
                <CalendarIcon className="ml-2 h-4 w-4 text-gray-400" />
            </button>

            {open && (
                <div
                    ref={ref}
                    className="absolute top-16 z-50 bg-white border border-gray-200 rounded-xl shadow-md p-3 text-[13px] scale-90 md:scale-75 origin-top-left"
                >
                    <DayPicker
                        mode="range"
                        selected={draft}
                        onSelect={(r) => setDraft(r)}
                        numberOfMonths={2}
                        locale={locale}
                        defaultMonth={draft?.from ?? value?.from}
                    />

                    <div className="mt-3 flex items-center justify-between gap-2">
                        <button
                            onClick={() => {
                                setDraft(undefined);
                                onChange(undefined);
                                setOpen(false);
                            }}
                            className="text-sm text-blue-600 px-2 py-1"
                        >
                            {resetText}
                        </button>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => {
                                    setOpen(false);
                                    setDraft(value);
                                }}
                                className="text-sm px-3 py-1 rounded-lg border"
                            >
                                {cancelText}
                            </button>
                            <button
                                onClick={() => {
                                    onChange(draft);
                                    setOpen(false);
                                }}
                                className="text-sm px-3 py-1 rounded-lg bg-label-blue text-white disabled:opacity-50"
                                disabled={!draft?.from || !draft?.to}
                            >
                                {applyText}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
