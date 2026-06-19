import { useEffect, useRef } from 'react';
import { MessageBubble } from './MessageBubble';
import { AssistantMessage } from './AssistantMessage';
import { ThinkingIndicator } from './ThinkingIndicator';
import { ToolChip } from './ToolChip';
import { useListMessages } from '@workspace/api-client-react';

interface ChatThreadProps {
  threadId: number;
  isThinking: boolean;
  currentToolChip: string | null;
  isStreaming: boolean;
  streamedContent: string;
}

export function ChatThread({ threadId, isThinking, currentToolChip, isStreaming, streamedContent }: ChatThreadProps) {
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
        <div className="text-text-tertiary">Loading messages...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6" ref={scrollRef}>
      <div className="max-w-3xl mx-auto flex flex-col gap-6">
        {messages?.map((msg) => (
          msg.role === 'user' 
            ? <MessageBubble key={msg.id} message={msg} />
            : <AssistantMessage key={msg.id} message={msg} />
        ))}
        
        {isThinking && <ThinkingIndicator />}
        {currentToolChip && <ToolChip text={currentToolChip} />}
        {isStreaming && (
          <AssistantMessage 
            message={{ content: streamedContent, role: 'assistant' } as any} 
            isStreaming={true} 
          />
        )}
      </div>
    </div>
  );
}
