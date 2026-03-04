"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Input, Textarea } from "@/shared/ui/Input";
import Dropzone from "@/shared/ui/Dropzone";
import Button from "@/shared/ui/Button";
import InfoTooltip from "@/shared/ui/InfoTooltip";

import { usePromoWizard } from "@/features/promo/lib/PromoWizardContext";
import { useUploadToBlob } from "@/shared/lib/useUploadToBlob";
import { createPromo } from "@/features/promo/api/promos";

import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import { useTranslation } from "react-i18next";
import { getCurrentBusiness } from "@/shared/api/business";
import { getMe } from "@/shared/api/auth";
import { setBusiness } from "@/store/slices/businessSlice";
import { setUser } from "@/store/slices/userSlice";

export default function AddPromoStep1() {
    const { t } = useTranslation();
    const REQ = t("promo.required");

    const schema = z
        .object({
            name: z.string().trim().min(3, REQ),
            description: z.string().trim().min(3, REQ),
            ruleDescription: z.string().trim().min(3, REQ),
            desktopImage: z.instanceof(File).optional(),
            desktopImageUri: z.string().url().optional(),
            mobileImage: z.instanceof(File).optional(),
            mobileImageUri: z.string().url().optional(),
        })
        .refine((d) => (!!d.desktopImage || !!d.desktopImageUri) && (!!d.mobileImage || !!d.mobileImageUri), {
            path: ["desktopImage"],
            message: REQ,
        });

    type FormValues = z.infer<typeof schema>;
    const router = useRouter();
    const dispatch = useDispatch();

    const businessId = useSelector(
        (s: RootState) => s.business.current?.id
    ) as string | undefined;

    const { data, setData } = usePromoWizard();
    const { upload, state: uploadState } = useUploadToBlob();

    const {
        control,
        register,
        setValue,
        watch,
        handleSubmit,
        formState: { errors },
    } = useForm<FormValues>({
        resolver: zodResolver(schema),
        mode: "onChange",
        defaultValues: {
            name: data.name,
            description: data.description,
            ruleDescription: data.ruleDescription,
            desktopImageUri: undefined,
            mobileImageUri: undefined,
        },
    });

    useEffect(() => {
        register("desktopImage");
        register("mobileImage");
    }, [register]);

    const desktopFile = watch("desktopImage");
    const desktopUri = watch("desktopImageUri");
    const mobileFile = watch("mobileImage");
    const mobileUri = watch("mobileImageUri");
    const [desktopPreview, setDesktopPreview] = useState<string | undefined>();
    const [mobilePreview, setMobilePreview] = useState<string | undefined>();
    useEffect(() => {
        if (!desktopFile) return setDesktopPreview(undefined);
        const url = URL.createObjectURL(desktopFile);
        setDesktopPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [desktopFile]);
    useEffect(() => {
        if (!mobileFile) return setMobilePreview(undefined);
        const url = URL.createObjectURL(mobileFile);
        setMobilePreview(url);
        return () => URL.revokeObjectURL(url);
    }, [mobileFile]);

    const onSubmit = async (form: FormValues) => {
        try {
            const existingId = data.promoId;
            if (existingId) {
                setData({
                    ...data,
                    name: form.name,
                    description: form.description,
                    ruleDescription: form.ruleDescription,
                });
                router.push(`/dashboard/partnership/promos/add/step-2?promoId=${existingId}`);
                return;
            }

            let desktop = form.desktopImageUri;
            if (!desktop && form.desktopImage) desktop = await upload(form.desktopImage);
            let mobile = form.mobileImageUri;
            if (!mobile && form.mobileImage) mobile = await upload(form.mobileImage);

            if (businessId) {
                const promo = await createPromo({
                    type: "Partner",
                    name: form.name,
                    description: form.description,
                    ruleDescription: form.ruleDescription,
                    images: [
                        { imageUri: desktop || "", isMobile: false },
                        { imageUri: mobile || "", isMobile: true },
                    ],
                    businessId,
                });

                setData({
                    ...data,
                    name: promo.name,
                    description: promo.description,
                    ruleDescription: promo.ruleDescription,
                    promoId: promo.id,
                });

                router.push(`/dashboard/partnership/promos/add/step-2?promoId=${promo.id}`);
            } else {
                const [business, user] = await Promise.all([getCurrentBusiness(), getMe()]);
                dispatch(setBusiness(business));
                dispatch(setUser(user));
            }
        } catch (e: any) {
            console.error(e);
            alert(e?.response?.data?.message || e?.message || t("promo.create_promo_failed"));
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
                    <Dropzone
                        preview={desktopUri || desktopPreview}
                        onSelect={async (f) => {
                            setValue("desktopImage", f, { shouldValidate: true });
                            try {
                                const url = await upload(f);
                                setValue("desktopImageUri", url, { shouldValidate: true });
                            } catch (e) { console.error(e); }
                        }}
                        error={errors.desktopImage?.message}
                    />
                </div>

                <div className="space-y-4 bg-white shadow p-7 rounded-xl relative">
                    <div className="flex items-center gap-2">
                        <p className="body-L-semibold">{t("promo.visual_materials")} — Mobile</p>
                        <InfoTooltip text={t("promo.image_aspect_ratio_tooltip_mobile")} position="top" />
                    </div>
                    <Dropzone
                        preview={mobileUri || mobilePreview}
                        onSelect={async (f) => {
                            setValue("mobileImage", f, { shouldValidate: true });
                            try {
                                const url = await upload(f);
                                setValue("mobileImageUri", url, { shouldValidate: true });
                            } catch (e) { console.error(e); }
                        }}
                        error={errors.mobileImage?.message}
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
                <Button type="submit" disabled={uploadState === "uploading"}>
                    {uploadState === "uploading" ? t("promo.uploading") : t("promo.continue")}
                </Button>
            </div>
        </form>
    );
}