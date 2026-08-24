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
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-start sm:items-end justify-between gap-4 flex-wrap">
          <div>
            <p className="ledger-heading mb-2">Post & track</p>
            <h1 className="font-display text-3xl text-ink">Assignments</h1>
          </div>
          <button onClick={() => setShowForm((s) => !s)} className="btn-primary">
            {showForm ? 'Cancel' : '+ New assignment'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="card-index mt-6 space-y-4">
            {error && (
              <div className="text-sm text-stamp bg-stamp-soft/60 border border-stamp/30 rounded px-3.5 py-2.5">
                {error}
              </div>
            )}

            <div>
              <label className="field-label">Title</label>
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="field-input"
                placeholder="e.g. Assignment 3: Database Design"
              />
            </div>

            <div>
              <label className="field-label">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="field-input"
                placeholder="Brief description of the assignment"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="field-label">Due date</label>
                <input
                  type="datetime-local"
                  required
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  className="field-input"
                />
              </div>
              <div>
                <label className="field-label">OneDrive link</label>
                <input
                  type="url"
                  required
                  value={form.onedriveLink}
                  onChange={(e) => setForm({ ...form, onedriveLink: e.target.value })}
                  className="field-input"
                  placeholder="https://onedrive.live.com/..."
                />
              </div>
            </div>

            <div>
              <label className="field-label">Assign to</label>
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, targetType: 'all', groupIds: [] })}
                  className={`px-3.5 py-1.5 rounded text-sm font-semibold border transition-colors ${
                    form.targetType === 'all'
                      ? 'bg-ink text-paper border-ink'
                      : 'bg-card text-ink-soft border-line'
                  }`}
                >
                  All students
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, targetType: 'group' })}
                  className={`px-3.5 py-1.5 rounded text-sm font-semibold border transition-colors ${
                    form.targetType === 'group'
                      ? 'bg-ink text-paper border-ink'
                      : 'bg-card text-ink-soft border-line'
                  }`}
                >
                  Specific groups
                </button>
              </div>

              {form.targetType === 'group' && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {groups.map((g) => (
                    <button
                      type="button"
                      key={g.id}
                      onClick={() => toggleGroupSelection(g.id)}
                      className={`px-3 py-1 rounded text-xs font-mono border transition-colors ${
                        form.groupIds.includes(g.id)
                          ? 'bg-brass-soft border-brass text-brass-dark'
                          : 'bg-card border-line text-ink-soft'
                      }`}
                    >
                      {g.name}
                    </button>
                  ))}
                  {groups.length === 0 && <p className="text-xs text-ink-faint">No groups exist yet.</p>}
                </div>
              )}
            </div>

            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Creating…' : 'Create assignment'}
            </button>
          </form>
        )}

        <div className="mt-7 space-y-3">
          {assignments.map((a) => {
            const detail = submissionDetail[a.id];
            return (
              <div key={a.id} className="card-index !p-0 !pl-0 overflow-hidden">
                <button
                  onClick={() => toggleExpand(a.id)}
                  className="w-full text-left px-5 pl-7 py-4 flex items-center justify-between"
                >
                  <div>
                    <p className="font-display text-base text-ink">{a.title}</p>
                    <p className="font-mono text-xs text-ink-faint mt-0.5">Due {formatDate(a.due_date)}</p>
                  </div>
                  <span className="font-mono text-xs text-brass-dark uppercase tracking-wider shrink-0">
                    {expandedId === a.id ? 'Hide' : 'View'}
                  </span>
                </button>

                {expandedId === a.id && (
                  <div className="border-t border-line px-5 pl-7 py-4">
                    {!detail ? (
                      <p className="text-sm text-ink-faint font-mono">Loading…</p>
                    ) : (
                      <>
                        <p className="font-mono text-xs text-ink-faint mb-3">
                          {detail.summary.confirmed} of {detail.summary.total} groups confirmed
                        </p>
                        <div className="divide-y divide-line">
                          {detail.submissions.map((s) => (
                            <div key={s.id} className="flex items-center justify-between py-2.5">
                              <span className="text-sm text-ink">
                                {s.group_name}{' '}
                                <span className="font-mono text-xs text-ink-faint">
                                  ({s.member_count} members)
                                </span>
                              </span>
                              {s.status === 'confirmed' ? (
                                <span className="stamp-confirmed !text-[0.6rem] !py-0.5">✓ Confirmed</span>
                              ) : (
                                <span className="stamp-pending !text-[0.6rem] !py-0.5">Awaiting</span>
                              )}
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
            <div className="border border-dashed border-line rounded-md p-10 text-center text-ink-faint">
              No assignments created yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}