export type UUID = string;

export interface Business {
    id: UUID;
    tradingName: string;
    legalName: string;
    legalAddress: string;
    headquartersAddress: string;
    countryOfIncorporation: string;
    countryId?: string | null;
    cityId?: string | null;
    mailingAddress: string | null;
    firstAddressLine?: string | null;
    secondAddressLine?: string | null;
    postIndex?: string | null;
    sameAsRegisteredAddress?: boolean;
    type: "Airline" | "TravelAgent" | "TravelAgency" | "Partnership";
    corporateEmail: string | null;
    iataDesignator: string | null;
    icaoCode: string | null;
    logoUri: string | null;
    pseudoCityCode: string[] | null;
    ticketingAuthority?: boolean;
    ain?: string | null;
    iataNumericCode?: number | null;
    iataValidator?: string[] | null;
    officeIds?: string[] | null;
    logoId?: UUID | null;
    // Head office address fields
    headquartersFirstAddressLine?: string | null;
    headquartersSecondAddressLine?: string | null;
    headquartersPostIndex?: string | null;
    headquartersCountryId?: string | null;
    headquartersCityId?: string | null;
}

export type UpdateBusinessPayload = Omit<Business, "id">;
