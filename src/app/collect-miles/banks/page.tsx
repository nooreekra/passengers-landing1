"use client"

import React from 'react'
import { useTranslation } from 'react-i18next'
import { CreditCard, DollarSign, BarChart, Plane } from 'lucide-react'
import Header from '../../../components/Header'
import Footer from '../../../components/Footer'

export default function BanksPage() {
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
            {t('landing.collectMiles.banks.title', 'Banks')}
          </h1>
          
          <div style={{ maxWidth: '900px', marginLeft: 'auto', marginRight: 'auto', marginBottom: '20px' }}>
            <p className="section-description" style={{ marginBottom: '15px' }}>
              {t('landing.collectMiles.banks.description', 
                'Turn your everyday banking into rewards. Every time you pay with your credit card from our partner banks, you collect IMS Miles automatically.')}
            </p>
            <p className="section-description">
              {t('landing.collectMiles.banks.benefits', 
                'Monthly card payments, purchases, and transactions all contribute to your miles balance. Make your daily spending work for you and bring you closer to your next vacation.')}
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
              {t('landing.collectMiles.banks.howItWorks', 'How It Works')}
            </h2>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li className="section-description" style={{ marginBottom: '10px', paddingLeft: '30px', position: 'relative' }}>
                <span style={{ position: 'absolute', left: 0, display: 'flex', alignItems: 'center' }}>
                  <CreditCard size={24} />
                </span>
                {t('landing.collectMiles.banks.step1', 'Use the card or QR payments from our partner banks to make everyday purchases')}
              </li>
              <li className="section-description" style={{ marginBottom: '10px', paddingLeft: '30px', position: 'relative' }}>
                <span style={{ position: 'absolute', left: 0, display: 'flex', alignItems: 'center' }}>
                  <DollarSign size={24} />
                </span>
                {t('landing.collectMiles.banks.step2', 'Every transaction automatically earns you IMS Miles')}
              </li>
              <li className="section-description" style={{ marginBottom: '10px', paddingLeft: '30px', position: 'relative' }}>
                <span style={{ position: 'absolute', left: 0, display: 'flex', alignItems: 'center' }}>
                  <BarChart size={24} />
                </span>
                {t('landing.collectMiles.banks.step3', 'Track your monthly card payments and accumulated miles in one place')}
              </li>
              <li className="section-description" style={{ paddingLeft: '30px', position: 'relative' }}>
                <span style={{ position: 'absolute', left: 0, display: 'flex', alignItems: 'center' }}>
                  <Plane size={24} />
                </span>
                {t('landing.collectMiles.banks.step4', 'Redeem your miles for flights, hotels, or other travel rewards')}
              </li>
            </ul>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  )
}

