import { useEffect, useRef, useState } from 'react';
import { ChevronDown, MapPin, Wrench } from 'lucide-react';
import type { NavDestination } from '../../services/navigationService';
import { CAMPUS_LOOKUP_PART, type CampusPart } from '../../lib/chatTypes';

/**
 * The quiet "trace" above an answer: the model's thinking and any steps it
 * took. Deliberately faint so the answer stays the star.
 */

const faint = 'text-muted-foreground/70';

/** Shown before anything has arrived from the model. */
export function GhostThinking() {
  return (
    <div role="status" aria-live="polite" className={`flex items-center gap-2 text-[15px] ${faint}`}>
      <span className="ghost-dot" aria-hidden />
      <span className="ghost-pulse">Thinking…</span>
    </div>
  );
}

interface ReasoningTraceProps {
  text: string;
  /** The model is still thinking. */
  streaming: boolean;
  /** Seconds reported by the server once the answer is done. */
  seconds?: number;
}

/** "Thought for 4 seconds" — opens to show what the model worked out. */
export function ReasoningTrace({ text, streaming, seconds }: ReasoningTraceProps) {
  const [open, setOpen] = useState(streaming);
  const [elapsed, setElapsed] = useState(0);
  const startedAt = useRef(Date.now());
  const wasStreaming = useRef(streaming);
  const bodyRef = useRef<HTMLDivElement>(null);

  // Fold away on its own once the model starts answering.
  useEffect(() => {
    if (wasStreaming.current && !streaming) setOpen(false);
    wasStreaming.current = streaming;
  }, [streaming]);

  // Count live while thinking.
  useEffect(() => {
    if (!streaming) return;
    const timer = setInterval(() => setElapsed(Math.round((Date.now() - startedAt.current) / 1000)), 500);
    return () => clearInterval(timer);
  }, [streaming]);

  // Keep the newest words in view while they stream.
  useEffect(() => {
    if (streaming && open && bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [text, streaming, open]);

  const secs = seconds ?? Math.max(1, elapsed);
  const label = streaming
    ? 'Thinking…'
    : seconds !== undefined || elapsed > 0
      ? `Thought for ${secs} second${secs === 1 ? '' : 's'}`
      : 'Thought process';

  return (
    <div className="text-[15px]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`group inline-flex items-center gap-1.5 rounded-md py-0.5 transition-colors hover:text-foreground ${faint}`}
      >
        <span className={streaming ? 'ghost-pulse' : ''}>{label}</span>
        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} aria-hidden />
      </button>

      {open && (
        <div
          ref={bodyRef}
          className={`trace-fade mt-1 max-h-40 overflow-y-auto whitespace-pre-wrap pr-2 leading-7 ${faint}`}
        >
          {text.trim() || '…'}
        </div>
      )}
    </div>
  );
}

type ToolLikePart = CampusPart & {
  toolCallId?: string;
  state?: 'input-streaming' | 'input-available' | 'output-available' | 'output-error';
  output?: unknown;
};

/** One step the assistant took, e.g. looking up a campus place. */
export function ToolStep({ part }: { part: CampusPart }) {
  const tool = part as ToolLikePart;
  const running = tool.state === 'input-streaming' || tool.state === 'input-available';
  const failed = tool.state === 'output-error';

  let Icon = Wrench;
  let label = 'Working on it…';
  let doneLabel = 'Done';

  if (part.type === CAMPUS_LOOKUP_PART) {
    const place = tool.output as NavDestination | null | undefined;
    Icon = MapPin;
    label = 'Looking up the place…';
    doneLabel = place ? `Found ${place.name}` : 'No matching campus place';
  } else if (part.type.startsWith('tool-')) {
    const name = part.type.slice('tool-'.length);
    label = `Running ${name}…`;
    doneLabel = `Ran ${name}`;
  }

  return (
    <div className={`flex items-center gap-2 text-[15px] ${faint}`}>
      <Icon className="h-4 w-4 shrink-0" aria-hidden />
      <span className={running ? 'ghost-pulse' : ''}>{failed ? 'Could not finish this step' : running ? label : doneLabel}</span>
    </div>
  );
}
