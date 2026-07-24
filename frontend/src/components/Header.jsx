import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/authContext'
import './Header.css'

function Header() {
  const { user, isAuthLoading, signOut } = useAuth()

  return (
    <header className="header">
      <div className="header-shape">
        <Link className="logo" to="/" aria-label="TraceRound home">
          TraceRound
        </Link>

        <nav className="nav" aria-label="Main navigation">
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/problems">Problems</NavLink>
          <NavLink to="/submissions">Submissions</NavLink>
        </nav>
      </div>

      {!isAuthLoading && (
        user ? (
          <div className="user-account">
            <span className="user-avatar" aria-hidden="true">
              {user.name.charAt(0)}
            </span>
            <span className="username">{user.name}</span>
            <button type="button" onClick={signOut}>Sign out</button>
          </div>
        ) : (
          <Link className="user-display" to="/signin">
            Sign in
          </Link>
        )
      )}
    </header>
  )
}

export default Header
