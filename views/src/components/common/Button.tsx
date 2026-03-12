import React from "react";
import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  isLoading = false,
  children,
  className = "",
  disabled,
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary:
      "bg-[#0891b2] text-white hover:bg-cyan-700 focus:ring-[#0891b2] active:bg-cyan-800",
    secondary:
      "bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500 active:bg-gray-800",
    outline:
      "border-2 border-[#0891b2] text-[#0891b2] hover:bg-sky-50 focus:ring-[#0891b2] active:bg-sky-100",
    ghost:
      "text-gray-700 hover:bg-gray-100 focus:ring-gray-500 active:bg-gray-200",
    danger:
      "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 active:bg-red-800",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
};
