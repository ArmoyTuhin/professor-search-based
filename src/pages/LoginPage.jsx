import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import apiClient, { API_BASE_URL } from '../utils/axiosConfig'

function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginType, setLoginType] = useState('user') // 'user' or 'admin'
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    // Check if already logged in
    const token = localStorage.getItem('authToken')
    if (token) {
      // Verify token
      apiClient.get('/auth/verify')
      .then(() => {
        navigate('/')
      })
      .catch(() => {
        localStorage.removeItem('authToken')
      })
    }
  }, [navigate])

  const handleLogin = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Login request - no sensitive data logged
      const loginData = loginType === 'user' 
        ? { email: email.trim(), password }
        : { password }
      
      // Password is never logged for security
      
      const response = await apiClient.post('/auth/login', loginData)
      
      console.log('Login response:', response.data)
      
      if (response.data.success && response.data.token) {
        localStorage.setItem('authToken', response.data.token)
        // Store user role and userId
        if (response.data.role) {
          localStorage.setItem('userRole', response.data.role)
        }
        if (response.data.userId) {
          localStorage.setItem('userId', response.data.userId)
        }
        // Dispatch custom event to notify App component
        window.dispatchEvent(new Event('login'))
        // Navigate to home page
        navigate('/')
      } else {
        setError(response.data?.error || 'Invalid credentials')
      }
    } catch (err) {
      console.error('Login error:', err)
      console.error('Error response:', err.response)
      console.error('Error response data:', err.response?.data)
      
      if (err.response) {
        // Show the specific error message from backend
        const errorMessage = err.response.data?.error || `Login failed: ${err.response.status} ${err.response.statusText}`
        console.log('Setting error message:', errorMessage)
        setError(errorMessage)
      } else if (err.request) {
        setError('Cannot connect to server. Please check if the backend is running.')
      } else {
        setError('Login failed. Please check your credentials and try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Production Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 backdrop-blur-sm bg-opacity-90">
          <p className="text-sm text-yellow-800 text-center">
            <strong>Notice:</strong> This is not in production mode. If you want to use this service, please email{' '}
            <a href="mailto:tuhin.sec@gmail.com" className="text-yellow-900 underline font-medium">
              tuhin.sec@gmail.com
            </a>
            {' '}and fill out the{' '}
            <a 
              href="https://forms.gle/DGBurLhhFnbgkKSq8" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-yellow-900 underline font-medium"
            >
              acceptance form
            </a>
            {' '}for admin approval.
          </p>
        </div>

        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Professor Search
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to your account
          </p>
        </div>
        
        {/* Login Type Toggle */}
        <div className="flex justify-center space-x-4 mb-4">
          <button
            type="button"
            onClick={() => setLoginType('user')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              loginType === 'user'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            User Login
          </button>
          <button
            type="button"
            onClick={() => setLoginType('admin')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              loginType === 'admin'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Admin/Visitor
          </button>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="rounded-md shadow-sm space-y-4">
            {loginType === 'user' && (
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter your email"
                  autoComplete="email"
                />
              </div>
            )}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder={loginType === 'user' ? 'Enter your password' : 'Enter password'}
                autoComplete={loginType === 'user' ? 'current-password' : 'off'}
              />
            </div>
          </div>
          
          {loginType === 'user' && (
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/register')}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Register here
                </button>
              </p>
              <p className="text-xs text-gray-500">
                Already registered? Fill out the{' '}
                <a 
                  href="https://forms.gle/DGBurLhhFnbgkKSq8" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  acceptance form
                </a>
                {' '}if you're pending approval.
              </p>
            </div>
          )}

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{error}</h3>
                </div>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Logging in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default LoginPage

