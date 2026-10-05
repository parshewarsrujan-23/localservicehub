import React from 'react';

const Card = ({ children, hoverable = false, className = '', ...props }) => {
  const baseStyles = 'bg-white rounded-xl shadow-sm border border-slate-100 p-6 transition-all duration-200';
  const hoverStyles = hoverable ? 'hover:-translate-y-1 hover:shadow-md' : '';
  
  return (
    <div className={`${baseStyles} ${hoverStyles} ${className}`} {...props}>
      {children}
    </div>
  );
};

export default Card;