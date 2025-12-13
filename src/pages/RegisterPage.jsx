import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import apiClient from '../utils/axiosConfig'

function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    university: '',
    email: '',
    phoneNumber: '',
    subject: '',
    country: '',
    password: '',
    confirmPassword: ''
  })
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  // Common countries list
  const countries = [
    'United States', 'Canada', 'United Kingdom', 'Australia', 'Germany',
    'France', 'Italy', 'Spain', 'Netherlands', 'Sweden', 'Switzerland',
    'Japan', 'China', 'India', 'South Korea', 'Singapore', 'Other'
  ]

  // Common subjects/departments
  const subjects = [
    'Computer Science', 'Electrical Engineering', 'Mechanical Engineering',
    'Civil Engineering', 'Chemical Engineering', 'Biomedical Engineering',
    'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Other'
  ]

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError(null)
  }

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Name is required')
      return false
    }
    if (!formData.university.trim()) {
      setError('University/Workplace is required')
      return false
    }
    if (!formData.email.trim()) {
      setError('Email is required')
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Invalid email format')
      return false
    }
    if (!formData.phoneNumber.trim()) {
      setError('Phone number is required')
      return false
    }
    if (!/^[+]?[(]?[0-9]{1,4}[)]?[-\\s.]?[(]?[0-9]{1,4}[)]?[-\\s.]?[0-9]{1,9}$/.test(formData.phoneNumber)) {
      setError('Invalid phone number format')
      return false
    }
    if (!formData.subject.trim()) {
      setError('Subject/Department is required')
      return false
    }
    if (!formData.country) {
      setError('Country is required')
      return false
    }
    if (!formData.password) {
      setError('Password is required')
      return false
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return false
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const { confirmPassword, ...registrationData } = formData
      const response = await apiClient.post('/user/register', registrationData)
      
      if (response.data.success) {
        setSuccess(true)
        setTimeout(() => {
          navigate('/login')
        }, 3000)
      } else {
        setError(response.data.error || 'Registration failed')
      }
    } catch (err) {
      console.error('Registration error:', err)
      if (err.response) {
        const errorMessage = err.response.data?.error || 'Registration failed'
        
        // Check if user already exists (email already registered)
        if (errorMessage.includes('already registered') || errorMessage.includes('Email already')) {
          setError(
            <div>
              <p className="font-medium mb-2">You are already registered!</p>
              <p className="text-sm mb-3">Your account is pending admin approval. Please fill out the acceptance form to be approved.</p>
              <a 
                href="https://forms.gle/DGBurLhhFnbgkKSq8" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
              >
                Fill Acceptance Form
              </a>
              <p className="text-sm mt-3 text-gray-600">
                After filling the form, you can <a href="/login" className="text-blue-600 underline">login here</a> once approved.
              </p>
            </div>
          )
        } else {
          setError(errorMessage)
        }
      } else if (err.request) {
        setError('Cannot connect to server. Please check if the backend is running.')
      } else {
        setError('Registration failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <svg className="mx-auto h-12 w-12 text-green-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-medium text-green-800 mb-2">
              Registration Successful!
            </h3>
            <p className="text-sm text-green-700 mb-4">
              Your registration has been submitted. Please wait for admin approval.
            </p>
            <p className="text-sm text-green-700 mb-4">
              <strong>Important:</strong> Please fill out the{' '}
              <a 
                href="https://forms.gle/DGBurLhhFnbgkKSq8" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-green-800 underline font-medium"
              >
                acceptance form
              </a>
              {' '}to be approved by the admin.
            </p>
            <p className="text-xs text-green-600">
              You will be redirected to the login page in a few seconds...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
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
            Create Your Account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Register to start using the Professor Searching System
          </p>
        </div>
        
        <form className="mt-8 space-y-6 bg-white p-8 rounded-lg shadow-md" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              {typeof error === 'string' ? (
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
              ) : (
                <div className="text-red-800">{error}</div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label htmlFor="university" className="block text-sm font-medium text-gray-700 mb-1">
                University/Workplace *
              </label>
              <input
                id="university"
                name="university"
                type="text"
                required
                value={formData.university}
                onChange={handleChange}
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="University Name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="john.doe@example.com"
              />
            </div>

            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number *
              </label>
              <input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                required
                value={formData.phoneNumber}
                onChange={handleChange}
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="+1234567890"
              />
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                Which subjects' professors are you trying to fetch? *
              </label>
              <select
                id="subject"
                name="subject"
                required
                value={formData.subject}
                onChange={handleChange}
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">Select Subject/Department</option>
                {subjects.map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                Which countries' professors are you trying to fetch? *
              </label>
              <select
                id="country"
                name="country"
                required
                value={formData.country}
                onChange={handleChange}
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">Select Country</option>
                {countries.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password *
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Minimum 6 characters"
                minLength={6}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password *
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Re-enter password"
              />
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> After registration, your account will be pending admin approval. 
              You will be able to login once an admin approves your account.
            </p>
          </div>

          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 group relative flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Registering...' : 'Register'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="flex-1 group relative flex justify-center py-3 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Back to Login
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default RegisterPage

