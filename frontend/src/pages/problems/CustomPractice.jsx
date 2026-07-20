



import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { problems } from '../../data/problems'
import { requestPracticeProblemSlugs } from '../../services/practiceProblems'
import ProblemWorkspace from './ProblemWorkspace'
import { languages } from './problemEditorConfig'

function decodeCategories(input) {
  return input
    .split('~')
    .filter(Boolean)
    .map((category) => decodeURIComponent(category))
}

async function startCustomPracticeSession({ selectedProblems, categories }) {
  // TODO: Connect this function to the backend session endpoint.
  void selectedProblems
  void categories
}

async function runCustomProblemCode({
  problem,
  categories,
  questionNumber,
  language,
  code,
}) {
  // TODO: Connect this function to the backend code execution endpoint.
  void problem
  void categories
  void questionNumber
  void language
  void code
}

function CustomPractice() {
  const { input } = useParams()
  const categories = useMemo(() => decodeCategories(input), [input])
  const [problemSlugs, setProblemSlugs] = useState([])
  const [activeQuestion, setActiveQuestion] = useState(0)
  const [editorStates, setEditorStates] = useState({})
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    let isCurrentRequest = true

    async function loadPracticeProblems() {
      setStatus('loading')

      try {
        const slugs = await requestPracticeProblemSlugs(categories)
        const validSlugs = slugs.filter((slug) =>
          problems.some((problem) => problem.slug === slug),
        )

        if (validSlugs.length !== 4) {
          throw new Error('The practice set must contain four valid problem slugs.')
        }

        if (isCurrentRequest) {
          setProblemSlugs(validSlugs)
          setActiveQuestion(0)
          setEditorStates({})
          setStatus('ready')
        }
      } catch {
        if (isCurrentRequest) {
          setStatus('error')
        }
      }
    }

    loadPracticeProblems()

    return () => {
      isCurrentRequest = false
    }
  }, [categories])

  const selectedProblems = problemSlugs.map((slug) =>
    problems.find((problem) => problem.slug === slug),
  )
  const activeProblem = selectedProblems[activeQuestion]
  const activeEditorState = activeProblem
    ? editorStates[activeProblem.slug] ?? {
        language: languages[0],
        code: '',
      }
    : null

  const updateActiveEditor = (updates) => {
    if (!activeProblem) {
      return
    }

    setEditorStates((currentStates) => ({
      ...currentStates,
      [activeProblem.slug]: {
        language: languages[0],
        code: '',
        ...currentStates[activeProblem.slug],
        ...updates,
      },
    }))
  }

  if (status === 'loading') {
    return (
      <section className="active-problem practice-state">
        <p className="practice-state__eyebrow">Custom practice</p>
        <h2>Preparing your questions...</h2>
      </section>
    )
  }

  if (status === 'error' || !activeProblem || !activeEditorState) {
    return (
      <section className="active-problem practice-state">
        <p className="practice-state__eyebrow">Custom practice</p>
        <h2>Unable to create this practice set</h2>
        <p>Please return to the problem selector and try again.</p>
      </section>
    )
  }

  return (
    <section className="active-problem active-problem--practice">
      <div className="practice-session-controls">
        <button
          className="workspace-button workspace-button--start practice-session-start"
          type="button"
          onClick={() =>
            startCustomPracticeSession({ selectedProblems, categories })
          }
        >
          Start
        </button>

        <nav className="practice-question-nav" aria-label="Practice questions">
          <div className="practice-question-nav__tabs" role="tablist">
            {selectedProblems.map((problem, index) => (
              <button
                className={`practice-question-tab ${
                  activeQuestion === index ? 'active' : ''
                }`}
                type="button"
                role="tab"
                aria-selected={activeQuestion === index}
                aria-controls="active-practice-question"
                aria-label={`Question ${index + 1}: ${problem.title}`}
                onClick={() => setActiveQuestion(index)}
                key={problem.slug}
              >
                Q{index + 1}
              </button>
            ))}
          </div>
        </nav>
      </div>

      <div id="active-practice-question" role="tabpanel">
        <ProblemWorkspace
          className="problem-workspace--practice"
          problem={activeProblem}
          language={activeEditorState.language}
          code={activeEditorState.code}
          onLanguageChange={(language) => updateActiveEditor({ language })}
          onCodeChange={(code) => updateActiveEditor({ code })}
          showStart={false}
          onRun={() =>
            runCustomProblemCode({
              problem: activeProblem,
              categories,
              questionNumber: activeQuestion + 1,
              language: activeEditorState.language,
              code: activeEditorState.code,
            })
          }
          key={activeProblem.slug}
        />
      </div>
    </section>
  )
}

export default CustomPractice
