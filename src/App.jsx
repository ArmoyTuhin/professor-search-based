import React, { useEffect, useState } from 'react'
import { HashRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import SearchPage from './pages/SearchPage'
import UniversitiesPage from './pages/UniversitiesPage'
import TaskListPage from './pages/TaskListPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ProfilePage from './pages/ProfilePage'
import AdminUsersPage from './pages/AdminUsersPage'
import GeminiKeysPage from './pages/GeminiKeysPage'
import VisitorPasswordsPage from './pages/VisitorPasswordsPage'
import apiClient from './utils/axiosConfig'

// Protected Route Component
function ProtectedRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      setIsAuthenticated(false)
      setLoading(false)
      return
    }

    // Verify token
    apiClient.get('/auth/verify')
      .then((response) => {
        setIsAuthenticated(true)
        // Update role if provided
        if (response.data.role) {
          localStorage.setItem('userRole', response.data.role)
        }
      })
      .catch(() => {
        localStorage.removeItem('authToken')
        localStorage.removeItem('userRole')
        setIsAuthenticated(false)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    )
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />
}

// Inner component that can use useLocation hook
function AppContent() {
  const location = useLocation()
  const [hasToken, setHasToken] = useState(!!localStorage.getItem('authToken'))
  const [userRole, setUserRole] = useState(localStorage.getItem('userRole') || 'admin')

  // Update token status when location changes (navigation)
  useEffect(() => {
    setHasToken(!!localStorage.getItem('authToken'))
    setUserRole(localStorage.getItem('userRole') || 'admin')
  }, [location])

  // Listen for login events
  useEffect(() => {
    const handleLogin = () => {
      setHasToken(!!localStorage.getItem('authToken'))
      setUserRole(localStorage.getItem('userRole') || 'admin')
    }
    
    window.addEventListener('login', handleLogin)
    return () => window.removeEventListener('login', handleLogin)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('userRole')
    setHasToken(false)
    setUserRole('admin')
    window.location.href = '#/login'
  }

  // Show nav if we have a token (optimistic - ProtectedRoute will handle actual verification)
  const showNav = hasToken
  const isAdmin = userRole === 'admin'

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen flex flex-col">
      {showNav && (
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <h1 className="text-xl font-bold text-blue-600">
                    Professor Search
                  </h1>
                </div>
                <div className="hidden md:ml-6 md:flex md:space-x-8">
                  <Link
                    to="/"
                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Home
                  </Link>
                  <Link
                    to="/search"
                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Search & Filter
                  </Link>
                  <Link
                    to="/universities"
                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Universities
                  </Link>
                  <Link
                    to="/tasks"
                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Task List
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/gemini-keys"
                      className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                    >
                      API Keys
                    </Link>
                  )}
                  {isAdmin && (
                    <Link
                      to="/visitor-passwords"
                      className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                    >
                      Visitor Passwords
                    </Link>
                  )}
                  {userRole === 'visitor' && (
                    <span className="border-transparent text-orange-600 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                      (Visitor - 1 request limit)
                    </span>
                  )}
                  {userRole === 'user' && (
                    <Link
                      to="/profile"
                      className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                    >
                      Profile
                    </Link>
                  )}
                  {isAdmin && (
                    <Link
                      to="/admin/users"
                      className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                    >
                      User Management
                    </Link>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2 md:space-x-4">
                {/* Mobile menu button */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                  aria-expanded="false"
                >
                  <span className="sr-only">Open main menu</span>
                  {mobileMenuOpen ? (
                    <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  )}
                </button>
                <div className="hidden md:flex md:items-center md:space-x-4">
                  {userRole === 'user' && (
                    <Link
                      to="/profile"
                      className="text-gray-500 hover:text-gray-700 px-3 py-2 text-sm font-medium"
                    >
                      Profile
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="text-gray-500 hover:text-gray-700 px-3 py-2 text-sm font-medium"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200">
              <div className="px-2 pt-2 pb-3 space-y-1">
                <Link
                  to="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                >
                  Home
                </Link>
                <Link
                  to="/search"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                >
                  Search & Filter
                </Link>
                <Link
                  to="/universities"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                >
                  Universities
                </Link>
                <Link
                  to="/tasks"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                >
                  Task List
                </Link>
                {isAdmin && (
                  <Link
                    to="/gemini-keys"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    API Keys
                  </Link>
                )}
                {isAdmin && (
                  <Link
                    to="/visitor-passwords"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    Visitor Passwords
                  </Link>
                )}
                {userRole === 'visitor' && (
                  <span className="block px-3 py-2 text-base font-medium text-orange-600">
                    (Visitor - 1 request limit)
                  </span>
                )}
                {userRole === 'user' && (
                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    Profile
                  </Link>
                )}
                {isAdmin && (
                  <Link
                    to="/admin/users"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    User Management
                  </Link>
                )}
                <div className="border-t border-gray-200 pt-2">
                  {userRole === 'user' && (
                    <Link
                      to="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                    >
                      Profile
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false)
                      handleLogout()
                    }}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          )}
        </nav>
      )}

      <main className="flex-grow">

        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<ProtectedRoute><LandingPage /></ProtectedRoute>} />
          <Route path="/search" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
          <Route path="/universities" element={<ProtectedRoute><UniversitiesPage /></ProtectedRoute>} />
          <Route path="/tasks" element={<ProtectedRoute><TaskListPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute><AdminUsersPage /></ProtectedRoute>} />
          <Route path="/gemini-keys" element={<ProtectedRoute><GeminiKeysPage /></ProtectedRoute>} />
          <Route path="/visitor-passwords" element={<ProtectedRoute><VisitorPasswordsPage /></ProtectedRoute>} />
        </Routes>
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-center text-sm text-gray-600">
            Made by{' '}
            <a
              href="https://armoytuhin.github.io/portfolio/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 font-medium underline"
            >
              Tuhin
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

function App() {

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <AppContent />
      </div>
    </Router>
  )
}

export default App

