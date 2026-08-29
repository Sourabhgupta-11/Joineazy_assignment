import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import AssignmentCard from '../components/AssignmentCard';
import SubmissionConfirmModal from '../components/SubmissionConfirmModal';
import FeedbackModal from '../components/FeedbackModal';
import Loader from '../components/Loader';
import { useAuth } from '../context/AuthContext';

export default function CourseAssignments() {
  const { id: courseId } = useParams();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [myGroup, setMyGroup] = useState(null); // the student's single group, if any
  const [submissionMap, setSubmissionMap] = useState({});
  const [modalAssignment, setModalAssignment] = useState(null);
  const [feedbackTarget, setFeedbackTarget] = useState(null); // { assignmentTitle, feedback }
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAll = async () => {
    setError('');
    try {
      const [courseRes, groupsRes] = await Promise.all([
        api.get(`/courses/${courseId}`),
        api.get('/groups/mine'),
      ]);
      setCourse(courseRes.data.course);
      const group = groupsRes.data.groups[0] || null;
      setMyGroup(group);

      const assignRes = await api.get('/assignments', {
        params: { courseId, ...(group ? { groupId: group.id } : {}) },
      });
      setAssignments(assignRes.data.assignments);

      const map = {};
      const individualRes = await api.get('/submissions/mine', { params: { courseId } });
      individualRes.data.submissions.forEach((s) => {
        map[s.assignment_id] = s;
      });
      if (group) {
        const groupRes = await api.get(`/submissions/group/${group.id}`);
        groupRes.data.submissions.forEach((s) => {
          map[s.assignment_id] = s;
        });
      }
      setSubmissionMap(map);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load this course.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const isGroupLeader = myGroup && myGroup.created_by === user.id;

  const handleConfirm = async () => {
    if (!modalAssignment) return;
    setConfirming(true);
    try {
      if (modalAssignment.submission_type === 'individual') {
        await api.post(`/submissions/${modalAssignment.id}/confirm`, { confirm: true });
      } else {
        await api.post(`/submissions/${modalAssignment.id}/groups/${myGroup.id}/confirm`, { confirm: true });
      }
      await loadAll();
      setModalAssignment(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to confirm submission.');
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 flex items-center gap-2 text-sm text-ink-soft font-mono">
          <Loader size={15} /> Loading course…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
          <div className="text-sm text-stamp bg-stamp-soft/60 border border-stamp/30 rounded px-4 py-3">
            {error}
          </div>
          <Link to="/dashboard" className="btn-ghost mt-4 inline-flex">
            ← Back to courses
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <Link to="/dashboard" className="font-mono text-xs text-ink-faint hover:text-ink">
          ← All courses
        </Link>
        <p className="ledger-heading mt-4 mb-2">{course.code}</p>
        <h1 className="font-display text-3xl text-ink">{course.name}</h1>

        {myGroup && (
          <p className="text-sm text-ink-soft mt-2">
            Your group: <span className="font-semibold text-ink">{myGroup.name}</span>
            {isGroupLeader ? (
              <span className="ml-1.5 font-mono text-xs text-brass-dark">(you're the leader)</span>
            ) : (
              <span className="ml-1.5 font-mono text-xs text-ink-faint">
                (only your group leader can confirm group assignments)
              </span>
            )}
          </p>
        )}

        <div className="mt-7 space-y-4">
          {assignments.length === 0 ? (
            <div className="border border-dashed border-line rounded-md p-10 text-center text-ink-faint">
              No assignments have been posted for this course yet.
            </div>
          ) : (
            assignments.map((a) => {
              const isGroupType = a.submission_type === 'group';
              const canAct = isGroupType ? Boolean(myGroup) && isGroupLeader : true;
              return (
                <div key={a.id}>
                  <div className="flex items-center gap-2 mb-1.5 px-1">
                    <span className="font-mono text-[0.6rem] uppercase tracking-widest text-ink-faint">
                      {isGroupType ? 'Group submission' : 'Individual submission'}
                    </span>
                  </div>
                  <AssignmentCard
                    assignment={a}
                    submission={submissionMap[a.id]}
                    disabled={!canAct}
                    onConfirmClick={() => setModalAssignment(a)}
                    onViewFeedback={(sub) =>
                      setFeedbackTarget({ assignmentTitle: a.title, feedback: sub.feedback })
                    }
                  />
                  {isGroupType && !myGroup && (
                    <p className="text-xs text-brass-dark mt-1.5 px-1">
                      Join or create a group to take part in this assignment.
                    </p>
                  )}
                  {isGroupType && myGroup && !isGroupLeader && (
                    <p className="text-xs text-ink-faint mt-1.5 px-1">
                      Waiting on {myGroup.name}'s leader to confirm.
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {modalAssignment && (
        <SubmissionConfirmModal
          assignmentTitle={modalAssignment.title}
          loading={confirming}
          onConfirm={handleConfirm}
          onClose={() => setModalAssignment(null)}
        />
      )}

      {feedbackTarget && (
        <FeedbackModal
          assignmentTitle={feedbackTarget.assignmentTitle}
          feedback={feedbackTarget.feedback}
          onClose={() => setFeedbackTarget(null)}
        />
      )}
    </div>
  );
}