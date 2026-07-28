import { useState, useRef, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '../store/appStore';
import type { NavDestination } from '../services/navigationService';

export function useChat(threadId: number | null) {
  const [isThinking, setIsThinking]         = useState(false);
  const [streamedContent, setStreamedContent] = useState('');
  const [isStreaming, setIsStreaming]         = useState(false);
  const [streamedModel, setStreamedModel]     = useState<string | null>(null);
  const [streamedModelLabel, setStreamedModelLabel] = useState<string | null>(null);
  const [navigationCard, setNavigationCard]   = useState<NavDestination | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const queryClient = useQueryClient();
  const { setStreamingMessageId } = useAppStore();

  const sendMessage = useCallback(async (
    content: string,
    overrideThreadId?: number,
    mode?: string,
    imageBase64?: string,
    imageMime?: string,
  ) => {
    const tid = overrideThreadId ?? threadId;
    if (!tid) return;

    setIsThinking(true);
    setStreamedContent('');
    setStreamedModel(null);
    setStreamedModelLabel(null);
    setNavigationCard(null);

    try {
      const ac = new AbortController();
      abortRef.current = ac;

      const body: Record<string, string> = { content, mode: mode ?? 'default' };
      if (imageBase64) { body.imageBase64 = imageBase64; body.imageMime = imageMime ?? 'image/jpeg'; }

      const res = await fetch(`/api/threads/${tid}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: ac.signal,
      });

      if (!res.ok || !res.body) throw new Error(`Server error: ${res.status}`);

      setIsThinking(false);
      setIsStreaming(true);
      setStreamingMessageId(tid);

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (!raw) continue;
          try {
            const payload = JSON.parse(raw) as {
              delta?: string; done?: boolean;
              model?: string; modelLabel?: string; error?: string;
              navigationCard?: NavDestination;
            };
            if (payload.error) { setStreamedContent(prev => prev + '\n\n⚠️ Connection error. Please try again.'); break; }
            if (payload.delta) setStreamedContent(prev => prev + payload.delta);
            if (payload.navigationCard) setNavigationCard(payload.navigationCard);
            if (payload.done) {
              if (payload.model)      setStreamedModel(payload.model);
              if (payload.modelLabel) setStreamedModelLabel(payload.modelLabel);
            }
          } catch { /* skip malformed */ }
        }
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        setStreamedContent('⚠️ Failed to get a response. Please check your connection and try again.');
      }
    } finally {
      setIsThinking(false);
      setIsStreaming(false);
      setStreamingMessageId(null);
      abortRef.current = null;
      const finalTid = overrideThreadId ?? threadId;
      if (finalTid) {
        queryClient.invalidateQueries({ predicate: q => String(q.queryKey[0]).includes('messages') });
        queryClient.invalidateQueries({ queryKey: ['/api/threads/recent'] });
      }
    }
  }, [threadId, setStreamingMessageId, queryClient]);

  const stopStreaming = useCallback(() => { abortRef.current?.abort(); }, []);
  useEffect(() => { return () => { abortRef.current?.abort(); }; }, []);

  return {
    sendMessage, stopStreaming,
    isThinking, currentToolChip: null,
    isStreaming, streamedContent,
    streamedModel, streamedModelLabel,
    navigationCard,
  };
}
