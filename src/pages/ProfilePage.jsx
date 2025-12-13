import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import apiClient from '../utils/axiosConfig'

function ProfilePage() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    university: '',
    phoneNumber: '',
    subject: '',
    country: '',
    password: '',
    confirmPassword: '',
    geminiApiKey: ''
  })
  const navigate = useNavigate()

  const countries = [
    'United States', 'Canada', 'United Kingdom', 'Australia', 'Germany',
    'France', 'Italy', 'Spain', 'Netherlands', 'Sweden', 'Switzerland',
    'Japan', 'China', 'India', 'South Korea', 'Singapore', 'Other'
  ]

  const subjects = [
    'Computer Science', 'Electrical Engineering', 'Mechanical Engineering',
    'Civil Engineering', 'Chemical Engineering', 'Biomedical Engineering',
    'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Other'
  ]

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/user/profile')
      if (response.data.success) {
        const user = response.data.user
        setProfile(user)
        setFormData({
          name: user.name || '',
          university: user.university || '',
          phoneNumber: user.phoneNumber || '',
          subject: user.subject || '',
          country: user.country || '',
          password: '',
          confirmPassword: '',
          geminiApiKey: user.geminiApiKey || ''
        })
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError(null)
    setSuccess(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (formData.password && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password && formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    try {
      const updateData = { ...formData }
      if (!updateData.password) {
        delete updateData.password
      }
      delete updateData.confirmPassword

      const response = await apiClient.put('/user/profile', updateData)
      if (response.data.success) {
        setSuccess('Profile updated successfully')
        setEditing(false)
        setFormData({
          ...formData,
          password: '',
          confirmPassword: ''
        })
        fetchProfile()
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error || 'Failed to load profile'}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 text-blue-600 hover:text-blue-800"
          >
            Go to Home
          </button>
        </div>
      </div>
    )
  }

  const getStatusBadge = (status) => {
    const badges = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      ACTIVE: 'bg-green-100 text-green-800',
      HOLD: 'bg-orange-100 text-orange-800',
      REMOVED: 'bg-red-100 text-red-800'
    }
    return badges[status] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  disabled={!profile.canEdit}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    profile.canEdit
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Edit Profile
                </button>
              )}
            </div>
          </div>

          <div className="px-6 py-4">
            {error && (
              <div className="mb-4 rounded-md bg-red-50 p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-4 rounded-md bg-green-50 p-4">
                <p className="text-sm text-green-800">{success}</p>
              </div>
            )}

            {/* Status Info */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Account Status:</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(profile.status)}`}>
                  {profile.status}
                </span>
              </div>
              {profile.status === 'PENDING' && (
                <p className="text-sm text-yellow-700 mt-2">
                  Your account is pending admin approval. You will be able to use the system once approved.
                </p>
              )}
              {profile.status === 'HOLD' && (
                <p className="text-sm text-orange-700 mt-2">
                  Your account is on hold. You can view data but cannot add or edit professors.
                </p>
              )}
              {profile.accessExpiresAt && (
                <div className="mt-2">
                  <span className="text-sm text-gray-700">
                    Access expires: {new Date(profile.accessExpiresAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            {editing ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      University/Workplace *
                    </label>
                    <input
                      type="text"
                      name="university"
                      value={formData.university}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={profile.email}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subject/Department *
                    </label>
                    <select
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Subject</option>
                      {subjects.map(subject => (
                        <option key={subject} value={subject}>{subject}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Country *
                    </label>
                    <select
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Country</option>
                      {countries.map(country => (
                        <option key={country} value={country}>{country}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      New Password (leave blank to keep current)
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Minimum 6 characters"
                    />
                  </div>

                  {formData.password && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  )}

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Gemini API Key (Your personal API key for AI searches)
                    </label>
                    <input
                      type="password"
                      name="geminiApiKey"
                      value={formData.geminiApiKey}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your Gemini API key"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      This key will be used for your AI-powered professor searches
                    </p>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(false)
                      setError(null)
                      setSuccess(null)
                      fetchProfile()
                    }}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Name</label>
                    <p className="text-gray-900">{profile.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
                    <p className="text-gray-900">{profile.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">University/Workplace</label>
                    <p className="text-gray-900">{profile.university}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Phone Number</label>
                    <p className="text-gray-900">{profile.phoneNumber}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Subject/Department</label>
                    <p className="text-gray-900">{profile.subject}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Country</label>
                    <p className="text-gray-900">{profile.country}</p>
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Permissions</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Add Professors</p>
                      <p className={`text-sm font-medium ${profile.canAddProfessors ? 'text-green-600' : 'text-red-600'}`}>
                        {profile.canAddProfessors ? '✓ Allowed' : '✗ Not Allowed'}
                      </p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">AI Search</p>
                      <p className={`text-sm font-medium ${profile.canUseAISearch ? 'text-green-600' : 'text-red-600'}`}>
                        {profile.canUseAISearch ? '✓ Allowed' : '✗ Not Allowed'}
                      </p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Edit Data</p>
                      <p className={`text-sm font-medium ${profile.canEdit ? 'text-green-600' : 'text-red-600'}`}>
                        {profile.canEdit ? '✓ Allowed' : '✗ Not Allowed'}
                      </p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">View Data</p>
                      <p className={`text-sm font-medium ${profile.canView ? 'text-green-600' : 'text-red-600'}`}>
                        {profile.canView ? '✓ Allowed' : '✗ Not Allowed'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage

