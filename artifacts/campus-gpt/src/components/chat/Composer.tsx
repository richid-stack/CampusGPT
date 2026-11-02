import { useCallback, useEffect, useRef, useState } from 'react';
import type { FileUIPart } from 'ai';
import {
  ArrowUp, AudioLines, Camera, ChevronDown, FileText, Footprints,
  ImagePlus, Mic, MicOff, Plus, Square, X,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useCreateDocument } from '@workspace/api-client-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ImageError, MAX_IMAGES, prepareImage } from '../../lib/images';
import { useAppStore, type ChatMode } from '../../store/appStore';

interface ComposerProps {
  onSend: (text: string, files: FileUIPart[]) => void;
  isStreaming?: boolean;
  onStop?: () => void;
  placeholder?: string;
  /** `dock` sits at the bottom of a conversation; `hero` is the large home card. */
  variant?: 'dock' | 'hero';
  onOpenVoiceCall?: (mode?: 'chat' | 'walk') => void;
  autoFocus?: boolean;
}

const MODES: Array<{ value: ChatMode; label: string; short: string; hint: string }> = [
  { value: 'auto', label: 'Auto', short: 'Auto', hint: 'Picks the right model for each question' },
  { value: 'default', label: 'Smart', short: 'Smart', hint: 'GPT OSS 120B — thinks deeper' },
  { value: 'fast', label: 'Fast', short: 'Fast', hint: 'GPT OSS 20B — quicker answers' },
];

const DOC_TYPES: Record<string, string> = {
  pdf: 'PDF', doc: 'Word', docx: 'Word', ppt: 'PowerPoint', pptx: 'PowerPoint', txt: 'Text', md: 'Markdown',
};

function ModePicker() {
  const { chatMode, setChatMode } = useAppStore();
  const current = MODES.find((m) => m.value === chatMode) ?? MODES[0];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex h-8 items-center gap-1 rounded-full px-2.5 text-sm font-medium text-foreground transition-colors hover:bg-card focus-visible:outline-offset-0 data-[state=open]:bg-card"
          aria-label={`Answer mode: ${current.label}`}
        >
          {current.short}
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="top" className="w-64">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">How should CampusGPT answer?</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={chatMode} onValueChange={(v) => setChatMode(v as ChatMode)}>
          {MODES.map((m) => (
            <DropdownMenuRadioItem key={m.value} value={m.value} className="items-start py-2">
              <div className="flex flex-col">
                <span className="text-sm font-medium">{m.label}</span>
                <span className="text-xs text-muted-foreground">{m.hint}</span>
              </div>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Composer({
  onSend, isStreaming, onStop, placeholder, variant = 'dock', onOpenVoiceCall, autoFocus,
}: ComposerProps) {
  const [content, setContent] = useState('');
  const [images, setImages] = useState<FileUIPart[]>([]);
  const [isRecording, setIsRecording] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createDocument = useCreateDocument();
  const hero = variant === 'hero';

  const hasSpeechSupport =
    typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
  const hasCamera = typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;

  const resize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, hero ? 220 : 160)}px`;
  }, [hero]);

  useEffect(() => { if (autoFocus) textareaRef.current?.focus(); }, [autoFocus]);

  const hasText = content.trim().length > 0;
  const canSend = (hasText || images.length > 0) && !isStreaming;

  const submit = () => {
    if (!canSend) return;
    onSend(content.trim(), images);
    setContent('');
    setImages([]);
    requestAnimationFrame(() => {
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    });
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };

  /* Photos ─────────────────────────────────────────────────────────────── */
  const addPhotos = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const room = MAX_IMAGES - images.length;
    if (room <= 0) {
      toast({ title: `You can attach up to ${MAX_IMAGES} photos.` });
      return;
    }
    try {
      const prepared = await Promise.all(Array.from(files).slice(0, room).map(prepareImage));
      setImages((prev) => [...prev, ...prepared]);
      if (files.length > room) toast({ title: `Only ${MAX_IMAGES} photos fit in one message.` });
    } catch (err) {
      toast({ title: err instanceof ImageError ? err.message : 'Could not add that photo.', variant: 'destructive' });
    }
  };

  /* Documents (added to the student's Documents list) ───────────────────── */
  const addDocuments = async (files: FileList | null) => {
    const list = Array.from(files ?? []);
    if (list.length === 0) return;
    let added = 0;
    for (const file of list) {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
      const mb = file.size / (1024 * 1024);
      try {
        await createDocument.mutateAsync({
          data: {
            name: file.name,
            type: DOC_TYPES[ext] || ext.toUpperCase() || 'File',
            pageCount: Math.max(1, Math.round(mb * (ext === 'pdf' ? 10 : 15))),
          },
        });
        added += 1;
      } catch { /* reported below */ }
    }
    void queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
    toast(added === list.length
      ? { title: added === 1 ? 'Document added' : `${added} documents added`, description: 'Find it under Documents.' }
      : { title: 'Some documents could not be added', variant: 'destructive' });
  };

  /* Speech to text (browser) ────────────────────────────────────────────── */
  const heardRef = useRef('');
  const startRecording = useCallback(() => {
    if (!hasSpeechSupport) return;
    const w = window as any;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = 'en-GH';
    heardRef.current = '';
    rec.onstart = () => setIsRecording(true);
    rec.onresult = (event: any) => {
      let text = '';
      for (let i = event.resultIndex; i < event.results.length; i++) text += event.results[i][0].transcript;
      heardRef.current = text;
      setContent(text);
      setTimeout(resize, 0);
    };
    rec.onend = () => {
      setIsRecording(false);
      const heard = heardRef.current.trim();
      if (heard && !isStreaming) {
        onSend(heard, []);
        setContent('');
        if (textareaRef.current) textareaRef.current.style.height = 'auto';
      }
    };
    rec.onerror = () => setIsRecording(false);
    recognitionRef.current = rec;
    rec.start();
  }, [hasSpeechSupport, isStreaming, onSend, resize]);

  const stopRecording = useCallback(() => recognitionRef.current?.stop(), []);
  useEffect(() => () => recognitionRef.current?.stop(), []);

  return (
    <div className={cn('w-full', hero ? '' : 'mx-auto max-w-3xl px-3 pb-3 pt-1 md:px-4 md:pb-5')}>
      <input ref={photoInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple hidden
        onChange={(e) => { void addPhotos(e.target.files); e.target.value = ''; }} />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" hidden
        onChange={(e) => { void addPhotos(e.target.files); e.target.value = ''; }} />
      <input ref={docInputRef} type="file" multiple hidden accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.md"
        onChange={(e) => { void addDocuments(e.target.files); e.target.value = ''; }} />

      <div
        className={cn(
          'flex flex-col border bg-background transition-shadow',
          hero ? 'rounded-[28px] px-5 pb-3 pt-4 shadow-[0_2px_16px_rgba(0,0,0,0.06)]' : 'rounded-[26px] px-3 pb-2 pt-2 shadow-[0_1px_6px_rgba(0,0,0,0.06)]',
          isRecording ? 'border-foreground/40 ring-2 ring-foreground/10' : 'border-border focus-within:border-foreground/30',
        )}
      >
        {images.length > 0 && (
          <div className="flex flex-wrap gap-2 px-1 pb-2 pt-1">
            {images.map((img, i) => (
              <div key={i} className="relative">
                <img src={img.url} alt={img.filename ?? 'Attached photo'} className="h-16 w-16 rounded-xl border border-border object-cover" />
                <button
                  type="button"
                  aria-label="Remove photo"
                  onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-background transition-opacity hover:opacity-80"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => { setContent(e.target.value); resize(); }}
          onKeyDown={onKeyDown}
          placeholder={isRecording ? 'Listening…' : images.length > 0 ? 'Ask about this photo…' : placeholder ?? 'Ask CampusGPT…'}
          rows={hero ? 2 : 1}
          aria-label="Message"
          className={cn(
            'w-full resize-none border-none bg-transparent leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/70',
            hero ? 'min-h-[72px] px-1 py-1 text-[18px]' : 'min-h-[36px] px-2 py-1.5 text-[15px]',
          )}
        />

        <div className="flex items-center gap-1 pt-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Add to message"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-foreground transition-colors hover:bg-card data-[state=open]:bg-card"
              >
                <Plus className="h-5 w-5" strokeWidth={1.75} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="top" className="w-60">
              <DropdownMenuItem onSelect={() => photoInputRef.current?.click()} className="gap-3 py-2">
                <ImagePlus className="h-4 w-4" /> Add photos
              </DropdownMenuItem>
              {hasCamera && (
                <DropdownMenuItem onSelect={() => cameraInputRef.current?.click()} className="gap-3 py-2">
                  <Camera className="h-4 w-4" /> Take a photo
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onSelect={() => docInputRef.current?.click()} className="gap-3 py-2">
                <FileText className="h-4 w-4" /> Add a document
              </DropdownMenuItem>
              {onOpenVoiceCall && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => onOpenVoiceCall('walk')} className="gap-3 py-2">
                    <Footprints className="h-4 w-4" />
                    <span className="flex flex-col">
                      <span>Walk with me</span>
                      <span className="text-xs text-muted-foreground">Live voice directions on campus</span>
                    </span>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="ml-auto flex items-center gap-1">
            <ModePicker />
            {hasSpeechSupport && !isStreaming && !hasText && images.length === 0 && (
              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                aria-label={isRecording ? 'Stop dictation' : 'Dictate'}
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-card',
                  isRecording ? 'animate-pulse text-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {isRecording ? <MicOff className="h-[18px] w-[18px]" /> : <Mic className="h-[18px] w-[18px]" />}
              </button>
            )}
            {isStreaming ? (
              <button
                type="button"
                onClick={() => onStop?.()}
                aria-label="Stop generating"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground text-background transition-transform active:scale-90"
              >
                <Square className="h-3.5 w-3.5 fill-current" />
              </button>
            ) : canSend ? (
              <button
                type="button"
                onClick={submit}
                aria-label="Send message"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground text-background transition-transform active:scale-90"
              >
                <ArrowUp className="h-[18px] w-[18px]" strokeWidth={2.25} />
              </button>
            ) : onOpenVoiceCall ? (
              <button
                type="button"
                onClick={() => onOpenVoiceCall('chat')}
                aria-label="Start a voice chat"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-card text-foreground transition-colors hover:bg-border"
              >
                <AudioLines className="h-[18px] w-[18px]" />
              </button>
            ) : (
              <button
                type="button"
                disabled
                aria-label="Send message"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-border text-background"
              >
                <ArrowUp className="h-[18px] w-[18px]" strokeWidth={2.25} />
              </button>
            )}
          </div>
        </div>
      </div>

      {!hero && (
        <p className="mt-2 text-center text-[11px] text-muted-foreground/70">
          CampusGPT may make mistakes — verify with official UG sources.
        </p>
      )}
    </div>
  );
}
