import React from 'react';

export const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-slate-200 dark:bg-slate-800 rounded ${className}`} />
);

export const TableSkeleton = ({ rows = 5, cols = 4 }) => (
  <div className="space-y-4">
    {Array.from({ length: rows }).map((_, rIdx) => (
      <div key={rIdx} className="flex gap-4 items-center">
        {Array.from({ length: cols }).map((_, cIdx) => (
          <Skeleton key={cIdx} className="h-8 flex-1" />
        ))}
      </div>
    ))}
  </div>
);

export const CardSkeleton = () => (
  <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
    <Skeleton className="h-6 w-1/3" />
    <Skeleton className="h-10 w-2/3" />
    <Skeleton className="h-4 w-full" />
  </div>
);
