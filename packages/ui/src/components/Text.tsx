'use client';

import { forwardRef } from 'react';
import { cn } from '@obsidian/utils';

export interface TextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  variant?: 'default' | 'muted' | 'success' | 'error' | 'warning';
}

const Text = forwardRef<HTMLParagraphElement, TextProps>(
  ({ className, size = 'base', weight = 'normal', variant = 'default', children, ...props }, ref) => {
    const sizes = {
      xs: 'text-xs',
      sm: 'text-sm',
      base: 'text-base',
      lg: 'text-lg',
      xl: 'text-xl'
    };

    const weights = {
      normal: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold'
    };

    const variants = {
      default: 'text-gray-900',
      muted: 'text-gray-500',
      success: 'text-green-600',
      error: 'text-red-600',
      warning: 'text-yellow-600'
    };

    return (
      <p
        ref={ref}
        className={cn(
          sizes[size],
          weights[weight],
          variants[variant],
          className
        )}
        {...props}
      >
        {children}
      </p>
    );
  }
);

Text.displayName = 'Text';

export default Text; 