"use client"

import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import agreementsService from '../services/agreementsService'

const AgreementsModal = ({ isOpen, onClose, onAccept, entityType = 'Business' }) => {
  const { t } = useTranslation()
  const [agreements, setAgreements] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [checkedAgreements, setCheckedAgreements] = useState(new Set())
  const [viewingAgreement, setViewingAgreement] = useState(null)

  // Загрузка соглашений при открытии модалки
  useEffect(() => {
    if (isOpen) {
      loadAgreements()
    }
  }, [isOpen, entityType])

  const loadAgreements = async () => {
    setIsLoading(true)
    setError('')
    setCheckedAgreements(new Set())
    setViewingAgreement(null)
    
    try {
      const data = await agreementsService.getAgreements(entityType)
      setAgreements(data || [])
    } catch (err) {
      console.error('Error loading agreements:', err)
      setError(t('auth.agreementsModal.loadError'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleAgreement = (index) => {
    setCheckedAgreements(prev => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }

  const handleOpenAgreement = (agreement) => {
    setViewingAgreement(agreement)
  }

  const handleCloseViewer = () => {
    setViewingAgreement(null)
  }

  const handleAccept = () => {
    // Проверяем, что все соглашения отмечены
    const allChecked = agreements.length > 0 
      ? agreements.every((_, index) => checkedAgreements.has(index))
      : true
    
    if (allChecked) {
      onAccept()
    }
  }

  const allAgreementsChecked = agreements.length > 0 
    ? agreements.every((_, index) => checkedAgreements.has(index))
    : true

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
    <>
      <div className="auth-modal-overlay" onClick={onClose}>
        <div className="auth-modal-content agreements-modal-content" onClick={(e) => e.stopPropagation()}>
          <button className="auth-modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
          
          <div className="auth-modal-header">
            <h2 className="auth-modal-title">{t('auth.agreementsModal.title')}</h2>
            <p className="auth-modal-subtitle">
              {t('auth.agreementsModal.subtitle')}
            </p>
          </div>

          {isLoading ? (
            <div className="agreements-loading">
              <span className="loading-spinner"></span>
              <p>{t('auth.agreementsModal.loading')}</p>
            </div>
          ) : error ? (
            <div className="error-message">
              {error}
            </div>
          ) : agreements.length === 0 ? (
            <div className="agreements-empty">
              <p>{t('auth.agreementsModal.noAgreements')}</p>
              <button
                className="login-button"
                onClick={handleAccept}
              >
                {t('auth.agreementsModal.continueRegistration')}
              </button>
            </div>
          ) : (
            <>
              <div className="agreements-list">
                {agreements.map((agreement, index) => (
                  <div key={agreement.id || index} className="agreement-list-item">
                    <label className="agreement-checkbox-label">
                      <input
                        type="checkbox"
                        checked={checkedAgreements.has(index)}
                        onChange={() => handleToggleAgreement(index)}
                        className="agreement-checkbox"
                      />
                      <span 
                        className="agreement-link"
                        onClick={() => handleOpenAgreement(agreement)}
                        title={t('auth.agreementsModal.clickToView')}
                      >
                        {agreement.title}
                      </span>
                    </label>
                    <div className="agreement-meta-small">
                      <span>{t('auth.agreementsModal.version')}: {agreement.version}</span>
                      <span>{t('auth.agreementsModal.updated')}: {new Date(agreement.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="agreements-progress">
                <p className="progress-text">
                  {t('auth.agreementsModal.readProgress')}: {checkedAgreements.size} {t('auth.agreementsModal.of')} {agreements.length}
                </p>
              </div>

              <button
                className="login-button"
                onClick={handleAccept}
                disabled={!allAgreementsChecked}
              >
                {allAgreementsChecked ? t('auth.agreementsModal.acceptAndContinue') : t('auth.agreementsModal.pleaseReadAll')}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Модальное окно для просмотра документа */}
      {viewingAgreement && (
        <div className="auth-modal-overlay" onClick={handleCloseViewer}>
          <div className="auth-modal-content agreement-viewer-content" onClick={(e) => e.stopPropagation()}>
            <button className="auth-modal-close" onClick={handleCloseViewer} aria-label="Close">
              ×
            </button>
            
            <div className="auth-modal-header">
              <h2 className="auth-modal-title">{viewingAgreement.title}</h2>
              <div className="agreement-meta">
                <span>{t('auth.agreementsModal.version')}: {viewingAgreement.version}</span>
                <span>{t('auth.agreementsModal.updated')}: {new Date(viewingAgreement.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="agreement-content-viewer">
              <div 
                className="agreement-text"
                dangerouslySetInnerHTML={{ __html: viewingAgreement.content }}
              />
            </div>

            <button
              className="login-button"
              onClick={handleCloseViewer}
            >
              {t('auth.agreementsModal.close')}
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default AgreementsModal

