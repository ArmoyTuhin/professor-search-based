import React, { useState, useEffect } from 'react'
import apiClient from '../utils/axiosConfig'

function UniversitiesPage() {
  const [universities, setUniversities] = useState([])
  const [allUniversities, setAllUniversities] = useState([]) // Combined list
  const [professors, setProfessors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingUniversity, setEditingUniversity] = useState(null)
  const [processingUniversity, setProcessingUniversity] = useState(null)
  
  // Filter and sort states
  const [sortBy, setSortBy] = useState('name') // 'name', 'ranking'
  const [sortOrder, setSortOrder] = useState('asc') // 'asc', 'desc'
  const [filterState, setFilterState] = useState('')
  const [filterRankingMin, setFilterRankingMin] = useState('')
  const [filterRankingMax, setFilterRankingMax] = useState('')
  const [filterName, setFilterName] = useState('')
  
  const [newUniversity, setNewUniversity] = useState({
    name: '',
    csFacultyWebsiteUrl: '',
    mainWebsiteUrl: '',
    state: '',
    notes: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    applyFiltersAndSort()
  }, [allUniversities, sortBy, sortOrder, filterState, filterRankingMin, filterRankingMax, filterName])

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      // Fetch universities from database
      const uniResponse = await apiClient.get('/university')
      const dbUniversities = uniResponse.data.success ? (uniResponse.data.universities || []) : []
      
      // Fetch professors to extract university names
      const profResponse = await apiClient.get('/professor/all')
      const allProfessors = profResponse.data.success ? (profResponse.data.professors || []) : []
      setProfessors(allProfessors)
      
      // Extract unique university names from professors
      const professorUniversities = [...new Set(allProfessors.map(p => p.universityName).filter(Boolean))]
      
      // Create a map of universities by name for quick lookup
      const universityMap = new Map()
      dbUniversities.forEach(u => {
        universityMap.set(u.name.toLowerCase(), u)
      })
      
      // Merge: start with database universities, add missing ones from professor data
      const merged = [...dbUniversities]
      professorUniversities.forEach(uniName => {
        const key = uniName.toLowerCase()
        if (!universityMap.has(key)) {
          // Create a new university entry from professor data
          merged.push({
            id: null, // No database ID
            name: uniName,
            csFacultyWebsiteUrl: null,
            mainWebsiteUrl: null,
            ranking: null,
            state: null,
            greRequired: null,
            deadline: null,
            notes: null,
            comments: null,
            status: 'pending',
            fromProfessors: true // Flag to indicate this came from professor data
          })
        }
      })
      
      setAllUniversities(merged)
      setUniversities(merged)
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Error fetching data')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const applyFiltersAndSort = () => {
    let filtered = [...allUniversities]
    
    // Apply filters
    if (filterName) {
      filtered = filtered.filter(u => 
        u.name.toLowerCase().includes(filterName.toLowerCase())
      )
    }
    
    if (filterState) {
      filtered = filtered.filter(u => 
        u.state && u.state.toLowerCase().includes(filterState.toLowerCase())
      )
    }
    
    if (filterRankingMin) {
      const min = parseInt(filterRankingMin)
      filtered = filtered.filter(u => 
        u.ranking !== null && u.ranking !== undefined && u.ranking >= min
      )
    }
    
    if (filterRankingMax) {
      const max = parseInt(filterRankingMax)
      filtered = filtered.filter(u => 
        u.ranking !== null && u.ranking !== undefined && u.ranking <= max
      )
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let aVal, bVal
      
      if (sortBy === 'ranking') {
        aVal = a.ranking !== null && a.ranking !== undefined ? a.ranking : 9999
        bVal = b.ranking !== null && b.ranking !== undefined ? b.ranking : 9999
      } else {
        // Sort by name
        aVal = (a.name || '').toLowerCase()
        bVal = (b.name || '').toLowerCase()
      }
      
      if (sortOrder === 'asc') {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0
      }
    })
    
    setUniversities(filtered)
  }

  const handleSave = async () => {
    try {
      if (editingUniversity.id) {
        // Update existing
        await apiClient.put(`/university/${editingUniversity.id}`, {
          name: editingUniversity.name,
          csFacultyWebsiteUrl: editingUniversity.csFacultyWebsiteUrl,
          mainWebsiteUrl: editingUniversity.mainWebsiteUrl,
          ranking: editingUniversity.ranking,
          state: editingUniversity.state,
          greRequired: editingUniversity.greRequired,
          deadline: editingUniversity.deadline,
          notes: editingUniversity.notes || editingUniversity.comments
        })
      } else {
        // Create new
        await apiClient.post('/university', {
          name: editingUniversity.name,
          csFacultyWebsiteUrl: editingUniversity.csFacultyWebsiteUrl,
          mainWebsiteUrl: editingUniversity.mainWebsiteUrl,
          ranking: editingUniversity.ranking,
          state: editingUniversity.state,
          greRequired: editingUniversity.greRequired,
          deadline: editingUniversity.deadline,
          notes: editingUniversity.notes || editingUniversity.comments
        })
      }
      await fetchData()
      setEditingUniversity(null)
    } catch (err) {
      alert('Error saving: ' + (err.response?.data?.error || err.message))
    }
  }

  const handleCreate = async () => {
    if (!newUniversity.name) {
      alert('University name is required')
      return
    }
    try {
      await apiClient.post('/university', newUniversity)
      await fetchData()
      setIsAddModalOpen(false)
      setNewUniversity({
        name: '',
        csFacultyWebsiteUrl: '',
        mainWebsiteUrl: '',
        state: '',
        notes: ''
      })
    } catch (err) {
      alert('Error creating university: ' + (err.response?.data?.error || err.message))
    }
  }

  // Get unique states for filter dropdown
  const uniqueStates = [...new Set(allUniversities.map(u => u.state).filter(Boolean))].sort()

  if (loading) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading universities...</p>
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
            University Faculty URLs
          </h1>
          <p className="text-gray-600">
            Manage faculty page URLs for universities
            {universities.filter(u => u.csFacultyWebsiteUrl).length > 0 && (
              <span className="ml-2 font-semibold text-blue-600">
                ({universities.filter(u => u.csFacultyWebsiteUrl).length} universities tracked with faculty URLs)
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          + Add University
        </button>
      </div>

      {/* Filters and Sorting */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search Name</label>
            <input
              type="text"
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              placeholder="University name..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
            <select
              value={filterState}
              onChange={(e) => setFilterState(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All States</option>
              {uniqueStates.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ranking Min</label>
            <input
              type="number"
              value={filterRankingMin}
              onChange={(e) => setFilterRankingMin(e.target.value)}
              placeholder="Min"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ranking Max</label>
            <input
              type="number"
              value={filterRankingMax}
              onChange={(e) => setFilterRankingMax(e.target.value)}
              placeholder="Max"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="name">Name</option>
              <option value="ranking">Ranking</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => {
              setFilterName('')
              setFilterState('')
              setFilterRankingMin('')
              setFilterRankingMax('')
            }}
            className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Universities Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  University Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ranking
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  State
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Faculty URL
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  GRE Required
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deadline
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Comments
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
              {universities.length === 0 ? (
                <tr>
                    <td colSpan="9" className="px-6 py-8 text-center text-gray-500">
                      <div>
                        <p className="mb-2">No universities found. Add one to get started.</p>
                        <p className="text-sm text-gray-400">
                          Add a university with a faculty URL to store it for later use.
                        </p>
                      </div>
                    </td>
                </tr>
              ) : (
                universities.map((university) => (
                  <tr key={university.id || university.name} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {university.name}
                      {university.fromProfessors && (
                        <span className="ml-2 text-xs text-gray-400">(from data)</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {university.ranking ? `#${university.ranking}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {university.state || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {university.csFacultyWebsiteUrl ? (
                        <a
                          href={university.csFacultyWebsiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 truncate block max-w-xs"
                          title={university.csFacultyWebsiteUrl}
                        >
                          {university.csFacultyWebsiteUrl}
                        </a>
                      ) : (
                        <span className="text-gray-400">Not set</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {university.greRequired !== null && university.greRequired !== undefined ? (
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          university.greRequired ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {university.greRequired ? 'Yes' : 'No'}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {university.deadline ? new Date(university.deadline).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={university.notes || university.comments || ''}>
                      {university.notes || university.comments || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        university.status === 'active' ? 'bg-green-100 text-green-800' :
                        university.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {university.status || 'pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingUniversity({ ...university })}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Edit
                        </button>
                        {university.id && (
                          <button
                            onClick={async () => {
                              if (confirm(`Are you sure you want to delete ${university.name}? This action cannot be undone.`)) {
                                if (confirm('This is a permanent deletion. Type "DELETE" to confirm force delete.')) {
                                  const confirmText = prompt('Type "DELETE" to confirm force delete:')
                                  if (confirmText === 'DELETE') {
                                    try {
                                      await apiClient.delete(`/university/${university.id}`)
                                      alert('University deleted successfully!')
                                      await fetchData()
                                    } catch (err) {
                                      alert('Error deleting university: ' + (err.response?.data?.error || err.message))
                                    }
                                  }
                                }
                              }
                            }}
                            className="text-red-600 hover:text-red-800"
                          >
                            Delete
                          </button>
                        )}
                        {university.csFacultyWebsiteUrl && (
                          <button
                            onClick={async () => {
                              if (confirm(`Process professors from ${university.name}? This will extract professors from the faculty URL.`)) {
                                setProcessingUniversity(university.id)
                                try {
                                  const response = await apiClient.post('/professor/process-and-export', {
                                    facultyListingUrl: university.csFacultyWebsiteUrl,
                                    forceProcess: false
                                  })
                                  if (response.data.success) {
                                    alert(`Successfully processed ${response.data.totalProfessors} professors from ${university.name}!`)
                                    await fetchData()
                                  } else if (response.data.alreadyProcessed) {
                                    if (confirm('This university has already been processed. Do you want to force process again?')) {
                                      const forceResponse = await apiClient.post('/professor/process-and-export', {
                                        facultyListingUrl: university.csFacultyWebsiteUrl,
                                        forceProcess: true
                                      })
                                      if (forceResponse.data.success) {
                                        alert(`Successfully force processed ${forceResponse.data.totalProfessors} professors from ${university.name}!`)
                                        await fetchData()
                                      } else {
                                        alert('Error: ' + (forceResponse.data.error || 'Failed to process'))
                                      }
                                    }
                                  } else {
                                    alert('Error: ' + (response.data.error || 'Failed to process'))
                                  }
                                } catch (err) {
                                  alert('Error: ' + (err.response?.data?.error || err.message))
                                } finally {
                                  setProcessingUniversity(null)
                                }
                              }
                            }}
                            disabled={processingUniversity === university.id}
                            className={`${processingUniversity === university.id ? 'text-gray-400' : 'text-green-600 hover:text-green-800'}`}
                          >
                            {processingUniversity === university.id ? 'Processing...' : 'Process Professors'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add University Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Add University</h2>
              <button
                onClick={() => {
                  setIsAddModalOpen(false)
                  setNewUniversity({ name: '', csFacultyWebsiteUrl: '', mainWebsiteUrl: '', notes: '' })
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">University Name *</label>
                <input
                  type="text"
                  value={newUniversity.name}
                  onChange={(e) => setNewUniversity({ ...newUniversity, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Faculty Page URL *
                  <span className="text-xs text-gray-500 ml-2">(Required to process professors)</span>
                </label>
                <input
                  type="url"
                  value={newUniversity.csFacultyWebsiteUrl}
                  onChange={(e) => setNewUniversity({ ...newUniversity, csFacultyWebsiteUrl: e.target.value })}
                  placeholder="https://university.edu/faculty"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This URL will be stored and can be used later to extract professors from this university.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Main Website URL</label>
                <input
                  type="url"
                  value={newUniversity.mainWebsiteUrl}
                  onChange={(e) => setNewUniversity({ ...newUniversity, mainWebsiteUrl: e.target.value })}
                  placeholder="https://university.edu"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <input
                  type="text"
                  value={newUniversity.state}
                  onChange={(e) => setNewUniversity({ ...newUniversity, state: e.target.value })}
                  placeholder="e.g., California, New York, Texas"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={newUniversity.notes}
                  onChange={(e) => setNewUniversity({ ...newUniversity, notes: e.target.value })}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end gap-4 pt-4">
                <button
                  onClick={() => {
                    setIsAddModalOpen(false)
                    setNewUniversity({ name: '', csFacultyWebsiteUrl: '', mainWebsiteUrl: '', notes: '' })
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit University Modal */}
      {editingUniversity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Edit University</h2>
              <button
                onClick={() => setEditingUniversity(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">University Name *</label>
                <input
                  type="text"
                  value={editingUniversity.name || ''}
                  onChange={(e) => setEditingUniversity({ ...editingUniversity, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Faculty Page URL
                  <span className="text-xs text-gray-500 ml-2">(Required to process professors)</span>
                </label>
                <input
                  type="url"
                  value={editingUniversity.csFacultyWebsiteUrl || ''}
                  onChange={(e) => setEditingUniversity({ ...editingUniversity, csFacultyWebsiteUrl: e.target.value })}
                  placeholder="https://university.edu/faculty"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This URL will be stored and can be used later to extract professors from this university.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Main Website URL</label>
                <input
                  type="url"
                  value={editingUniversity.mainWebsiteUrl || ''}
                  onChange={(e) => setEditingUniversity({ ...editingUniversity, mainWebsiteUrl: e.target.value })}
                  placeholder="https://university.edu"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ranking</label>
                <input
                  type="number"
                  value={editingUniversity.ranking || ''}
                  onChange={(e) => setEditingUniversity({ ...editingUniversity, ranking: e.target.value ? parseInt(e.target.value) : null })}
                  placeholder="e.g., 1, 2, 3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <input
                  type="text"
                  value={editingUniversity.state || ''}
                  onChange={(e) => setEditingUniversity({ ...editingUniversity, state: e.target.value })}
                  placeholder="e.g., California, New York"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GRE Required</label>
                <select
                  value={editingUniversity.greRequired === null || editingUniversity.greRequired === undefined ? '' : editingUniversity.greRequired}
                  onChange={(e) => setEditingUniversity({ ...editingUniversity, greRequired: e.target.value === '' ? null : e.target.value === 'true' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Not Set</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
                <input
                  type="datetime-local"
                  value={editingUniversity.deadline ? new Date(editingUniversity.deadline).toISOString().slice(0, 16) : ''}
                  onChange={(e) => setEditingUniversity({ ...editingUniversity, deadline: e.target.value ? new Date(e.target.value).toISOString() : null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Comments/Notes</label>
                <textarea
                  value={editingUniversity.notes || editingUniversity.comments || ''}
                  onChange={(e) => setEditingUniversity({ ...editingUniversity, notes: e.target.value, comments: e.target.value })}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end gap-4 pt-4">
                <button
                  onClick={() => setEditingUniversity(null)}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UniversitiesPage
