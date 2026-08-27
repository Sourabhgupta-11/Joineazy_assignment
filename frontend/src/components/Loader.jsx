import React from 'react';

export default function Loader({ size = 16, light = false, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-label="Loading"
      role="status"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        strokeWidth="2.5"
        className={`spinner-ring ${light ? 'stroke-paper/90' : 'stroke-ink'}`}
        strokeLinecap="round"
      />
    </svg>
  );
}