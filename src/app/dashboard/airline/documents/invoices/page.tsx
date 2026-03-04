"use client"

import React, { useEffect, useState } from 'react';
import { documentTypesApi } from '@/shared/api/documentTypes';
import { documentsApi } from '@/shared/api/documents';
import { getCurrentBusiness } from '@/shared/api/business';
import { DocumentType } from '@/entities/documentTypes/types';
import { Document } from '@/entities/documents/types';
import InvoicesTable from '@/features/documents/components/InvoicesTable';
import { useTranslation } from 'react-i18next';

const Invoices = () => {
    const { t } = useTranslation();
    const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [businessId, setBusinessId] = useState<string | null>(null);

    const fetchDocumentTypes = async () => {
        try {
            console.log('Загружаем типы документов...');
            setLoading(true);
            const response = await documentTypesApi.getDocumentTypes({
                offset: 0,
                limit: 100
            });
            console.log('Получены типы документов:', response);
            setDocumentTypes(response.items);
        } catch (error) {
            console.error('Ошибка при загрузке типов документов:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDocuments = async () => {
        if (!businessId) return;
        
        try {
            const response = await documentsApi.getDocuments(businessId, {
                offset: 0,
                limit: 1000 // Получаем все документы
            });
            setDocuments(response.items);
        } catch (error) {
            console.error('Ошибка при загрузке документов:', error);
        }
    };

    useEffect(() => {
        const loadBusinessId = async () => {
            try {
                const business = await getCurrentBusiness();
                setBusinessId(business.id);
            } catch (error) {
                console.error('Ошибка при загрузке бизнеса:', error);
            }
        };
        loadBusinessId();
    }, []);

    useEffect(() => {
        fetchDocumentTypes();
    }, []);

    useEffect(() => {
        if (businessId) {
            fetchDocuments();
        }
    }, [businessId]);

    const handleDownload = (documentType: DocumentType) => {
        console.log('Скачивание документа типа:', documentType.name);
        
        // Ищем документ с соответствующим типом
        const document = documents.find(doc => doc.typeName === documentType.name);
        
        if (document && document.filePath) {
            // Создаем ссылку для скачивания реального файла
            const link = window.document.createElement('a');
            link.href = document.filePath;
            link.download = document.name;
            window.document.body.appendChild(link);
            link.click();
            window.document.body.removeChild(link);
        } else {
            console.warn('Файл не найден для типа документа:', documentType.name);
            alert(`Файл для ${documentType.name} не найден`);
        }
    };

    return (
        <div>
            <InvoicesTable
                documentTypes={documentTypes}
                loading={loading}
                onDownload={handleDownload}
            />
        </div>
    );
};

export default Invoices;
