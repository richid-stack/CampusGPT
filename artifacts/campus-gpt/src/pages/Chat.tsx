import { useParams } from 'wouter';
import { ChatThread } from '../components/chat/ChatThread';
import { Composer } from '../components/chat/Composer';
import { useChat } from '../hooks/useChat';
import { useGetThread, useCreateThread } from '@workspace/api-client-react';
import { useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { useLocation } from 'wouter';

export default function Chat() {
  const { threadId } = useParams();
  const id = threadId && threadId !== 'new' ? parseInt(threadId) : null;
  const { data: thread } = useGetThread(id!, { query: { enabled: !!id } });
  const [, setLocation] = useLocation();
  const createThread = useCreateThread();

  const { setRightPanelOpen, setRightPanelTab, setActiveThreadId } = useAppStore();

  const {
    sendMessage,
    stopStreaming,
    isThinking,
    currentToolChip,
    isStreaming,
    streamedContent,
    streamedModel,
  } = useChat(id);

  useEffect(() => {
    if (id) setActiveThreadId(id);
  }, [id, setActiveThreadId]);

  const handleSend = async (content: string) => {
    let activeId = id;

    // Create thread on first message if we're in /chat/new
    if (!activeId) {
      const newThread = await createThread.mutateAsync({
        data: {
          title: content.slice(0, 60),
          space: 'academic',
        }
      });
      activeId = newThread.id;
      setLocation(`/chat/${activeId}`);
      return; // The navigation will remount with the new threadId
    }

    await sendMessage(content);
    setRightPanelTab('sources');
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Thread header — hidden on mobile (mobile uses AppShell header) */}
      <div className="hidden md:flex h-14 border-b border-border items-center px-6 shrink-0 bg-background/80 backdrop-blur-sm z-10 sticky top-0">
        <h1 className="font-semibold text-text-primary truncate">{thread?.title || "New Chat"}</h1>
      </div>

      {/* Thread title on mobile in the flow */}
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
        />
      </div>

      <div className="shrink-0 bg-gradient-to-t from-background via-background/90 to-transparent pt-4">
        <Composer onSend={handleSend} isStreaming={isStreaming} onStop={stopStreaming} />
      </div>
    </div>
  );
}
