import { Message } from '@workspace/api-client-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChevronDown, ThumbsUp, ThumbsDown, Copy, RotateCw, Share } from 'lucide-react';
import { SourceCard } from './SourceCard';
import { FollowUpChips } from './FollowUpChips';

interface AssistantMessageProps {
  message: Message | {
    content: string;
    citations?: any[];
    followUps?: string[];
    thinkingSeconds?: number | null;
  };
  isStreaming?: boolean;
  model?: string | null;
}

function modelLabel(model: string | null | undefined): string {
  if (!model) return 'CampusGPT';
  if (model.includes('llama-3.3')) return 'Llama 3.3 70B';
  if (model.includes('llama-3.1')) return 'Llama 3.1 70B';
  if (model.includes('llama')) return 'Llama';
  return model;
}

export function AssistantMessage({ message, isStreaming, model }: AssistantMessageProps) {
  const content = isStreaming ? `${message.content}▍` : message.content;
  const label = modelLabel(model);

  return (
    <div className="flex flex-col w-full py-4 md:py-6 px-2 md:px-4 animate-in">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-brand-500 to-indigo-500 shrink-0" />
        <div className="text-xs font-medium text-text-tertiary flex items-center gap-1">
          CampusGPT
          {!isStreaming && (
            <span className="text-text-tertiary/60">· {label}</span>
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
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content}
          </ReactMarkdown>
        </div>

        {message.citations && message.citations.length > 0 && !isStreaming && (
          <div className="mt-6">
            <h4 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">Sources</h4>
            <div className="flex flex-wrap gap-2">
              {message.citations.map((c, i) => (
                <SourceCard key={i} citation={c} />
              ))}
            </div>
          </div>
        )}

        {!isStreaming && message.followUps && message.followUps.length > 0 && (
          <div className="mt-6">
            <FollowUpChips chips={message.followUps} />
          </div>
        )}

        {!isStreaming && (
          <div className="flex items-center gap-1 mt-4 opacity-0 hover:opacity-100 transition-opacity duration-200 -ml-2">
            <button className="p-2 text-text-tertiary hover:text-text-primary hover:bg-card rounded-md transition-colors"><ThumbsUp className="w-4 h-4" /></button>
            <button className="p-2 text-text-tertiary hover:text-text-primary hover:bg-card rounded-md transition-colors"><ThumbsDown className="w-4 h-4" /></button>
            <button className="p-2 text-text-tertiary hover:text-text-primary hover:bg-card rounded-md transition-colors"><Copy className="w-4 h-4" /></button>
            <button className="p-2 text-text-tertiary hover:text-text-primary hover:bg-card rounded-md transition-colors"><RotateCw className="w-4 h-4" /></button>
            <button className="p-2 text-text-tertiary hover:text-text-primary hover:bg-card rounded-md transition-colors"><Share className="w-4 h-4" /></button>
          </div>
        )}
      </div>
    </div>
  );
}
