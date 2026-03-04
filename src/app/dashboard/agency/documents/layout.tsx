"use client"

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function DocumentsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { t } = useTranslation();
    const pathname = usePathname();

    const tabs = [
        {
            id: 'invoices',
            label: t('invoices.title', 'Invoices'),
            href: '/dashboard/agency/documents/invoices'
        },
        {
            id: 'documents',
            label: t('documents.title', 'Documents'),
            href: '/dashboard/agency/documents/documents'
        }
    ];

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">
                {t('documentsAndInvoices.title', 'Documents and Invoices')}
            </h1>
            
            {/* Навигационные табы */}
            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                    {tabs.map((tab) => {
                        const isActive = pathname === tab.href;
                        return (
                            <Link
                                key={tab.id}
                                href={tab.href}
                                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                    isActive
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                {tab.label}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Контент дочерних страниц */}
            {children}
        </div>
    );
}
