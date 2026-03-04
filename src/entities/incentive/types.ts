import { z } from "zod";

export const TargetAudienceEnum = z.enum([
    "TravelAgency",
    "TravelAgent",
]);
export type TargetAudienceType = z.infer<typeof TargetAudienceEnum>;

export const IncentiveEnum = z.enum(["Fee", "Threshold"]);
export type  IncentiveType = z.infer<typeof IncentiveEnum>;

export const PaidPerEnum = z.enum(["BookingClass", "FareFamily", "Ancillary"]);
export type  PaidPerType = z.infer<typeof PaidPerEnum>;

export const CurrencyEnum = z.enum(["Fixed", "Percentage"]);
export type  CurrencyType = z.infer<typeof CurrencyEnum>;

export const feeLineSchema = z.object({
    segment : z.string().min(1, "Select segment"),
    value   : z.number().positive("Must be > 0"),
    unit    : CurrencyEnum,
});

export const feeRewardSchema = z.object({
    type    : z.literal("Fee"),
    paidPer : PaidPerEnum,
    lines   : z.array(feeLineSchema).min(1, "Add at least 1 segment"),
});

export const baselineSchema = z.object({
    value : z.number().positive("Must be > 0"),
    unit  : CurrencyEnum,
});

export const thresholdLineSchema = z.object({
    from  : z.number().min(0),
    to    : z.union([z.number().min(0), z.literal("AND_MORE")]),
    value : z.number().positive("Must be > 0"),
    unit  : CurrencyEnum,
});

export const thresholdRewardSchema = z.object({
    type: z.literal("Threshold"),
    agencyId: z.string().uuid().optional(),

    baseline: z.number().min(0, "Baseline is required"),
    value: z.number().min(0, "Value is required"),
    valueType: CurrencyEnum,

    thresholds: z.array(thresholdLineSchema).min(1, "Add at least 1 threshold"),
});

export const rewardSchema = z.discriminatedUnion("type", [
    feeRewardSchema,
    thresholdRewardSchema,
]);

export const audienceItemSchema = z.object({
    targetAudienceType : TargetAudienceEnum,
    incentiveType      : IncentiveEnum,
    rewards            : z.array(rewardSchema).min(1, "Add at least 1 reward"),
});

export const incentivesSchema = z.object({
    items: z.array(audienceItemSchema).min(1, "Add at least 1 audience group"),
});

export type FormValues   = z.infer<typeof incentivesSchema>;
export type ApiIncentive = z.infer<typeof audienceItemSchema>;

export interface Option<T extends string = string> {
    value: T;
    label: string;
}

export const audienceOptions: Option<TargetAudienceType>[] = [
    { value: "TravelAgency", label: "Travel Agency" },
    { value: "TravelAgent",  label: "Travel Agent"  },
];

export const incentiveOptions: Option<IncentiveType>[] = [
    { value: "Fee",               label: "Fee"               },
    { value: "Threshold", label: "Target Thresholds" },
];

export const paidPerOptions: Option<PaidPerType>[] = [
    { value: "BookingClass", label: "Per Booking Class" },
    { value: "FareFamily",   label: "Per Fare Family"   },
    { value: "Ancillary",     label: "Per Ancillary"     },
];

export const currencyOptions: Option<CurrencyType>[] = [
    { value: "Fixed",     label: "$" },
    { value: "Percentage", label: "%" },
];

export const bookingClassSegments: Option[] = [
    { value: "PerEconomyClassSegment",  label: "Per Economy Class Segment"  },
    { value: "PerBusinessClassSegment",  label: "Per Business Class Segment" },
    { value: "PerFirstClassSegment",  label: "Per First Class Segment"    },
    { value: "ForAllSegments",  label: "For all segments"           },
    { value: "PerAllBookingClasses",  label: "For all segments"           },
];
