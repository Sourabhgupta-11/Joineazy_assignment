import React, { useState } from 'react';

export default function SubmissionConfirmModal({ assignmentTitle, onConfirm, onClose, loading }) {
  const [step, setStep] = useState(1);

  return (
    <div className="fixed inset-0 bg-ink/50 flex items-center justify-center z-50 px-4">
      <div className="card-index w-full max-w-md !p-0 overflow-hidden">
        <div className="px-6 pt-6 pb-5">
          {step === 1 && (
            <>
              <p className="ledger-heading mb-3">Step 1 of 2</p>
              <h3 className="font-display text-xl text-ink">Confirm submission</h3>
              <p className="text-sm text-ink-soft mt-2.5 leading-relaxed">
                Have you and your group uploaded your work for{' '}
                <span className="font-semibold text-ink">&ldquo;{assignmentTitle}&rdquo;</span> to the shared
                submission folder?
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button onClick={onClose} className="btn-ghost">
                  Cancel
                </button>
                <button onClick={() => setStep(2)} className="btn-primary">
                  Yes, we&apos;ve submitted
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <p className="ledger-heading mb-3">Step 2 of 2</p>
              <h3 className="font-display text-xl text-ink">Press the stamp</h3>
              <p className="text-sm text-ink-soft mt-2.5 leading-relaxed">
                This marks your group&apos;s submission as{' '}
                <span className="font-semibold text-stamp">confirmed</span> on your professor&apos;s ledger,
                right away. Are you sure?
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button onClick={() => setStep(1)} className="btn-ghost" disabled={loading}>
                  Back
                </button>
                <button onClick={onConfirm} disabled={loading} className="btn-primary">
                  {loading ? 'Stamping…' : 'Confirm & stamp'}
                </button>
              </div>
            </>
          )}
        </div>
        <div className="h-1.5 bg-line">
          <div
            className="h-full bg-brass transition-all duration-300"
            style={{ width: step === 1 ? '50%' : '100%' }}
          />
        </div>
      </div>
    </div>
  );
}