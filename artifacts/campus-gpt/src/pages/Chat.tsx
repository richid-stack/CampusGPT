import { useParams, useSearch } from 'wouter';
import { ChatThread } from '../components/chat/ChatThread';
import { Composer } from '../components/chat/Composer';
import { VoiceCallModal } from '../components/voice/VoiceCallModal';
import { useChat } from '../hooks/useChat';
import { useGetThread, useCreateThread } from '@workspace/api-client-react';
import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../store/appStore';
import { useLocation } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';

export default function Chat() {
  const { threadId } = useParams();
  const search = useSearch();
  const id = threadId && threadId !== 'new' ? parseInt(threadId) : null;
  const { data: thread } = useGetThread(id!, { query: { enabled: !!id } as any });
  const [, setLocation] = useLocation();
  const createThread = useCreateThread();
  const queryClient = useQueryClient();
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [voiceMode, setVoiceMode] = useState<'chat' | 'walk'>('chat');
  const didAutoSend = useRef(false);

  const { setRightPanelTab, setActiveThreadId } = useAppStore();

  const {
    sendMessage, stopStreaming,
    isThinking, currentToolChip,
    isStreaming, streamedContent,
    streamedModel, streamedModelLabel,
  } = useChat(id);

  useEffect(() => { if (id) setActiveThreadId(id); }, [id, setActiveThreadId]);

  // Auto-send initial message passed from Home via ?q= query param
  useEffect(() => {
    if (!id || didAutoSend.current) return;
    const params = new URLSearchParams(search);
    const initial = params.get('q');
    if (!initial) return;
    didAutoSend.current = true;
    // Remove the query param from the URL without navigation
    window.history.replaceState(null, '', `/chat/${id}`);
    sendMessage(initial, id);
  }, [id, search, sendMessage]);

  const handleCreateThread = async (title: string) => {
    const newThread = await createThread.mutateAsync({
      data: { title: title.slice(0, 60), space: 'academic' },
    });
    queryClient.invalidateQueries({ queryKey: ['/api/threads/recent'] });
    return newThread.id;
  };

  const handleSend = async (content: string) => {
    let activeId = id;
    if (!activeId) {
      try {
        activeId = await handleCreateThread(content);
        setLocation(`/chat/${activeId}`);
        await sendMessage(content, activeId);
      } catch { /* ignore */ }
      return;
    }
    await sendMessage(content);
    setRightPanelTab('sources');
  };

  const handleVoiceCreateThread = async () => {
    const newId = await handleCreateThread('Voice chat');
    setLocation(`/chat/${newId}`);
    return newId;
  };

  const openVoice = (mode: 'chat' | 'walk' = 'chat') => {
    setVoiceMode(mode);
    setVoiceOpen(true);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="hidden md:flex h-14 border-b border-border items-center px-6 shrink-0 bg-background/80 backdrop-blur-sm z-10 sticky top-0">
        <h1 className="font-semibold text-text-primary truncate flex-1">{thread?.title || 'New Chat'}</h1>
      </div>

      {thread?.title && (
        <div className="flex md:hidden px-4 pt-3 pb-1">
          <span className="text-sm font-medium text-text-secondary truncate">{thread.title}</span>
        </div>
      )}

      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        <ChatThread
          threadId={id ?? 0}
          isThinking={isThinking}
          currentToolChip={currentToolChip}
          isStreaming={isStreaming}
          streamedContent={streamedContent}
          streamedModel={streamedModel}
          streamedModelLabel={streamedModelLabel}
        />
      </div>

      <div className="shrink-0 bg-gradient-to-t from-background via-background/90 to-transparent pt-4">
        <Composer
          onSend={handleSend}
          isStreaming={isStreaming}
          onStop={stopStreaming}
          onOpenVoiceCall={openVoice}
        />
      </div>

      {voiceOpen && (
        <VoiceCallModal
          threadId={id}
          onClose={() => setVoiceOpen(false)}
          onCreateThread={!id ? handleVoiceCreateThread : undefined}
          initialMode={voiceMode}
        />
      )}
    </div>
  );
}
