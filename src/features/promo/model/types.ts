export interface Promo {
    id: string;
    name: string;
    status: string;
    description: string;
    ruleDescription: string;
    rewardsDescription: string;
    imageUri: string;
    businessId: string;
    thresholdRewards?: Array<{
        id: string;
        promoRewardId: string;
        targetBusinessId: string;
        targetBusinessName: string;
        baselineSegments: number;
        value: number;
        valueType: "Fixed" | "Percentage";
        steps: Array<{
            id: string;
            promoThresholdRewardId: string;
            fromSegments: number;
            toSegments: number | null;
            value: number;
            valueType: "Fixed" | "Percentage";
        }>;
    }>;
    targetAudience: {
        id: string;
        promoId: string;
        countries?: Array<{
            id: string;
            promoTargetAudienceId: string;
            countryId: string;
        }>;
        cities?: Array<{
            id: string;
            promoTargetAudienceId: string;
            cityId: string;
        }>;
        businesses?: Array<{
            id: string;
            promoTargetAudienceId: string;
            businessId: string;
        }>;
    };
    rule: {
        id: string;
        promoId: string;
        bookingPeriodFrom: string;
        bookingPeriodTo: string;
        travelPeriodFrom: string;
        travelPeriodTo: string;
        interlinePartners: boolean;
        codesharePartners: boolean;
        originCountries?: Array<{
            id: string;
            promoRuleId: string;
            countryId: string;
        }>;
        originCities?: Array<{
            id: string;
            promoRuleId: string;
            cityId: string;
        }>;
        destinationCountries?: Array<{
            id: string;
            promoRuleId: string;
            countryId: string;
        }>;
        destinationCities?: Array<{
            id: string;
            promoRuleId: string;
            cityId: string;
        }>;
        flightNumbers?: Array<{
            id: string;
            promoRuleId: string;
            flightNumber: string;
        }>;
    };
    reward: Array<{
        id: string;
        promoId: string;
        targetAudienceType: "TravelAgency" | "TravelAgent" | "Airline";
        rewardType: "Fee" | "Threshold";
        feeRewards?: Array<{
            id: string;
            promoRewardId: string;
            trigger: "BookingClass" | "FareFamily" | "Ancillary";
            elements: Array<{
                id: string;
                promoFeeRewardId: string;
                bookingClassSegmentType: string;
                triggerValue: string | null;
                value: number;
                valueType: "Fixed" | "Percentage";
            }>;
        }>;
        thresholdReward?: {
            id: string;
            promoRewardId: string;
            targetBusinessId: string;
            baselineSegments: number;
            value: number;
            valueType: "Fixed" | "Percentage";
            steps: Array<{
                id: string;
                promoThresholdRewardId: string;
                fromSegments: number;
                toSegments: number;
                value: number;
                valueType: "Fixed" | "Percentage";
            }>;
        };
    }>;
}

export type Option<T = string> = {
    value: T;
    label: string;
};

export interface PromoTable {
    id: string;
    name: string;
    imsFees: number[];
    businessTradingName: string;
    businessLogoUri: string;
    status: "Active" | "Inactive" | "Unpublished";
    bookingPeriod: { from: string; to: string };
    originCountries: string[];
    originCities: string[];
    destinationCountries: string[];
    destinationCities: string[];
    travelPeriod: { from: string; to: string };
    targetAudienceCountries: string[];
    targetAudienceCities: string[];
    targetAudiences: Array<"TravelAgency" | "TravelAgent" | "Airline">;
    segments: { booked: number; flown: number };
    ancillaries: Array<{ targetAudience: "TravelAgency" | "TravelAgent" | "Airline"; values: string[] }>;
    totalTarget: number;
    rewardsTotal: Array<{
        targetAudience: "TravelAgency" | "TravelAgent" | "Airline";
        value: number;
        isConfirmed: boolean;
    }>;
    rewardsPaid: Array<{
        targetAudience: "TravelAgency" | "TravelAgent" | "Airline";
        value: number;
        isConfirmed: boolean;
    }>;
    currencyCode: string;
}

export interface BookingSegment {
    currencyCode: string;
    ainNumbers: { targetAudience: string; value: string }[];
    targetAudiences: string[];
    travelAgentName: string;
    travelAgency: string;
    iataPcc: string;
    title: string;
    passengerName: string;
    pnrNumber: string;
    bookingDate: string;
    airlineCode: string;
    flightNumber: string;
    travelDate: string;
    origin: string;
    destination: string;
    status: string;
    bookingClass: string;
    rbd: string;
    fareFamily: string;
    iataNumber: string;
    iataValidator: string;
    ticketNumber: string;
    fare: number;
    taxes: number;
    rewardTypes?: { targetAudience: string; rewardType: string }[];
    rewardAmounts?: { targetAudience: string; value: number; isConfirmed?: boolean }[];
    segments: { booked: number; flown: number };
    individualTarget?: number;
    imsFees: number;
}

// Partner (Partnership) specific types
export interface PartnerTransaction {
    $type: "Partner";
    ainNumber: string;
    name: string;
    membershipStatus?: string;
    transactionDate: string;
    transactionAmount: number;
    rewardAmount: number;
    milesAmount: number;
    status: string;
    transactionNumber: string;
    vatAmount: number;
    imsFees: number;
    currencyCode: string;
}

export interface PartnerPromoSummary {
    $type: "Partner";
    startDate: string;
    endDate: string;
    targetCountries: string;
    id: string;
    name: string;
    description: string;
    ruleDescription: string;
    businessId: string;
    status: "Active" | "Inactive" | "Unpublished";
}

export interface PartnerTransactionsResponse {
    $type: "Partner";
    promo: PartnerPromoSummary;
    items: PartnerTransaction[];
    total: number;
    offset: number;
    limit: number;
}