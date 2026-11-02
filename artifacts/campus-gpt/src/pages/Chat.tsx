import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { MoreHorizontal, Pin, PinOff, SquarePen, Trash2 } from 'lucide-react';
import {
  getGetPinnedThreadsQueryKey, getGetRecentThreadsQueryKey, getGetThreadQueryKey,
  useDeleteThread, useGetThread, useListMessages, useUpdateThread,
} from '@workspace/api-client-react';
import type { FileUIPart } from 'ai';
import { ChatThread } from '../components/chat/ChatThread';
import { Composer } from '../components/chat/Composer';
import { VoiceCallModal } from '../components/voice/VoiceCallModal';
import { PageHeader } from '../components/layout/PageHeader';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useCampusChat } from '../hooks/useCampusChat';
import { useAppStore } from '../store/appStore';
import { usePendingMessage } from '../store/pendingMessage';
import { rowToUIMessage, type CampusMessage } from '../lib/chatTypes';
import { fetchListMessages } from '../lib/refreshMessages';

export default function Chat() {
  const { threadId } = useParams();
  const id = threadId && /^\d+$/.test(threadId) ? parseInt(threadId, 10) : null;

  // Always read the saved conversation fresh when opening it — the live copy
  // below takes over once it is on screen.
  const { data: rows, isLoading, isError } = useListMessages(id ?? 0, {
    query: { enabled: id !== null, gcTime: 0, staleTime: 0, refetchOnMount: 'always' } as any,
  });
  const { data: thread } = useGetThread(id ?? 0, { query: { enabled: id !== null } as any });

  const initialMessages = useMemo(() => (rows ?? []).map(rowToUIMessage), [rows]);

  if (id === null || isError) {
    return (
      <div className="flex h-full flex-col">
        <PageHeader />
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
          <p className="text-foreground">That conversation could not be found.</p>
          <Link href="/" className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground">
            Start a new chat
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading || !rows) {
    return (
      <div className="flex h-full flex-col">
        <PageHeader />
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground" role="status">Loading…</div>
      </div>
    );
  }

  return <ChatSession key={id} threadId={id} title={thread?.title} pinned={Boolean(thread?.pinned)} initialMessages={initialMessages} />;
}

interface ChatSessionProps {
  threadId: number;
  title?: string;
  pinned: boolean;
  initialMessages: CampusMessage[];
}

function ChatSession({ threadId, title, pinned, initialMessages }: ChatSessionProps) {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const setActiveThreadId = useAppStore((s) => s.setActiveThreadId);
  const takePending = usePendingMessage((s) => s.take);
  const updateThread = useUpdateThread();
  const deleteThread = useDeleteThread();

  const [voiceOpen, setVoiceOpen] = useState(false);
  const [voiceMode, setVoiceMode] = useState<'chat' | 'walk'>('chat');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { messages, sendMessage, regenerate, stop, status, error, setMessages } = useCampusChat(threadId, initialMessages);
  const busy = status === 'submitted' || status === 'streaming';

  useEffect(() => {
    setActiveThreadId(threadId);
    return () => setActiveThreadId(null);
  }, [threadId, setActiveThreadId]);

  // A first message written on the home screen is sent as soon as this opens.
  const handedOver = useRef(false);
  useEffect(() => {
    if (handedOver.current) return;
    const pending = takePending(threadId);
    if (!pending) return;
    handedOver.current = true;
    void sendMessage({ text: pending.text, files: pending.files });
  }, [threadId, takePending, sendMessage]);

  const handleSend = (text: string, files: FileUIPart[]) => {
    void sendMessage({ text, files });
  };

  // After a voice session the server has new messages this screen has not seen.
  const closeVoice = async () => {
    setVoiceOpen(false);
    if (busy) return;
    try {
      const fresh = await fetchListMessages(queryClient, threadId);
      setMessages(fresh.map(rowToUIMessage));
    } catch { /* keep what is on screen */ }
  };

  const togglePin = async () => {
    await updateThread.mutateAsync({ threadId, data: { pinned: !pinned } });
    void queryClient.invalidateQueries({ queryKey: getGetThreadQueryKey(threadId) });
    void queryClient.invalidateQueries({ queryKey: getGetPinnedThreadsQueryKey() });
    void queryClient.invalidateQueries({ queryKey: getGetRecentThreadsQueryKey() });
  };

  const removeThread = async () => {
    await deleteThread.mutateAsync({ threadId });
    void queryClient.invalidateQueries({ queryKey: getGetPinnedThreadsQueryKey() });
    void queryClient.invalidateQueries({ queryKey: getGetRecentThreadsQueryKey() });
    setLocation('/');
  };

  return (
    <div className="flex h-full flex-col bg-background">
      <PageHeader
        title={title || 'New chat'}
        actions={
          <>
            <Link
              href="/chat/new"
              aria-label="New chat"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-card"
            >
              <SquarePen className="h-[18px] w-[18px]" />
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Conversation options"
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-card data-[state=open]:bg-card"
                >
                  <MoreHorizontal className="h-5 w-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onSelect={() => void togglePin()} className="gap-2.5">
                  {pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                  {pinned ? 'Unpin chat' : 'Pin chat'}
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setConfirmDelete(true)} className="gap-2.5 text-destructive focus:text-destructive">
                  <Trash2 className="h-4 w-4" /> Delete chat
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        }
      />

      <ChatThread messages={messages} status={status} error={error} onRegenerate={() => void regenerate()} />

      <div className="shrink-0 bg-gradient-to-t from-background via-background/90 to-transparent pt-2">
        <Composer
          onSend={handleSend}
          isStreaming={busy}
          onStop={() => void stop()}
          onOpenVoiceCall={(mode = 'chat') => { setVoiceMode(mode); setVoiceOpen(true); }}
        />
      </div>

      {voiceOpen && <VoiceCallModal threadId={threadId} onClose={() => void closeVoice()} initialMode={voiceMode} />}

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this chat?</AlertDialogTitle>
            <AlertDialogDescription>The whole conversation will be removed. This can't be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void removeThread()}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
