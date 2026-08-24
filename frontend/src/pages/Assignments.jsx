import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import AssignmentCard from '../components/AssignmentCard';
import SubmissionConfirmModal from '../components/SubmissionConfirmModal';

export default function Assignments() {
  const [assignments, setAssignments] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [statusMap, setStatusMap] = useState({});
  const [modalAssignment, setModalAssignment] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadGroups = async () => {
    const { data } = await api.get('/groups/mine');
    setGroups(data.groups);
    if (data.groups.length > 0) {
      setSelectedGroupId(String(data.groups[0].id));
    }
    return data.groups;
  };

  const loadAssignments = async () => {
    const { data } = await api.get('/assignments');
    setAssignments(data.assignments);
  };

  const loadStatuses = async (groupId) => {
    if (!groupId) return;
    const { data } = await api.get(`/submissions/group/${groupId}`);
    const map = {};
    data.submissions.forEach((s) => {
      map[s.assignment_id] = s.status;
    });
    setStatusMap(map);
  };

  useEffect(() => {
    (async () => {
      await Promise.all([loadGroups(), loadAssignments()]);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (selectedGroupId) loadStatuses(selectedGroupId);
  }, [selectedGroupId]);

  const handleConfirm = async () => {
    if (!modalAssignment || !selectedGroupId) return;
    setConfirming(true);
    try {
      await api.post(`/submissions/${modalAssignment.id}/groups/${selectedGroupId}/confirm`, {
        confirm: true,
      });
      await loadStatuses(selectedGroupId);
      setModalAssignment(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to confirm submission.');
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="ledger-heading mb-2">Assignment sheet</p>
            <h1 className="font-display text-3xl text-ink">Assignments</h1>
          </div>

          {groups.length > 0 && (
            <div>
              <label className="field-label">Confirming as</label>
              <select
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="field-input !py-2 !w-auto"
              >
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {groups.length === 0 && !loading && (
          <div className="mt-6 border border-brass/40 bg-brass-soft/40 text-brass-dark text-sm rounded-md px-4 py-3">
            You need to join or create a group before you can confirm submissions. Head to{' '}
            <a href="/groups" className="underline font-semibold">
              My Groups
            </a>
            .
          </div>
        )}

        <div className="mt-7 space-y-4">
          {loading ? (
            <p className="text-sm text-ink-soft font-mono">Loading assignments…</p>
          ) : assignments.length === 0 ? (
            <div className="border border-dashed border-line rounded-md p-10 text-center text-ink-faint">
              No assignments have been posted yet.
            </div>
          ) : (
            assignments.map((a) => (
              <AssignmentCard
                key={a.id}
                assignment={a}
                status={statusMap[a.id]}
                disabled={!selectedGroupId}
                onConfirmClick={() => setModalAssignment(a)}
              />
            ))
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
    </div>
  );
}