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
}) {
  return (
    <div className={`problem-workspace ${className}`.trim()}>
      <article className="problem-panel problem-panel--details">
        {showStart && (
          <div className="problem-panel__toolbar problem-panel__toolbar--centered">
            <button
              className="workspace-button workspace-button--start"
              type="button"
              onClick={onStart}
            >
              Start
            </button>
          </div>
        )}

        <div className="problem-details">
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

          <button
            className="workspace-button workspace-button--run"
            type="button"
            onClick={onRun}
          >
            Run
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
    </div>
  )
}

export default ProblemWorkspace
