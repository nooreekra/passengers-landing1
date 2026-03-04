"use client"

import React from 'react';
import {useTranslation} from "react-i18next";

const FAQ = () => {
    const {t} = useTranslation();
    return (
        <div>
            {t('faq')}
        </div>
    );
};

export default FAQ;