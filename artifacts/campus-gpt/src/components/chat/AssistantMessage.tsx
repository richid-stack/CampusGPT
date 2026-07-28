import { Message } from '@workspace/api-client-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ThumbsUp, ThumbsDown, Copy, RotateCw, Volume2, Loader2 } from 'lucide-react';
import { SourceCard } from './SourceCard';
import { FollowUpChips } from './FollowUpChips';
import { NavigationCard } from '../navigation/NavigationCard';
import { parseNavTag, stripNavTag } from '../../services/navigationService';
import { useState, useCallback } from 'react';
import type { NavDestination } from '../../services/navigationService';

interface AssistantMessageProps {
  message: Message | { content: string; citations?: any[]; followUps?: string[] };
  isStreaming?: boolean;
  model?: string | null;
  modelLabel?: string | null;
  /** Live navigation card from SSE (streaming only — saved messages parse from content) */
  navigationCard?: NavDestination | null;
}

function getModelBadge(model: string | null | undefined, label: string | null | undefined) {
  const m = model ?? '';
  const display = label || (
    m.includes('gpt-oss-120b') ? 'GPT OSS · 120B' :
    m.includes('gpt-oss-20b')  ? 'GPT OSS · 20B'  :
    m.includes('qwen3.6')      ? 'Qwen 3.6 · 27B' :
    m ? m.split('/').pop() ?? 'CampusGPT' : 'CampusGPT'
  );
  const color =
    m.includes('gpt-oss-120b') ? 'text-blue-500'    :
    m.includes('gpt-oss-20b')  ? 'text-sky-500'     :
    m.includes('qwen')         ? 'text-violet-500'  : 'text-text-tertiary';
  return { text: display, color };
}

type SpeakState = 'idle' | 'loading' | 'playing';

function useTTS() {
  const [state, setState] = useState<SpeakState>('idle');
  const audioRef = { current: null as HTMLAudioElement | null };

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

export function AssistantMessage({ message, isStreaming, model, modelLabel, navigationCard: liveNavCard }: AssistantMessageProps) {
  const rawContent = message.content ?? '';

  // Parse nav card from saved message content (persisted as <!--NAV:{...}-->)
  const savedNavCard = !isStreaming ? parseNavTag(rawContent) : null;
  const navCard = liveNavCard ?? savedNavCard;

  // Display content — strip the hidden nav tag, add streaming cursor
  const displayContent = isStreaming
    ? `${rawContent}▍`
    : `${stripNavTag(rawContent)}`;

  const badge = getModelBadge(model, modelLabel);
  const { state: ttsState, speak } = useTTS();

  return (
    <div className="flex flex-col w-full py-4 md:py-6 px-2 md:px-4 animate-in">
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
              <span className="w-1 h-1 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1 h-1 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1 h-1 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </span>
          )}
        </div>
      </div>

      <div className="pl-7 w-full max-w-[760px]">
        <div className="prose prose-sm md:prose-base prose-slate dark:prose-invert max-w-none
          prose-p:leading-[28px] prose-p:tracking-[-0.005em] prose-p:text-[15px] md:prose-p:text-[16px] prose-p:text-text-primary
          prose-a:text-brand-500 prose-a:no-underline hover:prose-a:underline
          prose-strong:font-semibold prose-strong:text-text-primary
          prose-code:font-mono prose-code:text-[13px] prose-code:bg-card prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none
          prose-blockquote:border-l-brand-500 prose-blockquote:text-text-secondary
          prose-ul:text-text-primary prose-ol:text-text-primary
          prose-li:text-[15px] md:prose-li:text-[16px]"
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{displayContent}</ReactMarkdown>
        </div>

        {/* ── Navigation Card — rendered inline inside the AI response ── */}
        {navCard && <NavigationCard destination={navCard} />}

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

        {!isStreaming && (message as any).followUps?.length > 0 && (
          <div className="mt-6">
            <FollowUpChips chips={(message as any).followUps} />
          </div>
        )}

        {!isStreaming && (
          <div className="flex items-center gap-1 mt-4 opacity-0 hover:opacity-100 transition-opacity duration-200 -ml-2">
            <button
              onClick={() => speak(stripNavTag(rawContent))}
              className={`p-2 rounded-md transition-colors ${
                ttsState === 'playing'
                  ? 'text-brand-500 bg-brand-50'
                  : 'text-text-tertiary hover:text-brand-500 hover:bg-card'
              }`}
              title={ttsState === 'playing' ? 'Stop speaking' : 'Listen to this'}
            >
              {ttsState === 'loading'
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Volume2 className="w-4 h-4" />
              }
            </button>
            <button className="p-2 text-text-tertiary hover:text-text-primary hover:bg-card rounded-md transition-colors"><ThumbsUp className="w-4 h-4" /></button>
            <button className="p-2 text-text-tertiary hover:text-text-primary hover:bg-card rounded-md transition-colors"><ThumbsDown className="w-4 h-4" /></button>
            <button
              className="p-2 text-text-tertiary hover:text-text-primary hover:bg-card rounded-md transition-colors"
              onClick={() => navigator.clipboard?.writeText(stripNavTag(rawContent))}
            >
              <Copy className="w-4 h-4" />
            </button>
            <button className="p-2 text-text-tertiary hover:text-text-primary hover:bg-card rounded-md transition-colors"><RotateCw className="w-4 h-4" /></button>
          </div>
        )}
      </div>
    </div>
  );
}
