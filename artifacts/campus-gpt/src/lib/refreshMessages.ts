import type { QueryClient } from '@tanstack/react-query';
import { getListMessagesQueryKey, listMessages } from '@workspace/api-client-react';

/** The saved messages of a conversation, straight from the server. */
export function fetchListMessages(queryClient: QueryClient, threadId: number) {
  return queryClient.fetchQuery({
    queryKey: getListMessagesQueryKey(threadId),
    queryFn: () => listMessages(threadId),
    staleTime: 0,
  });
}
