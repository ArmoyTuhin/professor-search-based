import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import apiClient, { API_BASE_URL } from '../utils/axiosConfig'
import axios from 'axios'
import { useUserPermissions } from '../hooks/useUserPermissions'
import DashboardTab from './DashboardTab'

function LandingPage() {
  const { canAddProfessors, canUseAISearch, canEdit, canView, userRole, loading: permissionsLoading } = useUserPermissions()
  const [activeTab, setActiveTab] = useState('dashboard') // 'dashboard', 'search', or 'university'
  const [facultyUrl, setFacultyUrl] = useState('')
  const [existingData, setExistingData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [universities, setUniversities] = useState([])
  const [selectedUniversity, setSelectedUniversity] = useState('')

  // Fetch universities on mount
  useEffect(() => {
    fetchUniversities()
  }, [])

  // Check for existing data when URL is entered
  useEffect(() => {
    if (facultyUrl.trim()) {
      checkExistingData()
    } else {
      setExistingData(null)
    }
  }, [facultyUrl])

  // Update URL when university is selected
  useEffect(() => {
    if (selectedUniversity) {
      const university = universities.find(u => u.id === parseInt(selectedUniversity))
      if (university && university.csFacultyWebsiteUrl) {
        setFacultyUrl(university.csFacultyWebsiteUrl)
      }
    } else {
      // Clear URL when no university is selected
      setFacultyUrl('')
    }
  }, [selectedUniversity, universities])

  const fetchUniversities = async () => {
    try {
      const response = await apiClient.get('/university')
      if (response.data.success) {
        setUniversities(response.data.universities || [])
      }
    } catch (err) {
      console.error('Error fetching universities:', err)
    }
  }

  const checkExistingData = async () => {
    try {
      const response = await apiClient.get('/professor/all')
      if (response.data.success && response.data.professors) {
        // Filter professors by source URL matching the faculty URL
        try {
          const urlObj = new URL(facultyUrl)
          const hostname = urlObj.hostname
          const matching = response.data.professors.filter(p => 
            p.sourceUrl && p.sourceUrl.includes(hostname)
          )
          if (matching.length > 0) {
            setExistingData({
              count: matching.length,
              professors: matching
            })
          } else {
            setExistingData(null)
          }
        } catch (urlError) {
          // If URL parsing fails, just check if sourceUrl contains the input string
          const matching = response.data.professors.filter(p => 
            p.sourceUrl && p.sourceUrl.includes(facultyUrl)
          )
          if (matching.length > 0) {
            setExistingData({
              count: matching.length,
              professors: matching
            })
          } else {
            setExistingData(null)
          }
        }
      }
    } catch (err) {
      console.error('Error checking existing data:', err)
      setExistingData(null)
    }
  }

  const handleForceSearch = async () => {
    if (!facultyUrl.trim()) {
      setError('Please enter a faculty URL')
      return
    }

    setProcessing(true)
    setError(null)
    setSuccess(null)

    try {
      // Extract university name from URL or use selected university
      let universityName = null
      if (selectedUniversity) {
        const university = universities.find(u => u.id === parseInt(selectedUniversity))
        if (university) {
          universityName = university.name
        }
      } else {
        // Try to extract university name from URL
        try {
          const urlObj = new URL(facultyUrl)
          const hostname = urlObj.hostname
          // Extract university name from hostname (e.g., www.usf.edu -> USF)
          const parts = hostname.replace('www.', '').split('.')
          if (parts.length > 0) {
            universityName = parts[0].toUpperCase()
          }
        } catch (e) {
          // Ignore URL parsing errors
        }
      }

      // Save/update university with this URL if we have a name
      if (universityName) {
        try {
          await apiClient.post('/university', {
            name: universityName,
            csFacultyWebsiteUrl: facultyUrl
          })
        } catch (err) {
          // Ignore errors - university might already exist
          console.log('University save note:', err.message)
        }
      }

      const response = await apiClient.post(
        '/professor/process-and-export',
        { facultyListingUrl: facultyUrl, forceProcess: true }
      )

      if (response.data.success) {
        setSuccess(`Successfully processed ${response.data.totalProfessors} professors!`)
        setExistingData({
          count: response.data.totalProfessors,
          professors: response.data.professors,
          statistics: response.data.statistics
        })
        // Refresh universities list
        await fetchUniversities()
      } else if (response.data.alreadyProcessed) {
        // Show message that it's already processed, with option to force
        setError('This university and faculty URL has already been processed. Click "Force Process" to process again.')
      } else {
        setError(response.data.error || 'Failed to process faculty URL')
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Error processing faculty URL')
      console.error('Error:', err)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Professor Search
        </h1>
        <p className="text-base sm:text-lg md:text-xl text-gray-600 px-4">
          AI-powered system to discover and connect with potential research advisors
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200 overflow-x-auto">
        <nav className="-mb-px flex space-x-4 sm:space-x-8 min-w-max">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'dashboard'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'search'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Search Professors
          </button>
          <button
            onClick={() => setActiveTab('university')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'university'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Manage Universities
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'dashboard' && (
        <DashboardTab />
      )}
      {activeTab === 'search' && (
        <>

      {/* URL Input Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Enter Faculty URL
        </h2>
        
        {/* University Selector */}
        {universities.length > 0 && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Or Select from Saved Universities
            </label>
            <select
              value={selectedUniversity}
              onChange={(e) => {
                setSelectedUniversity(e.target.value)
                // URL will be auto-filled by useEffect
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a university...</option>
              {universities
                .filter(u => u.csFacultyWebsiteUrl)
                .map((university) => (
                  <option key={university.id} value={university.id}>
                    {university.name}
                  </option>
                ))}
            </select>
          </div>
        )}

        <div className="flex gap-4">
          <input
            type="text"
            value={facultyUrl}
            onChange={(e) => {
              setFacultyUrl(e.target.value)
              setSelectedUniversity('') // Clear selection when manually typing
            }}
            placeholder="https://example-university.edu/faculty"
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={handleForceSearch}
            disabled={processing || !facultyUrl.trim() || !canAddProfessors || !canUseAISearch}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium flex items-center gap-2"
            title={!canAddProfessors || !canUseAISearch ? 'You do not have permission to add professors or use AI search' : ''}
          >
            {processing && (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {processing ? 'Processing...' : 'Force Search'}
          </button>
          {(!canAddProfessors || !canUseAISearch) && (
            <p className="text-sm text-red-600 mt-2">
              You do not have permission to add professors or use AI search. Please contact admin.
            </p>
          )}
        </div>
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}
            {success && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                {success}
              </div>
            )}
          </div>

      {/* Existing Data Section */}
      {existingData && existingData.count > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-gray-800">
              Existing Data ({existingData.count} professors)
            </h2>
            <Link
              to="/search"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
            >
              View All & Search
            </Link>
          </div>

          {existingData.statistics && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">With Portfolio</div>
                <div className="text-2xl font-bold text-blue-600">
                  {existingData.statistics.withPortfolio || 0}
                </div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">With Lab Website</div>
                <div className="text-2xl font-bold text-purple-600">
                  {existingData.statistics.withLabWebsite || 0}
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">With Research Interests</div>
                <div className="text-2xl font-bold text-green-600">
                  {existingData.statistics.withResearchInterests || 0}
                </div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Recruiting</div>
                <div className="text-2xl font-bold text-orange-600">
                  {existingData.statistics.recruiting || 0}
                </div>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Designation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    University
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recruiting
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {existingData.professors.slice(0, 10).map((professor) => (
                  <tr key={professor.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {professor.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {professor.designation || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {professor.universityName || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {professor.email || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {professor.currentlyRecruiting === 'Yes' || 
                       professor.recruitingPhdStudents === 'Yes' ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Yes
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          No
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {existingData.professors.length > 10 && (
              <div className="mt-4 text-center">
                <Link
                  to="/search"
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  View all {existingData.professors.length} professors →
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

          {/* Empty State */}
          {!existingData && !processing && facultyUrl && (
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <p className="text-gray-600 mb-4">
                No existing data found for this URL. Click "Force Search" to fetch professors.
              </p>
            </div>
          )}
        </>
      )}

      {activeTab === 'university' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Manage Universities
          </h2>
          <p className="text-gray-600 mb-4">
            Add and manage university faculty URLs for easy access later.
          </p>
          <Link
            to="/universities"
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Go to Universities Page →
          </Link>
        </div>
      )}
    </div>
  )
}

export default LandingPage

