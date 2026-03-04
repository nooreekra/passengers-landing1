"use client"

import React from 'react'
import { useTranslation } from 'react-i18next'
import { Building, Calendar, CreditCard, Key } from 'lucide-react'
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
            {t('landing.spendMiles.title', 'Spend Miles')} - {t('landing.spendMiles.hotels.title', 'Hotels')}
          </h1>
          
          <div style={{ maxWidth: '900px', marginLeft: 'auto', marginRight: 'auto', marginBottom: '20px' }}>
            <p className="section-description" style={{ marginBottom: '15px' }}>
              {t('landing.spendMiles.description', 
                'Spend collected miles to book your weekend trip, annual family vacation or that exclusive dream holiday you\'ve been thinking about for some time. All paid by miles from our partners!!!')}
            </p>
            <p className="section-description">
              {t('landing.spendMiles.hotels.description', 'Redeem your IMS Miles for hotel stays at our partner properties. From luxury resorts to boutique hotels, your miles unlock amazing accommodation options worldwide.')}
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
              {t('landing.spendMiles.hotels.howItWorks', 'How It Works')}
            </h2>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li className="section-description" style={{ marginBottom: '10px', paddingLeft: '30px', position: 'relative' }}>
                <span style={{ position: 'absolute', left: 0, display: 'flex', alignItems: 'center' }}>
                  <Building size={24} />
                </span>
                {t('landing.spendMiles.hotels.step1', 'Browse partner hotels and select your destination')}
              </li>
              <li className="section-description" style={{ marginBottom: '10px', paddingLeft: '30px', position: 'relative' }}>
                <span style={{ position: 'absolute', left: 0, display: 'flex', alignItems: 'center' }}>
                  <Calendar size={24} />
                </span>
                {t('landing.spendMiles.hotels.step2', 'Choose your check-in and check-out dates')}
              </li>
              <li className="section-description" style={{ marginBottom: '10px', paddingLeft: '30px', position: 'relative' }}>
                <span style={{ position: 'absolute', left: 0, display: 'flex', alignItems: 'center' }}>
                  <CreditCard size={24} />
                </span>
                {t('landing.spendMiles.hotels.step3', 'Pay for your stay using IMS Miles')}
              </li>
              <li className="section-description" style={{ paddingLeft: '30px', position: 'relative' }}>
                <span style={{ position: 'absolute', left: 0, display: 'flex', alignItems: 'center' }}>
                  <Key size={24} />
                </span>
                {t('landing.spendMiles.hotels.step4', 'Enjoy your hotel stay paid with miles')}
              </li>
            </ul>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  )
}

