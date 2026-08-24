import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import ProgressBar from '../components/ProgressBar';
import { useAuth } from '../context/AuthContext';

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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-800">Welcome, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="text-gray-500 mt-1">Here's a snapshot of your groups and assignment progress.</p>

        <div className="grid sm:grid-cols-3 gap-4 mt-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-500">Your Groups</p>
            <p className="text-3xl font-bold text-gray-800 mt-1">{groups.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-500">Confirmed Submissions</p>
            <p className="text-3xl font-bold text-green-600 mt-1">
              {Object.values(progressByGroup).reduce((sum, p) => sum + (p?.confirmed || 0), 0)}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-500">Pending Submissions</p>
            <p className="text-3xl font-bold text-amber-600 mt-1">
              {Object.values(progressByGroup).reduce(
                (sum, p) => sum + ((p?.total || 0) - (p?.confirmed || 0)),
                0
              )}
            </p>
          </div>
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Your Groups</h2>
            <Link
              to="/groups"
              className="text-sm font-medium text-brand-600 hover:underline"
            >
              Manage groups →
            </Link>
          </div>

          {loading ? (
            <p className="text-gray-500 text-sm">Loading...</p>
          ) : groups.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-gray-300 p-8 text-center">
              <p className="text-gray-500">You haven't created or joined a group yet.</p>
              <Link
                to="/groups"
                className="inline-block mt-3 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700"
              >
                Create a Group
              </Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {groups.map((g) => {
                const progress = progressByGroup[g.id];
                return (
                  <div key={g.id} className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-800">{g.name}</h3>
                      <span className="text-xs text-gray-500">{g.member_count} members</span>
                    </div>
                    <div className="mt-4">
                      <ProgressBar
                        percent={progress?.progressPercent || 0}
                        label={`${progress?.confirmed || 0} of ${progress?.total || 0} assignments confirmed`}
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
