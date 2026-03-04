"use client"

import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'

const LoginForm = ({ onSubmit, isLoading, onForgotPassword }) => {
  const { t } = useTranslation()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
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
      newErrors.email = t('auth.loginForm.errors.emailRequired')
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('auth.loginForm.errors.emailInvalid')
    }
    
    if (!formData.password) {
      newErrors.password = t('auth.loginForm.errors.passwordRequired')
    } else if (formData.password.length < 6) {
      newErrors.password = t('auth.loginForm.errors.passwordMinLength')
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (validateForm()) {
      onSubmit(formData)
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  return (
    <form onSubmit={handleSubmit} className="login-form">
      <div className="form-group">
        <label htmlFor="email" className="form-label">
          {t('auth.loginForm.email')}
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className={`form-input ${errors.email ? 'error' : ''}`}
          placeholder={t('auth.loginForm.enterEmail')}
          disabled={isLoading}
        />
        {errors.email && (
          <div className="field-error">{errors.email}</div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="password" className="form-label">
          {t('auth.loginForm.password')}
        </label>
        <div className="password-container">
          <input
            type={showPassword ? 'text' : 'password'}
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className={`form-input ${errors.password ? 'error' : ''}`}
            placeholder={t('auth.loginForm.enterPassword')}
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
        {errors.password && (
          <div className="field-error">{errors.password}</div>
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
            {t('auth.loginForm.signingIn')}
          </> 
        ) : (
          t('auth.loginForm.signIn')
        )}
      </button>

      <div className="forgot-password">
        <a 
          href="#" 
          onClick={(e) => {
            e.preventDefault()
            if (onForgotPassword) {
              onForgotPassword()
            }
          }}
        >
          {t('auth.loginForm.forgotPassword')}
        </a>
      </div>
    </form>
  )
}

export default LoginForm

