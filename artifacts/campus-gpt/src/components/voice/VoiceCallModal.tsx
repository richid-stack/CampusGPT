import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, PhoneOff, X, MapPin, MessageSquare } from 'lucide-react';
import { useVoiceChat, VoiceState } from '../../hooks/useVoiceChat';

interface VoiceCallModalProps {
  threadId: number | null;
  onClose: () => void;
  onCreateThread?: () => Promise<number>;
}

/* ── Animated AI orb ─────────────────────────────────────────────────── */
function AiOrb({ state }: { state: VoiceState }) {
  const isListening = state === 'listening';
  const isSpeaking  = state === 'speaking';
  const isThinking  = state === 'processing';

  const gradient = isListening
    ? 'linear-gradient(135deg, #10b981, #3b82f6)'
    : isSpeaking
      ? 'linear-gradient(135deg, #6366f1, #3b82f6, #8b5cf6)'
      : 'linear-gradient(135deg, #6366f1, #3b82f6)';

  const glowColor = isListening ? 'rgba(16,185,129,0.3)' : 'rgba(99,102,241,0.3)';

  return (
    <div className="relative flex items-center justify-center" style={{ width: 180, height: 180 }}>
      {/* Outer pulse rings */}
      {(isListening || isSpeaking) && (
        <>
          <div className="absolute w-44 h-44 rounded-full opacity-20 animate-ping"
            style={{ background: gradient, animationDuration: '2s' }} />
          <div className="absolute w-36 h-36 rounded-full opacity-30 animate-ping"
            style={{ background: gradient, animationDuration: '2s', animationDelay: '0.4s' }} />
        </>
      )}

      {/* Main orb */}
      <div
        className="relative w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500"
        style={{
          background: gradient,
          boxShadow: `0 0 40px ${glowColor}, 0 0 80px ${glowColor}`,
          transform: isListening ? 'scale(1.08)' : isSpeaking ? 'scale(1.05)' : 'scale(1)',
          animation: isSpeaking ? 'orbPulse 1.2s ease-in-out infinite alternate' : 'none',
        }}
      >
        {/* Waveform bars inside orb */}
        <div className="flex items-center gap-1">
          {[0.6, 1, 1.6, 1, 0.6, 1.3, 0.8].map((h, i) => (
            <span
              key={i}
              className="rounded-full bg-white"
              style={{
                width: 3,
                height: `${h * (isListening || isSpeaking ? 28 : 16)}px`,
                opacity: isThinking ? 0.4 : 0.9,
                animation: (isListening || isSpeaking)
                  ? `waveBar 0.7s ease-in-out ${i * 0.1}s infinite alternate`
                  : 'none',
                transition: 'height 0.4s ease',
              }}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes waveBar { from { transform: scaleY(0.4); } to { transform: scaleY(1); } }
        @keyframes orbPulse { from { transform: scale(1.04); } to { transform: scale(1.1); } }
      `}</style>
    </div>
  );
}

/* ── State caption ───────────────────────────────────────────────────── */
function Caption({ state, transcript, walkMode }: { state: VoiceState; transcript: string; walkMode: boolean }) {
  if (state === 'listening') return (
    <div className="text-center space-y-1.5 px-4">
      <p className="text-emerald-400 font-semibold text-base">Listening…</p>
      {transcript && <p className="text-white/70 text-sm max-w-xs leading-snug">{transcript}</p>}
      {!transcript && walkMode && <p className="text-white/50 text-sm">Say your destination on Legon campus</p>}
    </div>
  );
  if (state === 'processing') return (
    <div className="text-center space-y-1">
      <p className="text-blue-300 font-semibold text-base animate-pulse">{walkMode ? 'Finding your route…' : 'Thinking…'}</p>
      <p className="text-white/40 text-xs">Qwen 3 is working</p>
    </div>
  );
  if (state === 'speaking') return (
    <div className="text-center">
      <p className="text-violet-300 font-semibold text-base">CampusGPT is speaking…</p>
    </div>
  );
  if (state === 'error') return null;
  return (
    <p className="text-white/50 text-sm text-center">
      {walkMode ? 'Tap mic and say where you want to go' : 'Tap the mic to speak'}
    </p>
  );
}

/* ── Main modal ──────────────────────────────────────────────────────── */
export function VoiceCallModal({ threadId, onClose, onCreateThread }: VoiceCallModalProps) {
  const [walkMode, setWalkMode] = useState(false);
  const responseRef = useRef<HTMLDivElement>(null);

  const {
    voiceState, transcript, aiResponse, error, supported,
    startListening, stopListening, stopEverything,
  } = useVoiceChat({ threadId, onCreateThread, walkMode });

  useEffect(() => {
    if (aiResponse && responseRef.current) {
      responseRef.current.scrollTop = responseRef.current.scrollHeight;
    }
  }, [aiResponse]);

  const handleEndCall = () => { stopEverything(); onClose(); };

  const handleMicPress = () => {
    if (voiceState === 'listening') stopListening();
    else if (voiceState === 'idle' || voiceState === 'error') startListening();
  };

  const isBusy = voiceState === 'processing' || voiceState === 'speaking';
  const isListening = voiceState === 'listening';

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-950 text-white">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
        <div className="flex flex-col">
          <span className="font-semibold text-lg">CampusGPT Voice</span>
          <span className="text-white/40 text-xs">University of Ghana · Legon</span>
        </div>
        <button
          onClick={handleEndCall}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Mode toggle */}
      <div className="flex items-center justify-center gap-2 px-4 pb-4 shrink-0">
        <button
          onClick={() => setWalkMode(false)}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            !walkMode ? 'bg-brand-500 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Chat
        </button>
        <button
          onClick={() => setWalkMode(true)}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            walkMode ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          Walk With Me
        </button>
      </div>

      {/* Walk With Me hint */}
      {walkMode && voiceState === 'idle' && (
        <div className="mx-5 mb-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 shrink-0">
          <p className="text-emerald-400 text-sm font-medium mb-0.5">📍 Campus Navigator Active</p>
          <p className="text-white/50 text-xs">Tap mic and say where you want to go on Legon campus — e.g. "Take me to the Economics Department" or "Where is Balme Library?"</p>
        </div>
      )}

      {/* Not supported warning */}
      {!supported && (
        <div className="mx-5 mb-3 rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-3 shrink-0">
          <p className="text-amber-400 text-sm font-medium">Voice not supported</p>
          <p className="text-white/50 text-xs mt-0.5">Please use Google Chrome for the microphone feature.</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mx-5 mb-3 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-2 shrink-0">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* AI response area */}
      {aiResponse && (
        <div
          ref={responseRef}
          className="mx-5 mb-3 max-h-40 overflow-y-auto rounded-xl bg-white/5 border border-white/10 px-4 py-3 shrink-0"
        >
          <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap">{aiResponse}</p>
        </div>
      )}

      {/* Orb — takes remaining space */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 min-h-0 px-4">
        <AiOrb state={voiceState} />
        <Caption state={voiceState} transcript={transcript} walkMode={walkMode} />
      </div>

      {/* Bottom controls */}
      <div className="flex items-center justify-center gap-8 pb-10 pt-4 shrink-0">
        {/* Mic */}
        <button
          onClick={handleMicPress}
          disabled={isBusy || !supported}
          className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-lg active:scale-95 disabled:opacity-40 ${
            isListening
              ? 'bg-red-500 hover:bg-red-600'
              : walkMode
                ? 'bg-emerald-500 hover:bg-emerald-600'
                : 'bg-brand-500 hover:bg-brand-600'
          } text-white`}
        >
          {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>

        {/* End call */}
        <button
          onClick={handleEndCall}
          className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-all shadow-lg active:scale-95"
        >
          <PhoneOff className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
