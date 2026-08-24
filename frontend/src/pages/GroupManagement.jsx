import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

export default function GroupManagement() {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [memberIdentifier, setMemberIdentifier] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadGroups = async () => {
    const { data } = await api.get('/groups/mine');
    setGroups(data.groups);
    return data.groups;
  };

  const loadGroupDetail = async (id) => {
    const { data } = await api.get(`/groups/${id}`);
    setSelectedGroup(data.group);
  };

  useEffect(() => {
    loadGroups();
  }, []);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    setError('');
    if (!newGroupName.trim()) return;
    setCreating(true);
    try {
      const { data } = await api.post('/groups', { name: newGroupName.trim() });
      setNewGroupName('');
      await loadGroups();
      await loadGroupDetail(data.group.id);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create group.');
    } finally {
      setCreating(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    if (!memberIdentifier.trim() || !selectedGroup) return;
    try {
      await api.post(`/groups/${selectedGroup.id}/members`, { identifier: memberIdentifier.trim() });
      setMemberIdentifier('');
      setNotice('Member added to the roster.');
      await loadGroupDetail(selectedGroup.id);
      await loadGroups();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add member.');
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!selectedGroup) return;
    try {
      await api.delete(`/groups/${selectedGroup.id}/members/${userId}`);
      await loadGroupDetail(selectedGroup.id);
      await loadGroups();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove member.');
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <p className="ledger-heading mb-2">Card catalog</p>
        <h1 className="font-display text-3xl text-ink">My groups</h1>
        <p className="text-ink-soft mt-1.5">Create a group and add classmates by email or student ID.</p>

        <div className="grid lg:grid-cols-3 gap-6 mt-8">
          {/* Group list + create form */}
          <div className="lg:col-span-1 space-y-4">
            <form onSubmit={handleCreateGroup} className="card-index">
              <label className="field-label">New group</label>
              <div className="flex gap-2">
                <input
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="e.g. Team Alpha"
                  className="field-input"
                />
                <button type="submit" disabled={creating} className="btn-primary shrink-0 !px-4">
                  Add
                </button>
              </div>
            </form>

            <div className="card-index !p-0 !pl-0 overflow-hidden">
              <div className="divide-y divide-line">
                {groups.length === 0 && <p className="text-sm text-ink-faint p-4 pl-7">No groups yet.</p>}
                {groups.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => loadGroupDetail(g.id)}
                    className={`w-full text-left px-4 py-3 pl-7 hover:bg-brass-soft/20 transition-colors ${
                      selectedGroup?.id === g.id ? 'bg-brass-soft/30' : ''
                    }`}
                  >
                    <p className="font-semibold text-ink text-sm">{g.name}</p>
                    <p className="font-mono text-xs text-ink-faint mt-0.5">{g.member_count} members</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Group detail */}
          <div className="lg:col-span-2">
            {error && (
              <div className="mb-4 text-sm text-stamp bg-stamp-soft/60 border border-stamp/30 rounded px-3.5 py-2.5">
                {error}
              </div>
            )}
            {notice && (
              <div className="mb-4 text-sm text-[#3E4F38] bg-[#E8EEE4] border border-[#55684A]/30 rounded px-3.5 py-2.5">
                {notice}
              </div>
            )}

            {!selectedGroup ? (
              <div className="border border-dashed border-line rounded-md p-12 text-center text-ink-faint">
                Select a group from the catalog to view its roster.
              </div>
            ) : (
              <div className="card-index">
                <div className="flex items-baseline justify-between">
                  <h2 className="font-display text-xl text-ink">{selectedGroup.name}</h2>
                  <span className="font-mono text-xs text-ink-faint">
                    {selectedGroup.members.length} member{selectedGroup.members.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <form onSubmit={handleAddMember} className="mt-5 flex gap-2">
                  <input
                    value={memberIdentifier}
                    onChange={(e) => setMemberIdentifier(e.target.value)}
                    placeholder="Add by email or student ID"
                    className="field-input"
                  />
                  <button type="submit" className="btn-primary shrink-0">
                    Add
                  </button>
                </form>

                <div className="mt-6">
                  <p className="ledger-heading mb-3">Roster</p>
                  <div className="divide-y divide-line">
                    {selectedGroup.members.map((m) => (
                      <div key={m.id} className="flex items-center justify-between py-3">
                        <div className="flex items-baseline gap-2 min-w-0">
                          <p className="text-sm font-semibold text-ink truncate">{m.name}</p>
                          {m.id === selectedGroup.created_by && (
                            <span className="font-mono text-[0.65rem] uppercase tracking-wider text-brass-dark shrink-0">
                              creator
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <p className="font-mono text-xs text-ink-faint">
                            {m.email} {m.student_id ? `· ${m.student_id}` : ''}
                          </p>
                          {selectedGroup.created_by === user.id && m.id !== user.id && (
                            <button
                              onClick={() => handleRemoveMember(m.id)}
                              className="font-mono text-[0.65rem] uppercase tracking-wider text-stamp hover:text-ink"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}