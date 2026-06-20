export function ThinkingIndicator() {
  return (
    <div className="flex items-center gap-3 py-4 px-2 md:px-4">
      <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-brand-500 to-indigo-500 shrink-0" />
      <div className="flex items-center gap-1.5 h-5">
        {[0, 160, 320].map(delay => (
          <span
            key={delay}
            className="w-2 h-2 rounded-full bg-text-tertiary"
            style={{
              animation: `thinkDot 1.4s ease-in-out ${delay}ms infinite`,
            }}
          />
        ))}
      </div>
      <style>{`
        @keyframes thinkDot {
          0%, 80%, 100% { opacity: 0.25; transform: scale(0.8); }
          40%            { opacity: 1;    transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}
