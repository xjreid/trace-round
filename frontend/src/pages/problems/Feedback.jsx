import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getInterviewFeedback } from '../backend-functions-to-be-implemented/backendFunctions'
import './Feedback.css'

const scoreLabels = {
  communication: 'Communication',
  approach: 'Approach',
  codeQuality: 'Code quality',
}

function formatInterviewDate(date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date))
}

function getScoreTone(score) {
  if (score >= 9) {
    return 'excellent'
  }

  if (score >= 7) {
    return 'strong'
  }

  return 'developing'
}

function calculateOverallScore(scores) {
  const scoreValues = Object.values(scores).filter(Number.isFinite)

  if (scoreValues.length === 0) {
    return 0
  }

  return (
    scoreValues.reduce((total, score) => total + score, 0) /
    scoreValues.length
  )
}

function getOverallScoreTone(score) {
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

function FeedbackScore({ label, score }) {
  return (
    <div className={`feedback-score feedback-score--${getScoreTone(score)}`}>
      <div className="feedback-score__heading">
        <span>{label}</span>
        <strong>
          {score}
          <small>/10</small>
        </strong>
      </div>
      <div
        className="feedback-score__track"
        role="meter"
        aria-label={`${label}: ${score} out of 10`}
        aria-valuemin="0"
        aria-valuemax="10"
        aria-valuenow={score}
      >
        <span style={{ width: `${score * 10}%` }} />
      </div>
    </div>
  )
}

function Feedback() {
  const { feedbackId } = useParams()
  const [feedback, setFeedback] = useState(null)
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    let isCurrentRequest = true

    async function loadFeedback() {
      try {
        const completedFeedback = await getInterviewFeedback(feedbackId)

        if (isCurrentRequest) {
          setFeedback(completedFeedback)
          setStatus('complete')
        }
      } catch {
        if (isCurrentRequest) {
          setStatus('error')
        }
      }
    }

    loadFeedback()

    return () => {
      isCurrentRequest = false
    }
  }, [feedbackId])

  if (status === 'loading') {
    return (
      <section className="feedback-page feedback-page--state">
        <div className="feedback-state-card" role="status">
          <span className="feedback-state-card__mark" aria-hidden="true">
            •••
          </span>
          <p>Interview feedback</p>
          <h2>Preparing your review...</h2>
        </div>
      </section>
    )
  }

  if (status === 'error' || !feedback) {
    return (
      <section className="feedback-page feedback-page--state">
        <div className="feedback-state-card">
          <span className="feedback-state-card__mark" aria-hidden="true">
            !
          </span>
          <p>Interview feedback</p>
          <h2>Feedback is unavailable</h2>
          <span>Please return to your submissions and try again.</span>
        </div>
      </section>
    )
  }

  return (
    <section className="feedback-page" aria-labelledby="feedback-title">
      <header className="feedback-page__header">
        <div>
          <p className="feedback-page__eyebrow">Interview feedback</p>
          <h2 id="feedback-title">Your interview review</h2>
        </div>
        <div className="feedback-page__metadata">
          <span>{formatInterviewDate(feedback.interviewDate)}</span>
          <span>
            {feedback.questionCount}{' '}
            {feedback.questionCount === 1 ? 'question' : 'questions'}
          </span>
        </div>
      </header>

      <article className="feedback-overview">
        <div>
          <p className="feedback-section-label">Session summary</p>
          <p className="feedback-overview__copy">
            {feedback.overallSummary}
          </p>
        </div>
      </article>

      <div className="feedback-question-list">
        {feedback.questions.map((question, index) => {
          const overallScore = calculateOverallScore(question.scores)
          const overallScoreTone = getOverallScoreTone(overallScore)

          return (
            <article className="feedback-question" key={question.id}>
              <header
                className={`feedback-question__header feedback-question__header--${overallScoreTone}`}
              >
                <div className="feedback-question__title-row">
                  <h3>{question.title}</h3>
                  <span
                    className="feedback-question__overall-score"
                    aria-label={`Overall score: ${overallScore.toFixed(1)} out of 10`}
                  >
                    {overallScore.toFixed(1)}
                    <small>/10</small>
                  </span>
                </div>
                <span className="feedback-question__index" aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
              </header>

              <div className="feedback-question__body">
                <section
                  className="feedback-summary"
                  aria-labelledby={`summary-${question.id}`}
                >
                  <h4
                    className="feedback-block-label"
                    id={`summary-${question.id}`}
                  >
                    Summary
                  </h4>
                  <p>{question.summary}</p>
                </section>

                <section
                  className="feedback-scores"
                  aria-labelledby={`scores-${question.id}`}
                >
                  <div className="feedback-block-heading">
                    <h4
                      className="feedback-block-label"
                      id={`scores-${question.id}`}
                    >
                      Performance scores
                    </h4>
                  </div>
                  <div className="feedback-score-grid">
                    {Object.entries(scoreLabels).map(([scoreKey, label]) => (
                      <FeedbackScore
                        label={label}
                        score={question.scores[scoreKey]}
                        key={scoreKey}
                      />
                    ))}
                  </div>
                </section>

                <section
                  className="feedback-recommendations"
                  aria-labelledby={`recommendations-${question.id}`}
                >
                  <div className="feedback-block-heading">
                    <h4
                      className="feedback-block-label"
                      id={`recommendations-${question.id}`}
                    >
                      Recommendations
                    </h4>
                  </div>
                  <ol>
                    {question.recommendations.map(
                      (recommendation, itemIndex) => (
                        <li key={recommendation}>
                          <span aria-hidden="true">
                            {String(itemIndex + 1).padStart(2, '0')}
                          </span>
                          <p>{recommendation}</p>
                        </li>
                      ),
                    )}
                  </ol>
                </section>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

export default Feedback
