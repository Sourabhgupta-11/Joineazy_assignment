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
      setNotice('Member added successfully.');
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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-800">My Groups</h1>
        <p className="text-gray-500 mt-1">Create a group and add classmates by email or student ID.</p>

        <div className="grid lg:grid-cols-3 gap-6 mt-6">
          {/* Group list + create form */}
          <div className="lg:col-span-1 space-y-4">
            <form onSubmit={handleCreateGroup} className="bg-white border border-gray-200 rounded-xl p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Create a new group</label>
              <div className="flex gap-2">
                <input
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="e.g. Team Alpha"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                />
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 disabled:opacity-60"
                >
                  Add
                </button>
              </div>
            </form>

            <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
              {groups.length === 0 && (
                <p className="text-sm text-gray-500 p-4">No groups yet. Create one above.</p>
              )}
              {groups.map((g) => (
                <button
                  key={g.id}
                  onClick={() => loadGroupDetail(g.id)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                    selectedGroup?.id === g.id ? 'bg-brand-50' : ''
                  }`}
                >
                  <p className="font-medium text-gray-800 text-sm">{g.name}</p>
                  <p className="text-xs text-gray-500">{g.member_count} members</p>
                </button>
              ))}
            </div>
          </div>

          {/* Group detail */}
          <div className="lg:col-span-2">
            {error && (
              <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </div>
            )}
            {notice && (
              <div className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                {notice}
              </div>
            )}

            {!selectedGroup ? (
              <div className="bg-white rounded-xl border border-dashed border-gray-300 p-10 text-center text-gray-500">
                Select a group from the left to view or manage its members.
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-800">{selectedGroup.name}</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedGroup.members.length} member{selectedGroup.members.length !== 1 ? 's' : ''}
                </p>

                <form onSubmit={handleAddMember} className="mt-5 flex gap-2">
                  <input
                    value={memberIdentifier}
                    onChange={(e) => setMemberIdentifier(e.target.value)}
                    placeholder="Add member by email or student ID"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700"
                  >
                    Add Member
                  </button>
                </form>

                <div className="mt-6 divide-y divide-gray-100">
                  {selectedGroup.members.map((m) => (
                    <div key={m.id} className="flex items-center justify-between py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {m.name} {m.id === selectedGroup.created_by && (
                            <span className="ml-1 text-xs text-brand-600 font-normal">(creator)</span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500">
                          {m.email} {m.student_id ? `· ${m.student_id}` : ''}
                        </p>
                      </div>
                      {selectedGroup.created_by === user.id && m.id !== user.id && (
                        <button
                          onClick={() => handleRemoveMember(m.id)}
                          className="text-xs font-medium text-red-600 hover:underline"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
