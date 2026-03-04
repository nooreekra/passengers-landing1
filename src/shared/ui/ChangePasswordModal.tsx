"use client";

import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "./Button";
import { Input } from "./Input";
import { changePassword } from "@/shared/api/auth";

interface ChangePasswordModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

interface PasswordValidation {
    minLength: boolean;
    hasUpperCase: boolean;
    hasLowerCase: boolean;
    hasNumber: boolean;
    hasSpecialChar: boolean;
}

const validatePassword = (password: string): PasswordValidation => ({
    minLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
});

const isPasswordValid = (validation: PasswordValidation): boolean => {
    return Object.values(validation).every(Boolean);
};

export default function ChangePasswordModal({ open, onClose, onSuccess }: ChangePasswordModalProps) {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    
    const [formData, setFormData] = useState({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    const [validation, setValidation] = useState<PasswordValidation>({
        minLength: false,
        hasUpperCase: false,
        hasLowerCase: false,
        hasNumber: false,
        hasSpecialChar: false,
    });

    const [touched, setTouched] = useState({
        oldPassword: false,
        newPassword: false,
        confirmPassword: false,
    });

    const handleInputChange = (field: keyof typeof formData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setError(null);
        
        if (field === "newPassword") {
            setValidation(validatePassword(value));
        }
        
        setTouched(prev => ({ ...prev, [field]: true }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        // Валидация
        if (!formData.oldPassword) {
            setError(t("auth.changePassword.errors.enterCurrentPassword"));
            setLoading(false);
            return;
        }

        if (!isPasswordValid(validation)) {
            setError(t("auth.changePassword.errors.passwordNotMeetRequirements"));
            setLoading(false);
            return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            setError(t("auth.changePassword.errors.passwordsDoNotMatch"));
            setLoading(false);
            return;
        }

        if (formData.oldPassword === formData.newPassword) {
            setError(t("auth.changePassword.errors.newPasswordSameAsOld"));
            setLoading(false);
            return;
        }

        try {
            await changePassword(formData.oldPassword, formData.newPassword);
            
            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                onClose();
                onSuccess?.();
                resetForm();
            }, 2000);

        } catch (err: any) {
            const errorMessage = err?.response?.data?.message || err?.message || t("auth.changePassword.errors.genericError");
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            oldPassword: "",
            newPassword: "",
            confirmPassword: "",
        });
        setValidation({
            minLength: false,
            hasUpperCase: false,
            hasLowerCase: false,
            hasNumber: false,
            hasSpecialChar: false,
        });
        setTouched({
            oldPassword: false,
            newPassword: false,
            confirmPassword: false,
        });
        setError(null);
    };

    const handleClose = () => {
        if (!loading) {
            resetForm();
            onClose();
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-[500px] w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold text-gray-900">
                            {success ? t("auth.changePassword.successTitle") : t("auth.changePassword.title")}
                        </h2>
                        {!success && (
                            <button
                                onClick={handleClose}
                                disabled={loading}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>

                    {success ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <p className="text-green-600 font-medium">{t("auth.changePassword.successMessage")}</p>
                            <p className="text-gray-500 text-sm mt-2">{t("auth.changePassword.autoCloseMessage")}</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                                    <p className="text-red-600 text-sm">{error}</p>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t("auth.changePassword.currentPassword")}
                                </label>
                                <Input
                                    type="password"
                                    value={formData.oldPassword}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange("oldPassword", e.target.value)}
                                    error={touched.oldPassword && !formData.oldPassword ? t("auth.changePassword.errors.enterCurrentPassword") : undefined}
                                    disabled={loading}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t("auth.changePassword.newPassword")}
                                </label>
                                <Input
                                    type="password"
                                    value={formData.newPassword}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange("newPassword", e.target.value)}
                                    error={touched.newPassword && !isPasswordValid(validation) ? t("auth.changePassword.errors.passwordNotMeetRequirementsField") : undefined}
                                    disabled={loading}
                                    required
                                />
                                
                                {formData.newPassword && (
                                    <div className="mt-2 space-y-1">
                                        <div className="text-xs text-gray-600 font-medium">{t("auth.changePassword.requirements")}</div>
                                        <div className="space-y-1">
                                            <div className={`flex items-center gap-2 text-xs ${validation.minLength ? "text-green-600" : "text-gray-400"}`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${validation.minLength ? "bg-green-500" : "bg-gray-300"}`} />
                                                {t("auth.changePassword.minLength")}
                                            </div>
                                            <div className={`flex items-center gap-2 text-xs ${validation.hasUpperCase ? "text-green-600" : "text-gray-400"}`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${validation.hasUpperCase ? "bg-green-500" : "bg-gray-300"}`} />
                                                {t("auth.changePassword.hasUpperCase")}
                                            </div>
                                            <div className={`flex items-center gap-2 text-xs ${validation.hasLowerCase ? "text-green-600" : "text-gray-400"}`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${validation.hasLowerCase ? "bg-green-500" : "bg-gray-300"}`} />
                                                {t("auth.changePassword.hasLowerCase")}
                                            </div>
                                            <div className={`flex items-center gap-2 text-xs ${validation.hasNumber ? "text-green-600" : "text-gray-400"}`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${validation.hasNumber ? "bg-green-500" : "bg-gray-300"}`} />
                                                {t("auth.changePassword.hasNumber")}
                                            </div>
                                            <div className={`flex items-center gap-2 text-xs ${validation.hasSpecialChar ? "text-green-600" : "text-gray-400"}`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${validation.hasSpecialChar ? "bg-green-500" : "bg-gray-300"}`} />
                                                {t("auth.changePassword.hasSpecialChar")}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t("auth.changePassword.confirmPassword")}
                                </label>
                                <Input
                                    type="password"
                                    value={formData.confirmPassword}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange("confirmPassword", e.target.value)}
                                    error={
                                        touched.confirmPassword && formData.confirmPassword && formData.newPassword !== formData.confirmPassword
                                            ? t("auth.changePassword.errors.passwordsDoNotMatchField")
                                            : undefined
                                    }
                                    disabled={loading}
                                    required
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleClose}
                                    disabled={loading}
                                    className="flex-1"
                                >
                                   <p className="text-center">{t("auth.changePassword.cancel")}</p> 
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={loading || !isPasswordValid(validation) || formData.newPassword !== formData.confirmPassword || !formData.oldPassword}
                                    className="flex-1"
                                >
                                    <p className="text-center">{loading ? t("auth.changePassword.saving") : t("auth.changePassword.submit")}</p>
                                </Button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
