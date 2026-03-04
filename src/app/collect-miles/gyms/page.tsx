"use client"

import React from 'react'
import { useTranslation } from 'react-i18next'
import { Dumbbell, CreditCard, Activity, Plane } from 'lucide-react'
import Header from '../../../components/Header'
import Footer from '../../../components/Footer'

export default function GymsPage() {
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
            {t('landing.collectMiles.gyms.title', 'Gyms')}
          </h1>
          
          <div style={{ maxWidth: '900px', marginLeft: 'auto', marginRight: 'auto', marginBottom: '20px' }}>
            <p className="section-description" style={{ marginBottom: '15px' }}>
              {t('landing.collectMiles.gyms.description', 
                'Stay fit and earn miles at the same time. Your monthly gym membership fees and fitness activities at our partner gyms automatically earn you IMS Miles.')}
            </p>
            <p className="section-description">
              {t('landing.collectMiles.gyms.benefits', 
                'Investing in your health now rewards you with travel opportunities. Every workout session and membership payment brings you closer to your next adventure.')}
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
              {t('landing.collectMiles.gyms.howItWorks', 'How It Works')}
            </h2>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li className="section-description" style={{ marginBottom: '10px', paddingLeft: '30px', position: 'relative' }}>
                <span style={{ position: 'absolute', left: 0, display: 'flex', alignItems: 'center' }}>
                  <Dumbbell size={24} />
                </span>
                {t('landing.collectMiles.gyms.step1', 'Join or visit any of our partner gyms')}
              </li>
              <li className="section-description" style={{ marginBottom: '10px', paddingLeft: '30px', position: 'relative' }}>
                <span style={{ position: 'absolute', left: 0, display: 'flex', alignItems: 'center' }}>
                  <CreditCard size={24} />
                </span>
                {t('landing.collectMiles.gyms.step2', 'Pay your monthly membership fee')}
              </li>
              <li className="section-description" style={{ marginBottom: '10px', paddingLeft: '30px', position: 'relative' }}>
                <span style={{ position: 'absolute', left: 0, display: 'flex', alignItems: 'center' }}>
                  <Activity size={24} />
                </span>
                {t('landing.collectMiles.gyms.step3', 'Stay active and earn miles with every payment')}
              </li>
              <li className="section-description" style={{ paddingLeft: '30px', position: 'relative' }}>
                <span style={{ position: 'absolute', left: 0, display: 'flex', alignItems: 'center' }}>
                  <Plane size={24} />
                </span>
                {t('landing.collectMiles.gyms.step4', 'Use your fitness miles for your next travel adventure')}
              </li>
            </ul>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  )
}

