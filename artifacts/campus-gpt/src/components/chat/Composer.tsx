import { ArrowUp, Mic, MicOff, Plus, Square, Phone } from 'lucide-react';
import { useState, useRef, useCallback, useEffect } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecognition = any;

interface ComposerProps {
  onSend: (content: string) => void;
  isStreaming?: boolean;
  onStop?: () => void;
  placeholder?: string;
  onOpenVoiceCall?: () => void;
}

export function Composer({ onSend, isStreaming, onStop, placeholder, onOpenVoiceCall }: ComposerProps) {
  const [content, setContent] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [micError, setMicError] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  const hasSpeechSupport = typeof window !== 'undefined' &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ('SpeechRecognition' in (window as any) || 'webkitSpeechRecognition' in (window as any));

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (content.trim() && !isStreaming) submit();
    }
  };

  const submit = () => {
    if (!content.trim() || isStreaming) return;
    onSend(content.trim());
    setContent('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleActionButton = () => {
    if (isStreaming) onStop?.();
    else submit();
  };

  const startRecording = useCallback(() => {
    if (!hasSpeechSupport) return;
    setMicError(false);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SR: AnyRecognition = w.SpeechRecognition || w.webkitSpeechRecognition;
    const recognition: AnyRecognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-GH';

    recognition.onstart = () => setIsRecording(true);

    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += t;
        else interim += t;
      }
      const heard = final || interim;
      setContent(heard);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
      }
    };

    recognition.onend = () => {
      setIsRecording(false);
      setContent(prev => {
        if (prev.trim() && !isStreaming) {
          setTimeout(() => {
            onSend(prev.trim());
            setContent('');
            if (textareaRef.current) textareaRef.current.style.height = 'auto';
          }, 200);
        }
        return prev;
      });
    };

    recognition.onerror = (event: any) => {
      if (event.error !== 'aborted') setMicError(true);
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [hasSpeechSupport, isStreaming, onSend]);

  const stopRecording = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const handleMicClick = () => {
    if (isRecording) stopRecording();
    else startRecording();
  };

  useEffect(() => {
    return () => recognitionRef.current?.stop();
  }, []);

  return (
    <div className="w-full max-w-3xl mx-auto px-3 md:px-4 pb-4 md:pb-6 pt-2">
      <div className={`relative flex items-end gap-1 bg-background border rounded-2xl shadow-sm transition-shadow ${
        isRecording ? 'border-brand-500 ring-1 ring-brand-500/50' : 'border-border focus-within:ring-1 focus-within:ring-brand-500/50'
      }`}>
        {/* Attachment / file */}
        <button
          className="p-2.5 md:p-3 text-text-tertiary hover:text-text-primary transition-colors shrink-0"
          title="Attach file (coming soon)"
        >
          <Plus className="w-4 h-4 md:w-5 md:h-5" />
        </button>

        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={isRecording ? 'Listening…' : placeholder ?? 'Ask CampusGPT…'}
          rows={1}
          className="flex-1 max-h-[160px] min-h-[42px] md:min-h-[44px] py-2.5 md:py-3 bg-transparent border-none outline-none resize-none text-text-primary placeholder:text-text-tertiary leading-relaxed text-[15px]"
        />

        <div className="flex items-center gap-1 p-1.5 md:p-2 shrink-0">
          {/* Voice call button (desktop) */}
          {onOpenVoiceCall && (
            <button
              onClick={onOpenVoiceCall}
              className="p-1.5 md:p-2 text-text-tertiary hover:text-brand-500 transition-colors hidden sm:block"
              title="Voice call with CampusGPT"
            >
              <Phone className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          )}

          {/* Mic for speech-to-text */}
          {hasSpeechSupport && (
            <button
              onClick={handleMicClick}
              disabled={isStreaming}
              className={`p-1.5 md:p-2 rounded-lg transition-colors ${
                micError ? 'text-red-500' :
                isRecording ? 'text-brand-500 bg-brand-50 animate-pulse' :
                'text-text-tertiary hover:text-brand-500'
              }`}
              title={isRecording ? 'Stop recording' : 'Speak your message'}
            >
              {isRecording
                ? <MicOff className="w-4 h-4 md:w-5 md:h-5" />
                : <Mic className="w-4 h-4 md:w-5 md:h-5" />
              }
            </button>
          )}

          {/* Send / stop */}
          <button
            disabled={!content.trim() && !isStreaming}
            onClick={handleActionButton}
            className={`p-1.5 md:p-2 rounded-lg transition-colors flex items-center justify-center
              ${isStreaming
                ? 'bg-red-500 text-white hover:bg-red-600'
                : content.trim()
                  ? 'bg-brand-500 text-white hover:bg-brand-600'
                  : 'bg-card text-text-tertiary cursor-not-allowed'}`}
          >
            {isStreaming
              ? <Square className="w-3.5 h-3.5 md:w-4 md:h-4 fill-current" />
              : <ArrowUp className="w-3.5 h-3.5 md:w-4 md:h-4" />
            }
          </button>
        </div>
      </div>
      <p className="text-center mt-2 text-[10px] md:text-[11px] text-text-tertiary">
        CampusGPT can make mistakes. Always verify important information with official UG sources.
      </p>
    </div>
  );
}
