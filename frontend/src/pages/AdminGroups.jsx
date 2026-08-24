import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import Navbar from '../components/Navbar';

export default function AdminGroups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await api.get('/groups');
      setGroups(data.groups);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <p className="ledger-heading mb-2">Full roster</p>
        <h1 className="font-display text-3xl text-ink">All groups</h1>
        <p className="text-ink-soft mt-1.5">Every group formed by students, with membership details.</p>

        <div className="mt-8 grid sm:grid-cols-2 gap-4">
          {loading ? (
            <p className="text-sm text-ink-soft font-mono">Loading…</p>
          ) : groups.length === 0 ? (
            <div className="border border-dashed border-line rounded-md p-10 text-center text-ink-faint sm:col-span-2">
              No groups have been created yet.
            </div>
          ) : (
            groups.map((g) => (
              <div key={g.id} className="card-index">
                <div className="flex items-baseline justify-between">
                  <h3 className="font-display text-lg text-ink">{g.name}</h3>
                  <span className="font-mono text-xs text-ink-faint">
                    {g.members.length} member{g.members.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="mt-3 divide-y divide-line">
                  {g.members.map((m) => (
                    <div key={m.id} className="text-sm text-ink py-1.5 flex justify-between">
                      <span>{m.name}</span>
                      <span className="font-mono text-xs text-ink-faint">{m.student_id}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}