"use client"

import React, { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

const SpendMiles = () => {
    const { t } = useTranslation()
    const [isVisible, setIsVisible] = useState(false)
    const sectionRef = useRef(null)

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsVisible(true)
                    }
                })
            },
            {
                threshold: 0.2,
            }
        )

        if (sectionRef.current) {
            observer.observe(sectionRef.current)
        }

        return () => {
            if (sectionRef.current) {
                observer.unobserve(sectionRef.current)
            }
        }
    }, [])

    const options = [
        {
            id: 1,
            destination: t('landing.spendMiles.options.weekendEscape.destination'),
            subtitle: t('landing.spendMiles.options.weekendEscape.subtitle'),
            miles: '30,000',
            type: t('landing.spendMiles.options.weekendEscape.type'),
            image: '/images/landing/istanbul_street.png'
        },
        {
            id: 2,
            destination: t('landing.spendMiles.options.teamUp.destination'),
            subtitle: t('landing.spendMiles.options.teamUp.subtitle'),
            miles: '100,000',
            type: t('landing.spendMiles.options.teamUp.type'),
            image: '/images/landing/teamup.png'
        },
        {
            id: 3,
            destination: t('landing.spendMiles.options.dreamHoliday.destination'),
            subtitle: t('landing.spendMiles.options.dreamHoliday.subtitle'),
            miles: '300,000',
            type: t('landing.spendMiles.options.dreamHoliday.type'),
            image: '/images/landing/maldives_room.png'
        },
    ]


    return (
        <div className="spend-miles-section" ref={sectionRef}>
            <div className="spend-miles-section-title">
                <p className="section-title">{t('landing.spendMiles.title')}</p>
            </div>
            <h2 className="section-subtitle">{t('landing.spendMiles.subtitle')}</h2>
            <p className="section-description">{t('landing.spendMiles.description')}</p>
            <div className="spend-options-container">
                {options.map((option, index) => (
                    <div 
                        key={option.id} 
                        className={`spend-option-wrapper ${isVisible ? 'animate-slide-up' : ''}`}
                        style={{
                            animationDelay: `${index * 0.3}s`,
                        }}
                    >
                        <div
                            className="spend-option-card"
                            style={{ backgroundImage: `url(${option.image})` }}
                        >
                            <div className="spend-option-overlay"></div>
                            <div className="spend-option-header">
                            {/* <div className="spend-option-destination text-center">{option.destination}</div> */}
                                <div className="spend-option-subtitle">{option.subtitle}</div>
                            </div>
                            <div className="price-tag">
                                <div className="spend-option-miles">
                                    <span className="price-text-medium">{t('landing.spendMiles.bookFor')} </span>
                                    <div className="price-amount-container">
                                        <span className="price-amount">{option.miles}</span>
                                        <span className="price-text-small"> {t('landing.collectMiles.activities.miles')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default SpendMiles

