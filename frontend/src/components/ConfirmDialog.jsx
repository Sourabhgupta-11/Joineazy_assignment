import React from 'react';

/**
 * Generic "are you sure?" dialog for destructive actions (removing a member,
 * deleting a group). Styled to match the ledger identity rather than a
 * plain browser confirm().
 */
export default function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirm',
  danger = true,
  loading = false,
  onConfirm,
  onCancel,
}) {
  return (
    <div className="fixed inset-0 bg-ink/50 flex items-center justify-center z-50 px-4">
      <div className="card-index w-full max-w-sm !p-0 overflow-hidden">
        <div className="px-6 pt-6 pb-5">
          <p className="ledger-heading mb-3">Please confirm</p>
          <h3 className="font-display text-xl text-ink">{title}</h3>
          <p className="text-sm text-ink-soft mt-2.5 leading-relaxed">{message}</p>
          <div className="mt-6 flex justify-end gap-3">
            <button onClick={onCancel} className="btn-ghost" disabled={loading}>
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={danger ? 'btn-primary !bg-stamp !shadow-none' : 'btn-primary'}
            >
              {loading ? 'Working…' : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}