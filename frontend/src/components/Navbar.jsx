import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        <Link to={user?.role === 'admin' ? '/admin' : '/dashboard'} className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold text-sm">
            JE
          </div>
          <span className="font-semibold text-gray-800 text-lg">GroupSync</span>
        </Link>

        {user && (
          <div className="flex items-center gap-4">
            {user.role === 'student' && (
              <>
                <Link to="/dashboard" className="text-sm text-gray-600 hover:text-brand-600">
                  Dashboard
                </Link>
                <Link to="/groups" className="text-sm text-gray-600 hover:text-brand-600">
                  My Groups
                </Link>
                <Link to="/assignments" className="text-sm text-gray-600 hover:text-brand-600">
                  Assignments
                </Link>
              </>
            )}
            {user.role === 'admin' && (
              <>
                <Link to="/admin" className="text-sm text-gray-600 hover:text-brand-600">
                  Analytics
                </Link>
                <Link to="/admin/assignments" className="text-sm text-gray-600 hover:text-brand-600">
                  Assignments
                </Link>
                <Link to="/admin/groups" className="text-sm text-gray-600 hover:text-brand-600">
                  Groups
                </Link>
              </>
            )}
            <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
              <span className="text-sm text-gray-500 hidden sm:inline">
                {user.name} <span className="text-gray-300">·</span> {user.role}
              </span>
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-red-600 hover:text-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
