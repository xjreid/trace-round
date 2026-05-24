

import { useParams } from 'react-router-dom'
import { problems } from '../../data/problems'

function ProblemDetail() {
  const { slug } = useParams()

  const problem = problems.find((p) => p.slug === slug)


  if (!problem) {
  return (
    <section className="page">
      <h2>Problem not found</h2>
    </section>
  )
  }



  return (

    <section className="page">

      <h2>{problem.title}</h2>
      <p>Difficulty: {problem.difficulty}</p>
      <p>Category: {problem.category}</p>

    </section>
  )
}

export default ProblemDetail