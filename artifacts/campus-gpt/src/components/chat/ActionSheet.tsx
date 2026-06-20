import { useRef } from 'react';
import { useCreateDocument } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';

interface ActionSheetProps {
  open: boolean;
  onClose: () => void;
  onWalkWithMe: () => void;
  onFileSelect?: (files: FileList) => void;
}

/* ── Custom SVG icons ─────────────────────────────────────────────────── */
const Icons = {
  Documents: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="13" y2="17" />
    </svg>
  ),
  Scan: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7V5a2 2 0 0 1 2-2h2" />
      <path d="M17 3h2a2 2 0 0 1 2 2v2" />
      <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
      <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
      <rect x="7" y="7" width="10" height="10" rx="1" />
    </svg>
  ),
  VoiceNote: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="9" y1="22" x2="15" y2="22" />
    </svg>
  ),
  Image: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  ),
  Walk: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="3" r="2" />
      <path d="M9 20l.94-5.07" />
      <path d="M15.41 20l-.94-5.07" />
      <path d="M9.5 9.5l-1.5 5 5.5 1" />
      <path d="M14.5 9.5l1.5 5-5.5 1" />
      <path d="M12 5.5c-1 1-2.5 2-3.5 2.5" />
      <path d="M12 5.5c1 1 2.5 2 3.5 2.5" />
    </svg>
  ),
  Search: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="10" r="7" />
      <line x1="21" y1="21" x2="15.5" y2="15.5" />
      <line x1="7" y1="10" x2="13" y2="10" />
      <line x1="10" y1="7" x2="10" y2="13" />
    </svg>
  ),
} as const;

interface Action {
  id: string;
  label: string;
  sub: string;
  icon: keyof typeof Icons;
  color: string;
  bg: string;
  available: boolean;
}

const ACTIONS: Action[] = [
  { id: 'documents',  label: 'Documents',             sub: 'PDF, DOCX, lecture slides',        icon: 'Documents', color: '#2E6BFF', bg: '#EFF6FF', available: true  },
  { id: 'scan',       label: 'Scan Document',          sub: 'Camera capture',                   icon: 'Scan',      color: '#7C3AED', bg: '#F5F3FF', available: false },
  { id: 'voice-note', label: 'Voice Note',             sub: 'Record long voice explanation',    icon: 'VoiceNote', color: '#059669', bg: '#ECFDF5', available: false },
  { id: 'image',      label: 'Ask from Image',         sub: 'Screenshot or whiteboard',         icon: 'Image',     color: '#D97706', bg: '#FFFBEB', available: false },
  { id: 'walk',       label: 'Walk With Me',           sub: 'Live campus navigation',           icon: 'Walk',      color: '#0891B2', bg: '#ECFEFF', available: true  },
  { id: 'search',     label: 'Campus Knowledge',       sub: 'Search UG policies and halls',     icon: 'Search',    color: '#BE185D', bg: '#FDF2F8', available: false },
];

export function ActionSheet({ open, onClose, onWalkWithMe, onFileSelect }: ActionSheetProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createDocument = useCreateDocument();
  const queryClient = useQueryClient();

  const handleAction = async (id: string) => {
    if (id === 'walk') {
      onClose();
      onWalkWithMe();
      return;
    }
    if (id === 'documents') {
      fileInputRef.current?.click();
      return;
    }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    onClose();
    for (const file of files) {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
      const typeMap: Record<string, string> = { pdf: 'PDF', doc: 'Word', docx: 'Word', ppt: 'PowerPoint', pptx: 'PowerPoint', txt: 'Text', md: 'Markdown' };
      const type = typeMap[ext] || ext.toUpperCase() || 'File';
      const mb = file.size / (1024 * 1024);
      const pageCount = Math.max(1, Math.round(mb * (ext === 'pdf' ? 10 : 15)));
      try {
        await createDocument.mutateAsync({ data: { name: file.name, type, pageCount } });
      } catch { /* silent */ }
    }
    queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
    if (fileInputRef.current) fileInputRef.current.value = '';
    onFileSelect?.(e.target.files!);
  };

  if (!open) return null;

  return (
    <>
      <input ref={fileInputRef} type="file" className="hidden" multiple
        accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.md,.png,.jpg,.jpeg"
        onChange={handleFile}
      />

      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[3px]"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-[20px] shadow-2xl
        animate-in slide-in-from-bottom-4 duration-300 pb-safe-area-inset-bottom"
        style={{ boxShadow: '0 -4px 40px rgba(0,0,0,0.12)' }}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-9 h-1 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="px-5 pb-4 pt-1">
          <p className="text-[13px] font-semibold text-text-tertiary uppercase tracking-widest">Add to CampusGPT</p>
        </div>

        {/* Actions grid */}
        <div className="px-4 pb-6 grid grid-cols-2 gap-2.5">
          {ACTIONS.map(action => {
            const IconComp = Icons[action.icon];
            return (
              <button
                key={action.id}
                onClick={() => action.available && handleAction(action.id)}
                className={`relative flex flex-col items-start gap-2.5 p-4 rounded-2xl border transition-all active:scale-[0.97] text-left ${
                  action.available
                    ? 'border-border hover:border-brand-500/30 hover:shadow-sm bg-card'
                    : 'border-border bg-card opacity-50 cursor-not-allowed'
                }`}
              >
                {/* Icon container */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: action.bg, color: action.color }}
                >
                  <IconComp />
                </div>

                <div>
                  <p className="text-[14px] font-semibold text-text-primary leading-tight">{action.label}</p>
                  <p className="text-[12px] text-text-tertiary leading-tight mt-0.5">{action.sub}</p>
                </div>

                {!action.available && (
                  <span className="absolute top-3 right-3 text-[10px] font-medium text-text-tertiary bg-border/60 px-1.5 py-0.5 rounded-full">
                    Soon
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
