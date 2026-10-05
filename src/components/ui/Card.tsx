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
    default: "bg-[#15171A] border-[#22252A]",
    elevated: "bg-[#181B1F] border-[#22252A]",
    interactive: "bg-[#15171A] border-[#22252A] hover:border-[#31363F] transition-colors cursor-pointer",
  };

  return (
    <div
      className={`rounded-[4px] border p-3.5 text-[#EDEDEE] ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
