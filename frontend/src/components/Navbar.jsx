import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function NavLink({ to, children }) {
  const location = useLocation();
  const active = location.pathname === to;
  return (
    <Link
      to={to}
      className={`text-sm font-medium pb-1 border-b-2 transition-colors ${
        active ? 'text-ink border-brass' : 'text-ink-soft border-transparent hover:text-ink hover:border-line'
      }`}
    >
      {children}
    </Link>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-card border-b-[3px] border-double border-ink sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
        <Link to={user?.role === 'admin' ? '/admin' : '/dashboard'} className="flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-full border-2 border-ink flex items-center justify-center font-display italic text-sm text-ink">
            GS
          </span>
          <span className="font-display text-lg text-ink">GroupSync</span>
        </Link>

        {user && (
          <div className="flex items-center gap-5">
            {user.role === 'student' && (
              <>
                <NavLink to="/dashboard">Dashboard</NavLink>
                <NavLink to="/groups">Groups</NavLink>
                <NavLink to="/assignments">Assignments</NavLink>
              </>
            )}
            {user.role === 'admin' && (
              <>
                <NavLink to="/admin">Analytics</NavLink>
                <NavLink to="/admin/assignments">Assignments</NavLink>
                <NavLink to="/admin/groups">Groups</NavLink>
              </>
            )}
            <div className="flex items-center gap-3 pl-4 border-l border-line">
              <span className="hidden sm:flex flex-col items-end leading-tight">
                <span className="text-xs font-semibold text-ink">{user.name}</span>
                <span className="font-mono text-[0.65rem] uppercase tracking-wider text-ink-faint">
                  {user.role}
                </span>
              </span>
              <button
                onClick={handleLogout}
                className="text-xs font-mono font-semibold uppercase tracking-wider text-stamp hover:text-ink transition-colors"
              >
                Log out
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}