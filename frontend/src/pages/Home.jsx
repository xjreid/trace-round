import { Link } from 'react-router-dom'
import './Home.css'

const interviewSteps = [
  {
    number: '01',
    title: 'Choose your format',
    description: 'Pick one problem for focused practice or build an interview around the topics you want to sharpen.',
  },
  {
    number: '02',
    title: 'Work through it live',
    description: 'Solve the interview in a realistic workspace while TraceRound follows your approach and progress.',
  },
  {
    number: '03',
    title: 'Review your feedback',
    description: 'Finish on a dedicated feedback page with real-time observations, critique, and clear next steps.',
  },
]

function Home() {
  return (
    <div className="home-page">
      <section className="home-hero" aria-labelledby="home-title">
        <div className="hero-glow hero-glow-one" aria-hidden="true" />
        <div className="hero-glow hero-glow-two" aria-hidden="true" />

        <div className="hero-copy">
          <p className="eyebrow">
            <span className="eyebrow-dot" aria-hidden="true" />
            Technical interview practice, refined
          </p>

          <h2 id="home-title">
            Practice the interview.
            <span>Understand the signal.</span>
          </h2>

          <p className="hero-description">
            Create realistic mock technical interviews and get useful feedback
            on how you solve—not just whether your final answer is correct.
          </p>

          <div className="hero-actions">
            <Link className="button button-primary" to="/problems">
              Start a problem
              <span aria-hidden="true">→</span>
            </Link>
            <Link className="button button-secondary" to="/customproblems">
              Build an interview
            </Link>
          </div>

          <p className="hero-footnote">
            No login required to practice. Sign in before you start to save your feedback.
          </p>
        </div>

        <div className="feedback-preview" aria-label="Example live interview feedback">
          <div className="preview-header">
            <div className="window-dots" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <span className="preview-label">Live interview</span>
            <span className="live-status">
              <span aria-hidden="true" />
              In progress
            </span>
          </div>

          <div className="preview-code" aria-hidden="true">
            <div><span className="line-number">1</span><span className="code-purple">function</span> twoSum(nums, target) {'{'}</div>
            <div><span className="line-number">2</span>&nbsp;&nbsp;<span className="code-purple">const</span> seen = <span className="code-blue">new</span> Map()</div>
            <div><span className="line-number">3</span>&nbsp;&nbsp;<span className="code-purple">for</span> (<span className="code-purple">let</span> i = 0; i &lt; nums.length; i++) {'{'}</div>
            <div><span className="line-number">4</span>&nbsp;&nbsp;&nbsp;&nbsp;<span className="code-purple">const</span> complement = target - nums[i]</div>
            <div className="active-code-line"><span className="line-number">5</span>&nbsp;&nbsp;&nbsp;&nbsp;<span className="code-purple">if</span> (seen.has(complement)) {'{'}</div>
            <div><span className="line-number">6</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="code-purple">return</span> [seen.get(complement), i]</div>
          </div>

          <div className="feedback-note">
            <div className="feedback-note-top">
              <span className="signal-icon" aria-hidden="true">↗</span>
              <strong>Strong approach</strong>
              <span className="timestamp">just now</span>
            </div>
            <p>
              You moved from a brute-force idea to a hash map and explained the
              time-space tradeoff clearly.
            </p>
          </div>

          <div className="preview-metrics">
            <div>
              <span>Communication</span>
              <strong>Clear</strong>
            </div>
            <div>
              <span>Complexity</span>
              <strong>O(n)</strong>
            </div>
            <div>
              <span>Progress</span>
              <strong>68%</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="practice-section" aria-labelledby="practice-title">
        <div className="section-heading">
          <p className="section-kicker">Practice your way</p>
          <h2 id="practice-title">One session. Two ways to begin.</h2>
          <p>Target a specific skill or recreate the shape of a full technical screen.</p>
        </div>

        <div className="practice-grid">
          <article className="practice-card">
            <div className="card-topline">
              <span className="card-index">01</span>
              <span className="card-tag">Focused practice</span>
            </div>
            <h3>Choose a single problem</h3>
            <p>
              Browse problems by topic and difficulty, then give one challenge
              your full attention in the interview workspace.
            </p>
            <ul>
              <li>Practice a specific pattern</li>
              <li>Work at your preferred difficulty</li>
              <li>Get focused feedback when you finish</li>
            </ul>
            <Link className="card-link" to="/problems">
              Browse problems <span aria-hidden="true">→</span>
            </Link>
          </article>

          <article className="practice-card featured-card">
            <div className="card-topline">
              <span className="card-index">02</span>
              <span className="card-tag">Custom session</span>
            </div>
            <h3>Curate a custom interview</h3>
            <p>
              Select the topics you want to practice and create a tailored mock
              interview built around your goals.
            </p>
            <ul>
              <li>Combine multiple technical topics</li>
              <li>Prepare for a specific interview</li>
              <li>Review feedback across the full session</li>
            </ul>
            <Link className="card-link" to="/customproblems">
              Create an interview <span aria-hidden="true">→</span>
            </Link>
          </article>
        </div>
      </section>

      <section className="workflow-section" aria-labelledby="workflow-title">
        <div className="section-heading workflow-heading">
          <p className="section-kicker">How TraceRound works</p>
          <h2 id="workflow-title">From first thought to better habits.</h2>
        </div>

        <ol className="workflow-list">
          {interviewSteps.map((step) => (
            <li key={step.number}>
              <span className="step-number">{step.number}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="save-feedback-section" aria-labelledby="save-title">
        <div className="save-copy">
          <p className="section-kicker">Build a record of your progress</p>
          <h2 id="save-title">Keep the feedback that moves you forward.</h2>
          <p>
            Every completed mock interview ends on a feedback page. Sign in
            while completing problems and TraceRound will also save that
            feedback to your Submissions page, so you can revisit past sessions
            and track what is improving.
          </p>
        </div>
        <div className="save-path" aria-label="How saved feedback works">
          <div>
            <span>1</span>
            <p><strong>Sign in</strong> before starting</p>
          </div>
          <span className="path-line" aria-hidden="true" />
          <div>
            <span>2</span>
            <p><strong>Complete</strong> your interview</p>
          </div>
          <span className="path-line" aria-hidden="true" />
          <div>
            <span>3</span>
            <p><strong>Review</strong> it in Submissions</p>
          </div>
        </div>
      </section>

      <section className="final-cta">
        <p className="section-kicker">Your next round starts here</p>
        <h2>Turn practice into a repeatable advantage.</h2>
        <p>Pick a problem, explain your thinking, and leave with something concrete to improve.</p>
        <Link className="button button-primary" to="/problems">
          Start practicing
          <span aria-hidden="true">→</span>
        </Link>
      </section>
    </div>
  )
}

export default Home
