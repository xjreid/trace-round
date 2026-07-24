import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import { AuthContext } from './authContext'
import {
  getCurrentUser,
  signInAsDefaultUser,
  signOutUser,
} from '../pages/backend-functions-to-be-implemented/backendFunctions'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isAuthLoading, setIsAuthLoading] = useState(true)

  useEffect(() => {
    let isCurrent = true

    async function loadCurrentUser() {
      const currentUser = await getCurrentUser()

      if (isCurrent) {
        setUser(currentUser)
        setIsAuthLoading(false)
      }
    }

    loadCurrentUser()

    return () => {
      isCurrent = false
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      isAuthLoading,
      signInAsDemo: async () => {
        const defaultUser = await signInAsDefaultUser()
        setUser(defaultUser)
        return defaultUser
      },
      signOut: async () => {
        await signOutUser()
        setUser(null)
      },
    }),
    [isAuthLoading, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
