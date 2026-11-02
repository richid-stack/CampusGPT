import { useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import type { FileUIPart } from 'ai';
import { CalendarClock, ChevronDown, ChevronRight, FolderClosed, Footprints, Lightbulb } from 'lucide-react';
import { getGetRecentThreadsQueryKey, useCreateThread } from '@workspace/api-client-react';
import { Composer } from '../components/chat/Composer';
import { VoiceCallModal } from '../components/voice/VoiceCallModal';
import { PageHeader } from '../components/layout/PageHeader';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { usePendingMessage } from '../store/pendingMessage';
import { INSPIRATION, QUICK_STARTERS } from '../lib/starters';

const SPACES = [
  { value: 'my_campus', label: 'My campus' },
  { value: 'academic', label: 'Academic' },
  { value: 'career', label: 'Career' },
  { value: 'wellness', label: 'Wellness' },
  { value: 'shared', label: 'Shared' },
] as const;

/** Tiny file-type badges, the same trio Kimi shows next to "Plugins". */
function FileBadges() {
  const base = 'flex h-[22px] w-[18px] items-end justify-center rounded-[3px] border pb-[2px] text-[5px] font-bold leading-none';
  return (
    <span className="flex items-center gap-1" aria-hidden>
      <span className={`${base} border-red-200 bg-red-50 text-red-500 dark:border-red-900 dark:bg-red-950`}>PDF</span>
      <span className={`${base} border-green-200 bg-green-50 text-green-600 dark:border-green-900 dark:bg-green-950`}>XLS</span>
      <span className={`${base} border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-900 dark:bg-blue-950`}>DOC</span>
    </span>
  );
}

export default function Home() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const createThread = useCreateThread();
  const setPending = usePendingMessage((s) => s.set);
  const { toast } = useToast();

  const [space, setSpace] = useState<(typeof SPACES)[number]['value'] | null>(null);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [voiceMode, setVoiceMode] = useState<'chat' | 'walk'>('chat');
  const [ideasOpen, setIdeasOpen] = useState(false);
  const chipsRef = useRef<HTMLDivElement>(null);

  const startChat = async (text: string, files: FileUIPart[] = []) => {
    try {
      const thread = await createThread.mutateAsync({
        data: { title: (text || 'Photo question').slice(0, 60), space: space ?? 'academic' },
      });
      void queryClient.invalidateQueries({ queryKey: getGetRecentThreadsQueryKey() });
      setPending({ threadId: thread.id, text, files });
      setLocation(`/chat/${thread.id}`);
    } catch {
      toast({ title: 'Could not start the chat', description: 'Please try again.', variant: 'destructive' });
    }
  };

  const openVoice = (mode: 'chat' | 'walk' = 'chat') => { setVoiceMode(mode); setVoiceOpen(true); };
  const spaceLabel = SPACES.find((s) => s.value === space)?.label ?? 'Select space';

  return (
    <div className="flex h-full flex-col bg-background">
      <PageHeader bare>
        <button
          type="button"
          onClick={() => openVoice('walk')}
          className="inline-flex h-10 items-center gap-2 rounded-full bg-primary/10 px-4 text-[15px] font-medium text-primary transition-colors hover:bg-primary/15"
        >
          <Footprints className="h-[18px] w-[18px]" aria-hidden /> Walk with me
        </button>
        <button
          type="button"
          onClick={() => setLocation('/timetable')}
          className="inline-flex h-10 items-center gap-2 rounded-full bg-card px-4 text-[15px] font-medium text-foreground transition-colors hover:bg-border"
        >
          <CalendarClock className="h-[18px] w-[18px]" aria-hidden /> Timetable
        </button>
      </PageHeader>

      <div className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto px-4 pb-6">
        {/* Everything sits a little above the middle, like Kimi */}
        <div className="flex w-full max-w-[680px] flex-1 flex-col justify-center pb-16 pt-6">
          <h1 className="mb-10 text-center text-[44px] font-bold leading-none tracking-tight text-foreground md:text-[52px]">
            Campus<span className="text-muted-foreground">GPT</span>
          </h1>

          <div className="relative">
            <div className="relative z-10">
              <Composer
                variant="hero"
                autoFocus
                placeholder="Ask anything about campus…"
                onSend={(text, files) => void startChat(text, files)}
                onOpenVoiceCall={openVoice}
              />
            </div>

            {/* The tab tucked under the card */}
            <div className="relative z-0 mx-3 -mt-5 flex items-center justify-between rounded-b-3xl bg-card px-4 pb-2.5 pt-7">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button type="button" className="inline-flex items-center gap-2 rounded-lg py-1 text-[15px] text-muted-foreground transition-colors hover:text-foreground">
                    <FolderClosed className="h-[18px] w-[18px]" aria-hidden /> {spaceLabel}
                    <ChevronDown className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-44">
                  <DropdownMenuRadioGroup value={space ?? ''} onValueChange={(v) => setSpace(v as typeof space)}>
                    {SPACES.map((s) => (
                      <DropdownMenuRadioItem key={s.value} value={s.value}>{s.label}</DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>

              <button
                type="button"
                onClick={() => setLocation('/documents')}
                className="inline-flex items-center gap-2.5 rounded-lg py-1 text-[15px] text-muted-foreground transition-colors hover:text-foreground"
              >
                <FileBadges /> Documents
              </button>
            </div>
          </div>

          {/* Quick starters */}
          <div className="relative mt-7">
            <div
              ref={chipsRef}
              className="flex gap-2.5 overflow-x-auto pb-1 pr-14 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {QUICK_STARTERS.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => ('href' in s ? setLocation(s.href) : void startChat(s.prompt))}
                  className="inline-flex h-12 shrink-0 items-center gap-2 rounded-full border border-border bg-background px-5 text-[15px] text-foreground transition-colors hover:bg-card"
                >
                  <s.icon className="h-[18px] w-[18px] text-muted-foreground" aria-hidden /> {s.label}
                </button>
              ))}
            </div>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex w-20 items-center justify-end bg-gradient-to-l from-background via-background/90 to-transparent">
              <button
                type="button"
                aria-label="More shortcuts"
                onClick={() => chipsRef.current?.scrollBy({ left: 220, behavior: 'smooth' })}
                className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-sm transition-colors hover:bg-card"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIdeasOpen(true)}
          className="mt-auto inline-flex items-center gap-2 py-2 text-[15px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <Lightbulb className="h-[18px] w-[18px]" aria-hidden /> Explore inspiration
        </button>
      </div>

      <Dialog open={ideasOpen} onOpenChange={setIdeasOpen}>
        <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Explore inspiration</DialogTitle>
            <DialogDescription>Tap a question to start a chat about it.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-5">
            {INSPIRATION.map((group) => (
              <section key={group.title}>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{group.title}</h3>
                <ul className="flex flex-col gap-1.5">
                  {group.prompts.map((p) => (
                    <li key={p}>
                      <button
                        type="button"
                        onClick={() => { setIdeasOpen(false); void startChat(p); }}
                        className="w-full rounded-xl border border-border px-4 py-2.5 text-left text-[15px] text-foreground transition-colors hover:bg-card"
                      >
                        {p}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {voiceOpen && (
        <VoiceCallModal
          threadId={null}
          onClose={() => setVoiceOpen(false)}
          initialMode={voiceMode}
          onCreateThread={async () => {
            const thread = await createThread.mutateAsync({ data: { title: 'Voice chat', space: space ?? 'academic' } });
            void queryClient.invalidateQueries({ queryKey: getGetRecentThreadsQueryKey() });
            setLocation(`/chat/${thread.id}`);
            return thread.id;
          }}
        />
      )}
    </div>
  );
}
