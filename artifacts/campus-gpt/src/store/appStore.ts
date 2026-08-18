import { create } from 'zustand';

type RightPanelTab = 'sources' | 'artifact' | 'document' | 'timetable' | 'plan';

interface AppState {
  sidebarCollapsed: boolean;
  rightPanelOpen: boolean;
  rightPanelTab: RightPanelTab;
  commandPaletteOpen: boolean;
  activeThreadId: number | null;
  theme: 'light' | 'dark';
  streamingMessageId: number | null;
  voiceOutputEnabled: boolean;
  
  setSidebarCollapsed: (collapsed: boolean) => void;
  setRightPanelOpen: (open: boolean) => void;
  setRightPanelTab: (tab: RightPanelTab) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setActiveThreadId: (id: number | null) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setStreamingMessageId: (id: number | null) => void;
  setVoiceOutputEnabled: (enabled: boolean) => void;
}

const getInitialTheme = (): 'light' | 'dark' => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') return saved;
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
  }
  return 'light';
};

const getInitialVoiceOutput = (): boolean => {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem('voice-output') !== 'off';
};

export const useAppStore = create<AppState>((set) => ({
  sidebarCollapsed: false,
  rightPanelOpen: false,
  rightPanelTab: 'sources',
  commandPaletteOpen: false,
  activeThreadId: null,
  theme: getInitialTheme(),
  streamingMessageId: null,
  voiceOutputEnabled: getInitialVoiceOutput(),
  
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setRightPanelOpen: (open) => set({ rightPanelOpen: open }),
  setRightPanelTab: (tab) => set({ rightPanelTab: tab, rightPanelOpen: true }),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  setActiveThreadId: (id) => set({ activeThreadId: id }),
  setTheme: (theme) => {
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    set({ theme });
  },
  setStreamingMessageId: (id) => set({ streamingMessageId: id }),
  setVoiceOutputEnabled: (enabled) => {
    localStorage.setItem('voice-output', enabled ? 'on' : 'off');
    set({ voiceOutputEnabled: enabled });
  },
}));

// Initialize theme class
if (typeof window !== 'undefined') {
  const theme = getInitialTheme();
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  }
}
