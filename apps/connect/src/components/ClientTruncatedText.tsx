'use client';

interface ClientTruncatedTextProps {
  text: string;
  maxLength?: number;
  className?: string;
}

export default function ClientTruncatedText({ 
  text, 
  maxLength = 150,
  className = '',
}: ClientTruncatedTextProps) {
  // If text is empty or null, return nothing
  if (!text) return null;

  // Truncate text if it's longer than maxLength
  const displayText = text.length > maxLength 
    ? `${text.substring(0, maxLength)}...` 
    : text;

  return (
    <div className={`${className}`}>
      <p className="text-sm text-gray-600">
        {displayText}
      </p>
    </div>
  );
} 