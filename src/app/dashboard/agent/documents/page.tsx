"use client"

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const DocumentsPage = () => {
    const router = useRouter();

    useEffect(() => {
        // Перенаправляем на подраздел Invoices по умолчанию
        router.replace('/dashboard/agent/documents/invoices');
    }, [router]);

    return null;
};

export default DocumentsPage;