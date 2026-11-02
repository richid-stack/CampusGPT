import { useMemo, useRef } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useQueryClient } from '@tanstack/react-query';
import { getGetRecentThreadsQueryKey, getListMessagesQueryKey } from '@workspace/api-client-react';
import { useAppStore } from '../store/appStore';
import type { CampusMessage } from '../lib/chatTypes';

/**
 * One conversation, streamed by the Vercel AI SDK. The server keeps the
 * authoritative history, so each request only carries the newest message.
 */
export function useCampusChat(threadId: number, initialMessages: CampusMessage[]) {
  const queryClient = useQueryClient();
  const chatMode = useAppStore((s) => s.chatMode);

  // The transport is built once per conversation; read the live mode from a ref.
  const modeRef = useRef(chatMode);
  modeRef.current = chatMode;

  const transport = useMemo(
    () =>
      new DefaultChatTransport<CampusMessage>({
        api: `/api/threads/${threadId}/chat`,
        credentials: 'same-origin',
        prepareSendMessagesRequest: ({ messages, trigger }) => {
          const lastUser = [...messages].reverse().find((m) => m.role === 'user');
          const parts: Array<
            | { type: 'text'; text: string }
            | { type: 'file'; mediaType: string; url: string; filename?: string }
          > = [];
          for (const p of lastUser?.parts ?? []) {
            if (p.type === 'text') parts.push({ type: 'text', text: p.text });
            else if (p.type === 'file') parts.push({ type: 'file', mediaType: p.mediaType, url: p.url, filename: p.filename });
          }
          return {
            body: {
              trigger,
              mode: modeRef.current === 'auto' ? undefined : modeRef.current,
              message: parts.length > 0 ? { parts } : undefined,
            },
          };
        },
      }),
    [threadId],
  );

  const chat = useChat<CampusMessage>({
    id: String(threadId),
    messages: initialMessages,
    transport,
    onFinish: () => {
      // The sidebar's order/title and any cached copy of this thread are now out of date.
      void queryClient.invalidateQueries({ queryKey: getGetRecentThreadsQueryKey() });
      void queryClient.invalidateQueries({ queryKey: getListMessagesQueryKey(threadId) });
    },
  });

  return chat;
}
