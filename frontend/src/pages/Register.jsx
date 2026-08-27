import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    studentId: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await register(form);
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
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
            GS
          </span>
        </div>

        <div className="relative">
          <p className="ledger-heading text-paper/50 mb-4">Joineazy · Class Ledger</p>
          <h1 className="font-display text-4xl leading-[1.15] max-w-md">
            Two roles.
            <br />
            One <span className="italic text-brass">shared</span> ledger.
          </h1>
          <p className="text-paper/60 text-sm mt-6 max-w-sm leading-relaxed">
            Students form groups, add classmates, and confirm hand-ins. Professors post the work and
            watch it get checked off.
          </p>
        </div>

        <div className="relative flex items-center gap-6 text-xs font-mono uppercase tracking-widest text-paper/40">
          <span>Student</span>
          <span className="w-1 h-1 rounded-full bg-paper/30" />
          <span>Professor</span>
        </div>
      </div>

      {/* Right: form */}
      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <span className="w-9 h-9 rounded-full border-2 border-ink flex items-center justify-center font-display italic text-sm">
              GS
            </span>
            <span className="font-display text-lg">Joineazy</span>
          </div>

          <p className="ledger-heading mb-2">Register</p>
          <h2 className="font-display text-2xl text-ink mb-1">Open a new entry</h2>
          <p className="text-sm text-ink-soft mb-6">Tell us which side of the ledger you're on.</p>

          {error && (
            <div className="mb-5 text-sm text-stamp bg-stamp-soft/60 border border-stamp/30 rounded px-3.5 py-2.5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setForm({ ...form, role: 'student' })}
                className={`py-2.5 rounded text-sm font-semibold border transition-colors ${
                  form.role === 'student'
                    ? 'bg-ink text-paper border-ink'
                    : 'bg-card text-ink-soft border-line hover:border-ink/40'
                }`}
              >
                Student
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, role: 'admin' })}
                className={`py-2.5 rounded text-sm font-semibold border transition-colors ${
                  form.role === 'admin'
                    ? 'bg-ink text-paper border-ink'
                    : 'bg-card text-ink-soft border-line hover:border-ink/40'
                }`}
              >
                Professor
              </button>
            </div>

            <div>
              <label className="field-label">Full name</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="field-input"
                placeholder="Jane Doe"
              />
            </div>

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

            {form.role === 'student' && (
              <div>
                <label className="field-label">Student ID</label>
                <input
                  type="text"
                  required
                  value={form.studentId}
                  onChange={(e) => setForm({ ...form, studentId: e.target.value })}
                  className="field-input"
                  placeholder="STU001"
                />
              </div>
            )}

            <div>
              <label className="field-label">Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="field-input"
                placeholder="At least 8 characters"
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full !py-3 mt-2">
              {loading && <Loader size={15} light />}
              {loading ? 'Creating entry…' : 'Create account'}
            </button>
          </form>

          <p className="text-sm text-ink-soft text-center mt-7">
            Already registered?{' '}
            <Link to="/login" className="text-brass-dark font-semibold hover:text-ink">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}