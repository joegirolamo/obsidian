'use client';

import { forwardRef } from 'react';
import { cn } from '@obsidian/utils';

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('px-6 py-4 border-b border-gray-200', className)}
        {...props}
      />
    );
  }
);

CardHeader.displayName = 'CardHeader';

export default CardHeader; 