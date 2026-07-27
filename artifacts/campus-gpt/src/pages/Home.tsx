import { useState } from 'react';
import { useGetUserProfile, useCreateThread } from '@workspace/api-client-react';
import { Composer } from '../components/chat/Composer';
import { VoiceCallModal } from '../components/voice/VoiceCallModal';
import { useLocation } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';

const SUGGESTIONS = [
  "How do I register my courses on MIS Web?",
  "How do I check my fees and pay online?",
  "What are the rules for Add/Drop?",
  "Tell me about SLTF student loans",
];

export default function Home() {
  const { data: profile } = useGetUserProfile();
  const [, setLocation] = useLocation();
  const createThread = useCreateThread();
  const queryClient = useQueryClient();
  const [voiceOpen, setVoiceOpen] = useState(false);

  const createAndGoToChat = async (content: string): Promise<number> => {
    const thread = await createThread.mutateAsync({
      data: { title: content.slice(0, 60), space: 'academic' },
    });
    queryClient.invalidateQueries({ queryKey: ['/api/threads/recent'] });
    return thread.id;
  };

  const handleSend = async (content: string) => {
    try {
      const id = await createAndGoToChat(content);
      setLocation(`/chat/${id}`);
    } catch (err) {
      console.error('Failed to create thread:', err);
    }
  };

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = profile?.name?.split(' ')[0] ?? null;

  return (
    <div className="flex flex-col h-full bg-background relative overflow-hidden">
      {/* Large faded blue orb — decorative background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 -translate-x-1/2 -top-28 md:-top-20 w-[520px] h-[520px] md:w-[680px] md:h-[680px] rounded-full opacity-[0.13] blur-[80px]"
        style={{ background: 'radial-gradient(circle, #2E6BFF 0%, #6366f1 55%, transparent 75%)' }}
      />

      <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-36 md:pb-40">
        <div className="max-w-2xl mx-auto flex flex-col items-center text-center pt-20 md:pt-28 space-y-8">

          {/* Greeting */}
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-semibold text-text-primary tracking-tight leading-tight">
              {greeting}{firstName ? `, ${firstName}` : ''}
            </h1>
            <p className="text-base md:text-lg text-text-secondary">
              Your campus, in conversation.
            </p>
          </div>

          {/* Suggestion chips */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
            {SUGGESTIONS.map(s => (
              <button
                key={s}
                onClick={() => handleSend(s)}
                className="text-left px-4 py-3 rounded-xl border border-border bg-card hover:bg-background hover:border-brand-500/60 transition-colors text-text-secondary hover:text-text-primary text-sm font-medium shadow-sm active:scale-[0.98]"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Floating composer */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background/95 to-transparent pt-10 pb-14 md:pb-0">
        <Composer
          onSend={handleSend}
          placeholder="Ask me anything about UG campus..."
          onOpenVoiceCall={() => setVoiceOpen(true)}
        />
      </div>

      {voiceOpen && (
        <VoiceCallModal
          threadId={null}
          onClose={() => setVoiceOpen(false)}
          onCreateThread={async () => {
            const id = await createAndGoToChat('Voice chat');
            setLocation(`/chat/${id}`);
            return id;
          }}
        />
      )}
    </div>
  );
}
