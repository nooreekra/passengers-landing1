"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { ArrowLeftRight, ChevronDown, X, Plane } from "lucide-react";
import { DayPicker } from "react-day-picker";
import Image from "next/image";
import { motion } from "framer-motion";
import "react-day-picker/dist/style.css";
import { useTranslation } from "react-i18next";

type BookingType = "Flights" | "Hotels" | "Services";

type TabType = "my-trips" | "book-trip";

interface Trip {
    id: string;
    type: "Flights" | "Hotels";
    from: string;
    to: string;
    departureDate: Date;
    returnDate?: Date;
    status: "upcoming" | "completed" | "cancelled";
}

const TripsPage = () => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<TabType>("book-trip");

    // Моковые данные поездок
    const trips: Trip[] = [
        {
            id: "1",
            type: "Flights",
            from: "Almaty (ALA)",
            to: "Astana (NQZ)",
            departureDate: new Date(2025, 0, 15), // 15 января 2025
            returnDate: new Date(2025, 0, 20), // 20 января 2025
            status: "upcoming"
        },
        {
            id: "2",
            type: "Flights",
            from: "Almaty (ALA)",
            to: "Moscow (SVO)",
            departureDate: new Date(2024, 11, 10), // 10 декабря 2024
            returnDate: new Date(2024, 11, 18), // 18 декабря 2024
            status: "completed"
        },
        {
            id: "3",
            type: "Hotels",
            from: "Almaty",
            to: "Hotel Kazakhstan",
            departureDate: new Date(2024, 10, 5), // 5 ноября 2024
            returnDate: new Date(2024, 10, 8), // 8 ноября 2024
            status: "completed"
        },
        {
            id: "4",
            type: "Flights",
            from: "Astana (NQZ)",
            to: "Istanbul (IST)",
            departureDate: new Date(2025, 1, 5), // 5 февраля 2025
            status: "upcoming"
        },
        {
            id: "5",
            type: "Flights",
            from: "Almaty (ALA)",
            to: "Dubai (DXB)",
            departureDate: new Date(2024, 9, 20), // 20 октября 2024
            returnDate: new Date(2024, 9, 27), // 27 октября 2024
            status: "completed"
        }
    ];

    const upcomingTripsCount = trips.filter(trip => trip.status === "upcoming").length;
    const [bookingType, setBookingType] = useState<BookingType>("Flights");
    const [from, setFrom] = useState({ code: "ALA", name: "Almaty Airport" });
    const [to, setTo] = useState({ code: "ACC", name: "Kotoka International Airport" });
    const [departureDate, setDepartureDate] = useState<Date | undefined>(undefined);
    const [returnDate, setReturnDate] = useState<Date | undefined>(undefined);
    const [activeDateField, setActiveDateField] = useState<"departure" | "return">("departure");
    const bookTripTabRef = useRef<HTMLButtonElement>(null);
    const myTripsTabRef = useRef<HTMLButtonElement>(null);
    const flightsTabRef = useRef<HTMLButtonElement>(null);
    const hotelsTabRef = useRef<HTMLButtonElement>(null);
    const servicesTabRef = useRef<HTMLButtonElement>(null);

    // Определяем тип поездки для Flights на основе выбранных дат
    const tripType = bookingType === "Flights"
        ? (departureDate && returnDate ? "ROUND TRIP" : "ONE WAY")
        : null;
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
            // Если выбрана дата отправления и это Flights, переключаемся на дату возврата
            if (bookingType === "Flights") {
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
                    className="flex items-center gap-2 text-sm font-semibold text-white hover:text-gray-200"
                >
                    {monthName}
                    <ChevronDown className={`h-4 w-4 transition-transform text-white ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                    <>
                        <div
                            className="fixed inset-0 z-10"
                            onClick={() => setShowMonthDropdown({ ...showMonthDropdown, [monthKey]: false })}
                        />
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.1)] z-20 max-h-60 overflow-y-auto w-48">
                            {availableMonths.map((m) => {
                                const monthLabel = m.toLocaleDateString("en-US", { month: "long", year: "numeric" });
                                const isSelected = m.getMonth() === month.getMonth() &&
                                    m.getFullYear() === month.getFullYear();
                                return (
                                    <button
                                        key={m.getTime()}
                                        onClick={() => handleMonthSelect(m)}
                                        className={`w-full text-left px-4 py-2 text-sm hover:bg-white/20 ${isSelected ? 'bg-blue-500/30 text-blue-400 font-semibold' : 'text-gray-300'
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
            {/* Header с логотипом */}
            <header className="bg-background-dark px-4 pt-3 pb-3">
                <div className="flex justify-between items-center">
                    <Link href="/passenger" className="flex items-center gap-2 cursor-pointer">
                        <Image
                            src="/images/logo.png"
                            alt="IMS Savvy"
                            width={135}
                            height={30}
                            priority
                        />
                    </Link>
                </div>
            </header>

            {/* Book a Trip и My Trips - сразу после хедера */}
            <div className="bg-background-dark px-4 py-2">
                <div className="relative flex justify-center gap-4">
                    <button
                        ref={bookTripTabRef}
                        onClick={() => setActiveTab("book-trip")}
                        className={`flex-1 text-center text-sm font-medium pb-1 ${activeTab === "book-trip"
                                ? "text-blue-600"
                                : "text-white"
                            }`}
                    >
                        {t("passenger.trips.bookATrip")}
                    </button>
                    <button
                        ref={myTripsTabRef}
                        onClick={() => setActiveTab("my-trips")}
                        className={`flex-1 text-center text-sm font-medium pb-1 flex items-center justify-center gap-2 ${activeTab === "my-trips"
                                ? "text-blue-600"
                                : "text-gray-500"
                            }`}
                    >
                        {t("passenger.trips.myTrips")}
                        {upcomingTripsCount > 0 && (
                            <span className="bg-blue-600 text-white text-xs font-semibold w-5 h-5 rounded-full flex items-center justify-center min-w-[20px]">
                                {upcomingTripsCount}
                            </span>
                        )}
                    </button>
                    {/* Анимированный индикатор для главных табов */}
                    <motion.div
                        className="absolute bottom-0 h-0.5 bg-blue-600"
                        initial={false}
                        animate={{
                            left: activeTab === "book-trip"
                                ? bookTripTabRef.current?.offsetLeft || 0
                                : myTripsTabRef.current?.offsetLeft || 0,
                            width: activeTab === "book-trip"
                                ? bookTripTabRef.current?.offsetWidth || 0
                                : myTripsTabRef.current?.offsetWidth || 0,
                        }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                </div>
            </div>

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

            <div className="relative bg-white/10 backdrop-blur-md ">
                <div className="pb-24  max-w-[600px] mx-auto">
                    {/* Контент вкладок */}
                    {activeTab === "my-trips" ? (
                        /* My Trips - История поездок */
                        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/30">
                            {trips.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 gap-4">
                                    <div className="bg-action-primary-light rounded-full p-4">
                                        <Plane className="h-8 w-8 text-action-primary" />
                                    </div>
                                    <div className="text-center">
                                        <h3 className="font-semibold text-lg">{t("passenger.trips.noTripsYet")}</h3>
                                        <p className="text-gray-500 text-sm">
                                            {t("passenger.trips.tripHistoryDescription")}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {trips.map((trip) => {
                                        const isUpcoming = trip.status === "upcoming";
                                        const isCompleted = trip.status === "completed";

                                        return (
                                            <div
                                                key={trip.id}
                                                className={`bg-white/60 backdrop-blur-sm rounded-lg p-4 border ${isUpcoming
                                                        ? "border-action-primary/50"
                                                        : "border-white/30"
                                                    }`}
                                            >
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <Plane className={`h-4 w-4 ${isUpcoming ? "text-action-primary" : "text-gray-400"
                                                                }`} />
                                                            <span className="text-xs font-medium text-gray-500">
                                                                {trip.type}
                                                            </span>
                                                            {isUpcoming && (
                                                                <span className="bg-action-primary/20 text-action-primary text-xs font-semibold px-2 py-0.5 rounded">
                                                                    {t("passenger.trips.upcoming")}
                                                                </span>
                                                            )}
                                                            {isCompleted && (
                                                                <span className="bg-gray-200 text-gray-600 text-xs font-semibold px-2 py-0.5 rounded">
                                                                    {t("passenger.trips.completed")}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-sm font-semibold text-gray-900 mb-1">
                                                            {trip.from} → {trip.to}
                                                        </div>
                                                        <div className="text-xs text-gray-600">
                                                            {formatDate(trip.departureDate)}
                                                            {trip.returnDate && ` - ${formatDate(trip.returnDate)}`}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* Весь контент в одном блоке с фоном */}
                            <div className="">
                                {/* Разделы Flights и Hotels - внутри контента */}
                                <div className="px-4 py-2 bg-background-dark/90">
                                    <div className="relative flex gap-4">
                                        <button
                                            ref={flightsTabRef}
                                            onClick={() => {
                                                setBookingType("Flights");
                                                // Сбрасываем даты при переключении типа бронирования
                                                setDepartureDate(undefined);
                                                setReturnDate(undefined);
                                                setActiveDateField("departure");
                                            }}
                                            className={`text-center text-sm font-medium pb-1 ${bookingType === "Flights"
                                                    ? "text-blue-600"
                                                    : "text-gray-400"
                                                }`}
                                        >
                                            {t("passenger.trips.flights")}
                                        </button>
                                        <button
                                            ref={hotelsTabRef}
                                            onClick={() => {
                                                setBookingType("Hotels");
                                                // Сбрасываем даты при переключении типа бронирования
                                                setDepartureDate(undefined);
                                                setReturnDate(undefined);
                                                setActiveDateField("departure");
                                            }}
                                            className={`text-center text-sm font-medium pb-1 ${bookingType === "Hotels"
                                                    ? "text-blue-600"
                                                    : "text-gray-400"
                                                }`}
                                        >
                                            {t("passenger.trips.hotels")}
                                        </button>
                                        <button
                                            ref={servicesTabRef}
                                            onClick={() => {
                                                setBookingType("Services");
                                                // Сбрасываем даты при переключении типа бронирования
                                                setDepartureDate(undefined);
                                                setReturnDate(undefined);
                                                setActiveDateField("departure");
                                            }}
                                            className={`text-center text-sm font-medium pb-1 ${bookingType === "Services"
                                                    ? "text-blue-600"
                                                    : "text-gray-400"
                                                }`}
                                        >
                                            {t("passenger.trips.services")}
                                        </button>
                                        {/* Анимированный индикатор для подтабов Flights/Hotels/Services */}
                                        <motion.div
                                            className="absolute bottom-0 h-0.5 bg-blue-600"
                                            initial={false}
                                            animate={{
                                                left: bookingType === "Flights"
                                                    ? flightsTabRef.current?.offsetLeft || 0
                                                    : bookingType === "Hotels"
                                                    ? hotelsTabRef.current?.offsetLeft || 0
                                                    : servicesTabRef.current?.offsetLeft || 0,
                                                width: bookingType === "Flights"
                                                    ? flightsTabRef.current?.offsetWidth || 0
                                                    : bookingType === "Hotels"
                                                    ? hotelsTabRef.current?.offsetWidth || 0
                                                    : servicesTabRef.current?.offsetWidth || 0,
                                            }}
                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        />
                                    </div>
                                </div>

                                {/* From and To Section - только для Flights */}
                                {bookingType === "Flights" && (
                                    <div className="px-4 py-2 bg-background-dark/90">
                                        <div className="flex items-center gap-4">
                                            {/* FROM */}
                                            <div className="flex-1">
                                                <label className="text-xs text-gray-300 mb-1 block">{t("passenger.trips.from")}</label>
                                                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                                                    <div className="text-2xl font-bold text-white mb-1">{from.code}</div>
                                                    <div className="text-xs text-gray-300">{from.name}</div>
                                                </div>
                                            </div>

                                            {/* Swap Icon */}
                                            <button
                                                onClick={handleSwapAirports}
                                                className="flex-shrink-0 mt-6 bg-white/10 backdrop-blur-sm rounded-full p-2 hover:bg-white/15 transition-colors border border-white/10"
                                            >
                                                <ArrowLeftRight className="h-5 w-5 text-blue-400" />
                                            </button>

                                            {/* TO */}
                                            <div className="flex-1">
                                                <label className="text-xs text-gray-300 mb-1 block">{t("passenger.trips.to")}</label>
                                                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                                                    <div className="text-2xl font-bold text-white mb-1">{to.code}</div>
                                                    <div className="text-xs text-gray-300">{to.name}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Date Selection */}
                                <div className="px-4 py-2">
                                    <div className="flex gap-4">
                                        {/* Departure Date */}
                                        <div className="flex-1">
                                            <label className="text-xs text-gray-300 mb-1 block">
                                                {bookingType === "Flights" ? t("passenger.trips.departureDate") : bookingType === "Hotels" ? t("passenger.trips.checkIn") : t("passenger.trips.date")}
                                            </label>
                                            <div className="relative">
                                                <button
                                                    onClick={() => setActiveDateField("departure")}
                                                    className={`w-full bg-white/10 backdrop-blur-sm rounded-lg p-4 text-left border border-white/10 pr-10 ${activeDateField === "departure" ? "ring-2 ring-blue-500" : ""
                                                        }`}
                                                >
                                                    <span className={departureDate ? "text-white" : "text-blue-400"}>
                                                        {formatDate(departureDate) || t("passenger.trips.select")}
                                                    </span>
                                                </button>
                                                {departureDate && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setDepartureDate(undefined);
                                                        }}
                                                        className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-white/20 rounded-full transition-colors"
                                                    >
                                                        <X className="h-4 w-4 text-gray-300" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Return Date - показываем для Flights и Hotels */}
                                        <div className="flex-1">
                                            <label className="text-xs text-gray-300 mb-1 block">
                                                {bookingType === "Flights" ? t("passenger.trips.returnDate") : bookingType === "Hotels" ? t("passenger.trips.checkOut") : t("passenger.trips.endDate")}
                                            </label>
                                            <div className="relative">
                                                <button
                                                    onClick={() => setActiveDateField("return")}
                                                    className={`w-full bg-white/10 backdrop-blur-sm rounded-lg p-4 text-left border border-white/10 pr-10 ${activeDateField === "return" ? "ring-2 ring-blue-500" : ""
                                                        }`}
                                                >
                                                    <span className={returnDate ? "text-white" : "text-gray-400"}>
                                                        {formatDate(returnDate) || t("passenger.trips.select")}
                                                    </span>
                                                </button>
                                                {returnDate && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setReturnDate(undefined);
                                                        }}
                                                        className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-white/20 rounded-full transition-colors"
                                                    >
                                                        <X className="h-4 w-4 text-gray-300" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Calendar - всегда видимый */}
                                <div className="py-2 px-4">
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
                                                        head_cell: 'text-gray-300 rounded-md w-10 font-normal text-xs py-2',
                                                        row: 'flex w-full mt-1',
                                                        cell: 'text-center text-sm p-0 relative w-10',
                                                        day: 'h-10 w-10 p-0 font-normal rounded-md hover:bg-white/20 text-sm transition-colors text-white',
                                                        day_selected: 'bg-blue-600 text-white hover:bg-blue-700 hover:text-white focus:bg-blue-600 focus:text-white font-bold',
                                                        day_today: 'bg-white/20 text-white font-semibold',
                                                        day_outside: 'text-gray-400 opacity-50',
                                                        day_disabled: 'text-gray-500 cursor-not-allowed opacity-50',
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
                                                        head_cell: 'text-gray-300 rounded-md w-10 font-normal text-xs py-2',
                                                        row: 'flex w-full mt-1',
                                                        cell: 'text-center text-sm p-0 relative w-10',
                                                        day: 'h-10 w-10 p-0 font-normal rounded-md hover:bg-white/20 text-sm transition-colors text-white',
                                                        day_selected: 'bg-blue-600 text-white hover:bg-blue-700 hover:text-white focus:bg-blue-600 focus:text-white font-bold',
                                                        day_today: 'bg-white/20 text-white font-semibold',
                                                        day_outside: 'text-gray-400 opacity-50',
                                                        day_disabled: 'text-gray-500 cursor-not-allowed opacity-50',
                                                        day_hidden: 'invisible',
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="py-2 px-4 flex justify-center">
                                    <button
                                        className="max-w-[200px] w-full bg-blue-600 text-white py-4 rounded-xl font-semibold mt-4 hover:bg-blue-700 transition-colors shadow-[0_4px_20px_rgba(0,0,0,0.2)]"
                                    >
                                        {t("passenger.trips.done")}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Overlay - Страница в разработке */}
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20 shadow-[0_4px_20px_rgba(0,0,0,0.3)] max-w-md mx-4 text-center">
                    <div className="mb-4">
                        <Plane className="h-16 w-16 text-blue-400 mx-auto animate-pulse" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-3">
                        {t("passenger.trips.inProgress")}
                    </h2>
                    <p className="text-gray-300 text-sm leading-relaxed">
                        {t("passenger.trips.inProgressDescription")}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default TripsPage;



