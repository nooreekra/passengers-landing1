class AuthService {
  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || ''
  }

  getApiUrl(endpoint) {
    return `${this.baseURL}${endpoint}`
  }

  getAuthHeaders(token) {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  }

  // Login user with email and password
  async login(credentials) {
    try {
      const response = await fetch(this.getApiUrl('/api/auth/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      // Store tokens and user data (API returns accessToken, not access_token)
      if (data.accessToken) {
        localStorage.setItem('access_token', data.accessToken)
      }
      if (data.refreshToken) {
        localStorage.setItem('refresh_token', data.refreshToken)
      }
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user))
      }
      if (data.accessTokenExpiresAt) {
        // Convert ISO string to timestamp
        const expiresAt = new Date(data.accessTokenExpiresAt).getTime()
        localStorage.setItem('token_expires_at', expiresAt)
      }

      return data
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  // Refresh access token
  async refreshToken() {
    try {
      const refreshToken = localStorage.getItem('refresh_token')
      if (!refreshToken) {
        throw new Error('No refresh token available')
      }

      const response = await fetch(this.getApiUrl('/api/auth/refresh'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          refresh_token: refreshToken
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.access_token) {
        localStorage.setItem('access_token', data.access_token)
      }
      if (data.expires_in) {
        localStorage.setItem('token_expires_at', Date.now() + (data.expires_in * 1000))
      }

      return data
    } catch (error) {
      console.error('Token refresh error:', error)
      this.logout()
      throw error
    }
  }

  // Logout user
  async logout() {
    try {
      const accessToken = localStorage.getItem('access_token')
      
      if (accessToken) {
        await fetch(this.getApiUrl('/api/auth/logout'), {
          method: 'POST',
          headers: this.getAuthHeaders(accessToken)
        })
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Clear all stored data
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
      localStorage.removeItem('token_expires_at')
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    const token = localStorage.getItem('access_token')
    const expiresAt = localStorage.getItem('token_expires_at')
    
    if (!token) return false
    
    if (expiresAt && Date.now() > parseInt(expiresAt)) {
      this.logout()
      return false
    }
    
    return true
  }

  // Get current user data
  getCurrentUser() {
    const userStr = localStorage.getItem('user')
    return userStr ? JSON.parse(userStr) : null
  }

  // Get access token
  getAccessToken() {
    return localStorage.getItem('access_token')
  }

  // Register new user
  async register(userData) {
    try {
      // Определяем язык из браузера или используем значение по умолчанию
      const language = navigator.language || 'en-US'
      
      const response = await fetch(this.getApiUrl('/api/auth/register'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Accept-Language': language
        },
        body: JSON.stringify({
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          password: userData.password,
          phone: userData.phone,
          country: userData.country // ID страны (string)
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      // Если статус 204 No Content, возвращаем пустой объект
      if (response.status === 204) {
        return {}
      }

      // Проверяем, есть ли тело ответа перед парсингом JSON
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        const text = await response.text()
        if (text) {
          return JSON.parse(text)
        }
      }
      
      return {}
    } catch (error) {
      console.error('Registration error:', error)
      throw error
    }
  }

  // Confirm email with code
  async confirmEmail(email, code) {
    try {
      // Определяем язык из браузера или используем значение по умолчанию
      const language = navigator.language || 'en-US'
      
      const response = await fetch(this.getApiUrl('/api/auth/confirm'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Accept-Language': language
        },
        body: JSON.stringify({
          email: email,
          code: code
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      // Если статус 204 No Content, возвращаем пустой объект
      if (response.status === 204) {
        return {}
      }

      // Проверяем, есть ли тело ответа перед парсингом JSON
      const contentType = response.headers.get('content-type')
      let data = {}
      if (contentType && contentType.includes('application/json')) {
        const text = await response.text()
        if (text) {
          data = JSON.parse(text)
        }
      }
      
      // Store tokens and user data if provided
      if (data.accessToken) {
        localStorage.setItem('access_token', data.accessToken)
      }
      if (data.refreshToken) {
        localStorage.setItem('refresh_token', data.refreshToken)
      }
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user))
      }
      if (data.accessTokenExpiresAt) {
        const expiresAt = new Date(data.accessTokenExpiresAt).getTime()
        localStorage.setItem('token_expires_at', expiresAt)
      }

      return data
    } catch (error) {
      console.error('Email confirmation error:', error)
      throw error
    }
  }

  // Request password reset
  async requestPasswordReset(email) {
    try {
      // Определяем язык из браузера или используем значение по умолчанию
      const language = navigator.language || 'en-US'
      
      const response = await fetch(this.getApiUrl('/api/auth/request-password-reset'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Accept-Language': language
        },
        body: JSON.stringify({
          email: email
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || errorData.message || `HTTP error! status: ${response.status}`)
      }

      // Если статус 204 No Content, возвращаем пустой объект
      if (response.status === 204) {
        return {}
      }

      // Проверяем, есть ли тело ответа перед парсингом JSON
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        const text = await response.text()
        if (text) {
          return JSON.parse(text)
        }
      }
      
      return {}
    } catch (error) {
      console.error('Password reset request error:', error)
      throw error
    }
  }

  // Confirm password reset
  async confirmPasswordReset(email, token, newPassword) {
    try {
      // Определяем язык из браузера или используем значение по умолчанию
      const language = navigator.language || 'en-US'
      
      const response = await fetch(this.getApiUrl('/api/auth/confirm-password-reset'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Accept-Language': language
        },
        body: JSON.stringify({
          email: email,
          token: token,
          newPassword: newPassword
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || errorData.message || `HTTP error! status: ${response.status}`)
      }

      // Если статус 204 No Content, возвращаем пустой объект
      if (response.status === 204) {
        return {}
      }

      // Проверяем, есть ли тело ответа перед парсингом JSON
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        const text = await response.text()
        if (text) {
          return JSON.parse(text)
        }
      }
      
      return {}
    } catch (error) {
      console.error('Password reset confirmation error:', error)
      throw error
    }
  }
}

export default new AuthService()
