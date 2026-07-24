const singleProblemPath = /^\/problems\/[a-z0-9-]+$/
const customInterviewPath = /^\/customproblems\/[^/?#]+\/[1-3]$/

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
