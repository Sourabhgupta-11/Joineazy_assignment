import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import CourseCard from '../components/CourseCard';
import Loader from '../components/Loader';

export default function AdminDashboard() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [newCode, setNewCode] = useState('');

  const loadCourses = async () => {
    const { data } = await api.get('/courses/mine');
    setCourses(data.courses);
  };

  useEffect(() => {
    (async () => {
      await loadCourses();
      setLoading(false);
    })();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) return;
    setCreating(true);
    try {
      const { data } = await api.post('/courses', form);
      setNewCode(data.course.code);
      setForm({ name: '', description: '' });
      setShowForm(false);
      await loadCourses();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create course.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-start sm:items-end justify-between gap-4 flex-wrap">
          <div>
            <p className="ledger-heading mb-2">Your courses</p>
            <h1 className="font-display text-3xl text-ink">Courses</h1>
          </div>
          <button onClick={() => setShowForm((s) => !s)} className="btn-primary">
            {showForm ? 'Cancel' : '+ New course'}
          </button>
        </div>

        {newCode && (
          <div className="mt-6 border border-brass/40 bg-brass-soft/40 text-brass-dark text-sm rounded-md px-4 py-3 animate-fade-up">
            Course created. Share this join code with students:{' '}
            <span className="font-mono font-semibold">{newCode}</span>
          </div>
        )}

        {showForm && (
          <form onSubmit={handleCreate} className="card-index mt-6 max-w-lg space-y-4">
            {error && (
              <div className="text-sm text-stamp bg-stamp-soft/60 border border-stamp/30 rounded px-3.5 py-2.5">
                {error}
              </div>
            )}
            <div>
              <label className="field-label">Course name</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="field-input"
                placeholder="e.g. Data Structures"
              />
            </div>
            <div>
              <label className="field-label">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="field-input"
                placeholder="Optional short description"
              />
            </div>
            <button type="submit" disabled={creating} className="btn-primary">
              {creating && <Loader size={14} light />}
              {creating ? 'Creating…' : 'Create course'}
            </button>
          </form>
        )}

        <div className="mt-8">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-ink-soft font-mono">
              <Loader size={15} /> Loading courses…
            </div>
          ) : courses.length === 0 ? (
            <div className="card-index text-center py-10">
              <p className="text-ink-soft">You haven't created a course yet.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.map((c) => (
                <CourseCard
                  key={c.id}
                  course={c}
                  to={`/admin/courses/${c.id}`}
                  footer={
                    <div className="flex justify-between font-mono text-xs text-ink-faint">
                      <span>{c.student_count} student{c.student_count !== '1' ? 's' : ''}</span>
                      <span>{c.assignment_count} assignment{c.assignment_count !== '1' ? 's' : ''}</span>
                    </div>
                  }
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}