import React from 'react';
import clsx from 'clsx';

const Card = ({ 
  children, 
  className = '', 
  padding = 'default',
  shadow = 'default',
  rounded = 'default',
  hover = false,
  ...props 
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    default: 'p-6',
    lg: 'p-8'
  };

  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    default: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl'
  };

  const roundedClasses = {
    none: '',
    sm: 'rounded-sm',
    default: 'rounded-lg',
    lg: 'rounded-xl',
    full: 'rounded-full'
  };

  return (
    <div
      className={clsx(
        'bg-white',
        paddingClasses[padding],
        shadowClasses[shadow],
        roundedClasses[rounded],
        {
          'hover:shadow-lg transition-shadow duration-300': hover,
        },
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;