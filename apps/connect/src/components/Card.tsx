import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
}

interface CardHeaderProps {
  children: ReactNode;
}

interface CardBodyProps {
  children: ReactNode;
}

function CardHeader({ children }: CardHeaderProps) {
  return (
    <div className="px-6 py-4 border-b border-gray-200">
      {children}
    </div>
  );
}

function CardBody({ children }: CardBodyProps) {
  return (
    <div className="p-6">
      {children}
    </div>
  );
}

function Card({ children }: CardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {children}
    </div>
  );
}

Card.Header = CardHeader;
Card.Body = CardBody;

export default Card; 