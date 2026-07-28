import { ArrowUp, Mic, MicOff, Square, ImagePlus, X } from 'lucide-react';
import { useState, useRef, useCallback, useEffect } from 'react';
import { ActionSheet } from './ActionSheet';

interface ComposerProps {
  onSend: (content: string, imageBase64?: string, imageMime?: string) => void;
  isStreaming?: boolean;
  onStop?: () => void;
  placeholder?: string;
  onOpenVoiceCall?: (mode?: 'chat' | 'walk') => void;
}

function VoiceOrb({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title="Voice chat"
      className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-transform active:scale-90 hover:scale-105"
      style={{ background: 'linear-gradient(135deg, #6366f1 0%, #2E6BFF 100%)', boxShadow: '0 2px 10px rgba(99,102,241,0.35)' }}
    >
      <div className="flex items-center gap-[2px]">
        {[8, 13, 10, 6, 10].map((h, i) => (
          <span key={i} className="rounded-full bg-white" style={{ width: 2.5, height: h, opacity: 0.9 }} />
        ))}
      </div>
    </button>
  );
}

function SendButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-white active:scale-90 transition-transform"
      style={{ background: '#2E6BFF', boxShadow: '0 2px 8px rgba(46,107,255,0.4)' }}
    >
      <ArrowUp strokeWidth={2.5} className="w-[18px] h-[18px]" />
    </button>
  );
}

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

function PlusButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-text-secondary border border-border hover:border-brand-500/40 hover:text-brand-500 transition-colors active:scale-95 bg-card"
      title="Add content"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    </button>
  );
}

export function Composer({ onSend, isStreaming, onStop, placeholder, onOpenVoiceCall }: ComposerProps) {
  const [content, setContent] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [actionSheetOpen, setActionSheetOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<string>('image/jpeg');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasSpeechSupport = typeof window !== 'undefined' &&
    ('SpeechRecognition' in (window as any) || 'webkitSpeechRecognition' in (window as any));

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
      if ((content.trim() || imageBase64) && !isStreaming) submit();
    }
  };

  const submit = () => {
    if ((!content.trim() && !imageBase64) || isStreaming) return;
    onSend(content.trim(), imageBase64 ?? undefined, imageMime);
    setContent('');
    setImagePreview(null);
    setImageBase64(null);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  /* Image picker ───────────────────────────────────────────────────────── */
  const handleImageFile = (file: File) => {
    const mime = file.type || 'image/jpeg';
    setImageMime(mime);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setImagePreview(dataUrl);
      // Strip the data URL prefix — just the base64 payload
      const base64 = dataUrl.split(',')[1] ?? '';
      setImageBase64(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageFile(file);
    e.target.value = '';
  };

  /* STT (browser Web Speech API as fallback) ──────────────────────────── */
  const startRecording = useCallback(() => {
    if (!hasSpeechSupport) return;
    const w = window as any;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    const rec: any = new SR();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = 'en-GH';
    rec.onstart = () => setIsRecording(true);
    rec.onresult = (event: any) => {
      let final = ''; let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += t; else interim += t;
      }
      setContent(final || interim);
      setTimeout(resizeTextarea, 0);
    };
    rec.onend = () => {
      setIsRecording(false);
      setContent(prev => {
        if (prev.trim() && !isStreaming) {
          setTimeout(() => {
            onSend(prev.trim());
            setContent('');
            if (textareaRef.current) textareaRef.current.style.height = 'auto';
          }, 150);
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
  const hasContent = hasText || !!imageBase64;

  return (
    <>
      <ActionSheet
        open={actionSheetOpen}
        onClose={() => setActionSheetOpen(false)}
        onWalkWithMe={() => onOpenVoiceCall?.('walk')}
      />
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="w-full max-w-3xl mx-auto px-3 md:px-4 pb-3 md:pb-5 pt-1">

        {/* Image preview strip */}
        {imagePreview && (
          <div className="flex items-center gap-2 mb-2 px-1">
            <div className="relative inline-block">
              <img
                src={imagePreview}
                alt="Attached"
                className="h-16 w-16 rounded-xl object-cover border border-border shadow-sm"
              />
              <button
                onClick={() => { setImagePreview(null); setImageBase64(null); }}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-text-primary text-background rounded-full flex items-center justify-center hover:bg-danger transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <span className="text-xs text-text-tertiary">Image attached — ask a question about it</span>
          </div>
        )}

        <div className={`flex items-end gap-2 bg-background border rounded-[20px] px-3 py-2 transition-all ${
          isRecording
            ? 'border-brand-500 ring-2 ring-brand-500/20'
            : 'border-border focus-within:ring-1 focus-within:ring-brand-500/30 focus-within:border-brand-500/50'
        }`}
          style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
        >
          {/* Left buttons */}
          <div className="flex items-center gap-1.5 mb-1">
            <PlusButton onClick={() => setActionSheetOpen(true)} />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-text-secondary border border-border hover:border-brand-500/40 hover:text-brand-500 transition-colors active:scale-95 bg-card"
              title="Attach image"
            >
              <ImagePlus className="w-4 h-4" />
            </button>
          </div>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={isRecording ? 'Listening…' : imageBase64 ? 'Ask about this image…' : placeholder ?? 'Ask CampusGPT…'}
            rows={1}
            className="flex-1 bg-transparent border-none outline-none resize-none py-1.5
              text-text-primary placeholder:text-text-tertiary leading-relaxed text-[15px]
              max-h-[160px] min-h-[36px] self-center"
          />

          {/* Right buttons */}
          <div className="flex items-center gap-2 mb-1">
            {hasSpeechSupport && !isStreaming && !hasText && !imageBase64 && (
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`p-1.5 rounded-lg transition-colors ${isRecording ? 'text-brand-500 animate-pulse' : 'text-text-tertiary hover:text-brand-500'}`}
                title={isRecording ? 'Stop' : 'Speak'}
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            )}
            {isStreaming ? (
              <StopButton onClick={() => onStop?.()} />
            ) : hasContent ? (
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
