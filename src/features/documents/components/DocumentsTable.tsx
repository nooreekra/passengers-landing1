import React from "react";
import { Document } from "@/entities/documents/types";
import Pagination from "@/shared/ui/Pagination";
import Loader from "@/shared/ui/Loader";
import { useTranslation } from "react-i18next";
import { DocumentsIcon } from "@/shared/icons";

interface Props {
    documents: Document[];
    loading: boolean;
    offset: number;
    limit: number;
    total: number;
    onPageChange: (newOffset: number) => void;
    onDownload?: (document: Document) => void;
}

const DocumentsTable = ({ documents, loading, offset, limit, total, onPageChange, onDownload }: Props) => {
    const { t } = useTranslation();

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('ru-RU', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getFileExtension = (filePath: string) => {
        return filePath.split('.').pop()?.toUpperCase() || '';
    };

    if (loading) return <Loader text={t("documents.loading", "Загрузка документов...")} />;

    return (
        <div className="rounded-lg w-full">
            <div className="bg-white w-full overflow-x-auto">
                <table className="w-full bg-white shadow-md table-auto text-sm border border-border-default">
                    <thead className="bg-gray-100 text-left border-b border-border-default">
                        <tr className="text-label-secondary body-M-semibold">
                            <th className="px-4 py-7 border border-border-default whitespace-nowrap">
                                {t("documents.name", "Название")}
                            </th>
                            <th className="px-4 py-7 border border-border-default whitespace-nowrap">
                                {t("documents.type", "Тип")}
                            </th>
                            <th className="px-4 py-7 border border-border-default whitespace-nowrap">
                                {t("documents.description", "Описание")}
                            </th>
                            <th className="px-4 py-7 border border-border-default whitespace-nowrap">
                                {t("documents.actions", "Действия")}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {documents?.map((document) => (
                            <tr
                                key={document.id}
                                className="hover:bg-gray-50 border-border-default border-t text-label-primary body-M-regular"
                            >
                                <td className="px-4 py-2 border border-border-default whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 text-gray-500">
                                            <DocumentsIcon stroke="currentColor" />
                                        </div>
                                        <span className="font-medium">{document.name}</span>
                                    </div>
                                </td>
                                
                                <td className="px-4 py-2 border border-border-default whitespace-nowrap">
                                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                        {document.typeName}
                                    </span>
                                </td>
                                
                                <td className="px-4 py-2 border border-border-default">
                                    <span className="text-gray-600">
                                        {document.description || "-"}
                                    </span>
                                </td>
                                
                                <td className="px-4 py-2 border border-border-default whitespace-nowrap">
                                    <div className="flex gap-2">
                                        {onDownload && (
                                            <button
                                                onClick={() => onDownload(document)}
                                                className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                            >
                                                {t("documents.download", "Скачать")}
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {documents.length === 0 && !loading && (
                <div className="text-center py-12">
                    <div className="w-12 h-12 text-gray-400 mx-auto mb-4">
                        <DocumentsIcon stroke="currentColor" />
                    </div>
                    <p className="text-gray-500 text-lg">
                        {t("documents.no_documents", "Документы не найдены")}
                    </p>
                </div>
            )}

            <div className="w-full flex justify-end p-4">
                <Pagination total={total} offset={offset} limit={limit} onPageChange={onPageChange} />
            </div>
        </div>
    );
};

export default DocumentsTable;
