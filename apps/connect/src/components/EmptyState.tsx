'use client';

import { BarChart2, FileText, Wrench } from 'lucide-react';

type EmptyStateType = 'metrics' | 'questions' | 'tools' | 'default';

interface EmptyStateProps {
  type?: EmptyStateType;
  message?: string;
  className?: string;
}

export default function EmptyState({ 
  type = 'default', 
  message = 'No data available at this time.',
  className = ''
}: EmptyStateProps) {
  
  const getIcon = () => {
    switch (type) {
      case 'metrics':
        return <BarChart2 className="w-10 h-10 text-gray-400" />;
      case 'questions':
        return <FileText className="w-10 h-10 text-gray-400" />;
      case 'tools':
        return <Wrench className="w-10 h-10 text-gray-400" />;
      default:
        return <FileText className="w-10 h-10 text-gray-400" />;
    }
  };

  const defaultMessages = {
    metrics: 'No business metrics have been requested at this time.',
    questions: 'No questions available at this time.',
    tools: 'No tool access requests are needed at this time.',
    default: 'No data available at this time.'
  };

  const displayMessage = message || defaultMessages[type];

  return (
    <div className={`bg-white p-8 rounded-lg shadow-sm border border-gray-100 ${className}`}>
      <div className="flex flex-col items-center justify-center py-4">
        {getIcon()}
        <p className="mt-3 text-gray-500 text-center">{displayMessage}</p>
      </div>
    </div>
  );
} 