"use client"

import React, { useState, useEffect } from 'react';
import { useTranslation } from "react-i18next";
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { RequisitesDisplay, RequisitesEditModal, ConfirmModal } from '@/shared/ui';
import type { Requisites, CreateRequisitesPayload, UpdateRequisitesPayload } from '@/entities/requisites/types';
import { requisitesApi } from '@/shared/api/requisites';
import { banksApi, type Bank } from '@/shared/api/banks';
import { usePermission } from '@/shared/lib/usePermission';

export default function RequisitesPage() {
    const { t, i18n } = useTranslation();
    const business = useSelector((state: RootState) => state.business.current);
    const canWriteRequisites = usePermission("requisite:write");
    const [requisites, setRequisites] = useState<Requisites[]>([]);
    const [loading, setLoading] = useState(true);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deletingRequisite, setDeletingRequisite] = useState<Requisites | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (business?.id) {
            loadRequisites();
        }
    }, [business?.id]);

    const loadRequisites = async () => {
        if (!business?.id) return;
        
        try {
            setLoading(true);
            setError(null);
            const response = await requisitesApi.getRequisites(business.id);
            
            if (response.items.length > 0) {
                const banksResponse = await banksApi.getBanks({ language: i18n.language });
                
                const requisitesWithBankBic = response.items.map((requisite: Requisites) => {
                    const bank = banksResponse.items.find((b: Bank) => b.id === requisite.bankId);
                    return {
                        ...requisite,
                        bankBic: bank?.bic
                    };
                });
                
                setRequisites(requisitesWithBankBic);
            } else {
                setRequisites([]);
            }
        } catch (err) {
            console.error('Failed to load requisites:', err);
            setError(t('common.loadFail', 'Не удалось загрузить данные'));
        } finally {
            setLoading(false);
        }
    };

    const [editingRequisite, setEditingRequisite] = useState<Requisites | null>(null);

    const handleEdit = (requisite: Requisites) => {
        setEditingRequisite(requisite);
        setEditModalOpen(true);
    };

    const handleAdd = () => {
        setEditingRequisite(null);
        setEditModalOpen(true);
    };

    const handleDelete = (requisite: Requisites) => {
        setDeletingRequisite(requisite);
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!business?.id || !deletingRequisite?.id) return;

        try {
            await requisitesApi.deleteRequisites(business.id, deletingRequisite.id);
            await loadRequisites();
            setDeleteModalOpen(false);
            setDeletingRequisite(null);
        } catch (err) {
            console.error('Failed to delete requisite:', err);
            setError(t('common.loadFail', 'Не удалось удалить реквизиты'));
        }
    };

    const handleSave = async (payload: CreateRequisitesPayload | UpdateRequisitesPayload) => {
        if (!business?.id) return;

        try {
            if ('id' in payload && payload.id) {
                await requisitesApi.updateRequisites(business.id, payload.id, payload);
            } else {
                await requisitesApi.createRequisites(business.id, payload);
            }
            
            await loadRequisites();
        } catch (err) {
            console.error('Failed to save requisites:', err);
            throw err;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">{t('common.loading')}</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-red-500">{error}</div>
            </div>
        );
    }

    return (
        <div>
            <RequisitesDisplay 
                requisites={requisites} 
                onEdit={canWriteRequisites ? handleEdit : undefined}
                onAdd={canWriteRequisites ? handleAdd : undefined}
                onDelete={canWriteRequisites ? handleDelete : undefined}
            />
            
            {canWriteRequisites && (
                <>
                    <RequisitesEditModal
                        open={editModalOpen}
                        onClose={() => setEditModalOpen(false)}
                        onSave={handleSave}
                        initialData={editingRequisite || undefined}
                        businessId={business?.id || ''}
                    />

                    <ConfirmModal
                        open={deleteModalOpen}
                        onClose={() => setDeleteModalOpen(false)}
                        onConfirm={confirmDelete}
                        title={t('requisites.deleteTitle', 'Удалить реквизиты')}
                        text={t('requisites.deleteText', 'Вы уверены, что хотите удалить эти реквизиты? Это действие нельзя отменить.')}
                        confirmText={t('common.delete')}
                        cancelText={t('common.cancel')}
                        danger={true}
                    />
                </>
            )}
        </div>
    );
}
