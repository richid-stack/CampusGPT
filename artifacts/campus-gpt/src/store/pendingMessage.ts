import { create } from 'zustand';
import type { FileUIPart } from 'ai';

/**
 * A first message written on the home screen. The chat screen picks it up and
 * sends it, so the question never has to travel in the web address.
 */
export interface PendingMessage {
  threadId: number;
  text: string;
  files: FileUIPart[];
}

interface PendingState {
  pending: PendingMessage | null;
  set: (message: PendingMessage) => void;
  /** Returns the message for this thread (once) and clears it. */
  take: (threadId: number) => PendingMessage | null;
}

export const usePendingMessage = create<PendingState>((set, get) => ({
  pending: null,
  set: (message) => set({ pending: message }),
  take: (threadId) => {
    const current = get().pending;
    if (!current || current.threadId !== threadId) return null;
    set({ pending: null });
    return current;
  },
}));
