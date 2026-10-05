import React from 'react';

const Badge = ({ status, className = '' }) => {
  const styles = {
    'Requested': 'bg-slate-100 text-slate-700 border-slate-200',
    'Accepted': 'bg-teal-50 text-primary-dark border-teal-200',
    'In progress': 'bg-amber-50 text-amber-700 border-amber-200',
    'Completed': 'bg-green-50 text-green-700 border-green-200',
    'Cancelled': 'bg-red-50 text-red-700 border-red-200',
  };

  const badgeStyle = styles[status] || styles['Requested'];

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badgeStyle} ${className}`}>
      {status}
    </span>
  );
};

export default Badge;