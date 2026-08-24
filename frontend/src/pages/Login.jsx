import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left: identity panel */}
      <div className="hidden lg:flex flex-col justify-between bg-ink text-paper p-12 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: 'radial-gradient(#F7F1E4 1px, transparent 1px)',
            backgroundSize: '26px 26px',
          }}
        />
        <div className="relative">
          <span className="w-11 h-11 rounded-full border-2 border-paper/70 flex items-center justify-center font-display italic text-base">
            JE
          </span>
        </div>

        <div className="relative">
          <p className="ledger-heading text-paper/50 mb-4">GroupSync · Class Ledger</p>
          <h1 className="font-display text-4xl leading-[1.15] max-w-md">
            Every group.
            <br />
            Every hand-in.
            <br />
            <span className="italic text-brass">Stamped</span> when it&apos;s done.
          </h1>
          <p className="text-paper/60 text-sm mt-6 max-w-sm leading-relaxed">
            Students form their own groups and confirm submissions with one final stamp. Professors
            watch the whole class ledger fill in, live.
          </p>
        </div>

        <div className="relative flex items-center gap-6 text-xs font-mono uppercase tracking-widest text-paper/40">
          <span>Roll call</span>
          <span className="w-1 h-1 rounded-full bg-paper/30" />
          <span>Confirm</span>
          <span className="w-1 h-1 rounded-full bg-paper/30" />
          <span>Track</span>
        </div>
      </div>

      {/* Right: form */}
      <div className="flex items-center justify-center px-4 py-12 sm:py-16">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <span className="w-9 h-9 rounded-full border-2 border-ink flex items-center justify-center font-display italic text-sm">
              JE
            </span>
            <span className="font-display text-lg">groupSync</span>
          </div>

          <p className="ledger-heading mb-2">Sign in</p>
          <h2 className="font-display text-2xl text-ink mb-1">Welcome back</h2>
          <p className="text-sm text-ink-soft mb-7">Log in to pick up where your group left off.</p>

          {error && (
            <div className="mb-5 text-sm text-stamp bg-stamp-soft/60 border border-stamp/30 rounded px-3.5 py-2.5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="field-label">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="field-input"
                placeholder="you@college.edu"
              />
            </div>
            <div>
              <label className="field-label">Password</label>
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="field-input"
                placeholder="••••••••"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full !py-3 mt-2">
              {loading ? 'Signing in…' : 'Log in'}
            </button>
          </form>

          <p className="text-sm text-ink-soft text-center mt-7">
            New here?{' '}
            <Link to="/register" className="text-brass-dark font-semibold hover:text-ink">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}