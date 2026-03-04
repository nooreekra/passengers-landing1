"use client";

import { useRouter } from "next/navigation";
import {
    useForm,
    Controller,
    useFieldArray,
    Control,
    useWatch, useFormContext, FormProvider,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Select from "react-select";

import Button from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import {
    baseSelectStyles,
    menuOptionStyles,
} from "@/shared/ui/selectStyles";
import { usePromoWizard } from "@/features/promo/lib/PromoWizardContext";

import {
    incentivesSchema,
    FormValues,
    audienceOptions,
    incentiveOptions,
    paidPerOptions,
    currencyOptions,
    bookingClassSegments,
    Option,
    IncentiveType,
    TargetAudienceType,
} from "@/entities/incentive/types";
import SelectOne from "@/shared/ui/SelectOne";
import { updatePromoRewards } from "@/features/promo/api/promos";
import {ApiIncentivePayload} from "@/entities/promo/types";
import {useSelector} from "react-redux";
import {RootState} from "@/store";
import TrashIcon from "@/shared/icons/TrashIcon";
import {useEffect, useState, useMemo} from "react";
import {toast} from "react-toastify";
import {useTranslation} from "react-i18next";
import { subscriptionApi } from "@/features/subscription/api/subscriptions";
import type { SubscriptionPlan, Subscription } from "@/entities/subscription/types";
import InfoTooltip from "@/shared/ui/InfoTooltip";

const sx = { ...baseSelectStyles, ...menuOptionStyles };

export default function AddPromoStep4() {
    const { t, i18n } = useTranslation();
    const router = useRouter();
    const { data, setData } = usePromoWizard();
    const businessId = useSelector((state: RootState) => state.business.current?.id);
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);

    // Проверяем, есть ли активная подписка на "Travel Agency / Travel Agent Module"
    const hasActiveTravelAgencySubscription = useMemo(() => {
        if (!plans.length || !subscriptions.length) return true; // По умолчанию показываем опции
        
        // Находим план "Travel Agency / Travel Agent Module"
        const travelAgencyPlan = plans.find(plan => 
            plan.name.toLowerCase().includes("travel agency") && 
            plan.name.toLowerCase().includes("travel agent")
        );
        
        if (!travelAgencyPlan) return true; // Если план не найден, показываем опции
        
        // Проверяем, есть ли активная подписка на этот план
        // Подписка активна только если endDate не null
        return subscriptions.some(sub => 
            sub.plan.id === travelAgencyPlan.id && 
            sub.endDate !== null
        );
    }, [plans, subscriptions]);

    // Фильтруем опции аудитории в зависимости от подписки
    const filteredAudienceOptions = useMemo(() => {
        if (hasActiveTravelAgencySubscription) {
            return audienceOptions;
        }
        // Если подписка неактивна, скрываем TravelAgency и TravelAgent
        return audienceOptions.filter(opt => 
            opt.value !== "TravelAgency" && opt.value !== "TravelAgent"
        );
    }, [hasActiveTravelAgencySubscription]);

    // Загружаем подписки и планы
    useEffect(() => {
        if (!businessId) return;
        
        const loadData = async () => {
            try {
                const [plansData, subscriptionsData] = await Promise.all([
                    subscriptionApi.getPlans(businessId, i18n.language),
                    subscriptionApi.getSubscriptions(businessId, i18n.language),
                ]);
                setPlans(plansData);
                setSubscriptions(subscriptionsData);
            } catch (error) {
                console.error("Ошибка загрузки подписок:", error);
            }
        };
        
        loadData();
    }, [businessId, i18n.language]);

    useEffect(() => {
        if (!data.name || !data.description || !data.ruleDescription) {
            router.push('/dashboard/airline/promos/add/step-1');
        }
    }, [data, router]);

    const methods = useForm<FormValues>({
        resolver: zodResolver(incentivesSchema),
        defaultValues: Array.isArray(data.incentives) && data.incentives.length > 0
            ? { items: data.incentives as FormValues["items"] }
            : { items: [] },
        mode: "all",
    });

    const { control, handleSubmit, setValue, watch } = methods;
    
    // Отслеживаем значения формы для проверки валидности
    const formItems = watch("items");
    
    // Проверяем, есть ли валидные опции и валидные значения в форме
    const hasValidOptions = filteredAudienceOptions.length > 0;
    const hasValidFormValues = useMemo(() => {
        if (!formItems || formItems.length === 0) return false;
        // Проверяем, что все выбранные значения присутствуют в доступных опциях
        return formItems.every(item => 
            filteredAudienceOptions.some(opt => opt.value === item.targetAudienceType)
        );
    }, [formItems, filteredAudienceOptions]);
    
    const canSave = hasValidOptions && hasValidFormValues;

    const { fields, append, remove } = useFieldArray({
        control,
        name: "items",
    });

    useEffect(() => {
        if (data.incentives && data.incentives.length > 0) {
            setValue("items", data.incentives as FormValues["items"]);
        }
    }, [data.incentives, setValue]);

    // Устанавливаем начальные значения после загрузки подписок
    useEffect(() => {
        // Ждем загрузки подписок и планов
        if (plans.length === 0 || subscriptions.length === 0) return;
        
        const currentItems = methods.getValues("items");
        
        // Если нет элементов в форме (не из data.incentives), устанавливаем первую доступную опцию
        if (!currentItems || currentItems.length === 0) {
            if (filteredAudienceOptions.length > 0) {
                setValue("items", [{
                    targetAudienceType: filteredAudienceOptions[0].value,
                    incentiveType: "Fee" as IncentiveType,
                    rewards: [{
                        type: "Fee" as const,
                        paidPer: "BookingClass" as const,
                        lines: [{ segment: "PerEconomyClassSegment", value: 1, unit: "Fixed" as const }]
                    }]
                }]);
            }
        } else {
            // Если элементы есть, проверяем и обновляем их, если они содержат недоступные опции
            const hasInvalidOptions = currentItems.some(item => 
                (item.targetAudienceType === "TravelAgency" || item.targetAudienceType === "TravelAgent") &&
                !filteredAudienceOptions.some(opt => opt.value === item.targetAudienceType)
            );
            
            if (hasInvalidOptions) {
                const updatedItems = currentItems.map(item => {
                    // Если выбраны TravelAgency или TravelAgent, но их нет в доступных опциях, заменяем на первую доступную
                    if ((item.targetAudienceType === "TravelAgency" || item.targetAudienceType === "TravelAgent") &&
                        !filteredAudienceOptions.some(opt => opt.value === item.targetAudienceType)) {
                        return {
                            ...item,
                            targetAudienceType: filteredAudienceOptions[0]?.value || item.targetAudienceType
                        };
                    }
                    return item;
                }).filter(item => {
                    // Оставляем только элементы с доступными опциями
                    return filteredAudienceOptions.some(opt => opt.value === item.targetAudienceType);
                });
                
                // Если после фильтрации не осталось элементов, создаем новый с первой доступной опцией
                if (updatedItems.length === 0 && filteredAudienceOptions.length > 0) {
                    setValue("items", [{
                        targetAudienceType: filteredAudienceOptions[0].value,
                        incentiveType: "Fee" as IncentiveType,
                        rewards: [{
                            type: "Fee" as const,
                            paidPer: "BookingClass" as const,
                            lines: [{ segment: "PerEconomyClassSegment", value: 1, unit: "Fixed" as const }]
                        }]
                    }]);
                } else if (updatedItems.length > 0) {
                    setValue("items", updatedItems);
                }
            }
        }
    }, [filteredAudienceOptions, plans.length, subscriptions.length, methods, setValue]);

    const onSubmit = async (form: FormValues) => {
        if (!data.promoId || !businessId) return;
        
        // Дополнительная проверка: убеждаемся, что все значения валидны
        const hasInvalidValues = form.items.some(item => 
            !filteredAudienceOptions.some(opt => opt.value === item.targetAudienceType)
        );
        
        if (hasInvalidValues || filteredAudienceOptions.length === 0) {
            toast.error(t("promo.invalid_audience_selection", { defaultValue: "Пожалуйста, выберите валидную целевую аудиторию" }));
            return;
        }

        const payload: ApiIncentivePayload = {
            rewards: form.items.map((item) => {
                const base = {
                    targetAudienceType: item.targetAudienceType,
                    rewardType: item.incentiveType,
                };

                if (item.incentiveType === "Fee") {
                    return {
                        ...base,
                        feeRewards: item.rewards
                            .filter((r): r is Extract<typeof r, { type: "Fee" }> => r.type === "Fee")
                            .map((r) => ({
                                trigger: r.paidPer,
                                feeRewardElements: r.lines.map((line) => ({
                                    bookingClassSegmentType: line.segment,
                                    triggerValue: "",
                                    value: line.value,
                                    valueType: line.unit,
                                })),
                            })),
                    };
                }

                const r = item.rewards.find(r => r.type === "Threshold");
                if (!r || r.type !== "Threshold") return base;

                return {
                    ...base,
                    thresholdReward: {
                        targetBusinessId: businessId,
                        baseline: r.baseline,
                        value: r.value,
                        valueType: r.valueType,
                        steps: r.thresholds.map((th) => ({
                            from: th.from,
                            to: th.to === "AND_MORE" ? 999999 : th.to,
                            value: th.value,
                            valueType: th.unit,
                        })),
                    },
                };
            }),
        };

        try {
            await updatePromoRewards(data.promoId.toString(), payload);
            setData({ ...data, incentives: form.items });

            toast.success(
                t("promo.success_promo_created", { name: data.name ?? t("promo.untitled") }),
                { autoClose: 4000 }
            );

            localStorage.removeItem('promo-wizard-data');
            
            setTimeout(() => {
                router.push("/dashboard/airline");
            }, 1000);
        }  catch (e: unknown) {
            const err = e as { response?: { data?: { message?: string } }; message?: string };
            console.error(err);
            alert(err?.response?.data?.message || err?.message || "Failed to submit incentives");
        }
    };

    return (
        <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-10 pb-24">
            {fields.map((f, idx) => (
                <AudienceCard
                    key={f.id}
                    idx={idx}
                    control={control}
                    removeAudience={remove}
                    audienceOptions={filteredAudienceOptions}
                />
            ))}

            <Button
                variant="ghost"
                type="button"
                onClick={() =>
                    append({
                        targetAudienceType: (filteredAudienceOptions[0]?.value || "TravelAgency") as TargetAudienceType,
                        incentiveType: "Fee",
                        rewards: [
                            {
                                type: "Fee",
                                paidPer: "BookingClass",
                                lines: [{ segment: "PerEconomyClassSegment", value: 0, unit: "Fixed" }],
                            },
                        ],
                    })
                }
            >
                + {t("promo.add_target_audience")}
            </Button>

              {/*          {Object.keys(errors).length > 0 && (*/}
              {/*              <pre className="text-red-500 text-xs whitespace-pre-wrap">*/}
              {/*  {JSON.stringify(errors, null, 2)}*/}
              {/*</pre>*/}
              {/*          )}*/}

            <div className="flex justify-between gap-4 pt-6">
                <Button 
                    variant="outline" 
                    type="button" 
                    onClick={() => {
                        localStorage.removeItem('promo-wizard-data');
                        router.push('/dashboard/airline');
                    }}
                    className="border-red-500 text-red-500 hover:bg-red-50 hover:border-red-600 hover:text-red-600"
                >
                    {t("promo.complete_later")}
                </Button>
                <div className="flex gap-4">
                    <Button variant="outline" type="button" onClick={() => {
                        localStorage.removeItem('promo-wizard-data');
                        router.back();
                    }}>
                        {t("promo.back")}
                    </Button>
                    <div className="relative inline-block">
                        <Button 
                            type="submit" 
                            disabled={!canSave}
                            className={!canSave ? "bg-gray-400 hover:bg-gray-400 text-white cursor-not-allowed" : ""}
                            title={!canSave ? t("promo.select_target_audience_to_save") : undefined}
                        >
                            {t("promo.save")}
                        </Button>
                    </div>
                </div>
            </div>
        </form>
        </FormProvider>
    );
}

interface CardProps {
    idx: number;
    control: Control<FormValues>;
    removeAudience: (index: number) => void;
    audienceOptions: Option<TargetAudienceType>[];
}

function AudienceCard({ idx, control, removeAudience, audienceOptions }: CardProps) {
    const {t} = useTranslation();
    const { setValue, getValues } = useFormContext();
    const incentiveType = useWatch({
        control,
        name: `items.${idx}.incentiveType`,
    }) as IncentiveType;

    const { fields, append, remove } = useFieldArray({
        control,
        name: `items.${idx}.rewards`,
    });

    type RewardField = FormValues["items"][number]["rewards"][number];

    const makeBlankFee = (): RewardField => ({
        type: "Fee",
        paidPer: "BookingClass",
        lines: [
            {
                segment: "PerEconomyClassSegment",
                value: 0,
                unit: "Fixed",
            },
        ],
    });

    const makeBlankThreshold = (): RewardField => ({
        type: "Threshold",
        baseline: 0,
        value: 0,
        valueType: "Fixed",
        thresholds: [
            {
                from: 0,
                to: 0,
                value: 0,
                unit: "Fixed",
            },
        ],
    });

    useEffect(() => {
        const current = getValues(`items.${idx}`);

        for (let i = 0; i < current.rewards.length; i++) {
            setValue(
                `items.${idx}.rewards.${i}.type`,
                incentiveType,
                { shouldValidate: true }
            );
        }
    }, [incentiveType, getValues, setValue, idx]);

    return (
        <div className="bg-white shadow p-7 rounded-xl space-y-6">
            <div className="flex justify-between">
                <p className="body-M-semibold">{t("promo.target_audience_num", { num: idx + 1 })}</p>
                {removeAudience && (
                    <button
                        type="button"
                        className="text-sm text-red-500"
                        onClick={() => removeAudience(idx)}
                    >
                        <TrashIcon stroke="#FF482B" />
                    </button>
                )}
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
                <Controller
                    control={control}
                    name={`items.${idx}.targetAudienceType`}
                    render={({ field, fieldState }) => (
                       <div>
                           <div className="flex items-center gap-2">
                               <div className="flex-1">
                                   <SelectOne
                                       value={field.value}
                                       opts={audienceOptions}
                                       placeholder={t("promo.select_target_audience")}
                                       onChange={field.onChange}
                                   />
                               </div>
                               {audienceOptions.length === 0 && (
                                   <InfoTooltip
                                       text={t("promo.target_audience_subscription_tooltip")}
                                       position="top"
                                   />
                               )}
                           </div>
                           {fieldState.error && (
                               <p className="text-red-500 text-xs mt-1 absolute">
                                   {fieldState.error.message}
                               </p>
                           )}
                       </div>
                    )}
                />

                <Controller
                    control={control}
                    name={`items.${idx}.incentiveType`}
                    render={({ field, fieldState }) => (
                        <div>
                            <SelectOne
                                value={field.value}
                                opts={incentiveOptions}
                                placeholder={t("promo.select_incentive_type")}
                                onChange={field.onChange}
                            />
                            {fieldState.error && (
                                <p className="text-red-500 text-xs mt-1 absolute">
                                    {fieldState.error.message}
                                </p>
                            )}
                        </div>
                    )}
                />
            </div>

            {fields.map((r, rIdx) => (
                <RewardBlock
                    key={r.id}
                    audIdx={idx}
                    rwIdx={rIdx}
                    control={control}
                    incentiveType={incentiveType}
                    removeReward={remove}
                />
            ))}

            <Button
                variant="ghost"
                type="button"
                onClick={() =>
                    append(incentiveType === "Fee" ? makeBlankFee() : makeBlankThreshold())
                }
            >
                {incentiveType === "Fee"
                    ? "+ " + t("promo.add_reward")
                    : "+ " + t("promo.add_threshold_set")}
            </Button>
        </div>
    );
}

interface RewardProps {
    audIdx: number;
    rwIdx: number;
    control: Control<FormValues>;
    incentiveType: IncentiveType;
    removeReward: (index: number) => void;
}

function RewardBlock({
                         audIdx,
                         rwIdx,
                         control,
                         incentiveType,
                         removeReward,
                     }: RewardProps) {
    return incentiveType === "Fee" ? (
        <FeeReward {...{ audIdx, rwIdx, control, removeReward }} />
    ) : (
        <ThresholdReward {...{ audIdx, rwIdx, control, removeReward }} />
    );
}

function FeeReward({
                       audIdx,
                       rwIdx,
                       control,
                       removeReward,
                   }: {
    audIdx: number;
    rwIdx: number;
    control: Control<FormValues>;
    removeReward: (i: number) => void;
}) {
    const {t} = useTranslation();
    const { fields, append, remove } = useFieldArray({
        control,
        name: `items.${audIdx}.rewards.${rwIdx}.lines`,
    });

    return (
        <div className="space-y-3 bg-gray-50 rounded-lg p-5">
            <Header title={`${t("promo.reward")} ${rwIdx + 1}`} onRemove={() => removeReward(rwIdx)} />

            <Controller
                control={control}
                name={`items.${audIdx}.rewards.${rwIdx}.paidPer`}
                render={({ field, fieldState }) => (
                    <div>
                        <SelectOne
                            value={field.value}
                            opts={paidPerOptions}
                                                            placeholder="Reward Accrued Per"
                            onChange={field.onChange}
                        />
                        {fieldState.error && (
                            <p className="text-red-500 text-xs mt-1 absolute">
                                {fieldState.error.message}
                            </p>
                        )}
                    </div>
                )}
            />

            {fields.map((l, lIdx) => (
                <div key={l.id} className="grid sm:grid-cols-4 gap-2 items-center">
                    <Controller
                        control={control}
                        name={`items.${audIdx}.rewards.${rwIdx}.lines.${lIdx}.segment`}
                        render={({ field, fieldState }) => (
                            <div>
                                <Select<Option>
                                    value={bookingClassSegments.find((o) => o.value === field.value)}
                                    options={bookingClassSegments}
                                    styles={sx}
                                    placeholder={t("promo.select_segment")}
                                    onChange={(opt) => field.onChange(opt!.value)}
                                />
                                {fieldState.error && (
                                    <p className="text-red-500 text-xs mt-1 absolute">
                                        {fieldState.error.message}
                                    </p>
                                )}
                            </div>
                        )}
                    />

                    <Controller
                        control={control}
                        name={`items.${audIdx}.rewards.${rwIdx}.lines.${lIdx}.value`}
                        render={({ field, fieldState }) => (
                            <div>
                                <Input {...field} type="number" onChange={(e) => field.onChange(e.target.valueAsNumber)} min={0} placeholder={t("promo.number")} />
                                {fieldState.error && (
                                    <p className="text-red-500 text-xs mt-1 absolute">
                                        {fieldState.error.message}
                                    </p>
                                )}
                            </div>
                        )}
                    />

                    <Controller
                        control={control}
                        name={`items.${audIdx}.rewards.${rwIdx}.lines.${lIdx}.unit`}
                        render={({ field, fieldState }) => (
                            <div>
                                <SelectOne
                                    value={field.value}
                                    opts={currencyOptions}
                                    placeholder="$ / %"
                                    onChange={field.onChange}
                                />
                                {fieldState.error && (
                                    <p className="text-red-500 text-xs mt-1 absolute">
                                        {fieldState.error.message}
                                    </p>
                                )}
                            </div>
                        )}
                    />

                    <RemoveBtn onClick={() => remove(lIdx)} />
                </div>
            ))}

            <Button
                variant="ghost"
                type="button"
                onClick={() => append({ segment: "PerEconomyClassSegment", value: 0, unit: "Fixed" })}
            >
                + {t('promo.add_segment')}
            </Button>
        </div>
    );
}

function ThresholdReward({
                             audIdx,
                             rwIdx,
                             control,
                             removeReward,
                         }: {
    audIdx: number;
    rwIdx: number;
    control: Control<FormValues>;
    removeReward: (i: number) => void;
}) {
    const {t} = useTranslation();
    const { fields, append, remove } = useFieldArray({
        control,
        name: `items.${audIdx}.rewards.${rwIdx}.thresholds`,
    });

    return (
        <div className="space-y-4 bg-gray-50 rounded-lg p-5">
            <Header
                title={`${t("promo.thresholds")} set ${rwIdx + 1}`}
                onRemove={() => removeReward(rwIdx)}
            />

            <p className="body-M-semibold">{t("promo.baseline_segments")}</p>
            <p className="text-xs text-gray-500 -mt-2 mb-3">
                {t("promo.paid_when_baseline")}
            </p>

            <div className="grid sm:grid-cols-3 gap-2">
                <Controller
                    control={control}
                    name={`items.${audIdx}.rewards.${rwIdx}.baseline`}
                    render={({ field, fieldState }) => (
                        <div>
                            <Input {...field} type="number" onChange={(e) => field.onChange(e.target.valueAsNumber)} min={0} placeholder={t("promo.baseline")} />
                            {fieldState.error && (
                                <p className="text-red-500 text-xs mt-1 absolute">
                                    {fieldState.error.message}
                                </p>
                            )}
                        </div>
                    )}
                />

                <Controller
                    control={control}
                    name={`items.${audIdx}.rewards.${rwIdx}.value`}
                    render={({ field, fieldState }) => (
                        <div>
                            <Input {...field} type="number" onChange={(e) => field.onChange(e.target.valueAsNumber)} min={0} placeholder={t('promo.number')} />
                            {fieldState.error && (
                                <p className="text-red-500 text-xs mt-1 absolute">
                                    {fieldState.error.message}
                                </p>
                            )}
                        </div>
                    )}
                />

                <Controller
                    control={control}
                    name={`items.${audIdx}.rewards.${rwIdx}.valueType`}
                    render={({ field, fieldState }) => (
                        <div>
                            <SelectOne
                                value={field.value}
                                opts={currencyOptions}
                                placeholder="$ / %"
                                onChange={field.onChange}
                            />
                            {fieldState.error && (
                                <p className="text-red-500 text-xs mt-1 absolute">
                                    {fieldState.error.message}
                                </p>
                            )}
                        </div>
                    )}
                />
            </div>

            <p className="body-M-semibold pt-2">{t("promo.thresholds")}</p>

            {fields.map((th, thIdx) => (
                <div key={th.id} className="grid sm:grid-cols-6 gap-2 items-end">
                    <Controller
                        control={control}
                        name={`items.${audIdx}.rewards.${rwIdx}.thresholds.${thIdx}.from`}
                        render={({ field, fieldState }) => (
                            <div>
                                <Input {...field} type="number" onChange={(e) => field.onChange(e.target.valueAsNumber)} min={0} placeholder="From" />
                                {fieldState.error && (
                                    <p className="text-red-500 text-xs mt-1 absolute">
                                        {fieldState.error.message}
                                    </p>
                                )}
                            </div>
                        )}
                    />

                    <Controller
                        control={control}
                        name={`items.${audIdx}.rewards.${rwIdx}.thresholds.${thIdx}.to`}
                        render={({ field, fieldState }) => (
                            <div>
                                <Input {...field} type="number" onChange={(e) => field.onChange(e.target.valueAsNumber)} min={0} placeholder="To (or 0 = ∞)" />
                                {fieldState.error && (
                                    <p className="text-red-500 text-xs mt-1 absolute">
                                        {fieldState.error.message}
                                    </p>
                                )}
                            </div>
                        )}
                    />

                    <Controller
                        control={control}
                        name={`items.${audIdx}.rewards.${rwIdx}.thresholds.${thIdx}.value`}
                        render={({ field, fieldState }) => (
                            <div>
                                <Input {...field} type="number" onChange={(e) => field.onChange(e.target.valueAsNumber)} min={0} placeholder={t('promo.number')} />
                                {fieldState.error && (
                                    <p className="text-red-500 text-xs mt-1 absolute">
                                        {fieldState.error.message}
                                    </p>
                                )}
                            </div>
                        )}
                    />

                    <Controller
                        control={control}
                        name={`items.${audIdx}.rewards.${rwIdx}.thresholds.${thIdx}.unit`}
                        render={({ field, fieldState }) => (
                            <div>
                                <SelectOne
                                    value={field.value}
                                    opts={currencyOptions}
                                    placeholder="$ / %"
                                    onChange={field.onChange}
                                />
                                {fieldState.error && (
                                    <p className="text-red-500 text-xs mt-1 absolute">
                                        {fieldState.error.message}
                                    </p>
                                )}
                            </div>

                        )}
                    />

                    <RemoveBtn onClick={() => remove(thIdx)} />
                </div>
            ))}

            <Button
                variant="ghost"
                type="button"
                className="mt-2"
                onClick={() =>
                    append({ from: 0, to: "AND_MORE", value: 0, unit: "Fixed" })
                }
            >
                + {t("promo.add_threshold")}
            </Button>
        </div>
    );
}

function Header({ title, onRemove }: { title: string; onRemove: () => void }) {
    return (
        <div className="flex justify-between">
            <p className="body-M-semibold">{title}</p>
            <button type="button" className="text-sm text-red-500" onClick={onRemove}>
                <TrashIcon stroke="#FF482B" />
            </button>
        </div>
    );
}
const RemoveBtn = ({ onClick }: { onClick: () => void }) => (
    <button
        type="button"
        className="text-xs text-red-500 ml-1"
        onClick={onClick}
    >
        <TrashIcon stroke="#FF482B" />
    </button>
);
