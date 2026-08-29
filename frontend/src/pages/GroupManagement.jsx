import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import ConfirmDialog from '../components/ConfirmDialog';
import Loader from '../components/Loader';
import { useAuth } from '../context/AuthContext';

export default function GroupManagement() {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [inviteIdentifier, setInviteIdentifier] = useState('');
  const [sentInvites, setSentInvites] = useState([]);
  const [receivedInvites, setReceivedInvites] = useState([]);
  const [creating, setCreating] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [respondingId, setRespondingId] = useState(null); // invite id currently being accepted/declined
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // Rename state
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [savingRename, setSavingRename] = useState(false);

  // Confirmation dialogs
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [removingMember, setRemovingMember] = useState(false);
  const [inviteToCancel, setInviteToCancel] = useState(null);
  const [cancellingInvite, setCancellingInvite] = useState(false);
  const [showDeleteGroupConfirm, setShowDeleteGroupConfirm] = useState(false);
  const [deletingGroup, setDeletingGroup] = useState(false);

  const loadGroups = async () => {
    const { data } = await api.get('/groups/mine');
    setGroups(data.groups);
    return data.groups;
  };

  const loadReceivedInvites = async () => {
    const { data } = await api.get('/groups/invites/mine');
    setReceivedInvites(data.invites);
  };

  const loadGroupDetail = async (id) => {
    const { data } = await api.get(`/groups/${id}`);
    setSelectedGroup(data.group);
    setRenaming(false);
    if (data.group.created_by === user.id) {
      const invitesRes = await api.get(`/groups/${id}/invites`);
      setSentInvites(invitesRes.data.invites);
    } else {
      setSentInvites([]);
    }
  };

  useEffect(() => {
    loadGroups();
    loadReceivedInvites();
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

  const handleSendInvite = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    if (!inviteIdentifier.trim() || !selectedGroup) return;
    setInviting(true);
    try {
      const { data } = await api.post(`/groups/${selectedGroup.id}/invites`, {
        identifier: inviteIdentifier.trim(),
      });
      setInviteIdentifier('');
      setNotice(`Invite sent to ${data.student.name}.`);
      await loadGroupDetail(selectedGroup.id);
    } catch (err) {
      // Surfaces the backend's specific message, e.g. "X is already a member of
      // another group ('Y')." — the alert for the one-group-per-student rule.
      setError(err.response?.data?.message || 'Failed to send invite.');
    } finally {
      setInviting(false);
    }
  };

  const confirmCancelInvite = async () => {
    if (!inviteToCancel || !selectedGroup) return;
    setCancellingInvite(true);
    try {
      await api.delete(`/groups/${selectedGroup.id}/invites/${inviteToCancel.id}`);
      await loadGroupDetail(selectedGroup.id);
      setInviteToCancel(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel invite.');
      setInviteToCancel(null);
    } finally {
      setCancellingInvite(false);
    }
  };

  const respondToInvite = async (inviteId, action) => {
    setRespondingId(inviteId);
    setError('');
    setNotice('');
    try {
      const { data } = await api.post(`/groups/invites/${inviteId}/${action}`);
      setNotice(action === 'accept' ? `You joined ${data.group.name}.` : 'Invite declined.');
      await Promise.all([loadReceivedInvites(), loadGroups()]);
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${action} invite.`);
    } finally {
      setRespondingId(null);
    }
  };

  const confirmRemoveMember = async () => {
    if (!memberToRemove || !selectedGroup) return;
    setRemovingMember(true);
    try {
      await api.delete(`/groups/${selectedGroup.id}/members/${memberToRemove.id}`);
      await loadGroupDetail(selectedGroup.id);
      await loadGroups();
      setMemberToRemove(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove member.');
      setMemberToRemove(null);
    } finally {
      setRemovingMember(false);
    }
  };

  const startRename = () => {
    setRenameValue(selectedGroup.name);
    setRenaming(true);
  };

  const saveRename = async () => {
    if (!renameValue.trim() || !selectedGroup) return;
    setSavingRename(true);
    setError('');
    try {
      await api.put(`/groups/${selectedGroup.id}`, { name: renameValue.trim() });
      await loadGroupDetail(selectedGroup.id);
      await loadGroups();
      setRenaming(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to rename group.');
    } finally {
      setSavingRename(false);
    }
  };

  const confirmDeleteGroup = async () => {
    if (!selectedGroup) return;
    setDeletingGroup(true);
    try {
      await api.delete(`/groups/${selectedGroup.id}`);
      setSelectedGroup(null);
      setShowDeleteGroupConfirm(false);
      await loadGroups();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete group.');
      setShowDeleteGroupConfirm(false);
    } finally {
      setDeletingGroup(false);
    }
  };

  const isLeader = selectedGroup && user.id === selectedGroup.created_by;

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <p className="ledger-heading mb-2">Card catalog</p>
        <h1 className="font-display text-3xl text-ink">My groups</h1>
        <p className="text-ink-soft mt-1.5">
          Only the group leader can invite or remove members. A student can only belong to one group
          at a time, and joining requires accepting an invite below.
        </p>

        {receivedInvites.length > 0 && (
          <div className="card-index mt-6 border-brass/50">
            <p className="ledger-heading mb-3">
              Invites received{' '}
              <span className="font-mono text-[0.65rem] text-brass-dark normal-case tracking-normal">
                ({receivedInvites.length})
              </span>
            </p>
            <div className="space-y-3">
              {receivedInvites.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between gap-3 border border-line rounded px-3.5 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink truncate">{inv.group_name}</p>
                    <p className="font-mono text-xs text-ink-faint">Invited by {inv.invited_by_name}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => respondToInvite(inv.id, 'decline')}
                      disabled={respondingId === inv.id}
                      className="btn-secondary !px-3 !py-1.5 text-xs"
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => respondToInvite(inv.id, 'accept')}
                      disabled={respondingId === inv.id}
                      className="btn-primary !px-3 !py-1.5 text-xs"
                    >
                      {respondingId === inv.id && <Loader size={12} light />}
                      Accept
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6 mt-6">
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
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    {renaming ? (
                      <div className="flex items-center gap-2">
                        <input
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          className="field-input !py-1.5 text-lg font-display"
                          autoFocus
                        />
                        <button onClick={saveRename} disabled={savingRename} className="btn-primary !px-3 !py-1.5 text-xs">
                          Save
                        </button>
                        <button onClick={() => setRenaming(false)} className="btn-ghost text-xs">
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2.5">
                        <h2 className="font-display text-xl text-ink">{selectedGroup.name}</h2>
                        {isLeader && (
                          <button
                            onClick={startRename}
                            className="font-mono text-[0.65rem] uppercase tracking-wider text-brass-dark hover:text-ink"
                          >
                            Rename
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono text-xs text-ink-faint">
                      {selectedGroup.members.length} member{selectedGroup.members.length !== 1 ? 's' : ''}
                    </span>
                    {isLeader && (
                      <button
                        onClick={() => setShowDeleteGroupConfirm(true)}
                        className="font-mono text-[0.65rem] uppercase tracking-wider text-stamp hover:text-ink"
                      >
                        Delete group
                      </button>
                    )}
                  </div>
                </div>

                {isLeader ? (
                  <form onSubmit={handleSendInvite} className="mt-5 flex gap-2">
                    <input
                      value={inviteIdentifier}
                      onChange={(e) => setInviteIdentifier(e.target.value)}
                      placeholder="Invite by email or student ID"
                      className="field-input"
                    />
                    <button type="submit" disabled={inviting} className="btn-primary shrink-0">
                      {inviting && <Loader size={13} light />}
                      Send invite
                    </button>
                  </form>
                ) : (
                  <p className="mt-5 text-xs text-ink-faint font-mono">
                    Only {selectedGroup.members.find((m) => m.id === selectedGroup.created_by)?.name || 'the leader'}{' '}
                    can invite or remove members.
                  </p>
                )}

                {isLeader && sentInvites.length > 0 && (
                  <div className="mt-5">
                    <p className="ledger-heading mb-2 !text-[0.65rem]">Pending invites</p>
                    <div className="space-y-2">
                      {sentInvites.map((inv) => (
                        <div key={inv.id} className="flex items-center justify-between text-sm py-1.5">
                          <span className="text-ink-soft">
                            {inv.invitee_name}{' '}
                            <span className="font-mono text-xs text-ink-faint">({inv.invitee_email})</span>
                          </span>
                          <button
                            onClick={() => setInviteToCancel(inv)}
                            className="font-mono text-[0.65rem] uppercase tracking-wider text-stamp hover:text-ink"
                          >
                            Cancel
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-6">
                  <p className="ledger-heading mb-3">Roster</p>
                  <div className="divide-y divide-line">
                    {selectedGroup.members.map((m) => (
                      <div key={m.id} className="flex items-center justify-between py-3">
                        <div className="flex items-baseline gap-2 min-w-0">
                          <p className="text-sm font-semibold text-ink truncate">{m.name}</p>
                          {m.id === selectedGroup.created_by && (
                            <span className="font-mono text-[0.65rem] uppercase tracking-wider text-brass-dark shrink-0">
                              leader
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <p className="font-mono text-xs text-ink-faint">
                            {m.email} {m.student_id ? `· ${m.student_id}` : ''}
                          </p>
                          {isLeader && m.id !== user.id && (
                            <button
                              onClick={() => setMemberToRemove(m)}
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

      {memberToRemove && (
        <ConfirmDialog
          title="Remove this member?"
          message={`${memberToRemove.name} will be removed from ${selectedGroup?.name} and can be re-invited later.`}
          confirmLabel="Remove member"
          loading={removingMember}
          onConfirm={confirmRemoveMember}
          onCancel={() => setMemberToRemove(null)}
        />
      )}

      {inviteToCancel && (
        <ConfirmDialog
          title="Cancel this invite?"
          message={`${inviteToCancel.invitee_name} will no longer see this invite.`}
          confirmLabel="Cancel invite"
          loading={cancellingInvite}
          onConfirm={confirmCancelInvite}
          onCancel={() => setInviteToCancel(null)}
        />
      )}

      {showDeleteGroupConfirm && (
        <ConfirmDialog
          title="Delete this group?"
          message={`This permanently deletes "${selectedGroup?.name}", removes every member, and clears its submission history. This can't be undone.`}
          confirmLabel="Delete group"
          loading={deletingGroup}
          onConfirm={confirmDeleteGroup}
          onCancel={() => setShowDeleteGroupConfirm(false)}
        />
      )}
    </div>
  );
}