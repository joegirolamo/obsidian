'use client';

import { forwardRef } from 'react';
import { cn } from '@obsidian/utils';

export interface ErrorProps extends React.HTMLAttributes<HTMLParagraphElement> {
  errorSize?: 'sm' | 'md' | 'lg';
}

const Error = forwardRef<HTMLParagraphElement, ErrorProps>(
  ({ className, children, errorSize = 'md', ...props }, ref) => {
    const sizes = {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-base'
    };

    return (
      <p
        ref={ref}
        className={cn(
          'text-red-600',
          sizes[errorSize],
          className
        )}
        {...props}
      >
        {children}
      </p>
    );
  }
);

Error.displayName = 'Error';

export default Error; 