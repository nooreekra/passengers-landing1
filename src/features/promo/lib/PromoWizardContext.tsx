"use client";

import { createContext, useContext, useState, useEffect } from "react";
import {ApiIncentive} from "@/entities/incentive/types";
import { getPromoById } from "@/features/promo/api/promos";
import { getCountries, getCitiesByCountry, getLocationById, getAgencies } from "@/shared/api/locations";


export type PromoDraft = {
    promoId?: number;
    name?: string;
    description?: string;
    ruleDescription?: string;
    imageUri?: string;
    targetAudiences?: {
        country: { value: string; label: string } | null;
        cities:   { value: string; label: string }[];
        agencies: { value: string; label: string }[];
    }[];
    rules?: {
        bookingFrom: string;
        bookingTo: string;
        travelFrom: string;
        travelTo: string;
        originCountries: string[] | string;
        originCities: string[] | string;
        destinationCountries: string[] | string;
        destinationCities: string[] | string;
        flightNumbers: string[];
        interlinePartners: boolean;
        codesharePartners: boolean;
        internationalOnly: boolean;
    };
    incentives?: ApiIncentive[];
};

type PromoDraftUpdater =
    | PromoDraft
    | ((prev: PromoDraft) => PromoDraft);

const PromoWizardCtx = createContext<{
    data: PromoDraft;
    setData: (d: PromoDraftUpdater) => void;
    loading: boolean;
    error: string | null;
    stepCompletion: boolean[];
}>({
    data: {},
    setData: () => {},
    loading: false,
    error: null,
    stepCompletion: [false, false, false, false],
});


export function PromoWizardProvider({ 
    children, 
    promoId 
}: { 
    children: React.ReactNode;
    promoId?: string;
}) {
    const [data, setInternalData] = useState<PromoDraft>(() => {
        if (typeof window !== 'undefined') {
            const savedData = localStorage.getItem('promo-wizard-data');
            if (savedData) {
                try {
                    return JSON.parse(savedData);
                } catch (error) {
                    console.error('Failed to parse saved promo data:', error);
                }
            }
        }
        return {};
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getStepCompletion = (data: PromoDraft): boolean[] => {
        return [
            !!(data.name && data.description && data.ruleDescription),
            
            !!(data.targetAudiences && data.targetAudiences.length > 0 && 
               data.targetAudiences.some(audience => 
                   audience.country?.value && 
                   (audience.cities?.length > 0 || audience.agencies?.length > 0)
               )),
            
            !!(data.rules && 
               data.rules.bookingFrom && data.rules.bookingTo &&
               data.rules.travelFrom && data.rules.travelTo &&
               (data.rules.originCountries !== "all" || data.rules.destinationCountries !== "all")),
            
            !!(data.incentives && data.incentives.length > 0)
        ];
    };

    const stepCompletion = getStepCompletion(data);

    const setData = (d: PromoDraftUpdater) => {
        const newData = typeof d === "function" 
            ? (d as (prev: PromoDraft) => PromoDraft)(data)
            : d;
        
        setInternalData(newData);
        
        if (typeof window !== 'undefined') {
            try {
                localStorage.setItem('promo-wizard-data', JSON.stringify(newData));
            } catch (error) {
                console.error('Failed to save promo data to localStorage:', error);
            }
        }
    };

    useEffect(() => {
        if (promoId) {
            const loadPromoData = async () => {
                try {
                    setLoading(true);
                    setError(null);
                    const promoData = await getPromoById(promoId);
                    
                    const loadCountryNames = async (countryIds: string[]) => {
                        const countriesMap = new Map();
                        for (const id of countryIds) {
                            try {
                                const country = await getLocationById(id);
                                countriesMap.set(id, country.name);
                            } catch (error) {
                                console.error(`Failed to load country ${id}:`, error);
                                countriesMap.set(id, id); // fallback to ID if name not found
                            }
                        }
                        return countriesMap;
                    };

                    const allCountryIds = new Set<string>();
                    if (promoData.rule?.originCountries) {
                        promoData.rule.originCountries.forEach((country: any) => allCountryIds.add(country.countryId));
                    }
                    if (promoData.rule?.destinationCountries) {
                        promoData.rule.destinationCountries.forEach((country: any) => allCountryIds.add(country.countryId));
                    }

                    const countriesMap = await loadCountryNames(Array.from(allCountryIds));

                    const loadAgencyNames = async (businessIds: string[]) => {
                        const agenciesMap = new Map();
                        try {
                            const agencies = await getAgencies([], []);
                            for (const id of businessIds) {
                                const agency = agencies.find((a: any) => a.id === id);
                                if (agency) {
                                    agenciesMap.set(id, agency.value || agency.name || id);
                                } else {
                                    agenciesMap.set(id, id);
                                }
                            }
                        } catch (error) {
                            console.error(`Failed to load agencies:`, error);
                            businessIds.forEach(id => agenciesMap.set(id, id));
                        }
                        return agenciesMap;
                    };

                    const allAgencyIds = new Set<string>();
                    if (promoData.targetAudience?.businesses) {
                        promoData.targetAudience.businesses.forEach((business: any) => allAgencyIds.add(business.businessId));
                    }
                    
                    if (promoData.rewards) {
                        promoData.rewards.forEach((reward: any) => {
                            if (reward.thresholdReward?.targetBusinessId) {
                                allAgencyIds.add(reward.thresholdReward.targetBusinessId);
                            }
                        });
                    }

                    const agenciesMap = await loadAgencyNames(Array.from(allAgencyIds));

                    let targetAudienceCountryName = "";
                    if (promoData.targetAudience?.countries?.length > 0 && promoData.targetAudience.countries[0]?.countryId) {
                        try {
                            const country = await getLocationById(promoData.targetAudience.countries[0].countryId);
                            targetAudienceCountryName = country.name;
                        } catch (error) {
                            console.error(`Failed to load target audience country:`, error);
                            targetAudienceCountryName = promoData.targetAudience.countries[0].countryId;
                        }
                    }
                    
                    const transformedData: PromoDraft = {
                        promoId: promoData.id,
                        name: promoData.name,
                        description: promoData.description,
                        ruleDescription: promoData.ruleDescription,
                        imageUri: promoData.imageUri,
                        targetAudiences: promoData.targetAudience ? [{
                            country: promoData.targetAudience.countries?.length > 0 
                                ? { 
                                    value: promoData.targetAudience.countries[0].countryId, 
                                    label: targetAudienceCountryName
                                }
                                : promoData.targetAudience.countries?.length === 0
                                    ? null
                                    : { value: "all", label: "All" },
                            cities: promoData.targetAudience.cities?.length > 0 
                                ? promoData.targetAudience.cities.map((city: any) => ({ 
                                    value: city.cityId, 
                                    label: city.cityName || city.cityId 
                                }))
                                : [{ value: "all", label: "All" }],
                            agencies: promoData.targetAudience.businesses?.length > 0 
                                ? promoData.targetAudience.businesses.map((business: any) => ({ 
                                    value: business.businessId, 
                                    label: agenciesMap.get(business.businessId) || business.businessId 
                                }))
                                : [{ value: "all", label: "All" }]
                        }] : [],
                        rules: promoData.rule ? {
                            bookingFrom: promoData.rule.bookingPeriodFrom,
                            bookingTo: promoData.rule.bookingPeriodTo,
                            travelFrom: promoData.rule.travelPeriodFrom,
                            travelTo: promoData.rule.travelPeriodTo,
                            originCountries: promoData.rule.originCountries?.length > 0 
                                ? promoData.rule.originCountries.map((country: any) => ({
                                    value: country.countryId,
                                    label: countriesMap.get(country.countryId) || country.countryId
                                }))
                                : "all",
                            originCities: promoData.rule.originCities?.length > 0 
                                ? promoData.rule.originCities.map((city: any) => ({
                                    value: city.cityId,
                                    label: city.cityName || city.cityId
                                }))
                                : "all",
                            destinationCountries: promoData.rule.destinationCountries?.length > 0 
                                ? promoData.rule.destinationCountries.map((country: any) => ({
                                    value: country.countryId,
                                    label: countriesMap.get(country.countryId) || country.countryId
                                }))
                                : "all",
                            destinationCities: promoData.rule.destinationCities?.length > 0 
                                ? promoData.rule.destinationCities.map((city: any) => ({
                                    value: city.cityId,
                                    label: city.cityName || city.cityId
                                }))
                                : "all",
                            flightNumbers: promoData.rule.flightNumbers?.map((flight: any) => flight.flightNumber) || [],
                            interlinePartners: promoData.rule.interlinePartners || false,
                            codesharePartners: promoData.rule.codesharePartners || false,
                            internationalOnly: promoData.rule.internationalOnly || false,
                        } : undefined,
                        incentives: promoData.rewards?.map((reward: any) => {
                            if (reward.rewardType === "Threshold" && reward.thresholdReward) {
                                return {
                                    targetAudienceType: reward.targetAudienceType,
                                    incentiveType: "Threshold",
                                    rewards: [{
                                        type: "Threshold",
                                        agencyId: reward.thresholdReward.targetBusinessId,
                                        baseline: reward.thresholdReward.baselineSegments,
                                        value: reward.thresholdReward.value,
                                        valueType: reward.thresholdReward.valueType,
                                        thresholds: reward.thresholdReward.steps?.map((step: any) => ({
                                            from: step.fromSegments,
                                            to: step.toSegments === null ? "AND_MORE" : step.toSegments,
                                            value: step.value,
                                            unit: step.valueType
                                        })) || []
                                    }]
                                };
                            } else if (reward.rewardType === "Fee" && reward.feeRewards?.length > 0) {
                                return {
                                    targetAudienceType: reward.targetAudienceType,
                                    incentiveType: "Fee",
                                    rewards: reward.feeRewards.map((feeReward: any) => ({
                                        type: "Fee",
                                        paidPer: feeReward.trigger,
                                        lines: feeReward.elements?.map((element: any) => ({
                                            segment: element.bookingClassSegmentType === "PerAllBookingClasses" 
                                                ? "PerAllBookingClasses" 
                                                : element.bookingClassSegmentType,
                                            value: element.value,
                                            unit: element.valueType
                                        })) || []
                                    }))
                                };
                            }
                            return null;
                        }).filter(Boolean) || []
                    };
                    
                    setInternalData(transformedData);
                } catch (err: any) {
                    setError(err?.response?.data?.message || err?.message || 'Ошибка загрузки данных промо');
                    console.error('Failed to load promo data:', err);
                } finally {
                    setLoading(false);
                }
            };

            loadPromoData();
        }
    }, [promoId]);

    return (
        <PromoWizardCtx.Provider value={{ data, setData, loading, error, stepCompletion }}>
            {children}
        </PromoWizardCtx.Provider>
    );
}


export const usePromoWizard = () => useContext(PromoWizardCtx);
