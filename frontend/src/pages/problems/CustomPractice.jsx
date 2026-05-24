



import { useParams } from 'react-router-dom'

function CustomPractice() {
  const { input } = useParams()

  const categories = input
    .split('~')
    .map((category) => decodeURIComponent(category))

  return (
    <section className="page">
      <h2>Custom Practice</h2>

      <p>Selected categories:</p>

      <ul>
        {categories.map((category) => (
          <li key={category}>{category}</li>
        ))}
      </ul>
    </section>
  )
}

export default CustomPractice