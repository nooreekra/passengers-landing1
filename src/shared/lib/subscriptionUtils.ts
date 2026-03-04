import { Subscription } from "@/entities/subscription/types";

/**
 * Определяет, активна ли подписка на основе endDate
 * Подписка считается активной, если у неё есть endDate И endDate в будущем относительно asOfUtc
 */
export const isSubscriptionActive = (subscription: Subscription): boolean => {
    // Если endDate отсутствует, подписка неактивна
    if (!subscription.endDate) {
        return false;
    }
    
    // Проверяем, что endDate в будущем относительно asOfUtc
    const endDate = new Date(subscription.endDate);
    const referenceTime = new Date(subscription.asOfUtc);
    
    return endDate > referenceTime;
};

/**
 * Получает статус подписки для отображения
 */
export const getSubscriptionStatus = (subscription: Subscription): 'active' | 'expired' | 'inactive' => {
    // Если endDate отсутствует, подписка неактивна
    if (!subscription.endDate) {
        return 'inactive';
    }
    
    const endDate = new Date(subscription.endDate);
    const referenceTime = new Date(subscription.asOfUtc);
    
    // Если endDate в будущем относительно asOfUtc - подписка активна
    if (endDate > referenceTime) {
        return 'active';
    }
    
    // Если endDate в прошлом относительно asOfUtc - подписка истекла
    return 'expired';
};

/**
 * Определяет, можно ли показать кнопку отписки
 * Кнопка отписки показывается только если isActive === true И есть endDate
 */
export const canUnsubscribe = (subscription: Subscription): boolean => {
    return subscription.isActive && !!subscription.endDate;
};
