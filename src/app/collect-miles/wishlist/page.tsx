"use client"

import React from 'react'
import { useTranslation } from 'react-i18next'
import Header from '../../../components/Header'
import Footer from '../../../components/Footer'

export default function WishlistPage() {
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
            {t('landing.collectMiles.wishlist.title', 'Wishlist')}
          </h1>
          
          <div style={{ maxWidth: '900px', marginLeft: 'auto', marginRight: 'auto', marginBottom: '30px' }}>
            <p className="section-description">
              {t('landing.collectMiles.wishlist.description', 
                'Start your wishlist & set up separate trips. System will connect sub wallets, so you could collect Miles separately for each trip.')}
            </p>
          </div>

          <div style={{ marginTop: '30px' }}>
            <h3 className="section-subtitle" style={{ 
              fontSize: '28px',
              marginBottom: '15px',
              textTransform: 'uppercase'
            }}>
              {t('landing.collectMiles.wishlist.ideas', 'Some ideas!')}
            </h3>

            <div style={{ display: 'grid', gap: '20px', marginTop: '20px' }}>
              {/* Weekend Escape */}
              <div style={{ 
                padding: '20px', 
                backgroundColor: '#f9f9f9', 
                borderRadius: '12px',
                border: '1px solid #e0e0e0'
              }}>
                <h4 className="section-subtitle" style={{ 
                  fontSize: '24px',
                  marginBottom: '10px',
                  textTransform: 'uppercase'
                }}>
                  {t('landing.collectMiles.wishlist.weekendEscape.title', 'Weekend Escape')}
                </h4>
                <p className="section-description" style={{ marginBottom: '10px' }}>
                  {t('landing.collectMiles.wishlist.weekendEscape.description', 
                    'Short trip to nearby destination, to unwind over the weekend in one of the closest megacities, or in the quiet of mountain chalet or ski for couple of days or escape in the quiet of the beach house.')}
                </p>
                <p className="section-description">
                  {t('landing.collectMiles.wishlist.weekendEscape.note', 
                    'It just takes a short flight & one night stay (Sat-Sun) to escape, hence can be achieved with the least amount of Miles to target.')}
                </p>
              </div>

              {/* Family Holiday */}
              <div style={{ 
                padding: '20px', 
                backgroundColor: '#f9f9f9', 
                borderRadius: '12px',
                border: '1px solid #e0e0e0'
              }}>
                <h4 className="section-subtitle" style={{ 
                  fontSize: '24px',
                  marginBottom: '10px',
                  textTransform: 'uppercase'
                }}>
                  {t('landing.collectMiles.wishlist.familyHoliday.title', 'Family Holiday')}
                </h4>
                <p className="section-description">
                  {t('landing.collectMiles.wishlist.familyHoliday.description', 
                    'Take your family to annual holiday & create ever lasting memories. All paid by Miles awarded by our partners. Doesn\'t it sound as a perfect vacation?')}
                </p>
              </div>

              {/* Buddies Trip */}
              <div style={{ 
                padding: '20px', 
                backgroundColor: '#f9f9f9', 
                borderRadius: '12px',
                border: '1px solid #e0e0e0'
              }}>
                <h4 className="section-subtitle" style={{ 
                  fontSize: '24px',
                  marginBottom: '10px',
                  textTransform: 'uppercase'
                }}>
                  {t('landing.collectMiles.wishlist.buddiesTrip.title', 'Buddies Trip')}
                </h4>
                <p className="section-description">
                  {t('landing.collectMiles.wishlist.buddiesTrip.description', 
                    'Have been planning a joint trip with your buddies or besties, classmates or siblings, but couldn\'t get it organised over years? Each person of the group can now set up personal target against common destination chosen & start collecting Miles. When all hit their targets, you are finally ready to take off!!!')}
                </p>
              </div>

              {/* Dream Destination */}
              <div style={{ 
                padding: '20px', 
                backgroundColor: '#f9f9f9', 
                borderRadius: '12px',
                border: '1px solid #e0e0e0'
              }}>
                <h4 className="section-subtitle" style={{ 
                  fontSize: '24px',
                  marginBottom: '10px',
                  textTransform: 'uppercase'
                }}>
                  {t('landing.collectMiles.wishlist.dreamDestination.title', 'Dream Destination')}
                </h4>
                <p className="section-description" style={{ marginBottom: '10px' }}>
                  {t('landing.collectMiles.wishlist.dreamDestination.description', 
                    'Tempting white sand beaches of Maldives, penthouse with bird\'s eye view over Central Park of New York or breathtaking winter scenes of Mont Blanc from an elegant mountain chalet. Have always been top of your mind? Yet, it keeps sleeping away as a perfect Dream.')}
                </p>
                <p className="section-description">
                  {t('landing.collectMiles.wishlist.dreamDestination.callToAction', 
                    'Choose your Dream Holiday Destination today, set the target & let the system keep topping it up daily. You can\'t keep postponing it forever.')}
                </p>
              </div>
            </div>

            <div style={{ 
              marginTop: '25px', 
              padding: '20px', 
              backgroundColor: '#fff3cd', 
              borderRadius: '12px',
              border: '1px solid #ffc107'
            }}>
              <p className="section-description" style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                {t('landing.collectMiles.wishlist.allocation.title', 'P/S:')}
              </p>
              <p className="section-description">
                {t('landing.collectMiles.wishlist.allocation.description', 
                  'Allocate 10%, 15% or 20% from each transaction, when you set up the rule, so your wishlist sub-wallets tops up every time you receive Miles. Ex: if you set 10% rule, every time you receive 100 Miles, 10 miles go to Wishlist sub-wallet & 90 Miles top up "Available to Redeem" in your wallet.')}
              </p>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  )
}

