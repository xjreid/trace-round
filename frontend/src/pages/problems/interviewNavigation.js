const singleProblemPath = /^\/problems\/[a-z0-9-]+$/
const customInterviewPath = /^\/customproblems\/[^/?#]+\/[1-3]$/
const pendingSignInDestinationKey = 'traceround.pendingSignInDestination'
const pendingSignInDestinationLifetime = 15 * 60 * 1000

export function createInterviewAccessPath(destination) {
  return `/interview-access?returnTo=${encodeURIComponent(destination)}`
}

export function createInterviewSignInPath(destination) {
  return `/signin?returnTo=${encodeURIComponent(destination)}`
}

export function isValidInterviewDestination(destination) {
  return (
    singleProblemPath.test(destination) ||
    customInterviewPath.test(destination)
  )
}

export function isValidSignInDestination(destination) {
  return (
    destination === '/submissions' ||
    isValidInterviewDestination(destination)
  )
}

export function rememberPendingSignInDestination(destination) {
  try {
    if (!isValidSignInDestination(destination)) {
      window.sessionStorage.removeItem(pendingSignInDestinationKey)
      return
    }

    window.sessionStorage.setItem(
      pendingSignInDestinationKey,
      JSON.stringify({
        destination,
        createdAt: Date.now(),
      }),
    )
  } catch {
    // OAuth still works when session storage is unavailable, but returns to
    // the normal signed-in landing page.
  }
}

export function getPendingSignInDestination() {
  try {
    const storedValue = window.sessionStorage.getItem(
      pendingSignInDestinationKey,
    )
    if (!storedValue) {
      return null
    }

    const pendingDestination = JSON.parse(storedValue)
    const isCurrent =
      Number.isFinite(pendingDestination.createdAt) &&
      Date.now() - pendingDestination.createdAt <=
        pendingSignInDestinationLifetime

    if (
      !isCurrent ||
      !isValidSignInDestination(pendingDestination.destination)
    ) {
      window.sessionStorage.removeItem(pendingSignInDestinationKey)
      return null
    }

    return pendingDestination.destination
  } catch {
    try {
      window.sessionStorage.removeItem(pendingSignInDestinationKey)
    } catch {
      // Ignore browsers that block session storage.
    }
    return null
  }
}

export function clearPendingSignInDestination() {
  try {
    window.sessionStorage.removeItem(pendingSignInDestinationKey)
  } catch {
    // Ignore browsers that block session storage.
  }
}
