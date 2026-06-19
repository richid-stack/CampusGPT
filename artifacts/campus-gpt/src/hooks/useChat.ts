import { useState, useRef, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCreateMessage, MessageInputRole } from '@workspace/api-client-react';
import { useAppStore } from '../store/appStore';

export function useChat(threadId: number | null) {
  const [isThinking, setIsThinking] = useState(false);
  const [currentToolChip, setCurrentToolChip] = useState<string | null>(null);
  const [streamedContent, setStreamedContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedModel, setStreamedModel] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const queryClient = useQueryClient();
  const createMessage = useCreateMessage();
  const { setStreamingMessageId } = useAppStore();

  const sendMessage = useCallback(async (content: string) => {
    if (!threadId) return;

    setIsThinking(true);
    setCurrentToolChip("🔎 Searching knowledge base...");
    setStreamedContent("");
    setStreamedModel(null);

    try {
      const ac = new AbortController();
      abortRef.current = ac;

      const res = await fetch(`/api/threads/${threadId}/chat`, {
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

      // Small delay before streaming so the tool chip is visible
      await new Promise(r => setTimeout(r, 400));
      setCurrentToolChip(null);
      setIsStreaming(true);
      setStreamingMessageId(threadId);

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

            if (payload.done) {
              if (payload.model) setStreamedModel(payload.model);
            }
          } catch {
            // skip malformed line
          }
        }
      }
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        setIsThinking(false);
        setCurrentToolChip(null);
        setIsStreaming(false);
        setStreamedContent("⚠️ Failed to get a response. Please check your connection and try again.");
      }
    } finally {
      setIsThinking(false);
      setCurrentToolChip(null);
      setIsStreaming(false);
      setStreamingMessageId(null);
      abortRef.current = null;

      // Refresh the message list so the saved assistant message appears
      queryClient.invalidateQueries({
        queryKey: ['/threads/', threadId, '/messages']
      });
      // Also do a broad invalidation as fallback
      queryClient.invalidateQueries({ predicate: q => (q.queryKey[0] as string)?.includes?.('messages') });
    }
  }, [threadId, setStreamingMessageId, queryClient]);

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  return {
    sendMessage,
    stopStreaming,
    isThinking,
    currentToolChip,
    isStreaming,
    streamedContent,
    streamedModel,
  };
}
