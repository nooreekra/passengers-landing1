"use client"

import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import i18n from '../shared/i18n'
import { Globe, X } from 'lucide-react'

const languages = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'ru', label: 'Russian', nativeLabel: 'Русский' },
  { code: 'kk', label: 'Kazakh', nativeLabel: 'Қазақша' },
]

const LanguageModal = ({ isOpen, onClose }) => {
  const { t } = useTranslation()
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language || 'en')

  // Слушаем изменения языка
  useEffect(() => {
    const handleLanguageChanged = (lng) => {
      setCurrentLanguage(lng)
    }
    
    i18n.on('languageChanged', handleLanguageChanged)
    return () => {
      i18n.off('languageChanged', handleLanguageChanged)
    }
  }, [])

  const handleLanguageChange = (langCode) => {
    i18n.changeLanguage(langCode)
    setCurrentLanguage(langCode)
    // Закрываем модалку после выбора
    setTimeout(() => {
      onClose()
    }, 200)
  }

  // Закрытие модалки по Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Блокировка скролла при открытой модалке
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="language-modal-overlay" onClick={onClose}>
      <div className="language-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="language-modal-close" onClick={onClose} aria-label="Close">
          <X size={24} />
        </button>
        
        <div className="language-modal-header">
          <h2 className="language-modal-title">Выберите язык</h2>
        </div>

        <div className="language-modal-list">
          {languages.map((lang) => {
            const isSelected = currentLanguage === lang.code
            return (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`language-modal-item ${isSelected ? 'active' : ''}`}
              >
                <div className="language-modal-item-content">
                  <Globe className={`language-modal-icon ${isSelected ? 'active' : ''}`} size={20} />
                  <div className="language-modal-item-text">
                    <div className={`language-modal-item-name ${isSelected ? 'active' : ''}`}>
                      {lang.nativeLabel}
                    </div>
                    <div className="language-modal-item-label">
                      {lang.label}
                    </div>
                  </div>
                </div>
                {isSelected && (
                  <div className="language-modal-check">✓</div>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default LanguageModal

