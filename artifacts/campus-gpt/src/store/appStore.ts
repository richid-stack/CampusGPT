import { create } from 'zustand';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';
/** Which model answers: pick for me, the deeper one, or the quicker one. */
export type ChatMode = 'auto' | 'default' | 'fast';

interface AppState {
  sidebarCollapsed: boolean;
  /** The slide-in menu on phones. */
  mobileSidebarOpen: boolean;
  commandPaletteOpen: boolean;
  activeThreadId: number | null;
  themePreference: ThemePreference;
  /** What the screen is actually showing right now. */
  theme: ResolvedTheme;
  chatMode: ChatMode;
  voiceOutputEnabled: boolean;

  setSidebarCollapsed: (collapsed: boolean) => void;
  setMobileSidebarOpen: (open: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setActiveThreadId: (id: number | null) => void;
  setThemePreference: (preference: ThemePreference) => void;
  setChatMode: (mode: ChatMode) => void;
  setVoiceOutputEnabled: (enabled: boolean) => void;
}

// Browser storage can be missing or blocked (private windows); the app must
// still work, just without remembering choices.
function read(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}
function write(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch { /* not remembered */ }
}

const systemPrefersDark = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;

const resolveTheme = (preference: ThemePreference): ResolvedTheme =>
  preference === 'system' ? (systemPrefersDark() ? 'dark' : 'light') : preference;

const applyThemeClass = (theme: ResolvedTheme) => {
  document.documentElement.classList.toggle('dark', theme === 'dark');
};

const getInitialPreference = (): ThemePreference => {
  const saved = read('theme');
  return saved === 'light' || saved === 'dark' || saved === 'system' ? saved : 'system';
};

const getInitialChatMode = (): ChatMode => {
  const saved = read('chat-mode');
  return saved === 'default' || saved === 'fast' ? saved : 'auto';
};

const initialPreference = typeof window === 'undefined' ? 'system' : getInitialPreference();

export const useAppStore = create<AppState>((set) => ({
  sidebarCollapsed: false,
  mobileSidebarOpen: false,
  commandPaletteOpen: false,
  activeThreadId: null,
  themePreference: initialPreference,
  theme: typeof window === 'undefined' ? 'light' : resolveTheme(initialPreference),
  chatMode: typeof window === 'undefined' ? 'auto' : getInitialChatMode(),
  voiceOutputEnabled: read('voice-output') !== 'off',

  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  setActiveThreadId: (id) => set({ activeThreadId: id }),
  setThemePreference: (preference) => {
    write('theme', preference);
    const theme = resolveTheme(preference);
    applyThemeClass(theme);
    set({ themePreference: preference, theme });
  },
  setChatMode: (mode) => {
    write('chat-mode', mode);
    set({ chatMode: mode });
  },
  setVoiceOutputEnabled: (enabled) => {
    write('voice-output', enabled ? 'on' : 'off');
    set({ voiceOutputEnabled: enabled });
  },
}));

// Apply the saved theme on load, and follow the device while set to "System".
if (typeof window !== 'undefined') {
  applyThemeClass(useAppStore.getState().theme);
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (useAppStore.getState().themePreference !== 'system') return;
    const theme = resolveTheme('system');
    applyThemeClass(theme);
    useAppStore.setState({ theme });
  });
}
