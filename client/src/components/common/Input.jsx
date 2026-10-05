import React, { forwardRef } from 'react';

const Input = forwardRef(({ label, error, id, className = '', ...props }, ref) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-ink">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={`px-3 py-2 bg-white border rounded-lg text-sm transition-colors duration-150 outline-none focus:ring-2 focus:ring-primary/20 ${
          error 
            ? 'border-red-300 focus:border-red-500' 
            : 'border-slate-200 focus:border-primary placeholder:text-slate-400'
        }`}
        {...props}
      />
      {error && <span className="text-xs text-red-500 font-medium">{error}</span>}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;