'use client';

import { cn } from '@obsidian/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const Card = ({ className, children, ...props }: CardProps) => {
  return (
    <div
      className={cn(
        'bg-white shadow rounded-lg overflow-hidden',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

const CardHeader = ({ className, children, ...props }: CardHeaderProps) => {
  return (
    <div
      className={cn(
        'px-6 py-4 border-b border-gray-200',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

const CardBody = ({ className, children, ...props }: CardBodyProps) => {
  return (
    <div
      className={cn(
        'px-6 py-4',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

const CardFooter = ({ className, children, ...props }: CardFooterProps) => {
  return (
    <div
      className={cn(
        'px-6 py-4 border-t border-gray-200',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;

export default Card; 