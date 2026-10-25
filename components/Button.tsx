import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'classical' | 'quantum';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  icon,
  className = '',
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    primary: "bg-slate-100 text-slate-900 hover:bg-slate-200 focus-visible:ring-slate-500",
    secondary: "bg-slate-800 text-slate-100 hover:bg-slate-700 focus-visible:ring-slate-500",
    outline: "border border-slate-700 hover:bg-slate-800 hover:text-slate-100",
    ghost: "hover:bg-slate-800 hover:text-slate-100",
    classical: "bg-amber-600 text-white hover:bg-amber-500 focus-visible:ring-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]",
    quantum: "bg-cyan-600 text-white hover:bg-cyan-500 focus-visible:ring-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.3)]",
  };

  const sizes = {
    sm: "h-8 px-3 text-xs",
    md: "h-10 px-4 py-2 text-sm",
    lg: "h-12 px-8 text-base",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`} 
      {...props}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
};
