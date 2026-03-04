class AgreementsService {
  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || ''
  }

  getApiUrl(endpoint) {
    return `${this.baseURL}${endpoint}`
  }

  // Get agreements by entity type (Business or User)
  async getAgreements(entityType = 'Business') {
    try {
      // Определяем язык из браузера или используем значение по умолчанию
      const language = navigator.language || 'en-US'
      
      const response = await fetch(this.getApiUrl(`/api/agreements/${entityType}`), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Accept-Language': language
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      // Если статус 204 No Content, возвращаем пустой массив
      if (response.status === 204) {
        return []
      }

      // Проверяем, есть ли тело ответа перед парсингом JSON
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        const text = await response.text()
        if (text) {
          return JSON.parse(text)
        }
      }
      
      return []
    } catch (error) {
      console.error('Get agreements error:', error)
      throw error
    }
  }
}

export default new AgreementsService()

