import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import apiClient, { API_BASE_URL } from '../utils/axiosConfig'

function TaskListPage() {
  const [priorityProfessors, setPriorityProfessors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedProfessor, setSelectedProfessor] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProfessor, setEditingProfessor] = useState(null)

  useEffect(() => {
    fetchPriorityProfessors()
  }, [])

  const fetchPriorityProfessors = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await apiClient.get('/professor/priority')
      if (response.data.success) {
        setPriorityProfessors(response.data.professors || [])
      } else {
        setError('Failed to fetch priority professors')
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Error fetching priority professors')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', { 
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

  const getDaysUntilDeadline = (deadline) => {
    if (!deadline) return null
    try {
      const deadlineDate = new Date(deadline)
      const now = new Date()
      const diffTime = deadlineDate - now
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays
    } catch (e) {
      return null
    }
  }

  const openModal = (professor) => {
    setSelectedProfessor(professor)
    setEditingProfessor({ ...professor })
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedProfessor(null)
    setEditingProfessor(null)
  }

  const handleUpdatePriority = async (id, priority) => {
    try {
      await apiClient.put(`/professor/${id}`, { priority })
      await fetchPriorityProfessors()
      if (selectedProfessor && selectedProfessor.id === id) {
        closeModal()
      }
    } catch (err) {
      alert('Error updating priority: ' + (err.response?.data?.error || err.message))
    }
  }

  if (loading) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading priority professors...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      </div>
    )
  }

  // Sort by deadline (soonest first), then by name
  const sortedProfessors = [...priorityProfessors].sort((a, b) => {
    if (a.deadline && !b.deadline) return -1
    if (!a.deadline && b.deadline) return 1
    if (a.deadline && b.deadline) {
      return new Date(a.deadline) - new Date(b.deadline)
    }
    return (a.name || '').localeCompare(b.name || '')
  })

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Priority Task List
          </h1>
          <p className="text-gray-600">
            {priorityProfessors.length} priority professor(s) to contact
          </p>
        </div>
        <Link
          to="/search"
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          Back to Search
        </Link>
      </div>

      {priorityProfessors.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No priority professors</h3>
          <p className="mt-1 text-sm text-gray-500">Mark professors as priority to see them here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedProfessors.map((professor) => {
            const daysUntil = getDaysUntilDeadline(professor.deadline)
            const isUrgent = daysUntil !== null && daysUntil <= 7 && daysUntil >= 0
            const isOverdue = daysUntil !== null && daysUntil < 0

            return (
              <div
                key={professor.id}
                onClick={() => openModal(professor)}
                className="bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow border-2 border-blue-200"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-lg text-gray-900 flex-1">
                    {professor.name || 'N/A'}
                  </h3>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (confirm(`Remove ${professor.name || 'this professor'} from priority list?`)) {
                        handleUpdatePriority(professor.id, false)
                      }
                    }}
                    className="text-red-600 hover:text-red-800 p-1"
                    title="Remove from priority"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <p className="text-sm text-gray-600 mb-1">
                  {professor.designation || 'N/A'}
                </p>
                <p className="text-xs text-gray-500 mb-3">
                  {professor.universityName || 'N/A'}
                </p>

                {professor.deadline && (
                  <div className={`mb-3 p-2 rounded ${
                    isOverdue ? 'bg-red-100 border border-red-300' :
                    isUrgent ? 'bg-yellow-100 border border-yellow-300' :
                    'bg-blue-50 border border-blue-200'
                  }`}>
                    <div className="text-xs font-medium text-gray-700">Deadline</div>
                    <div className={`text-sm font-semibold ${
                      isOverdue ? 'text-red-700' :
                      isUrgent ? 'text-yellow-700' :
                      'text-blue-700'
                    }`}>
                      {formatDate(professor.deadline)}
                    </div>
                    {daysUntil !== null && (
                      <div className={`text-xs mt-1 ${
                        isOverdue ? 'text-red-600' :
                        isUrgent ? 'text-yellow-600' :
                        'text-blue-600'
                      }`}>
                        {isOverdue ? `${Math.abs(daysUntil)} days overdue` :
                         isUrgent ? `${daysUntil} days remaining` :
                         `${daysUntil} days remaining`}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap gap-2 mb-2">
                  {professor.greRequired && (
                    <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
                      GRE Required
                    </span>
                  )}
                  {professor.mailed && (
                    <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                      Mailed
                    </span>
                  )}
                  {(professor.currentlyRecruiting === 'Yes' || professor.recruitingPhdStudents === 'Yes') && (
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                      Recruiting
                    </span>
                  )}
                </div>

                {professor.comments && (
                  <p className="text-xs text-gray-600 line-clamp-2 mt-2">
                    {professor.comments}
                  </p>
                )}

                {/* Portfolio and Lab Website Links */}
                <div className="mt-3 space-y-1">
                  {professor.portfolioWebsite && (
                    <a
                      href={professor.portfolioWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center text-xs text-blue-600 hover:text-blue-800"
                    >
                      <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      Portfolio
                    </a>
                  )}
                  {professor.labWebsite && (
                    <a
                      href={professor.labWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center text-xs text-green-600 hover:text-green-800"
                    >
                      <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      Lab Website
                    </a>
                  )}
                </div>

                {/* Research Interests */}
                {professor.researchInterests && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="text-xs font-medium text-gray-700 mb-1">Research Interests:</div>
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {professor.researchInterests}
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Details Modal */}
      {isModalOpen && editingProfessor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Professor Details</h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <p className="text-gray-900">{editingProfessor.name || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <p className="text-gray-900">{editingProfessor.email || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">University</label>
                  <p className="text-gray-900">{editingProfessor.universityName || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                  <p className="text-gray-900">{editingProfessor.designation || 'N/A'}</p>
                </div>
                {editingProfessor.deadline && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
                    <p className="text-gray-900">{formatDate(editingProfessor.deadline)}</p>
                    {getDaysUntilDeadline(editingProfessor.deadline) !== null && (
                      <p className={`text-sm mt-1 ${
                        getDaysUntilDeadline(editingProfessor.deadline) < 0 ? 'text-red-600' :
                        getDaysUntilDeadline(editingProfessor.deadline) <= 7 ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {getDaysUntilDeadline(editingProfessor.deadline) < 0 
                          ? `${Math.abs(getDaysUntilDeadline(editingProfessor.deadline))} days overdue`
                          : `${getDaysUntilDeadline(editingProfessor.deadline)} days remaining`}
                      </p>
                    )}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GRE Required</label>
                  <p className="text-gray-900">{editingProfessor.greRequired ? 'Yes' : 'No'}</p>
                </div>
              </div>
              {editingProfessor.researchInterests && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Research Interests</label>
                  <p className="text-gray-900">{editingProfessor.researchInterests}</p>
                </div>
              )}
              {editingProfessor.comments && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Comments</label>
                  <p className="text-gray-900">{editingProfessor.comments}</p>
                </div>
              )}
              <div className="flex justify-end gap-4 pt-4 border-t">
                <Link
                  to={`/search?professorId=${editingProfessor.id}`}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  onClick={closeModal}
                >
                  Edit Full Details
                </Link>
                <button
                  onClick={() => {
                    if (confirm('Remove from priority list?')) {
                      handleUpdatePriority(editingProfessor.id, false)
                    }
                  }}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Remove from Priority
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TaskListPage

