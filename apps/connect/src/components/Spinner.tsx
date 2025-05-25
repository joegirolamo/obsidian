import React from 'react';

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export default function Spinner({ className = '', ...props }: SpinnerProps) {
  return (
    <div
      className={`animate-spin rounded-full border-t-2 border-b-2 border-primary ${className}`}
      {...props}
    ></div>
  );
} 