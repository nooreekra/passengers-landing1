"use client"

import React from 'react'
import { useTranslation } from 'react-i18next'
import { Plane, Ticket, Coins, Sparkles } from 'lucide-react'
import Header from '../../../components/Header'
import Footer from '../../../components/Footer'

export default function AirlinesPage() {
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
            {t('landing.collectMiles.airlines.title', 'Airlines')}
          </h1>
          
          <div style={{ maxWidth: '900px', marginLeft: 'auto', marginRight: 'auto', marginBottom: '20px' }}>
            <p className="section-description" style={{ marginBottom: '15px' }}>
              {t('landing.collectMiles.airlines.description', 
                'Collect IMS Miles every time you fly with our airline partners. Whether you\'re traveling for business or leisure, each flight brings you closer to your next destination.')}
            </p>
            <p className="section-description">
              {t('landing.collectMiles.airlines.benefits', 
                'All your flights are automatically tracked, and miles are credited to your unified IMS Miles account. No need to register for multiple airline loyalty programs - everything is in one place.')}
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
              {t('landing.collectMiles.airlines.howItWorks', 'How It Works')}
            </h2>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li className="section-description" style={{ marginBottom: '10px', paddingLeft: '30px', position: 'relative' }}>
                <span style={{ position: 'absolute', left: 0, display: 'flex', alignItems: 'center' }}>
                  <Plane size={24} />
                </span>
                {t('landing.collectMiles.airlines.step1', 'Book your flight with any of our airline partners')}
              </li>
              <li className="section-description" style={{ marginBottom: '10px', paddingLeft: '30px', position: 'relative' }}>
                <span style={{ position: 'absolute', left: 0, display: 'flex', alignItems: 'center' }}>
                  <Ticket size={24} />
                </span>
                {t('landing.collectMiles.airlines.step2', 'Your flight is automatically tracked in the system')}
              </li>
              <li className="section-description" style={{ marginBottom: '10px', paddingLeft: '30px', position: 'relative' }}>
                <span style={{ position: 'absolute', left: 0, display: 'flex', alignItems: 'center' }}>
                  <Coins size={24} />
                </span>
                {t('landing.collectMiles.airlines.step3', 'Miles are credited to your unified IMS Miles account')}
              </li>
              <li className="section-description" style={{ paddingLeft: '30px', position: 'relative' }}>
                <span style={{ position: 'absolute', left: 0, display: 'flex', alignItems: 'center' }}>
                  <Sparkles size={24} />
                </span>
                {t('landing.collectMiles.airlines.step4', 'Use your miles for your next trip or save them for your dream destination')}
              </li>
            </ul>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  )
}

