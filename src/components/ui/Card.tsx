import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: "default" | "elevated" | "interactive";
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = "default",
  className = "",
  ...props
}) => {
  const variantStyles = {
    default: "bg-[#111622] border-slate-800/80 shadow-sm",
    elevated: "bg-[#161d2d] border-slate-700/80 shadow-md",
    interactive: "bg-[#111622] border-slate-800/80 hover:border-slate-700 transition-all cursor-pointer",
  };

  return (
    <div
      className={`rounded-lg border p-4 text-slate-100 ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
