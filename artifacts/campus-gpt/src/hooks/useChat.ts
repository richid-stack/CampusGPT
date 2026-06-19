import { useState, useRef, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '../store/appStore';

export function useChat(threadId: number | null) {
  const [isThinking, setIsThinking] = useState(false);
  const [currentToolChip, setCurrentToolChip] = useState<string | null>(null);
  const [streamedContent, setStreamedContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedModel, setStreamedModel] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const queryClient = useQueryClient();
  const { setStreamingMessageId } = useAppStore();

  const sendMessage = useCallback(async (content: string, overrideThreadId?: number) => {
    const tid = overrideThreadId ?? threadId;
    if (!tid) return;

    setIsThinking(true);
    setCurrentToolChip("🔎 Searching knowledge base...");
    setStreamedContent("");
    setStreamedModel(null);

    try {
      const ac = new AbortController();
      abortRef.current = ac;

      const res = await fetch(`/api/threads/${tid}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
        signal: ac.signal,
      });

      if (!res.ok || !res.body) {
        throw new Error(`Server error: ${res.status}`);
      }

      setIsThinking(false);
      setCurrentToolChip("📝 Composing response...");
      await new Promise(r => setTimeout(r, 300));
      setCurrentToolChip(null);
      setIsStreaming(true);
      setStreamingMessageId(tid);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (!raw) continue;

          try {
            const payload = JSON.parse(raw) as {
              delta?: string;
              done?: boolean;
              model?: string;
              error?: string;
            };

            if (payload.error) {
              setStreamedContent(prev => prev + "\n\n⚠️ Stream error. Please try again.");
              break;
            }
            if (payload.delta) {
              setStreamedContent(prev => prev + payload.delta);
            }
            if (payload.done && payload.model) {
              setStreamedModel(payload.model);
            }
          } catch {
            // skip malformed line
          }
        }
      }
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        setStreamedContent("⚠️ Failed to get a response. Please check your connection and try again.");
      }
    } finally {
      setIsThinking(false);
      setCurrentToolChip(null);
      setIsStreaming(false);
      setStreamingMessageId(null);
      abortRef.current = null;

      const finalTid = overrideThreadId ?? threadId;
      if (finalTid) {
        queryClient.invalidateQueries({ queryKey: [`/api/threads/${finalTid}/messages`] });
        queryClient.invalidateQueries({ queryKey: ['/api/threads/recent'] });
        queryClient.invalidateQueries({ predicate: q => String(q.queryKey[0]).includes('messages') });
      }
    }
  }, [threadId, setStreamingMessageId, queryClient]);

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);

  return { sendMessage, stopStreaming, isThinking, currentToolChip, isStreaming, streamedContent, streamedModel };
}
