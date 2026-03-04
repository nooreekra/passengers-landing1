"use client"

import React from 'react'
import { useTranslation } from 'react-i18next'
import Header from '../../../components/Header'
import Footer from '../../../components/Footer'

export default function UnifiedMilesPage() {
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
            {t('landing.collectMiles.unifiedMiles.title', 'Unified Miles')}
          </h1>
          
          <div style={{ 
            maxWidth: '900px',
            marginLeft: 'auto',
            marginRight: 'auto',
            marginBottom: '20px'
          }}>
            <p className="section-description" style={{ marginBottom: '15px' }}>
              {t('landing.collectMiles.unifiedMiles.paragraph1', 
                'IMS Miles are unified Miles which means every time you take your flight, stay at hotel, buy a croissant or pay using a credit card, you collect the same IMS Miles from all our Partners.')}
            </p>
            <div style={{ 
              marginBottom: '15px',
              backgroundColor: '#f0f7ff',
              padding: '20px',
              borderRadius: '12px',
              maxWidth: '900px',
              marginLeft: 'auto',
              marginRight: 'auto'
            }}>
              <p className="section-description" style={{ marginBottom: '8px', textAlign: 'left' }}>
                {t('landing.collectMiles.unifiedMiles.paragraph2Intro', 
                  'No need to register any more for:')}
              </p>
              <ul style={{ 
                listStyle: 'none', 
                padding: 0, 
                margin: '0 0 8px 0',
                textAlign: 'left'
              }}>
                <li className="section-description" style={{ 
                  marginBottom: '5px'
                }}>
                  {t('landing.collectMiles.unifiedMiles.paragraph2Item1', 
                    '•10 different airline loyalty programs')}
                </li>
                <li className="section-description" style={{ 
                  marginBottom: '5px'
                }}>
                  {t('landing.collectMiles.unifiedMiles.paragraph2Item2', 
                    '•20 different hotel loyalty programs')}
                </li>
                <li className="section-description" style={{ 
                  marginBottom: '0'
                }}>
                  {t('landing.collectMiles.unifiedMiles.paragraph2Item3', 
                    '•30 different restaurant & coffee shop loyalty programs')}
                </li>
              </ul>
              <p className="section-description" style={{ marginBottom: '0' }}>
                {t('landing.collectMiles.unifiedMiles.paragraph2End', 
                  'All your rewards are now unified & in one place. Keep track of all your activity & Miles collected from different places in one window.')}
              </p>
            </div>
            <p className="section-description">
              {t('landing.collectMiles.unifiedMiles.paragraph3', 
                'Move over, IMS Miles never expire, nor capped, giving flexibility & control over your rewards. With a wide range of ecosystem partners, you can collect miles with your daily activity at your home country or abroad, while on a business trip.')}
            </p>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  )
}

