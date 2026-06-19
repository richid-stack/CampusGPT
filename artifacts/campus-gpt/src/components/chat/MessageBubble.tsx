import { Message } from '@workspace/api-client-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  if (message.role === 'assistant') return null;

  return (
    <div className="flex justify-end w-full py-4 px-4">
      <div className="bg-brand-50 dark:bg-brand-50/10 text-text-primary px-5 py-3 max-w-[75%] shadow-sm" style={{ borderRadius: '18px 18px 6px 18px' }}>
        <div className="text-[15px] leading-relaxed whitespace-pre-wrap">
          {message.content}
        </div>
      </div>
    </div>
  );
}
