import './ActiveProblem.css'

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function InterviewStageHeader({
  stageNumber,
  stageName,
  secondsRemaining,
  onProceed,
  questionNumber,
  totalQuestions,
}) {
  const isUrgent = secondsRemaining <= 60
  const hasQuestionProgress = questionNumber && totalQuestions

  return (
    <header className="interview-stage-header">
      <div className={`interview-timer ${isUrgent ? 'interview-timer--urgent' : ''}`}>
        <span className="interview-timer__label">Time remaining</span>
        <strong>{formatTime(secondsRemaining)}</strong>
      </div>

      <div className="interview-stage-heading">
        <span>
          {hasQuestionProgress && (
            <>Question {questionNumber} of {totalQuestions} · </>
          )}
          Stage {stageNumber} of 2
        </span>
        <strong>{stageName}</strong>
      </div>

      {onProceed ? (
        <button className="stage-proceed-button" type="button" onClick={onProceed}>
          Move to coding
          <span aria-hidden="true">→</span>
        </button>
      ) : (
        <span className="stage-submit-hint">Submit from the problem panel</span>
      )}
    </header>
  )
}

export default InterviewStageHeader
