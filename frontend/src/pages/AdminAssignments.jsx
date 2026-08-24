import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import Navbar from '../components/Navbar';

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [groups, setGroups] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    dueDate: '',
    onedriveLink: '',
    targetType: 'all',
    groupIds: [],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [submissionDetail, setSubmissionDetail] = useState({});

  const loadAssignments = async () => {
    const { data } = await api.get('/assignments');
    setAssignments(data.assignments);
  };

  const loadGroups = async () => {
    const { data } = await api.get('/groups');
    setGroups(data.groups);
  };

  useEffect(() => {
    loadAssignments();
    loadGroups();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.post('/assignments', {
        ...form,
        dueDate: new Date(form.dueDate).toISOString(),
      });
      setForm({ title: '', description: '', dueDate: '', onedriveLink: '', targetType: 'all', groupIds: [] });
      setShowForm(false);
      await loadAssignments();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create assignment.');
    } finally {
      setSaving(false);
    }
  };

  const toggleExpand = async (assignmentId) => {
    if (expandedId === assignmentId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(assignmentId);
    if (!submissionDetail[assignmentId]) {
      const { data } = await api.get(`/submissions/assignment/${assignmentId}`);
      setSubmissionDetail((prev) => ({ ...prev, [assignmentId]: data }));
    }
  };

  const toggleGroupSelection = (groupId) => {
    setForm((prev) => {
      const exists = prev.groupIds.includes(groupId);
      return {
        ...prev,
        groupIds: exists ? prev.groupIds.filter((id) => id !== groupId) : [...prev.groupIds, groupId],
      };
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Assignments</h1>
            <p className="text-gray-500 mt-1 text-sm">Create assignments and monitor group submissions.</p>
          </div>
          <button
            onClick={() => setShowForm((s) => !s)}
            className="px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700"
          >
            {showForm ? 'Cancel' : '+ New Assignment'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="mt-6 bg-white border border-gray-200 rounded-xl p-6 space-y-4">
            {error && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                placeholder="e.g. Assignment 3: Database Design"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                placeholder="Brief description of the assignment"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input
                  type="datetime-local"
                  required
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">OneDrive Link</label>
                <input
                  type="url"
                  required
                  value={form.onedriveLink}
                  onChange={(e) => setForm({ ...form, onedriveLink: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                  placeholder="https://onedrive.live.com/..."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Assign to</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, targetType: 'all', groupIds: [] })}
                  className={`px-3 py-1.5 rounded-lg text-sm border ${
                    form.targetType === 'all'
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'bg-white text-gray-600 border-gray-300'
                  }`}
                >
                  All Students
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, targetType: 'group' })}
                  className={`px-3 py-1.5 rounded-lg text-sm border ${
                    form.targetType === 'group'
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'bg-white text-gray-600 border-gray-300'
                  }`}
                >
                  Specific Groups
                </button>
              </div>

              {form.targetType === 'group' && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {groups.map((g) => (
                    <button
                      type="button"
                      key={g.id}
                      onClick={() => toggleGroupSelection(g.id)}
                      className={`px-3 py-1 rounded-full text-xs border ${
                        form.groupIds.includes(g.id)
                          ? 'bg-brand-100 text-brand-700 border-brand-300'
                          : 'bg-white text-gray-600 border-gray-300'
                      }`}
                    >
                      {g.name}
                    </button>
                  ))}
                  {groups.length === 0 && <p className="text-xs text-gray-500">No groups exist yet.</p>}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 disabled:opacity-60"
            >
              {saving ? 'Creating...' : 'Create Assignment'}
            </button>
          </form>
        )}

        <div className="mt-6 space-y-3">
          {assignments.map((a) => {
            const detail = submissionDetail[a.id];
            return (
              <div key={a.id} className="bg-white border border-gray-200 rounded-xl">
                <button
                  onClick={() => toggleExpand(a.id)}
                  className="w-full text-left px-5 py-4 flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold text-gray-800">{a.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Due {formatDate(a.due_date)}</p>
                  </div>
                  <span className="text-xs text-gray-400">{expandedId === a.id ? 'Hide' : 'View submissions'}</span>
                </button>

                {expandedId === a.id && (
                  <div className="border-t border-gray-100 px-5 py-4">
                    {!detail ? (
                      <p className="text-sm text-gray-500">Loading...</p>
                    ) : (
                      <>
                        <p className="text-xs text-gray-500 mb-3">
                          {detail.summary.confirmed} of {detail.summary.total} groups confirmed
                        </p>
                        <div className="divide-y divide-gray-100">
                          {detail.submissions.map((s) => (
                            <div key={s.id} className="flex items-center justify-between py-2">
                              <span className="text-sm text-gray-700">
                                {s.group_name}{' '}
                                <span className="text-xs text-gray-400">({s.member_count} members)</span>
                              </span>
                              <span
                                className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                  s.status === 'confirmed'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-amber-100 text-amber-700'
                                }`}
                              >
                                {s.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {assignments.length === 0 && (
            <div className="bg-white rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-500">
              No assignments created yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
