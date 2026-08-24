import React from 'react';

export default function ProgressBar({ percent = 0, label }) {
  const clamped = Math.max(0, Math.min(100, percent));

  const colorClass =
    clamped === 100
      ? 'bg-green-500'
      : clamped >= 50
        ? 'bg-brand-500'
        : 'bg-amber-500';

  return (
    <div data-testid="progress-bar" className="w-full">
      {label && (
        <div className="flex justify-between text-xs font-medium text-gray-500 mb-1">
          <span data-testid="progress-label">{label}</span>
          <span data-testid="progress-percent">{clamped}%</span>
        </div>
      )}

      <div
        data-testid="progress-track"
        className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden"
      >
        <div
          data-testid="progress-fill"
          className={`h-2.5 rounded-full transition-all duration-500 ${colorClass}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}