/// <reference types="@types/google.maps" />
import { useCallback, useMemo, useRef, useState } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { AlertTriangle, Check, Copy, ExternalLink, Loader2, RotateCw, Volume2 } from 'lucide-react';
import { SourceCard } from './SourceCard';
import { GhostThinking, ReasoningTrace, ToolStep } from './ChatTrace';
import { NavigationCard } from '../navigation/NavigationCard';
import { useAppStore } from '../../store/appStore';
import type { NavDestination } from '../../services/navigationService';
import { CAMPUS_LOOKUP_PART, isToolPart, messageText, type CampusMessage, type CampusPart } from '../../lib/chatTypes';

interface AssistantMessageProps {
  message: CampusMessage;
  /** This answer is still being written. */
  live?: boolean;
  /** The request is sent but nothing has come back yet. */
  waiting?: boolean;
  onRegenerate?: () => void;
}

// ── Inline code ──────────────────────────────────────────────────────────────
function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded-md border border-border bg-card px-1.5 py-0.5 font-mono text-[13px] before:content-none after:content-none">
      {children}
    </code>
  );
}

// ── Fenced code block with syntax highlighting + copy ────────────────────────
function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);
  const theme = useAppStore((s) => s.theme);

  const copy = () => {
    navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="code-block-wrapper group relative my-4 overflow-hidden rounded-xl border border-border text-left">
      <div className="flex items-center justify-between bg-zinc-900 px-4 py-2 dark:bg-zinc-950">
        <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-400">{language || 'code'}</span>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <SyntaxHighlighter
        language={language || 'text'}
        style={theme === 'dark' ? vscDarkPlus : vs}
        customStyle={{
          margin: 0,
          borderRadius: 0,
          fontSize: '13px',
          lineHeight: '1.65',
          background: theme === 'dark' ? '#1E1E1E' : '#FAFAFA',
          padding: '16px',
        }}
        PreTag="div"
        wrapLongLines
      >
        {code.replace(/\n$/, '')}
      </SyntaxHighlighter>
    </div>
  );
}

const markdownComponents: Components = {
  code(props) {
    const { children, className } = props;
    const match = /language-(\w+)/.exec(className || '');
    const code = String(children).replace(/\n$/, '');
    const isBlock = className?.startsWith('language-') || code.includes('\n');
    if (isBlock) return <CodeBlock language={match?.[1] ?? ''} code={code} />;
    return <InlineCode>{children}</InlineCode>;
  },
  blockquote({ children }) {
    return <blockquote className="my-3 border-l-2 border-foreground/25 py-0.5 pl-4 text-muted-foreground">{children}</blockquote>;
  },
  a({ href, children }) {
    const isExternal = href?.startsWith('http');
    return (
      <a
        href={href}
        target={isExternal ? '_blank' : undefined}
        rel={isExternal ? 'noopener noreferrer' : undefined}
        className="inline-flex items-center gap-0.5 underline decoration-foreground/30 underline-offset-2 hover:decoration-foreground"
      >
        {children}
        {isExternal && <ExternalLink className="inline h-3 w-3 opacity-60" />}
      </a>
    );
  },
};

// ── Read aloud ───────────────────────────────────────────────────────────────
type SpeakState = 'idle' | 'loading' | 'playing';

function useTTS() {
  const [state, setState] = useState<SpeakState>('idle');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const speak = useCallback(
    async (text: string) => {
      if (state === 'loading') return;
      if (state === 'playing') {
        audioRef.current?.pause();
        setState('idle');
        return;
      }
      setState('loading');
      try {
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });
        if (!res.ok) throw new Error('TTS failed');
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onended = () => { setState('idle'); URL.revokeObjectURL(url); };
        audio.onerror = () => setState('idle');
        setState('playing');
        await audio.play();
      } catch {
        setState('idle');
      }
    },
    [state],
  );

  return { state, speak };
}

function TrustBadge({ content }: { content: string }) {
  if (!content.includes('⚠️') && !content.includes('🔴')) return null;
  return (
    <div className="mt-3 flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-900/40 dark:bg-amber-950/20">
      <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
      <span className="text-xs text-amber-700 dark:text-amber-400">Verify with official UG sources before acting on this information.</span>
    </div>
  );
}

type Block =
  | { kind: 'trace'; parts: CampusPart[] }
  | { kind: 'text'; text: string };

/** Groups the message into trace steps (thinking, tools) and written text, in order. */
function toBlocks(parts: CampusPart[]): Block[] {
  const blocks: Block[] = [];
  for (const part of parts) {
    if (part.type === 'reasoning' || isToolPart(part)) {
      const last = blocks[blocks.length - 1];
      if (last?.kind === 'trace') last.parts.push(part);
      else blocks.push({ kind: 'trace', parts: [part] });
    } else if (part.type === 'text') {
      const last = blocks[blocks.length - 1];
      if (last?.kind === 'text') last.text += part.text;
      else blocks.push({ kind: 'text', text: part.text });
    }
  }
  return blocks;
}

// ── Main component ───────────────────────────────────────────────────────────
export function AssistantMessage({ message, live, waiting, onRegenerate }: AssistantMessageProps) {
  const { state: ttsState, speak } = useTTS();
  const [copied, setCopied] = useState(false);

  const blocks = useMemo(() => toBlocks(message.parts), [message.parts]);
  const answer = messageText(message);
  const hasAnswer = answer.trim().length > 0;

  const place = useMemo(() => {
    const part = message.parts.find((p) => p.type === CAMPUS_LOOKUP_PART) as { output?: NavDestination | null } | undefined;
    return part?.output ?? null;
  }, [message.parts]);

  const sources = message.parts.flatMap((p) =>
    p.type === 'source-url'
      ? [{ url: p.url, title: p.title, snippet: (p.providerMetadata?.campusgpt as { snippet?: string } | undefined)?.snippet }]
      : [],
  );

  const copyMessage = () => {
    navigator.clipboard?.writeText(answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const nothingYet = message.parts.length === 0;
  const modelLabel = message.metadata?.modelLabel;

  return (
    <div className="msg-enter group/msg flex w-full flex-col px-2 md:px-4">
      <div className="flex w-full max-w-[760px] flex-col gap-3">
        {(waiting || nothingYet) && live && <GhostThinking />}

        {blocks.map((block, i) => {
          if (block.kind === 'trace') {
            const reasoning = block.parts.filter((p) => p.type === 'reasoning');
            const reasoningText = reasoning.map((p) => (p.type === 'reasoning' ? p.text : '')).join('\n\n');
            // A stopped reply keeps its last part marked "streaming"; only a live one is still thinking.
            const thinking = Boolean(live) && reasoning.some((p) => p.type === 'reasoning' && p.state === 'streaming');
            return (
              <div key={i} className="flex flex-col gap-2">
                {block.parts.map((p, j) =>
                  p.type === 'reasoning' ? (
                    // One row for all of the thinking, placed where it started.
                    j === block.parts.findIndex((x) => x.type === 'reasoning') ? (
                      <ReasoningTrace
                        key={j}
                        text={reasoningText}
                        streaming={Boolean(live) && thinking}
                        seconds={message.metadata?.thinkingSeconds}
                      />
                    ) : null
                  ) : (
                    <ToolStep key={j} part={p} />
                  ),
                )}
              </div>
            );
          }
          return (
            <div
              key={i}
              className="prose prose-sm md:prose-base prose-slate dark:prose-invert max-w-none
                prose-p:leading-[1.75] prose-p:tracking-[-0.005em] prose-p:text-[15px] md:prose-p:text-[16px]
                prose-strong:font-semibold prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
                prose-li:text-[15px] md:prose-li:text-[16px] prose-table:not-prose prose-hr:border-border"
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {block.text}
              </ReactMarkdown>
            </div>
          );
        })}

        {live && hasAnswer && (
          <span className="ghost-dot text-muted-foreground" aria-label="Writing" />
        )}

        {!live && <TrustBadge content={answer} />}

        {place && <NavigationCard destination={place} />}

        {sources.length > 0 && !live && (
          <div className="mt-2">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sources</h4>
            <div className="flex flex-wrap gap-2">
              {sources.map((s) => (
                <SourceCard key={s.url} url={s.url} title={s.title} snippet={s.snippet} />
              ))}
            </div>
          </div>
        )}

        {!live && hasAnswer && (
          <div className="-ml-2 flex items-center gap-0.5 opacity-100 transition-opacity duration-150 md:opacity-0 md:group-hover/msg:opacity-100 md:focus-within:opacity-100">
            <ActionButton onClick={() => speak(answer)} title={ttsState === 'playing' ? 'Stop' : 'Listen'} active={ttsState === 'playing'}>
              {ttsState === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Volume2 className="h-4 w-4" />}
            </ActionButton>
            <ActionButton onClick={copyMessage} title="Copy">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </ActionButton>
            {onRegenerate && (
              <ActionButton onClick={onRegenerate} title="Regenerate response">
                <RotateCw className="h-4 w-4" />
              </ActionButton>
            )}
            {modelLabel && <span className="ml-2 text-[11px] text-muted-foreground/70">{modelLabel}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

function ActionButton({
  children, onClick, title, active,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  title: string;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={`rounded-md p-1.5 text-muted-foreground transition-all hover:bg-card hover:text-foreground active:scale-95 ${
        active ? 'bg-card text-foreground' : ''
      }`}
    >
      {children}
    </button>
  );
}
