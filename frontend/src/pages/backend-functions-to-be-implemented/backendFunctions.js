const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'
const BACKEND_ORIGIN = import.meta.env.VITE_BACKEND_ORIGIN ?? ''

let csrfToken = null

async function parseResponse(response) {
  if (response.status === 204) {
    return null
  }

  const contentType = response.headers.get('content-type') ?? ''
  const payload = contentType.includes('application/json')
    ? await response.json()
    : await response.text()

  if (!response.ok) {
    const message =
      typeof payload === 'object' && payload?.error
        ? payload.error
        : typeof payload === 'object' && payload?.message
          ? payload.message
          : typeof payload === 'string' && payload
            ? payload
            : `Request failed with status ${response.status}.`
    const error = new Error(message)
    error.status = response.status
    throw error
  }

  return payload
}

async function loadCsrfToken() {
  if (csrfToken) {
    return csrfToken
  }

  const response = await fetch(`${API_BASE_URL}/auth/csrf`, {
    credentials: 'include',
  })
  const payload = await parseResponse(response)
  csrfToken = payload.token
  return csrfToken
}

async function apiRequest(path, options = {}) {
  const method = options.method ?? 'GET'
  const headers = new Headers(options.headers)

  if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json')
  }

  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    headers.set('X-XSRF-TOKEN', await loadCsrfToken())
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    method,
    headers,
    body:
      options.body === undefined || typeof options.body === 'string'
        ? options.body
        : JSON.stringify(options.body),
    credentials: 'include',
  })
  return parseResponse(response)
}

export async function requestPracticeProblemSlugs(categories, questionCount) {
  return apiRequest('/practice/problem-slugs', {
    method: 'POST',
    body: { categories, questionCount },
  })
}

export async function startProblemSession(problem) {
  return apiRequest('/interview-sessions/problem', {
    method: 'POST',
    body: { problemSlug: problem.slug },
  })
}

export async function sendInterviewChatMessage({
  sessionId,
  problem,
  message,
}) {
  return apiRequest(`/interview-sessions/${sessionId}/messages`, {
    method: 'POST',
    body: { problemSlug: problem.slug, message },
  })
}

export async function startCustomPracticeSession({
  selectedProblems,
  categories,
  questionCount,
}) {
  return apiRequest('/interview-sessions/custom', {
    method: 'POST',
    body: {
      selectedProblemSlugs: selectedProblems.map((problem) => problem.slug),
      categories,
      questionCount,
    },
  })
}

export async function runCodeSubmission({
  sessionId,
  problem,
  language,
  code,
}) {
  return apiRequest(`/interview-sessions/${sessionId}/runs`, {
    method: 'POST',
    body: { problemSlug: problem.slug, language, code },
  })
}

export async function submitInterviewSession({ sessionId, answers }) {
  const questionAnswers = answers.questions ?? [answers]
  return apiRequest(`/interview-sessions/${sessionId}/submit`, {
    method: 'POST',
    body: {
      answers: questionAnswers.map((answer) => ({
        problemSlug: answer.problem.slug,
        language: answer.language,
        code: answer.code,
        endedBy: answer.endedBy ?? 'submitted',
      })),
    },
  })
}

export async function getInterviewFeedback(feedbackId) {
  return apiRequest(`/feedback/${encodeURIComponent(feedbackId)}`)
}

export async function registerUser({ name, email, password }) {
  const user = await apiRequest('/auth/register', {
    method: 'POST',
    body: { name, email, password },
  })
  csrfToken = null
  return user
}

export async function signInUser({ email, password }) {
  const user = await apiRequest('/auth/login', {
    method: 'POST',
    body: { email, password },
  })
  csrfToken = null
  return user
}

export function signInWithProvider(provider) {
  window.location.assign(
    `${BACKEND_ORIGIN}/oauth2/authorization/${encodeURIComponent(provider)}`,
  )
}

export async function getAuthCapabilities() {
  return apiRequest('/auth/capabilities')
}

export async function signOutUser() {
  await apiRequest('/auth/logout', { method: 'POST' })
  csrfToken = null
}

export async function getCurrentUser() {
  try {
    return await apiRequest('/auth/me')
  } catch (error) {
    if (error.status === 401) {
      return null
    }
    throw error
  }
}

export async function getUserSubmissions({ cursor = 0, limit = 4 } = {}) {
  const params = new URLSearchParams({ cursor, limit })
  return apiRequest(`/me/submissions?${params}`)
}

export async function getUserSubmissionFeedback(submissionId) {
  return apiRequest(
    `/me/submissions/${encodeURIComponent(submissionId)}/feedback`,
  )
}
