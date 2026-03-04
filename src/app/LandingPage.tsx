"use client"

import React from 'react'
import { useTranslation } from 'react-i18next'
import Header from '../components/Header'
import BackgroundCarousel from '../components/BackgroundCarousel'
import MilesAnimation from '../components/MilesAnimation'
import CollectMiles from '../components/CollectMiles'
import SpendMiles from '../components/SpendMiles'
import AllExtras from '../components/AllExtras'
import StatusBenefits from '../components/StatusBenefits'
import PartnersBenefits from '../components/PartnersBenefits'
import Footer from '../components/Footer'

const LandingPage = ({ autoOpenAuth = false, qrCode = null }: { autoOpenAuth?: boolean; qrCode?: string | null }) => {
  const { t } = useTranslation()
  
  return (
    <div className="home-page">
      {/* Hero Section with Carousel */}
      <section className="hero-section">
        <BackgroundCarousel />
        <Header autoOpenAuth={autoOpenAuth} />
        <div className="hero-content">
          <div className="landing-content-wrapper">
            <div className="landing-content">
              <h1 className="landing-title">
                {(() => {
                  const titleLines = t('landing.hero.title').split('\n')
                  return titleLines.map((line, i) => (
                    <React.Fragment key={i}>
                      {line}
                      {i < titleLines.length - 1 && <br />}
                    </React.Fragment>
                  ))
                })()}
              </h1>
              <MilesAnimation />
            </div>
          </div>
        </div>
      </section>

      {/* Collect Miles Section */}
      <section className="collect-section">
        <CollectMiles />
      </section>

      {/* Spend Miles Section */}
      <section className="spend-section">
        <SpendMiles />
      </section>

      {/* Status Benefits Section */}
      <section className="status-section">
        <StatusBenefits />
      </section>

      {/* All Extras Section */}
      <section>
        <AllExtras />
      </section>

      {/* Partners Benefits Section */}
      <section className="partners-section">
        <PartnersBenefits />
      </section>

      {/* Footer */}
      <Footer />
    </div>
  )
}

export default LandingPage

