import React from 'react';

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AssignmentCard({ assignment, submission, onConfirmClick, onViewFeedback, disabled }) {
  const status = submission?.status;
  const reviewStatus = submission?.review_status;
  const isConfirmed = status === 'confirmed';
  const isOverdue = new Date(assignment.due_date) < new Date() && !isConfirmed;
  const isApproved = isConfirmed && reviewStatus === 'approved';
  const isRejected = isConfirmed && reviewStatus === 'rejected';
  const isUnderReview = isConfirmed && reviewStatus === 'unchecked';

  return (
    <div className="card-index hover:border-ink/25 transition-colors">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h3 className="font-display text-lg text-ink leading-snug">{assignment.title}</h3>
          {assignment.description && (
            <p className="text-sm text-ink-soft mt-1 leading-relaxed">{assignment.description}</p>
          )}
        </div>

        {isApproved ? (
          <span className="stamp-confirmed shrink-0 animate-stamp-pop">✓ Reviewed and correct</span>
        ) : isRejected ? (
          <button
            onClick={() => onViewFeedback?.(submission)}
            className="inline-flex items-center gap-1.5 font-mono text-[0.68rem] font-semibold uppercase tracking-widest
              text-stamp border-2 border-stamp rounded px-2.5 py-1 bg-stamp-soft/50 shrink-0 animate-stamp-pop
              hover:bg-stamp-soft transition-colors cursor-pointer"
          >
            Needs changes · view feedback ↗
          </button>
        ) : isUnderReview ? (
          <span className="inline-flex items-center font-mono text-[0.68rem] font-semibold uppercase tracking-widest text-brass-dark border border-brass/50 rounded px-2.5 py-1 bg-brass-soft/40 shrink-0 animate-stamp-pop">
            Under review
          </span>
        ) : isOverdue ? (
          <span className="inline-flex items-center font-mono text-[0.68rem] font-semibold uppercase tracking-widest text-stamp border border-stamp/50 rounded px-2.5 py-1 bg-stamp-soft/60 shrink-0">
            Overdue
          </span>
        ) : (
          <span className="stamp-pending shrink-0">Awaiting</span>
        )}
      </div>

      <div className="mt-4 flex items-center gap-4 text-xs font-mono text-ink-faint">
        <span>Due {formatDate(assignment.due_date)}</span>
        <span className="text-line">·</span>
        
        <a
          href={assignment.onedrive_link}
          target="_blank"
          rel="noreferrer"
          className="text-brass-dark hover:text-ink font-semibold no-underline hover:underline"
        >
          Open submission folder ↗
        </a>
      </div>

      {(!isConfirmed || isRejected) && (
        <button onClick={onConfirmClick} disabled={disabled} className="btn-primary mt-4 w-full sm:w-auto">
          {isRejected ? 'Submit again' : 'Confirm submission'}
        </button>
      )}
    </div>
  );
}