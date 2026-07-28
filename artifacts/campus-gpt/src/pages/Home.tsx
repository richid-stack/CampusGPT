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

  const handleSend = async (content: string) => {
    try {
      const thread = await createThread.mutateAsync({
        data: { title: content.slice(0, 60), space: 'academic' },
      });
      queryClient.invalidateQueries({ queryKey: ['/api/threads/recent'] });
      // Pass initial message as query param so Chat auto-sends it to the AI
      setLocation(`/chat/${thread.id}?q=${encodeURIComponent(content)}`);
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

      {/* Outer soft glow — wide, very faded */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 -translate-x-1/2 -top-40 w-[700px] h-[700px] rounded-full"
        style={{
          background: 'radial-gradient(circle, #2E6BFF 0%, #6366f1 40%, transparent 70%)',
          opacity: 0.18,
          filter: 'blur(60px)',
        }}
      />
      {/* Inner bright core */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 -translate-x-1/2 -top-24 w-[340px] h-[340px] rounded-full"
        style={{
          background: 'radial-gradient(circle, #4f8cff 0%, #818cf8 50%, transparent 75%)',
          opacity: 0.28,
          filter: 'blur(30px)',
        }}
      />

      <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-36 md:pb-40">
        <div className="max-w-2xl mx-auto flex flex-col items-center text-center pt-24 md:pt-32 space-y-8">

          {/* Greeting */}
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-semibold text-text-primary tracking-tight leading-tight">
              {greeting}{firstName ? `, ${firstName}` : ''}
            </h1>
            <p className="text-base text-text-secondary">
              Your campus, in conversation.
            </p>
          </div>

          {/* Suggestion chips */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
            {SUGGESTIONS.map(s => (
              <button
                key={s}
                onClick={() => handleSend(s)}
                className="text-left px-4 py-3 rounded-xl border border-border bg-card hover:bg-background hover:border-brand-500/60 transition-all duration-150 text-text-secondary hover:text-text-primary text-sm font-medium shadow-sm active:scale-[0.98]"
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
          onSend={(content) => handleSend(content)}
          placeholder="Ask me anything about UG campus..."
          onOpenVoiceCall={() => setVoiceOpen(true)}
        />
      </div>

      {voiceOpen && (
        <VoiceCallModal
          threadId={null}
          onClose={() => setVoiceOpen(false)}
          onCreateThread={async () => {
            const thread = await createThread.mutateAsync({
              data: { title: 'Voice chat', space: 'academic' },
            });
            queryClient.invalidateQueries({ queryKey: ['/api/threads/recent'] });
            setLocation(`/chat/${thread.id}`);
            return thread.id;
          }}
        />
      )}
    </div>
  );
}
