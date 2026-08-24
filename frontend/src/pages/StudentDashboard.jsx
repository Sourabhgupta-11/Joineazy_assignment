import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import ProgressBar from '../components/ProgressBar';
import { useAuth } from '../context/AuthContext';

function StatCard({ label, value, accent }) {
  return (
    <div className="card-index !pl-6">
      <p className="ledger-heading !gap-0 mb-2">{label}</p>
      <p className={`font-display text-4xl mt-1 ${accent || 'text-ink'}`}>{value}</p>
    </div>
  );
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [progressByGroup, setProgressByGroup] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/groups/mine');
        setGroups(data.groups);

        const progressEntries = await Promise.all(
          data.groups.map(async (g) => {
            const res = await api.get(`/submissions/group/${g.id}`);
            return [g.id, res.data.progress];
          })
        );
        setProgressByGroup(Object.fromEntries(progressEntries));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const confirmedTotal = Object.values(progressByGroup).reduce((sum, p) => sum + (p?.confirmed || 0), 0);
  const pendingTotal = Object.values(progressByGroup).reduce(
    (sum, p) => sum + ((p?.total || 0) - (p?.confirmed || 0)),
    0
  );

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <p className="ledger-heading mb-2">Your ledger</p>
        <h1 className="font-display text-3xl text-ink">
          Welcome back, {user?.name?.split(' ')[0]}
        </h1>
        <p className="text-ink-soft mt-1.5">A quick look at your groups and what's still outstanding.</p>

        <div className="grid sm:grid-cols-3 gap-4 mt-8">
          <StatCard label="Your groups" value={groups.length} />
          <StatCard label="Confirmed" value={confirmedTotal} accent="text-[#55684A]" />
          <StatCard label="Awaiting" value={pendingTotal} accent="text-brass-dark" />
        </div>

        <div className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <p className="ledger-heading flex-1">Your groups</p>
            <Link to="/groups" className="btn-ghost ml-4 shrink-0">
              Manage groups →
            </Link>
          </div>

          {loading ? (
            <p className="text-ink-soft text-sm font-mono">Loading…</p>
          ) : groups.length === 0 ? (
            <div className="card-index text-center py-10">
              <p className="text-ink-soft">You haven't created or joined a group yet.</p>
              <Link to="/groups" className="btn-primary mt-4 inline-flex">
                Create a group
              </Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {groups.map((g) => {
                const progress = progressByGroup[g.id];
                return (
                  <div key={g.id} className="card-index">
                    <div className="flex items-center justify-between">
                      <h3 className="font-display text-lg text-ink">{g.name}</h3>
                      <span className="font-mono text-xs text-ink-faint">{g.member_count} members</span>
                    </div>
                    <div className="mt-4">
                      <ProgressBar
                        percent={progress?.progressPercent || 0}
                        label={`${progress?.confirmed || 0} of ${progress?.total || 0} confirmed`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}