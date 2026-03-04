"use client"

import React, { useEffect, useState } from 'react';
import { documentsApi } from '@/shared/api/documents';
import { getCurrentBusiness } from '@/shared/api/business';
import { Document, DocumentsParams } from '@/entities/documents/types';
import DocumentsTable from '@/features/documents/components/DocumentsTable';
import { useTranslation } from 'react-i18next';

const DocumentsSubpage = () => {
    const { t } = useTranslation();
    const [businessId, setBusinessId] = useState<string | null>(null);
    
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [offset, setOffset] = useState(0);
    const [limit] = useState(10);

    const fetchDocuments = async (params: DocumentsParams = {}) => {
        if (!businessId) {
            console.log('businessId не найден, пропускаем загрузку документов');
            return;
        }
        
        try {
            console.log('Загружаем документы для businessId:', businessId);
            setLoading(true);
            const response = await documentsApi.getDocuments(businessId, {
                offset,
                limit,
                ...params
            });
            console.log('Получены документы:', response);
            
            // Фильтруем документы, исключая файлы инвойсов
            const filteredDocuments = response.items.filter(doc => {
                const fileName = doc.name?.toLowerCase() || '';
                const typeName = doc.typeName?.toLowerCase() || '';
                
                // Исключаем файлы инвойсов по названию файла или типу
                return !fileName.includes('invoice') && 
                       !fileName.includes('счет') &&
                       !typeName.includes('invoice') &&
                       !typeName.includes('счет') &&
                       !typeName.includes('эсф') &&
                       !typeName.includes('акт выполненных работ');
            });
            
            setDocuments(filteredDocuments);
            setTotal(filteredDocuments.length);
        } catch (error) {
            console.error('Ошибка при загрузке документов:', error);
        } finally {
            setLoading(false);
        }
    };

    // Загружаем businessId при монтировании компонента
    useEffect(() => {
        const loadBusinessId = async () => {
            try {
                console.log('Загружаем данные бизнеса...');
                const business = await getCurrentBusiness();
                console.log('Получен businessId:', business.id);
                setBusinessId(business.id);
            } catch (error) {
                console.error('Ошибка при загрузке бизнеса:', error);
            }
        };
        loadBusinessId();
    }, []);

    useEffect(() => {
        if (businessId) {
            fetchDocuments();
        }
    }, [businessId, offset]);

    const handlePageChange = (newOffset: number) => {
        setOffset(newOffset);
    };

    const handleDownload = (document: Document) => {
        // Создаем ссылку для скачивания файла
        const link = window.document.createElement('a');
        link.href = document.filePath;
        link.download = document.name;
        window.document.body.appendChild(link);
        link.click();
        window.document.body.removeChild(link);
    };

    return (
        <div>
            <DocumentsTable
                documents={documents}
                loading={loading}
                offset={offset}
                limit={limit}
                total={total}
                onPageChange={handlePageChange}
                onDownload={handleDownload}
            />
        </div>
    );
};

export default DocumentsSubpage;
