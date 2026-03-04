import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { BookingSegment } from "@/features/promo/model/types";
import { splitCamelCase } from "./formatting";
import { getBookingSegments } from "@/features/promo/api/promos";

export function exportSegmentsToExcel(segments: BookingSegment[], fileName: string, isAirline: boolean = false) {
    const baseData: Record<string, string> = {
        "AIN Numbers": "",
        "Target Audience": "",
        "Travel Agent Name": "",
        "Travel Agency": "",
        "IATA Validator": "",
        "Passenger Name": "",
        "PNR Number": "",
        "Booking Date": "",
        "Airline Code": "",
        "Flight Number": "",
        "Travel Date": "",
        "Origin & Destination": "",
        "Status": "",
        "Booking Class": "",
        "RBD": "",
        "Fare Family": "",
        "IATA Number": "",
        "Ticket Number": "",
        "Fare": "",
        "Taxes": "",
        "Ancillary Type": "-",
        "Ancillary Revenue": "-",
        "Reward Types": "",
        "Reward Amounts": "",
        "Segments Total": "",
        "Individual Target": ""
    };

    // Добавляем IMS Fees только для авиакомпаний
    if (isAirline) {
        baseData["IMS Fees"] = "";
    }

    const data = segments.map((item) => {
        const itemData = { ...baseData };
        
        itemData["AIN Numbers"] = item.ainNumbers?.map((a) => a.value).join(", ") || "-";
        itemData["Target Audience"] = item.targetAudiences?.map(aud => {
            // Используем локализацию для TravelAgency и TravelAgent
            if (aud === "TravelAgency") return "Travel Agency";
            if (aud === "TravelAgent") return "Travel Agent";
            return splitCamelCase(aud);
        }).join(", ") || "-";
        itemData["Travel Agent Name"] = item.travelAgentName || "-";
        itemData["Travel Agency"] = item.travelAgency || "-";
        itemData["IATA Validator"] = item.iataValidator || "-";
        itemData["Passenger Name"] = item.passengerName || "-";
        itemData["PNR Number"] = item.pnrNumber || "-";
        itemData["Booking Date"] = item.bookingDate || "-";
        itemData["Airline Code"] = item.airlineCode || "-";
        itemData["Flight Number"] = item.flightNumber || "-";
        itemData["Travel Date"] = item.travelDate || "-";
        itemData["Origin & Destination"] = item.origin && item.destination ? `${item.origin} – ${item.destination}` : "-";
        itemData["Status"] = item.status || "-";
        itemData["Booking Class"] = item.bookingClass || "-";
        itemData["RBD"] = item.rbd || "-";
        itemData["Fare Family"] = item.fareFamily || "-";
        itemData["IATA Number"] = item.iataNumber || "-";
        itemData["Ticket Number"] = item.ticketNumber || "-";
        itemData["Fare"] = item.fare ? `${item.currencyCode || ""} ${Number(item.fare).toLocaleString()}` : "-";
        itemData["Taxes"] = item.taxes ? `${item.currencyCode || ""} ${Number(item.taxes).toLocaleString()}` : "-";
        itemData["Reward Types"] = item.rewardTypes?.map((r) => splitCamelCase(r.rewardType)).join(", ") || "-";
        itemData["Reward Amounts"] = item.rewardAmounts?.map((r) => `${item.currencyCode || ""} ${Number(r.value).toLocaleString()}`).join(", ") || "-";
        itemData["Segments Total"] = item.segments ? `${item.segments.booked} booked / ${item.segments.flown} flown` : "-";
        itemData["Individual Target"] = item.individualTarget?.toString() || "-";
        
        if (isAirline) {
            itemData["IMS Fees"] = item.imsFees ? `${item.currencyCode || ""} ${Number(item.imsFees).toLocaleString()}` : "-";
        }

        return itemData;
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Booking Segments");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });

    saveAs(blob, `${fileName}.xlsx`);
}

export async function exportAllSegmentsToExcel(
    promoId: string,
    fileName: string,
    isAirline: boolean = false,
    searchQuery?: string,
    bookingFrom?: string,
    bookingTo?: string,
    sortBy?: string
): Promise<void> {
    try {
        // Загружаем все сегменты без лимитов
        const allSegments: BookingSegment[] = [];
        let offset = 0;
        const limit = 5000; // Большой лимит для получения максимального количества записей за раз
        let hasMore = true;

        while (hasMore) {
            const response = await getBookingSegments(
                promoId,
                searchQuery,
                bookingFrom,
                bookingTo,
                offset,
                limit,
                sortBy
            );

            const segments = response.items || [];
            allSegments.push(...segments);

            // Если получили меньше записей чем лимит, значит это последняя страница
            hasMore = segments.length === limit;
            offset += segments.length;

            // Защита от бесконечного цикла
            if (offset > 100000) {
                console.warn('Достигнут лимит в 100,000 записей для экспорта');
                break;
            }
        }

        // Экспортируем все загруженные сегменты
        exportSegmentsToExcel(allSegments, fileName, isAirline);
    } catch (error) {
        console.error('Ошибка при экспорте сегментов:', error);
        throw error;
    }
}
