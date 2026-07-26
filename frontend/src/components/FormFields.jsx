import React from 'react';

export const FormInput = ({ label, error, registration, ...props }) => (
  <div className="space-y-1.5">
    {label && (
      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
        {label}
      </label>
    )}
    <input
      {...registration}
      {...props}
      className={`w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition ${
        error
          ? 'border-rose-500 dark:border-rose-500'
          : 'border-slate-300 dark:border-slate-700'
      }`}
    />
    {error && <p className="text-xs text-rose-500 mt-1">{error.message || error}</p>}
  </div>
);

export const FormSelect = ({ label, error, options = [], registration, ...props }) => (
  <div className="space-y-1.5">
    {label && (
      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
        {label}
      </label>
    )}
    <select
      {...registration}
      {...props}
      className={`w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition ${
        error
          ? 'border-rose-500 dark:border-rose-500'
          : 'border-slate-300 dark:border-slate-700'
      }`}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
    {error && <p className="text-xs text-rose-500 mt-1">{error.message || error}</p>}
  </div>
);

export const FormTextarea = ({ label, error, registration, ...props }) => (
  <div className="space-y-1.5">
    {label && (
      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
        {label}
      </label>
    )}
    <textarea
      {...registration}
      {...props}
      rows={props.rows || 3}
      className={`w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition ${
        error
          ? 'border-rose-500 dark:border-rose-500'
          : 'border-slate-300 dark:border-slate-700'
      }`}
    />
    {error && <p className="text-xs text-rose-500 mt-1">{error.message || error}</p>}
  </div>
);
