import { problems } from '../../data/problems.js'

const MIN_CUSTOM_QUESTION_COUNT = 1
const MAX_CUSTOM_QUESTION_COUNT = 3
const TEMPORARY_AUTH_STORAGE_KEY = 'traceround-temporary-user'
const TEMPORARY_FEEDBACK_STORAGE_PREFIX = 'traceround-feedback-'

const DEFAULT_TEMPORARY_USER = {
  id: 'temporary-default-user',
  name: 'Xavier Reid',
  email: 'demo@traceround.local',
  provider: 'temporary',
}

function createTemporaryId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function createTemporaryScore() {
  return Math.floor(Math.random() * 5) + 6
}

function createTemporaryQuestionFeedback(answer, index) {
  const problemTitle = answer.problem?.title ?? `Practice question ${index + 1}`

  return {
    id: answer.problem?.slug ?? `question-${index + 1}`,
    title: problemTitle,
    summary: `You communicated a workable direction for ${problemTitle} and carried that plan into your implementation. Your strongest moments came when connecting the chosen data structures to the problem constraints. Continue making edge cases and complexity tradeoffs explicit before writing code.`,
    scores: {
      communication: createTemporaryScore(),
      approach: createTemporaryScore(),
      codeQuality: createTemporaryScore(),
    },
    recommendations: [
      'State the complete algorithm and its key invariant before beginning the implementation.State the complete algorithm and its key invariant before beginning the implementation.State the complete algorithm and its key invariant before beginning the implementation.',
      'Walk through at least one edge case aloud and explain how the code handles it.State the complete algorithm and its key invariant before beginning the implementation.',
      'Close with the final time and space complexity and identify the dominant operation.',
      'Close with the final time and space complexity and identify the dominant operation.',
    ],
  }
}

function createTemporaryFeedback(feedbackId, questionAnswers) {
  const questionFeedback = questionAnswers.map(createTemporaryQuestionFeedback)

  return {
    id: feedbackId,
    status: 'completed',
    interviewDate: new Date().toISOString(),
    questionCount: questionFeedback.length,
    overallSummary:
      questionFeedback.length === 1
        ? 'You completed a focused technical interview covering problem clarification, solution planning, and implementation. The review below highlights how clearly you communicated, how soundly you approached the problem, and the quality of your final code.'
        : `You completed a ${questionFeedback.length}-question technical interview. Across the session, you demonstrated consistent problem-solving fundamentals while moving from discussion to implementation. Review each question below for focused scores and next steps.`,
    questions: questionFeedback,
  }
}

function saveTemporaryFeedback(feedback) {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(
      `${TEMPORARY_FEEDBACK_STORAGE_PREFIX}${feedback.id}`,
      JSON.stringify(feedback),
    )
  }
}

function readTemporaryFeedback(feedbackId) {
  if (typeof window === 'undefined') {
    return null
  }

  const storedFeedback = sessionStorage.getItem(
    `${TEMPORARY_FEEDBACK_STORAGE_PREFIX}${feedbackId}`,
  )

  if (!storedFeedback) {
    return null
  }

  try {
    return JSON.parse(storedFeedback)
  } catch {
    sessionStorage.removeItem(
      `${TEMPORARY_FEEDBACK_STORAGE_PREFIX}${feedbackId}`,
    )
    return null
  }
}

/*
 * This file is the frontend contract for backend functionality that has not
 * been implemented yet. Pages should import backend-facing operations from
 * here so their UI code does not need to change when real API calls are added.
 */

function shuffled(items) {
  const result = [...items]

  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    ;[result[index], result[randomIndex]] = [result[randomIndex], result[index]]
  }

  return result
}

function normalizeQuestionCount(questionCount) {
  const parsedCount = Number.parseInt(questionCount, 10)

  if (
    Number.isNaN(parsedCount) ||
    parsedCount < MIN_CUSTOM_QUESTION_COUNT ||
    parsedCount > MAX_CUSTOM_QUESTION_COUNT
  ) {
    return MIN_CUSTOM_QUESTION_COUNT
  }

  return parsedCount
}

function createInitialInterviewerMessage(problem, questionNumber, totalQuestions) {
  const questionContext =
    totalQuestions > 1
      ? ` This is question ${questionNumber} of ${totalQuestions}.`
      : ''

  return {
    id: createTemporaryId('interviewer-message'),
    role: 'interviewer',
    content: `Welcome.${questionContext} Before you code, walk me through how you would approach “${problem.title}.” You can also ask me any clarifying questions about the prompt.`,
  }
}

function selectTemporaryPracticeProblemSlugs(categories, questionCount) {
  const selectedCategories = new Set(categories)
  const categoryMatches = problems.filter((problem) =>
    selectedCategories.has(problem.category),
  )
  const otherProblems = problems.filter(
    (problem) => !selectedCategories.has(problem.category),
  )

  return [...shuffled(categoryMatches), ...shuffled(otherProblems)]
    .slice(0, normalizeQuestionCount(questionCount))
    .map((problem) => problem.slug)
}

/**
 * Custom interview page
 *
 * TODO: Send the selected categories and requested question count to the
 * backend and return that number of valid problem slugs. The local selection
 * keeps custom practice usable until that endpoint exists.
 */
export async function requestPracticeProblemSlugs(categories, questionCount) {
  return selectTemporaryPracticeProblemSlugs(categories, questionCount)
}

/**
 * Individual problem page
 *
 * TODO: Create a backend interview session for one problem and return its
 * session ID, start time, and any session metadata needed by the frontend.
 */
export async function startProblemSession(problem) {
  return {
    id: createTemporaryId('demo-session'),
    problemSlug: problem.slug,
    status: 'discussion',
    durations: {
      discussion: 5 * 60,
      coding: 20 * 60,
    },
    initialMessages: [createInitialInterviewerMessage(problem, 1, 1)],
  }
}

/**
 * Discussion stage
 *
 * TODO: Send the conversation and latest user message to the AI interviewer
 * backend. The backend should return the interviewer's next message and retain
 * the complete transcript under the interview session.
 *
 * This temporary implementation returns generic development responses.
 */
export async function sendInterviewChatMessage({
  sessionId,
  problem,
  message,
  conversation,
}) {
  void sessionId
  void conversation

  const normalizedMessage = message.toLowerCase()
  let content =
    'That sounds like a reasonable direction. Explain the data structure you would use and how it affects the time and space complexity.'

  if (
    normalizedMessage.includes('clarif') ||
    normalizedMessage.includes('assume') ||
    normalizedMessage.includes('?')
  ) {
    content = `For this development interview, use the constraints exactly as written in the ${problem.title} prompt. You may state any additional reasonable assumption before coding.`
  } else if (
    normalizedMessage.includes('complex') ||
    normalizedMessage.includes('big o') ||
    normalizedMessage.includes('time')
  ) {
    content =
      'Good—include both time and space complexity in your explanation. What input characteristic determines the dominant term?'
  } else if (
    normalizedMessage.includes('hash') ||
    normalizedMessage.includes('map') ||
    normalizedMessage.includes('set')
  ) {
    content =
      'A lookup structure could be useful here. Talk me through what you would store, when you would update it, and the tradeoff you are making.'
  }

  return {
    id: createTemporaryId('interviewer-message'),
    role: 'interviewer',
    content,
  }
}

/**
 * Custom practice page
 *
 * TODO: Create one backend interview session containing the requested selected
 * problems and return its session details.
 */
export async function startCustomPracticeSession({
  selectedProblems,
  categories,
  questionCount,
}) {
  void categories

  const normalizedCount = normalizeQuestionCount(questionCount)

  return {
    id: createTemporaryId('demo-custom-session'),
    status: 'discussion',
    questionCount: normalizedCount,
    durations: {
      discussion: 5 * 60,
      coding: 20 * 60,
    },
    questions: selectedProblems.map((problem, index) => ({
      problemSlug: problem.slug,
      initialMessages: [
        createInitialInterviewerMessage(
          problem,
          index + 1,
          normalizedCount,
        ),
      ],
    })),
  }
}

/**
 * Problem workspace
 *
 * TODO: Send code to the backend execution service and return stdout, stderr,
 * test results, execution status, and timing information.
 *
 * The optional category and question fields identify a problem within a
 * multi-question custom interview.
 */
export async function runCodeSubmission({
  problem,
  language,
  code,
  categories,
  questionNumber,
}) {
  void problem
  void categories
  void questionNumber

  if (!code.trim()) {
    return {
      status: 'error',
      summary: 'No code to run',
      output: `Add a ${language} solution before running the development test.`,
      passedTests: 0,
      totalTests: 0,
    }
  }

  return {
    status: 'success',
    summary: 'Development run completed',
    output:
      'Temporary runner: your solution compiled and completed the sample checks. Connect the execution backend for real test results.',
    passedTests: 3,
    totalTests: 3,
  }
}

/**
 * Problem workspace
 *
 * TODO: Submit the completed interview answers, mark the session complete,
 * trigger feedback generation, and return the feedback page identifier.
 *
 * The temporary response lets both single and custom interview completion
 * flows reach the feedback page until the real submission endpoint exists.
 */
export async function submitInterviewSession({
  sessionId,
  answers,
  categories,
}) {
  void categories
  const questionAnswers = answers.questions ?? [answers]
  const feedbackId = createTemporaryId('demo-feedback')
  const temporaryFeedback = createTemporaryFeedback(
    feedbackId,
    questionAnswers,
  )

  saveTemporaryFeedback(temporaryFeedback)

  return {
    id: createTemporaryId('demo-submission'),
    sessionId,
    feedbackId,
    status: 'submitted',
    received: {
      questionCount: questionAnswers.length,
      discussionMessageCount: questionAnswers.reduce(
        (total, answer) =>
          total + (answer.discussionMessages?.length ?? 0),
        0,
      ),
      codeLength: questionAnswers.reduce(
        (total, answer) => total + (answer.code?.length ?? 0),
        0,
      ),
      language: questionAnswers[0]?.language,
      problemSlug: questionAnswers[0]?.problem?.slug,
    },
  }
}

/**
 * Feedback page
 *
 * TODO: Fetch generated feedback from the backend by its unguessable feedback
 * ID. The backend should verify access for saved authenticated submissions and
 * return temporary guest feedback only while it remains available.
 *
 * This temporary implementation reads feedback created by the local submission
 * function. A generic record keeps direct feedback-page development usable.
 */
export async function getInterviewFeedback(feedbackId) {
  const storedFeedback = readTemporaryFeedback(feedbackId)

  if (storedFeedback) {
    return storedFeedback
  }

  return createTemporaryFeedback(feedbackId, [
    {
      problem: problems[0],
    },
  ])
}

/**
 * Sign-in page
 *
 * TODO: Verify credentials through the authentication backend and establish a
 * secure user session. Password verification must never happen in the browser.
 */
export async function signInUser({ email, password }) {
  void email
  void password
}

/**
 * Temporary frontend authentication
 *
 * Remove this function when real backend authentication is connected. It
 * stores a non-secure demo identity in localStorage so the sign-in UI and
 * identity-aware frontend can be developed before the backend exists.
 */
export async function signInAsDefaultUser() {
  const user = { ...DEFAULT_TEMPORARY_USER }
  localStorage.setItem(TEMPORARY_AUTH_STORAGE_KEY, JSON.stringify(user))
  return user
}

/**
 * Sign-in page
 *
 * TODO: Begin an OAuth/OpenID Connect sign-in flow for Google or another
 * supported identity provider.
 */
export async function signInWithProvider(provider) {
  void provider
  throw new Error(
    'Social sign-in requires an OAuth backend or authentication provider.',
  )
}

/**
 * Site header/account controls
 *
 * TODO: End the authenticated backend session and clear the secure session
 * cookie.
 */
export async function signOutUser() {
  localStorage.removeItem(TEMPORARY_AUTH_STORAGE_KEY)
}

/**
 * Site header and protected pages
 *
 * TODO: Return the currently authenticated user from the verified backend
 * session, or null when the visitor is signed out.
 */
export async function getCurrentUser() {
  const storedUser = localStorage.getItem(TEMPORARY_AUTH_STORAGE_KEY)

  if (!storedUser) {
    return null
  }

  try {
    return JSON.parse(storedUser)
  } catch {
    localStorage.removeItem(TEMPORARY_AUTH_STORAGE_KEY)
    return null
  }
}

/**
 * Feedback page
 *
 * TODO: Save completed interview feedback under the authenticated user's ID.
 * The backend must determine the user from the verified session.
 */
export async function saveInterviewFeedback({ sessionId, feedback }) {
  void sessionId
  void feedback
}

/**
 * Submissions page
 *
 * TODO: Return the authenticated user's saved interview submissions and
 * feedback, including any pagination metadata required by the page.
 */
export async function getUserSubmissions() {
  return []
}
