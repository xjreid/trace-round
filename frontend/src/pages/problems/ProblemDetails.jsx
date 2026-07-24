import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { problems } from '../../data/problems'
import {
  runCodeSubmission,
  sendInterviewChatMessage,
  startProblemSession,
  submitInterviewSession,
} from '../backend-functions-to-be-implemented/backendFunctions'
import ProblemDiscussion from './ProblemDiscussion'
import ProblemWorkspace from './ProblemWorkspace'
import InterviewEnding from './InterviewEnding'
import InterviewStageHeader from './InterviewStageHeader'
import { languages } from './problemEditorConfig'

const FALLBACK_DISCUSSION_SECONDS = 5 * 60
const FALLBACK_CODING_SECONDS = 20 * 60

function ProblemDetails() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const problem = problems.find((item) => item.slug === slug)
  const [session, setSession] = useState(null)
  const [stage, setStage] = useState('loading')
  const [secondsRemaining, setSecondsRemaining] = useState(0)
  const [messages, setMessages] = useState([])
  const [isInterviewerResponding, setIsInterviewerResponding] = useState(false)
  const [language, setLanguage] = useState(languages[0])
  const [code, setCode] = useState('')
  const [runResult, setRunResult] = useState(null)
  const [isRunning, setIsRunning] = useState(false)
  const [submission, setSubmission] = useState(null)
  const submissionStarted = useRef(false)
  const interviewAnswers = useRef({ messages, language, code })

  useEffect(() => {
    interviewAnswers.current = { messages, language, code }
  }, [code, language, messages])

  useEffect(() => {
    if (!problem) {
      return undefined
    }

    let isCurrent = true

    async function createSession() {
      const newSession = await startProblemSession(problem)

      if (isCurrent) {
        setSession(newSession)
        setMessages(newSession.initialMessages)
        setSecondsRemaining(
          newSession.durations.discussion ?? FALLBACK_DISCUSSION_SECONDS,
        )
        setStage('discussion')
      }
    }

    createSession()

    return () => {
      isCurrent = false
    }
  }, [problem])

  const beginCoding = useCallback(() => {
    setStage('coding')
    setSecondsRemaining(
      session?.durations.coding ?? FALLBACK_CODING_SECONDS,
    )
  }, [session])

  const finishInterview = useCallback(
    async (endedBy) => {
      if (!session || submissionStarted.current) {
        return
      }

      submissionStarted.current = true
      setStage('submitting')

      const completedSubmission = await submitInterviewSession({
        sessionId: session.id,
        answers: {
          problem,
          discussionMessages: interviewAnswers.current.messages,
          language: interviewAnswers.current.language,
          code: interviewAnswers.current.code,
          endedBy,
        },
      })

      setSubmission(completedSubmission)
      setStage('ended')
    },
    [problem, session],
  )

  useEffect(() => {
    if (stage !== 'discussion' && stage !== 'coding') {
      return undefined
    }

    const timer = window.setInterval(() => {
      setSecondsRemaining((current) => {
        if (current <= 1) {
          window.clearInterval(timer)

          window.setTimeout(() => {
            if (stage === 'discussion') {
              beginCoding()
            } else {
              finishInterview('timer')
            }
          }, 0)

          return 0
        }

        return current - 1
      })
    }, 1000)

    return () => window.clearInterval(timer)
  }, [beginCoding, finishInterview, stage])

  const handleSendMessage = async (content) => {
    const userMessage = {
      id: `user-message-${Date.now()}`,
      role: 'user',
      content,
    }
    const updatedConversation = [...messages, userMessage]

    setMessages(updatedConversation)
    setIsInterviewerResponding(true)

    const interviewerMessage = await sendInterviewChatMessage({
      sessionId: session.id,
      problem,
      message: content,
      conversation: updatedConversation,
    })

    setMessages((current) => [...current, interviewerMessage])
    setIsInterviewerResponding(false)
  }

  const handleRun = async () => {
    setIsRunning(true)
    const result = await runCodeSubmission({
      sessionId: session.id,
      problem,
      language,
      code,
    })
    setRunResult(result)
    setIsRunning(false)
  }

  if (!problem) {
    return (
      <section className="problem-not-found">
        <p className="problem-not-found__eyebrow">404</p>
        <h2>Problem not found</h2>
        <p>The requested coding problem does not exist.</p>
      </section>
    )
  }

  if (stage === 'loading') {
    return (
      <section className="active-problem practice-state">
        <p className="practice-state__eyebrow">Single interview</p>
        <h2>Preparing your interview...</h2>
      </section>
    )
  }

  if (stage === 'submitting' || stage === 'ended') {
    return (
      <InterviewEnding
        stage={stage}
        submission={submission}
        onViewFeedback={() => navigate(`/feedback/${submission.feedbackId}`)}
      />
    )
  }

  return (
    <section className="active-problem active-problem--single-interview">
      {stage === 'discussion' ? (
        <>
          <InterviewStageHeader
            stageNumber="1"
            stageName="Discussion"
            secondsRemaining={secondsRemaining}
            onProceed={beginCoding}
          />
          <ProblemDiscussion
            problem={problem}
            messages={messages}
            onSendMessage={handleSendMessage}
            isInterviewerResponding={isInterviewerResponding}
          />
        </>
      ) : (
        <>
          <InterviewStageHeader
            stageNumber="2"
            stageName="Coding"
            secondsRemaining={secondsRemaining}
          />
          <ProblemWorkspace
            className="problem-workspace--timed"
            problem={problem}
            language={language}
            code={code}
            onLanguageChange={setLanguage}
            onCodeChange={setCode}
            onStart={() => finishInterview('submitted')}
            onRun={handleRun}
            actionLabel="Submit interview"
            actionVariant="submit"
            runResult={runResult}
            isRunning={isRunning}
          />
        </>
      )}
    </section>
  )
}

export default ProblemDetails
