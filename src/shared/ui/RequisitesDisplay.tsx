import React from 'react';
import { useTranslation } from 'react-i18next';
import { Requisites } from '@/entities/requisites/types';

interface RequisitesDisplayProps {
    requisites: Requisites[];
    className?: string;
    onEdit?: (requisite: Requisites) => void;
    onAdd?: () => void;
    onDelete?: (requisite: Requisites) => void;
}

export function RequisitesDisplay({ requisites, className = '', onEdit, onAdd, onDelete }: RequisitesDisplayProps) {
    const { t } = useTranslation();

    const formatAccountNumberForTitle = (accountNumber: string) => {
        if (!accountNumber || accountNumber.length < 8) return accountNumber;
        const firstFour = accountNumber.slice(0, 4);
        const lastFour = accountNumber.slice(-4);
        const middleLength = accountNumber.length - 8;
        const stars = '*'.repeat(Math.max(middleLength, 4)); // минимум 4 звездочки
        return `${firstFour}${stars}${lastFour}`;
    };

    const getFields = (requisite: Requisites) => [
        { key: 'legalName', value: requisite.legalName },
        { key: 'bin', value: requisite.uin },
        { key: 'legalAddress', value: requisite.legalAddress },
        { key: 'bank', value: requisite.bankName },
        { key: 'bik', value: requisite.bankBic },
        { key: 'accountNumber', value: requisite.accountNumber },
    ];

    return (
        <div className={`space-y-4 w-full ${className}`}>
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                    {t('requisites.title')}
                </h3>
                {onAdd && requisites.length === 0 && (
                    <button
                        onClick={onAdd}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none transition-colors duration-200"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        {t('requisites.addNew', 'Добавить реквизиты')}
                    </button>
                )}
            </div>

            {requisites.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                    <div className="w-12 h-12 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {t('requisites.empty', 'Реквизиты не найдены')}
                    </h3>
                    <p className="text-gray-500 mb-4">
                        {t('requisites.emptyDescription', 'Создайте реквизиты для вашего бизнеса')}
                    </p>
                    {onAdd && (
                        <button
                            onClick={onAdd}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            {t('requisites.addNew', 'Добавить реквизиты')}
                        </button>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    {requisites.map((requisite, index) => {
                        const fields = getFields(requisite);
                        return (
                            <div key={requisite.id || index} className="bg-white rounded-lg shadow-sm border border-gray-200">
                                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                                    <h4 className="text-md font-medium text-gray-900">
                                        {requisite.accountNumber ? formatAccountNumberForTitle(requisite.accountNumber) : `${t('requisites.requisiteNumber', 'Реквизиты')} #${index + 1}`}
                                    </h4>
                                    <div className="flex items-center gap-2">
                                        {onEdit && (
                                            <button
                                                onClick={() => onEdit(requisite)}
                                                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none transition-colors duration-200"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                                {t('common.edit')}
                                            </button>
                                        )}
                                        {onDelete && (
                                            <button
                                                onClick={() => onDelete(requisite)}
                                                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-md hover:bg-red-50 focus:outline-none transition-colors duration-200"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                                {t('common.delete')}
                                            </button>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {fields.map((field) => (
                                            <div key={field.key} className="space-y-1">
                                                <dt className="text-sm font-medium text-gray-500">
                                                    {t(`requisites.fields.${field.key}`)}
                                                </dt>
                                                <dd className="text-sm text-gray-900 font-medium">
                                                    {field.value || (
                                                        <span className="text-gray-400 italic">
                                                            {t('common.notSpecified', 'Не указано')}
                                                        </span>
                                                    )}
                                                </dd>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
