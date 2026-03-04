"use client"

import React, { useEffect } from 'react'
import LandingPage from '../../../LandingPage'

export default function TransactionConfirmPage({ params }: { params: { code: string } }) {
  // Сохраняем код транзакции в sessionStorage для использования после авторизации
  useEffect(() => {
    if (params.code) {
      sessionStorage.setItem('pendingTransactionCode', params.code)
    }
  }, [params.code])

  return <LandingPage autoOpenAuth={true} qrCode={params.code} />
}

