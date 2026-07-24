



import './Problems.css'
import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { categories } from '../../data/categories'
import { createInterviewAccessPath } from './interviewNavigation'

const questionOptions = [
  { count: 1, duration: '25 minutes' },
  { count: 2, duration: '50 minutes' },
  { count: 3, duration: '1 hour 15 minutes' },
]

function CustomProblems() {
  const navigate = useNavigate()
  const [selectedCategories, setSelectedCategories] = useState([])
  const [questionCount, setQuestionCount] = useState(1)
  const selectedDuration = questionOptions.find(
    (option) => option.count === questionCount,
  ).duration

  function toggleCategory(category) {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter((item) => item !== category))
    } else {
      setSelectedCategories([...selectedCategories, category])
    }
  }

  function checkStart() {
    if (selectedCategories.length > 0) {
      const input = selectedCategories
        .map((category) => encodeURIComponent(category))
        .join('~')

      navigate(
        createInterviewAccessPath(
          `/customproblems/${input}/${questionCount}`,
        ),
      )
    }
  }

  return (
    <section className="page problems-page">
      <header className="practice-page-header">
        <p className="practice-page-kicker">Custom interview</p>
        <h2 className="page-title">Build a session around your goals.</h2>
        <p className="practice-page-description">
          Select the topics you want to strengthen and choose a session length
          that fits your practice goals.
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

      <div className="problems-container custom-problems-container">
        <div className="custom-selector-header">
          <div>
            <span className="selector-label">Interview topics</span>
            <p>Choose one or more areas to shape your session.</p>
          </div>
          <span className="selection-count">
            {selectedCategories.length} selected
          </span>
        </div>

        <div className="categories-list">
          {categories.map((category) => (
            <button
              type="button"
              className={`category-item ${
                selectedCategories.includes(category) ? 'selected' : ''
              }`}
              key={category}
              onClick={() => toggleCategory(category)}
              aria-pressed={selectedCategories.includes(category)}
            >
              <span className="category-check" aria-hidden="true">
                {selectedCategories.includes(category) ? '✓' : '+'}
              </span>
              <span className="category-text">{category}</span>
            </button>
          ))}
        </div>

        <div className="custom-selector-footer">
          <p>
            Average interview time: {selectedDuration}.
            {selectedCategories.length === 0 &&
              ' Select at least one topic to continue.'}
          </p>
          <div className="custom-build-controls">
            <fieldset className="question-count-picker">
              <legend>Questions</legend>
              <div>
                {questionOptions.map((option) => (
                  <button
                    type="button"
                    className={questionCount === option.count ? 'active' : ''}
                    aria-pressed={questionCount === option.count}
                    onClick={() => setQuestionCount(option.count)}
                    title={`${option.count} ${option.count === 1 ? 'question' : 'questions'} — about ${option.duration}`}
                    key={option.count}
                  >
                    {option.count}
                  </button>
                ))}
              </div>
            </fieldset>
            <button
              type="button"
              className="start-button"
              onClick={checkStart}
              disabled={selectedCategories.length === 0}
            >
              Build interview
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default CustomProblems
