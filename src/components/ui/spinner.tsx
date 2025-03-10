import React from 'react';

interface SpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const Spinner: React.FC<SpinnerProps> = ({ className = '', size = 'md' }) => {
  const sizeClass = 
    size === 'sm' ? 'h-4 w-4' : 
    size === 'lg' ? 'h-8 w-8' : 
    'h-6 w-6';
  
  return (
    <div 
      className={`inline-block animate-spin rounded-full border-2 border-solid border-current border-r-transparent ${sizeClass} ${className}`}
      role="status"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default Spinner; 