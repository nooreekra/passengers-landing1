"use client"

import React from 'react'
import { useTranslation } from 'react-i18next'
import { Building, Key, CreditCard, Gift } from 'lucide-react'
import Header from '../../../components/Header'
import Footer from '../../../components/Footer'

export default function HotelsPage() {
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
            {t('landing.collectMiles.hotels.title', 'Hotels')}
          </h1>
          
          <div style={{ maxWidth: '900px', marginLeft: 'auto', marginRight: 'auto', marginBottom: '20px' }}>
            <p className="section-description" style={{ marginBottom: '15px' }}>
              {t('landing.collectMiles.hotels.description', 
                'Every hotel stay earns you IMS Miles. Whether you\'re on a business trip or enjoying a vacation, your accommodation expenses turn into rewards.')}
            </p>
            <p className="section-description">
              {t('landing.collectMiles.hotels.benefits', 
                'Stay at any of our partner hotels and automatically collect miles. No need to join multiple hotel loyalty programs - all your stays are unified in your IMS Miles account.')}
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
              {t('landing.collectMiles.hotels.howItWorks', 'How It Works')}
            </h2>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li className="section-description" style={{ marginBottom: '10px', paddingLeft: '30px', position: 'relative' }}>
                <span style={{ position: 'absolute', left: 0, display: 'flex', alignItems: 'center' }}>
                  <Building size={24} />
                </span>
                {t('landing.collectMiles.hotels.step1', 'Book a stay at any of our partner hotels')}
              </li>
              <li className="section-description" style={{ marginBottom: '10px', paddingLeft: '30px', position: 'relative' }}>
                <span style={{ position: 'absolute', left: 0, display: 'flex', alignItems: 'center' }}>
                  <Key size={24} />
                </span>
                {t('landing.collectMiles.hotels.step2', 'Check in and enjoy your stay')}
              </li>
              <li className="section-description" style={{ marginBottom: '10px', paddingLeft: '30px', position: 'relative' }}>
                <span style={{ position: 'absolute', left: 0, display: 'flex', alignItems: 'center' }}>
                  <CreditCard size={24} />
                </span>
                {t('landing.collectMiles.hotels.step3', 'Your stay is automatically tracked and miles are credited')}
              </li>
              <li className="section-description" style={{ paddingLeft: '30px', position: 'relative' }}>
                <span style={{ position: 'absolute', left: 0, display: 'flex', alignItems: 'center' }}>
                  <Gift size={24} />
                </span>
                {t('landing.collectMiles.hotels.step4', 'Use your accumulated miles for future hotel stays or other rewards')}
              </li>
            </ul>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  )
}

