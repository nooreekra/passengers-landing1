import React from 'react'

const PartnersCarousel = () => {
  const partners = Array.from({ length: 6 }, (_, i) => ({
    id: i + 1,
    name: 'Партнеры'
  }))

  return (
    <div className="partners-carousel-container">
      <div className="partners-carousel">
        {partners.map((partner) => (
          <div key={partner.id} className="partner-item">
            <div className="partner-text">{partner.name}</div>
          </div>
        ))}
        {/* Дублируем для бесшовной прокрутки */}
        {partners.map((partner) => (
          <div key={`duplicate-${partner.id}`} className="partner-item">
            <div className="partner-text">{partner.name}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default PartnersCarousel





