import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import CourseCard from '../components/CourseCard';
import Loader from '../components/Loader';
import { useAuth } from '../context/AuthContext';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState('');
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

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

  const handleEnroll = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    if (!code.trim()) return;
    setEnrolling(true);
    try {
      const { data } = await api.post('/courses/enroll', { code: code.trim() });
      setNotice(`Enrolled in ${data.course.name}.`);
      setCode('');
      await loadCourses();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to enroll. Check the course code and try again.');
    } finally {
      setEnrolling(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <p className="ledger-heading mb-2">Your ledger</p>
        <h1 className="font-display text-3xl text-ink">Welcome back, {user?.name?.split(' ')[0]}</h1>
        <p className="text-ink-soft mt-1.5">Your enrolled courses. Open one to see its assignments.</p>

        <form onSubmit={handleEnroll} className="card-index mt-6 max-w-md">
          <label className="field-label">Join a course</label>
          <div className="flex gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Course code, e.g. DATA-C4EC"
              className="field-input font-mono uppercase"
            />
            <button type="submit" disabled={enrolling} className="btn-primary shrink-0 !px-4">
              {enrolling && <Loader size={14} light />}
              Join
            </button>
          </div>
          {error && <p className="text-sm text-stamp mt-2.5 animate-fade-up">{error}</p>}
          {notice && <p className="text-sm text-[#3E4F38] mt-2.5 animate-fade-up">{notice}</p>}
        </form>

        <div className="mt-8">
          <p className="ledger-heading mb-4">Enrolled courses</p>

          {loading ? (
            <div className="flex items-center gap-2 text-sm text-ink-soft font-mono">
              <Loader size={15} /> Loading courses…
            </div>
          ) : courses.length === 0 ? (
            <div className="card-index text-center py-10">
              <p className="text-ink-soft">You're not enrolled in any courses yet.</p>
              <p className="text-sm text-ink-faint mt-1">Ask your professor for a course code to join above.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.map((c) => (
                <CourseCard
                  key={c.id}
                  course={c}
                  to={`/courses/${c.id}`}
                  footer={
                    <span className="font-mono text-xs text-ink-faint">
                      {c.assignment_count} assignment{c.assignment_count !== '1' ? 's' : ''}
                    </span>
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