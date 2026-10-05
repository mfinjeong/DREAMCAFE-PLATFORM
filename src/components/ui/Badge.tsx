import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "outline";
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "default",
  className = "",
}) => {
  const variantStyles = {
    default: "bg-slate-800 text-slate-300 border-slate-700",
    success: "bg-emerald-950/60 text-emerald-400 border-emerald-800/60",
    warning: "bg-amber-950/60 text-amber-400 border-amber-800/60",
    danger: "bg-red-950/60 text-red-400 border-red-800/60",
    info: "bg-blue-950/60 text-blue-400 border-blue-800/60",
    outline: "bg-transparent text-slate-400 border-slate-700",
  };

  return (
    <span
      className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded border ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
