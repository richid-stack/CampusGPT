import { ArrowUp, Mic, MicOff, Plus, Square, Loader2 } from 'lucide-react';
import { useState, useRef, useCallback, useEffect } from 'react';
import { useCreateDocument } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecognition = any;

interface ComposerProps {
  onSend: (content: string) => void;
  isStreaming?: boolean;
  onStop?: () => void;
  placeholder?: string;
  onOpenVoiceCall?: () => void;
}

function VoiceOrb({ active, onClick }: { active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title="Voice call with CampusGPT"
      className={`relative w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-95 shadow-sm ${
        active ? 'scale-110' : 'hover:scale-105'
      }`}
      style={{
        background: active
          ? 'linear-gradient(135deg, #ef4444, #ec4899)'
          : 'linear-gradient(135deg, #6366f1, #3b82f6)',
        boxShadow: active
          ? '0 0 0 4px rgba(239,68,68,0.25), 0 2px 8px rgba(239,68,68,0.4)'
          : '0 0 0 0px transparent, 0 2px 8px rgba(99,102,241,0.35)',
      }}
    >
      {/* Waveform bars */}
      <div className="flex items-center gap-[2px]">
        {[1, 1.6, 1, 0.7, 1.3].map((h, i) => (
          <span
            key={i}
            className="w-[2.5px] rounded-full bg-white"
            style={{
              height: `${h * (active ? 14 : 10)}px`,
              animation: active ? `waveBar 0.8s ease-in-out ${i * 0.12}s infinite alternate` : 'none',
              opacity: active ? 1 : 0.85,
            }}
          />
        ))}
      </div>
      {active && (
        <span className="absolute inset-0 rounded-full animate-ping opacity-30"
          style={{ background: 'linear-gradient(135deg, #ef4444, #ec4899)' }} />
      )}
      <style>{`
        @keyframes waveBar {
          from { transform: scaleY(0.5); }
          to   { transform: scaleY(1.4); }
        }
      `}</style>
    </button>
  );
}

export function Composer({ onSend, isStreaming, onStop, placeholder, onOpenVoiceCall }: ComposerProps) {
  const [content, setContent] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createDocument = useCreateDocument();
  const queryClient = useQueryClient();

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

  /* ---------- file upload via + button ---------- */
  const handlePlusClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploadState('uploading');
    try {
      for (const file of files) {
        const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
        const typeMap: Record<string, string> = { pdf: 'PDF', doc: 'Word', docx: 'Word', ppt: 'PowerPoint', pptx: 'PowerPoint', txt: 'Text', md: 'Markdown' };
        const type = typeMap[ext] || ext.toUpperCase() || 'File';
        const mb = file.size / (1024 * 1024);
        const pageCount = Math.max(1, Math.round(mb * (ext === 'pdf' ? 10 : 15)));
        await createDocument.mutateAsync({ data: { name: file.name, type, pageCount } });
      }
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      setUploadState('done');
      setTimeout(() => setUploadState('idle'), 2500);
    } catch {
      setUploadState('error');
      setTimeout(() => setUploadState('idle'), 2500);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  /* ---------- speech-to-text mic ---------- */
  const startRecording = useCallback(() => {
    if (!hasSpeechSupport) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SR: AnyRecognition = w.SpeechRecognition || w.webkitSpeechRecognition;
    const recognition: AnyRecognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-GH';
    recognition.onstart = () => setIsRecording(true);
    recognition.onresult = (event: any) => {
      let interim = ''; let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += t; else interim += t;
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
          setTimeout(() => { onSend(prev.trim()); setContent(''); if (textareaRef.current) textareaRef.current.style.height = 'auto'; }, 200);
        }
        return prev;
      });
    };
    recognition.onerror = (event: any) => { if (event.error !== 'aborted') setIsRecording(false); setIsRecording(false); };
    recognitionRef.current = recognition;
    recognition.start();
  }, [hasSpeechSupport, isStreaming, onSend]);

  const stopRecording = useCallback(() => recognitionRef.current?.stop(), []);
  useEffect(() => () => recognitionRef.current?.stop(), []);

  const uploadMsg = uploadState === 'uploading' ? 'Uploading…' : uploadState === 'done' ? '✓ Added to Documents' : uploadState === 'error' ? '✗ Upload failed' : null;

  return (
    <div className="w-full max-w-3xl mx-auto px-3 md:px-4 pb-3 md:pb-5 pt-2">
      {/* Upload status toast */}
      {uploadMsg && (
        <div className={`mb-2 text-center text-xs px-3 py-1 rounded-full mx-auto w-fit font-medium transition-all ${
          uploadState === 'done' ? 'bg-success/10 text-success' :
          uploadState === 'error' ? 'bg-red-50 text-red-500' :
          'bg-brand-50 text-brand-600'
        }`}>
          {uploadState === 'uploading' && <Loader2 className="w-3 h-3 inline mr-1 animate-spin" />}
          {uploadMsg}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        multiple
        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.md,.png,.jpg,.jpeg"
        onChange={handleFileChange}
      />

      {/* Composer bar */}
      <div className={`relative flex items-end gap-1 bg-background border rounded-2xl shadow-sm transition-all ${
        isRecording ? 'border-brand-500 ring-2 ring-brand-500/30' : 'border-border focus-within:ring-1 focus-within:ring-brand-500/40'
      }`}>

        {/* + attachment */}
        <button
          onClick={handlePlusClick}
          disabled={uploadState === 'uploading'}
          className="p-2.5 md:p-3 text-text-tertiary hover:text-text-primary transition-colors shrink-0"
          title="Attach file to Documents"
        >
          {uploadState === 'uploading'
            ? <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
            : <Plus className="w-4 h-4 md:w-5 md:h-5" />
          }
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

        <div className="flex items-center gap-1.5 p-1.5 md:p-2 shrink-0">
          {/* Mic (STT) */}
          {hasSpeechSupport && !isStreaming && (
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`p-1.5 rounded-lg transition-colors ${
                isRecording
                  ? 'text-brand-500 bg-brand-50 animate-pulse'
                  : 'text-text-tertiary hover:text-brand-500'
              }`}
              title={isRecording ? 'Stop listening' : 'Speak your message'}
            >
              {isRecording
                ? <MicOff className="w-4 h-4 md:w-5 md:h-5" />
                : <Mic className="w-4 h-4 md:w-5 md:h-5" />
              }
            </button>
          )}

          {/* Voice orb OR send/stop button */}
          {!content.trim() && !isStreaming ? (
            /* Empty — show animated voice orb */
            <VoiceOrb active={false} onClick={() => onOpenVoiceCall?.()} />
          ) : isStreaming ? (
            /* Streaming — show stop button */
            <button
              onClick={onStop}
              className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors active:scale-95"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
            </button>
          ) : (
            /* Has content — show send button */
            <button
              onClick={submit}
              className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-brand-500 hover:bg-brand-600 text-white flex items-center justify-center transition-colors active:scale-95 shadow-sm"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <p className="text-center mt-2 text-[10px] md:text-[11px] text-text-tertiary">
        CampusGPT can make mistakes. Always verify with official UG sources.
      </p>
    </div>
  );
}
