"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Input, Textarea } from "@/shared/ui/Input";
import Dropzone from "@/shared/ui/Dropzone";
import Button from "@/shared/ui/Button";
import InfoTooltip from "@/shared/ui/InfoTooltip";
import { useUploadToBlob } from "@/shared/lib/useUploadToBlob";
import { getPromoById, updatePartnerPromo } from "@/features/promo/api/promos";
import { useTranslation } from "react-i18next";
import Loader from "@/shared/ui/Loader";
import { usePromoWizard } from "@/features/promo/lib/PromoWizardContext";

const schema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().min(1, "Description is required"),
    ruleDescription: z.string().min(1, "Rule description is required"),
    desktopImageUri: z.string().optional(),
    desktopImageFile: z.any().optional(),
    mobileImageUri: z.string().optional(),
    mobileImageFile: z.any().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function EditPromoStep1() {
    const params = useParams();
    const promoId = params?.promoId as string | undefined;
    const router = useRouter();
    const { t } = useTranslation();
    const { upload } = useUploadToBlob();
    const { data, setData } = usePromoWizard();

    const [submitting, setSubmitting] = useState(false);
    const [hasLoaded, setHasLoaded] = useState(false);

    const {
        control,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            name: "",
            description: "",
            ruleDescription: "",
            desktopImageUri: "",
            desktopImageFile: undefined,
            mobileImageUri: "",
            mobileImageFile: undefined,
        },
    });

    const desktopImageUri = watch("desktopImageUri");
    const desktopImageFile = watch("desktopImageFile");
    const mobileImageUri = watch("mobileImageUri");
    const mobileImageFile = watch("mobileImageFile");

    useEffect(() => {
        if (data && !hasLoaded) {
            setValue("name", data.name || "");
            setValue("description", data.description || "");
            setValue("ruleDescription", data.ruleDescription || "");
            // We don't have separate URIs from backend; keep as blank by default
            setHasLoaded(true);
        }
    }, [data, setValue, hasLoaded]);

    const desktopPreview = desktopImageFile ? URL.createObjectURL(desktopImageFile) : undefined;
    const mobilePreview = mobileImageFile ? URL.createObjectURL(mobileImageFile) : undefined;

    const onSubmit = async (form: FormValues) => {
        if (!promoId) return;

        try {
            setSubmitting(true);

            let desktopUrl = form.desktopImageUri;
            if (!desktopUrl && form.desktopImageFile) desktopUrl = await upload(form.desktopImageFile);
            let mobileUrl = form.mobileImageUri;
            if (!mobileUrl && form.mobileImageFile) mobileUrl = await upload(form.mobileImageFile);

            await updatePartnerPromo(promoId as string, {
                type: "Partner",
                name: form.name,
                description: form.description,
                ruleDescription: form.ruleDescription,
                images: [
                    { imageUri: desktopUrl || "", isMobile: false },
                    { imageUri: mobileUrl || "", isMobile: true },
                ],
            });
            
            setData((prevData) => ({
                ...prevData,
                name: form.name,
                description: form.description,
                ruleDescription: form.ruleDescription,
                imageUri: desktopUrl || prevData.imageUri,
            }));

            // Переходим к следующему шагу
            router.push(`/dashboard/partnership/promos/${promoId}/edit/step-2`);
        } catch (error: any) {
            console.error("Failed to update promo:", error);
            alert(error?.response?.data?.message || error?.message || t("promo.update_promo_failed"));
        } finally {
            setSubmitting(false);
        }
    };


    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 pb-20">
            <div className="grid lg:grid-cols-2 gap-6">
                <div className="space-y-4 bg-white shadow p-7 rounded-xl">
                    <p className="body-L-semibold">{t("promo.basic_information")}</p>

                    <Controller
                        name="name"
                        control={control}
                        render={({ field, fieldState }) => (
                            <Input
                                placeholder={t("promo.promo_name")}
                                value={field.value ?? ""}
                                onChange={field.onChange}
                                onBlur={field.onBlur}
                                error={fieldState.error?.message}
                            />
                        )}
                    />

                    <Controller
                        name="description"
                        control={control}
                        render={({ field, fieldState }) => (
                            <Textarea
                                placeholder={t("promo.promo_description_short")}
                                value={field.value ?? ""}
                                onChange={field.onChange}
                                onBlur={field.onBlur}
                                error={fieldState.error?.message}
                            />
                        )}
                    />
                </div>

                <div className="space-y-4 bg-white shadow p-7 rounded-xl relative">
                    <div className="flex items-center gap-2">
                        <p className="body-L-semibold">{t("promo.visual_materials")} — Desktop</p>
                        <InfoTooltip text={t("promo.image_aspect_ratio_tooltip")} position="top" />
                    </div>
                    <Controller
                        name="desktopImageFile"
                        control={control}
                        render={({ field: { onChange } }) => (
                            <Dropzone
                                preview={desktopImageUri || desktopPreview}
                                onSelect={async (f) => {
                                    onChange(f);
                                    try {
                                        const url = await upload(f);
                                        setValue("desktopImageUri", url, { shouldValidate: true });
                                    } catch (e) { console.error(e); }
                                }}
                                error={undefined}
                            />
                        )}
                    />
                </div>

                <div className="space-y-4 bg-white shadow p-7 rounded-xl relative">
                    <div className="flex items-center gap-2">
                        <p className="body-L-semibold">{t("promo.visual_materials")} — Mobile</p>
                        <InfoTooltip text={t("promo.image_aspect_ratio_tooltip_mobile")} position="top" />
                    </div>
                    <Controller
                        name="mobileImageFile"
                        control={control}
                        render={({ field: { onChange } }) => (
                            <Dropzone
                                preview={mobileImageUri || mobilePreview}
                                onSelect={async (f) => {
                                    onChange(f);
                                    try {
                                        const url = await upload(f);
                                        setValue("mobileImageUri", url, { shouldValidate: true });
                                    } catch (e) { console.error(e); }
                                }}
                                error={undefined}
                            />
                        )}
                    />
                </div>
            </div>

            <div className="space-y-4 shadow bg-white p-7 rounded-xl">
                <p className="body-L-semibold">{t("promo.promo_rules")}</p>

                <Controller
                    name="ruleDescription"
                    control={control}
                    render={({ field, fieldState }) => (
                        <Textarea
                            placeholder={t("promo.promo_description_rules")}
                            rows={5}
                            value={field.value ?? ""}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            error={fieldState.error?.message}
                        />
                    )}
                />
            </div>

            <div className="flex justify-end">
                <Button type="submit" disabled={submitting}>
                    {submitting ? t("common.saving") : t("promo.continue")}
                </Button>
            </div>
        </form>
    );
}
