const scoreLabels = {
  communication: 'Communication',
  approach: 'Approach',
  codeQuality: 'Code quality',
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

function FeedbackQuestionSections({ feedback }) {
  return (
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
                <ul>
                  {question.recommendations.map((recommendation, itemIndex) => (
                    <li key={`${question.id}-${itemIndex}`}>
                      {recommendation}
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </article>
        )
      })}
    </div>
  )
}

export default FeedbackQuestionSections
