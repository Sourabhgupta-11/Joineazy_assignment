import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import ProgressBar from '../components/ProgressBar';
import Loader from '../components/Loader';

function StatCard({ label, value, accent }) {
  return (
    <div className="card-index !pl-6">
      <p className="ledger-heading !gap-0 mb-2">{label}</p>
      <p className={`font-display text-4xl mt-1 ${accent || 'text-ink'}`}>{value}</p>
    </div>
  );
}

// Global (all-courses) analytics, kept as a secondary view — the course grid
// at /admin is now the primary landing page for professors.
export default function AdminOverview() {
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
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 text-stamp text-sm">{error}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 flex items-center gap-2 text-sm text-ink-soft font-mono">
          <Loader size={15} /> Loading analytics…
        </div>
      </div>
    );
  }

  const { summary, perAssignment, perGroup } = data;
  const submissionTotal = summary.confirmedSubmissions + summary.pendingSubmissions;
  const overallPercent =
    submissionTotal === 0 ? 0 : Math.round((summary.confirmedSubmissions / submissionTotal) * 100);

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <p className="ledger-heading mb-2">Every course</p>
        <h1 className="font-display text-3xl text-ink">Overview</h1>
        <p className="text-ink-soft mt-1.5">Submission completion across all of your courses combined.</p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-8">
          <StatCard label="Students" value={summary.totalStudents} />
          <StatCard label="Groups" value={summary.totalGroups} />
          <StatCard label="Assignments" value={summary.totalAssignments} />
          <StatCard label="Confirmed" value={summary.confirmedSubmissions} accent="text-[#55684A]" />
          <StatCard label="Pending" value={summary.pendingSubmissions} accent="text-brass-dark" />
        </div>

        <div className="card-index mt-6">
          <p className="ledger-heading mb-3">Overall submission completion</p>
          <ProgressBar percent={overallPercent} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mt-6">
          <div className="card-index">
            <p className="ledger-heading mb-4">By assignment</p>
            {perAssignment.length === 0 ? (
              <p className="text-sm text-ink-faint">No assignments posted yet.</p>
            ) : (
              <div className="space-y-4">
                {perAssignment.map((a) => {
                  const pct = a.total_groups === 0 ? 0 : Math.round((a.confirmed_groups / a.total_groups) * 100);
                  return (
                    <ProgressBar
                      key={a.id}
                      percent={pct}
                      label={`${a.title} · ${a.confirmed_groups}/${a.total_groups} groups`}
                    />
                  );
                })}
              </div>
            )}
          </div>

          <div className="card-index">
            <p className="ledger-heading mb-4">By group</p>
            {perGroup.length === 0 ? (
              <p className="text-sm text-ink-faint">No groups created yet.</p>
            ) : (
              <div className="space-y-4">
                {perGroup.map((g) => {
                  const pct =
                    g.total_assignments === 0
                      ? 0
                      : Math.round((g.confirmed_assignments / g.total_assignments) * 100);
                  return (
                    <ProgressBar
                      key={g.id}
                      percent={pct}
                      label={`${g.name} · ${g.confirmed_assignments}/${g.total_assignments} assignments`}
                    />
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