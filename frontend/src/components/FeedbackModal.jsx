import React from 'react';

/**
 * Small popup showing the professor's feedback for a rejected submission.
 * Purely informational — closing it doesn't take any action; the "Submit
 * again" button lives on the assignment card itself.
 */
export default function FeedbackModal({ assignmentTitle, feedback, onClose }) {
  return (
    <div className="fixed inset-0 bg-ink/50 flex items-center justify-center z-50 px-4">
      <div className="card-index w-full max-w-md !p-0 overflow-hidden animate-fade-up">
        <div className="px-6 pt-6 pb-6">
          <p className="ledger-heading mb-3">Professor&apos;s feedback</p>
          <h3 className="font-display text-xl text-ink">{assignmentTitle}</h3>

          <div className="mt-4 border-l-2 border-stamp pl-4 py-1">
            <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap">{feedback}</p>
          </div>

          <div className="mt-6 flex justify-end">
            <button onClick={onClose} className="btn-primary">
              Got it
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}