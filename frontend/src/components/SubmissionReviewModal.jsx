import React, { useState } from 'react';

export default function SubmissionReviewModal({ targetName, assignmentTitle, onSubmit, onClose, loading }) {
  const [decision, setDecision] = useState(null); // 'approved' | 'rejected'
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    setError('');
    if (!decision) {
      setError('Choose whether this submission is correct or needs changes.');
      return;
    }
    if (decision === 'rejected' && feedback.trim().length < 3) {
      setError('Add a short note on what needs fixing before rejecting.');
      return;
    }
    onSubmit({ reviewStatus: decision, feedback: feedback.trim() || undefined });
  };

  return (
    <div className="fixed inset-0 bg-ink/50 flex items-center justify-center z-50 px-4">
      <div className="card-index w-full max-w-md !p-0 overflow-hidden">
        <div className="px-6 pt-6 pb-6">
          <p className="ledger-heading mb-3">Review submission</p>
          <h3 className="font-display text-xl text-ink">{targetName}</h3>
          <p className="text-sm text-ink-soft mt-1">{assignmentTitle}</p>

          {error && (
            <div className="mt-4 text-sm text-stamp bg-stamp-soft/60 border border-stamp/30 rounded px-3.5 py-2.5">
              {error}
            </div>
          )}

          <div className="mt-5 grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setDecision('approved')}
              className={`py-2.5 rounded text-sm font-semibold border transition-colors ${
                decision === 'approved'
                  ? 'bg-[#3E4F38] text-paper border-[#3E4F38]'
                  : 'bg-card text-ink-soft border-line hover:border-[#55684A]/50'
              }`}
            >
              ✓ Correct
            </button>
            <button
              type="button"
              onClick={() => setDecision('rejected')}
              className={`py-2.5 rounded text-sm font-semibold border transition-colors ${
                decision === 'rejected'
                  ? 'bg-stamp text-paper border-stamp'
                  : 'bg-card text-ink-soft border-line hover:border-stamp/50'
              }`}
            >
              ✕ Needs changes
            </button>
          </div>

          {decision === 'rejected' && (
            <div className="mt-4">
              <label className="field-label">Feedback for the group</label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={4}
                className="field-input"
                placeholder="What needs to be fixed before they resubmit?"
                autoFocus
              />
            </div>
          )}

          <div className="mt-6 flex justify-end gap-3">
            <button onClick={onClose} className="btn-ghost" disabled={loading}>
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={loading} className="btn-primary">
              {loading ? 'Saving…' : 'Submit review'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}