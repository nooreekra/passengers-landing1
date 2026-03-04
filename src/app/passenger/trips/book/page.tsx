"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftRight, ChevronDown } from "lucide-react";
import { DayPicker } from "react-day-picker";
import Image from "next/image";
import "react-day-picker/dist/style.css";
import { useTranslation } from "react-i18next";

type TripType = "ONE WAY" | "ROUND TRIP";

const BookTripPage = () => {
    const { t } = useTranslation();
    const router = useRouter();
    const [tripType, setTripType] = useState<TripType>("ROUND TRIP");
    const [from, setFrom] = useState({ code: "ALA", name: "Almaty Airport" });
    const [to, setTo] = useState({ code: "ACC", name: "Kotoka International Airport" });
    const [departureDate, setDepartureDate] = useState<Date | undefined>(undefined);
    const [returnDate, setReturnDate] = useState<Date | undefined>(undefined);
    const [activeDateField, setActiveDateField] = useState<"departure" | "return">("departure");
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
    const [showMonthDropdown, setShowMonthDropdown] = useState<{ [key: number]: boolean }>({});

    const formatDate = (date: Date | undefined) => {
        if (!date) return null;
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    };

    const handleDateSelect = (date: Date | undefined) => {
        if (!date) return;
        
        if (activeDateField === "departure") {
            setDepartureDate(date);
            // Если выбрана дата отправления и это Round Trip, переключаемся на дату возврата
            if (tripType === "ROUND TRIP") {
                setActiveDateField("return");
            }
        } else {
            setReturnDate(date);
        }
    };

    const handleSwapAirports = () => {
        const temp = from;
        setFrom(to);
        setTo(temp);
    };

    // Получить выбранную дату для календаря
    const getSelectedDateForCalendar = () => {
        if (activeDateField === "departure") {
            return departureDate;
        } else {
            return returnDate;
        }
    };

    // Минимальная дата - сегодня
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Генерация списка месяцев (на 2 года вперед)
    const getAvailableMonths = () => {
        const months = [];
        const startDate = new Date(today);
        for (let i = 0; i < 24; i++) {
            const date = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
            months.push(date);
        }
        return months;
    };

    const availableMonths = getAvailableMonths();

    // Компонент для выбора месяца с dropdown
    const MonthSelector = ({ month, monthIndex }: { month: Date; monthIndex: number }) => {
        const monthKey = monthIndex;
        const isOpen = showMonthDropdown[monthKey] || false;
        const monthName = month.toLocaleDateString("en-US", { month: "long", year: "numeric" });

        const handleMonthSelect = (selectedMonth: Date) => {
            // Если это первый месяц, устанавливаем его как текущий
            // Второй месяц автоматически обновится
            if (monthIndex === 0) {
                setCurrentMonth(selectedMonth);
            } else {
                // Если это второй месяц, устанавливаем предыдущий месяц
                const prevMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1);
                setCurrentMonth(prevMonth);
            }
            setShowMonthDropdown({ ...showMonthDropdown, [monthKey]: false });
        };

        return (
            <div className="flex justify-center items-center mb-3 relative">
                <button
                    onClick={() => setShowMonthDropdown({ ...showMonthDropdown, [monthKey]: !isOpen })}
                    className="flex items-center gap-2 text-sm font-semibold text-gray-900 hover:text-gray-700"
                >
                    {monthName}
                    <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                    <>
                        <div 
                            className="fixed inset-0 z-10" 
                            onClick={() => setShowMonthDropdown({ ...showMonthDropdown, [monthKey]: false })}
                        />
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white/95 backdrop-blur-sm border border-white/30 rounded-xl shadow-lg z-20 max-h-60 overflow-y-auto w-48">
                            {availableMonths.map((m) => {
                                const monthLabel = m.toLocaleDateString("en-US", { month: "long", year: "numeric" });
                                const isSelected = m.getMonth() === month.getMonth() && 
                                                  m.getFullYear() === month.getFullYear();
                                return (
                                    <button
                                        key={m.getTime()}
                                        onClick={() => handleMonthSelect(m)}
                                        className={`w-full text-left px-4 py-2 text-sm hover:bg-white/40 ${
                                            isSelected ? 'bg-action-primary/20 text-action-primary font-semibold' : 'text-gray-700'
                                        }`}
                                    >
                                        {monthLabel}
                                    </button>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
        );
    };

    return (
        <div className="relative min-h-screen">
            {/* Header */}
            <header className="bg-background-dark px-4 pt-3 pb-3">
                <div className="flex justify-between items-center">
                    <div className="w-12"></div>
                    <h1 className="text-lg font-semibold text-white">{t("passenger.trips.bookAFlight")}</h1>
                    <button
                        onClick={() => router.back()}
                        className="text-white text-sm font-medium"
                    >
                        {t("passenger.trips.cancel")}
                    </button>
                </div>
            </header>

            {/* Фоновое изображение */}
            <div className="absolute inset-0 -z-10">
                <Image
                    src="/images/passengersbg.png"
                    alt="Background"
                    fill
                    className="object-cover"
                    priority
                />
                {/* Затемняющий overlay для читаемости */}
                <div className="absolute inset-0 bg-black/45" />
            </div>

            <div className="relative px-4 pt-4 pb-24">
                <div className="max-w-[600px] mx-auto">
                    {/* Trip Type Selection */}
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 mb-6 border border-white/30">
                    <div className="flex gap-4 border-b border-white/30 pb-2">
                        <button
                            onClick={() => setTripType("ONE WAY")}
                            className={`pb-2 px-2 text-sm font-medium transition-colors ${
                                tripType === "ONE WAY"
                                    ? "text-action-primary border-b-2 border-action-primary"
                                    : "text-gray-600"
                            }`}
                        >
                            {t("passenger.trips.oneWay")}
                        </button>
                        <button
                            onClick={() => setTripType("ROUND TRIP")}
                            className={`pb-2 px-2 text-sm font-medium transition-colors ${
                                tripType === "ROUND TRIP"
                                    ? "text-action-primary border-b-2 border-action-primary"
                                    : "text-gray-600"
                            }`}
                        >
                            {t("passenger.trips.roundTrip")}
                        </button>
                    </div>
                </div>

                {/* From and To Section */}
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 mb-6 border border-white/30">
                    <div className="flex items-center gap-4">
                        {/* FROM */}
                        <div className="flex-1">
                            <label className="text-xs text-gray-500 mb-1 block">{t("passenger.trips.from")}</label>
                            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-white/30">
                                <div className="text-2xl font-bold text-gray-900 mb-1">{from.code}</div>
                                <div className="text-xs text-gray-600">{from.name}</div>
                            </div>
                        </div>

                        {/* Swap Icon */}
                        <button
                            onClick={handleSwapAirports}
                            className="flex-shrink-0 mt-6 bg-white/60 backdrop-blur-sm rounded-full p-2 hover:bg-white/80 transition-colors border border-white/30"
                        >
                            <ArrowLeftRight className="h-5 w-5 text-action-primary" />
                        </button>

                        {/* TO */}
                        <div className="flex-1">
                            <label className="text-xs text-gray-500 mb-1 block">{t("passenger.trips.to")}</label>
                            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-white/30">
                                <div className="text-2xl font-bold text-gray-900 mb-1">{to.code}</div>
                                <div className="text-xs text-gray-600">{to.name}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Date Selection */}
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 mb-6 border border-white/30">
                    <div className="flex gap-4">
                        {/* Departure Date */}
                        <div className="flex-1">
                            <label className="text-xs text-gray-500 mb-1 block">{t("passenger.trips.departureDate")}</label>
                            <button
                                onClick={() => setActiveDateField("departure")}
                                className={`w-full bg-white/60 backdrop-blur-sm rounded-lg p-4 text-left border border-white/30 ${
                                    activeDateField === "departure" ? "ring-2 ring-action-primary" : ""
                                }`}
                            >
                                <span className={departureDate ? "text-gray-900" : "text-action-primary"}>
                                    {formatDate(departureDate) || t("passenger.trips.select")}
                                </span>
                            </button>
                        </div>

                        {/* Return Date - только для Round Trip */}
                        {tripType === "ROUND TRIP" && (
                            <div className="flex-1">
                                <label className="text-xs text-gray-500 mb-1 block">{t("passenger.trips.returnDate")}</label>
                                <button
                                    onClick={() => setActiveDateField("return")}
                                    className={`w-full bg-white/60 backdrop-blur-sm rounded-lg p-4 text-left border border-white/30 ${
                                        activeDateField === "return" ? "ring-2 ring-action-primary" : ""
                                    }`}
                                >
                                    <span className={returnDate ? "text-gray-900" : "text-gray-500"}>
                                        {formatDate(returnDate) || t("passenger.trips.select")}
                                    </span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Calendar - всегда видимый */}
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 mb-6 border border-white/30">
                    <div className="pb-4">
                        <div className="flex flex-col space-y-6 items-center">
                            {/* Первый месяц */}
                            <div className="w-full flex flex-col items-center">
                                <MonthSelector 
                                    month={currentMonth} 
                                    monthIndex={0} 
                                />
                                <div className="flex justify-center w-full">
                                <DayPicker
                                    mode="single"
                                    selected={getSelectedDateForCalendar()}
                                    onSelect={handleDateSelect}
                                    disabled={(date) => date < today}
                                    numberOfMonths={1}
                                    fromDate={today}
                                    month={currentMonth}
                                    onMonthChange={setCurrentMonth}
                                    modifiers={{
                                        departure: departureDate,
                                        return: returnDate
                                    }}
                                    modifiersClassNames={{
                                        departure: 'bg-blue-600 text-white font-bold',
                                        return: 'bg-blue-600 text-white font-bold'
                                    }}
                                    classNames={{
                                        months: 'flex flex-col',
                                        month: 'space-y-3',
                                        caption: 'hidden',
                                        nav: 'hidden',
                                        button: 'hidden',
                                        button_previous: 'hidden',
                                        button_next: 'hidden',
                                        month_caption: 'hidden',
                                        table: 'border-collapse',
                                        head_row: 'flex mb-2',
                                        head_cell: 'text-gray-600 rounded-md w-10 font-normal text-xs py-2',
                                        row: 'flex w-full mt-1',
                                        cell: 'text-center text-sm p-0 relative w-10',
                                        day: 'h-10 w-10 p-0 font-normal rounded-md hover:bg-white/40 text-sm transition-colors text-gray-900',
                                        day_selected: 'bg-blue-600 text-white hover:bg-blue-700 hover:text-white focus:bg-blue-600 focus:text-white font-bold',
                                        day_today: 'bg-white/40 text-gray-900 font-semibold',
                                        day_outside: 'text-gray-500 opacity-50',
                                        day_disabled: 'text-gray-400 cursor-not-allowed opacity-50',
                                        day_hidden: 'invisible',
                                    }}
                                />
                                </div>
                            </div>
                            {/* Второй месяц */}
                            <div className="w-full flex flex-col items-center">
                                <MonthSelector 
                                    month={new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)} 
                                    monthIndex={1} 
                                />
                                <div className="flex justify-center w-full">
                                <DayPicker
                                    mode="single"
                                    selected={getSelectedDateForCalendar()}
                                    onSelect={handleDateSelect}
                                    disabled={(date) => date < today}
                                    numberOfMonths={1}
                                    fromDate={today}
                                    month={new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)}
                                    modifiers={{
                                        departure: departureDate,
                                        return: returnDate
                                    }}
                                    modifiersClassNames={{
                                        departure: 'bg-blue-600 text-white font-bold',
                                        return: 'bg-blue-600 text-white font-bold'
                                    }}
                                    classNames={{
                                        months: 'flex flex-col',
                                        month: 'space-y-3',
                                        caption: 'hidden',
                                        nav: 'hidden',
                                        button: 'hidden',
                                        button_previous: 'hidden',
                                        button_next: 'hidden',
                                        month_caption: 'hidden',
                                        table: 'border-collapse',
                                        head_row: 'flex mb-2',
                                        head_cell: 'text-gray-600 rounded-md w-10 font-normal text-xs py-2',
                                        row: 'flex w-full mt-1',
                                        cell: 'text-center text-sm p-0 relative w-10',
                                        day: 'h-10 w-10 p-0 font-normal rounded-md hover:bg-white/40 text-sm transition-colors text-gray-900',
                                        day_selected: 'bg-blue-600 text-white hover:bg-blue-700 hover:text-white focus:bg-blue-600 focus:text-white font-bold',
                                        day_today: 'bg-white/40 text-gray-900 font-semibold',
                                        day_outside: 'text-gray-500 opacity-50',
                                        day_disabled: 'text-gray-400 cursor-not-allowed opacity-50',
                                        day_hidden: 'invisible',
                                    }}
                                />
                                </div>
                            </div>
                        </div>
                    </div>

                    <button
                        className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold mt-4 hover:bg-blue-700 transition-colors shadow-lg"
                    >
                        {t("passenger.trips.done")}
                    </button>
                </div>
                </div>
            </div>
        </div>
    );
};

export default BookTripPage;

