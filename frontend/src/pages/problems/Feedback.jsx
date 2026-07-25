import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getInterviewFeedback } from '../backend-functions-to-be-implemented/backendFunctions'
import FeedbackQuestionSections from '../submissions/FeedbackQuestionSections'
import './Feedback.css'

function formatInterviewDate(date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date))
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

      <FeedbackQuestionSections feedback={feedback} />
    </section>
  )
}

export default Feedback
