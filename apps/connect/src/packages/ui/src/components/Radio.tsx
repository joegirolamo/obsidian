'use client';

import { forwardRef } from 'react';
import { cn } from '@obsidian/utils';

export interface RadioProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  radioSize?: 'sm' | 'md' | 'lg';
}

const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ className, label, error, radioSize = 'md', ...props }, ref) => {
    const baseStyles = 'border-gray-300 text-blue-600 focus:ring-blue-500';
    
    const sizes = {
      sm: 'h-3 w-3',
      md: 'h-4 w-4',
      lg: 'h-5 w-5'
    };

    const labelSizes = {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg'
    };

    return (
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            type="radio"
            className={cn(
              baseStyles,
              sizes[radioSize],
              error && 'border-red-300 focus:border-red-500 focus:ring-red-500',
              className
            )}
            ref={ref}
            {...props}
          />
        </div>
        <div className="ml-2">
          {label && (
            <label className={cn(
              "font-medium text-gray-700",
              labelSizes[radioSize]
            )}>
              {label}
            </label>
          )}
          {error && (
            <p className="mt-1 text-sm text-red-600">{error}</p>
          )}
        </div>
      </div>
    );
  }
);

Radio.displayName = 'Radio';

export default Radio; 