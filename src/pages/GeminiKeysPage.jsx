import React, { useState, useEffect } from 'react'
import apiClient from '../utils/axiosConfig'

function GeminiKeysPage() {
  const [keys, setKeys] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingKey, setEditingKey] = useState(null)
  const [formData, setFormData] = useState({
    keyName: '',
    apiKey: '',
    isActive: true
  })

  useEffect(() => {
    fetchKeys()
  }, [])

  const fetchKeys = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await apiClient.get('/gemini-keys')
      if (response.data.success) {
        setKeys(response.data.keys || [])
      } else {
        setError('Failed to fetch API keys')
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Error fetching API keys')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (key = null) => {
    if (key) {
      setEditingKey(key)
      setFormData({
        keyName: key.keyName,
        apiKey: '', // Don't show existing key for security
        isActive: key.isActive
      })
    } else {
      setEditingKey(null)
      setFormData({
        keyName: '',
        apiKey: '',
        isActive: true
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingKey(null)
    setFormData({
      keyName: '',
      apiKey: '',
      isActive: true
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!formData.keyName) {
      setError('Key name is required')
      return
    }

    // For new keys, API key is required. For editing, it's optional
    if (!editingKey && !formData.apiKey) {
      setError('API key is required for new keys')
      return
    }

    try {
      if (editingKey) {
        // Update existing key - only send fields that are provided
        const updateData = {
          isActive: formData.isActive
        }
        if (formData.apiKey && formData.apiKey.trim()) {
          updateData.apiKey = formData.apiKey
        }
        await apiClient.put(`/gemini-keys/${editingKey.id}`, updateData)
      } else {
        // Create new key
        await apiClient.post('/gemini-keys', formData)
      }
      await fetchKeys()
      handleCloseModal()
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Error saving API key')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this API key?')) {
      return
    }

    try {
      await apiClient.delete(`/gemini-keys/${id}`)
      await fetchKeys()
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Error deleting API key')
    }
  }

  const handleToggleActive = async (key) => {
    try {
      await apiClient.put(`/gemini-keys/${key.id}`, {
        isActive: !key.isActive
      })
      await fetchKeys()
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Error updating API key')
    }
  }

  if (loading) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading API keys...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Gemini API Keys
          </h1>
          <p className="text-gray-600">
            Manage your Gemini API keys. Keys are stored in the database and used automatically.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          + Add API Key
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {/* API Keys Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Key Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  API Key
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {keys.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                    <div>
                      <p className="mb-2">No API keys found. Add one to get started.</p>
                      <p className="text-sm text-gray-400">
                        The system will use keys from the database instead of hardcoded values.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                keys.map((key) => (
                  <tr key={key.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {key.keyName}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                      {key.apiKey}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        key.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {key.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOpenModal(key)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleActive(key)}
                          className={`${key.isActive ? 'text-yellow-600 hover:text-yellow-800' : 'text-green-600 hover:text-green-800'}`}
                        >
                          {key.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDelete(key.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingKey ? 'Edit API Key' : 'Add API Key'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Key Name *
                  <span className="text-xs text-gray-500 ml-2">(e.g., "primary", "backup1", "backup2")</span>
                </label>
                <input
                  type="text"
                  value={formData.keyName}
                  onChange={(e) => setFormData({ ...formData, keyName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="primary"
                  required
                  disabled={!!editingKey}
                />
                {editingKey && (
                  <p className="text-xs text-gray-500 mt-1">Key name cannot be changed</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  API Key *
                </label>
                <input
                  type="password"
                  value={formData.apiKey}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                  placeholder={editingKey ? "Enter new API key to update (leave empty to keep current)" : "AIzaSy..."}
                  required={!editingKey}
                />
                {editingKey && (
                  <p className="text-xs text-gray-500 mt-1">Leave empty to keep current key, or enter new key to update</p>
                )}
              </div>
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Active</span>
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Only active keys will be used by the system
                </p>
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                  {error}
                </div>
              )}
              <div className="flex justify-end gap-4 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingKey ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default GeminiKeysPage

