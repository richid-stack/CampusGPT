import { useEffect, useState } from 'react';

const STAGES = [
  {
    id: 'search',
    label: 'Searching campus database',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="10" cy="10" r="7" />
        <path d="M21 21l-4.35-4.35" />
      </svg>
    ),
    delay: 0,
    hold: 750,
  },
  {
    id: 'read',
    label: 'Reading documents',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
    delay: 750,
    hold: 650,
  },
  {
    id: 'analyze',
    label: 'Analyzing context',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    delay: 1400,
    hold: 550,
  },
  {
    id: 'connect',
    label: 'Connecting information',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
      </svg>
    ),
    delay: 1950,
    hold: 0,
  },
  {
    id: 'prepare',
    label: 'Preparing response',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
    ),
    delay: 2450,
    hold: 0,
  },
] as const;

function Spinner() {
  return (
    <svg
      width="12" height="12" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
      className="animate-spin text-brand-500"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

function CheckMark() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-500">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export function ThinkingIndicator() {
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    setActiveIdx(0);
    const timers: ReturnType<typeof setTimeout>[] = [];
    STAGES.forEach((stage, i) => {
      if (i === 0) return;
      timers.push(setTimeout(() => setActiveIdx(i), stage.delay));
    });
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="flex items-start gap-3 py-3 px-2 md:px-4">
      <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-brand-500 to-indigo-500 shrink-0 mt-0.5" />
      <div className="flex flex-col gap-1">
        {STAGES.map((stage, i) => {
          const isDone   = i < activeIdx;
          const isActive = i === activeIdx;
          const isPending = i > activeIdx;
          return (
            <div
              key={stage.id}
              className="flex items-center gap-2 transition-all duration-300"
              style={{ opacity: isPending ? 0.25 : isDone ? 0.45 : 1 }}
            >
              <span className={isActive ? 'text-brand-500' : isDone ? 'text-text-tertiary' : 'text-text-tertiary'}>
                {stage.icon}
              </span>
              <span className={`text-[13px] font-medium tracking-tight ${isActive ? 'text-text-primary' : 'text-text-tertiary'}`}>
                {stage.label}
              </span>
              <span className="ml-auto">
                {isActive  && <Spinner />}
                {isDone    && <CheckMark />}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
