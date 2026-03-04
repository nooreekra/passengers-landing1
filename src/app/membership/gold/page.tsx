"use client"

import React from 'react'
import { useTranslation } from 'react-i18next'
import { Award, Percent } from 'lucide-react'
import Header from '../../../components/Header'
import Footer from '../../../components/Footer'

export default function GoldPage() {
  const { t } = useTranslation()

  return (
    <div className="home-page">
      <Header />
      <section className="collect-miles-section" style={{ padding: '80px 20px 40px', minHeight: '100vh' }}>
        <div style={{ maxWidth: '1200px' }}>
          <h1 className="section-subtitle" style={{ 
            marginBottom: '20px',
            textTransform: 'uppercase'
          }}>
            {t('landing.statusBenefits.statuses.gold.name', 'Gold')} Status
          </h1>
          
          <div style={{ maxWidth: '900px', marginLeft: 'auto', marginRight: 'auto', marginBottom: '20px' }}>
            <p className="section-description" style={{ marginBottom: '15px' }}>
              {t('landing.statusBenefits.subtitle', 'Hit monthly targets to achieve higher status')}
            </p>
            <p className="section-description">
              {t('landing.statusBenefits.statuses.gold.description', 'All you need is 75% of the trip cost to book your flight/hotel')}
            </p>
          </div>

          <div style={{ 
            marginTop: '30px', 
            padding: '25px', 
            backgroundColor: '#f9f9f9', 
            borderRadius: '12px',
            border: '1px solid #e0e0e0'
          }}>
            <h2 className="section-subtitle" style={{ 
              fontSize: '28px',
              marginBottom: '15px',
              textTransform: 'uppercase'
            }}>
              {t('landing.statusBenefits.benefits', 'Benefits')}
            </h2>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li className="section-description" style={{ marginBottom: '10px', paddingLeft: '30px', position: 'relative' }}>
                <span style={{ position: 'absolute', left: 0, display: 'flex', alignItems: 'center' }}>
                  <Percent size={24} />
                </span>
                {t('landing.statusBenefits.statuses.gold.benefit1', '25% DISCOUNT on flights and hotels')}
              </li>
              <li className="section-description" style={{ marginBottom: '10px', paddingLeft: '30px', position: 'relative' }}>
                <span style={{ position: 'absolute', left: 0, display: 'flex', alignItems: 'center' }}>
                  <Award size={24} />
                </span>
                {t('landing.statusBenefits.statuses.gold.benefit2', 'Book with only 75% of trip cost in miles')}
              </li>
              <li className="section-description" style={{ marginBottom: '10px', paddingLeft: '30px', position: 'relative' }}>
                <span style={{ position: 'absolute', left: 0, display: 'flex', alignItems: 'center' }}>
                  <Award size={24} />
                </span>
                {t('landing.statusBenefits.statuses.gold.benefit3', 'Access to exclusive Gold member benefits')}
              </li>
              <li className="section-description" style={{ paddingLeft: '30px', position: 'relative' }}>
                <span style={{ position: 'absolute', left: 0, display: 'flex', alignItems: 'center' }}>
                  <Award size={24} />
                </span>
                {t('landing.statusBenefits.statuses.gold.benefit4', 'Premium customer support and priority booking')}
              </li>
            </ul>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  )
}

