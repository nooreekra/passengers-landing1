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
} from "@/entities/incentive/types";
import SelectOne from "@/shared/ui/SelectOne";
import { updatePromoRewards, updatePartnerPromoRewards } from "@/features/promo/api/promos";
import {ApiIncentivePayload} from "@/entities/promo/types";
import {useSelector} from "react-redux";
import {RootState} from "@/store";
import TrashIcon from "@/shared/icons/TrashIcon";
import {useEffect} from "react";
import {toast} from "react-toastify";
import {useTranslation} from "react-i18next";

const sx = { ...baseSelectStyles, ...menuOptionStyles };

// Partner (Loyalty status) reward types
type LoyaltyStatus = "Universal" | "Bronze" | "Silver" | "Gold" | "Platinum";
type RewardValueType = "Fixed" | "Percentage";
type PartnerReward = { status: LoyaltyStatus; value: number; valueType: RewardValueType };
type PartnerFormValues = { rewards: PartnerReward[] };

const loyaltyStatusOptions: { value: LoyaltyStatus; label: string }[] = [
    { value: "Universal", label: "Universal" },
    { value: "Bronze", label: "Bronze" },
    { value: "Silver", label: "Silver" },
    { value: "Gold", label: "Gold" },
    { value: "Platinum", label: "Platinum" },
];
const valueTypeOptions: { value: RewardValueType; label: string }[] = [
    { value: "Fixed", label: "Fixed" },
    { value: "Percentage", label: "Percentage" },
];

export default function AddPromoStep3() {
    const { t } = useTranslation();
    const router = useRouter();
    const { data, setData } = usePromoWizard();
    const businessId = useSelector((state: RootState) => state.business.current?.id);

    // Partner reward (loyalty status) form
    const partnerMethods = useForm<PartnerFormValues>({
        defaultValues: { rewards: [{ status: "Universal", value: 0, valueType: "Fixed" }] },
        mode: "all",
    });
    const { control: pControl, handleSubmit: pHandleSubmit } = partnerMethods;
    const { fields: pFields, append: pAppend, remove: pRemove } = useFieldArray({
        control: pControl,
        name: "rewards",
    });

    const onSubmitPartner = async (form: PartnerFormValues) => {
        if (!data.promoId) { return; }
        try {
            await updatePartnerPromoRewards(data.promoId.toString(), {
                type: "Partner",
                rewards: form.rewards,
            });
            toast.success(
                t("promo.success_promo_created", { name: data.name ?? t("promo.untitled") }),
                { autoClose: 3000 }
            );
            localStorage.removeItem('promo-wizard-data');
            router.push("/dashboard/partnership");
        } catch (e: any) {
            console.error(e);
            alert(e?.response?.data?.message || e?.message || "Failed to submit incentives");
        }
    };

    const remainingStatuses = (current: PartnerReward[]) =>
        loyaltyStatusOptions.filter((o) => !current.some((r) => r.status === o.value));

    useEffect(() => {
        if (!data.name || !data.description || !data.ruleDescription) {
            router.push('/dashboard/partnership/promos/add/step-1');
        }
    }, [data, router]);

    const methods = useForm<FormValues>({
        resolver: zodResolver(incentivesSchema),
        defaultValues: Array.isArray(data.incentives) && data.incentives.length > 0
            ? { items: data.incentives as FormValues["items"] }
            : {
                items: [
                    {
                        targetAudienceType: "TravelAgency",
                        incentiveType: "Fee",
                        rewards: [
                            {
                                type: "Fee",
                                paidPer: "BookingClass",
                                lines: [
                                    { segment: "PerEconomyClassSegment", value: 1, unit: "Fixed" }
                                ]
                            }
                        ],
                    },
                ],
            }
        ,
        mode: "all",
    });

    const { control, handleSubmit, setValue } = methods;

    const { fields, append, remove } = useFieldArray({
        control,
        name: "items",
    });

    useEffect(() => {
        if (data.incentives && data.incentives.length > 0) {
            setValue("items", data.incentives as FormValues["items"]);
        }
    }, [data.incentives, setValue]);

    const onSubmit = async (form: FormValues) => {
        if (!data.promoId || !businessId) return;

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
            // Если это Partner — отправляем упрощенный формат (по статусам)
            if (true) {
                // Маппим первую запись как пример; при необходимости добавим UI для нескольких статусов
                const partnerPayload = {
                    type: "Partner" as const,
                    rewards: [
                        {
                            status: "Gold" as const,
                            value: 10,
                            valueType: "Percentage" as const,
                        },
                    ],
                };
                await updatePartnerPromoRewards(String(data.promoId!), partnerPayload);
            } else {
                await updatePromoRewards(String(data.promoId!), payload);
            }
            setData({ ...data, incentives: form.items });

            toast.success(
                t("promo.success_promo_created", { name: data.name ?? t("promo.untitled") }),
                { autoClose: 4000 }
            );

            localStorage.removeItem('promo-wizard-data');
            
            setTimeout(() => {
                router.push("/dashboard/partnership");
            }, 1000);
        }  catch (e: unknown) {
            const err = e as { response?: { data?: { message?: string } }; message?: string };
            console.error(err);
            alert(err?.response?.data?.message || err?.message || "Failed to submit incentives");
        }
    };

    // Partner UI (loyalty statuses). This overrides legacy airline UI for partnership route
    return (
        <form onSubmit={pHandleSubmit(onSubmitPartner)} className="space-y-8 pb-24">
            <div className="bg-white shadow p-7 rounded-xl space-y-5">
                <p className="body-L-semibold">{t("promo.rewards")}</p>

                {pFields.map((f, idx) => (
                    <div key={f.id} className="grid sm:grid-cols-6 gap-3 items-center bg-gray-50 p-4 rounded-lg">
                        <Controller
                            control={pControl}
                            name={`rewards.${idx}.status`}
                            render={({ field }) => (
                                <SelectOne value={field.value} opts={loyaltyStatusOptions} onChange={field.onChange} placeholder={t("promo.select_option")} />
                            )}
                        />
                        <Controller
                            control={pControl}
                            name={`rewards.${idx}.value`}
                            render={({ field }) => (
                                <Input {...field} type="number" min={0} onChange={(e) => field.onChange(e.target.valueAsNumber)} placeholder={t("promo.number")} />
                            )}
                        />
                        <Controller
                            control={pControl}
                            name={`rewards.${idx}.valueType`}
                            render={({ field }) => (
                                <SelectOne value={field.value} opts={valueTypeOptions} onChange={field.onChange} placeholder="$ / %" />
                            )}
                        />
                        <div className="col-span-2" />
                        <button type="button" className="text-xs text-red-500" onClick={() => pRemove(idx)}>
                            <TrashIcon stroke="#FF482B" />
                        </button>
                    </div>
                ))}

                <div className="flex gap-3 items-center">
                    <Controller
                        control={pControl}
                        name="rewards"
                        render={({ field }) => (
                            <SelectOne
                                value={undefined as any}
                                opts={remainingStatuses(field.value)}
                                placeholder={t("promo.add_reward")}
                                onChange={(status: LoyaltyStatus) => pAppend({ status, value: 0, valueType: "Fixed" })}
                            />
                        )}
                    />
                </div>
            </div>

            <div className="flex justify-end gap-4 pt-6">
                <Button variant="outline" type="button" onClick={() => router.back()}>
                    {t("promo.back")}
                </Button>
                <Button type="submit">{t("promo.save")}</Button>
            </div>
        </form>
    );

    // Legacy airline UI (unreachable for partnership route)
    return (
        <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-10 pb-24">
            {fields.map((f, idx) => (
                <AudienceCard
                    key={f.id}
                    idx={idx}
                    control={control}
                    removeAudience={remove}
                />
            ))}

            <Button
                variant="ghost"
                type="button"
                onClick={() =>
                    append({
                        targetAudienceType: "TravelAgency",
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
                        router.push('/dashboard/partnership');
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
                    <Button type="submit">
                        {t("promo.save")}
                    </Button>
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
}

function AudienceCard({ idx, control, removeAudience }: CardProps) {
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
                           <SelectOne
                               value={field.value}
                               opts={audienceOptions}
                               placeholder={t("promo.select_target_audience")}
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