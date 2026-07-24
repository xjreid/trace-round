import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { problems } from '../../data/problems'
import {
  requestPracticeProblemSlugs,
  runCodeSubmission,
  sendInterviewChatMessage,
  startCustomPracticeSession,
  submitInterviewSession,
} from '../backend-functions-to-be-implemented/backendFunctions'
import InterviewEnding from './InterviewEnding'
import InterviewStageHeader from './InterviewStageHeader'
import ProblemDiscussion from './ProblemDiscussion'
import ProblemWorkspace from './ProblemWorkspace'
import { languages } from './problemEditorConfig'

const FALLBACK_DISCUSSION_SECONDS = 5 * 60
const FALLBACK_CODING_SECONDS = 20 * 60

function decodeCategories(input = '') {
  return input
    .split('~')
    .filter(Boolean)
    .map((category) => decodeURIComponent(category))
}

function createQuestionState(initialMessages = []) {
  return {
    messages: initialMessages,
    language: languages[0],
    code: '',
    runResult: null,
  }
}

function CustomPractice() {
  const { input, questionCount } = useParams()
  const navigate = useNavigate()
  const categories = useMemo(() => decodeCategories(input), [input])
  const requestedQuestionCount = Number.parseInt(questionCount, 10)
  const hasValidRequest =
    categories.length > 0 &&
    requestedQuestionCount >= 1 &&
    requestedQuestionCount <= 3

  const [selectedProblems, setSelectedProblems] = useState([])
  const [session, setSession] = useState(null)
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0)
  const [questionStates, setQuestionStates] = useState({})
  const [stage, setStage] = useState('loading')
  const [secondsRemaining, setSecondsRemaining] = useState(0)
  const [isInterviewerResponding, setIsInterviewerResponding] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [submission, setSubmission] = useState(null)
  const submissionStarted = useRef(false)
  const questionTransitionStarted = useRef(false)
  const questionStatesRef = useRef(questionStates)
  const completionReasons = useRef({})

  useEffect(() => {
    questionStatesRef.current = questionStates
  }, [questionStates])

  useEffect(() => {
    if (!hasValidRequest) {
      return undefined
    }

    let isCurrentRequest = true

    async function createSession() {
      try {
        const slugs = await requestPracticeProblemSlugs(
          categories,
          requestedQuestionCount,
        )
        const chosenProblems = slugs
          .map((slug) => problems.find((problem) => problem.slug === slug))
          .filter(Boolean)

        if (chosenProblems.length !== requestedQuestionCount) {
          throw new Error('The requested practice set could not be created.')
        }

        const newSession = await startCustomPracticeSession({
          selectedProblems: chosenProblems,
          categories,
          questionCount: requestedQuestionCount,
        })

        const initialQuestionStates = Object.fromEntries(
          chosenProblems.map((problem, index) => [
            problem.slug,
            createQuestionState(
              newSession.questions[index]?.initialMessages ?? [],
            ),
          ]),
        )

        if (isCurrentRequest) {
          setSelectedProblems(chosenProblems)
          setSession(newSession)
          setActiveQuestionIndex(0)
          setQuestionStates(initialQuestionStates)
          setSecondsRemaining(
            newSession.durations.discussion ??
              FALLBACK_DISCUSSION_SECONDS,
          )
          setStage('discussion')
        }
      } catch {
        if (isCurrentRequest) {
          setStage('error')
        }
      }
    }

    createSession()

    return () => {
      isCurrentRequest = false
    }
  }, [categories, hasValidRequest, requestedQuestionCount])

  const activeProblem = selectedProblems[activeQuestionIndex]
  const activeQuestionState = activeProblem
    ? questionStates[activeProblem.slug]
    : null

  const updateQuestionState = (problemSlug, updates) => {
    setQuestionStates((currentStates) => {
      const currentQuestionState =
        currentStates[problemSlug] ?? createQuestionState()
      const nextUpdates =
        typeof updates === 'function'
          ? updates(currentQuestionState)
          : updates

      return {
        ...currentStates,
        [problemSlug]: {
          ...currentQuestionState,
          ...nextUpdates,
        },
      }
    })
  }

  const beginCoding = useCallback(() => {
    setStage('coding')
    setSecondsRemaining(
      session?.durations.coding ?? FALLBACK_CODING_SECONDS,
    )
  }, [session])

  const completeQuestion = useCallback(
    async (endedBy) => {
      if (!session || questionTransitionStarted.current) {
        return
      }

      questionTransitionStarted.current = true
      const completedProblem = selectedProblems[activeQuestionIndex]

      if (completedProblem) {
        completionReasons.current[completedProblem.slug] = endedBy
      }

      const isLastQuestion =
        activeQuestionIndex === selectedProblems.length - 1

      if (!isLastQuestion) {
        setActiveQuestionIndex((currentIndex) => currentIndex + 1)
        setIsInterviewerResponding(false)
        setIsRunning(false)
        setSecondsRemaining(
          session.durations.discussion ?? FALLBACK_DISCUSSION_SECONDS,
        )
        setStage('discussion')
        window.setTimeout(() => {
          questionTransitionStarted.current = false
        }, 0)
        return
      }

      if (submissionStarted.current) {
        return
      }

      submissionStarted.current = true
      setStage('submitting')

      try {
        const answers = selectedProblems.map((problem) => {
          const answer =
            questionStatesRef.current[problem.slug] ?? createQuestionState()

          return {
            problem,
            discussionMessages: answer.messages,
            language: answer.language,
            code: answer.code,
            endedBy: completionReasons.current[problem.slug],
          }
        })
        const completedSubmission = await submitInterviewSession({
          sessionId: session.id,
          categories,
          answers: { questions: answers },
        })

        setSubmission(completedSubmission)
        setStage('ended')
      } catch {
        submissionStarted.current = false
        questionTransitionStarted.current = false
        setStage('error')
      }
    },
    [activeQuestionIndex, categories, selectedProblems, session],
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
              completeQuestion('timer')
            }
          }, 0)

          return 0
        }

        return current - 1
      })
    }, 1000)

    return () => window.clearInterval(timer)
  }, [beginCoding, completeQuestion, stage])

  const handleSendMessage = async (content) => {
    if (!activeProblem || !activeQuestionState || !session) {
      return
    }

    const problemSlug = activeProblem.slug
    const userMessage = {
      id: `user-message-${Date.now()}`,
      role: 'user',
      content,
    }
    const updatedConversation = [
      ...activeQuestionState.messages,
      userMessage,
    ]

    updateQuestionState(problemSlug, { messages: updatedConversation })
    setIsInterviewerResponding(true)

    try {
      const interviewerMessage = await sendInterviewChatMessage({
        sessionId: session.id,
        problem: activeProblem,
        message: content,
        conversation: updatedConversation,
      })

      updateQuestionState(problemSlug, (currentState) => ({
        messages: [...currentState.messages, interviewerMessage],
      }))
    } finally {
      setIsInterviewerResponding(false)
    }
  }

  const handleRun = async () => {
    if (!activeProblem || !activeQuestionState || !session) {
      return
    }

    const problemSlug = activeProblem.slug
    setIsRunning(true)

    try {
      const result = await runCodeSubmission({
        sessionId: session.id,
        problem: activeProblem,
        categories,
        questionNumber: activeQuestionIndex + 1,
        language: activeQuestionState.language,
        code: activeQuestionState.code,
      })
      updateQuestionState(problemSlug, { runResult: result })
    } finally {
      setIsRunning(false)
    }
  }

  if (!hasValidRequest || stage === 'error') {
    return (
      <section className="active-problem practice-state">
        <p className="practice-state__eyebrow">Custom interview</p>
        <h2>Unable to create this interview</h2>
        <p>Please return to the custom interview builder and try again.</p>
      </section>
    )
  }

  if (
    stage === 'loading' ||
    !activeProblem ||
    !activeQuestionState
  ) {
    return (
      <section className="active-problem practice-state">
        <p className="practice-state__eyebrow">Custom interview</p>
        <h2>Preparing your questions...</h2>
      </section>
    )
  }

  if (stage === 'submitting' || stage === 'ended') {
    return (
      <InterviewEnding
        stage={stage}
        submission={submission}
        questionCount={selectedProblems.length}
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
            questionNumber={activeQuestionIndex + 1}
            totalQuestions={selectedProblems.length}
          />
          <ProblemDiscussion
            problem={activeProblem}
            messages={activeQuestionState.messages}
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
            questionNumber={activeQuestionIndex + 1}
            totalQuestions={selectedProblems.length}
          />
          <ProblemWorkspace
            className="problem-workspace--timed"
            problem={activeProblem}
            language={activeQuestionState.language}
            code={activeQuestionState.code}
            onLanguageChange={(language) =>
              updateQuestionState(activeProblem.slug, { language })
            }
            onCodeChange={(code) =>
              updateQuestionState(activeProblem.slug, { code })
            }
            onStart={() => completeQuestion('submitted')}
            onRun={handleRun}
            actionLabel={
              activeQuestionIndex === selectedProblems.length - 1
                ? 'Submit interview'
                : 'Submit question'
            }
            actionVariant="submit"
            runResult={activeQuestionState.runResult}
            isRunning={isRunning}
          />
        </>
      )}
    </section>
  )
}

export default CustomPractice
