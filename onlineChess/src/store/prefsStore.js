import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const DEFAULTS = {
  // Game Behavior
  autoQueen: false,
  moveConfirmation: false,
  enablePremoves: false,
  showCaptured: true,
  animationSpeed: 'normal',

  // Notifications
  notifFriendRequests: true,
  notifGameInvites: true,
  notifTournaments: true,
  notifClubs: true,
  browserNotifications: false,

  // Clock
  lowTimeThreshold: 30,
  lowTimeSound: true,

  // Accessibility
  reducedMotion: false,
  highContrast: false,
  pieceScale: 100,
};

const usePrefsStore = create(persist((set) => ({
  ...DEFAULTS,

  // Game Behavior
  setAutoQueen: (val) => set({ autoQueen: val }),
  setMoveConfirmation: (val) => set({ moveConfirmation: val }),
  setEnablePremoves: (val) => set({ enablePremoves: val }),
  setShowCaptured: (val) => set({ showCaptured: val }),
  setAnimationSpeed: (val) => set({ animationSpeed: val }),

  // Notifications
  setNotifFriendRequests: (val) => set({ notifFriendRequests: val }),
  setNotifGameInvites: (val) => set({ notifGameInvites: val }),
  setNotifTournaments: (val) => set({ notifTournaments: val }),
  setNotifClubs: (val) => set({ notifClubs: val }),
  setBrowserNotifications: (val) => set({ browserNotifications: val }),

  // Clock
  setLowTimeThreshold: (val) => set({ lowTimeThreshold: val }),
  setLowTimeSound: (val) => set({ lowTimeSound: val }),

  // Accessibility
  setReducedMotion: (val) => set({ reducedMotion: val }),
  setHighContrast: (val) => set({ highContrast: val }),
  setPieceScale: (val) => set({ pieceScale: val }),

  // Reset all
  resetPrefs: () => set(DEFAULTS),
}), { name: 'chess_app_prefs' }));

export default usePrefsStore;
