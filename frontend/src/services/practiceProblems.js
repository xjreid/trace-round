import { problems } from '../data/problems.js'

const PRACTICE_QUESTION_COUNT = 4

function shuffled(items) {
  const result = [...items]

  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    ;[result[index], result[randomIndex]] = [result[randomIndex], result[index]]
  }

  return result
}

function selectRandomProblemSlugs(categories) {
  const selectedCategories = new Set(categories)
  const categoryMatches = problems.filter((problem) =>
    selectedCategories.has(problem.category),
  )
  const otherProblems = problems.filter(
    (problem) => !selectedCategories.has(problem.category),
  )

  return [...shuffled(categoryMatches), ...shuffled(otherProblems)]
    .slice(0, PRACTICE_QUESTION_COUNT)
    .map((problem) => problem.slug)
}

export async function requestPracticeProblemSlugs(categories) {
  /*
   * TODO: Replace this return statement with the backend request.
   * Keeping the temporary random selection inside this service means the page
   * will not need to change when the backend begins returning four slugs.
   */
  return selectRandomProblemSlugs(categories)
}
