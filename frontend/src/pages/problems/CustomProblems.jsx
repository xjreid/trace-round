



import './Problems.css'
import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { categories } from '../../data/categories'

function CustomProblems() {
  const navigate = useNavigate()
  const [selectedCategories, setSelectedCategories] = useState([])

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

      navigate(`/customproblems/${input}`)
    }
  }

  return (
    <section className="page problems-page">
      <h2 className="page-title">Start Practice</h2>

      <nav className="problems-nav">
        <NavLink to="/problems" end>
          Single Problem
        </NavLink>
        <NavLink to="/customproblems" end>
          Custom Interview
        </NavLink>
      </nav>

      <div className="problems-container">
        <button className="start-button" onClick={checkStart}>
          Begin
        </button>

        <div className="categories-list">
          {categories.map((category) => (
            <div
              className={`category-item ${
                selectedCategories.includes(category) ? 'selected' : ''
              }`}
              key={category}
              onClick={() => toggleCategory(category)}
            >
              <h3 className="category-text">{category}</h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default CustomProblems