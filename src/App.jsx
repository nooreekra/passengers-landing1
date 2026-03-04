import React from 'react'
import Header from './components/Header'
import BackgroundCarousel from './components/BackgroundCarousel'
import MilesAnimation from './components/MilesAnimation'
import CollectMiles from './components/CollectMiles'
import SpendMiles from './components/SpendMiles'
import AllExtras from './components/AllExtras'
import StatusBenefits from './components/StatusBenefits'
import PartnersBenefits from './components/PartnersBenefits'
import Footer from './components/Footer'

function App() {
  return (
    <div className="App">
      <div className="home-page">
        {/* Hero Section with Carousel */}
        <section className="hero-section">
          <BackgroundCarousel />
          <Header />
          <div className="hero-content">
            <div className="landing-content-wrapper">
              <div className="landing-content">
                <h1 className="landing-title">
                  Our Partners pay<br />
                  for your Holiday
                </h1>
                <MilesAnimation />
              </div>
            </div>
          </div>
        </section>

        {/* Spend Miles Section */}
        <section className="spend-section">
          <SpendMiles />
        </section>


        {/* Collect Miles Section */}
        <section className="collect-section">
          <CollectMiles />
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
    </div>
  )
}

export default App
