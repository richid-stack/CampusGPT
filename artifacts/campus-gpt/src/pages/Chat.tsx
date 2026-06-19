import { useParams } from 'wouter';
import { ChatThread } from '../components/chat/ChatThread';
import { Composer } from '../components/chat/Composer';
import { useChat } from '../hooks/useChat';
import { useGetThread } from '@workspace/api-client-react';
import { useEffect } from 'react';
import { useAppStore } from '../store/appStore';

export default function Chat() {
  const { threadId } = useParams();
  const id = threadId ? parseInt(threadId) : null;
  const { data: thread } = useGetThread(id!, { query: { enabled: !!id } });
  
  const { setRightPanelOpen, setRightPanelTab, setActiveThreadId } = useAppStore();
  
  const { 
    sendMessage, 
    isThinking, 
    currentToolChip, 
    isStreaming, 
    streamedContent 
  } = useChat(id);

  useEffect(() => {
    if (id) setActiveThreadId(id);
  }, [id, setActiveThreadId]);

  const handleSend = async (content: string) => {
    await sendMessage(content);
    setRightPanelTab('sources');
    setRightPanelOpen(true);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background">
      <div className="h-14 border-b border-border flex items-center px-6 shrink-0 bg-background/80 backdrop-blur-sm z-10 sticky top-0">
        <h1 className="font-semibold text-text-primary truncate">{thread?.title || "New Chat"}</h1>
      </div>
      
      <ChatThread 
        threadId={id!} 
        isThinking={isThinking} 
        currentToolChip={currentToolChip}
        isStreaming={isStreaming}
        streamedContent={streamedContent}
      />

      <div className="shrink-0 bg-gradient-to-t from-background via-background/90 to-transparent pt-4">
        <Composer onSend={handleSend} isStreaming={isStreaming} />
      </div>
    </div>
  );
}
