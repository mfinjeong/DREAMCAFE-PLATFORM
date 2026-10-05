import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "sm",
  isLoading = false,
  className = "",
  disabled,
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center font-medium transition-colors duration-100 rounded-[3px] select-none disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer tracking-wide";

  const sizeStyles = {
    sm: "text-xs px-2.5 py-1.5 gap-1.5",
    md: "text-xs px-3 py-1.5 gap-1.5",
    lg: "text-sm px-4 py-2 gap-2",
  };

  const variantStyles = {
    primary:
      "bg-[#b91c1c] hover:bg-[#991b1b] text-white border border-[#dc2626]/40 shadow-sm active:bg-[#7f1d1d]",
    secondary:
      "bg-[#181a22] hover:bg-[#20232e] text-zinc-200 border border-[#2b3040] active:bg-[#15171e]",
    danger:
      "bg-[#5c1319] hover:bg-[#6e181f] text-red-200 border border-red-900/60 active:bg-[#470f14]",
    outline:
      "bg-transparent hover:bg-[#181a22] text-zinc-300 border border-[#2b3040]",
    ghost:
      "bg-transparent hover:bg-[#181a22] text-zinc-400 hover:text-zinc-200",
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? "..." : children}
    </button>
  );
};
