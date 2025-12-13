import React, { useState, useEffect } from 'react'
import apiClient from '../utils/axiosConfig'

function DashboardTab() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiClient.get('/dashboard/stats')
      if (response.data.success) {
        setStats(response.data.stats)
      } else {
        setError(response.data.error || 'Failed to load dashboard statistics')
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Error loading dashboard')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Loading dashboard...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No statistics available</p>
        <button
          onClick={fetchDashboardStats}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    )
  }

  // Prepare data for month-wise chart
  const monthlyData = stats.monthlyMails ? Object.entries(stats.monthlyMails) : []
  const maxMonthlyValue = monthlyData.length > 0 
    ? Math.max(...monthlyData.map(([_, count]) => count), 1) 
    : 1

  // Prepare state-wise data
  const stateData = stats.stateStats ? Object.entries(stats.stateStats) : []
  const sortedStates = [...stateData].sort((a, b) => 
    (b[1].universities || 0) - (a[1].universities || 0)
  )

  // Prepare university-wise mailed counts
  const universityData = stats.universityMailedCounts 
    ? Object.entries(stats.universityMailedCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10) // Top 10
    : []

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3">
              <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Universities</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalUniversities || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-100 rounded-lg p-3">
              <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Professors</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalProfessors || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-purple-100 rounded-lg p-3">
              <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Emails Sent</p>
              <p className="text-3xl font-bold text-gray-900">{stats.mailedProfessors || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Month-wise Email Chart */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Emails Sent by Month</h2>
        <div className="space-y-3">
          {monthlyData.length > 0 ? (
            monthlyData.map(([month, count]) => (
              <div key={month} className="flex items-center flex-wrap gap-2">
                <div className="w-20 sm:w-32 text-xs sm:text-sm text-gray-600 truncate">{month}</div>
                <div className="flex-1 mx-2 sm:mx-4 min-w-[100px]">
                  <div className="bg-gray-200 rounded-full h-6 relative overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full flex items-center justify-end pr-2"
                      style={{ width: `${(count / maxMonthlyValue) * 100}%` }}
                    >
                      {count > 0 && (
                        <span className="text-xs text-white font-medium">{count}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="w-12 sm:w-16 text-right text-xs sm:text-sm font-medium text-gray-900">{count}</div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">No email data available</p>
          )}
        </div>
      </div>

      {/* State-wise Statistics */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">State-wise Statistics</h2>
        {sortedStates.length > 0 ? (
          <div className="overflow-x-auto -mx-6 sm:mx-0">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    State
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Universities
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Emails Sent
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedStates.map(([state, data]) => (
                  <tr key={state}>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {state}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {data.universities || 0}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {data.mailed || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No state data available. Add state information to universities.</p>
        )}
      </div>

      {/* University-wise Mailed Counts */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Top Universities by Emails Sent</h2>
        {universityData.length > 0 ? (
          <div className="space-y-3">
            {universityData.map(([university, count]) => (
              <div key={university} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-900">{university}</span>
                <span className="text-sm font-bold text-blue-600">{count} emails</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No email data available by university</p>
        )}
      </div>
    </div>
  )
}

export default DashboardTab

