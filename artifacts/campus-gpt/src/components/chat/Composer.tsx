import { ArrowUp, Mic, MicOff, Square } from 'lucide-react';
import { useState, useRef, useCallback, useEffect } from 'react';
import { ActionSheet } from './ActionSheet';

type AnyRecognition = any; // eslint-disable-line @typescript-eslint/no-explicit-any

interface ComposerProps {
  onSend: (content: string) => void;
  isStreaming?: boolean;
  onStop?: () => void;
  placeholder?: string;
  onOpenVoiceCall?: (mode?: 'chat' | 'walk') => void;
}

/* ── Mic button for voice call (always visible when input empty) ────────── */
function VoiceOrb({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title="Voice chat"
      className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-transform active:scale-90 hover:scale-105"
      style={{
        background: 'linear-gradient(135deg, #6366f1 0%, #2E6BFF 100%)',
        boxShadow: '0 2px 10px rgba(99,102,241,0.35)',
      }}
    >
      <div className="flex items-center gap-[2px]">
        {[8, 13, 10, 6, 10].map((h, i) => (
          <span key={i} className="rounded-full bg-white" style={{ width: 2.5, height: h, opacity: 0.9 }} />
        ))}
      </div>
    </button>
  );
}

/* ── Send button (appears when input has text) ──────────────────────────── */
function SendButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-white
        active:scale-90 transition-transform"
      style={{ background: '#2E6BFF', boxShadow: '0 2px 8px rgba(46,107,255,0.4)' }}
    >
      <ArrowUp strokeWidth={2.5} className="w-[18px] h-[18px]" />
    </button>
  );
}

/* ── Stop button (appears while streaming) ──────────────────────────────── */
function StopButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-9 h-9 rounded-full bg-text-primary flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform"
    >
      <Square className="w-3.5 h-3.5 fill-white text-white" />
    </button>
  );
}

/* ── Plus button ────────────────────────────────────────────────────────── */
function PlusButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-text-secondary
        border border-border hover:border-brand-500/40 hover:text-brand-500 transition-colors active:scale-95 bg-card"
      title="Add content"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    </button>
  );
}

export function Composer({ onSend, isStreaming, onStop, placeholder, onOpenVoiceCall }: ComposerProps) {
  const [content, setContent] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [actionSheetOpen, setActionSheetOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<AnyRecognition>(null);

  const hasSpeechSupport = typeof window !== 'undefined' &&
    ('SpeechRecognition' in (window as AnyRecognition) || 'webkitSpeechRecognition' in (window as AnyRecognition));

  const resizeTextarea = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    resizeTextarea();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      if (content.trim() && !isStreaming) submit();
    }
  };

  const submit = () => {
    const trimmed = content.trim();
    if (!trimmed || isStreaming) return;
    onSend(trimmed);
    setContent('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  /* STT ─────────────────────────────────────────────────────────────────── */
  const startRecording = useCallback(() => {
    if (!hasSpeechSupport) return;
    const w = window as AnyRecognition;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    const rec: AnyRecognition = new SR();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = 'en-GH';
    rec.onstart = () => setIsRecording(true);
    rec.onresult = (event: AnyRecognition) => {
      let final = ''; let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += t; else interim += t;
      }
      const heard = final || interim;
      setContent(heard);
      setTimeout(resizeTextarea, 0);
    };
    rec.onend = () => {
      setIsRecording(false);
      setContent(prev => {
        if (prev.trim() && !isStreaming) {
          setTimeout(() => { onSend(prev.trim()); setContent(''); if (textareaRef.current) textareaRef.current.style.height = 'auto'; }, 150);
        }
        return prev;
      });
    };
    rec.onerror = () => setIsRecording(false);
    recognitionRef.current = rec;
    rec.start();
  }, [hasSpeechSupport, isStreaming, onSend]);

  const stopRecording = useCallback(() => recognitionRef.current?.stop(), []);
  useEffect(() => () => recognitionRef.current?.stop(), []);

  const hasText = content.trim().length > 0;

  return (
    <>
      <ActionSheet
        open={actionSheetOpen}
        onClose={() => setActionSheetOpen(false)}
        onWalkWithMe={() => onOpenVoiceCall?.('walk')}
      />

      <div className="w-full max-w-3xl mx-auto px-3 md:px-4 pb-3 md:pb-5 pt-1">
        <div className={`flex items-end gap-2 bg-background border rounded-[20px] px-3 py-2 transition-all ${
          isRecording
            ? 'border-brand-500 ring-2 ring-brand-500/20'
            : 'border-border focus-within:ring-1 focus-within:ring-brand-500/30 focus-within:border-brand-500/50'
        }`}
          style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
        >
          {/* + button */}
          <div className="mb-1">
            <PlusButton onClick={() => setActionSheetOpen(true)} />
          </div>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={isRecording ? 'Listening…' : placeholder ?? 'Ask CampusGPT…'}
            rows={1}
            className="flex-1 bg-transparent border-none outline-none resize-none py-1.5
              text-text-primary placeholder:text-text-tertiary leading-relaxed text-[15px]
              max-h-[160px] min-h-[36px] self-center"
          />

          {/* Right-side buttons */}
          <div className="flex items-center gap-2 mb-1">
            {/* STT mic (only when not streaming and speech supported) */}
            {hasSpeechSupport && !isStreaming && !hasText && (
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`p-1.5 rounded-lg transition-colors ${
                  isRecording
                    ? 'text-brand-500 animate-pulse'
                    : 'text-text-tertiary hover:text-brand-500'
                }`}
                title={isRecording ? 'Stop' : 'Speak'}
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            )}

            {/* Primary action button — changes based on state */}
            {isStreaming ? (
              <StopButton onClick={() => onStop?.()} />
            ) : hasText ? (
              <SendButton onClick={submit} />
            ) : (
              <VoiceOrb onClick={() => onOpenVoiceCall?.('chat')} />
            )}
          </div>
        </div>

        <p className="text-center mt-2 text-[11px] text-text-tertiary/70">
          CampusGPT may make mistakes — verify with official UG sources.
        </p>
      </div>
    </>
  );
}
