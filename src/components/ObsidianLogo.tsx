export default function ObsidianLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 2L3 8.5V15.5L12 22L21 15.5V8.5L12 2ZM12 4.25L18.5 9L12 13.75L5.5 9L12 4.25Z"
        fillRule="evenodd"
        clipRule="evenodd"
      />
    </svg>
  );
} 