import React from 'react';
import { Link } from 'react-router-dom';

export default function CourseCard({ course, to, footer }) {
  return (
    <Link
      to={to}
      className="card-index block hover:border-ink/25 hover:-translate-y-0.5 transition-all duration-150"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-display text-lg text-ink leading-snug">{course.name}</h3>
        <span className="font-mono text-[0.65rem] text-ink-faint shrink-0 border border-line rounded px-1.5 py-0.5">
          {course.code}
        </span>
      </div>
      {course.description && (
        <p className="text-sm text-ink-soft mt-1.5 leading-relaxed line-clamp-2">{course.description}</p>
      )}
      {course.professor_name && (
        <p className="font-mono text-xs text-ink-faint mt-3">Taught by {course.professor_name}</p>
      )}
      {footer && <div className="mt-4 pt-3 border-t border-line">{footer}</div>}
    </Link>
  );
}