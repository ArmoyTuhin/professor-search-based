import React, { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import apiClient, { API_BASE_URL } from '../utils/axiosConfig'
import axios from 'axios'
import { useUserPermissions } from '../hooks/useUserPermissions'

function SearchPage() {
  const { canAddProfessors, canEdit, canView, userRole } = useUserPermissions()
  const [searchParams, setSearchParams] = useSearchParams()
  const [professors, setProfessors] = useState([])
  const [filteredProfessors, setFilteredProfessors] = useState([])
  const [needsFollowUp, setNeedsFollowUp] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedProfessor, setSelectedProfessor] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingProfessor, setEditingProfessor] = useState(null)
  const [newProfessor, setNewProfessor] = useState({
    name: '',
    email: '',
    universityName: '',
    designation: '',
    portfolioWebsite: '',
    sourceUrl: '',
    labWebsite: '',
    researchInterests: '',
    googleScholarUrl: '',
    recruitingPhdStudents: '',
    currentlyRecruiting: '',
    hiringSemester: '',
    comments: '',
    priority: false,
    deadline: '',
    greRequired: false
  })

  // Filter states
  const [searchName, setSearchName] = useState('')
  const [selectedUniversity, setSelectedUniversity] = useState('')
  const [universitySearch, setUniversitySearch] = useState('')
  const [showUniversityDropdown, setShowUniversityDropdown] = useState(false)
  const [selectedResearchInterests, setSelectedResearchInterests] = useState([])
  const [researchInterestSearch, setResearchInterestSearch] = useState('')
  const [showResearchInterestDropdown, setShowResearchInterestDropdown] = useState(false)
  const [recruitingFilter, setRecruitingFilter] = useState('all')
  const [mailedFilter, setMailedFilter] = useState('all')
  const [hiringSemesterFilter, setHiringSemesterFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const professorsPerPage = 50

  // Get unique values for dropdowns
  const universities = [...new Set(professors.map(p => p.universityName).filter(Boolean))].sort()
  
  // Filter universities based on search input
  const filteredUniversities = universities.filter(uni =>
    uni.toLowerCase().includes(universitySearch.toLowerCase())
  )
  const researchInterests = [...new Set(
    professors
      .map(p => p.researchInterests)
      .filter(Boolean)
      .flatMap(ri => ri.split(',').map(s => s.trim()))
      .filter(Boolean)
  )].sort()
  
  // Filter research interests based on search input
  const filteredResearchInterests = researchInterests.filter(interest =>
    interest.toLowerCase().includes(researchInterestSearch.toLowerCase())
  )

  useEffect(() => {
    fetchAllProfessors()
  }, [])

  useEffect(() => {
    applyFilters()
    calculateNeedsFollowUp()
  }, [professors, searchName, selectedUniversity, selectedResearchInterests, recruitingFilter, mailedFilter, hiringSemesterFilter])

  const fetchAllProfessors = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await apiClient.get('/professor/all')
      if (response.data.success) {
        setProfessors(response.data.professors || [])
      } else {
        setError('Failed to fetch professors')
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Error fetching professors')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const calculateNeedsFollowUp = () => {
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    
    const needsFollowUpList = professors.filter(p => {
      if (!p.mailed || !p.mailingDate) return false
      if (p.followUpMailSent) return false
      
      const mailingDate = new Date(p.mailingDate)
      return mailingDate <= sevenDaysAgo
    })
    
    setNeedsFollowUp(needsFollowUpList)
  }

  const applyFilters = () => {
    let filtered = [...professors]

    if (searchName.trim()) {
      const nameLower = searchName.toLowerCase()
      filtered = filtered.filter(p =>
        p.name && p.name.toLowerCase().includes(nameLower)
      )
    }

    if (selectedUniversity) {
      filtered = filtered.filter(p => p.universityName === selectedUniversity)
    }

    if (selectedResearchInterests.length > 0) {
      filtered = filtered.filter(p => {
        if (!p.researchInterests) return false
        const professorInterests = p.researchInterests.split(',').map(ri => ri.trim().toLowerCase())
        // Check if professor has ANY of the selected research interests
        return selectedResearchInterests.some(selectedInterest =>
          professorInterests.some(pi => pi.includes(selectedInterest.toLowerCase()))
        )
      })
    }

    if (recruitingFilter === 'yes') {
      filtered = filtered.filter(p =>
        p.currentlyRecruiting === 'Yes' || p.recruitingPhdStudents === 'Yes'
      )
    } else if (recruitingFilter === 'no') {
      filtered = filtered.filter(p =>
        p.currentlyRecruiting !== 'Yes' && p.recruitingPhdStudents !== 'Yes'
      )
    }

    if (mailedFilter === 'mailed') {
      filtered = filtered.filter(p => p.mailed === true)
    } else if (mailedFilter === 'not_mailed') {
      filtered = filtered.filter(p => p.mailed !== true)
    }

    if (hiringSemesterFilter !== 'all') {
      filtered = filtered.filter(p => {
        if (!p.hiringSemester) return false
        if (hiringSemesterFilter === 'Both') {
          return p.hiringSemester === 'Both'
        } else {
          return p.hiringSemester === hiringSemesterFilter || p.hiringSemester === 'Both'
        }
      })
    }

    setFilteredProfessors(filtered)
    setCurrentPage(1) // Reset to first page when filters change
  }
  
  // Pagination calculations
  const totalPages = Math.ceil(filteredProfessors.length / professorsPerPage)
  const startIndex = (currentPage - 1) * professorsPerPage
  const endIndex = startIndex + professorsPerPage
  const currentProfessors = filteredProfessors.slice(startIndex, endIndex)

  const clearFilters = () => {
    setSearchName('')
    setSelectedUniversity('')
    setUniversitySearch('')
    setSelectedResearchInterests([])
    setResearchInterestSearch('')
    setRecruitingFilter('all')
    setMailedFilter('all')
    setHiringSemesterFilter('all')
  }

  const toggleResearchInterest = (interest) => {
    setSelectedResearchInterests(prev => {
      if (prev.includes(interest)) {
        return prev.filter(i => i !== interest)
      } else {
        return [...prev, interest]
      }
    })
  }

  const formatDateForInput = (dateString) => {
    if (!dateString) return ''
    // Convert ISO date string to datetime-local format (YYYY-MM-DDTHH:mm)
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  const openModal = (professor) => {
    setSelectedProfessor(professor)
    const formattedProfessor = {
      ...professor,
      mailingDate: formatDateForInput(professor.mailingDate),
      followUpMailDate: formatDateForInput(professor.followUpMailDate),
      deadline: formatDateForInput(professor.deadline)
    }
    setEditingProfessor(formattedProfessor)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedProfessor(null)
    setEditingProfessor(null)
  }

  // Check for professorId in URL params and open modal
  useEffect(() => {
    const professorId = searchParams.get('professorId')
    if (professorId && professors.length > 0) {
      const professor = professors.find(p => {
        const pId = String(p.id)
        const searchId = String(professorId)
        return pId === searchId
      })
      if (professor) {
        openModal(professor)
        // Remove professorId from URL to clean it up
        setSearchParams({})
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [professors, searchParams])

  const handleSave = async () => {
    if (!canEdit) {
      alert('You do not have permission to edit professors')
      return
    }
    
    try {
      // Build updates object, only including fields that have values
      const updates = {}
      
      if (editingProfessor.name !== undefined) updates.name = editingProfessor.name
      if (editingProfessor.email !== undefined) updates.email = editingProfessor.email
      if (editingProfessor.universityName !== undefined) updates.universityName = editingProfessor.universityName
      if (editingProfessor.designation !== undefined) updates.designation = editingProfessor.designation
      if (editingProfessor.portfolioWebsite !== undefined) updates.portfolioWebsite = editingProfessor.portfolioWebsite
      if (editingProfessor.labWebsite !== undefined) updates.labWebsite = editingProfessor.labWebsite
      if (editingProfessor.researchInterests !== undefined) updates.researchInterests = editingProfessor.researchInterests
      if (editingProfessor.googleScholarUrl !== undefined) updates.googleScholarUrl = editingProfessor.googleScholarUrl
      if (editingProfessor.recruitingPhdStudents !== undefined) updates.recruitingPhdStudents = editingProfessor.recruitingPhdStudents
      if (editingProfessor.currentlyRecruiting !== undefined) updates.currentlyRecruiting = editingProfessor.currentlyRecruiting
      if (editingProfessor.hiringSemester !== undefined) updates.hiringSemester = editingProfessor.hiringSemester
      
      // Handle Boolean fields - send boolean values explicitly
      if (editingProfessor.mailed !== undefined && editingProfessor.mailed !== null) {
        updates.mailed = editingProfessor.mailed === true || editingProfessor.mailed === 'true'
      }
      // Always send mailingDate if mailed is true, or send null if mailed is false
      if (editingProfessor.mailed) {
        if (editingProfessor.mailingDate && editingProfessor.mailingDate !== '') {
          updates.mailingDate = editingProfessor.mailingDate
        }
      } else if (editingProfessor.mailed === false) {
        updates.mailingDate = null
      }
      
      if (editingProfessor.followUpMailSent !== undefined && editingProfessor.followUpMailSent !== null) {
        updates.followUpMailSent = editingProfessor.followUpMailSent === true || editingProfessor.followUpMailSent === 'true'
      }
      // Always send followUpMailDate if followUpMailSent is true, or send null if false
      if (editingProfessor.followUpMailSent) {
        if (editingProfessor.followUpMailDate && editingProfessor.followUpMailDate !== '') {
          updates.followUpMailDate = editingProfessor.followUpMailDate
        }
      } else if (editingProfessor.followUpMailSent === false) {
        updates.followUpMailDate = null
      }
      
      if (editingProfessor.comments !== undefined) updates.comments = editingProfessor.comments
      if (editingProfessor.priority !== undefined) updates.priority = editingProfessor.priority
      if (editingProfessor.deadline !== undefined) updates.deadline = editingProfessor.deadline
      if (editingProfessor.greRequired !== undefined) updates.greRequired = editingProfessor.greRequired

      await apiClient.put(`/professor/${editingProfessor.id}`, updates)
      
      // Refresh data
      await fetchAllProfessors()
      closeModal()
    } catch (err) {
      console.error('Save error:', err)
      alert('Error saving: ' + (err.response?.data?.error || err.message))
    }
  }

  const handleDeleteProfessor = async (id) => {
    if (!canEdit) {
      alert('You do not have permission to delete professors')
      return
    }
    
    try {
      const response = await apiClient.delete(`/professor/${id}`)
      if (response.data.success) {
        // Auto refresh the list
        await fetchAllProfessors()
        // Close modal if open
        closeModal()
        // Show success message (optional, can remove alert if you prefer silent refresh)
        // alert('Professor deleted successfully')
      } else {
        alert('Error: ' + (response.data.error || 'Failed to delete professor'))
      }
    } catch (err) {
      console.error('Error deleting:', err)
      alert('Error deleting: ' + (err.response?.data?.error || err.message))
    }
  }

  const getShortDesignation = (designation) => {
    if (!designation) return ''
    if (designation.includes('Assistant')) return 'Asst. Prof.'
    if (designation.includes('Associate')) return 'Assoc. Prof.'
    return designation.substring(0, 15)
  }

  const getNameColor = (professor) => {
    if (professor.followUpMailSent) return 'text-yellow-600'
    if (professor.mailed) return 'text-green-600'
    return 'text-gray-900'
  }

  if (loading) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading professors...</p>
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

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Search & Filter Professors
          </h1>
          <p className="text-gray-600">
            Total: {professors.length} professors | Showing: {filteredProfessors.length} | Page {currentPage} of {totalPages}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={async () => {
              try {
                const selectedUni = selectedUniversity || 'all'
                const url = selectedUni === 'all' 
                  ? `${API_BASE_URL}/professor/export/excel`
                  : `${API_BASE_URL}/professor/export/excel?university=${encodeURIComponent(selectedUni)}`
                
                const token = localStorage.getItem('authToken')
                const response = await fetch(url, {
                  headers: {
                    'Authorization': `Bearer ${token}`
                  }
                })
                
                if (response.ok) {
                  const blob = await response.blob()
                  const downloadUrl = window.URL.createObjectURL(blob)
                  const link = document.createElement('a')
                  link.href = downloadUrl
                  const timestamp = new Date().toISOString().split('T')[0]
                  link.download = selectedUni === 'all' 
                    ? `professors_all_export_${timestamp}.xlsx`
                    : `professors_${selectedUni.replace(/[^a-zA-Z0-9]/g, '_')}_export_${timestamp}.xlsx`
                  document.body.appendChild(link)
                  link.click()
                  document.body.removeChild(link)
                  window.URL.revokeObjectURL(downloadUrl)
                } else {
                  const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
                  alert('Error downloading Excel file: ' + (errorData.error || 'Unknown error'))
                }
              } catch (err) {
                alert('Error downloading Excel: ' + err.message)
              }
            }}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center gap-2"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download Excel
          </button>
          <Link
            to="/tasks"
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
          >
            Task List
          </Link>
          <button
            onClick={() => {
              if (!canAddProfessors) {
                alert('You do not have permission to add professors')
                return
              }
              setIsAddModalOpen(true)
            }}
            disabled={!canAddProfessors}
            className={`px-6 py-2 rounded-lg font-medium ${
              canAddProfessors
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            + Add Professor
          </button>
        </div>
      </div>

      {/* Follow-up Section */}
      {needsFollowUp.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-yellow-800">
                {needsFollowUp.length} professor(s) need follow-up (mailed 7+ days ago, no follow-up sent)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Filters</h2>
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Clear All
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search by Name
            </label>
            <input
              type="text"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="Enter professor name..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by University
            </label>
            <div className="relative">
              <input
                type="text"
                value={selectedUniversity || universitySearch}
                onChange={(e) => {
                  const value = e.target.value
                  setUniversitySearch(value)
                  setShowUniversityDropdown(true)
                  // If exact match found, select it
                  const exactMatch = universities.find(uni => uni.toLowerCase() === value.toLowerCase())
                  if (exactMatch) {
                    setSelectedUniversity(exactMatch)
                    setUniversitySearch('')
                  } else {
                    setSelectedUniversity('')
                  }
                  setCurrentPage(1)
                }}
                onFocus={() => setShowUniversityDropdown(true)}
                onBlur={() => setTimeout(() => setShowUniversityDropdown(false), 200)}
                placeholder="Type to search university..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {showUniversityDropdown && filteredUniversities.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                  {filteredUniversities.map((uni) => (
                    <button
                      key={uni}
                      type="button"
                      onClick={() => {
                        setSelectedUniversity(uni)
                        setUniversitySearch('')
                        setShowUniversityDropdown(false)
                        setCurrentPage(1)
                      }}
                      className={`w-full text-left px-4 py-2 hover:bg-blue-50 ${
                        selectedUniversity === uni ? 'bg-blue-100 font-medium' : ''
                      }`}
                    >
                      {uni}
                    </button>
                  ))}
                </div>
              )}
              {selectedUniversity && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedUniversity('')
                    setUniversitySearch('')
                    setCurrentPage(1)
                  }}
                  className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Research Interest (Multi-select)
            </label>
            <div className="relative">
              <input
                type="text"
                value={researchInterestSearch}
                onChange={(e) => {
                  setResearchInterestSearch(e.target.value)
                  setShowResearchInterestDropdown(true)
                }}
                onFocus={() => setShowResearchInterestDropdown(true)}
                onBlur={() => {
                  // Delay hiding dropdown to allow click on option
                  setTimeout(() => setShowResearchInterestDropdown(false), 200)
                }}
                placeholder="Type to search and select multiple interests..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {showResearchInterestDropdown && filteredResearchInterests.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                  {filteredResearchInterests.map((interest) => (
                    <div
                      key={interest}
                      onClick={(e) => {
                        e.preventDefault()
                        toggleResearchInterest(interest)
                        setResearchInterestSearch('')
                      }}
                      className={`px-4 py-2 cursor-pointer hover:bg-blue-50 flex items-center gap-2 ${
                        selectedResearchInterests.includes(interest) ? 'bg-blue-100' : ''
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedResearchInterests.includes(interest)}
                        onChange={() => {}}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span>{interest}</span>
                    </div>
                  ))}
                </div>
              )}
              {researchInterestSearch && filteredResearchInterests.length === 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                  <div className="px-4 py-2 text-gray-500 text-sm">
                    No matching research interests found
                  </div>
                </div>
              )}
            </div>
            {selectedResearchInterests.length > 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="text-xs text-gray-600">Selected ({selectedResearchInterests.length}):</span>
                {selectedResearchInterests.map((interest) => (
                  <span
                    key={interest}
                    className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded flex items-center gap-1"
                  >
                    {interest}
                    <button
                      onClick={() => toggleResearchInterest(interest)}
                      className="text-red-600 hover:text-red-800 ml-1"
                      title="Remove"
                    >
                      ×
                    </button>
                  </span>
                ))}
                <button
                  onClick={() => {
                    setSelectedResearchInterests([])
                    setResearchInterestSearch('')
                  }}
                  className="text-xs text-red-600 hover:text-red-800 font-medium"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recruiting Status
            </label>
            <select
              value={recruitingFilter}
              onChange={(e) => setRecruitingFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All</option>
              <option value="yes">Currently Recruiting</option>
              <option value="no">Not Recruiting</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mailed Status
            </label>
            <select
              value={mailedFilter}
              onChange={(e) => setMailedFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All</option>
              <option value="mailed">Mailed</option>
              <option value="not_mailed">Not Mailed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hiring Semester
            </label>
            <select
              value={hiringSemesterFilter}
              onChange={(e) => setHiringSemesterFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All</option>
              <option value="Fall">Fall</option>
              <option value="Spring">Spring</option>
              <option value="Both">Both</option>
            </select>
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {currentProfessors.map((professor) => (
          <div
            key={professor.id}
            onClick={() => openModal(professor)}
            className="bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow border border-gray-200"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2 flex-1">
                <h3 className={`font-semibold text-lg ${getNameColor(professor)}`}>
                  {professor.name || 'N/A'}
                </h3>
                {professor.mailed && (
                  <svg className="h-5 w-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                )}
                {professor.followUpMailSent && (
                  <svg className="h-5 w-5 text-yellow-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={async (e) => {
                    e.stopPropagation()
                    try {
                      await apiClient.put(`/professor/${professor.id}`, { 
                        priority: !professor.priority 
                      })
                      await fetchAllProfessors()
                    } catch (err) {
                      alert('Error updating priority: ' + (err.response?.data?.error || err.message))
                    }
                  }}
                  className={`p-1 rounded hover:bg-yellow-50 ${professor.priority ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'}`}
                  title={professor.priority ? 'Remove from priority' : 'Mark as priority'}
                >
                  <svg className="h-5 w-5" fill={professor.priority ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (confirm(`Are you sure you want to delete ${professor.name || 'this professor'}?`)) {
                      handleDeleteProfessor(professor.id)
                    }
                  }}
                  className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                  title="Delete professor"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 mb-1">
              {getShortDesignation(professor.designation)}
            </p>
            
            <p className="text-xs text-gray-500 mb-2">
              {professor.universityName || 'N/A'}
            </p>
            
            <p className="text-sm text-gray-700 mb-2 line-clamp-2">
              {professor.researchInterests || 'N/A'}
            </p>
            
            <div className="flex items-center justify-between mt-3">
              <div className="flex gap-2">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  professor.currentlyRecruiting === 'Yes' || professor.recruitingPhdStudents === 'Yes'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {professor.currentlyRecruiting === 'Yes' || professor.recruitingPhdStudents === 'Yes' ? 'Recruiting' : 'Not Recruiting'}
                </span>
                {professor.hiringSemester && (
                  <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                    {professor.hiringSemester}
                  </span>
                )}
              </div>
              
              <div className="flex gap-2">
                {professor.portfolioWebsite && (
                  <a
                    href={professor.portfolioWebsite}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Portfolio →
                  </a>
                )}
                {professor.labWebsite && (
                  <a
                    href={professor.labWebsite}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs text-purple-600 hover:text-purple-800"
                  >
                    Lab →
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProfessors.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No professors found matching the filters
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between bg-white px-4 py-3 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                currentPage === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              Previous
            </button>
            <span className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                currentPage === totalPages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              Next
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Go to page:</span>
            <input
              type="number"
              min="1"
              max={totalPages}
              value={currentPage}
              onChange={(e) => {
                const page = parseInt(e.target.value)
                if (page >= 1 && page <= totalPages) {
                  setCurrentPage(page)
                }
              }}
              className="w-20 px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      )}

      {/* Details Modal */}
      {isModalOpen && editingProfessor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center">
              <h2 className="text-lg sm:text-2xl font-bold text-gray-900 truncate pr-2">
                Edit Professor: {editingProfessor.name}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={editingProfessor.name || ''}
                    onChange={(e) => setEditingProfessor({ ...editingProfessor, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editingProfessor.email || ''}
                    onChange={(e) => setEditingProfessor({ ...editingProfessor, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">University</label>
                  <input
                    type="text"
                    value={editingProfessor.universityName || ''}
                    onChange={(e) => setEditingProfessor({ ...editingProfessor, universityName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                  <input
                    type="text"
                    value={editingProfessor.designation || ''}
                    onChange={(e) => setEditingProfessor({ ...editingProfessor, designation: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Research & Recruiting */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Research Interests</label>
                <textarea
                  value={editingProfessor.researchInterests || ''}
                  onChange={(e) => setEditingProfessor({ ...editingProfessor, researchInterests: e.target.value })}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Recruiting PhD Students</label>
                  <select
                    value={editingProfessor.recruitingPhdStudents || ''}
                    onChange={(e) => {
                      const value = e.target.value
                      const updates = { ...editingProfessor, recruitingPhdStudents: value }
                      // If recruiting PhD students is Yes, automatically set currently recruiting to Yes
                      if (value === 'Yes') {
                        updates.currentlyRecruiting = 'Yes'
                      }
                      setEditingProfessor(updates)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Not Specified</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currently Recruiting</label>
                  <select
                    value={editingProfessor.currentlyRecruiting || ''}
                    onChange={(e) => setEditingProfessor({ ...editingProfessor, currentlyRecruiting: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    disabled={editingProfessor.recruitingPhdStudents === 'Yes'}
                  >
                    <option value="">Not Specified</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                  {editingProfessor.recruitingPhdStudents === 'Yes' && (
                    <p className="text-xs text-gray-500 mt-1">Automatically set to Yes when recruiting PhD students</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hiring Semester</label>
                  <select
                    value={editingProfessor.hiringSemester || ''}
                    onChange={(e) => setEditingProfessor({ ...editingProfessor, hiringSemester: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Not Specified</option>
                    <option value="Fall">Fall</option>
                    <option value="Spring">Spring</option>
                    <option value="Both">Both</option>
                  </select>
                </div>
              </div>

              {/* Portfolio & Links */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Portfolio Website</label>
                  <input
                    type="url"
                    value={editingProfessor.portfolioWebsite || ''}
                    onChange={(e) => setEditingProfessor({ ...editingProfessor, portfolioWebsite: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lab Website</label>
                  <input
                    type="url"
                    value={editingProfessor.labWebsite || ''}
                    onChange={(e) => setEditingProfessor({ ...editingProfessor, labWebsite: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Mailing Info */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Mailing Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-2 mb-2">
                      <input
                        type="checkbox"
                        checked={editingProfessor.mailed || false}
                        onChange={(e) => {
                          const mailed = e.target.checked
                          if (mailed) {
                            const now = new Date()
                            const year = now.getFullYear()
                            const month = String(now.getMonth() + 1).padStart(2, '0')
                            const day = String(now.getDate()).padStart(2, '0')
                            const hours = String(now.getHours()).padStart(2, '0')
                            const minutes = String(now.getMinutes()).padStart(2, '0')
                            setEditingProfessor({
                              ...editingProfessor,
                              mailed: true,
                              mailingDate: `${year}-${month}-${day}T${hours}:${minutes}`
                            })
                          } else {
                            setEditingProfessor({
                              ...editingProfessor,
                              mailed: false,
                              mailingDate: null
                            })
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm font-medium text-gray-700">Mailed</span>
                    </label>
                    {editingProfessor.mailed && (
                      <input
                        type="datetime-local"
                        value={editingProfessor.mailingDate || ''}
                        onChange={(e) => setEditingProfessor({ ...editingProfessor, mailingDate: e.target.value || null })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    )}
                  </div>
                  <div>
                    <label className="flex items-center gap-2 mb-2">
                      <input
                        type="checkbox"
                        checked={editingProfessor.followUpMailSent || false}
                        onChange={(e) => {
                          const followUpSent = e.target.checked
                          if (followUpSent) {
                            const now = new Date()
                            const year = now.getFullYear()
                            const month = String(now.getMonth() + 1).padStart(2, '0')
                            const day = String(now.getDate()).padStart(2, '0')
                            const hours = String(now.getHours()).padStart(2, '0')
                            const minutes = String(now.getMinutes()).padStart(2, '0')
                            setEditingProfessor({
                              ...editingProfessor,
                              followUpMailSent: true,
                              followUpMailDate: `${year}-${month}-${day}T${hours}:${minutes}`
                            })
                          } else {
                            setEditingProfessor({
                              ...editingProfessor,
                              followUpMailSent: false,
                              followUpMailDate: null
                            })
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm font-medium text-gray-700">Follow-up Mail Sent</span>
                    </label>
                    {editingProfessor.followUpMailSent && (
                      <input
                        type="datetime-local"
                        value={editingProfessor.followUpMailDate || ''}
                        onChange={(e) => setEditingProfessor({ ...editingProfessor, followUpMailDate: e.target.value || null })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Priority & Application Info */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Priority & Application Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <button
                        type="button"
                        onClick={() => setEditingProfessor({ ...editingProfessor, priority: !editingProfessor.priority })}
                        className={`p-1 rounded hover:bg-yellow-50 ${editingProfessor.priority ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'}`}
                        title={editingProfessor.priority ? 'Remove from priority' : 'Mark as priority'}
                      >
                        <svg className="h-6 w-6" fill={editingProfessor.priority ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      </button>
                      <span className="text-sm font-medium text-gray-700">Mark as Priority</span>
                    </label>
                    <p className="text-xs text-gray-500 mt-1">Priority professors appear in Task List</p>
                  </div>
                  <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingProfessor.greRequired || false}
                        onChange={(e) => setEditingProfessor({ ...editingProfessor, greRequired: e.target.checked })}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">GRE Required</span>
                    </label>
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Application Deadline</label>
                  <input
                    type="datetime-local"
                    value={editingProfessor.deadline || ''}
                    onChange={(e) => setEditingProfessor({ ...editingProfessor, deadline: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Comments */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Comments</label>
                <textarea
                  value={editingProfessor.comments || ''}
                  onChange={(e) => setEditingProfessor({ ...editingProfessor, comments: e.target.value })}
                  rows="4"
                  placeholder="Add notes or comments about this professor..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Save Button */}
              <div className="flex justify-end gap-4 pt-4 border-t">
                <button
                  onClick={closeModal}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!canEdit}
                  className={`px-6 py-2 rounded-lg ${
                    canEdit
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Professor Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">
                Add New Professor
              </h2>
              <button
                onClick={() => {
                  setIsAddModalOpen(false)
                  setNewProfessor({
                    name: '',
                    email: '',
                    universityName: '',
                    designation: '',
                    portfolioWebsite: '',
                    sourceUrl: '',
                    labWebsite: '',
                    researchInterests: '',
                    googleScholarUrl: '',
                    recruitingPhdStudents: '',
                    currentlyRecruiting: '',
                    hiringSemester: '',
                    comments: '',
                    priority: false,
                    deadline: '',
                    greRequired: false
                  })
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    value={newProfessor.name}
                    onChange={(e) => setNewProfessor({ ...newProfessor, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={newProfessor.email}
                    onChange={(e) => setNewProfessor({ ...newProfessor, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">University *</label>
                  <input
                    type="text"
                    value={newProfessor.universityName}
                    onChange={(e) => setNewProfessor({ ...newProfessor, universityName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                  <input
                    type="text"
                    value={newProfessor.designation}
                    onChange={(e) => setNewProfessor({ ...newProfessor, designation: e.target.value })}
                    placeholder="e.g., Assistant Professor"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Portfolio or Source URL */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Portfolio Website</label>
                  <input
                    type="url"
                    value={newProfessor.portfolioWebsite}
                    onChange={(e) => setNewProfessor({ ...newProfessor, portfolioWebsite: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Source URL (if no portfolio)</label>
                  <input
                    type="url"
                    value={newProfessor.sourceUrl}
                    onChange={(e) => setNewProfessor({ ...newProfessor, sourceUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Research & Recruiting */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Research Interests</label>
                <textarea
                  value={newProfessor.researchInterests}
                  onChange={(e) => setNewProfessor({ ...newProfessor, researchInterests: e.target.value })}
                  rows="3"
                  placeholder="Comma-separated keywords"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Recruiting PhD Students</label>
                  <select
                    value={newProfessor.recruitingPhdStudents}
                    onChange={(e) => {
                      const value = e.target.value
                      const updates = { ...newProfessor, recruitingPhdStudents: value }
                      // If recruiting PhD students is Yes, automatically set currently recruiting to Yes
                      if (value === 'Yes') {
                        updates.currentlyRecruiting = 'Yes'
                      }
                      setNewProfessor(updates)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Not Specified</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currently Recruiting</label>
                  <select
                    value={newProfessor.currentlyRecruiting}
                    onChange={(e) => setNewProfessor({ ...newProfessor, currentlyRecruiting: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    disabled={newProfessor.recruitingPhdStudents === 'Yes'}
                  >
                    <option value="">Not Specified</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                  {newProfessor.recruitingPhdStudents === 'Yes' && (
                    <p className="text-xs text-gray-500 mt-1">Automatically set to Yes when recruiting PhD students</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hiring Semester</label>
                  <select
                    value={newProfessor.hiringSemester}
                    onChange={(e) => setNewProfessor({ ...newProfessor, hiringSemester: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Not Specified</option>
                    <option value="Fall">Fall</option>
                    <option value="Spring">Spring</option>
                    <option value="Both">Both</option>
                  </select>
                </div>
              </div>

              {/* Additional Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lab Website</label>
                  <input
                    type="url"
                    value={newProfessor.labWebsite}
                    onChange={(e) => setNewProfessor({ ...newProfessor, labWebsite: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Google Scholar URL</label>
                  <input
                    type="url"
                    value={newProfessor.googleScholarUrl}
                    onChange={(e) => setNewProfessor({ ...newProfessor, googleScholarUrl: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Priority & Application Info */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Priority & Application Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <button
                        type="button"
                        onClick={() => setNewProfessor({ ...newProfessor, priority: !newProfessor.priority })}
                        className={`p-1 rounded hover:bg-yellow-50 ${newProfessor.priority ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'}`}
                        title={newProfessor.priority ? 'Remove from priority' : 'Mark as priority'}
                      >
                        <svg className="h-6 w-6" fill={newProfessor.priority ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      </button>
                      <span className="text-sm font-medium text-gray-700">Mark as Priority</span>
                    </label>
                    <p className="text-xs text-gray-500 mt-1">Priority professors appear in Task List</p>
                  </div>
                  <div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={newProfessor.greRequired || false}
                        onChange={(e) => setNewProfessor({ ...newProfessor, greRequired: e.target.checked })}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">GRE Required</span>
                    </label>
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Application Deadline</label>
                  <input
                    type="datetime-local"
                    value={newProfessor.deadline}
                    onChange={(e) => setNewProfessor({ ...newProfessor, deadline: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Comments */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Comments</label>
                <textarea
                  value={newProfessor.comments}
                  onChange={(e) => setNewProfessor({ ...newProfessor, comments: e.target.value })}
                  rows="3"
                  placeholder="Add notes or comments..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Save Button */}
              <div className="flex justify-end gap-4 pt-4 border-t">
                <button
                  onClick={() => {
                    setIsAddModalOpen(false)
                    setNewProfessor({
                      name: '',
                      email: '',
                      universityName: '',
                      designation: '',
                      portfolioWebsite: '',
                      sourceUrl: '',
                      labWebsite: '',
                      researchInterests: '',
                      googleScholarUrl: '',
                      recruitingPhdStudents: '',
                      currentlyRecruiting: '',
                      comments: '',
                      priority: false,
                      deadline: '',
                      greRequired: false
                    })
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!canAddProfessors) {
                      alert('You do not have permission to add professors')
                      return
                    }
                    if (!newProfessor.name || !newProfessor.universityName) {
                      alert('Name and University are required')
                      return
                    }
                    try {
                      await apiClient.post('/professor/create', newProfessor)
                      await fetchAllProfessors()
                      setIsAddModalOpen(false)
                      setNewProfessor({
                        name: '',
                        email: '',
                        universityName: '',
                        designation: '',
                        portfolioWebsite: '',
                        sourceUrl: '',
                        labWebsite: '',
                        researchInterests: '',
                        googleScholarUrl: '',
                        recruitingPhdStudents: '',
                        currentlyRecruiting: '',
                        comments: '',
                        priority: false,
                        deadline: '',
                        greRequired: false
                      })
                    } catch (err) {
                      alert('Error creating professor: ' + (err.response?.data?.error || err.message))
                    }
                  }}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Professor
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SearchPage
