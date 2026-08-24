import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import ProgressBar from '../components/ProgressBar';

function StatCard({ label, value, accent }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${accent || 'text-gray-800'}`}>{value}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/admin/analytics');
        setData(data);
      } catch (err) {
        setError('Failed to load analytics.');
      }
    })();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 text-red-600 text-sm">{error}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 text-gray-500 text-sm">Loading analytics...</div>
      </div>
    );
  }

  const { summary, perAssignment, perGroup } = data;
  const submissionTotal = summary.confirmedSubmissions + summary.pendingSubmissions;
  const overallPercent =
    submissionTotal === 0 ? 0 : Math.round((summary.confirmedSubmissions / submissionTotal) * 100);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-800">Analytics Dashboard</h1>
        <p className="text-gray-500 mt-1">Track group performance and submission completion at a glance.</p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-6">
          <StatCard label="Students" value={summary.totalStudents} />
          <StatCard label="Groups" value={summary.totalGroups} />
          <StatCard label="Assignments" value={summary.totalAssignments} />
          <StatCard label="Confirmed" value={summary.confirmedSubmissions} accent="text-green-600" />
          <StatCard label="Pending" value={summary.pendingSubmissions} accent="text-amber-600" />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 mt-6">
          <p className="text-sm font-medium text-gray-700 mb-2">Overall Submission Completion</p>
          <ProgressBar percent={overallPercent} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mt-6">
          {/* Per-assignment completion */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-4">Completion by Assignment</h2>
            {perAssignment.length === 0 ? (
              <p className="text-sm text-gray-500">No assignments posted yet.</p>
            ) : (
              <div className="space-y-4">
                {perAssignment.map((a) => {
                  const pct = a.total_groups === 0 ? 0 : Math.round((a.confirmed_groups / a.total_groups) * 100);
                  return (
                    <div key={a.id}>
                      <ProgressBar
                        percent={pct}
                        label={`${a.title} · ${a.confirmed_groups}/${a.total_groups} groups`}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Per-group completion */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-4">Completion by Group</h2>
            {perGroup.length === 0 ? (
              <p className="text-sm text-gray-500">No groups created yet.</p>
            ) : (
              <div className="space-y-4">
                {perGroup.map((g) => {
                  const pct =
                    g.total_assignments === 0
                      ? 0
                      : Math.round((g.confirmed_assignments / g.total_assignments) * 100);
                  return (
                    <div key={g.id}>
                      <ProgressBar
                        percent={pct}
                        label={`${g.name} · ${g.confirmed_assignments}/${g.total_assignments} assignments`}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
