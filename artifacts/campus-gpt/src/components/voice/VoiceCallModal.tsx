import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, PhoneOff, MapPin, MessageSquare } from 'lucide-react';
import { useVoiceChat, VoiceState } from '../../hooks/useVoiceChat';

interface VoiceCallModalProps {
  threadId: number | null;
  onClose: () => void;
  onCreateThread?: () => Promise<number>;
  initialMode?: 'chat' | 'walk';
}

/* ── Waveform (pulsing bars) ──────────────────────────────────────────── */
function Waveform({ state }: { state: VoiceState }) {
  const isActive = state === 'listening' || state === 'speaking';
  const heights = [0.4, 0.7, 1, 0.8, 0.5, 0.9, 0.6, 1, 0.7, 0.4];
  return (
    <div className="flex items-center gap-[3px] h-8">
      {heights.map((h, i) => (
        <div
          key={i}
          className="rounded-full transition-all duration-200"
          style={{
            width: 3,
            background: state === 'listening' ? '#10b981' : state === 'speaking' ? '#6366f1' : '#d1d5db',
            height: isActive ? `${h * 28}px` : '6px',
            animation: isActive ? `waveBar 0.8s ease-in-out ${i * 80}ms infinite alternate` : 'none',
          }}
        />
      ))}
      <style>{`@keyframes waveBar { from { transform: scaleY(0.5); } to { transform: scaleY(1); } }`}</style>
    </div>
  );
}

/* ── State label ──────────────────────────────────────────────────────── */
function StateLabel({ state }: { state: VoiceState }) {
  const map: Record<VoiceState, string> = {
    idle:       'Tap mic to speak',
    listening:  'Listening…',
    processing: 'Thinking…',
    speaking:   'Speaking…',
    error:      'Error — try again',
  };
  const color: Record<VoiceState, string> = {
    idle:       'text-text-tertiary',
    listening:  'text-emerald-500',
    processing: 'text-brand-500',
    speaking:   'text-violet-500',
    error:      'text-danger',
  };
  return (
    <span className={`text-[13px] font-medium tracking-wide ${color[state]}`}>{map[state]}</span>
  );
}

/* ── Transcript bubble ────────────────────────────────────────────────── */
function Bubble({ role, text, live }: { role: 'user' | 'ai'; text: string; live?: boolean }) {
  if (!text) return null;
  return (
    <div className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'} mb-2`}>
      {role === 'ai' && (
        <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-brand-500 to-indigo-500 shrink-0 mr-2 mt-1" />
      )}
      <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-[14px] leading-snug ${
        role === 'user'
          ? 'bg-brand-500 text-white rounded-tr-sm'
          : 'bg-card border border-border text-text-primary rounded-tl-sm'
      } ${live ? 'opacity-70 italic' : ''}`}>
        {text}
        {live && <span className="inline-block w-1 h-3.5 ml-0.5 bg-current rounded-sm animate-pulse" />}
      </div>
    </div>
  );
}

/* ── Main modal ──────────────────────────────────────────────────────── */
export function VoiceCallModal({ threadId, onClose, onCreateThread, initialMode = 'chat' }: VoiceCallModalProps) {
  const [walkMode, setWalkMode] = useState(initialMode === 'walk');
  const [transcript, setLocalTranscript] = useState('');
  const [conversationLog, setConversationLog] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const {
    voiceState, transcript: liveTranscript, aiResponse, error, supported,
    startListening, stopListening, stopEverything,
  } = useVoiceChat({ threadId, onCreateThread, walkMode });

  // Accumulate conversation history
  useEffect(() => {
    if (liveTranscript) setLocalTranscript(liveTranscript);
  }, [liveTranscript]);

  useEffect(() => {
    // When AI starts a new response, save the user's last transcript
    if (voiceState === 'processing' && transcript) {
      setConversationLog(prev => [...prev, { role: 'user', text: transcript }]);
      setLocalTranscript('');
    }
  }, [voiceState, transcript]);

  useEffect(() => {
    // When AI response is complete (speaking stopped or went idle from speaking)
    if (voiceState === 'idle' && aiResponse && conversationLog.length > 0) {
      setConversationLog(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'ai' && last.text === aiResponse) return prev;
        return [...prev, { role: 'ai', text: aiResponse }];
      });
    }
  }, [voiceState, aiResponse]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversationLog, aiResponse, voiceState]);

  const handleEndCall = () => { stopEverything(); onClose(); };
  const handleMic = () => {
    if (voiceState === 'listening') stopListening();
    else if (voiceState === 'idle' || voiceState === 'error') startListening();
  };

  const isBusy = voiceState === 'processing' || voiceState === 'speaking';
  const isListening = voiceState === 'listening';

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Blurred backdrop — chat visible behind */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-[6px]"
        onClick={handleEndCall}
      />

      {/* Panel */}
      <div
        className="relative bg-background rounded-t-[24px] shadow-2xl flex flex-col overflow-hidden"
        style={{ height: '68vh', boxShadow: '0 -8px 48px rgba(0,0,0,0.14)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 shrink-0">
          <div className="w-8 h-1 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-3 pb-2 shrink-0">
          <div className="flex flex-col">
            <span className="font-semibold text-[15px] text-text-primary">CampusGPT Voice</span>
            <span className="text-[12px] text-text-tertiary">University of Ghana · Legon</span>
          </div>
          {/* Mode toggle */}
          <div className="flex items-center gap-1.5 p-1 bg-card rounded-xl border border-border">
            <button
              onClick={() => setWalkMode(false)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[12px] font-medium transition-colors ${
                !walkMode ? 'bg-brand-500 text-white shadow-sm' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <MessageSquare className="w-3 h-3" /> Chat
            </button>
            <button
              onClick={() => setWalkMode(true)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[12px] font-medium transition-colors ${
                walkMode ? 'bg-emerald-500 text-white shadow-sm' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <MapPin className="w-3 h-3" /> Walk
            </button>
          </div>
        </div>

        {/* Walk hint */}
        {walkMode && conversationLog.length === 0 && voiceState === 'idle' && (
          <div className="mx-4 mb-2 rounded-xl bg-emerald-50 border border-emerald-100 px-3.5 py-2.5 shrink-0">
            <p className="text-emerald-700 text-[13px] font-medium">Campus Navigator active</p>
            <p className="text-emerald-600 text-[12px] mt-0.5">Say where you want to go — e.g. "Take me to Balme Library"</p>
          </div>
        )}

        {/* Not supported */}
        {!supported && (
          <div className="mx-4 mb-2 rounded-xl bg-amber-50 border border-amber-100 px-3.5 py-2.5 shrink-0">
            <p className="text-amber-700 text-[13px] font-medium">Voice requires Chrome</p>
            <p className="text-amber-600 text-[12px] mt-0.5">Please open CampusGPT in Google Chrome to use voice.</p>
          </div>
        )}

        {error && (
          <div className="mx-4 mb-2 rounded-xl bg-red-50 border border-red-100 px-3.5 py-2.5 shrink-0">
            <p className="text-red-600 text-[13px]">{error}</p>
          </div>
        )}

        {/* Transcript area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-2 min-h-0">
          {conversationLog.length === 0 && voiceState === 'idle' && !walkMode && (
            <div className="h-full flex items-center justify-center">
              <p className="text-text-tertiary text-[13px]">Your conversation will appear here</p>
            </div>
          )}
          {conversationLog.map((entry, i) => (
            <Bubble key={i} role={entry.role} text={entry.text} />
          ))}
          {/* Live transcript (user speaking) */}
          {isListening && liveTranscript && (
            <Bubble role="user" text={liveTranscript} live />
          )}
          {/* Live AI response (speaking) */}
          {(voiceState === 'processing' || voiceState === 'speaking') && aiResponse && (
            <Bubble role="ai" text={aiResponse} live />
          )}
        </div>

        {/* Bottom bar */}
        <div className="shrink-0 border-t border-border px-5 py-4 flex items-center justify-between">
          {/* Waveform + state */}
          <div className="flex flex-col gap-1">
            <Waveform state={voiceState} />
            <StateLabel state={voiceState} />
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleMic}
              disabled={isBusy || !supported}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-95 disabled:opacity-40 shadow-md ${
                isListening
                  ? 'bg-red-500 text-white'
                  : walkMode
                    ? 'bg-emerald-500 text-white'
                    : 'bg-brand-500 text-white'
              }`}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            <button
              onClick={handleEndCall}
              className="w-14 h-14 rounded-full bg-red-50 border border-red-100 text-red-500 flex items-center justify-center transition-all active:scale-95 hover:bg-red-100"
            >
              <PhoneOff className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
