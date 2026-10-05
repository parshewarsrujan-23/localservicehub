import React from 'react';
import { Loader2 } from 'lucide-react';

const Button = ({
  children,
  variant = 'primary',
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-lg px-4 py-2 font-medium transition-all duration-150 active:scale-[0.97] hover:-translate-y-[1px]';
  const disabledStyles = 'opacity-60 cursor-not-allowed hover:translate-y-0 active:scale-100';
  
  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-dark shadow-sm',
    secondary: 'bg-white border border-slate-200 text-ink hover:bg-slate-50 hover:border-slate-300 shadow-sm',
    danger: 'bg-red-50 text-red-600 border border-red-100 hover:bg-red-100',
  };

  const combinedStyles = `${baseStyles} ${variants[variant]} ${(disabled || isLoading) ? disabledStyles : ''} ${className}`;

  return (
    <button 
      className={combinedStyles} 
      disabled={disabled || isLoading} 
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {children}
    </button>
  );
};

export default Button;