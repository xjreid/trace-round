import { useState } from 'react'
import './ActiveProblem.css'

function ProblemBrief({ problem }) {
  return (
    <article className="problem-panel problem-panel--details">
      <div className="problem-panel__toolbar problem-brief-toolbar">
        <div>
          <span className="toolbar-kicker">Interview prompt</span>
          <span className="toolbar-status">
            <span aria-hidden="true" />
            Discussion active
          </span>
        </div>
      </div>

      <div className="problem-details">
        <p className="problem-details__eyebrow">Problem brief</p>
        <h2 className="problem-details__title">{problem.title}</h2>

        <div className="problem-details__metadata">
          <span className="problem-details__category">{problem.category}</span>
          <span className={`difficulty ${problem.difficulty.toLowerCase()}`}>
            {problem.difficulty}
          </span>
        </div>

        <div className="problem-details__description">
          <p>{problem.desc}</p>
        </div>
      </div>
    </article>
  )
}

function ProblemDiscussion({
  problem,
  messages,
  onSendMessage,
  isInterviewerResponding,
}) {
  const [draft, setDraft] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    const message = draft.trim()

    if (!message || isInterviewerResponding) {
      return
    }

    setDraft('')
    await onSendMessage(message)
  }

  return (
    <div className="problem-workspace problem-workspace--discussion">
      <ProblemBrief problem={problem} />

      <section className="problem-panel discussion-panel" aria-label="AI interviewer chat">
        <div className="problem-panel__toolbar discussion-toolbar">
          <div>
            <span className="toolbar-kicker">AI interviewer</span>
            <span className="toolbar-status">
              <span aria-hidden="true" />
              Online
            </span>
          </div>
          <span className="discussion-stage-label">Approach &amp; clarification</span>
        </div>

        <div className="discussion-messages" aria-live="polite">
          {messages.map((message) => (
            <article
              className={`discussion-message discussion-message--${message.role}`}
              key={message.id}
            >
              <span className="discussion-message__author">
                {message.role === 'interviewer' ? 'Interviewer' : 'You'}
              </span>
              <p>{message.content}</p>
            </article>
          ))}

          {isInterviewerResponding && (
            <div className="discussion-typing">
              <span />
              <span />
              <span />
              <p>Interviewer is responding</p>
            </div>
          )}
        </div>

        <form className="discussion-composer" onSubmit={handleSubmit}>
          <label htmlFor="interview-message">Message the interviewer</label>
          <textarea
            id="interview-message"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Explain your approach or ask a clarifying question..."
            rows="3"
          />
          <div>
            <span>Discussion responses are temporary development data.</span>
            <button
              type="submit"
              disabled={!draft.trim() || isInterviewerResponding}
            >
              Send message
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

export default ProblemDiscussion
