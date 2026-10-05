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
    "inline-flex items-center justify-center font-medium transition-colors duration-100 rounded-[4px] select-none disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer tracking-wide";

  const sizeStyles = {
    sm: "text-xs px-2.5 py-1.5 gap-1.5",
    md: "text-xs px-3 py-1.5 gap-1.5",
    lg: "text-sm px-4 py-2 gap-2",
  };

  const variantStyles = {
    primary:
      "bg-[#B4232A] hover:bg-[#961C22] text-[#EDEDEE] border border-[#7F171C] active:bg-[#7F171C]",
    secondary:
      "bg-[#15171A] hover:bg-[#1C1F24] text-[#EDEDEE] border border-[#22252A] active:bg-[#111317]",
    danger:
      "bg-[#4A161A] hover:bg-[#5C1B20] text-[#D15E65] border border-[#701E25] active:bg-[#3D1215]",
    outline:
      "bg-transparent hover:bg-[#15171A] text-[#8A909A] hover:text-[#EDEDEE] border border-[#22252A]",
    ghost:
      "bg-transparent hover:bg-[#15171A] text-[#8A909A] hover:text-[#EDEDEE]",
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
