"use client"

import React from 'react'
import { useTranslation } from 'react-i18next'
import { Award } from 'lucide-react'
import Header from '../../../components/Header'
import Footer from '../../../components/Footer'

export default function BronzePage() {
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
            {t('landing.statusBenefits.statuses.bronze.name', 'Bronze')} Status
          </h1>
          
          <div style={{ maxWidth: '900px', marginLeft: 'auto', marginRight: 'auto', marginBottom: '20px' }}>
            <p className="section-description" style={{ marginBottom: '15px' }}>
              {t('landing.statusBenefits.subtitle', 'Hit monthly targets to achieve higher status')}
            </p>
            <p className="section-description">
              {t('landing.statusBenefits.statuses.bronze.description', 'Start your journey with Bronze status. As a Bronze member, you begin earning IMS Miles and working towards higher status levels with exclusive benefits.')}
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
                  <Award size={24} />
                </span>
                {t('landing.statusBenefits.statuses.bronze.benefit1', 'Start earning IMS Miles from all partner activities')}
              </li>
              <li className="section-description" style={{ marginBottom: '10px', paddingLeft: '30px', position: 'relative' }}>
                <span style={{ position: 'absolute', left: 0, display: 'flex', alignItems: 'center' }}>
                  <Award size={24} />
                </span>
                {t('landing.statusBenefits.statuses.bronze.benefit2', 'Access to unified loyalty platform')}
              </li>
              <li className="section-description" style={{ marginBottom: '10px', paddingLeft: '30px', position: 'relative' }}>
                <span style={{ position: 'absolute', left: 0, display: 'flex', alignItems: 'center' }}>
                  <Award size={24} />
                </span>
                {t('landing.statusBenefits.statuses.bronze.benefit3', 'Track your progress towards Silver status')}
              </li>
              <li className="section-description" style={{ paddingLeft: '30px', position: 'relative' }}>
                <span style={{ position: 'absolute', left: 0, display: 'flex', alignItems: 'center' }}>
                  <Award size={24} />
                </span>
                {t('landing.statusBenefits.statuses.bronze.benefit4', 'Even if you are not taking enough flights to get to desired status, you can alternatively hit your monthly targets with our Partner Network')}
              </li>
            </ul>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  )
}

