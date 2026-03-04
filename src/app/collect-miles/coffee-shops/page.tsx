"use client"

import React from 'react'
import { useTranslation } from 'react-i18next'
import { Coffee, QrCode, CreditCard, Sparkles } from 'lucide-react'
import Header from '../../../components/Header'
import Footer from '../../../components/Footer'

export default function CoffeeShopsPage() {
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
            {t('landing.collectMiles.coffeeShops.title', 'Coffee Shops')}
          </h1>
          
          <div style={{ maxWidth: '900px', marginLeft: 'auto', marginRight: 'auto', marginBottom: '20px' }}>
            <p className="section-description" style={{ marginBottom: '15px' }}>
              {t('landing.collectMiles.coffeeShops.description', 
                'Your daily coffee ritual can now fuel your next vacation. Every cup of coffee, croissant, or snack purchased at our partner coffee shops earns you IMS Miles.')}
            </p>
            <p className="section-description">
              {t('landing.collectMiles.coffeeShops.benefits', 
                'Grab your morning coffee with friends, enjoy a takeaway, or relax with a pastry - all while collecting miles that bring you closer to your dream destination.')}
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
              {t('landing.collectMiles.coffeeShops.howItWorks', 'How It Works')}
            </h2>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li className="section-description" style={{ marginBottom: '10px', paddingLeft: '30px', position: 'relative' }}>
                <span style={{ position: 'absolute', left: 0, display: 'flex', alignItems: 'center' }}>
                  <Coffee size={24} />
                </span>
                {t('landing.collectMiles.coffeeShops.step1', 'Visit any of our partner coffee shops')}
              </li>
              <li className="section-description" style={{ marginBottom: '10px', paddingLeft: '30px', position: 'relative' }}>
                <span style={{ position: 'absolute', left: 0, display: 'flex', alignItems: 'center' }}>
                  <QrCode size={24} />
                </span>
                {t('landing.collectMiles.coffeeShops.step2', 'Present your IMS number or QR from your account to the waiter')}
              </li>
              <li className="section-description" style={{ marginBottom: '10px', paddingLeft: '30px', position: 'relative' }}>
                <span style={{ position: 'absolute', left: 0, display: 'flex', alignItems: 'center' }}>
                  <CreditCard size={24} />
                </span>
                {t('landing.collectMiles.coffeeShops.step3', 'Your activity automatically earn IMS Miles')}
              </li>
              <li className="section-description" style={{ paddingLeft: '30px', position: 'relative' }}>
                <span style={{ position: 'absolute', left: 0, display: 'flex', alignItems: 'center' }}>
                  <Sparkles size={24} />
                </span>
                {t('landing.collectMiles.coffeeShops.step4', 'Watch your miles accumulate with every visit')}
              </li>
            </ul>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  )
}

