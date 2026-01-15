import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'md' | 'lg';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  size = 'md', 
  children, 
  className = '',
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center rounded-lg font-bold transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-offset-2";
  
  const variants = {
    primary: "bg-royalBlue text-white hover:bg-blue-800 focus:ring-blue-500",
    secondary: "bg-warmOrange text-white hover:bg-yellow-600 focus:ring-yellow-500",
    outline: "border-2 border-royalBlue text-royalBlue hover:bg-blue-50 focus:ring-blue-500",
  };

  const sizes = {
    md: "px-6 py-3 text-lg",
    lg: "px-8 py-4 text-xl w-full md:w-auto", // Large default for ease of use
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};