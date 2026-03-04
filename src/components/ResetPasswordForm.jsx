"use client"

import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'

const ResetPasswordForm = ({ email, onSubmit, isLoading, onBack }) => {
  const { t } = useTranslation()
  const [formData, setFormData] = useState({
    token: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
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
    
    if (!formData.token.trim()) {
      newErrors.token = t('auth.resetPasswordForm.errors.tokenRequired')
    }
    
    if (!formData.newPassword) {
      newErrors.newPassword = t('auth.resetPasswordForm.errors.passwordRequired')
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = t('auth.resetPasswordForm.errors.passwordMinLength')
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = t('auth.resetPasswordForm.errors.confirmPasswordRequired')
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = t('auth.resetPasswordForm.errors.passwordsDoNotMatch')
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (validateForm()) {
      onSubmit({
        email: email,
        token: formData.token.trim(),
        newPassword: formData.newPassword
      })
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword)
  }

  return (
    <form onSubmit={handleSubmit} className="login-form">
      <div className="form-group">
        <label htmlFor="token" className="form-label">
          {t('auth.resetPasswordForm.token')}
        </label>
        <input
          type="text"
          id="token"
          name="token"
          value={formData.token}
          onChange={handleChange}
          className={`form-input ${errors.token ? 'error' : ''}`}
          placeholder={t('auth.resetPasswordForm.enterToken')}
          disabled={isLoading}
        />
        {errors.token && (
          <div className="field-error">{errors.token}</div>
        )}
        <div style={{ marginTop: '8px', fontSize: '12px', color: '#718096' }}>
          {t('auth.resetPasswordForm.tokenInstructions')}
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="newPassword" className="form-label">
          {t('auth.resetPasswordForm.newPassword')}
        </label>
        <div className="password-container">
          <input
            type={showPassword ? 'text' : 'password'}
            id="newPassword"
            name="newPassword"
            value={formData.newPassword}
            onChange={handleChange}
            className={`form-input ${errors.newPassword ? 'error' : ''}`}
            placeholder={t('auth.resetPasswordForm.enterNewPassword')}
            disabled={isLoading}
          />
          <button
            type="button"
            className="password-toggle"
            onClick={togglePasswordVisibility}
            disabled={isLoading}
          >
            {showPassword ? '👁️' : '👁️‍🗨️'}
          </button>
        </div>
        {errors.newPassword && (
          <div className="field-error">{errors.newPassword}</div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="confirmPassword" className="form-label">
          {t('auth.resetPasswordForm.confirmPassword')}
        </label>
        <div className="password-container">
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
            placeholder={t('auth.resetPasswordForm.enterConfirmPassword')}
            disabled={isLoading}
          />
          <button
            type="button"
            className="password-toggle"
            onClick={toggleConfirmPasswordVisibility}
            disabled={isLoading}
          >
            {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
          </button>
        </div>
        {errors.confirmPassword && (
          <div className="field-error">{errors.confirmPassword}</div>
        )}
      </div>

      <button
        type="submit"
        className="login-button"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <span className="loading-spinner"></span>
            {t('auth.resetPasswordForm.resetting')}
          </> 
        ) : (
          t('auth.resetPasswordForm.resetPassword')
        )}
      </button>

      {onBack && (
        <button
          type="button"
          className="back-button"
          onClick={onBack}
          disabled={isLoading}
        >
          {t('auth.resetPasswordForm.back')}
        </button>
      )}
    </form>
  )
}

export default ResetPasswordForm

