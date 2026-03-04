import axiosInstance from './axiosInstance';

export interface StoryImage {
    url: string;
    isMobile: boolean;
}

export enum BusinessType {
    Airline = 'Airline',
    Gym = 'Gym',
    CoffeeShop = 'CoffeeShop',
    Restaurant = 'Restaurant',
    Hotel = 'Hotel',
    Bank = 'Bank'
}

export interface Story {
    id: string;
    name: string;
    description: string;
    images: StoryImage[];
    startDate: string;
    endDate: string;
    businessType: BusinessType;
    businessLogo?: string;
}

export interface Tier {
    id: string;
    code: string;
    name: string;
    color: string;
    discountPercent: number;
    levelOrder: number;
}

export interface CurrentTier {
    id: string;
    type: string;
    name: string;
    color: string;
    discountPercent: number;
    levelOrder: number;
    validFrom: string;
}

// Tier в истории теперь тоже использует type вместо code
export interface TierInHistory {
    id: string;
    type: string;
    name: string;
    color: string;
    discountPercent: number;
    levelOrder: number;
}

export interface TierHistory {
    id: string;
    userId: string;
    tier: TierInHistory | null;
    validFrom: string;
    validTo: string | null;
}

/**
 * История уровней лояльности
 */
export async function getTierHistories(months: number = 3): Promise<TierHistory[]> {
    const { data } = await axiosInstance.get('/api/tiers/me/histories', {
        params: { months }
    });
    return data;
}

export interface Activity {
    name: string;
    metric: string;
    completed: number;
    required: number;
}

export interface ProgressTier {
    id: string;
    type: string;
    name: string;
    color: string;
    discountPercent: number;
    levelOrder: number;
}

export interface ProgressSummary {
    tripsCompleted: number;
    tripsRequired: number;
    monthlyActivityCompleted: number;
    monthlyActivityRequired: number;
    activities: Activity[];
}

export interface TransactionsSummary {
    year: number;
    month: number;
    progressTier: ProgressTier;
    progressSummary: ProgressSummary;
}

/**
 * Сводка по прогрессу пользователя
 */
export async function getTransactionsSummary(year?: number, month?: number): Promise<TransactionsSummary> {
    const params: { year?: number; month?: number } = {};
    if (year) params.year = year;
    if (month) params.month = month;
    
    const { data } = await axiosInstance.get('/api/tiers/me/summary', { params });
    return data;
}

/**
 * История операции с милями
 */
export async function getMilesTransactions(walletId: string): Promise<any> {
    const { data } = await axiosInstance.get(`/api/wallets/${walletId}/transactions`);
    return data;
}

export interface MilesSummary {
    userId: string;
    totalMiles: number;
    confirmed: number;
    unconfirmed: number;
}

/**
 * Сводка по милям пользователя
 */
export async function getMilesSummary(): Promise<MilesSummary> {
    const wallet = await getWallet();
    return {
        userId: wallet.userId,
        totalMiles: wallet.allTimeBalance,
        confirmed: wallet.balance,
        unconfirmed: wallet.pendingBalance,
    };
}

export interface PromoCountry {
    code: string;
    name: string;
}

/**
 * Получение списка стран для промо-сторис
 */
export async function getPromoCountries(): Promise<PromoCountry[]> {
    const { data } = await axiosInstance.get<PromoCountry[]>('/api/promos/countries');
    return data;
}

/**
 * Получение stories для пассажира
 */
export async function getStories(countryCode?: string): Promise<Story[]> {
    const params: { countryCode?: string } = {};
    if (countryCode) {
        params.countryCode = countryCode;
    }
    const { data } = await axiosInstance.get('/api/promos/stories', { params });
    return data;
}

export interface TransactionItem {
    id: string;
    userId: string;
    transactionId: string;
    category: string;
    description: string;
    miles: number;
    type: "TopUp" | "Transfer" | "Spent";
    status: "Pending" | "Paid" | "Cancelled";
    fromWishlistId?: string | null;
    toWishlistId?: string | null;
    createdAt: string;
}

export interface TransactionsResponse {
    items: TransactionItem[];
    total: number;
    offset: number;
    limit: number;
}

interface TransactionsApiResponse {
    items: WalletTransaction[];
    total: number;
    offset: number;
    limit: number;
}

/**
 * Получение транзакций пользователя
 */
export async function getTransactions(walletId: string, offset = 0, limit = 100, excludeTransfers = false): Promise<TransactionsResponse> {
    const { data } = await axiosInstance.get<TransactionsApiResponse | WalletTransaction[]>(`/api/wallets/${walletId}/transactions`, {
        params: { offset, limit, sortBy: 'createdAt:desc', excludeTransfers }
    });
    
    // Проверяем, является ли ответ объектом с полями items, total, offset, limit (новый формат)
    if (data && !Array.isArray(data) && typeof data === 'object' && 'items' in data && Array.isArray((data as any).items)) {
        const apiResponse = data as TransactionsApiResponse;
        const items: TransactionItem[] = (apiResponse.items || []).map((tx: WalletTransaction) => {
            return {
                id: tx.id,
                userId: tx.userId,
                transactionId: tx.sourceId || "",
                category: tx.category,
                description: tx.description,
                miles: tx.amount,
                type: tx.type,
                status: tx.status,
                fromWishlistId: tx.fromWishlistId,
                toWishlistId: tx.toWishlistId,
                createdAt: tx.createdAt,
            };
        });
        
        return {
            items,
            total: apiResponse.total ?? items.length,
            offset: apiResponse.offset ?? offset,
            limit: apiResponse.limit ?? limit,
        };
    }
    
    // Fallback для старого формата (массив)
    const items: TransactionItem[] = (Array.isArray(data) ? data : []).map((tx: WalletTransaction) => {
        return {
            id: tx.id,
            userId: tx.userId,
            transactionId: tx.sourceId || "",
            category: tx.category,
            description: tx.description,
            miles: tx.amount,
            type: tx.type,
            status: tx.status,
            fromWishlistId: tx.fromWishlistId,
            toWishlistId: tx.toWishlistId,
            createdAt: tx.createdAt,
        };
    });
    
    return {
        items,
        total: items.length,
        offset,
        limit,
    };
}

/**
 * Получение списка всех тиров лояльности
 */
export async function getTiers(): Promise<Tier[]> {
    const { data } = await axiosInstance.get<Tier[]>('/api/tiers');
    return data;
}

/**
 * Получение текущего уровня лояльности пользователя
 */
export async function getCurrentTier(): Promise<CurrentTier> {
    const { data } = await axiosInstance.get<CurrentTier>('/api/tiers/me');
    return data;
}

export interface Wallet {
    id: string;
    userId: string;
    balance: number;
    reservedBalance: number;
    pendingBalance: number;
    availableBalance: number;
    allTimeBalance: number;
}

/**
 * Получение кошелька текущего пользователя
 */
export async function getWallet(): Promise<Wallet> {
    const { data } = await axiosInstance.get<Wallet>('/api/wallets/me');
    return data;
}

export interface Wishlist {
    id: string;
    walletId: string;
    userId: string;
    title: string;
    country: string;
    city?: string;
    targetAmount: number;
    currentAmount: number;
    rule: string;
    rulePercent: number;
}

/**
 * Получение списка wishlists для кошелька
 */
export async function getWishlists(walletId: string): Promise<Wishlist[]> {
    const { data } = await axiosInstance.get<Wishlist[]>(`/api/wallets/${walletId}/wishlists`);
    return data;
}

/**
 * Получение конкретного wishlist
 */
export async function getWishlist(walletId: string, wishlistId: string): Promise<Wishlist> {
    const { data } = await axiosInstance.get<Wishlist>(`/api/wallets/${walletId}/wishlists/${wishlistId}`);
    return data;
}

export interface CreateWishlistPayload {
    title: string;
    country: string;
    city?: string;
    targetAmount: number;
    rule?: string;
    rulePercent?: number;
}

/**
 * Создание нового wishlist
 */
export async function createWishlist(walletId: string, payload: CreateWishlistPayload): Promise<Wishlist> {
    const { data } = await axiosInstance.post<Wishlist>(`/api/wallets/${walletId}/wishlists`, payload);
    return data;
}

export interface UpdateWishlistPayload {
    title?: string;
    description?: string;
    country?: string;
    city?: string;
    targetAmount?: number;
    rule?: string;
    rulePercent?: number;
}

/**
 * Обновление wishlist
 */
export async function updateWishlist(walletId: string, wishlistId: string, payload: UpdateWishlistPayload): Promise<Wishlist> {
    const { data } = await axiosInstance.patch<Wishlist>(`/api/wallets/${walletId}/wishlists/${wishlistId}`, payload);
    return data;
}

/**
 * Удаление wishlist
 */
export async function deleteWishlist(walletId: string, wishlistId: string): Promise<void> {
    await axiosInstance.delete(`/api/wallets/${walletId}/wishlists/${wishlistId}`);
}

export interface ReserveFundsPayload {
    amount: number;
}

/**
 * Резервирование средств для wishlist
 */
export async function reserveFunds(walletId: string, wishlistId: string, payload: ReserveFundsPayload): Promise<void> {
    await axiosInstance.post(`/api/wallets/${walletId}/wishlists/${wishlistId}/reserve`, payload);
}

/**
 * Освобождение средств из wishlist
 */
export async function releaseFunds(walletId: string, wishlistId: string, payload: ReserveFundsPayload): Promise<void> {
    await axiosInstance.post(`/api/wallets/${walletId}/wishlists/${wishlistId}/release`, payload);
}

export interface TransferFundsPayload {
    toWishlistId: string;
    amount: number;
}

/**
 * Перевод средств между wishlists
 */
export async function transferFunds(walletId: string, fromWishlistId: string, payload: TransferFundsPayload): Promise<void> {
    await axiosInstance.post(`/api/wallets/${walletId}/wishlists/${fromWishlistId}/transfer`, payload);
}

export interface WalletTransaction {
    id: string;
    walletId: string;
    userId: string;
    type: "TopUp" | "Transfer" | "Spent";
    status: "Pending" | "Paid" | "Cancelled";
    amount: number;
    wishlistId?: string;
    category: string;
    description: string;
    sourceType: string;
    sourceId: string | null;
    fromWishlistId?: string | null;
    toWishlistId?: string | null;
    createdAt: string;
}

/**
 * Получение транзакций кошелька
 */
export async function getWalletTransactions(walletId: string): Promise<WalletTransaction[]> {
    const { data } = await axiosInstance.get<WalletTransaction[]>(`/api/wallets/${walletId}/transactions`, {
        params: { sortBy: 'createdAt:desc' }
    });
    return data;
}


