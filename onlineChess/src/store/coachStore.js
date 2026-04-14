import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const MAX_MESSAGES = 100;
let nextId = 1;

const useCoachStore = create(persist((set, get) => ({
  messages: [],
  isOpen: false,
  pendingIntent: null, // name of handler currently running

  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set({ isOpen: !get().isOpen }),

  push: (msg) => {
    const entry = {
      id: msg.id ?? `c${Date.now()}-${nextId++}`,
      role: msg.role ?? 'coach',
      kind: msg.kind ?? 'text',
      text: msg.text ?? '',
      meta: msg.meta ?? null,
      fen: msg.fen ?? null,
      ts: msg.ts ?? Date.now(),
    };
    const next = [...get().messages, entry];
    if (next.length > MAX_MESSAGES) next.splice(0, next.length - MAX_MESSAGES);
    set({ messages: next });
    return entry;
  },

  replaceLast: (partial) => {
    const msgs = [...get().messages];
    if (msgs.length === 0) return;
    msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], ...partial };
    set({ messages: msgs });
  },

  setPendingIntent: (name) => set({ pendingIntent: name }),

  clear: () => set({ messages: [] }),
}), {
  name: 'chess_app_coach',
  partialize: (state) => ({ messages: state.messages }), // don't persist isOpen/pendingIntent
}));

export default useCoachStore;
