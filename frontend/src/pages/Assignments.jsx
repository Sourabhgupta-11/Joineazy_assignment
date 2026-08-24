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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Assignments</h1>
            <p className="text-gray-500 mt-1 text-sm">
              View assignments and confirm submission on behalf of your group.
            </p>
          </div>

          {groups.length > 0 && (
            <div>
              <label className="text-xs text-gray-500 block mb-1">Confirming as group</label>
              <select
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
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
          <div className="mt-6 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg px-4 py-3">
            You need to join or create a group before you can confirm submissions. Head to{' '}
            <a href="/groups" className="underline font-medium">
              My Groups
            </a>
            .
          </div>
        )}

        <div className="mt-6 space-y-4">
          {loading ? (
            <p className="text-sm text-gray-500">Loading assignments...</p>
          ) : assignments.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-500">
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
