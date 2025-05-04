'use client';

import { forwardRef } from 'react';
import { cn } from '@obsidian/utils';

export interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {}

const CardBody = forwardRef<HTMLDivElement, CardBodyProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('px-6 py-4', className)}
        {...props}
      />
    );
  }
);

CardBody.displayName = 'CardBody';

export default CardBody; 