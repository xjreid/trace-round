import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { FaGithub, FaGoogle, FaMicrosoft } from 'react-icons/fa6'
import { useAuth } from '../context/authContext'
import { isValidInterviewDestination } from './problems/interviewNavigation'
import './Signin.css'

const socialProviders = [
  { name: 'Google', Icon: FaGoogle },
  { name: 'GitHub', Icon: FaGithub },
  { name: 'Microsoft', Icon: FaMicrosoft },
]

function Signin() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, signInAsDemo, signOut } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const requestedDestination = searchParams.get('returnTo') ?? ''
  const interviewDestination = isValidInterviewDestination(requestedDestination)
    ? requestedDestination
    : null
  const destination = interviewDestination ?? '/'

  const handleDemoSignIn = async () => {
    setIsSubmitting(true)
    await signInAsDemo()
    navigate(destination, {
      replace: true,
      state: interviewDestination
        ? { interviewAccess: 'authenticated' }
        : undefined,
    })
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
            You are using TraceRound&apos;s temporary development account.
          </p>
          <div className="signin-account-actions">
            <button
              className="signin-primary-button"
              type="button"
              onClick={() =>
                navigate(interviewDestination ?? '/problems', {
                  replace: Boolean(interviewDestination),
                  state: interviewDestination
                    ? { interviewAccess: 'authenticated' }
                    : undefined,
                })
              }
            >
              {interviewDestination ? 'Continue to interview' : 'Start practicing'}
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

        <button
          className="signin-primary-button"
          type="button"
          onClick={handleDemoSignIn}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Signing in...' : 'Continue as the demo user'}
          {!isSubmitting && <span aria-hidden="true">→</span>}
        </button>

        <div className="signin-divider">
          <span>Or continue with</span>
        </div>

        <div className="social-signin-list">
          {socialProviders.map(({ name, Icon }) => (
            <button
              type="button"
              disabled
              aria-describedby="social-signin-notice"
              key={name}
            >
              <Icon aria-hidden="true" />
              <span>{name}</span>
              <small>Setup required</small>
            </button>
          ))}
        </div>

        <p className="social-signin-notice" id="social-signin-notice">
          Google, GitHub, and Microsoft sign-in will become available after an
          OAuth backend or authentication provider is connected.
        </p>

        <div className="temporary-auth-note">
          <strong>Development mode</strong>
          <p>
            Demo sign-in is stored only in this browser and is not secure
            authentication.
          </p>
        </div>
      </div>
    </section>
  )
}

export default Signin
