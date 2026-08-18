/// <reference types="@types/google.maps" />
import { Message } from '@workspace/api-client-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  ThumbsUp, ThumbsDown, Copy, RotateCw, Volume2, Loader2,
  Check, AlertTriangle, ExternalLink,
} from 'lucide-react';
import { SourceCard } from './SourceCard';
import { FollowUpChips } from './FollowUpChips';
import { NavigationCard } from '../navigation/NavigationCard';
import { parseNavTag, stripNavTag } from '../../services/navigationService';
import { useState, useCallback, useRef } from 'react';
import { useAppStore } from '../../store/appStore';
import type { NavDestination } from '../../services/navigationService';
import type { Components } from 'react-markdown';

interface AssistantMessageProps {
  message: Message | { content: string; citations?: any[]; followUps?: string[] };
  isStreaming?: boolean;
  model?: string | null;
  modelLabel?: string | null;
  navigationCard?: NavDestination | null;
  onRegenerate?: () => void;
}

// ── Model badge ──────────────────────────────────────────────────────────────
function getModelBadge(model: string | null | undefined, label: string | null | undefined) {
  const m = model ?? '';
  const display = label || (
    m.includes('gpt-oss-120b') ? 'GPT OSS · 120B' :
    m.includes('gpt-oss-20b')  ? 'GPT OSS · 20B'  :
    m.includes('qwen3.6')      ? 'Qwen 3.6 · 27B' :
    m ? m.split('/').pop() ?? 'CampusGPT' : 'CampusGPT'
  );
  const color =
    m.includes('gpt-oss-120b') ? 'text-blue-500'   :
    m.includes('gpt-oss-20b')  ? 'text-sky-500'    :
    m.includes('qwen')         ? 'text-violet-500' : 'text-text-tertiary';
  return { text: display, color };
}

// ── Inline code ──────────────────────────────────────────────────────────────
function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="font-mono text-[13px] bg-card border border-border px-1.5 py-0.5 rounded-md before:content-none after:content-none">
      {children}
    </code>
  );
}

// ── Fenced code block with syntax highlighting + copy ────────────────────────
function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);
  const { theme } = useAppStore();

  const copy = () => {
    navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="code-block-wrapper relative group rounded-xl overflow-hidden border border-border my-4 text-left">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 dark:bg-zinc-950">
        <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
          {language || 'code'}
        </span>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 text-[11px] text-zinc-400 hover:text-white transition-colors px-2 py-1 rounded-md hover:bg-white/10"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
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

// ── ReactMarkdown component map ──────────────────────────────────────────────
function useMarkdownComponents(): Components {
  return {
    code(props) {
      const { children, className } = props;
      const match = /language-(\w+)/.exec(className || '');
      const code = String(children).replace(/\n$/, '');
      const isBlock = className?.startsWith('language-') || code.includes('\n');
      if (isBlock) {
        return <CodeBlock language={match?.[1] ?? ''} code={code} />;
      }
      return <InlineCode>{children}</InlineCode>;
    },
    // Nicer blockquote
    blockquote({ children }) {
      return (
        <blockquote className="border-l-2 border-brand-500 pl-4 py-0.5 my-3 text-text-secondary italic">
          {children}
        </blockquote>
      );
    },
    // Open external links in new tab
    a({ href, children }) {
      const isExternal = href?.startsWith('http');
      return (
        <a
          href={href}
          target={isExternal ? '_blank' : undefined}
          rel={isExternal ? 'noopener noreferrer' : undefined}
          className="text-brand-500 underline-offset-2 hover:underline inline-flex items-center gap-0.5"
        >
          {children}
          {isExternal && <ExternalLink className="w-3 h-3 opacity-60 inline" />}
        </a>
      );
    },
  };
}

// ── TTS hook ─────────────────────────────────────────────────────────────────
type SpeakState = 'idle' | 'loading' | 'playing';

function useTTS() {
  const [state, setState] = useState<SpeakState>('idle');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const speak = useCallback(async (text: string) => {
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
      audio.onerror = () => { setState('idle'); };
      setState('playing');
      await audio.play();
    } catch {
      setState('idle');
    }
  }, [state]);

  return { state, speak };
}

// ── Source / trust badge ──────────────────────────────────────────────────────
function TrustBadge({ content }: { content: string }) {
  const hasWarning = content.includes('⚠️') || content.includes('🔴');
  if (!hasWarning) return null;
  return (
    <div className="flex items-center gap-1.5 mt-3 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40">
      <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
      <span className="text-xs text-amber-700 dark:text-amber-400">
        Verify with official UG sources before acting on this information.
      </span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function AssistantMessage({
  message, isStreaming, model, modelLabel, navigationCard: liveNavCard, onRegenerate,
}: AssistantMessageProps) {
  const rawContent = message.content ?? '';
  const savedNavCard = !isStreaming ? parseNavTag(rawContent) : null;
  const navCard = liveNavCard ?? savedNavCard;
  const cleanContent = stripNavTag(rawContent);
  const displayContent = isStreaming ? `${cleanContent}▍` : cleanContent;

  const badge = getModelBadge(model, modelLabel);
  const { state: ttsState, speak } = useTTS();
  const components = useMarkdownComponents();

  const [copied, setCopied] = useState(false);
  const copyMsg = () => {
    navigator.clipboard?.writeText(cleanContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col w-full py-4 md:py-6 px-2 md:px-4 msg-enter group/msg">
      {/* Avatar + model badge row */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-brand-500 to-indigo-500 shrink-0" />
        <div className="text-xs font-medium text-text-tertiary flex items-center gap-1.5">
          CampusGPT
          {!isStreaming && model && (
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-card border border-border ${badge.color}`}>
              {badge.text}
            </span>
          )}
          {isStreaming && (
            <span className="flex gap-0.5 ml-1">
              {[0, 150, 300].map(d => (
                <span key={d} className="w-1 h-1 bg-brand-500 rounded-full animate-bounce"
                  style={{ animationDelay: `${d}ms` }} />
              ))}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="pl-7 w-full max-w-[760px]">
        <div className="prose prose-sm md:prose-base prose-slate dark:prose-invert max-w-none
          prose-p:leading-[1.75] prose-p:tracking-[-0.005em] prose-p:text-[15px] md:prose-p:text-[16px] prose-p:text-text-primary
          prose-a:text-brand-500 prose-a:no-underline hover:prose-a:underline
          prose-strong:font-semibold prose-strong:text-text-primary
          prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
          prose-blockquote:border-l-brand-500 prose-blockquote:text-text-secondary prose-blockquote:not-italic
          prose-ul:text-text-primary prose-ol:text-text-primary
          prose-li:text-[15px] md:prose-li:text-[16px]
          prose-table:not-prose prose-hr:border-border"
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
            {displayContent}
          </ReactMarkdown>
        </div>

        {/* Trust badge — shown if response contains uncertainty markers */}
        {!isStreaming && <TrustBadge content={cleanContent} />}

        {/* Navigation card */}
        {navCard && <NavigationCard destination={navCard} />}

        {/* Citations */}
        {(message as any).citations?.length > 0 && !isStreaming && (
          <div className="mt-6">
            <h4 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">Sources</h4>
            <div className="flex flex-wrap gap-2">
              {(message as any).citations.map((c: any, i: number) => (
                <SourceCard key={i} citation={c} />
              ))}
            </div>
          </div>
        )}

        {/* Follow-ups */}
        {!isStreaming && (message as any).followUps?.length > 0 && (
          <div className="mt-6">
            <FollowUpChips chips={(message as any).followUps} />
          </div>
        )}

        {/* Message actions — visible on hover */}
        {!isStreaming && (
          <div className="flex items-center gap-0.5 mt-3 opacity-0 group-hover/msg:opacity-100 transition-opacity duration-150 -ml-2">
            <ActionButton onClick={() => speak(cleanContent)} title={ttsState === 'playing' ? 'Stop' : 'Listen'} active={ttsState === 'playing'}>
              {ttsState === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Volume2 className="w-4 h-4" />}
            </ActionButton>
            <ActionButton onClick={copyMsg} title="Copy">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </ActionButton>
            {onRegenerate && (
              <ActionButton onClick={onRegenerate} title="Regenerate response">
                <RotateCw className="w-4 h-4" />
              </ActionButton>
            )}
            <ActionButton title="Good response"><ThumbsUp className="w-4 h-4" /></ActionButton>
            <ActionButton title="Bad response"><ThumbsDown className="w-4 h-4" /></ActionButton>
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
  title?: string;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded-md transition-all text-text-tertiary hover:text-text-primary hover:bg-card active:scale-95 ${
        active ? 'text-brand-500 bg-brand-50 dark:bg-brand-500/10' : ''
      }`}
    >
      {children}
    </button>
  );
}
