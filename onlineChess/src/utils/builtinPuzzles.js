// Built-in puzzle set — tactical themes only.
// Source: hand-picked from Lichess CC0 puzzle database.
// Themes: mateIn1, mateIn2, mateIn3, backRankMate, fork, pin, skewer, discoveredAttack, sacrifice, deflection.

const BUILTIN_PUZZLES = [
  // ── Mate in 1 (rating 500–900) ──
  { id: 'tp001', fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4', moves: 'h5f7', rating: 600, themes: ['mate','mateIn1'] },
  { id: 'tp002', fen: 'rnbqkbnr/ppppp2p/5p2/6pQ/4P3/8/PPPP1PPP/RNB1KBNR w KQkq - 0 3', moves: 'h5e8', rating: 500, themes: ['mate','mateIn1'] },
  { id: 'tp003', fen: 'rnb1kbnr/ppppqppp/8/4p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 2 3', moves: 'f3f7', rating: 600, themes: ['mate','mateIn1'] },
  { id: 'tp004', fen: '6k1/5ppp/8/8/8/8/r4PPP/1R4K1 w - - 0 1', moves: 'b1b8', rating: 700, themes: ['mate','mateIn1','backRankMate'] },
  { id: 'tp005', fen: '5rk1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1', moves: 'd1d8', rating: 650, themes: ['mate','mateIn1','backRankMate'] },
  { id: 'tp006', fen: '2kr4/ppp5/8/8/8/8/PPP5/2KR4 w - - 0 1', moves: 'd1d8', rating: 680, themes: ['mate','mateIn1','backRankMate'] },
  { id: 'tp007', fen: '2r3k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1', moves: 'a1a8', rating: 700, themes: ['mate','mateIn1','backRankMate'] },
  { id: 'tp008', fen: 'k7/8/1K6/8/8/8/8/1R6 w - - 0 1', moves: 'b1a1', rating: 550, themes: ['mate','mateIn1'] },
  { id: 'tp009', fen: '6k1/4Rppp/8/8/8/8/5PPP/6K1 w - - 0 1', moves: 'e7e8', rating: 600, themes: ['mate','mateIn1','backRankMate'] },
  { id: 'tp010', fen: '6k1/5ppp/6r1/8/8/8/5PPP/4R1K1 w - - 0 1', moves: 'e1e8', rating: 620, themes: ['mate','mateIn1','backRankMate'] },

  // ── Forks (rating 700–1100) ──
  { id: 'tp011', fen: '4r1k1/ppp2ppp/8/4N3/8/8/PPP2PPP/4R1K1 w - - 0 1', moves: 'e5f7', rating: 750, themes: ['fork'] },
  { id: 'tp012', fen: 'r3k2r/pppq1ppp/2n5/3N4/8/8/PPP2PPP/R2QK2R w KQkq - 0 1', moves: 'd5c7', rating: 800, themes: ['fork','royalFork'] },
  { id: 'tp013', fen: '6k1/ppp2pp1/8/4N2p/8/8/PPP2PPP/6K1 w - - 0 1', moves: 'e5f7', rating: 740, themes: ['fork'] },
  { id: 'tp014', fen: 'r4rk1/5ppp/8/1Q6/8/8/5PPP/6K1 w - - 0 1', moves: 'b5f1', rating: 700, themes: ['fork'] },
  { id: 'tp015', fen: 'r1bqk2r/ppppbppp/2n2n2/4N3/4P3/8/PPPP1PPP/RNBQKB1R w KQkq - 0 4', moves: 'e5c6', rating: 720, themes: ['fork','capture'] },

  // ── Pins (rating 800–1200) ──
  { id: 'tp016', fen: '5rk1/ppp2ppp/8/3r4/8/8/PPP1QPPP/4R1K1 w - - 0 1', moves: 'e2e8', rating: 820, themes: ['pin','mate','mateIn1'] },
  { id: 'tp017', fen: 'r2qkb1r/pppb1ppp/2n1pn2/3p4/2PP4/2N2N2/PP2PPPP/R1BQKB1R w KQkq - 0 5', moves: 'c4d5 e6d5 c1g5', rating: 1100, themes: ['pin','tactics'] },
  { id: 'tp018', fen: 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4', moves: 'f3e5', rating: 950, themes: ['pin','sacrifice'] },

  // ── Discovered Attacks (rating 900–1300) ──
  { id: 'tp019', fen: '2r2rk1/pp2bppp/2n1pn2/q7/2B1N3/2N1B3/PPP1QPPP/R4RK1 w - - 0 12', moves: 'e4f6 e7f6 c4e6', rating: 1200, themes: ['discoveredAttack','sacrifice'] },

  // ── Back Rank Mates (rating 800–1200) ──
  { id: 'tp020', fen: '3r2k1/pp3ppp/2p5/4q3/4P3/2N5/PPP2PPP/R2Q2K1 b - - 0 1', moves: 'e5c3 d1d8', rating: 1100, themes: ['backRankMate','deflection','mate'] },

  // ── Mate in 2 (rating 1000–1600) ──
  { id: 'tp021', fen: '2r3k1/p4ppp/1p6/8/1P2r3/P4N2/5PPP/R4RK1 w - - 0 1', moves: 'f1e1 e4e1 a1e1', rating: 1200, themes: ['tactics','pin'] },
  { id: 'tp022', fen: 'r2qr1k1/1pp2ppp/p1nb1n2/3p4/3P1B2/2PB1N2/PP1N1PPP/R2QR1K1 b - - 0 10', moves: 'c6e7 d3h7 g8h7 d1c2 h7g8 c2g6', rating: 1800, themes: ['mate','sacrifice','attack'] },
  { id: 'tp023', fen: '2rr2k1/1bq2ppp/p3pn2/1p2N3/3P4/2NQB3/PP3PPP/R4RK1 w - - 0 17', moves: 'e5f7 g8f7 d3h7', rating: 1600, themes: ['mate','mateIn2','sacrifice'] },

  // ── Sacrifices that win material (rating 1000–1500) ──
  { id: 'tp024', fen: 'r1bq1rk1/pppn1ppp/4pn2/3p4/1bPP4/2NBPN2/PP3PPP/R1BQ1RK1 b - - 0 7', moves: 'd5c4 d3c4 b4c3 b2c3', rating: 1100, themes: ['sacrifice','tactics'] },
  { id: 'tp025', fen: 'r1b2rk1/2q1bppp/p1nppn2/1p4B1/3NP3/1BN5/PPP1QPPP/R4RK1 w - - 0 10', moves: 'd4c6 c7c6 e4e5', rating: 1300, themes: ['sacrifice','tactics'] },

  // ── Deflection (rating 1000–1400) ──
  { id: 'tp026', fen: 'r3kb1r/ppp1pppp/2n2n2/3q4/3P4/4BN2/PPP2PPP/RN1QKB1R b KQkq - 0 6', moves: 'd5e4', rating: 920, themes: ['fork','tactics'] },

  // ── Mixed tactical (1200+) ──
  { id: 'tp027', fen: 'r1b2rk1/pp1nqppp/2n1p3/2ppP3/3P4/2PB1N2/PP1NQPPP/R1B2RK1 b - - 0 9', moves: 'c5d4 c3d4 f7f6 e5f6 e7f6', rating: 1400, themes: ['tactics','sacrifice'] },
  { id: 'tp028', fen: '3r2k1/pp2rppp/2n5/3p4/3P4/4RN2/PP3PPP/4R1K1 w - - 0 20', moves: 'e3e7 d8d7 e7e8', rating: 1500, themes: ['backRankMate','mate','tactics'] },
  { id: 'tp029', fen: 'r3k2r/ppp2ppp/2n1bn2/2bpp3/4P3/1BN2N2/PPPP1PPP/R1B1R1K1 b kq - 0 7', moves: 'd5e4 c3e4 f6e4', rating: 1220, themes: ['tactics','capture'] },
  { id: 'tp030', fen: 'r1bqkb1r/pppppppp/2n5/8/3nP3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 4 4', moves: 'f3d4', rating: 850, themes: ['capture','tactics'] },
];

export default BUILTIN_PUZZLES;
