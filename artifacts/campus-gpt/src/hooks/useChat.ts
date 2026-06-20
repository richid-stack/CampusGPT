import { useState, useRef, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '../store/appStore';

export function useChat(threadId: number | null) {
  const [isThinking, setIsThinking] = useState(false);
  const [currentToolChip, setCurrentToolChip] = useState<string | null>(null);
  const [streamedContent, setStreamedContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedModel, setStreamedModel] = useState<string | null>(null);
  const [streamedModelLabel, setStreamedModelLabel] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const queryClient = useQueryClient();
  const { setStreamingMessageId } = useAppStore();

  const sendMessage = useCallback(async (content: string, overrideThreadId?: number, mode?: string) => {
    const tid = overrideThreadId ?? threadId;
    if (!tid) return;

    setIsThinking(true);
    setCurrentToolChip("🔎 Searching campus knowledge base…");
    setStreamedContent("");
    setStreamedModel(null);
    setStreamedModelLabel(null);

    // Track when thinking started so we show it for at least 1.8s
    const thinkingStart = Date.now();

    try {
      const ac = new AbortController();
      abortRef.current = ac;

      const res = await fetch(`/api/threads/${tid}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, mode }),
        signal: ac.signal,
      });

      if (!res.ok || !res.body) throw new Error(`Server error: ${res.status}`);

      setCurrentToolChip("🧠 Thinking with Qwen 3…");

      // Ensure the thinking chip is visible for at least 1.8 seconds total
      const elapsed = Date.now() - thinkingStart;
      if (elapsed < 1800) {
        await new Promise(r => setTimeout(r, 1800 - elapsed));
      }

      setIsThinking(false);
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
              modelLabel?: string;
              mode?: string;
              error?: string;
            };

            if (payload.error) {
              setStreamedContent(prev => prev + "\n\n⚠️ Stream error. Please try again.");
              break;
            }
            if (payload.delta) setStreamedContent(prev => prev + payload.delta);
            if (payload.done) {
              if (payload.model) setStreamedModel(payload.model);
              if (payload.modelLabel) setStreamedModelLabel(payload.modelLabel);
              // Update chip label mid-stream with actual model used
              if (payload.modelLabel) setCurrentToolChip(null);
            }
          } catch { /* skip malformed */ }
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
        queryClient.invalidateQueries({ predicate: q => String(q.queryKey[0]).includes('messages') });
        queryClient.invalidateQueries({ queryKey: ['/api/threads/recent'] });
      }
    }
  }, [threadId, setStreamingMessageId, queryClient]);

  const stopStreaming = useCallback(() => { abortRef.current?.abort(); }, []);

  useEffect(() => { return () => { abortRef.current?.abort(); }; }, []);

  return { sendMessage, stopStreaming, isThinking, currentToolChip, isStreaming, streamedContent, streamedModel, streamedModelLabel };
}
