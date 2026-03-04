export type TargetAudienceType = "TravelAgency" | "TravelAgent";

export type ApiIncentivePayload = {
    rewards: {
        targetAudienceType: TargetAudienceType;
        rewardType: "Fee" | "Threshold";
        feeRewards?: {
            trigger: "BookingClass" | "FareFamily" | "Ancillary";
            feeRewardElements: {
                bookingClassSegmentType: string;
                triggerValue: string;
                value: number;
                valueType: "Fixed" | "Percentage";
            }[];
        }[];
        thresholdReward?: {
            targetBusinessId: string;
            baseline: number;
            value: number;
            valueType: "Fixed" | "Percentage";
            steps: {
                from: number;
                to: number;
                value: number;
                valueType: "Fixed" | "Percentage";
            }[];
        };
    }[];
};
