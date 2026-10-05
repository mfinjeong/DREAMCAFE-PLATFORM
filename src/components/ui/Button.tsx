import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "outline" | "ghost";
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
    "inline-flex items-center justify-center font-medium transition-colors rounded select-none disabled:opacity-40 disabled:cursor-not-allowed";

  const sizeStyles = {
    sm: "text-xs px-2.5 py-1.5 gap-1.5",
    md: "text-xs px-3 py-2 gap-2",
    lg: "text-sm px-4 py-2 gap-2",
  };

  const variantStyles = {
    primary: "bg-[#dc2626] hover:bg-[#b91c1c] text-white font-semibold",
    secondary: "bg-[#161922] hover:bg-[#1f232e] text-zinc-200 border border-[#262b38]",
    danger: "bg-[#7f1d1d] hover:bg-[#991b1b] text-white",
    outline: "bg-transparent hover:bg-[#161922] text-zinc-300 border border-[#262b38]",
    ghost: "bg-transparent hover:bg-[#161922] text-zinc-400 hover:text-zinc-200",
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
