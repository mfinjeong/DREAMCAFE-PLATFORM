import React from "react";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { label: string; value: string | number }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className = "", id, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={`w-full bg-[#0e1017] border ${
            error ? "border-red-600" : "border-[#242838] focus:border-[#b91c1c]"
          } rounded-[2px] px-2.5 py-1.5 text-xs text-zinc-100 transition-colors focus:outline-none disabled:opacity-50 disabled:bg-[#12141c] ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-[#12141c] text-zinc-100">
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1 text-[10px] text-red-400 font-mono">{error}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";
