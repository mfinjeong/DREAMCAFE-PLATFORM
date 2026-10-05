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
            className="block text-[10px] font-mono uppercase tracking-wider text-[#8A909A] mb-1 font-medium"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full bg-[#111317] border ${
            error ? "border-[#B4232A]" : "border-[#22252A] focus:border-[#B4232A]"
          } rounded-[4px] px-2.5 py-1.5 text-xs text-[#EDEDEE] placeholder-[#585C66] transition-colors focus:outline-none disabled:opacity-50 disabled:bg-[#15171A] ${className}`}
          {...props}
        />
        {error ? (
          <p className="mt-1 text-[10px] text-[#D15E65] font-mono">{error}</p>
        ) : helperText ? (
          <p className="mt-1 text-[10px] text-[#585C66]">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
