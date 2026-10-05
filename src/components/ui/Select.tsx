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
            className="block text-[10px] font-mono uppercase tracking-wider text-[#8A909A] mb-1 font-medium"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={`w-full bg-[#111317] border ${
            error ? "border-[#B4232A]" : "border-[#22252A] focus:border-[#B4232A]"
          } rounded-[4px] px-2.5 py-1.5 text-xs text-[#EDEDEE] transition-colors focus:outline-none disabled:opacity-50 disabled:bg-[#15171A] ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-[#15171A] text-[#EDEDEE]">
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1 text-[10px] text-[#D15E65] font-mono">{error}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";
