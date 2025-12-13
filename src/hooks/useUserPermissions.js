import { useState, useEffect } from 'react'
import apiClient from '../utils/axiosConfig'

export function useUserPermissions() {
  const [permissions, setPermissions] = useState({
    canAddProfessors: false,
    canUseAISearch: false,
    canEdit: false,
    canView: false,
    loading: true
  })
  const [userRole, setUserRole] = useState(localStorage.getItem('userRole') || 'admin')

  useEffect(() => {
    const role = localStorage.getItem('userRole') || 'admin'
    setUserRole(role)

    if (role === 'admin') {
      // Admin has all permissions
      setPermissions({
        canAddProfessors: true,
        canUseAISearch: true,
        canEdit: true,
        canView: true,
        loading: false
      })
    } else if (role === 'user') {
      // Fetch user profile to get permissions
      apiClient.get('/user/profile')
        .then(response => {
          if (response.data.success && response.data.user) {
            const user = response.data.user
            setPermissions({
              canAddProfessors: user.canAddProfessors || false,
              canUseAISearch: user.canUseAISearch || false,
              canEdit: user.canEdit || false,
              canView: user.canView || false,
              loading: false
            })
          }
        })
        .catch(() => {
          setPermissions({
            canAddProfessors: false,
            canUseAISearch: false,
            canEdit: false,
            canView: false,
            loading: false
          })
        })
    } else {
      // Visitor has limited permissions
      setPermissions({
        canAddProfessors: false,
        canUseAISearch: false,
        canEdit: false,
        canView: true,
        loading: false
      })
    }
  }, [])

  return { ...permissions, userRole }
}

