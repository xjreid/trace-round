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
  onCloseRunResult,
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
        </div>
      </section>

      {runResult && (
        <div
          className="run-result-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              onCloseRunResult()
            }
          }}
        >
          <section
            className={`run-result-dialog run-result-dialog--${runResult.status}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="run-result-title"
            aria-describedby="run-result-output"
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                onCloseRunResult()
              }
            }}
          >
            <header className="run-result-dialog__header">
              <div>
                <span className="run-result-dialog__eyebrow">Code execution</span>
                <h2 id="run-result-title">{runResult.summary}</h2>
              </div>
              <button
                className="run-result-dialog__close-icon"
                type="button"
                aria-label="Close run results"
                onClick={onCloseRunResult}
                autoFocus
              >
                ×
              </button>
            </header>

            <div className="run-result-dialog__body">
              <div className="run-result-dialog__test-count">
                <strong>
                  {runResult.passedTests}
                  <small>/{runResult.totalTests}</small>
                </strong>
                <span>Test cases passed</span>
              </div>
              <div className="run-result-dialog__output">
                <span>Output</span>
                <p id="run-result-output">{runResult.output}</p>
              </div>
            </div>

            <footer className="run-result-dialog__footer">
              <button type="button" onClick={onCloseRunResult}>
                Close results
              </button>
            </footer>
          </section>
        </div>
      )}
    </div>
  )
}

export default ProblemWorkspace
