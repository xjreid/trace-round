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

const BACKEND_WAKE_NOTICE_DELAY_MS = 2500

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [isBackendWaking, setIsBackendWaking] = useState(false)

  useEffect(() => {
    let isCurrent = true
    const wakeNoticeTimer = window.setTimeout(() => {
      if (isCurrent) {
        setIsBackendWaking(true)
      }
    }, BACKEND_WAKE_NOTICE_DELAY_MS)

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
          window.clearTimeout(wakeNoticeTimer)
          setIsBackendWaking(false)
          setIsAuthLoading(false)
        }
      }
    }

    loadCurrentUser()

    return () => {
      isCurrent = false
      window.clearTimeout(wakeNoticeTimer)
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      isAuthLoading,
      isBackendWaking,
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
    [isAuthLoading, isBackendWaking, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
