import { NavLink } from 'react-router-dom'
import { APP_NAME } from '../../constants/app'

export default function Navbar() {
  return (
    <header className="topbar-wrap">
      <nav className="topbar" aria-label="Global navigation">
        <div className="brand-block">
          <span className="brand-dot" aria-hidden="true" />
          <strong>{APP_NAME}</strong>
        </div>

        <ul className="topbar-links">
          <li>
            <NavLink to="/">Trang chu</NavLink>
          </li>
          <li>
            <NavLink to="/restaurants">Quan ly nha hang</NavLink>
          </li>
        </ul>

        <button type="button" className="topbar-cta">
          Dang nhap
        </button>
      </nav>
    </header>
  )
}
