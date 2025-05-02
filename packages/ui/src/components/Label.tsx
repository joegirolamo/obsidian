'use client';

import { forwardRef } from 'react';
import { cn } from '@obsidian/utils';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
  labelSize?: 'sm' | 'md' | 'lg';
}

const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, children, required, labelSize = 'md', ...props }, ref) => {
    const sizes = {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg'
    };

    return (
      <label
        ref={ref}
        className={cn(
          'block font-medium text-gray-700',
          sizes[labelSize],
          className
        )}
        {...props}
      >
        {children}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
    );
  }
);

Label.displayName = 'Label';

export default Label; 