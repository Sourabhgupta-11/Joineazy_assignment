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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-800">All Groups</h1>
        <p className="text-gray-500 mt-1 text-sm">Every group formed by students, with membership details.</p>

        <div className="mt-6 grid sm:grid-cols-2 gap-4">
          {loading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : groups.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-500 sm:col-span-2">
              No groups have been created yet.
            </div>
          ) : (
            groups.map((g) => (
              <div key={g.id} className="bg-white border border-gray-200 rounded-xl p-5">
                <h3 className="font-semibold text-gray-800">{g.name}</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {g.members.length} member{g.members.length !== 1 ? 's' : ''}
                </p>
                <div className="mt-3 space-y-1.5">
                  {g.members.map((m) => (
                    <div key={m.id} className="text-sm text-gray-600 flex justify-between">
                      <span>{m.name}</span>
                      <span className="text-xs text-gray-400">{m.student_id}</span>
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
