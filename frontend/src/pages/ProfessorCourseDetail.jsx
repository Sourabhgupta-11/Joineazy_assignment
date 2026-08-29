import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import Loader from '../components/Loader';
import ProgressBar from '../components/ProgressBar';
import SubmissionReviewModal from '../components/SubmissionReviewModal';

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function ReviewBadge({ status, reviewStatus }) {
  if (status !== 'confirmed') {
    return <span className="stamp-pending !text-[0.6rem] !py-0.5">Awaiting</span>;
  }
  if (reviewStatus === 'approved') {
    return <span className="stamp-confirmed !text-[0.6rem] !py-0.5">✓ Reviewed and correct</span>;
  }
  if (reviewStatus === 'rejected') {
    return (
      <span className="inline-flex items-center font-mono text-[0.6rem] font-semibold uppercase tracking-widest text-stamp border-2 border-stamp rounded px-2.5 py-0.5 bg-stamp-soft/60">
        Needs changes
      </span>
    );
  }
  return (
    <span className="inline-flex items-center font-mono text-[0.6rem] font-semibold uppercase tracking-widest text-brass-dark border border-brass/50 rounded px-2.5 py-0.5 bg-brass-soft/40">
      Submitted · under review
    </span>
  );
}

export default function ProfessorCourseDetail() {
  const { id: courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    dueDate: '',
    onedriveLink: '',
    submissionType: 'individual',
    targetType: 'all',
    groupIds: [],
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [expandedId, setExpandedId] = useState(null);
  const [submissionDetail, setSubmissionDetail] = useState({});
  const [reviewTarget, setReviewTarget] = useState(null);
  const [savingReview, setSavingReview] = useState(false);

  const loadAll = async () => {
    const [courseRes, analyticsRes, assignRes, groupsRes] = await Promise.all([
      api.get(`/courses/${courseId}`),
      api.get(`/courses/${courseId}/analytics`),
      api.get('/assignments', { params: { courseId } }),
      api.get('/groups'),
    ]);
    setCourse(courseRes.data.course);
    setAnalytics(analyticsRes.data);
    setAssignments(assignRes.data.assignments);
    setGroups(groupsRes.data.groups);
  };

  useEffect(() => {
    (async () => {
      try {
        await loadAll();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load this course.');
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      await api.post('/assignments', {
        ...form,
        courseId: Number(courseId),
        dueDate: new Date(form.dueDate).toISOString(),
      });
      setForm({
        title: '',
        description: '',
        dueDate: '',
        onedriveLink: '',
        submissionType: 'individual',
        targetType: 'all',
        groupIds: [],
      });
      setShowForm(false);
      await loadAll();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create assignment.');
    } finally {
      setSaving(false);
    }
  };

  const refreshDetail = async (assignmentId) => {
    const { data } = await api.get(`/submissions/assignment/${assignmentId}`);
    setSubmissionDetail((prev) => ({ ...prev, [assignmentId]: data }));
  };

  const toggleExpand = async (assignmentId) => {
    if (expandedId === assignmentId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(assignmentId);
    if (!submissionDetail[assignmentId]) {
      await refreshDetail(assignmentId);
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

  const handleReviewSubmit = async ({ reviewStatus, feedback }) => {
    if (!reviewTarget) return;
    setSavingReview(true);
    try {
      if (reviewTarget.type === 'individual') {
        await api.put(`/submissions/${reviewTarget.assignmentId}/students/${reviewTarget.studentId}/review`, {
          reviewStatus,
          feedback,
        });
      } else {
        await api.put(`/submissions/${reviewTarget.assignmentId}/groups/${reviewTarget.groupId}/review`, {
          reviewStatus,
          feedback,
        });
      }
      await refreshDetail(reviewTarget.assignmentId);
      setReviewTarget(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save review.');
    } finally {
      setSavingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 flex items-center gap-2 text-sm text-ink-soft font-mono">
          <Loader size={15} /> Loading course…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
          <div className="text-sm text-stamp bg-stamp-soft/60 border border-stamp/30 rounded px-4 py-3">
            {error}
          </div>
          <Link to="/admin" className="btn-ghost mt-4 inline-flex">
            ← Back to courses
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <Link to="/admin" className="font-mono text-xs text-ink-faint hover:text-ink">
          ← All courses
        </Link>

        <div className="flex items-start sm:items-end justify-between gap-4 flex-wrap mt-4">
          <div>
            <p className="ledger-heading mb-2">{course.code}</p>
            <h1 className="font-display text-3xl text-ink">{course.name}</h1>
          </div>
          <button onClick={() => setShowForm((s) => !s)} className="btn-primary">
            {showForm ? 'Cancel' : '+ New assignment'}
          </button>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mt-6">
          <div className="card-index !pl-6">
            <p className="ledger-heading !gap-0 mb-2">Students enrolled</p>
            <p className="font-display text-4xl mt-1 text-ink">{analytics.studentCount}</p>
          </div>
          <div className="card-index !pl-6">
            <p className="ledger-heading !gap-0 mb-2">Assignments</p>
            <p className="font-display text-4xl mt-1 text-ink">{analytics.assignmentCount}</p>
          </div>
        </div>

        {analytics.perAssignment.length > 0 && (
          <div className="card-index mt-4">
            <p className="ledger-heading mb-4">Submission completion</p>
            <div className="space-y-4">
              {analytics.perAssignment.map((a) => {
                const pct = a.total === 0 ? 0 : Math.round((a.confirmed / a.total) * 100);
                return (
                  <ProgressBar key={a.id} percent={pct} label={`${a.title} · ${a.confirmed}/${a.total} confirmed`} />
                );
              })}
            </div>
          </div>
        )}

        {showForm && (
          <form onSubmit={handleCreate} className="card-index mt-6 space-y-4">
            {formError && (
              <div className="text-sm text-stamp bg-stamp-soft/60 border border-stamp/30 rounded px-3.5 py-2.5">
                {formError}
              </div>
            )}

            <div>
              <label className="field-label">Title</label>
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="field-input"
                placeholder="e.g. Homework 1"
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
              <label className="field-label">Submission type</label>
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, submissionType: 'individual', targetType: 'all', groupIds: [] })}
                  className={`px-3.5 py-1.5 rounded text-sm font-semibold border transition-colors ${
                    form.submissionType === 'individual'
                      ? 'bg-ink text-paper border-ink'
                      : 'bg-card text-ink-soft border-line'
                  }`}
                >
                  Individual
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, submissionType: 'group' })}
                  className={`px-3.5 py-1.5 rounded text-sm font-semibold border transition-colors ${
                    form.submissionType === 'group'
                      ? 'bg-ink text-paper border-ink'
                      : 'bg-card text-ink-soft border-line'
                  }`}
                >
                  Group
                </button>
              </div>
              <p className="text-xs text-ink-faint mt-2">
                {form.submissionType === 'individual'
                  ? 'Every student currently enrolled will get their own submission to confirm.'
                  : "Only a group's leader can confirm on behalf of the whole group."}
              </p>
            </div>

            {form.submissionType === 'group' && (
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
                    All groups
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
            )}

            <button type="submit" disabled={saving} className="btn-primary">
              {saving && <Loader size={14} light />}
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
                    <p className="font-mono text-xs text-ink-faint mt-0.5">
                      Due {formatDate(a.due_date)} ·{' '}
                      {a.submission_type === 'individual' ? 'Individual' : 'Group'}
                    </p>
                  </div>
                  <span className="font-mono text-xs text-brass-dark uppercase tracking-wider shrink-0">
                    {expandedId === a.id ? 'Hide' : 'View'}
                  </span>
                </button>

                {expandedId === a.id && (
                  <div className="border-t border-line px-5 pl-7 py-4">
                    {!detail ? (
                      <div className="flex items-center gap-2 text-sm text-ink-faint font-mono">
                        <Loader size={13} /> Loading…
                      </div>
                    ) : (
                      <>
                        <p className="font-mono text-xs text-ink-faint mb-3">
                          {detail.summary.confirmed} of {detail.summary.total}{' '}
                          {detail.submissionType === 'individual' ? 'students' : 'groups'} confirmed
                        </p>
                        <div className="divide-y divide-line">
                          {detail.submissions.map((s) => (
                            <div key={s.id} className="flex items-center justify-between py-2.5 gap-3">
                              <span className="text-sm text-ink min-w-0 truncate">
                                {detail.submissionType === 'individual' ? (
                                  <>
                                    {s.student_name}{' '}
                                    <span className="font-mono text-xs text-ink-faint">({s.student_code})</span>
                                  </>
                                ) : (
                                  <>
                                    {s.group_name}{' '}
                                    <span className="font-mono text-xs text-ink-faint">
                                      ({s.member_count} members)
                                    </span>
                                  </>
                                )}
                              </span>
                              <div className="flex items-center gap-3 shrink-0">
                                <ReviewBadge status={s.status} reviewStatus={s.review_status} />
                                {s.status === 'confirmed' && (
                                  <button
                                    onClick={() =>
                                      setReviewTarget(
                                        detail.submissionType === 'individual'
                                          ? {
                                              type: 'individual',
                                              assignmentId: a.id,
                                              assignmentTitle: a.title,
                                              studentId: s.student_id,
                                              targetName: s.student_name,
                                            }
                                          : {
                                              type: 'group',
                                              assignmentId: a.id,
                                              assignmentTitle: a.title,
                                              groupId: s.group_id,
                                              targetName: s.group_name,
                                            }
                                      )
                                    }
                                    className="font-mono text-[0.65rem] uppercase tracking-wider text-brass-dark hover:text-ink"
                                  >
                                    Review
                                  </button>
                                )}
                              </div>
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

      {reviewTarget && (
        <SubmissionReviewModal
          targetName={reviewTarget.targetName}
          assignmentTitle={reviewTarget.assignmentTitle}
          loading={savingReview}
          onSubmit={handleReviewSubmit}
          onClose={() => setReviewTarget(null)}
        />
      )}
    </div>
  );
}