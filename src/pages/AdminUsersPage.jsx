import React, { useState, useEffect } from 'react'
import apiClient from '../utils/axiosConfig'

function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [allUsers, setAllUsers] = useState([]) // Store all users for counts
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filterStatus, setFilterStatus] = useState('PENDING') // Default to PENDING to show approval requests
  const [selectedUser, setSelectedUser] = useState(null)
  const [showAccessModal, setShowAccessModal] = useState(false)
  const [accessDays, setAccessDays] = useState(30)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  useEffect(() => {
    fetchUsers()
    // Also fetch all users to get counts
    fetchAllUsersForCounts()
  }, [filterStatus])

  // Fetch all users to get status counts
  const fetchAllUsersForCounts = async () => {
    try {
      const response = await apiClient.get('/admin/users')
      if (response.data.success) {
        setAllUsers(response.data.users || [])
      }
    } catch (err) {
      // Silently fail - counts are not critical
      console.error('Error fetching user counts:', err)
    }
  }

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const endpoint = filterStatus === 'all' 
        ? '/admin/users'
        : `/admin/users/status/${filterStatus}`
      const response = await apiClient.get(endpoint)
      if (response.data.success) {
        setUsers(response.data.users || [])
        // If fetching all users, also update allUsers for counts
        if (filterStatus === 'all') {
          setAllUsers(response.data.users || [])
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  // Get count of users by status
  const getStatusCount = (status) => {
    return allUsers.filter(u => u.status === status).length
  }

  const handleApprove = async (userId, days = null) => {
    try {
      const data = days ? { accessDays: days } : {}
      const response = await apiClient.post(`/admin/users/${userId}/approve`, data)
      if (response.data.success) {
        fetchUsers()
        fetchAllUsersForCounts() // Refresh counts
        setShowAccessModal(false)
        setSelectedUser(null)
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to approve user')
    }
  }

  const handleHold = async (userId) => {
    if (!confirm('Are you sure you want to put this user on hold?')) return
    try {
      const response = await apiClient.post(`/admin/users/${userId}/hold`)
      if (response.data.success) {
        fetchUsers()
        fetchAllUsersForCounts() // Refresh counts
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to hold user')
    }
  }

  const handleRemove = async (userId) => {
    if (!confirm('Are you sure you want to remove this user? They will not be able to login but data will be preserved.')) return
    try {
      const response = await apiClient.post(`/admin/users/${userId}/remove`)
      if (response.data.success) {
        fetchUsers()
        fetchAllUsersForCounts() // Refresh counts
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to remove user')
    }
  }

  const handleDelete = async (userId, deleteData = false) => {
    const message = deleteData 
      ? 'Are you sure you want to DELETE this user and ALL their data? This cannot be undone!'
      : 'Are you sure you want to delete this user? Data will be preserved.'
    if (!confirm(message)) return
    
    try {
      const response = await apiClient.delete(`/admin/users/${userId}?deleteData=${deleteData}`)
      if (response.data.success) {
        fetchUsers()
        fetchAllUsersForCounts() // Refresh counts
        setDeleteConfirm(null)
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete user')
    }
  }

  const handleUpdateAccess = async (userId) => {
    try {
      const response = await apiClient.put(`/admin/users/${userId}/access`, { accessDays })
      if (response.data.success) {
        fetchUsers()
        fetchAllUsersForCounts() // Refresh counts
        setShowAccessModal(false)
        setSelectedUser(null)
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update access')
    }
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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading users...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage user accounts, approvals, and access permissions
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Filter with Status Counts */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Status
          </label>
          <div className="flex items-center gap-4 flex-wrap">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Users ({allUsers.length})</option>
              <option value="PENDING">
                Pending Approval ({getStatusCount('PENDING')})
              </option>
              <option value="ACTIVE">Active ({getStatusCount('ACTIVE')})</option>
              <option value="HOLD">On Hold ({getStatusCount('HOLD')})</option>
              <option value="REMOVED">Removed ({getStatusCount('REMOVED')})</option>
            </select>
            {getStatusCount('PENDING') > 0 && filterStatus !== 'PENDING' && (
              <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                <span className="text-yellow-800 font-medium">
                  ⚠ {getStatusCount('PENDING')} user(s) pending approval
                </span>
                <button
                  onClick={() => setFilterStatus('PENDING')}
                  className="text-yellow-800 hover:text-yellow-900 underline font-medium"
                >
                  View Now
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subject/Country
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Access
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.university}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.email}</div>
                        <div className="text-sm text-gray-500">{user.phoneNumber}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.subject}</div>
                        <div className="text-sm text-gray-500">{user.country}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(user.status)}`}>
                          {user.status}
                        </span>
                        {user.isAccessExpired && (
                          <span className="ml-2 px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            Expired
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>Days: {user.accessDays || 'Unlimited'}</div>
                        <div>Expires: {formatDate(user.accessExpiresAt)}</div>
                        {user.approvedAt && (
                          <div className="text-xs">Approved: {formatDate(user.approvedAt)}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {user.status === 'PENDING' && (
                            <button
                              onClick={() => {
                                setSelectedUser(user)
                                setShowAccessModal(true)
                              }}
                              className="text-green-600 hover:text-green-900"
                              title="Approve"
                            >
                              Approve
                            </button>
                          )}
                          {user.status === 'ACTIVE' && (
                            <>
                              <button
                                onClick={() => handleHold(user.id)}
                                className="text-orange-600 hover:text-orange-900"
                                title="Put on hold"
                              >
                                Hold
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedUser(user)
                                  setShowAccessModal(true)
                                }}
                                className="text-blue-600 hover:text-blue-900"
                                title="Update access"
                              >
                                Access
                              </button>
                            </>
                          )}
                          {user.status === 'HOLD' && (
                            <button
                              onClick={() => handleApprove(user.id)}
                              className="text-green-600 hover:text-green-900"
                              title="Reactivate"
                            >
                              Activate
                            </button>
                          )}
                          {user.status !== 'REMOVED' && (
                            <button
                              onClick={() => handleRemove(user.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Remove (keep data)"
                            >
                              Remove
                            </button>
                          )}
                          <button
                            onClick={() => setDeleteConfirm(user.id)}
                            className="text-red-800 hover:text-red-900 font-bold"
                            title="Delete user"
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

        {/* Access Modal */}
        {showAccessModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                {selectedUser.status === 'PENDING' ? 'Approve User' : 'Update Access'}
              </h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Access Duration (days)
                </label>
                <input
                  type="number"
                  min="0"
                  value={accessDays}
                  onChange={(e) => setAccessDays(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="0 for unlimited"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter 0 for unlimited access
                </p>
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    if (selectedUser.status === 'PENDING') {
                      handleApprove(selectedUser.id, accessDays > 0 ? accessDays : null)
                    } else {
                      handleUpdateAccess(selectedUser.id)
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {selectedUser.status === 'PENDING' ? 'Approve' : 'Update'}
                </button>
                <button
                  onClick={() => {
                    setShowAccessModal(false)
                    setSelectedUser(null)
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-bold text-red-900 mb-4">Delete User</h3>
              <p className="text-sm text-gray-700 mb-4">
                Choose an option:
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => handleDelete(deleteConfirm, false)}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete User (Keep Data)
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm, true)}
                  className="w-full px-4 py-2 bg-red-800 text-white rounded-lg hover:bg-red-900"
                >
                  Delete User & All Data (Permanent)
                </button>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminUsersPage

