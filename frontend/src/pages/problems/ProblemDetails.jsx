import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  getProblem,
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
  const [problem, setProblem] = useState(null)
  const [session, setSession] = useState(null)
  const [stage, setStage] = useState('loading')
  const [secondsRemaining, setSecondsRemaining] = useState(0)
  const [messages, setMessages] = useState([])
  const [isInterviewerResponding, setIsInterviewerResponding] = useState(false)
  const [language, setLanguage] = useState(languages[0])
  const [codeByLanguage, setCodeByLanguage] = useState({})
  const code = codeByLanguage[language] ?? ''
  const [runResult, setRunResult] = useState(null)
  const [isRunning, setIsRunning] = useState(false)
  const [submission, setSubmission] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const submissionStarted = useRef(false)
  const interviewAnswers = useRef({ messages, language, code })

  useEffect(() => {
    let isCurrent = true
    getProblem(slug)
      .then((loadedProblem) => {
        if (isCurrent) {
          setProblem(loadedProblem)
          setCodeByLanguage(loadedProblem.starterCode ?? {})
        }
      })
      .catch((error) => {
        if (isCurrent) {
          setErrorMessage(error.message)
          setStage('error')
        }
      })
    return () => {
      isCurrent = false
    }
  }, [slug])

  useEffect(() => {
    interviewAnswers.current = { messages, language, code }
  }, [code, language, messages])

  useEffect(() => {
    if (!problem) {
      return undefined
    }

    let isCurrent = true

    async function createSession() {
      try {
        const newSession = await startProblemSession(problem)

        if (isCurrent) {
          setSession(newSession)
          setMessages(newSession.initialMessages)
          setSecondsRemaining(
            newSession.durations.discussion ?? FALLBACK_DISCUSSION_SECONDS,
          )
          setStage('discussion')
        }
      } catch (error) {
        if (isCurrent) {
          setErrorMessage(error.message)
          setStage('error')
        }
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

      try {
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
      } catch (error) {
        submissionStarted.current = false
        setErrorMessage(error.message)
        setStage('error')
      }
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

    setErrorMessage('')
    setMessages(updatedConversation)
    setIsInterviewerResponding(true)

    try {
      const interviewerMessage = await sendInterviewChatMessage({
        sessionId: session.id,
        problem,
        message: content,
        conversation: updatedConversation,
      })

      setMessages((current) => [...current, interviewerMessage])
    } catch (error) {
      setMessages((current) =>
        current.filter((message) => message.id !== userMessage.id),
      )
      setErrorMessage(error.message)
    } finally {
      setIsInterviewerResponding(false)
    }
  }

  const handleRun = async () => {
    setIsRunning(true)
    try {
      const result = await runCodeSubmission({
        sessionId: session.id,
        problem,
        language,
        code,
      })
      setRunResult(result)
    } catch (error) {
      setRunResult({
        status: 'error',
        summary: 'Unable to run code',
        output: error.message,
        passedTests: 0,
        totalTests: 0,
      })
    } finally {
      setIsRunning(false)
    }
  }

  if (stage === 'loading') {
    return (
      <section className="active-problem practice-state">
        <p className="practice-state__eyebrow">Single interview</p>
        <h2>Preparing your interview...</h2>
      </section>
    )
  }

  if (stage === 'error') {
    return (
      <section className="active-problem practice-state">
        <p className="practice-state__eyebrow">Single interview</p>
        <h2>Unable to continue this interview</h2>
        <p>{errorMessage || 'Please return to the problem list and try again.'}</p>
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
            errorMessage={errorMessage}
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
            onCodeChange={(updatedCode) =>
              setCodeByLanguage((current) => ({
                ...current,
                [language]: updatedCode,
              }))
            }
            onStart={() => finishInterview('submitted')}
            onRun={handleRun}
            actionLabel="Submit interview"
            actionVariant="submit"
            runResult={runResult}
            onCloseRunResult={() => setRunResult(null)}
            isRunning={isRunning}
          />
        </>
      )}
    </section>
  )
}

export default ProblemDetails
