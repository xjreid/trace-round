import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/authContext'
import {
  createInterviewSignInPath,
  isValidInterviewDestination,
} from './interviewNavigation'
import './InterviewAccess.css'

function InterviewAccess() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, isAuthLoading } = useAuth()
  const destination = searchParams.get('returnTo') ?? ''

  if (!isValidInterviewDestination(destination)) {
    return <Navigate to="/problems" replace />
  }

  const continueToInterview = (accessMode) => {
    navigate(destination, {
      replace: true,
      state: { interviewAccess: accessMode },
    })
  }

  if (isAuthLoading) {
    return (
      <section className="interview-access-page">
        <div className="interview-access-card interview-access-card--loading">
          <span className="access-loading-dot" aria-hidden="true" />
          <p>Checking your account...</p>
        </div>
      </section>
    )
  }

  if (user) {
    return (
      <section className="interview-access-page" aria-labelledby="access-title">
        <div className="interview-access-card interview-access-card--signed-in">
          <span className="access-avatar" aria-hidden="true">
            {user.name.charAt(0)}
          </span>
          <p className="access-kicker">Ready to begin</p>
          <h2 id="access-title">Your feedback can be saved.</h2>
          <p className="access-description">
            You&apos;re signed in as {user.name}. Complete this interview and
            your feedback can be connected to your account.
          </p>
          <button
            className="access-primary-button"
            type="button"
            onClick={() => continueToInterview('authenticated')}
          >
            Continue to interview
            <span aria-hidden="true">→</span>
          </button>
          <Link className="access-back-link" to="/problems">
            Back to problems
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="interview-access-page" aria-labelledby="access-title">
      <div className="interview-access-card">
        <header className="interview-access-heading">
          <p className="access-kicker">Before you begin</p>
          <h2 id="access-title">Keep the feedback from this session.</h2>
          <p className="access-description">
            Sign in before starting and your interview feedback can be saved to
            your Submissions page. You can also continue as a guest without
            saving it.
          </p>
        </header>

        <div className="access-options">
          <article className="access-option access-option--recommended">
            <span className="access-option-label">Recommended</span>
            <div className="access-option-icon" aria-hidden="true">01</div>
            <h3>Sign in and save</h3>
            <p>
              Connect this session to your account and build a history of your
              interview feedback.
            </p>
            <ul>
              <li>Review feedback again later</li>
              <li>Keep sessions in Submissions</li>
              <li>Track progress over time</li>
            </ul>
            <button
              className="access-primary-button"
              type="button"
              onClick={() => navigate(createInterviewSignInPath(destination))}
            >
              Go to sign in
              <span aria-hidden="true">→</span>
            </button>
          </article>

          <article className="access-option">
            <span className="access-option-label">No account needed</span>
            <div className="access-option-icon" aria-hidden="true">02</div>
            <h3>Continue as a guest</h3>
            <p>
              Start the interview without signing in. You can still review the
              feedback immediately after the session.
            </p>
            <ul>
              <li>No sign-in required</li>
              <li>Full interview experience</li>
              <li>Feedback will not be saved</li>
            </ul>
            <button
              className="access-guest-button"
              type="button"
              onClick={() => continueToInterview('guest')}
            >
              Continue as guest
              <span aria-hidden="true">→</span>
            </button>
          </article>
        </div>

        <p className="access-development-note">
          Demo sign-in currently uses TraceRound&apos;s temporary local user
          until backend authentication is connected.
        </p>
      </div>
    </section>
  )
}

export default InterviewAccess
