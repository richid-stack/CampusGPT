import { useEffect, useRef } from 'react';
import { Mic, MicOff, PhoneOff, Volume2, Loader2 } from 'lucide-react';
import { useVoiceChat, VoiceState } from '../../hooks/useVoiceChat';

interface VoiceCallModalProps {
  threadId: number | null;
  onClose: () => void;
  onCreateThread?: () => Promise<number>;
}

function PulseRing({ active }: { active: boolean }) {
  return (
    <div className="relative flex items-center justify-center">
      {active && (
        <>
          <div className="absolute w-32 h-32 rounded-full bg-brand-500/20 animate-ping" />
          <div className="absolute w-24 h-24 rounded-full bg-brand-500/30 animate-ping" style={{ animationDelay: '0.2s' }} />
        </>
      )}
      <div className={`relative w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-colors duration-300 ${
        active ? 'bg-brand-500' : 'bg-card border-2 border-border'
      }`}>
        <Mic className={`w-8 h-8 transition-colors ${active ? 'text-white' : 'text-text-secondary'}`} />
      </div>
    </div>
  );
}

function StateLabel({ state, transcript }: { state: VoiceState; transcript: string }) {
  if (state === 'listening') return (
    <div className="text-center space-y-1">
      <p className="text-brand-500 font-medium text-sm animate-pulse">Listening…</p>
      {transcript && <p className="text-text-secondary text-sm max-w-xs">{transcript}</p>}
    </div>
  );
  if (state === 'processing') return (
    <div className="flex items-center gap-2 text-text-secondary text-sm">
      <Loader2 className="w-4 h-4 animate-spin text-brand-500" />
      <span>CampusGPT is thinking…</span>
    </div>
  );
  if (state === 'speaking') return (
    <div className="flex items-center gap-2 text-brand-500 text-sm font-medium">
      <Volume2 className="w-4 h-4 animate-pulse" />
      <span>CampusGPT is speaking…</span>
    </div>
  );
  if (state === 'error') return null;
  return <p className="text-text-tertiary text-sm">Tap the mic to speak</p>;
}

export function VoiceCallModal({ threadId, onClose, onCreateThread }: VoiceCallModalProps) {
  const {
    voiceState,
    transcript,
    aiResponse,
    error,
    supported,
    startListening,
    stopListening,
    stopEverything,
  } = useVoiceChat({ threadId, onCreateThread });

  const responseRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (aiResponse && responseRef.current) {
      responseRef.current.scrollTop = responseRef.current.scrollHeight;
    }
  }, [aiResponse]);

  const handleEndCall = () => {
    stopEverything();
    onClose();
  };

  const handleMicPress = () => {
    if (voiceState === 'listening') stopListening();
    else if (voiceState === 'idle' || voiceState === 'error') startListening();
  };

  const isActive = voiceState === 'listening';
  const isBusy = voiceState === 'processing' || voiceState === 'speaking';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full sm:w-[380px] sm:rounded-3xl bg-background border border-border shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="pt-6 pb-3 px-6 flex flex-col items-center gap-1">
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-brand-500 to-indigo-500 flex items-center justify-center mb-1">
            <span className="text-white font-bold text-lg">C</span>
          </div>
          <h2 className="font-semibold text-text-primary text-lg">CampusGPT Voice</h2>
          <p className="text-xs text-text-tertiary">AI Campus Assistant · University of Ghana</p>
        </div>

        {!supported && (
          <div className="px-6 pb-4">
            <div className="bg-warning/10 border border-warning/30 rounded-xl p-3 text-center">
              <p className="text-warning text-sm font-medium">Voice not supported</p>
              <p className="text-text-secondary text-xs mt-1">Please use Google Chrome for voice features.</p>
            </div>
          </div>
        )}

        {/* AI response scroll area */}
        {aiResponse && (
          <div
            ref={responseRef}
            className="mx-4 mb-3 max-h-36 overflow-y-auto bg-card border border-border rounded-xl p-3"
          >
            <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">{aiResponse}</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mx-4 mb-3 bg-red-50 border border-red-200 rounded-xl p-3 text-center">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Pulse animation + state label */}
        <div className="flex flex-col items-center gap-4 py-6">
          <PulseRing active={isActive} />
          <StateLabel state={voiceState} transcript={transcript} />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-8 pb-8 pt-2">
          {/* Mic toggle */}
          <button
            onClick={handleMicPress}
            disabled={isBusy || !supported}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-md active:scale-95 disabled:opacity-50 ${
              isActive
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-brand-500 hover:bg-brand-600 text-white'
            }`}
          >
            {isActive ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>

          {/* End call */}
          <button
            onClick={handleEndCall}
            className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-all shadow-md active:scale-95"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
        </div>

        <p className="text-center text-[11px] text-text-tertiary pb-5">
          Tap mic · speak · CampusGPT will reply aloud
        </p>
      </div>
    </div>
  );
}
