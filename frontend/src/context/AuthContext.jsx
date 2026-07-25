import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import { AuthContext } from './authContext'
import {
  getCurrentUser,
  registerUser,
  signInUser,
  signOutUser,
} from '../pages/backend-functions-to-be-implemented/backendFunctions'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isAuthLoading, setIsAuthLoading] = useState(true)

  useEffect(() => {
    let isCurrent = true

    async function loadCurrentUser() {
      try {
        const currentUser = await getCurrentUser()
        if (isCurrent) {
          setUser(currentUser)
        }
      } catch {
        if (isCurrent) {
          setUser(null)
        }
      } finally {
        if (isCurrent) {
          setIsAuthLoading(false)
        }
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
      signIn: async (credentials) => {
        const signedInUser = await signInUser(credentials)
        setUser(signedInUser)
        return signedInUser
      },
      register: async (details) => {
        const registeredUser = await registerUser(details)
        setUser(registeredUser)
        return registeredUser
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
