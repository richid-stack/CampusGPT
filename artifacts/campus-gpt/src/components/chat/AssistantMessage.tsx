import { Message } from '@workspace/api-client-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChevronDown, ThumbsUp, ThumbsDown, Copy, RotateCw, Share } from 'lucide-react';
import { CitationPill } from './CitationPill';
import { FollowUpChips } from './FollowUpChips';
import { SourceCard } from './SourceCard';

interface AssistantMessageProps {
  message: Message | {
    content: string;
    citations?: any[];
    followUps?: string[];
    thinkingSeconds?: number | null;
  };
  isStreaming?: boolean;
}

export function AssistantMessage({ message, isStreaming }: AssistantMessageProps) {
  const content = isStreaming ? `${message.content}▍` : message.content;
  
  return (
    <div className="flex flex-col w-full py-6 px-4 animate-in">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-brand-500 to-indigo-500 shrink-0" />
        <div className="text-xs font-medium text-text-tertiary flex items-center gap-1 cursor-pointer hover:text-text-secondary transition-colors">
          CampusGPT · GPT-Campus-Pro {message.thinkingSeconds ? `· Thought for ${message.thinkingSeconds}s` : ''} <ChevronDown className="w-3 h-3" />
        </div>
      </div>
      
      <div className="pl-7 w-full max-w-[760px]">
        <div className="prose prose-sm md:prose-base prose-slate dark:prose-invert max-w-none 
          prose-p:leading-[28px] prose-p:tracking-[-0.005em] prose-p:text-[16px] prose-p:text-text-primary
          prose-a:text-brand-500 prose-a:no-underline hover:prose-a:underline
          prose-strong:font-semibold prose-strong:text-text-primary
          prose-code:font-mono prose-code:text-[14px] prose-code:bg-card prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none"
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content}
          </ReactMarkdown>
        </div>

        {/* Inline citations conceptually parsed from markdown, simplified here for simulation */}
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
