import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
import Sidebar from './Sidebar.jsx';
import { firstName } from '../lib/format.js';
import './Header.css';

export default function Header() {
  const { user, loading, isAdmin } = useAuth();
  const [drawer, setDrawer] = useState(false);
  const nav = useNavigate();

  return (
    <>
      <header className="hd">
        <div className="shell hd__in">
          {/* Brand always goes to "/" so logged-in users can reach the Heritage state explorer */}
          <Link to="/" className="hd__brand">
            CraftTrail
            <span className="hd__tag script">craft you didn't know to look for</span>
          </Link>

          <nav className="hd__nav">
            <NavLink to="/discover" className={({ isActive }) => (isActive ? 'is-on' : '')}>
              Discover
            </NavLink>

            {/* Heritage Explorer — only visible when logged in, goes to landing page state cards */}
            {!loading && user && (
              <NavLink to="/" end className={({ isActive }) => (isActive ? 'is-on' : '')}>
                🏛 Heritage
              </NavLink>
            )}

            {/* My Craft Journey map — saved & visited artisans */}
            {!loading && user && (
              <NavLink to="/journey" className={({ isActive }) => (isActive ? 'is-on' : '')}>
                🗺️ My Journey
              </NavLink>
            )}

            {isAdmin && (
              <NavLink to="/admin" className={({ isActive }) => (isActive ? 'is-on' : '')}>
                Admin
              </NavLink>
            )}

            {/* never flash "Sign in" at somebody who is already signed in */}
            {!loading && !user && (
              <>
                <button className="hd__link" onClick={() => nav('/signin')}>Log in</button>
                <button className="btn btn-primary btn-sm" onClick={() => nav('/signup')}>Join free</button>
              </>
            )}
            {!loading && user && (
              <span className="hd__hello">
                Hi, {firstName(user.name)}
              </span>
            )}

            <button
              className="hd__menu"
              onClick={() => setDrawer(true)}
              aria-label="Open menu"
              aria-expanded={drawer}
            >
              <span /><span /><span />
            </button>
          </nav>
        </div>
      </header>

      <Sidebar open={drawer} onClose={() => setDrawer(false)} />
    </>
  );
}
