

import { Link } from 'react-router-dom'
import { useState } from 'react'
import './Header.css'



function Header() {

    const [username, setUsername] = useState("Sign in");



    return (
        <header className="header">
            <div className = "header-shape">
                <h1 className="logo">TraceRound</h1>

                <nav className="nav">
                    <Link to="/">Home</Link>
                    <Link to="/problems">Problems</Link>
                    <Link to="/submissions">Submissions</Link>
                </nav>
            </div>

            <div className = "user-display">
                <p className="username">{username}</p>
            </div>


        </header>
    )
}

export default Header