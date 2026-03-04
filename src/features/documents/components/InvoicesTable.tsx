"use client"

import React from 'react';
import { useTranslation } from 'react-i18next';
import { DocumentType } from '@/entities/documentTypes/types';
import { Loader } from '@/shared/ui';

interface InvoicesTableProps {
    documentTypes: DocumentType[];
    loading: boolean;
    onDownload: (documentType: DocumentType) => void;
}

const InvoicesTable: React.FC<InvoicesTableProps> = ({
    documentTypes,
    loading,
    onDownload
}) => {
    const { t } = useTranslation();

    if (loading) {
        return <Loader />;
    }

    // Группируем типы документов по дате создания
    const groupedByDate = documentTypes.reduce((acc, docType) => {
        const date = docType.createdAt.split('T')[0]; // Получаем только дату без времени
        if (!acc[date]) {
            acc[date] = [];
        }
        acc[date].push(docType);
        return acc;
    }, {} as Record<string, DocumentType[]>);

    return (
        <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {t('invoices.name', 'Название')}
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {t('invoices.invoice', 'Счета на оплату')}
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {t('invoices.esf', 'ЭСФ')}
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {t('invoices.avr', 'АВР')}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {t('invoices.date', 'Дата создания')}
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {Object.entries(groupedByDate).map(([date, types]) => {
                            const dateObj = new Date(date);
                            const monthYear = dateObj.toLocaleDateString('ru-RU', { 
                                month: 'long', 
                                year: 'numeric' 
                            });
                            
                            return (
                                <tr key={date} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">
                                            {monthYear}
                                        </div>
                                    </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    {types.find(t => t.code === 'document:invoice') ? (
                                        <button
                                            onClick={() => onDownload(types.find(t => t.code === 'document:invoice')!)}
                                            className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                                        >
                                            {t('invoices.download', 'Скачать')}
                                        </button>
                                    ) : (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                            {t('invoices.notAvailable', 'Недоступно')}
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    {types.find(t => t.code === 'document:esf') ? (
                                        <button
                                            onClick={() => onDownload(types.find(t => t.code === 'document:esf')!)}
                                            className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                                        >
                                            {t('invoices.download', 'Скачать')}
                                        </button>
                                    ) : (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                            {t('invoices.notAvailable', 'Недоступно')}
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    {types.find(t => t.code === 'document:work:act') ? (
                                        <button
                                            onClick={() => onDownload(types.find(t => t.code === 'document:work:act')!)}
                                            className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                                        >
                                            {t('invoices.download', 'Скачать')}
                                        </button>
                                    ) : (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                            {t('invoices.notAvailable', 'Недоступно')}
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-600">
                                        {dateObj.toLocaleDateString('ru-RU')}
                                    </div>
                                </td>
                            </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default InvoicesTable;
