"use client"

import React, { useState, useEffect } from 'react'

const BackgroundCarousel = () => {
  const images = [
    '/images/landing/istanbul.webp',
    '/images/landing/maldives.jpg',
    '/images/landing/parish.jpg',
    '/images/landing/beach.jpg'
  ]
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length)
    }, 5000) // Переключение каждые 5 секунд

    return () => clearInterval(interval)
  }, [images.length])

  return (
    <div className="background-carousel">
      {images.map((image, index) => (
        <div
          key={index}
          className={`carousel-slide ${index === currentIndex ? 'active' : ''}`}
          style={{ backgroundImage: `url(${image})` }}
        />
      ))}
      <div className="carousel-overlay"></div>
    </div>
  )
}

export default BackgroundCarousel

