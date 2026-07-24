import CodeMirror from '@uiw/react-codemirror'
import {
  editorSetup,
  languageExtensions,
  languages,
} from './problemEditorConfig'
import './ActiveProblem.css'

function ProblemWorkspace({
  problem,
  language,
  code,
  onLanguageChange,
  onCodeChange,
  onStart,
  onRun,
  className = '',
  showStart = true,
  actionLabel = 'Start interview',
  actionVariant = 'start',
  runResult = null,
  isRunning = false,
}) {
  return (
    <div className={`problem-workspace ${className}`.trim()}>
      <article className="problem-panel problem-panel--details">
        <div className="problem-panel__toolbar problem-brief-toolbar">
          <div>
            <span className="toolbar-kicker">Interview prompt</span>
            <span className="toolbar-status">
              <span aria-hidden="true" />
              Ready
            </span>
          </div>
          {showStart && (
            <button
              className={`workspace-button workspace-button--${actionVariant}`}
              type="button"
              onClick={onStart}
            >
              {actionLabel}
            </button>
          )}
        </div>

        <div className="problem-details">
          <p className="problem-details__eyebrow">Problem brief</p>
          <h2 className="problem-details__title">{problem.title}</h2>

          <div className="problem-details__metadata">
            <span className="problem-details__category">{problem.category}</span>
            <span className={`difficulty ${problem.difficulty.toLowerCase()}`}>
              {problem.difficulty}
            </span>
          </div>

          <div className="problem-details__description">
            <p>{problem.desc}</p>
          </div>
        </div>
      </article>

      <section className="problem-panel problem-panel--editor" aria-label="Code editor">
        <div className="problem-panel__toolbar editor-toolbar">
          <div className="editor-toolbar__context">
            <span className="toolbar-kicker">Solution workspace</span>
            <label className="language-select">
              <span className="language-select__label">Language</span>
              <select
                value={language}
                onChange={(event) => onLanguageChange(event.target.value)}
                aria-label="Programming language"
              >
                {languages.map((option) => (
                  <option value={option} key={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <button
            className="workspace-button workspace-button--run"
            type="button"
            onClick={onRun}
            disabled={isRunning}
          >
            {isRunning ? 'Running...' : 'Run code'}
          </button>
        </div>

        <div className="code-editor">
          <div className="code-editor__header">
            <span>{language}</span>
            <span className="code-editor__status">Draft</span>
          </div>
          <CodeMirror
            className="code-editor__input"
            value={code}
            onChange={onCodeChange}
            placeholder={`Write your ${language} solution here...`}
            extensions={languageExtensions[language]}
            basicSetup={editorSetup}
            indentWithTab
            theme="dark"
            height="100%"
            aria-label={`${language} code editor`}
          />
          {runResult && (
            <div className={`code-run-result code-run-result--${runResult.status}`}>
              <div>
                <strong>{runResult.summary}</strong>
                {runResult.totalTests > 0 && (
                  <span>
                    {runResult.passedTests}/{runResult.totalTests} checks passed
                  </span>
                )}
              </div>
              <p>{runResult.output}</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default ProblemWorkspace
