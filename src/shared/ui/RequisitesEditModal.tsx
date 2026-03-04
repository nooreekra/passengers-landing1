import React, { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useTranslation } from 'react-i18next';
import { Requisites, CreateRequisitesPayload, UpdateRequisitesPayload } from '@/entities/requisites/types';
import { Bank } from '@/shared/api/banks';
import { banksApi } from '@/shared/api/banks';
import SelectOne from './SelectOne';
import { Input } from './Input';
import Button from './Button';

interface RequisitesEditModalProps {
    open: boolean;
    onClose: () => void;
    onSave: (payload: CreateRequisitesPayload | UpdateRequisitesPayload) => Promise<void>;
    initialData?: Requisites;
    businessId: string;
}

export function RequisitesEditModal({
    open,
    onClose,
    onSave,
    initialData,
    businessId
}: RequisitesEditModalProps) {
    const { t, i18n } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [banks, setBanks] = useState<Bank[]>([]);
    const [formData, setFormData] = useState({
        bankId: '',
        uin: '',
        accountNumber: '',
        legalName: '',
        legalAddress: ''
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Загружаем банки при открытии модального окна
    useEffect(() => {
        if (open) {
            loadBanks();
        }
    }, [open]);

    // Перезагружаем банки при изменении языка
    useEffect(() => {
        if (open) {
            loadBanks();
        }
    }, [i18n.language]);

    // Заполняем форму данными при редактировании
    useEffect(() => {
        if (initialData) {
            setFormData({
                bankId: initialData.bankId || '',
                uin: initialData.uin || '',
                accountNumber: initialData.accountNumber || '',
                legalName: initialData.legalName || '',
                legalAddress: initialData.legalAddress || ''
            });
        } else {
            setFormData({
                bankId: '',
                uin: '',
                accountNumber: '',
                legalName: '',
                legalAddress: ''
            });
        }
        setErrors({});
    }, [initialData, open]);

    const loadBanks = async () => {
        try {
            const response = await banksApi.getBanks({ 
                limit: 100,
                language: i18n.language
            });
            setBanks(response.items);
        } catch (error) {
            console.error('Failed to load banks:', error);
        }
    };

    const formatAccountNumber = (value: string) => {
        // Убираем все пробелы и приводим к верхнему регистру
        const cleaned = value.replace(/\s/g, '').toUpperCase();
        
        // Ограничиваем до 34 символов (максимальная длина IBAN)
        return cleaned.slice(0, 34);
    };

    const formatBin = (value: string) => {
        // Убираем все нецифровые символы
        const digitsOnly = value.replace(/\D/g, '');
        // Ограничиваем до 12 цифр
        return digitsOnly.slice(0, 12);
    };

    const handleInputChange = (field: string, value: string) => {
        let processedValue = value;
        
        // Специальная обработка для номера счета
        if (field === 'accountNumber') {
            processedValue = formatAccountNumber(value);
        }
        // Специальная обработка для БИН
        else if (field === 'uin') {
            processedValue = formatBin(value);
        }
        
        setFormData(prev => ({ ...prev, [field]: processedValue }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.bankId) {
            newErrors.bankId = t('common.required', 'Обязательное поле');
        }
        if (!formData.uin.trim()) {
            newErrors.uin = t('common.required', 'Обязательное поле');
        } else {
            // Валидация БИН: должен содержать ровно 12 цифр
            if (!/^\d{12}$/.test(formData.uin)) {
                newErrors.uin = t('requisites.validation.bin', 'БИН должен содержать ровно 12 цифр');
            }
        }
        if (!formData.accountNumber.trim()) {
            newErrors.accountNumber = t('common.required', 'Обязательное поле');
        } else {
            const cleaned = formData.accountNumber.replace(/\s/g, '').toUpperCase();
            
            // Проверяем, является ли это IBAN (начинается с 2 букв, за которыми следуют цифры)
            const ibanMatch = cleaned.match(/^([A-Z]{2})(\d+)$/);
            
            if (ibanMatch) {
                const [, countryCode, digits] = ibanMatch;
                const totalLength = countryCode.length + digits.length;
                
                // IBAN должен быть от 15 до 34 символов
                if (totalLength < 15 || totalLength > 34) {
                    newErrors.accountNumber = t('requisites.validation.accountNumberIbanLength', 'IBAN должен содержать от 15 до 34 символов');
                } else if (digits.length < 13 || digits.length > 32) {
                    newErrors.accountNumber = t('requisites.validation.accountNumberIbanDigits', 'IBAN должен содержать от 13 до 32 цифр после кода страны');
                }
            } else {
                // Валидация для обычного номера счета: от 8 до 34 символов (буквы и цифры)
                if (cleaned.length < 8 || cleaned.length > 34) {
                    newErrors.accountNumber = t('requisites.validation.accountNumberLength', 'Номер счета должен содержать от 8 до 34 символов');
                }
            }
        }
        if (!formData.legalName.trim()) {
            newErrors.legalName = t('common.required', 'Обязательное поле');
        }
        if (!formData.legalAddress.trim()) {
            newErrors.legalAddress = t('common.required', 'Обязательное поле');
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validateForm()) return;

        setLoading(true);
        try {
            const payload = {
                bankId: formData.bankId,
                uin: formData.uin.trim(),
                accountNumber: formData.accountNumber.replace(/\s/g, ''), // Убираем пробелы при сохранении
                legalName: formData.legalName.trim(),
                legalAddress: formData.legalAddress.trim(),
                ...(initialData && { id: initialData.id })
            };

            await onSave(payload);
            onClose();
        } catch (error) {
            console.error('Failed to save requisites:', error);
        } finally {
            setLoading(false);
        }
    };

    const bankOptions = banks.map(bank => ({
        value: bank.id,
        label: `${bank.name} (${bank.bic})`
    }));

    const input = "w-full rounded-lg border px-2 py-1.5 text-sm";

    return (
        <Transition appear show={open} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={() => !loading && onClose()}>
                <Transition.Child as={Fragment} enter="ease-out duration-150" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-black/30" />
                </Transition.Child>
                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child as={Fragment} enter="ease-out duration-150" enterFrom="opacity-0 translate-y-2" enterTo="opacity-100 translate-y-0" leave="ease-in duration-100" leaveFrom="opacity-100 translate-y-0" leaveTo="opacity-0 translate-y-2">
                            <Dialog.Panel className="w-full max-w-md rounded-2xl bg-white p-4 shadow">
                                <Dialog.Title className="text-lg font-semibold mb-4">
                                    {initialData ? t('requisites.editTitle', 'Редактировать реквизиты') : t('requisites.createTitle', 'Создать реквизиты')}
                                </Dialog.Title>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            {t('requisites.fields.bank')}
                                        </label>
                                        <SelectOne
                                            opts={bankOptions}
                                            value={formData.bankId}
                                            onChange={(value: string) => handleInputChange('bankId', value)}
                                            placeholder={t('common.selectBank', 'Выберите банк')}
                                        />
                                        {errors.bankId && <div className="mt-1 text-sm text-red-600">{errors.bankId}</div>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            {t('requisites.fields.bin')}
                                        </label>
                                        <Input
                                            type="text"
                                            value={formData.uin}
                                            onChange={(e) => handleInputChange('uin', e.target.value)}
                                            className={input}
                                        />
                                        {errors.uin && <div className="mt-1 text-sm text-red-600">{errors.uin}</div>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            {t('requisites.fields.accountNumber')}
                                        </label>
                                        <Input
                                            type="text"
                                            value={formData.accountNumber}
                                            onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                                            className={input}
                                        />
                                        {errors.accountNumber && <div className="mt-1 text-sm text-red-600">{errors.accountNumber}</div>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            {t('requisites.fields.legalName')}
                                        </label>
                                        <Input
                                            type="text"
                                            value={formData.legalName}
                                            onChange={(e) => handleInputChange('legalName', e.target.value)}
                                            className={input}
                                            placeholder={t('requisites.fields.legalNamePlaceholder', 'Введите название юридического лица')}
                                        />
                                        {errors.legalName && <div className="mt-1 text-sm text-red-600">{errors.legalName}</div>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            {t('requisites.fields.legalAddress')}
                                        </label>
                                        <Input
                                            type="text"
                                            value={formData.legalAddress}
                                            onChange={(e) => handleInputChange('legalAddress', e.target.value)}
                                            className={input}
                                            placeholder={t('requisites.fields.legalAddressPlaceholder', 'Введите юридический адрес')}
                                        />
                                        {errors.legalAddress && <div className="mt-1 text-sm text-red-600">{errors.legalAddress}</div>}
                                    </div>
                                </div>

                                <div className="mt-6 flex justify-end gap-2">
                                    <Button onClick={onClose} disabled={loading} className="px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50 text-sm">
                                        <p className="text-black">{t('common.cancel')}</p>
                                    </Button>
                                    <Button onClick={handleSave} disabled={loading} className="px-3 py-1.5 rounded-lg bg-black text-white disabled:opacity-50 text-sm">
                                        {loading ? t('common.saving') : t('common.save')}
                                    </Button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
