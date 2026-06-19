import { useState, useRef, useCallback, useEffect } from 'react';
import { useCreateMessage, MessageInputRole, MessageRole } from '@workspace/api-client-react';
import { getSimulatedResponse } from '../lib/chatSimulation';
import { useAppStore } from '../store/appStore';

export function useChat(threadId: number | null) {
  const [isThinking, setIsThinking] = useState(false);
  const [currentToolChip, setCurrentToolChip] = useState<string | null>(null);
  const [streamedContent, setStreamedContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  
  const createMessage = useCreateMessage();
  const { setStreamingMessageId } = useAppStore();
  const streamTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    if (!threadId) return;

    // 1. Save user message
    await createMessage.mutateAsync({
      threadId,
      data: { content, role: MessageInputRole.user }
    });

    // Start simulation
    setIsThinking(true);
    setStreamingMessageId(threadId); // Or some temp ID
    const responseData = getSimulatedResponse(content);

    // 2. Show tool chips
    let delay = 1500; // Initial thinking
    for (const chip of responseData.toolChips) {
      setTimeout(() => setCurrentToolChip(chip), delay);
      delay += 800;
    }

    // 3. Start streaming
    setTimeout(() => {
      setIsThinking(false);
      setCurrentToolChip(null);
      setIsStreaming(true);
      
      let i = 0;
      setStreamedContent("");
      
      const streamChar = () => {
        if (i < responseData.content.length) {
          setStreamedContent(prev => prev + responseData.content.charAt(i));
          i++;
          streamTimeoutRef.current = setTimeout(streamChar, 1000 / 60); // ~60 chars/sec
        } else {
          // Finished streaming
          setIsStreaming(false);
          
          // 4. Save final assistant message
          createMessage.mutate({
            threadId,
            data: {
              content: responseData.content,
              role: MessageInputRole.assistant,
              // Note: citations and followUps would ideally be supported by the API schema,
              // but we are simulating so we'll just append them to the content or handle locally
            }
          });
          setStreamingMessageId(null);
        }
      };
      
      streamChar();
      
    }, delay);

  }, [threadId, createMessage, setStreamingMessageId]);

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (streamTimeoutRef.current) clearTimeout(streamTimeoutRef.current);
    };
  }, []);

  return {
    sendMessage,
    isThinking,
    currentToolChip,
    isStreaming,
    streamedContent
  };
}
