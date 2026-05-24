

import './Problems.css'
import { problems } from '../../data/problems'
import { NavLink, useNavigate } from 'react-router-dom'

function Problems() {
  const navigate = useNavigate()

  const handleProblemClick = (problemSlug) => {
    navigate(`/problems/${problemSlug}`)
  }

  return (
    <section className="page problems-page">
      <h2 className="page-title">Start Practice</h2>


      <nav className = "problems-nav">
        <NavLink to="/problems" end>
          Single Problem
        </NavLink>
        <NavLink to="/customproblems" end>
          Custom Interview
        </NavLink>
      </nav>
      



      <div className="problems-container">
        <table className="problems-table">
          <tbody>
            {problems.map((problem) => (
              <tr className="problem-row" key={problem.id} onClick={() => handleProblemClick(problem.slug)}>
                <td className="problem-info">
                  <div className="problem-title">{problem.title}</div>
                  <div className="problem-category">{problem.category}</div>
                </td>

                <td className="problem-difficulty-cell">
                  <span className={`difficulty ${problem.difficulty.toLowerCase()}`}>
                    {problem.difficulty}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default Problems