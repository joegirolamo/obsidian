interface ServerTruncatedTextProps {
  text: string;
  maxLines?: number;
  className?: string;
  bgColor?: string;
}

export default function ServerTruncatedText({ 
  text, 
  className = '',
}: ServerTruncatedTextProps) {
  // If text is empty or null, return nothing
  if (!text) return null;

  return (
    <div className={className}>
      <p className="text-xs text-gray-600">
        {text}
      </p>
    </div>
  );
} 