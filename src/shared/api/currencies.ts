export interface Currency {
    code: string;
    name: string;
    symbol: string;
}

export const getCurrencies = async (): Promise<Currency[]> => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/currencies`);
    if (!res.ok) throw new Error("Failed to fetch currencies");
    return res.json();
};
