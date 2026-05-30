import axios from 'axios'

function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error) && error.response?.data) {
    const { message } = error.response.data as {
      message?: string | string[]
      statusCode?: number
    }
    if (Array.isArray(message)) {
      return message.join('. ')
    }
    if (typeof message === 'string') {
      return message
    }
  }
  if (error instanceof Error) {
    return error.message
  }
  return 'Error desconocido'
}

const apiClient = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use(
  async (config) => {
    const storedToken = localStorage.getItem('authToken')
    if (storedToken) {
      config.headers.Authorization = `Bearer ${storedToken}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken')
      window.dispatchEvent(new CustomEvent('auth:unauthorized'))
    }
    // Replace generic Axios message with the actual backend error
    const message = extractErrorMessage(error)
    return Promise.reject(new Error(message))
  },
)

export default apiClient
