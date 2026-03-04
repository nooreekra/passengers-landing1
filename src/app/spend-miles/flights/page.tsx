"use client"

import React from 'react'
import { useTranslation } from 'react-i18next'
import { Plane, CreditCard, Ticket, Globe } from 'lucide-react'
import Header from '../../../components/Header'
import Footer from '../../../components/Footer'

export default function FlightsPage() {
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
            {t('landing.spendMiles.title', 'Spend Miles')} - {t('landing.spendMiles.flights.title', 'Flights')}
          </h1>
          
          <div style={{ maxWidth: '900px', marginLeft: 'auto', marginRight: 'auto', marginBottom: '20px' }}>
            <p className="section-description" style={{ marginBottom: '15px' }}>
              {t('landing.spendMiles.description', 
                'Spend collected miles to book your weekend trip, annual family vacation or that exclusive dream holiday you\'ve been thinking about for some time. All paid by miles from our partners!!!')}
            </p>
            <p className="section-description">
              {t('landing.spendMiles.flights.description', 'Use your accumulated IMS Miles to book flights with our partner airlines. Whether you\'re planning a weekend getaway or a dream vacation, your miles can take you anywhere.')}
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
              {t('landing.spendMiles.flights.howItWorks', 'How It Works')}
            </h2>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li className="section-description" style={{ marginBottom: '10px', paddingLeft: '30px', position: 'relative' }}>
                <span style={{ position: 'absolute', left: 0, display: 'flex', alignItems: 'center' }}>
                  <Plane size={24} />
                </span>
                {t('landing.spendMiles.flights.step1', 'Choose your destination and travel dates')}
              </li>
              <li className="section-description" style={{ marginBottom: '10px', paddingLeft: '30px', position: 'relative' }}>
                <span style={{ position: 'absolute', left: 0, display: 'flex', alignItems: 'center' }}>
                  <CreditCard size={24} />
                </span>
                {t('landing.spendMiles.flights.step2', 'Select your flight and pay with IMS Miles')}
              </li>
              <li className="section-description" style={{ marginBottom: '10px', paddingLeft: '30px', position: 'relative' }}>
                <span style={{ position: 'absolute', left: 0, display: 'flex', alignItems: 'center' }}>
                  <Ticket size={24} />
                </span>
                {t('landing.spendMiles.flights.step3', 'Receive your booking confirmation')}
              </li>
              <li className="section-description" style={{ paddingLeft: '30px', position: 'relative' }}>
                <span style={{ position: 'absolute', left: 0, display: 'flex', alignItems: 'center' }}>
                  <Globe size={24} />
                </span>
                {t('landing.spendMiles.flights.step4', 'Enjoy your trip paid entirely with miles')}
              </li>
            </ul>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  )
}

