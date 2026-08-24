import React, { useState } from 'react';

export default function SubmissionConfirmModal({ assignmentTitle, onConfirm, onClose, loading }) {
  const [step, setStep] = useState(1);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        {step === 1 && (
          <>
            <h3 className="text-lg font-semibold text-gray-800">Confirm Submission</h3>
            <p className="text-sm text-gray-600 mt-2">
              Have you and your group uploaded your work for{' '}
              <span className="font-medium text-gray-800">"{assignmentTitle}"</span> to the shared
              OneDrive link?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700"
              >
                Yes, I have submitted
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h3 className="text-lg font-semibold text-gray-800">Final Confirmation</h3>
            <p className="text-sm text-gray-600 mt-2">
              This will mark your group's submission as{' '}
              <span className="font-semibold text-green-600">confirmed</span>. This action reflects on
              your professor's dashboard immediately. Are you sure?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
                disabled={loading}
              >
                Back
              </button>
              <button
                onClick={onConfirm}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-60"
              >
                {loading ? 'Confirming...' : 'Confirm Submission'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
