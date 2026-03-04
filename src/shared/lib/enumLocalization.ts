import type { TFunction } from 'i18next';

/**
 * Локализует enum значения на основе их числового ID или строкового значения
 * @param enumType - тип enum (например, 'bookingClass', 'rewardTriggerType', 'tripStatus')
 * @param enumValue - числовое или строковое значение enum
 * @param t - функция перевода из react-i18next
 * @returns локализованное значение или исходное значение, если перевод не найден
 */
export const localizeEnum = (
    enumType: 'bookingClass' | 'rewardTriggerType' | 'tripStatus',
    enumValue: number | string,
    t: TFunction
): string => {
    // Создаем маппинг строковых значений на числовые ID
    const stringToIdMap: Record<string, Record<string, string>> = {
        bookingClass: {
            'Business': '1',
            'Economy': '2', 
            'First': '3'
        },
        rewardTriggerType: {
            'BookingClass': '1',
            'FareFamily': '2',
            'Ancillary': '3'
        },
        tripStatus: {
            'Open': '1',
            'Flown': '2',
            'Refunded': '3'
        }
    };

    // Если значение строка, конвертируем в ID
    let enumId = enumValue.toString();
    if (typeof enumValue === 'string' && stringToIdMap[enumType]) {
        enumId = stringToIdMap[enumType][enumValue] || enumValue;
    }

    const key = `enums.${enumType}.${enumId}`;
    const translated = t(key);
    
    // Если перевод не найден (возвращается тот же ключ), возвращаем исходное значение
    if (translated === key) {
        return enumValue.toString();
    }
    
    return translated;
};

/**
 * Локализует массив enum значений
 * @param enumType - тип enum
 * @param enumValues - массив числовых значений enum
 * @param t - функция перевода
 * @returns массив локализованных значений
 */
export const localizeEnumArray = (
    enumType: 'bookingClass' | 'rewardTriggerType' | 'tripStatus',
    enumValues: (number | string)[],
    t: TFunction
): string[] => {
    return enumValues.map(value => localizeEnum(enumType, value, t));
};
