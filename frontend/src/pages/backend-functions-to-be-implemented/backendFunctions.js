import { problems } from '../../data/problems.js'

const MIN_CUSTOM_QUESTION_COUNT = 1
const MAX_CUSTOM_QUESTION_COUNT = 3
const TEMPORARY_AUTH_STORAGE_KEY = 'traceround-temporary-user'
const TEMPORARY_FEEDBACK_STORAGE_PREFIX = 'traceround-feedback-'
const TEMPORARY_SUBMISSION_HISTORY_PREFIX = 'traceround-submissions-'

const DEFAULT_TEMPORARY_USER = {
  id: 'temporary-default-user',
  name: 'Xavier Reid',
  email: 'demo@traceround.local',
  provider: 'temporary',
}

/**
 * TEMPORARY FUNCTION USED FOR DEMO DATA — SHOULD BE DELETED LATER.
 * Input: prefix (string), such as "demo-session".
 * Output: a locally generated unique identifier string.
 */
function createTemporaryId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

/**
 * TEMPORARY FUNCTION USED FOR DEMO DATA — SHOULD BE DELETED LATER.
 * Input: none.
 * Output: an integer score from 6 through 10.
 */
function createTemporaryScore() {
  return Math.floor(Math.random() * 5) + 6
}

/**
 * TEMPORARY FUNCTION USED FOR DEMO DATA — SHOULD BE DELETED LATER.
 * Input: answer ({ problem: Problem, ... }) and index (number).
 * Output: { id, title, summary, scores: { communication, approach,
 * codeQuality }, recommendations: string[] }.
 */
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
      'State the complete algorithm and its key invariant before beginning the implementation.',
      'Walk through at least one edge case aloud and explain how the code handles it.',
      'Close with the final time and space complexity and identify the dominant operation.',
    ],
  }
}

/**
 * TEMPORARY FUNCTION USED FOR DEMO DATA — SHOULD BE DELETED LATER.
 * Input: feedbackId (string) and questionAnswers (Answer[]).
 * Output: { id, status, interviewDate, questionCount, overallSummary,
 * questions: QuestionFeedback[] }.
 */
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

/**
 * TEMPORARY FUNCTION USED FOR DEMO DATA — SHOULD BE DELETED LATER.
 * Input: a complete Feedback object.
 * Output: nothing; writes the serialized feedback to sessionStorage.
 */
function saveTemporaryFeedback(feedback) {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(
      `${TEMPORARY_FEEDBACK_STORAGE_PREFIX}${feedback.id}`,
      JSON.stringify(feedback),
    )
  }
}

/**
 * TEMPORARY FUNCTION USED FOR DEMO DATA — SHOULD BE DELETED LATER.
 * Input: feedbackId (string).
 * Output: the parsed Feedback object, or null when it is not available.
 */
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

/**
 * TEMPORARY FUNCTION USED FOR DEMO DATA — SHOULD BE DELETED LATER.
 * Input: userId (string).
 * Output: the sessionStorage key string for that demo user's history.
 */
function getTemporaryHistoryStorageKey(userId) {
  return `${TEMPORARY_SUBMISSION_HISTORY_PREFIX}${userId}`
}

/**
 * TEMPORARY FUNCTION USED FOR DEMO DATA — SHOULD BE DELETED LATER.
 * Input: userId (string) and history (SubmissionReference[]).
 * Output: nothing; writes the serialized history to sessionStorage.
 */
function saveTemporarySubmissionHistory(userId, history) {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(
      getTemporaryHistoryStorageKey(userId),
      JSON.stringify(history),
    )
  }
}

/**
 * TEMPORARY FUNCTION USED FOR DEMO DATA — SHOULD BE DELETED LATER.
 * Input: userId (string).
 * Output: SubmissionReference[] from sessionStorage, or null.
 */
function readTemporarySubmissionHistory(userId) {
  if (typeof window === 'undefined') {
    return null
  }

  const storageKey = getTemporaryHistoryStorageKey(userId)
  const storedHistory = sessionStorage.getItem(storageKey)

  if (!storedHistory) {
    return null
  }

  try {
    return JSON.parse(storedHistory)
  } catch {
    sessionStorage.removeItem(storageKey)
    return null
  }
}

/**
 * TEMPORARY FUNCTION USED FOR DEMO DATA — SHOULD BE DELETED LATER.
 * Input: userId (string).
 * Output: SubmissionReference[] containing generated IDs, feedback IDs, and
 * ISO-8601 interview dates; also stores the generated feedback locally.
 */
function createTemporarySubmissionHistory(userId) {
  const interviewTemplates = [
    { daysAgo: 2, questionCount: 1, problemOffset: 0 },
    { daysAgo: 8, questionCount: 2, problemOffset: 2 },
    { daysAgo: 16, questionCount: 1, problemOffset: 5 },
    { daysAgo: 29, questionCount: 3, problemOffset: 6 },
    { daysAgo: 45, questionCount: 2, problemOffset: 1 },
    { daysAgo: 67, questionCount: 1, problemOffset: 4 },
  ]

  const history = interviewTemplates.map((template, interviewIndex) => {
    const selectedProblems = Array.from(
      { length: template.questionCount },
      (_, questionIndex) =>
        problems[
          (template.problemOffset + questionIndex) % problems.length
        ],
    )
    const feedbackId = createTemporaryId('demo-history-feedback')
    const feedback = createTemporaryFeedback(
      feedbackId,
      selectedProblems.map((problem) => ({ problem })),
    )
    const interviewDate = new Date(
      Date.now() - template.daysAgo * 24 * 60 * 60 * 1000,
    ).toISOString()

    feedback.interviewDate = interviewDate
    saveTemporaryFeedback(feedback)

    return {
      id: `demo-history-${userId}-${interviewIndex + 1}`,
      feedbackId,
      interviewDate,
    }
  })

  saveTemporarySubmissionHistory(userId, history)
  return history
}

/**
 * TEMPORARY FUNCTION USED FOR DEMO DATA — SHOULD BE DELETED LATER.
 * Input: userId (string).
 * Output: the existing or newly generated SubmissionReference[].
 */
function getTemporarySubmissionHistory(userId) {
  return (
    readTemporarySubmissionHistory(userId) ??
    createTemporarySubmissionHistory(userId)
  )
}

/**
 * TEMPORARY FUNCTION USED FOR DEMO DATA — SHOULD BE DELETED LATER.
 * Input: userId (string) and submission ({ id, feedbackId, interviewDate }).
 * Output: nothing; adds the submission to local demo history in date order.
 */
function saveCompletedTemporarySubmission(userId, submission) {
  const history = getTemporarySubmissionHistory(userId)
  const nextHistory = [
    submission,
    ...history.filter((item) => item.id !== submission.id),
  ].sort(
    (first, second) =>
      new Date(second.interviewDate) - new Date(first.interviewDate),
  )

  saveTemporarySubmissionHistory(userId, nextHistory)
}

/**
 * TEMPORARY FUNCTION USED FOR DEMO DATA — SHOULD BE DELETED LATER.
 * Input: scores ({ communication: number, approach: number,
 * codeQuality: number }).
 * Output: the arithmetic mean as a number from 0 through 10.
 */
function calculateQuestionAverage(scores) {
  const scoreValues = Object.values(scores)
  return (
    scoreValues.reduce((total, score) => total + score, 0) /
    scoreValues.length
  )
}

/**
 * TEMPORARY FUNCTION USED FOR DEMO DATA — SHOULD BE DELETED LATER.
 * Input: submission ({ id, interviewDate }) and a complete Feedback object.
 * Output: { id, interviewDate, questionCount, questionTitles: string[],
 * overallScore: number }.
 */
function createSubmissionSummary(submission, feedback) {
  const questionAverages = feedback.questions.map((question) =>
    calculateQuestionAverage(question.scores),
  )

  return {
    id: submission.id,
    interviewDate: submission.interviewDate,
    questionCount: feedback.questionCount,
    questionTitles: feedback.questions.map((question) => question.title),
    overallScore:
      questionAverages.reduce((total, score) => total + score, 0) /
      questionAverages.length,
  }
}

/**
 * TEMPORARY FUNCTION USED FOR DEMO DATA — SHOULD BE DELETED LATER.
 * Input: history (SubmissionReference[]).
 * Output: { totalInterviews, averages: { communication, approach,
 * codeQuality } }.
 */
function calculateSubmissionMetrics(history) {
  const allQuestions = history.flatMap((submission) => {
    const feedback = readTemporaryFeedback(submission.feedbackId)
    return feedback?.questions ?? []
  })
  const scoreKeys = ['communication', 'approach', 'codeQuality']
  const averages = Object.fromEntries(
    scoreKeys.map((scoreKey) => {
      const total = allQuestions.reduce(
        (scoreTotal, question) =>
          scoreTotal + question.scores[scoreKey],
        0,
      )

      return [
        scoreKey,
        allQuestions.length > 0 ? total / allQuestions.length : 0,
      ]
    }),
  )

  return {
    totalInterviews: history.length,
    averages,
  }
}

/*
 * This file is the frontend contract for backend functionality that has not
 * been implemented yet. Pages should import backend-facing operations from
 * here so their UI code does not need to change when real API calls are added.
 */

/**
 * TEMPORARY FUNCTION USED FOR DEMO DATA — SHOULD BE DELETED LATER.
 * Input: items (any[]).
 * Output: a new array containing the same values in randomized order.
 */
function shuffled(items) {
  const result = [...items]

  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    ;[result[index], result[randomIndex]] = [result[randomIndex], result[index]]
  }

  return result
}

/**
 * TEMPORARY FUNCTION USED FOR DEMO DATA — SHOULD BE DELETED LATER.
 * Input: questionCount (number or numeric string).
 * Output: an integer from 1 through 3, defaulting to 1 when invalid.
 */
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

/**
 * TEMPORARY FUNCTION USED FOR DEMO DATA — SHOULD BE DELETED LATER.
 * Input: problem (Problem), questionNumber (number), totalQuestions (number).
 * Output: { id: string, role: "interviewer", content: string }.
 */
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

/**
 * TEMPORARY FUNCTION USED FOR DEMO DATA — SHOULD BE DELETED LATER.
 * Input: categories (string[]) and questionCount (number).
 * Output: string[] containing the selected problem slugs.
 */
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
 * PRODUCTION-REQUIRED BACKEND CONTRACT — NOT SOLELY FOR DEMO DATA.
 * Current implementation is temporary demo data and must be replaced later.
 *
 * Input:
 * - categories: string[] of selected topic names.
 * - questionCount: integer from 1 through 3.
 *
 * Required backend output (JSON):
 * string[] containing exactly questionCount valid problem slugs.
 */
export async function requestPracticeProblemSlugs(categories, questionCount) {
  return selectTemporaryPracticeProblemSlugs(categories, questionCount)
}

/**
 * PRODUCTION-REQUIRED BACKEND CONTRACT — NOT SOLELY FOR DEMO DATA.
 * Current implementation is temporary demo data and must be replaced later.
 *
 * Input:
 * - problem: { slug: string, title: string, ... }.
 * - authenticated user is determined by the backend session when present.
 *
 * Required backend output (JSON):
 * { id: string, problemSlug: string, status: "discussion",
 * durations: { discussion: number, coding: number },
 * initialMessages: Array<{ id: string, role: string, content: string }> }.
 * Duration values are seconds.
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
 * PRODUCTION-REQUIRED BACKEND CONTRACT — NOT SOLELY FOR DEMO DATA.
 * Current implementation is temporary demo data and must be replaced later.
 *
 * Input object:
 * - sessionId: string.
 * - problem: Problem object.
 * - message: string containing the newest user message.
 * - conversation: Array<{ id: string, role: string, content: string }>.
 *
 * Required backend output (JSON):
 * { id: string, role: "interviewer", content: string }.
 * The backend must also retain the transcript under the interview session.
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
 * PRODUCTION-REQUIRED BACKEND CONTRACT — NOT SOLELY FOR DEMO DATA.
 * Current implementation is temporary demo data and must be replaced later.
 *
 * Input object:
 * - selectedProblems: Problem[] in interview order.
 * - categories: string[] of selected topics.
 * - questionCount: integer from 1 through 3.
 * - authenticated user is determined by the backend session when present.
 *
 * Required backend output (JSON):
 * { id: string, status: "discussion", questionCount: number,
 * durations: { discussion: number, coding: number },
 * questions: Array<{ problemSlug: string,
 * initialMessages: Array<{ id, role, content }> }> }.
 * Duration values are seconds.
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
 * PRODUCTION-REQUIRED BACKEND CONTRACT — NOT SOLELY FOR DEMO DATA.
 * Current implementation is temporary demo data and must be replaced later.
 *
 * Input object:
 * - sessionId: string when running inside an interview.
 * - problem: Problem object.
 * - language: string.
 * - code: string containing the submitted source code.
 * - categories: optional string[] for custom interviews.
 * - questionNumber: optional number for custom interviews.
 *
 * Required backend output (JSON):
 * { status: "success" | "error", summary: string, output: string,
 * passedTests: number, totalTests: number }.
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
 * PRODUCTION-REQUIRED BACKEND CONTRACT — NOT SOLELY FOR DEMO DATA.
 * Current implementation is temporary demo data and must be replaced later.
 *
 * Input object:
 * - sessionId: string.
 * - categories: optional string[].
 * - answers: either one Answer object or
 *   { questions: Answer[] } for a custom interview.
 * - each Answer contains problem, discussionMessages, language, code, endedBy.
 * - authenticated user is determined by the backend session when present.
 *
 * Required backend output (JSON):
 * { id: string, sessionId: string, feedbackId: string,
 * status: "submitted" | "processing" | "completed",
 * received: { questionCount: number, discussionMessageCount: number,
 * codeLength: number, language?: string, problemSlug?: string } }.
 * The backend must save the result under the session user when authenticated.
 */
export async function submitInterviewSession({
  sessionId,
  answers,
  categories,
}) {
  void categories
  const questionAnswers = answers.questions ?? [answers]
  const feedbackId = createTemporaryId('demo-feedback')
  const submissionId = createTemporaryId('demo-submission')
  const temporaryFeedback = createTemporaryFeedback(
    feedbackId,
    questionAnswers,
  )

  saveTemporaryFeedback(temporaryFeedback)
  const currentUser = await getCurrentUser()

  if (currentUser) {
    saveCompletedTemporarySubmission(currentUser.id, {
      id: submissionId,
      feedbackId,
      interviewDate: temporaryFeedback.interviewDate,
    })
  }

  return {
    id: submissionId,
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
 * PRODUCTION-REQUIRED BACKEND CONTRACT — NOT SOLELY FOR DEMO DATA.
 * Current implementation is temporary demo data and must be replaced later.
 *
 * Input:
 * - feedbackId: unguessable string returned by interview submission.
 *
 * Required backend output (JSON):
 * { id: string, status: "processing" | "completed" | "failed",
 * interviewDate: ISO-8601 string, questionCount: number,
 * overallSummary: string, questions: Array<{ id: string, title: string,
 * summary: string, scores: { communication: number, approach: number,
 * codeQuality: number }, recommendations: string[] }> }.
 * The backend must verify access to saved feedback and expire guest feedback.
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
 * PRODUCTION-REQUIRED BACKEND CONTRACT — NOT SOLELY FOR DEMO DATA.
 * This is currently an unimplemented backend placeholder.
 *
 * Input object:
 * - email: string.
 * - password: string sent only over HTTPS.
 *
 * Required backend output (JSON):
 * { user: { id: string, name: string, email: string, provider: string } }.
 * It must also establish a Secure, HttpOnly session cookie. Password
 * verification must never happen in the browser.
 */
export async function signInUser({ email, password }) {
  void email
  void password
}

/**
 * TEMPORARY FUNCTION USED FOR DEMO DATA — SHOULD BE DELETED LATER.
 *
 * Input: none.
 * Output: Promise<{ id: string, name: string, email: string,
 * provider: "temporary" }>.
 * This stores a non-secure demo identity in localStorage and must not remain
 * after real authentication is connected.
 */
export async function signInAsDefaultUser() {
  const user = { ...DEFAULT_TEMPORARY_USER }
  localStorage.setItem(TEMPORARY_AUTH_STORAGE_KEY, JSON.stringify(user))
  return user
}

/**
 * PRODUCTION-REQUIRED BACKEND CONTRACT — NOT SOLELY FOR DEMO DATA.
 * This is currently an unimplemented backend placeholder.
 *
 * Input:
 * - provider: string identifier such as "google", "github", or "microsoft".
 *
 * Required backend output:
 * either an HTTP redirect to the provider or
 * { authorizationUrl: string } for the frontend to navigate to.
 * The OAuth callback must establish a Secure, HttpOnly session cookie.
 */
export async function signInWithProvider(provider) {
  void provider
  throw new Error(
    'Social sign-in requires an OAuth backend or authentication provider.',
  )
}

/**
 * PRODUCTION-REQUIRED BACKEND CONTRACT — NOT SOLELY FOR DEMO DATA.
 * Current implementation only removes temporary local demo authentication and
 * must be replaced later.
 *
 * Input: no request body; the current user comes from the session cookie.
 * Required backend output: HTTP 204 with no body, or
 * { success: true } as JSON.
 * The backend must invalidate the server session and clear its cookie.
 */
export async function signOutUser() {
  localStorage.removeItem(TEMPORARY_AUTH_STORAGE_KEY)
}

/**
 * PRODUCTION-REQUIRED BACKEND CONTRACT — NOT SOLELY FOR DEMO DATA.
 * Current implementation reads temporary local demo authentication and must be
 * replaced later.
 *
 * Input: no request body; the session cookie is sent automatically.
 * Required backend output (JSON):
 * { id: string, name: string, email: string, provider: string } when signed in,
 * or null / HTTP 401 when signed out.
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
 * PRODUCTION-REQUIRED BACKEND CONTRACT — NOT SOLELY FOR DEMO DATA.
 * This is currently an unimplemented backend placeholder.
 *
 * Input object:
 * - sessionId: string.
 * - feedback: complete Feedback object.
 * - authenticated user is determined only from the verified session.
 *
 * Required backend output (JSON):
 * { saved: boolean, submissionId: string, feedbackId: string }.
 */
export async function saveInterviewFeedback({ sessionId, feedback }) {
  void sessionId
  void feedback
}

/**
 * PRODUCTION-REQUIRED BACKEND CONTRACT — NOT SOLELY FOR DEMO DATA.
 * Current implementation is temporary demo data and must be replaced later.
 *
 * Input object:
 * - cursor: optional opaque string or numeric development cursor.
 * - limit: optional integer page size.
 * - authenticated user is determined only from the verified session.
 *
 * Required backend output (JSON):
 * { metrics: { totalInterviews: number, averages: { communication: number,
 * approach: number, codeQuality: number } },
 * submissions: Array<{ id: string, interviewDate: ISO-8601 string,
 * questionCount: number, questionTitles: string[], overallScore: number }>,
 * pagination: { nextCursor: string | null } }.
 */
export async function getUserSubmissions({ cursor = 0, limit = 4 } = {}) {
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    throw new Error('An authenticated session is required.')
  }

  const history = getTemporarySubmissionHistory(currentUser.id)
  const startIndex = Math.max(Number.parseInt(cursor, 10) || 0, 0)
  const pageSize = Math.min(Math.max(Number.parseInt(limit, 10) || 4, 1), 20)
  const page = history.slice(startIndex, startIndex + pageSize)
  const submissions = page
    .map((submission) => {
      const feedback = readTemporaryFeedback(submission.feedbackId)
      return feedback
        ? createSubmissionSummary(submission, feedback)
        : null
    })
    .filter(Boolean)
  const nextIndex = startIndex + page.length

  return {
    metrics: calculateSubmissionMetrics(history),
    submissions,
    pagination: {
      nextCursor: nextIndex < history.length ? String(nextIndex) : null,
    },
  }
}

/**
 * PRODUCTION-REQUIRED BACKEND CONTRACT — NOT SOLELY FOR DEMO DATA.
 * Current implementation is temporary demo data and must be replaced later.
 *
 * Input:
 * - submissionId: string.
 * - authenticated user is determined only from the verified session.
 *
 * Required backend output (JSON):
 * the complete Feedback object in the same format returned by
 * getInterviewFeedback. The backend must first verify ownership.
 */
export async function getUserSubmissionFeedback(submissionId) {
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    throw new Error('An authenticated session is required.')
  }

  const submission = getTemporarySubmissionHistory(currentUser.id).find(
    (item) => item.id === submissionId,
  )

  if (!submission) {
    throw new Error('Submission not found.')
  }

  const feedback = readTemporaryFeedback(submission.feedbackId)

  if (!feedback) {
    throw new Error('Submission feedback is unavailable.')
  }

  return feedback
}
