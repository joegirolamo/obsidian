'use client';

import { forwardRef } from 'react';
import { cn } from '@obsidian/utils';

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  checkboxSize?: 'sm' | 'md' | 'lg';
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, error, checkboxSize = 'md', ...props }, ref) => {
    const baseStyles = 'rounded border-gray-300 text-blue-600 focus:ring-blue-500';
    
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
            type="checkbox"
            className={cn(
              baseStyles,
              sizes[checkboxSize],
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
              labelSizes[checkboxSize]
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

Checkbox.displayName = 'Checkbox';

export default Checkbox; 