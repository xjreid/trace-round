import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { FaGithub, FaGoogle } from 'react-icons/fa6'
import { useAuth } from '../context/authContext'
import {
  getAuthCapabilities,
  signInWithProvider,
} from './backend-functions-to-be-implemented/backendFunctions'
import {
  clearPendingSignInDestination,
  getPendingSignInDestination,
  isValidInterviewDestination,
  isValidSignInDestination,
  rememberPendingSignInDestination,
} from './problems/interviewNavigation'
import './Signin.css'

const socialProviders = [
  { id: 'google', name: 'Google', Icon: FaGoogle },
  { id: 'github', name: 'GitHub', Icon: FaGithub },
]

function Signin() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, signIn, register, signOut } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mode, setMode] = useState('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState(
    searchParams.get('oauthError') ?? '',
  )
  const [oauthProviders, setOauthProviders] = useState([])
  const oauthRedirectHandled = useRef(false)
  const queryDestination = searchParams.get('returnTo') ?? ''
  const [pendingOAuthDestination] = useState(() =>
    queryDestination ? null : getPendingSignInDestination(),
  )
  const requestedDestination =
    queryDestination || pendingOAuthDestination || ''
  const validDestination = isValidSignInDestination(requestedDestination)
    ? requestedDestination
    : null
  const interviewDestination = isValidInterviewDestination(requestedDestination)
    ? requestedDestination
    : null
  const destination = validDestination ?? '/'
  const signedInDestination = validDestination ?? '/problems'

  useEffect(() => {
    let isCurrent = true

    getAuthCapabilities()
      .then((capabilities) => {
        if (isCurrent) {
          setOauthProviders(capabilities.oauthProviders ?? [])
        }
      })
      .catch(() => {
        if (isCurrent) {
          setOauthProviders([])
        }
      })

    return () => {
      isCurrent = false
    }
  }, [])

  useEffect(() => {
    if (
      !user ||
      !pendingOAuthDestination ||
      !validDestination ||
      oauthRedirectHandled.current
    ) {
      return
    }

    oauthRedirectHandled.current = true
    clearPendingSignInDestination()
    navigate(validDestination, {
      replace: true,
      state: isValidInterviewDestination(validDestination)
        ? { interviewAccess: 'authenticated' }
        : undefined,
    })
  }, [navigate, pendingOAuthDestination, user, validDestination])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    setErrorMessage('')

    try {
      if (mode === 'register') {
        await register({ name, email, password })
      } else {
        await signIn({ email, password })
      }
      clearPendingSignInDestination()
      navigate(destination, {
        replace: true,
        state: interviewDestination
          ? { interviewAccess: 'authenticated' }
          : undefined,
      })
    } catch (error) {
      setErrorMessage(error.message)
      setIsSubmitting(false)
    }
  }

  if (user) {
    return (
      <section className="signin-page">
        <div className="signin-card signin-card--account">
          <span className="signin-avatar" aria-hidden="true">
            {user.name.charAt(0)}
          </span>
          <p className="signin-kicker">Signed in</p>
          <h2>{user.name}</h2>
          <p className="signin-description">
            Your interview feedback will be saved to this account.
          </p>
          <div className="signin-account-actions">
            <button
              className="signin-primary-button"
              type="button"
              onClick={() =>
                navigate(signedInDestination, {
                  replace: Boolean(validDestination),
                  state: interviewDestination
                    ? { interviewAccess: 'authenticated' }
                    : undefined,
                })
              }
            >
              {interviewDestination
                ? 'Continue to interview'
                : validDestination === '/submissions'
                  ? 'View submissions'
                  : 'Start practicing'}
              <span aria-hidden="true">→</span>
            </button>
            <button className="signin-text-button" type="button" onClick={signOut}>
              Sign out
            </button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="signin-page" aria-labelledby="signin-title">
      <div className="signin-card">
        <header className="signin-heading">
          <p className="signin-kicker">Your TraceRound account</p>
          <h2 id="signin-title">Sign in to save your progress.</h2>
          <p className="signin-description">
            Keep interview feedback and revisit completed sessions from your
            Submissions page.
          </p>
        </header>

        <form className="signin-form" onSubmit={handleSubmit}>
          {mode === 'register' && (
            <label>
              <span>Name</span>
              <input
                type="text"
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                maxLength="120"
              />
            </label>
          )}
          <label>
            <span>Email</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label>
            <span>Password</span>
            <input
              type="password"
              autoComplete={
                mode === 'register' ? 'new-password' : 'current-password'
              }
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={mode === 'register' ? 10 : undefined}
              required
            />
          </label>

          {errorMessage && (
            <p className="signin-error" role="alert">{errorMessage}</p>
          )}

          <button
            className="signin-primary-button"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? mode === 'register' ? 'Creating account...' : 'Signing in...'
              : mode === 'register' ? 'Create account' : 'Sign in'}
            {!isSubmitting && <span aria-hidden="true">→</span>}
          </button>
        </form>

        <button
          className="signin-mode-button"
          type="button"
          onClick={() => {
            setMode((current) =>
              current === 'signin' ? 'register' : 'signin'
            )
            setErrorMessage('')
          }}
        >
          {mode === 'signin'
            ? 'New to TraceRound? Create an account'
            : 'Already have an account? Sign in'}
        </button>

        <div className="signin-divider">
          <span>Or continue with</span>
        </div>

        <div className="social-signin-list">
          {socialProviders.map(({ id, name, Icon }) => {
            const enabled = oauthProviders.includes(id)
            return (
            <button
              type="button"
              disabled={!enabled}
              onClick={() => {
                rememberPendingSignInDestination(validDestination)
                signInWithProvider(id)
              }}
              aria-describedby="social-signin-notice"
              key={id}
            >
              <Icon aria-hidden="true" />
              <span>{name}</span>
              <small>{enabled ? 'Continue' : 'Setup required'}</small>
            </button>
            )
          })}
        </div>

        <p className="social-signin-notice" id="social-signin-notice">
          OAuth buttons become active when their client IDs and secrets are
          configured in the backend.
        </p>

        <div className="temporary-auth-note">
          <strong>Secure backend authentication</strong>
          <p>
            Passwords are hashed by Spring Security and the browser receives
            only an HttpOnly session cookie.
          </p>
        </div>
      </div>
    </section>
  )
}

export default Signin
