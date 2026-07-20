import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { problems } from '../../data/problems'
import ProblemWorkspace from './ProblemWorkspace'
import { languages } from './problemEditorConfig'

async function startProblemSession(problem) {
  // TODO: Connect this function to the backend session endpoint.
  void problem
}

async function runCodeSubmission({ problem, language, code }) {
  // TODO: Connect this function to the backend code execution endpoint.
  void problem
  void language
  void code
}

function ProblemDetails() {
  const { slug } = useParams()
  const problem = problems.find((p) => p.slug === slug)
  const [language, setLanguage] = useState(languages[0])
  const [code, setCode] = useState('')

  const handleStart = () => {
    startProblemSession(problem)
  }

  const handleRun = () => {
    runCodeSubmission({ problem, language, code })
  }

  if (!problem) {
    return (
      <section className="problem-not-found">
        <p className="problem-not-found__eyebrow">404</p>
        <h2>Problem not found</h2>
        <p>The requested coding problem does not exist.</p>
      </section>
    )
  }

  return (
    <section className="active-problem">
      <ProblemWorkspace
        problem={problem}
        language={language}
        code={code}
        onLanguageChange={setLanguage}
        onCodeChange={setCode}
        onStart={handleStart}
        onRun={handleRun}
      />
    </section>
  )
}

export default ProblemDetails
