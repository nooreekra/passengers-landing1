"use client"

import React from 'react'
import { useTranslation } from 'react-i18next'

const Footer = () => {
  const { t } = useTranslation()
  const currentYear = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <p className="footer-copyright">
            © {currentYear} {t('landing.footer.copyright')}
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer

