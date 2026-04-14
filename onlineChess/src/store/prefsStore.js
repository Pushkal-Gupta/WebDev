import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const DEFAULTS = {
  // Gameplay - General
  autoQueen: false,
  moveConfirmation: false,
  confirmResign: true,
  enablePremoves: false,
  showCaptured: true,
  animationSpeed: 'normal',
  whiteAlwaysOnBottom: false,
  castlingMethod: 'normal',

  // Gameplay - Analysis
  showEngineEval: true,
  showPostGameFeedback: true,
  showTimestamps: false,
  showMoveClassification: true,

  // Interface
  showRatings: true,
  showPieceIcons: false,

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

  // Coach
  coachEnabled: true,
  coachPosition: 'br', // 'br' | 'bl' | 'tr' | 'tl'
  coachVerbosity: 'medium', // 'quiet' | 'medium' | 'verbose'
  botCommentaryEnabled: true,
};

const usePrefsStore = create(persist((set) => ({
  ...DEFAULTS,

  // Gameplay - General
  setAutoQueen: (val) => set({ autoQueen: val }),
  setMoveConfirmation: (val) => set({ moveConfirmation: val }),
  setConfirmResign: (val) => set({ confirmResign: val }),
  setEnablePremoves: (val) => set({ enablePremoves: val }),
  setShowCaptured: (val) => set({ showCaptured: val }),
  setAnimationSpeed: (val) => set({ animationSpeed: val }),
  setWhiteAlwaysOnBottom: (val) => set({ whiteAlwaysOnBottom: val }),
  setCastlingMethod: (val) => set({ castlingMethod: val }),

  // Gameplay - Analysis
  setShowEngineEval: (val) => set({ showEngineEval: val }),
  setShowPostGameFeedback: (val) => set({ showPostGameFeedback: val }),
  setShowTimestamps: (val) => set({ showTimestamps: val }),
  setShowMoveClassification: (val) => set({ showMoveClassification: val }),

  // Interface
  setShowRatings: (val) => set({ showRatings: val }),
  setShowPieceIcons: (val) => set({ showPieceIcons: val }),

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

  // Coach
  setCoachEnabled: (val) => set({ coachEnabled: val }),
  setCoachPosition: (val) => set({ coachPosition: val }),
  setCoachVerbosity: (val) => set({ coachVerbosity: val }),
  setBotCommentaryEnabled: (val) => set({ botCommentaryEnabled: val }),

  // Reset all
  resetPrefs: () => set(DEFAULTS),
}), { name: 'chess_app_prefs' }));

export default usePrefsStore;
