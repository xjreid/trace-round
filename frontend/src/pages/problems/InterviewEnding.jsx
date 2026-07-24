import './ActiveProblem.css'

function InterviewEnding({ stage, submission, onViewFeedback, questionCount = 1 }) {
  const isEnded = stage === 'ended'
  const answerLabel = questionCount === 1 ? 'Your discussion transcript and final code were' : `All ${questionCount} discussion transcripts and code solutions were`

  return (
    <section className="interview-ending-page">
      <div className="interview-ending-card">
        <span className="interview-ending-mark" aria-hidden="true">
          {isEnded ? '✓' : '•••'}
        </span>
        <p className="practice-state__eyebrow">
          {isEnded ? 'Interview complete' : 'Submitting interview'}
        </p>
        <h2>
          {isEnded
            ? 'Your interview has ended.'
            : 'Sending your work for review...'}
        </h2>
        <p>
          {isEnded
            ? `${answerLabel} submitted together for feedback.`
            : 'TraceRound is packaging your discussions and code into one interview submission.'}
        </p>
        {isEnded && submission && (
          <button
            className="interview-feedback-button"
            type="button"
            onClick={onViewFeedback}
          >
            View feedback
            <span aria-hidden="true">→</span>
          </button>
        )}
      </div>
    </section>
  )
}

export default InterviewEnding
