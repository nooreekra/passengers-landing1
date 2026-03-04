import axiosInstance from "@/shared/api/axiosInstance";
import type { Location, Paged } from "@/entities/locations/types";

export const getCountries = async (): Promise<Location[]> => {
    const { data } = await axiosInstance.get<Paged<Location>>(
        "/api/locations/type/Country?limit=300"
    );
    return data.items;
};

export const getCountriesByBusiness = async (businessId: string): Promise<Location[]> => {
    const { data } = await axiosInstance.get<Location[]>(
        `/api/businesses/${businessId}/countries`
    );
    return data;
};

export const getCitiesByCountry = async (parentId: string): Promise<Location[]> => {
    const { data } = await axiosInstance.get<Paged<Location>>(
        `/api/locations/parent/${parentId}?limit=50000`
    );
    return data.items;
};

export const getAgencies = async (countryIds: string[], cityIds: string[]) => {
    const { data } = await axiosInstance.post(
        "/api/businesses/agencies",
        { countryIds, cityIds }
    );
    return data;
};

export const getCitiesByBusiness = async (businessId: string): Promise<Location[]> => {
    const { data } = await axiosInstance.get<Location[]>(
        `/api/businesses/${businessId}/cities?limit=50000`
    );
    return data;
};

export const getLocationById = async (id: string): Promise<Location> => {
    const { data } = await axiosInstance.get<Location>(`/api/locations/${id}`);
    return data;
};

export const getLocations = async (offset = 0, limit = 100000): Promise<Paged<Location>> => {
    const { data } = await axiosInstance.get<Paged<Location>>("/api/locations", {
        params: { offset, limit }
    });
    return data;
};