"use client";

import React from 'react';
import { SubscriptionManagement } from '@/features/subscription/components';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import Loader from '@/shared/ui/Loader';

const Subscription = () => {
    const business = useSelector((state: RootState) => state.business.current);

    if (!business?.id) {
        return <Loader />;
    }

    return (
        <div>
            <SubscriptionManagement businessId={business.id} />
        </div>
    );
};

export default Subscription;