# PG.Chess — Comprehensive UX Audit

**Date:** 2026-04-03
**Method:** 10 parallel code-audit agents, each covering one UX area
**Scope:** Full app from first-time user perspective

---

## Summary

| Severity | Count |
|----------|-------|
| CRITICAL | 18 |
| MAJOR    | 38 |
| MINOR    | 52 |

---

## CRITICAL ISSUES

### Navigation & Auth
1. **Login entry point non-obvious** — Account nav button doubles as login; no dedicated sign-in button in header. New users won't find it.
   - Fix: Add prominent "Sign In" button in nav header for unauthenticated users.

2. **Quick Match buttons don't show login requirement** — Clicking any online button without auth opens LoginModal with no prior warning (lock icon, tooltip, disabled state).
   - Fix: Add lock icon or "Sign in required" tooltip on Quick Match buttons for guests.

### Game Setup
3. **vs Computer has no time control picker** — StrengthModal shows difficulty but user can't choose timed/untimed. Game always starts untimed with no explanation.
   - Fix: Add time control step before or within StrengthModal.

4. **Pass & Play starts with no timer indication** — Game starts immediately untimed with no label. Timer shows nothing. User doesn't know the game is untimed.
   - Fix: Show "Untimed" label on player panels when `timeControl` is null.

### During Game
5. **Resign button has no confirmation** — One accidental click ends the game permanently. No "Are you sure?" dialog.
   - Fix: Wrap resign in ConfirmModal (component already exists).

6. **No visual feedback when opponent is thinking (online)** — After making a move, board disables silently. No spinner, no "Waiting..." message.
   - Fix: Show "Opponent thinking..." indicator on opponent's player panel.

7. **Pawn promotion UI unclear** — Promotion modal appears but board gives no visual cue it's waiting for input. Users try clicking the board.
   - Fix: Add subtle overlay/highlight on board during promotion.

### Puzzles
8. **Puzzle rating meaning unexplained** — Users see "Puzzle Rating: 1500" but don't know what this means or the rating scale.
   - Fix: Add tooltip "Puzzle ratings range from 600-2400".

9. **Mode tabs don't explain Rush/Streak** — Tabs say "Rated", "Rush", "Streak" with no tooltips or descriptions before clicking.
   - Fix: Add tooltips or subtitles explaining each mode.

10. **Turn indicator color contrast too low** — 14px dot at #f0f0f0 vs #222 relies purely on color. Small and subtle.
    - Fix: Add distinct borders or shape differences for better contrast.

### Mobile (375px)
11. **Board overflows at 375px** — 8x42px = 336px board + padding exceeds viewport. Pieces may clip at edges.
    - Fix: Add `@media (max-width: 375px) { --cell-size: 40px; }`.

12. **Modals overflow on small screens** — `min-width: 300px` + `padding: 26px 30px` = 360px, exceeding 375px viewport.
    - Fix: Add `@media (max-width: 420px) { .popup { min-width: auto; padding: 16px 20px; } }`.

13. **Hint buttons only ~17px tall on mobile** — `padding: 3px 7px` at 540px breakpoint creates untappable targets.
    - Fix: Enforce `min-height: 44px` on all interactive elements.

### Consistency
14. **5 different error reds used** — #ff4444, #e53e3e, #ff9999, #ff7875, #e05555 across components instead of `var(--color-error)`.
    - Fix: Replace all hardcoded reds with `var(--color-error)`.

15. **4 different close button styles** — Font sizes 1rem-1.3rem, different padding, different symbols (x vs X).
    - Fix: Create single `.closeBtn` class with consistent sizing.

16. **Modal button padding varies wildly** — 5px-13px vertical, 12px-24px horizontal across same-level buttons.
    - Fix: Establish button size tiers (small/medium/large) and apply consistently.

### Settings
17. **Settings only accessible during local games** — LeftSidebar (themes, sounds, labels) hidden during online play and outside games.
    - Fix: Create dedicated Settings tab accessible anytime.

18. **No dedicated Settings page** — Settings scattered: LeftSidebar (in-game only), Account > Appearance (logged-in only).
    - Fix: Centralize all settings in one always-accessible location.

---

## MAJOR ISSUES

### Navigation
19. **Nav items not logically grouped** — Play modes scattered among features. "Play" vs "Online" vs "Computer" distinction unclear.
20. **Theme settings buried** — Account > Appearance tab (4th tab) requires 2 clicks minimum; not intuitive.
21. **Logo links to external URL** — Logo goes to `../../PG/main.html` instead of Tab 0 (Home).
22. **No breadcrumbs or back buttons** — Feature pages have no way to show navigation hierarchy.

### Settings
23. **Duplicate settings in two locations** — Piece Set and Board Theme in both LeftSidebar AND Account > Appearance.
24. **Gameplay preferences not persisted** — `showLabels`, `showLegalDots`, `blindfoldMode`, `dotSize` reset on page reload (not in persistent store).
25. **Sound controls only in LeftSidebar** — Can't adjust volume between games or during online play.
26. **Online games have zero settings access** — `isGameViewActive && !isOnline` condition hides LeftSidebar.

### Game Setup
27. **GameSetupPanel dead code** — Fully functional time control UI defined (App.jsx:1041-1148) but never rendered.
28. **Tab 3 shows HomeScreen redundantly** — "Computer" tab shows same HomeScreen as Tab 0 when no game active.

### During Game
29. **Online controls cluttered on mobile** — Hint/Undo/Resign buttons at 0.77rem in single row, too small to tap.
30. **Player names truncate without tooltip** — Long usernames show "SuperGrandma..." with no way to see full name.
31. **Chat unread badge hard to see** — Red badge may be covered by other UI elements.
32. **Move history sidebar hidden on mobile** — `display: none` at <700px removes move list, navigation, flip/undo.
33. **Undo count not visible on mobile** — Only shown in hover tooltip, which doesn't work on touch.

### Post-Game
34. **"Close" button doesn't navigate home** — Just dismisses modal, leaves user on frozen board with no clear next step.
35. **Three buttons with unclear hierarchy** — "New Game" (cyan), "Review" (green), "Close" (gray) all same size.
36. **No "Back to Menu" option** — Must manually click nav to change game mode after game ends.
37. **Review analysis runs in-place** — No dedicated analysis screen; spinner in sidebar while board stays visible.

### Puzzles
38. **Auto-advance not clearly signaled** — No "Next puzzle in X seconds..." countdown during auto-advance.
39. **Hint penalty not pre-warned** — Warning about rating reduction only shows AFTER clicking Hint, in small 0.72rem text.
40. **Error messages too vague** — "No puzzles available" and "Invalid puzzle data" with no actionable guidance.

### Analysis Board
41. **Import tabs lack descriptions** — PGN/Chess.com/Lichess/Setup tabs have no explanatory text.
42. **Eval bar score unreadable** — Rotated 90 degrees, 0.5rem font, nearly invisible on 20px bar.
43. **No indicator board is disabled during review** — Clicking board does nothing silently.
44. **Nav buttons use cryptic Unicode** — |<, <, >, >| with no text labels.
45. **"Review Game" button unclear** — Refresh icon doesn't convey "analyze moves for accuracy".
46. **Board Editor missing instructions** — Select-piece-then-click workflow not explained.
47. **PGN parse errors lack guidance** — "Could not parse PGN" with no format example.

### Online Features
48. **Spectate: no loading state on "Watch" click** — No spinner while fetching room data.
49. **Friends: outgoing requests show no player info** — "?" avatar and "Pending..." with no target username.
50. **Friends: search spinner not labeled** — "?" character with no aria-label for accessibility.
51. **Tournaments: "Open" status ambiguous** — Users confuse "Open" (registration) with "Live" (playing).
52. **Tournaments: Swiss vs Arena not explained** — Format picker with no descriptions.
53. **Tournaments: dates lack timezone** — "Dec 5, 12:00" without timezone context.
54. **Chat overlaps game on mobile** — Fixed position conflicts with bottom nav and notch safe areas.
55. **Chat: no message delivery status** — No sent/failed indicators per message.
56. **Clubs: submit button not disabled during save** — Can spam Create Club button.

### Mobile
57. **Analysis panel not hidden on mobile** — Board and panel compete for 375px width.
58. **OnlineLobby has no mobile layout** — 3-column time grid cramped at 375px.
59. **Modal buttons don't stack on mobile** — Side-by-side buttons overflow or wrap awkwardly.
60. **Nav touch targets too small** — Items ~28px vertical, below 44px minimum.
61. **Font sizes below 11px** — Nav labels at 0.55rem (~8.25px), board labels at 0.6rem (~9px).
62. **Chat panel doesn't account for safe areas** — Overlaps notch/nav on iPhones.

---

## MINOR ISSUES

### Navigation
63. Icons collapse to no labels on tablet, no tooltips on hover.
64. Friends badge is the only nav badge; Tournaments/Clubs have none.
65. Account tabs lack icons (Ratings, Profile, Appearance, Games).
66. Tabs 0 and 3 both show HomeScreen — redundant nav items.
67. Nav scrollable on small desktop windows with no scroll affordance.
68. Logout button de-emphasized, no other account actions nearby.
69. Online Lobby doesn't show auth status or rating.

### Settings
70. "Reset to Default" only resets colors, not gameplay preferences.
71. PGN import/export locked to LeftSidebar (unavailable online).
72. "Flip Board" not persisted across sessions.
73. No indication which settings are persistent vs ephemeral.

### Game Setup
74. Time control lists differ between Quick Play (6 options) and Online Lobby (5 options).
75. "Custom" button looks same as preset buttons — not visually distinct.
76. Quick Play CTA always defaults to 5+0 regardless of user preference.
77. "Untimed" in Online Lobby disabled with misleading tooltip.
78. Tab 3 computer flow feels janky — modal on Tab 0, game on Tab 3.

### During Game
79. Timer active state too subtle — only slight color intensity change.
80. Captured pieces at 13px are barely distinguishable.
81. Last move highlighting conflicts with selected square colors.
82. No drop-zone feedback during drag-and-drop.
83. Game Over modal buttons lack clear priority hierarchy.
84. No "Waiting for opponent..." message after 15+ seconds.
85. No keyboard shortcuts for resign/undo/flip/hint.

### Post-Game
86. Rating changes only shown for online games — no "Unrated Game" label for local.
87. Game over message says "Black wins" not "You won" — no personalization.
88. No rating badge/category context in game over modal.
89. Resign/timeout not visually distinguished from checkmate.
90. "New Game" reuses same settings with no option to change mode.
91. Bot personality message looks like game analysis feedback.

### Puzzles
92. Mode switch instantly resets everything — no confirmation prompt.
93. Rush/Streak setup text doesn't explain difficulty curve numbers.
94. "New Best!" animation timing/persistence unclear.
95. Hint highlights both squares equally — no from->to visual hierarchy.
96. Loading state shows no time estimate or progress.
97. Panel too narrow for desktop (340px for 1920px screens).

### Analysis Board
98. Eval graph clickable but no cursor/tooltip indicates this.
99. Engine "D2" badge unexplained — jargon for new users.
100. Tablebase results appear/disappear without explanation.
101. Opening Explorer not labeled as position-specific.
102. Castling rights UI uses cryptic K/Q/k/q notation.
103. FEN display has no copy button.
104. Review progress shows "5/20" with no label.
105. "Analyse" vs "Review" terminology used interchangeably.
106. Game list cards not clearly clickable.
107. Keyboard navigation (arrow keys) undocumented.
108. Accuracy percentage unexplained.

### Online Features
109. OnlineLobby: room code not obviously copyable.
110. Matchmaking expansion messages lack action items.
111. Spectate: empty state doesn't suggest what to do.
112. Spectate: spectator count has no freshness indicator.
113. Spectate: long player names can overflow status area.
114. Leaderboard: provisional "?" badge requires hover (no mobile support).
115. Leaderboard: "Peak" column header too terse.
116. Leaderboard: loading shows generic "Loading..." not category name.
117. Clubs: description truncates without expand affordance.
118. Clubs: private badge placement too subtle.
119. Clubs: member list lacks join date.
120. Friends: notification banner not dismissible.
121. Friends: search empty state not helpful.
122. Tournaments: form validation doesn't highlight specific fields.
123. Tournaments: date format inconsistent.
124. Chat: fixed height with no scrollback affordance.
125. Chat: empty state doesn't show opponent status.

### Mobile
126. No specific 375px breakpoint — jumps from 540px to 700px.
127. Eval bar collapses to 12px at mobile — barely visible.
128. Classification table labels at 0.58rem — unreadable.
129. Home time control buttons lack `min-height: 44px`.

### Consistency
130. 30+ instances of hardcoded `#ccffff` instead of `var(--color-accent)`.
131. Error message colors: #ff9999 vs #e05555 for same meaning.
132. Input focus states vary: 0.25-0.5 opacity across components.
133. Button font sizes range 0.85rem-1rem for same hierarchy level.
134. Button row gaps: 6px vs 8px inconsistently.
135. Border-radius: 5px-14px with no clear tier system.
136. Loading indicators: CSS spinners, emoji, text — 4+ patterns.
137. Confirm/Accept colors: cyan vs green for same semantic meaning.
138. Close button terminology: "Close" vs "Cancel" vs "X" — no distinction.

---

## Cross-Cutting Patterns

1. **Empty states are unhelpful everywhere** — Spectate, Friends, Tournaments all show passive messages with no guidance.
2. **Loading states are missing or generic** — No feature-specific loading text, no spinners in many places.
3. **Accessibility gaps** — Tooltips-only info (no mobile support), missing aria-labels, color-only indicators.
4. **Settings are fragmented** — Split across LeftSidebar (in-game), Account > Appearance (logged-in), with no centralized Settings page.
5. **Mobile is under-served** — No 375px breakpoint, touch targets too small, sidebars not hidden, modals overflow.
6. **No design token system** — Colors, spacing, border-radius, font-sizes all hardcoded per-component.

---

## Priority Fix Recommendations

### Immediate (fixes broken UX)
- [ ] Add resign confirmation dialog
- [ ] Show "Untimed" label for untimed games
- [ ] Fix modal overflow on mobile (min-width, padding)
- [ ] Add 375px board size breakpoint
- [ ] Enforce 44px min touch targets

### Short-term (improves clarity)
- [ ] Create dedicated Settings page
- [ ] Persist gameplay preferences (showLabels, etc.) to localStorage
- [ ] Add "Back to Menu" in post-game modal
- [ ] Explain puzzle modes with tooltips/descriptions
- [ ] Add loading spinners to all async operations
- [ ] Hide sidebars on mobile (<700px)

### Medium-term (design system)
- [ ] Create CSS custom properties for all colors, spacing, border-radius
- [ ] Standardize button sizes/styles across components
- [ ] Unify loading indicator component
- [ ] Standardize close/cancel button style and terminology
- [ ] Add breadcrumbs/back navigation to feature pages

### Long-term (feature gaps)
- [ ] Add time control picker for vs Computer
- [ ] Add "opponent thinking" indicator for online play
- [ ] Add keyboard shortcuts for game controls
- [ ] Add per-message delivery status in chat
- [ ] Group nav items by category
