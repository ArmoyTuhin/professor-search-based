import React, { useState, useEffect } from 'react'
import apiClient from '../utils/axiosConfig'

function VisitorPasswordsPage() {
  const [passwords, setPasswords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [newPassword, setNewPassword] = useState(null)
  const [newPasswordExpirationDays, setNewPasswordExpirationDays] = useState(7)
  const [expirationDays, setExpirationDays] = useState(7)
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false)
  const [userRole, setUserRole] = useState(localStorage.getItem('userRole') || 'admin')

  useEffect(() => {
    fetchPasswords()
    setUserRole(localStorage.getItem('userRole') || 'admin')
  }, [])

  const fetchPasswords = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await apiClient.get('/auth/visitor-passwords')
      if (response.data.success) {
        setPasswords(response.data.passwords || [])
      } else {
        setError('Failed to fetch visitor passwords')
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Error fetching visitor passwords')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleGeneratePassword = async () => {
    setGenerating(true)
    setError(null)
    try {
      const response = await apiClient.post('/auth/generate-visitor-password', {
        expirationDays: expirationDays
      })
      if (response.data.success) {
        setNewPassword(response.data.password)
        setNewPasswordExpirationDays(response.data.expirationDays || expirationDays)
        setIsGenerateModalOpen(false)
        setExpirationDays(7) // Reset to default
        await fetchPasswords()
      } else {
        setError('Failed to generate visitor password')
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Error generating visitor password')
    } finally {
      setGenerating(false)
    }
  }

  const handleDeletePassword = async (id) => {
    if (userRole === 'visitor') {
      alert('You cannot delete. You are a visitor.')
      return
    }
    if (!confirm('Are you sure you want to delete this visitor password?')) {
      return
    }
    try {
      await apiClient.delete(`/auth/visitor-passwords/${id}`)
      await fetchPasswords()
    } catch (err) {
      alert('Error deleting password: ' + (err.response?.data?.error || err.message))
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    try {
      const date = new Date(dateString)
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (e) {
      return dateString
    }
  }

  const isExpired = (expiresAt) => {
    if (!expiresAt) return false
    return new Date(expiresAt) < new Date()
  }

  if (loading) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading visitor passwords...</p>
        </div>
      </div>
    )
  }

  const isVisitor = userRole === 'visitor'

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
      {/* Visitor Status Banner */}
      {isVisitor && (
        <div className="mb-4 bg-orange-50 border-l-4 border-orange-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-orange-700">
                <strong>You are a visitor.</strong> You have limited access. Delete operations are disabled.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Visitor Password Management
          </h1>
          <p className="text-gray-600">
            Generate temporary passwords for visitors. Visitors can only make 1 process request.
          </p>
        </div>
        {!isVisitor && (
          <button
            onClick={() => setIsGenerateModalOpen(true)}
            disabled={generating}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:bg-gray-400"
          >
            {generating ? 'Generating...' : '+ Generate Visitor Password'}
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {newPassword && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-green-800 mb-2">New Visitor Password Generated!</h3>
              <p className="text-green-700 mb-2">Share this password with the visitor:</p>
              <div className="bg-white p-3 rounded border-2 border-green-300">
                <code className="text-2xl font-mono font-bold text-gray-900">{newPassword}</code>
              </div>
              <p className="text-sm text-green-600 mt-2">This password expires in {newPasswordExpirationDays} day(s) and can only be used once.</p>
            </div>
            <button
              onClick={() => setNewPassword(null)}
              className="text-green-600 hover:text-green-800"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Password
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Generated By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created At
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expires At
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Process Count
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {passwords.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    No visitor passwords generated yet. Click "Generate Visitor Password" to create one.
                  </td>
                </tr>
              ) : (
                passwords.map((password) => {
                  const expired = isExpired(password.expiresAt)
                  const used = password.used
                  const canUse = !expired && !used && password.processCount < 1
                  
                  return (
                    <tr key={password.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <code className="text-sm font-mono text-gray-900">{password.password}</code>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {password.generatedBy || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(password.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(password.expiresAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {used ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                            Used
                          </span>
                        ) : expired ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            Expired
                          </span>
                        ) : canUse ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            Limit Reached
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {password.processCount || 0} / 1
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {!isVisitor ? (
                          <button
                            onClick={() => handleDeletePassword(password.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Delete
                          </button>
                        ) : (
                          <button
                            onClick={() => alert('You cannot delete. You are a visitor.')}
                            className="text-gray-400 cursor-not-allowed"
                            disabled
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generate Password Modal */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Generate Visitor Password</h2>
              <button
                onClick={() => {
                  setIsGenerateModalOpen(false)
                  setExpirationDays(7)
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiration Time (Days)
                </label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={expirationDays}
                  onChange={(e) => setExpirationDays(parseInt(e.target.value) || 7)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Password will be valid for {expirationDays} day(s). (1-365 days)
                </p>
              </div>
              <div className="flex justify-end gap-4 pt-4">
                <button
                  onClick={() => {
                    setIsGenerateModalOpen(false)
                    setExpirationDays(7)
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGeneratePassword}
                  disabled={generating}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {generating ? 'Generating...' : 'Generate'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default VisitorPasswordsPage

