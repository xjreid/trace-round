import { Link } from 'react-router-dom'
import { FaGithub, FaLinkedinIn } from 'react-icons/fa6'
import './Footer.css'

const socialLinks = [
  {
    name: 'LinkedIn',
    url: 'https://www.linkedin.com/in/xavier-reid-0a1641424/',
    Icon: FaLinkedinIn,
  },
  {
    name: 'GitHub',
    url: 'https://github.com/xjreid',
    Icon: FaGithub,
  },
]

function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <Link className="site-footer__brand" to="/" aria-label="TraceRound home">
          TraceRound
        </Link>

        <nav className="site-footer__socials" aria-label="Xavier Reid social links">
          {socialLinks.map(({ name, url, Icon }) => (
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              aria-label={`Visit Xavier Reid on ${name}`}
              title={name}
              key={name}
            >
              <Icon aria-hidden="true" />
            </a>
          ))}
        </nav>
      </div>
    </footer>
  )
}

export default Footer
