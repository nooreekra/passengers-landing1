"use client"

import React from 'react';
import {useTranslation} from "react-i18next";

const Analytics = () => {
    const {t} = useTranslation();

    return (
        <div>
            {t('analytics')}
        </div>
    );
};

export default Analytics;