"use client"

import React, { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

const StatusBenefits = () => {
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

  const statuses = [
    {
      id: 1,
      name: t('landing.statusBenefits.statuses.silver.name'),
      discount: '15%',
      description: t('landing.statusBenefits.statuses.silver.description'),
      image: '/images/membership/silver.jpg'
    },
    {
      id: 2,
      name: t('landing.statusBenefits.statuses.gold.name'),
      discount: '25%',
      description: t('landing.statusBenefits.statuses.gold.description'),
      image: '/images/membership/gold.jpg'
    },
    {
      id: 3,
      name: t('landing.statusBenefits.statuses.platinum.name'),
      discount: '35%',
      description: t('landing.statusBenefits.statuses.platinum.description'),
      image: '/images/membership/platinum.jpg'
    },
  ]

  return (
    <div className="status-benefits-section" ref={sectionRef}>
        <div className="status-benefits-section-title">
            <p className="section-title">{t('landing.statusBenefits.title')}</p>
        </div>
      <h2 className="section-subtitle">{t('landing.statusBenefits.subtitle')}</h2>
      <div className="status-cards-container">
        {statuses.map((status, index) => (
          <div 
            key={status.id} 
            className={`status-card ${isVisible ? 'flip-card' : ''}`}
            style={{
              animationDelay: `${index * 0.4}s`,
            }}
          >
            <div className="status-card-inner">
              <div className="status-card-back"></div>
              <div className="status-card-front">
                <div 
                  className="status-card-header"
                  style={{ backgroundImage: `url(${status.image})` }}
                >
                  <div className="status-card-name">{status.name}</div>
                </div>
                <div className="status-card-body">
                  <div className="status-discount-container">
                    <div className="status-discount">{status.discount}</div>
                    <div className="status-discount-label">{t('landing.statusBenefits.discountLabel')}</div>
                  </div>
                  <p className="status-description">{status.description}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="status-benefits-footer-text">
        {t('landing.statusBenefits.footerText')}
      </p>
    </div>
  )
}

export default StatusBenefits

