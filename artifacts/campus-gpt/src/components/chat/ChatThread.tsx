import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, ArrowDown, RotateCw } from 'lucide-react';
import type { ChatStatus } from 'ai';
import { MessageBubble } from './MessageBubble';
import { AssistantMessage } from './AssistantMessage';
import { friendlyChatError, messageText, type CampusMessage } from '../../lib/chatTypes';

interface ChatThreadProps {
  messages: CampusMessage[];
  status: ChatStatus;
  error?: Error;
  /** Answer the last question again. */
  onRegenerate: () => void;
}

const NEAR_BOTTOM_PX = 120;
const PENDING_REPLY: CampusMessage = { id: 'pending', role: 'assistant', parts: [] };

export function ChatThread({ messages, status, error, onRegenerate }: ChatThreadProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  const [showJump, setShowJump] = useState(false);

  const scrollToBottom = useCallback((smooth = false) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  // Follow the answer as it grows — unless the student scrolled up to read.
  useEffect(() => {
    if (stickToBottom.current) scrollToBottom();
  }, [messages, status, error, scrollToBottom]);

  // Opening a conversation always starts at its end.
  useEffect(() => { scrollToBottom(); }, [scrollToBottom]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX;
    stickToBottom.current = nearBottom;
    setShowJump(!nearBottom);
  };

  const last = messages[messages.length - 1];
  const busy = status === 'submitted' || status === 'streaming';
  const waitingForFirstByte = status === 'submitted' && last?.role === 'user';
  // "Regenerate" belongs to the final answer only. If the last message is the
  // student's own (the reply was stopped before any text), offer a retry instead.
  const unanswered = !busy && !error && !!last && (last.role === 'user' || messageText(last).trim() === '');

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div ref={scrollRef} onScroll={onScroll} className="flex-1 overflow-y-auto py-4 md:py-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-6 px-2 md:gap-8">
          {messages.length === 0 && !busy && (
            <p className="py-20 text-center text-sm text-muted-foreground">Send a message to start the conversation.</p>
          )}

          {messages.map((message, index) =>
            message.role === 'user' ? (
              <MessageBubble key={message.id} message={message} />
            ) : (
              <AssistantMessage
                key={message.id}
                message={message}
                live={busy && index === messages.length - 1}
                onRegenerate={!busy && !unanswered && index === messages.length - 1 ? onRegenerate : undefined}
              />
            ),
          )}

          {waitingForFirstByte && <AssistantMessage message={PENDING_REPLY} live waiting />}

          {unanswered && (
            <div className="mx-2 flex items-center gap-3 px-2 text-sm text-muted-foreground md:mx-4">
              <span className="flex-1">This question has no answer yet.</span>
              <button
                type="button"
                onClick={onRegenerate}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1 font-medium text-foreground transition-colors hover:bg-card"
              >
                <RotateCw className="h-3.5 w-3.5" aria-hidden /> Answer it
              </button>
            </div>
          )}

          {error && status === 'error' && (
            <div role="alert" className="mx-2 flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3 md:mx-4">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              <p className="flex-1 text-sm text-foreground">{friendlyChatError(error)}</p>
              <button
                type="button"
                onClick={onRegenerate}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1 text-sm font-medium text-foreground transition-colors hover:bg-background"
              >
                <RotateCw className="h-3.5 w-3.5" aria-hidden /> Try again
              </button>
            </div>
          )}
        </div>
      </div>

      {showJump && (
        <button
          type="button"
          onClick={() => { stickToBottom.current = true; scrollToBottom(true); }}
          aria-label="Jump to latest"
          className="absolute bottom-3 left-1/2 z-10 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-md transition-transform hover:scale-105"
        >
          <ArrowDown className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
