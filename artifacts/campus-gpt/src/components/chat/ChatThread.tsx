import { useEffect, useRef } from 'react';
import { MessageBubble } from './MessageBubble';
import { AssistantMessage } from './AssistantMessage';
import { ThinkingIndicator } from './ThinkingIndicator';
import { ToolChip } from './ToolChip';
import { useListMessages } from '@workspace/api-client-react';
import type { NavDestination } from '../../services/navigationService';

interface ChatThreadProps {
  threadId: number;
  isThinking: boolean;
  currentToolChip: string | null;
  isStreaming: boolean;
  streamedContent: string;
  streamedModel?: string | null;
  streamedModelLabel?: string | null;
  navigationCard?: NavDestination | null;
  onRegenerate?: (content: string) => void;
}

export function ChatThread({
  threadId, isThinking, currentToolChip, isStreaming,
  streamedContent, streamedModel, streamedModelLabel, navigationCard, onRegenerate,
}: ChatThreadProps) {
  const { data: messages, isLoading } = useListMessages(threadId);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isThinking, currentToolChip, isStreaming, streamedContent]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-text-tertiary text-sm">Loading messages…</div>
      </div>
    );
  }

  const savedMessages = messages ?? [];

  return (
    <div className="flex-1 overflow-y-auto px-2 md:px-4 py-4 md:py-6" ref={scrollRef}>
      <div className="max-w-3xl mx-auto flex flex-col gap-4 md:gap-6">

        {savedMessages.length === 0 && !isThinking && !isStreaming && (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-brand-500 to-indigo-500 opacity-20" />
            <p className="text-text-tertiary text-sm">Send a message to start the conversation</p>
          </div>
        )}

        {savedMessages.map((msg, index) => {
          if (msg.role === 'user') return <MessageBubble key={msg.id} message={msg} />;
          const previous = savedMessages[index - 1];
          return (
            <AssistantMessage
              key={msg.id}
              message={msg}
              onRegenerate={previous?.role === 'user' ? () => onRegenerate?.(previous.content) : undefined}
            />
          );
        })}

        {isThinking && <ThinkingIndicator />}
        {currentToolChip && !isStreaming && <ToolChip text={currentToolChip} />}

        {isStreaming && (
          <AssistantMessage
            message={{ content: streamedContent, role: 'assistant' } as any}
            isStreaming={true}
            model={streamedModel}
            modelLabel={streamedModelLabel}
            navigationCard={navigationCard}
          />
        )}
      </div>
    </div>
  );
}
