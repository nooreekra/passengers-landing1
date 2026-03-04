export type LocationType = "Country" | "Region" | "City" | "District";

export interface Location {
    id: string;
    code: string;
    name: string;
    type: LocationType;
    parentId: string | null;
}

export interface Paged<T> {
    items: T[];
    total: number;
    offset: number;
    limit: number;
}
