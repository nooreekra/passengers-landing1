"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-toastify'
import LoginForm from './LoginForm'
import RegistrationForm from './RegistrationForm'
import ConfirmForm from './ConfirmForm'
import ForgotPasswordForm from './ForgotPasswordForm'
import ResetPasswordForm from './ResetPasswordForm'
import AgreementsModal from './AgreementsModal'
import authService from '../services/authService'
import { login, getMe } from '@/shared/api/auth'
import { getCurrentBusiness } from '@/shared/api/business'
import { confirmDraftTransaction } from '@/shared/api/ingestion'
import { setTokens } from '@/store/slices/authSlice'
import { setUser } from '@/store/slices/userSlice'
import { setBusiness } from '@/store/slices/businessSlice'

const roleToPath = {
  TravelAgent: '/dashboard/agent',
  TravelAgency: '/dashboard/agency',
  Airline: '/dashboard/airline',
  Partnership: '/dashboard/partnership',
  Passenger: '/passenger',
}

const AuthModal = ({ isOpen, onClose }) => {
  const { t } = useTranslation()
  const router = useRouter()
  const dispatch = useDispatch()
  const [mode, setMode] = useState('login') // 'login' or 'register'
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [registrationEmail, setRegistrationEmail] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [showAgreements, setShowAgreements] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [showResetPassword, setShowResetPassword] = useState(false)
  const [resetPasswordEmail, setResetPasswordEmail] = useState('')

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

  // Функция для подтверждения транзакции после авторизации
  const confirmPendingTransaction = async () => {
    try {
      const pendingCode = sessionStorage.getItem('pendingTransactionCode')
      if (!pendingCode) {
        return // Нет ожидающей транзакции
      }

      await confirmDraftTransaction(pendingCode)
      
      // Успешное подтверждение
      toast.success(t('transaction.confirm.success') || 'Транзакция начислена')
      
      // Удаляем код из sessionStorage после успешного подтверждения
      sessionStorage.removeItem('pendingTransactionCode')
    } catch (err) {
      console.error('Transaction confirmation error:', err)
      
      const statusCode = err?.response?.status
      
      if (statusCode === 404) {
        // Сессия истекла
        toast.error(t('transaction.confirm.sessionExpired') || 'Сессия истекла')
        sessionStorage.removeItem('pendingTransactionCode')
      } else {
        // Другие ошибки - просто удаляем код, чтобы не пытаться снова
        sessionStorage.removeItem('pendingTransactionCode')
      }
    }
  }

  const handleLogin = async (credentials) => {
    setIsLoading(true)
    setError('')
    setSuccess('')
    
    try {
      // Используем старую логику авторизации с сессией
      const { accessToken, refreshToken } = await login(credentials.email, credentials.password)
      
      // Сохраняем токены в Redux
      dispatch(setTokens({ accessToken, refreshToken }))
      
      // Получаем данные пользователя
      const user = await getMe()
      dispatch(setUser(user))
      
      // Пассажиры не имеют бизнеса, пропускаем запрос
      if (user.role.type !== 'Passenger') {
        let business = null
        try {
          business = await getCurrentBusiness()
        } catch (_) {
          if (user.role.type !== 'TravelAgent') {
            throw _
          }
        }
        if (business) {
          dispatch(setBusiness(business))
        }
      }
      
      // Сохраняем сессию в cookies через API
      await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken, role: user.role.type }),
        credentials: 'include',
      })
      
      // Подтверждаем транзакцию, если есть ожидающая транзакция
      await confirmPendingTransaction()
      
      // Перенаправляем на соответствующий дашборд
      const path = roleToPath[user.role.type] ?? '/'
      setSuccess(t('auth.modal.success.loginSuccess'))
      setTimeout(() => {
        router.replace(path)
        onClose()
      }, 1000)
    } catch (err) {
      console.error('Login error:', err)
      
      // Обработка ошибок из API
      const apiError = err?.response?.data
      const statusCode = err?.response?.status
      
      // Проверяем детальное сообщение об ошибке (приоритет)
      if (apiError?.detail) {
        // Если это ошибка неверных учетных данных, показываем локализованное сообщение
        if (statusCode === 400 && (apiError.title?.includes('Invalid.Credential') || apiError.detail?.toLowerCase().includes('invalid credential'))) {
          setError(t('auth.modal.errors.invalidEmailOrPassword'))
        } else {
          setError(apiError.detail)
        }
      } else if (apiError?.errors) {
        const firstError = Object.values(apiError.errors)?.[0]?.[0]
        setError(firstError || t('auth.modal.errors.loginError'))
      } else if (apiError?.message) {
        setError(apiError.message)
      } else if (statusCode === 400) {
        // Ошибка 400 - неверные учетные данные
        setError(t('auth.modal.errors.invalidEmailOrPassword'))
      } else if (statusCode === 401) {
        setError(t('auth.modal.errors.invalidEmailOrPassword'))
      } else if (statusCode === 403) {
        setError(t('auth.modal.errors.accessDenied'))
      } else if (statusCode === 500) {
        setError(t('auth.modal.errors.serverError'))
      } else if (err.message) {
        if (err.message.includes('401') || err.message.includes('Unauthorized')) {
          setError(t('auth.modal.errors.invalidEmailOrPassword'))
        } else if (err.message.includes('403') || err.message.includes('Forbidden')) {
          setError(t('auth.modal.errors.accessDenied'))
        } else if (err.message.includes('500') || err.message.includes('Internal Server Error')) {
          setError(t('auth.modal.errors.serverError'))
        } else if (err.message.includes('Network') || err.message.includes('fetch')) {
          setError(t('auth.modal.errors.networkError'))
        } else {
          setError(err.message)
        }
      } else {
        setError(t('auth.modal.errors.loginError'))
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (userData) => {
    setIsLoading(true)
    setError('')
    setSuccess('')
    
    try {
      await authService.register(userData)
      setRegistrationEmail(userData.email)
      setShowConfirm(true)
      setSuccess(t('auth.modal.success.registrationSuccess'))
      
      // Автоматически скрываем сообщение об успехе через 5 секунд
      setTimeout(() => {
        setSuccess('')
      }, 5000)
    } catch (err) {
      console.error('Registration error:', err)
      
      if (err.message.includes('400') || err.message.includes('Bad Request')) {
        setError(t('auth.modal.errors.checkData'))
      } else if (err.message.includes('409') || err.message.includes('Conflict')) {
        setError(t('auth.modal.errors.userExists'))
      } else if (err.message.includes('500') || err.message.includes('Internal Server Error')) {
        setError(t('auth.modal.errors.serverError'))
      } else if (err.message.includes('Network') || err.message.includes('fetch')) {
        setError(t('auth.modal.errors.networkError'))
      } else {
        setError(err.message || t('auth.modal.errors.registrationError'))
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirm = async (confirmData) => {
    setIsLoading(true)
    setError('')
    setSuccess('')
    
    try {
      // Используем authService для подтверждения, так как это специфичная логика регистрации
      const response = await authService.confirmEmail(confirmData.email, confirmData.code)
      
      if (response && response.accessToken) {
        // Если после подтверждения получен токен, используем старую логику авторизации
        const { accessToken, refreshToken } = response
        
        // Сохраняем токены в Redux
        dispatch(setTokens({ accessToken, refreshToken }))
        
        // Получаем данные пользователя
        const user = await getMe()
        dispatch(setUser(user))
        
        // Пассажиры не имеют бизнеса, пропускаем запрос
        if (user.role.type !== 'Passenger') {
          let business = null
          try {
            business = await getCurrentBusiness()
          } catch (_) {
            if (user.role.type !== 'TravelAgent') {
              throw _
            }
          }
          if (business) {
            dispatch(setBusiness(business))
          }
        }
        
        // Сохраняем сессию в cookies через API
        await fetch('/api/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessToken, role: user.role.type }),
          credentials: 'include',
        })
        
        // Подтверждаем транзакцию, если есть ожидающая транзакция
        await confirmPendingTransaction()
        
        // Перенаправляем на соответствующий дашборд
        const path = roleToPath[user.role.type] ?? '/'
        setSuccess(t('auth.modal.success.emailConfirmed'))
        setTimeout(() => {
          router.replace(path)
          onClose()
        }, 1500)
      } else {
        setSuccess(t('auth.modal.success.emailConfirmedSimple'))
        setTimeout(() => {
          setShowConfirm(false)
          setMode('login')
        }, 2000)
      }
    } catch (err) {
      console.error('Confirmation error:', err)
      
      // Обработка ошибок
      const apiError = err?.response?.data
      if (apiError?.errors) {
        const firstError = Object.values(apiError.errors)?.[0]?.[0]
        setError(firstError || 'An error occurred during confirmation')
      } else if (apiError?.message) {
        setError(apiError.message)
      } else if (err.message) {
        if (err.message.includes('400') || err.message.includes('Bad Request')) {
          setError(t('auth.modal.errors.invalidCode'))
        } else if (err.message.includes('404') || err.message.includes('Not Found')) {
          setError(t('auth.modal.errors.codeNotFound'))
        } else if (err.message.includes('500') || err.message.includes('Internal Server Error')) {
          setError(t('auth.modal.errors.serverError'))
        } else if (err.message.includes('Network') || err.message.includes('fetch')) {
          setError(t('auth.modal.errors.networkError'))
        } else {
          setError(err.message)
        }
      } else {
        setError(t('auth.modal.errors.confirmationError'))
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackToRegistration = () => {
    setShowConfirm(false)
    setError('')
    setSuccess('')
  }

  const handleForgotPassword = () => {
    setShowForgotPassword(true)
    setError('')
    setSuccess('')
  }

  const handleRequestPasswordReset = async (data) => {
    setIsLoading(true)
    setError('')
    setSuccess('')
    
    try {
      await authService.requestPasswordReset(data.email)
      setResetPasswordEmail(data.email)
      setShowForgotPassword(false)
      setShowResetPassword(true)
      setSuccess(t('auth.modal.success.passwordResetLinkSent'))
      
      // Автоматически скрываем сообщение об успехе через 5 секунд
      setTimeout(() => {
        setSuccess('')
      }, 5000)
    } catch (err) {
      console.error('Password reset request error:', err)
      
      if (err.message.includes('400') || err.message.includes('Bad Request')) {
        setError(t('auth.modal.errors.invalidEmail'))
      } else if (err.message.includes('404') || err.message.includes('Not Found')) {
        setError(t('auth.modal.errors.userNotFound'))
      } else if (err.message.includes('500') || err.message.includes('Internal Server Error')) {
        setError(t('auth.modal.errors.serverError'))
      } else if (err.message.includes('Network') || err.message.includes('fetch')) {
        setError(t('auth.modal.errors.networkError'))
      } else {
        setError(err.message || t('auth.modal.errors.passwordResetRequestError'))
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirmPasswordReset = async (data) => {
    setIsLoading(true)
    setError('')
    setSuccess('')
    
    try {
      await authService.confirmPasswordReset(data.email, data.token, data.newPassword)
      setSuccess(t('auth.modal.success.passwordResetSuccess'))
      
      // Автоматически переключаемся на форму входа через 2 секунды
      setTimeout(() => {
        setShowResetPassword(false)
        setShowForgotPassword(false)
        setMode('login')
        setSuccess('')
      }, 2000)
    } catch (err) {
      console.error('Password reset confirmation error:', err)
      
      if (err.message.includes('400') || err.message.includes('Bad Request')) {
        setError(t('auth.modal.errors.invalidTokenOrPassword'))
      } else if (err.message.includes('404') || err.message.includes('Not Found')) {
        setError(t('auth.modal.errors.tokenNotFound'))
      } else if (err.message.includes('500') || err.message.includes('Internal Server Error')) {
        setError(t('auth.modal.errors.serverError'))
      } else if (err.message.includes('Network') || err.message.includes('fetch')) {
        setError(t('auth.modal.errors.networkError'))
      } else {
        setError(err.message || t('auth.modal.errors.passwordResetError'))
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackToForgotPassword = () => {
    setShowResetPassword(false)
    setShowForgotPassword(true)
    setError('')
    setSuccess('')
  }

  const handleBackToLogin = () => {
    setShowForgotPassword(false)
    setShowResetPassword(false)
    setError('')
    setSuccess('')
  }

  const handleModeChange = (newMode) => {
    setMode(newMode)
    setError('')
    setSuccess('')
    setShowConfirm(false)
    setShowAgreements(false)
    setShowForgotPassword(false)
    setShowResetPassword(false)
    setRegistrationEmail('')
    setResetPasswordEmail('')
    
    // Если переключаемся на регистрацию, показываем модалку соглашений
    if (newMode === 'register') {
      setShowAgreements(true)
    }
  }

  const handleAgreementsAccept = () => {
    setShowAgreements(false)
    // После принятия соглашений показываем форму регистрации
  }

  const handleClose = () => {
    setMode('login')
    setError('')
    setSuccess('')
    setShowConfirm(false)
    setShowAgreements(false)
    setShowForgotPassword(false)
    setShowResetPassword(false)
    setRegistrationEmail('')
    setResetPasswordEmail('')
    onClose()
  }

  if (!isOpen) return null

  // Если нужно показать модалку соглашений, показываем её
  if (showAgreements && mode === 'register') {
    return (
      <AgreementsModal
        isOpen={true}
        onClose={() => {
          setShowAgreements(false)
          setMode('login')
        }}
        onAccept={handleAgreementsAccept}
        entityType="Business"
      />
    )
  }

  return (
    <div className="auth-modal-overlay" onClick={handleClose}>
      <div className="auth-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="auth-modal-close" onClick={handleClose} aria-label="Close">
          ×
        </button>
        
        <div className="auth-modal-header">
          <h2 className="auth-modal-title">{t('auth.modal.welcome')}</h2>
          <p className="auth-modal-subtitle">
            {showConfirm 
              ? t('auth.modal.confirmEmail')
              : showForgotPassword
                ? t('auth.modal.forgotPassword')
                : showResetPassword
                  ? t('auth.modal.resetPassword')
                  : mode === 'login'
                    ? t('auth.modal.signInToAccount')
                    : t('auth.modal.signUp')}
          </p>
        </div>

        {!showConfirm && !showForgotPassword && !showResetPassword && (
          <div className="tabs-container">
            <button
              className={`tab-button ${mode === 'login' ? 'active' : ''}`}
              onClick={() => handleModeChange('login')}
              disabled={isLoading}
            >
              {t('auth.modal.signIn')}
            </button>
            <button
              className={`tab-button ${mode === 'register' ? 'active' : ''}`}
              onClick={() => handleModeChange('register')}
              disabled={isLoading}
            >
              {t('auth.modal.signUpButton')}
            </button>
          </div>
        )}
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {success && (
          <div className="success-message">
            {success}
          </div>
        )}
        
        {showConfirm ? (
          <ConfirmForm
            email={registrationEmail}
            onSubmit={handleConfirm}
            isLoading={isLoading}
            onBack={handleBackToRegistration}
          />
        ) : showForgotPassword ? (
          <ForgotPasswordForm
            onSubmit={handleRequestPasswordReset}
            isLoading={isLoading}
            onBack={handleBackToLogin}
          />
        ) : showResetPassword ? (
          <ResetPasswordForm
            email={resetPasswordEmail}
            onSubmit={handleConfirmPasswordReset}
            isLoading={isLoading}
            onBack={handleBackToForgotPassword}
          />
        ) : mode === 'login' ? (
          <LoginForm 
            onSubmit={handleLogin}
            isLoading={isLoading}
            onForgotPassword={handleForgotPassword}
          />
        ) : (
          <RegistrationForm
            onSubmit={handleRegister}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  )
}

export default AuthModal







