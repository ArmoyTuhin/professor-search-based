import axios from 'axios'
import { API_BASE_URL, isBackendConfigured } from '../config/apiConfig'

// Check if backend is configured
if (!isBackendConfigured() && import.meta.env.PROD) {
  console.warn('⚠️ Backend URL not configured! Please update src/config/apiConfig.js with your ngrok URL')
}

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Add request interceptor to include auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Add response interceptor to handle 401 errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('authToken')
      window.location.href = '#/login'
    }
    return Promise.reject(error)
  }
)

export default apiClient
export { API_BASE_URL }

