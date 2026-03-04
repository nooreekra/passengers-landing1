"use client"

import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'

const ForgotPasswordForm = ({ onSubmit, isLoading, onBack }) => {
  const { t } = useTranslation()
  const [formData, setFormData] = useState({
    email: ''
  })
  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Очистка ошибки при изменении поля
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.email) {
      newErrors.email = t('auth.forgotPasswordForm.errors.emailRequired')
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('auth.forgotPasswordForm.errors.emailInvalid')
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (validateForm()) {
      onSubmit({
        email: formData.email.trim()
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="login-form">
      <div className="form-group">
        <label htmlFor="email" className="form-label">
          {t('auth.forgotPasswordForm.email')}
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className={`form-input ${errors.email ? 'error' : ''}`}
          placeholder={t('auth.forgotPasswordForm.enterEmail')}
          disabled={isLoading}
        />
        {errors.email && (
          <div className="field-error">{errors.email}</div>
        )}
        <div style={{ marginTop: '8px', fontSize: '12px', color: '#718096' }}>
          {t('auth.forgotPasswordForm.instructions')}
        </div>
      </div>

      <button
        type="submit"
        className="login-button"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <span className="loading-spinner"></span>
            {t('auth.forgotPasswordForm.sending')}
          </> 
        ) : (
          t('auth.forgotPasswordForm.sendResetLink')
        )}
      </button>

      {onBack && (
        <button
          type="button"
          className="back-button"
          onClick={onBack}
          disabled={isLoading}
        >
          {t('auth.forgotPasswordForm.back')}
        </button>
      )}
    </form>
  )
}

export default ForgotPasswordForm

