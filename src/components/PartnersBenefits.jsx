"use client"

import React, { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

const PartnersBenefits = () => {
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
  const benefits = [
    { text: t('landing.partnersBenefits.benefits.welcomeBonus'), image: '/images/landing/bonus_3d.png' },
    { text: t('landing.partnersBenefits.benefits.freeMonthlyTreat'), image: '/images/landing/cake_3d.png' },
    { text: t('landing.partnersBenefits.benefits.priorityCheckIn'), image: '/images/landing/checkin_3d.png' },
    { text: t('landing.partnersBenefits.benefits.advanceSeatBooking'), image: '/images/landing/seat_3d.png' },
    { text: t('landing.partnersBenefits.benefits.extendedCheckIn'), image: '/images/landing/dinner_3d.png' },
  ]

  return (
    <div className="partners-benefits-section" ref={sectionRef}>
        <div className="partners-benefits-section-title">
            <p className="section-title">{t('landing.partnersBenefits.title')}</p>
        </div>
      <h2 className="section-subtitle">{t('landing.partnersBenefits.subtitle')}</h2>
      <p className="section-description">{t('landing.partnersBenefits.description')}</p>
      <div className="partners-benefits-container">
        <div className="partners-center-content">
          <ul className="partners-benefits-list">
            {benefits.map((benefit, index) => (
              <li 
                key={index} 
                className={`partners-benefit-item ${index % 2 === 0 ? 'left' : 'right'} ${isVisible ? 'animate-text' : ''}`}
                style={{
                  animationDelay: `${index * 0.15}s`,
                }}
              >
                {index % 2 === 0 && (
                  <img 
                    src={benefit.image} 
                    alt={benefit.text}
                    className={`partners-benefit-3d-model ${isVisible ? 'animate-3d' : ''}`}
                    style={{
                      animationDelay: `${index * 0.2 + 0.4}s`,
                    }}
                  />
                )}
                <span className="partners-benefit-text">{benefit.text}</span>
                {index % 2 === 1 && (
                  <img 
                    src={benefit.image} 
                    alt={benefit.text}
                    className={`partners-benefit-3d-model ${isVisible ? 'animate-3d' : ''}`}
                    style={{
                      animationDelay: `${index * 0.2 + 0.4}s`,
                    }}
                  />
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

export default PartnersBenefits

