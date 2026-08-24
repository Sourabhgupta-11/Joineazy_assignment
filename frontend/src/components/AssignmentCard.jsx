import React from 'react';

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AssignmentCard({ assignment, status, onConfirmClick, disabled }) {
  const isConfirmed = status === 'confirmed';
  const isOverdue = new Date(assignment.due_date) < new Date() && !isConfirmed;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-gray-800">{assignment.title}</h3>
          {assignment.description && (
            <p className="text-sm text-gray-500 mt-1">{assignment.description}</p>
          )}
        </div>
        <span
          className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${
            isConfirmed
              ? 'bg-green-100 text-green-700'
              : isOverdue
              ? 'bg-red-100 text-red-700'
              : 'bg-amber-100 text-amber-700'
          }`}
        >
          {isConfirmed ? 'Confirmed' : isOverdue ? 'Overdue' : 'Pending'}
        </span>
      </div>

      <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
        <span>Due: {formatDate(assignment.due_date)}</span>
        <a
          href={assignment.onedrive_link}
          target="_blank"
          rel="noreferrer"
          className="text-brand-600 hover:underline font-medium"
        >
          Open OneDrive Link ↗
        </a>
      </div>

      {!isConfirmed && (
        <button
          onClick={onConfirmClick}
          disabled={disabled}
          className="mt-4 w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 disabled:opacity-50"
        >
          Confirm Submission
        </button>
      )}
    </div>
  );
}
