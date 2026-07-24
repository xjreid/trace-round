

import './Problems.css'
import { problems } from '../../data/problems'
import { useMemo, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { createInterviewAccessPath } from './interviewNavigation'

function Problems() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')

  const filteredProblems = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()

    if (!normalizedQuery) {
      return problems
    }

    return problems.filter((problem) =>
      [problem.title, problem.category, problem.difficulty].some((value) =>
        value.toLowerCase().includes(normalizedQuery),
      ),
    )
  }, [searchQuery])

  const handleProblemClick = (problemSlug) => {
    navigate(createInterviewAccessPath(`/problems/${problemSlug}`))
  }

  return (
    <section className="page problems-page">
      <header className="practice-page-header">
        <p className="practice-page-kicker">Problem library</p>
        <h2 className="page-title">Choose your next challenge.</h2>
        <p className="practice-page-description">
          Focus on one problem and get feedback on the way you reason through it.
        </p>
      </header>

      <nav className="problems-nav" aria-label="Practice format">
        <NavLink to="/problems" end>
          Single Problem
        </NavLink>
        <NavLink to="/customproblems" end>
          Custom Interview
        </NavLink>
      </nav>

      <div className="problem-search">
        <label htmlFor="problem-search-input">Search problems</label>
        <div className="problem-search__field">
          <span className="problem-search__icon" aria-hidden="true" />
          <input
            id="problem-search-input"
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by problem, topic, or difficulty..."
            autoComplete="off"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Clear problem search"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="problems-container">
        <div className="problems-list-header">
          <span>{searchQuery ? 'Search results' : 'Available problems'}</span>
          <span>
            {filteredProblems.length} {filteredProblems.length === 1 ? 'challenge' : 'challenges'}
          </span>
        </div>
        <table className="problems-table">
          <tbody>
            {filteredProblems.map((problem) => (
              <tr
                className="problem-row"
                key={problem.id}
                onClick={() => handleProblemClick(problem.slug)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    handleProblemClick(problem.slug)
                  }
                }}
                role="link"
                tabIndex="0"
                aria-label={`${problem.title}, ${problem.category}, ${problem.difficulty}`}
              >
                <td className="problem-info">
                  <div className="problem-title">{problem.title}</div>
                  <div className="problem-category">{problem.category}</div>
                </td>

                <td className="problem-difficulty-cell">
                  <span className={`difficulty ${problem.difficulty.toLowerCase()}`}>
                    {problem.difficulty}
                  </span>
                  <span className="problem-row-arrow" aria-hidden="true">→</span>
                </td>
              </tr>
            ))}
            {filteredProblems.length === 0 && (
              <tr>
                <td className="problem-search-empty" colSpan="2">
                  <strong>No matching problems</strong>
                  <span>Try another problem name, topic, or difficulty.</span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default Problems
