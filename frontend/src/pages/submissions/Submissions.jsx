import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/authContext'
import {
  getUserSubmissionFeedback,
  getUserSubmissions,
} from '../backend-functions-to-be-implemented/backendFunctions'
import FeedbackQuestionSections from './FeedbackQuestionSections'
import '../problems/Feedback.css'
import './Submissions.css'

const dashboardMetrics = [
  { key: 'communication', label: 'Communication' },
  { key: 'approach', label: 'Approach' },
  { key: 'codeQuality', label: 'Code quality' },
]

function formatInterviewDate(date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date))
}

function formatScore(score) {
  return Number(score).toFixed(1)
}

function getScoreTone(score) {
  if (score >= 8.5) {
    return 'excellent'
  }

  if (score >= 7) {
    return 'strong'
  }

  if (score >= 5) {
    return 'developing'
  }

  return 'needs-improvement'
}

function Submissions() {
  const navigate = useNavigate()
  const { user, isAuthLoading } = useAuth()
  const [submissionsData, setSubmissionsData] = useState(null)
  const [status, setStatus] = useState('loading')
  const [expandedSubmissionId, setExpandedSubmissionId] = useState(null)
  const [feedbackBySubmissionId, setFeedbackBySubmissionId] = useState({})
  const [feedbackStatus, setFeedbackStatus] = useState({})
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  useEffect(() => {
    if (isAuthLoading || !user) {
      return undefined
    }

    let isCurrentRequest = true

    async function loadSubmissions() {
      try {
        const result = await getUserSubmissions()

        if (isCurrentRequest) {
          setSubmissionsData(result)
          setStatus('complete')
        }
      } catch {
        if (isCurrentRequest) {
          setStatus('error')
        }
      }
    }

    loadSubmissions()

    return () => {
      isCurrentRequest = false
    }
  }, [isAuthLoading, user])

  const toggleSubmission = async (submissionId) => {
    if (expandedSubmissionId === submissionId) {
      setExpandedSubmissionId(null)
      return
    }

    setExpandedSubmissionId(submissionId)

    if (feedbackBySubmissionId[submissionId]) {
      return
    }

    setFeedbackStatus((current) => ({
      ...current,
      [submissionId]: 'loading',
    }))

    try {
      const feedback = await getUserSubmissionFeedback(submissionId)
      setFeedbackBySubmissionId((current) => ({
        ...current,
        [submissionId]: feedback,
      }))
      setFeedbackStatus((current) => ({
        ...current,
        [submissionId]: 'complete',
      }))
    } catch {
      setFeedbackStatus((current) => ({
        ...current,
        [submissionId]: 'error',
      }))
    }
  }

  const loadMoreSubmissions = async () => {
    const nextCursor = submissionsData?.pagination.nextCursor

    if (!nextCursor || isLoadingMore) {
      return
    }

    setIsLoadingMore(true)

    try {
      const nextPage = await getUserSubmissions({ cursor: nextCursor })
      setSubmissionsData((current) => ({
        metrics: nextPage.metrics,
        submissions: [
          ...current.submissions,
          ...nextPage.submissions,
        ],
        pagination: nextPage.pagination,
      }))
    } finally {
      setIsLoadingMore(false)
    }
  }

  if (isAuthLoading) {
    return (
      <section className="submissions-state-page">
        <div className="submissions-state-card" role="status">
          <span className="submissions-state-card__mark" aria-hidden="true">
            •••
          </span>
          <p>Submission history</p>
          <h2>Checking your account...</h2>
        </div>
      </section>
    )
  }

  if (!user) {
    return (
      <section
        className="submissions-access-page"
        aria-labelledby="submissions-access-title"
      >
        <div className="submissions-access-card">
          <span className="submissions-access-icon" aria-hidden="true">
            ↗
          </span>
          <p className="submissions-kicker">Your interview history</p>
          <h2 id="submissions-access-title">
            Sign in to view your submissions.
          </h2>
          <p className="submissions-access-description">
            Your saved interview feedback is connected to your account. Sign in
            to review previous sessions, compare scores, and track your
            progress.
          </p>
          <div className="submissions-access-actions">
            <button
              className="submissions-primary-button"
              type="button"
              onClick={() =>
                navigate('/signin?returnTo=%2Fsubmissions')
              }
            >
              Go to sign in
              <span aria-hidden="true">→</span>
            </button>
            <Link className="submissions-secondary-button" to="/">
              Back to home
            </Link>
          </div>
          <p className="submissions-development-note">
            Demo sign-in uses TraceRound&apos;s temporary local account until
            backend authentication is connected.
          </p>
        </div>
      </section>
    )
  }

  if (status === 'loading') {
    return (
      <section className="submissions-state-page">
        <div className="submissions-state-card" role="status">
          <span className="submissions-state-card__mark" aria-hidden="true">
            •••
          </span>
          <p>Submission history</p>
          <h2>Loading your interviews...</h2>
        </div>
      </section>
    )
  }

  if (status === 'error' || !submissionsData) {
    return (
      <section className="submissions-state-page">
        <div className="submissions-state-card">
          <span className="submissions-state-card__mark" aria-hidden="true">
            !
          </span>
          <p>Submission history</p>
          <h2>Unable to load submissions</h2>
          <span>Please refresh the page and try again.</span>
        </div>
      </section>
    )
  }

  return (
    <section className="submissions-page" aria-labelledby="submissions-title">
      <header className="submissions-page__header">
        <div>
          <p className="submissions-kicker">Performance history</p>
          <h2 id="submissions-title">Your submissions</h2>
          <p>
            Review completed interviews and revisit the feedback from each
            session.
          </p>
        </div>
        <span className="submissions-user">
          <span aria-hidden="true">{user.name.charAt(0)}</span>
          {user.name}
        </span>
      </header>

      <section
        className="submissions-dashboard"
        aria-label="Interview performance overview"
      >
        {dashboardMetrics.map((metric) => {
          const averageScore =
            submissionsData.metrics.averages[metric.key]
          const scoreTone = getScoreTone(averageScore)

          return (
            <article
              className={`submissions-metric submissions-metric--${scoreTone}`}
              key={metric.key}
            >
              <div>
                <p>Average {metric.label}</p>
                <strong>
                  {formatScore(averageScore)}
                  <small>/10</small>
                </strong>
              </div>
            </article>
          )
        })}
      </section>

      <section
        className="submission-history"
        aria-labelledby="submission-history-title"
      >
        <header className="submission-history__header">
          <div>
            <p className="submissions-kicker">Saved feedback</p>
            <h3 id="submission-history-title">Completed interviews</h3>
          </div>
          <span>{submissionsData.metrics.totalInterviews} total</span>
        </header>

        {submissionsData.submissions.length === 0 ? (
          <div className="submission-history__empty">
            <h4>No saved interviews yet</h4>
            <p>Complete a signed-in interview to see its feedback here.</p>
            <Link to="/problems">Choose a problem</Link>
          </div>
        ) : (
          <div className="submission-accordion">
            {submissionsData.submissions.map((submission) => {
              const isExpanded =
                expandedSubmissionId === submission.id
              const scoreTone = getScoreTone(submission.overallScore)
              const panelId = `submission-panel-${submission.id}`

              return (
                <article
                  className={`submission-entry ${
                    isExpanded ? 'submission-entry--expanded' : ''
                  }`}
                  key={submission.id}
                >
                  <button
                    className="submission-entry__toggle"
                    type="button"
                    aria-expanded={isExpanded}
                    aria-controls={panelId}
                    onClick={() => toggleSubmission(submission.id)}
                  >
                    <span className="submission-entry__date">
                      <small>Interview date</small>
                      {formatInterviewDate(submission.interviewDate)}
                    </span>
                    <span className="submission-entry__details">
                      <span>
                        {submission.questionCount}{' '}
                        {submission.questionCount === 1
                          ? 'question'
                          : 'questions'}
                      </span>
                      <span>{submission.questionTitles.join(' · ')}</span>
                    </span>
                    <span
                      className={`submission-entry__score submission-entry__score--${scoreTone}`}
                    >
                      {formatScore(submission.overallScore)}
                      <small>/10</small>
                    </span>
                    <span
                      className="submission-entry__chevron"
                      aria-hidden="true"
                    >
                      ↓
                    </span>
                  </button>

                  {isExpanded && (
                    <div
                      className="submission-entry__panel"
                      id={panelId}
                    >
                      {feedbackStatus[submission.id] === 'loading' && (
                        <div
                          className="submission-feedback-state"
                          role="status"
                        >
                          Loading interview feedback...
                        </div>
                      )}
                      {feedbackStatus[submission.id] === 'error' && (
                        <div className="submission-feedback-state submission-feedback-state--error">
                          This interview&apos;s feedback could not be loaded.
                        </div>
                      )}
                      {feedbackBySubmissionId[submission.id] && (
                        <div className="submission-feedback">
                          <div className="submission-feedback__overview">
                            <h4>Session summary</h4>
                            <p>
                              {
                                feedbackBySubmissionId[submission.id]
                                  .overallSummary
                              }
                            </p>
                          </div>
                          <FeedbackQuestionSections
                            feedback={
                              feedbackBySubmissionId[submission.id]
                            }
                          />
                        </div>
                      )}
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        )}

        {submissionsData.pagination.nextCursor && (
          <button
            className="submission-load-more"
            type="button"
            onClick={loadMoreSubmissions}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? 'Loading...' : 'Load more interviews'}
          </button>
        )}
      </section>
    </section>
  )
}

export default Submissions
