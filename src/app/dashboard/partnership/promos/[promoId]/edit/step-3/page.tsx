"use client";

import { useParams, useRouter } from "next/navigation";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import Button from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import SelectOne from "@/shared/ui/SelectOne";
import { useTranslation } from "react-i18next";
import TrashIcon from "@/shared/icons/TrashIcon";
import { updatePartnerPromoRewards } from "@/features/promo/api/promos";

type LoyaltyStatus = "Universal" | "Bronze" | "Silver" | "Gold" | "Platinum";
type RewardValueType = "Fixed" | "Percentage";

type PartnerReward = { status: LoyaltyStatus; value: number; valueType: RewardValueType };
type FormValues = { rewards: PartnerReward[] };

const statusOptions: { value: LoyaltyStatus; label: string }[] = [
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

export default function EditPartnerRewardsStep3() {
    const { t } = useTranslation();
    const router = useRouter();
    const params = useParams();
    const promoId = params?.promoId as string | undefined;

    const { control, handleSubmit } = useForm<FormValues>({
        defaultValues: { rewards: [{ status: "Universal", value: 0, valueType: "Fixed" }] },
        mode: "onChange",
    });

    const { fields, append, remove } = useFieldArray({ control, name: "rewards" });

    const onSubmit = async (form: FormValues) => {
        if (!promoId) return;
        await updatePartnerPromoRewards(String(promoId), {
            type: "Partner",
            rewards: form.rewards,
        });
        router.push("/dashboard/partnership");
    };

    const remainingStatuses = (current: PartnerReward[]) =>
        statusOptions.filter((o) => !current.some((r) => r.status === o.value));

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 pb-24">
            <div className="bg-white shadow p-7 rounded-xl space-y-5">
                <p className="body-L-semibold">{t("promo.rewards")}</p>

                {fields.map((f, idx) => (
                    <div key={f.id} className="grid sm:grid-cols-6 gap-3 items-center bg-gray-50 p-4 rounded-lg">
                        <Controller
                            control={control}
                            name={`rewards.${idx}.status`}
                            render={({ field }) => (
                                <SelectOne value={field.value} opts={statusOptions} onChange={field.onChange} placeholder={t("promo.select_option")} />
                            )}
                        />
                        <Controller
                            control={control}
                            name={`rewards.${idx}.value`}
                            render={({ field }) => (
                                <Input {...field} type="number" min={0} onChange={(e) => field.onChange(e.target.valueAsNumber)} placeholder={t("promo.number")} />
                            )}
                        />
                        <Controller
                            control={control}
                            name={`rewards.${idx}.valueType`}
                            render={({ field }) => (
                                <SelectOne value={field.value} opts={valueTypeOptions} onChange={field.onChange} placeholder="$ / %" />
                            )}
                        />
                        <div className="col-span-2" />
                        <button type="button" className="text-xs text-red-500" onClick={() => remove(idx)}>
                            <TrashIcon stroke="#FF482B" />
                        </button>
                    </div>
                ))}

                <Controller
                    control={control}
                    name="rewards"
                    render={({ field }) => (
                        <SelectOne
                            value={undefined as any}
                            opts={remainingStatuses(field.value)}
                            placeholder={t("promo.add_reward")}
                            onChange={(status: LoyaltyStatus) => append({ status, value: 0, valueType: "Fixed" })}
                        />
                    )}
                />
            </div>

            <div className="flex justify-end gap-4 pt-6">
                <Button variant="outline" type="button" onClick={() => router.back()}>
                    {t("promo.back")}
                </Button>
                <Button type="submit">{t("promo.save")}</Button>
            </div>
        </form>
    );
}