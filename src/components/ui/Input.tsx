import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = "", id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full bg-[#12141d] border ${
            error ? "border-red-600" : "border-[#212635] focus:border-red-600"
          } rounded px-2.5 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 transition-colors focus:outline-none disabled:opacity-50 ${className}`}
          {...props}
        />
        {error ? (
          <p className="mt-1 text-[11px] text-red-400 font-mono">{error}</p>
        ) : helperText ? (
          <p className="mt-1 text-[11px] text-zinc-500">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
