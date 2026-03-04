"use client"

import React, { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import PartnersCarousel from './PartnersCarousel'

const CollectMiles = () => {
    const { t } = useTranslation()
    const [radius, setRadius] = useState(160)
    const [isVisible, setIsVisible] = useState(false)
    const sectionRef = useRef(null)

    useEffect(() => {
        const updateRadius = () => {
            if (window.innerWidth <= 480) {
                setRadius(110)
            } else if (window.innerWidth <= 768) {
                setRadius(130)
            } else if (window.innerWidth <= 968) {
                setRadius(145)
            } else {
                setRadius(160)
            }
        }

        updateRadius()
        window.addEventListener('resize', updateRadius)
        return () => window.removeEventListener('resize', updateRadius)
    }, [])

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
                threshold: 0.2, // Секция считается видимой, когда 20% её видно
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

    // Равномерное распределение карточек по полному кругу (360 градусов)
    const totalCards = 9
    const angleStep = 360 / totalCards // 40 градусов между карточками

    const activities = [
        { id: 1, title: t('landing.collectMiles.activities.banking'), description: t('landing.collectMiles.activities.bankingDesc'), miles: `1960 ${t('landing.collectMiles.activities.miles')}` },
        { id: 2, title: t('landing.collectMiles.activities.hotel'), description: t('landing.collectMiles.activities.hotelDesc'), miles: `500 ${t('landing.collectMiles.activities.miles')}` },
        { id: 3, title: t('landing.collectMiles.activities.gasStation'), description: t('landing.collectMiles.activities.gasStationDesc'), miles: `30 ${t('landing.collectMiles.activities.miles')}` },
        { id: 4, title: t('landing.collectMiles.activities.restaurant'), description: t('landing.collectMiles.activities.restaurantLunch'), miles: `400 ${t('landing.collectMiles.activities.miles')}` },
        { id: 5, title: t('landing.collectMiles.activities.flight'), description: `${t('landing.collectMiles.activities.flightDesc')} 1`, miles: `1500 ${t('landing.collectMiles.activities.miles')}` },
        { id: 6, title: t('landing.collectMiles.activities.gym'), description: t('landing.collectMiles.activities.gymDesc'), miles: `200 ${t('landing.collectMiles.activities.miles')}` },
        { id: 7, title: t('landing.collectMiles.activities.flight'), description: `${t('landing.collectMiles.activities.flightDesc')} 2`, miles: `1500 ${t('landing.collectMiles.activities.miles')}` },
        { id: 8, title: t('landing.collectMiles.activities.coffee'), description: t('landing.collectMiles.activities.coffeeDesc'), miles: `50 ${t('landing.collectMiles.activities.miles')}` },
        { id: 9, title: t('landing.collectMiles.activities.flight'), description: `${t('landing.collectMiles.activities.flightDesc')} 3`, miles: `800 ${t('landing.collectMiles.activities.miles')}` },
    ].map((activity, index) => ({
        ...activity,
        angle: index * angleStep, // Равномерное распределение по кругу
        radius: radius
    }))

    return (
        <div className="collect-miles-section" ref={sectionRef}>
            <div className="collect-miles-section-title">
                <p className="section-title">{t('landing.collectMiles.title')}</p>
            </div>
            <PartnersCarousel />
            <h2 className="section-subtitle">{(() => {
                const subtitleLines = t('landing.collectMiles.subtitle').split('\n')
                return subtitleLines.map((line, i) => (
                    <React.Fragment key={i}>
                        {line}
                        {i < subtitleLines.length - 1 && <br />}
                    </React.Fragment>
                ))
            })()}</h2>
            <p className="section-description">{t('landing.collectMiles.description')}</p>
            <div className="collect-miles-visualization">
                <div className="center-hero">
                    <div className="hero-image-wrapper">
                        <img src="/images/landing/hero_bclass.jpg" alt="Hero" className="hero-image" />
                    </div>
                </div>
                <div className="activities-circle">
                    {activities.map((activity, index) => {
                        const angleInRadians = (activity.angle * Math.PI) / 180
                        const x = Math.cos(angleInRadians) * activity.radius
                        const y = Math.sin(angleInRadians) * activity.radius

                        return (
                            <div
                                key={activity.id}
                                className={`activity-card-circle ${isVisible ? 'animate-in' : ''}`}
                                style={{
                                    '--x': `${x}px`,
                                    '--y': `${y}px`,
                                    animationDelay: `${index * 0.1}s`,
                                }}
                            >
                                <div className="activity-card-content">
                                    <div className={`activity-title ${activity.title === t('landing.collectMiles.activities.flight') ? 'activity-title-flight' : ''}`}>{activity.title}</div>
                                    <div className="activity-description">{activity.description}</div>
                                    <div className="activity-miles">{activity.miles}</div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

export default CollectMiles

