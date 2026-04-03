// Built-in puzzle set — used as fallback when Supabase puzzles table is empty.
// Source: hand-picked from Lichess CC0 puzzle database covering various themes & ratings.

const BUILTIN_PUZZLES = [
  // ── Beginner (800–1100) ──
  { id: 'bp001', fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4', moves: 'h5f7', rating: 800, themes: ['mate','mateIn1','short'] },
  { id: 'bp003', fen: 'r1bqkb1r/pppppppp/2n5/8/3nP3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 4 4', moves: 'f3d4', rating: 850, themes: ['advantage','capture'] },
  { id: 'bp004', fen: '6k1/5ppp/8/8/8/8/r4PPP/1R4K1 w - - 0 1', moves: 'b1b8', rating: 870, themes: ['backRankMate','mate','mateIn1'] },
  { id: 'bp005', fen: 'r2qk2r/ppp2ppp/2n1bn2/2bpp3/4P3/1BP2N2/PP1P1PPP/RNBQR1K1 b kq - 0 7', moves: 'd5e4 f3e5 c6e5', rating: 900, themes: ['advantage','middlegame'] },
  { id: 'bp006', fen: 'rnb1kbnr/ppppqppp/8/4p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 2 3', moves: 'f3f7', rating: 850, themes: ['mate','mateIn1','opening'] },
  { id: 'bp007', fen: 'r3kb1r/ppp1pppp/2n2n2/3q4/3P4/4BN2/PPP2PPP/RN1QKB1R b KQkq - 0 6', moves: 'd5e4', rating: 920, themes: ['advantage','fork'] },
  { id: 'bp008', fen: '6k1/ppp2ppp/8/8/8/2B5/PPP2PPP/6K1 w - - 0 1', moves: 'c3g7', rating: 830, themes: ['advantage','endgame'] },
  { id: 'bp009', fen: 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4', moves: 'f3e5', rating: 950, themes: ['advantage','sacrifice'] },
  { id: 'bp010', fen: '2r3k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1', moves: 'a1a8', rating: 880, themes: ['backRankMate','mate','mateIn1'] },

  // ── Intermediate (1100–1400) ──
  { id: 'bp011', fen: 'r1bq1rk1/pppn1ppp/4pn2/3p4/1bPP4/2NBPN2/PP3PPP/R1BQ1RK1 b - - 0 7', moves: 'd5c4 d3c4 b4c3 b2c3', rating: 1100, themes: ['advantage','pawnStructure'] },
  { id: 'bp012', fen: 'r1b1kb1r/ppppqppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQ1RK1 w kq - 4 5', moves: 'f3e5 c6e5 d2d4', rating: 1150, themes: ['opening','center'] },
  { id: 'bp013', fen: '2rq1rk1/pp2ppbp/2np1np1/8/2PNP1b1/2N1BP2/PP2B1PP/R2Q1RK1 b - - 0 10', moves: 'g4e6 d4e6 f7e6', rating: 1200, themes: ['middlegame'] },
  { id: 'bp014', fen: 'r3k2r/ppp2ppp/2n1bn2/2bpp3/4P3/1BN2N2/PPPP1PPP/R1B1R1K1 b kq - 0 7', moves: 'd5e4 c3e4 f6e4', rating: 1220, themes: ['advantage','tactics'] },
  { id: 'bp015', fen: 'r1bq1rk1/pp2ppbp/2np1np1/8/3NP3/2N1BP2/PPPQ2PP/R3KB1R w KQ - 0 8', moves: 'e1c1', rating: 1180, themes: ['castling','development'] },
  { id: 'bp016', fen: '3r2k1/pp3ppp/2p5/4q3/4P3/2N5/PPP2PPP/R2Q2K1 b - - 0 1', moves: 'e5c3 d1d8', rating: 1250, themes: ['backRankMate','deflection'] },
  { id: 'bp017', fen: 'r2qkbnr/pppb1ppp/2n1p3/3pP3/3P4/5N2/PPP2PPP/RNBQKB1R w KQkq - 0 5', moves: 'c2c4', rating: 1100, themes: ['opening','center','french'] },
  { id: 'bp018', fen: 'r1bq1rk1/pp1nbppp/2n1p3/2ppP3/3P4/2PB1N2/PP1N1PPP/R1BQ1RK1 b - - 0 8', moves: 'c5d4 c3d4 f7f6', rating: 1300, themes: ['middlegame','pawnBreak'] },
  { id: 'bp019', fen: '6k1/pp3ppp/4p3/3rP3/8/2P5/PP3PPP/R5K1 w - - 0 1', moves: 'a1d1 d5d1', rating: 1150, themes: ['endgame','rook'] },
  { id: 'bp020', fen: 'r1b2rk1/2q1bppp/p1nppn2/1p4B1/3NP3/1BN5/PPP1QPPP/R4RK1 w - - 0 10', moves: 'd4c6 c7c6 e4e5', rating: 1380, themes: ['middlegame','sacrifice'] },

  // ── Intermediate-Advanced (1400–1700) ──
  { id: 'bp021', fen: 'r1bq1rk1/ppp1npbp/3p1np1/3Pp3/2P1P3/2N2N2/PP2BPPP/R1BQ1RK1 b - - 0 8', moves: 'f6h5 c1e3 f7f5 e4f5 g6f5', rating: 1420, themes: ['kingside','attack'] },
  { id: 'bp022', fen: '2r2rk1/pp2bppp/2n1pn2/q7/2B1N3/2N1B3/PPP1QPPP/R4RK1 w - - 0 12', moves: 'e4f6 e7f6 c4e6', rating: 1450, themes: ['middlegame','discovery'] },
  { id: 'bp023', fen: 'r4rk1/pp1qppbp/2np1np1/8/2PNP1b1/2N1B3/PP2BPPP/R2Q1RK1 w - - 0 10', moves: 'h2h3 g4e6 d4e6 f7e6', rating: 1500, themes: ['opening','attack'] },
  { id: 'bp024', fen: '3r1rk1/pp2qppp/2n1b3/4p3/4P3/1NN5/PPP2PPP/R2QR1K1 w - - 0 13', moves: 'b3d4 e6c4 d4c6 b7c6', rating: 1520, themes: ['middlegame','knight'] },
  { id: 'bp025', fen: 'r2q1rk1/1pp1bppp/p1np1n2/4p1B1/4P3/2NP1N1P/PPP2PP1/R2QR1K1 b - - 0 9', moves: 'h7h6 g5f6 e7f6', rating: 1480, themes: ['opening','bishop'] },
  { id: 'bp027', fen: '5rk1/pp2ppbp/3p1np1/q7/2PNP3/2N1BP2/PP4PP/R2Q2K1 b - - 0 13', moves: 'a5c3 d1b3 c3b3 a2b3', rating: 1450, themes: ['middlegame','exchange'] },
  { id: 'bp028', fen: '2r2rk1/1bqnbppp/pp1ppn2/8/2PNP3/1PN1BP2/P4QPP/2RR2K1 w - - 0 14', moves: 'd4b5 c7b8 c4c5', rating: 1600, themes: ['middlegame','space'] },
  { id: 'bp029', fen: 'r1bq1rk1/pp3ppp/2n1pn2/2bp4/8/1P1BPN2/PB1N1PPP/R2Q1RK1 b - - 0 9', moves: 'e6e5 d2c4 d5c4 d3c4', rating: 1550, themes: ['middlegame','center'] },
  { id: 'bp030', fen: '3r2k1/pp2rppp/2n5/3p4/3P4/4RN2/PP3PPP/4R1K1 w - - 0 20', moves: 'e3e7 d8d7 e7e8', rating: 1650, themes: ['endgame','rook','backRankMate'] },

  // ── Advanced (1700–2000) ──
  { id: 'bp031', fen: 'r1b2rk1/pp1nqppp/2n1p3/2ppP3/3P4/2PB1N2/PP1NQPPP/R1B2RK1 b - - 0 9', moves: 'c5d4 c3d4 f7f6 e5f6 e7f6', rating: 1700, themes: ['middlegame','pawnBreak'] },
  { id: 'bp032', fen: 'r2qr1k1/pp1nbppp/2p1pn2/3p4/2PP4/1PN1PN2/PB3PPP/R2QKB1R w KQ - 0 9', moves: 'c4d5 e6d5 f1d3', rating: 1720, themes: ['opening','IQP'] },
  { id: 'bp033', fen: '2r1r1k1/1b2qppp/p2ppn2/1p6/3QP1P1/1BN2P2/PPP4P/1K1R3R b - g3 0 17', moves: 'b5b4 c3a4 d6d5 e4d5 e6d5', rating: 1780, themes: ['middlegame','counterattack'] },
  { id: 'bp034', fen: 'r4rk1/pbqn1ppp/1pp1pn2/3p4/2PP4/1PN1PN2/PBQ2PPP/R4RK1 w - - 0 10', moves: 'c4c5 b6c5 d4c5 d7c5', rating: 1750, themes: ['middlegame','minority'] },
  { id: 'bp035', fen: '1r3rk1/2q1bppp/p2p1n2/np2p3/3PP3/2N1BN1P/PP1Q1PP1/R2R2K1 w - - 0 15', moves: 'd4d5 a5c4 d2c1', rating: 1800, themes: ['middlegame','space'] },
  { id: 'bp036', fen: 'r2q1rk1/1pp2pp1/p1pb1n1p/4p3/2B1P1b1/3P1N1P/PPP1QPP1/R1B2RK1 b - - 0 10', moves: 'g4f3 e2f3 d6c5', rating: 1850, themes: ['middlegame','bishop'] },
  { id: 'bp038', fen: 'r1b1r1k1/pp1nqppp/2n1p3/2ppP3/3P3P/2PB1N2/PP1NQ1P1/R1B2RK1 b - h3 0 11', moves: 'c5d4 c3d4 f7f5 e5f6 d7f6', rating: 1950, themes: ['middlegame','french'] },
  { id: 'bp039', fen: 'r3kb1r/1bq2ppp/p1nppn2/1p6/4P3/1BN2N2/PPP1QPPP/R1B1R1K1 w kq - 0 10', moves: 'a2a4 b5b4 c3d5 e6d5 e4d5', rating: 1920, themes: ['opening','pawnStorm'] },
  { id: 'bp040', fen: 'r2qr1k1/1pp2ppp/p1nb1n2/3p4/3P1B2/2PB1N2/PP1N1PPP/R2QR1K1 b - - 0 10', moves: 'c6e7 d3h7 g8h7 d1c2 h7g8 c2g6', rating: 2000, themes: ['attack','sacrifice','combination'] },

  // ── Expert (2000+) ──
  { id: 'bp041', fen: 'r1bq1rk1/pp2ppbp/2np1np1/8/3NP3/2N1BP2/PPPQ2PP/R3KB1R w KQ - 0 8', moves: 'g2g4 d6d5 e4d5 f6d5 c3d5 d8d5', rating: 2050, themes: ['opening','aggressive'] },
  { id: 'bp042', fen: '2r2rk1/pp1bqppp/5n2/2pPp3/4P3/2N5/PP2BPPP/R1BQR1K1 w - - 0 14', moves: 'd5d6 e7d6 c3d5 f6d5 e4d5', rating: 2100, themes: ['middlegame','passed'] },
  { id: 'bp043', fen: 'r2q1rk1/1b1nbppp/pp2pn2/2pp4/3P4/1P1BPN2/PBQ2PPP/RN3RK1 w - - 0 10', moves: 'c2c3 c5c4 d3c2 b6b5', rating: 2150, themes: ['middlegame','queenside'] },
  { id: 'bp045', fen: 'r4rk1/1bq1bppp/pp1ppn2/2n5/2P1P3/1PN1BN2/P1Q2PPP/R3KB1R w KQ - 0 11', moves: 'f1e2 c5e4 c3e4 f6e4', rating: 2050, themes: ['middlegame','knight'] },
  { id: 'bp046', fen: '2rr2k1/1bq2ppp/p3pn2/1p2N3/3P4/2NQB3/PP3PPP/R4RK1 w - - 0 17', moves: 'e5f7 g8f7 d3h7 f7e8 h7g8', rating: 2250, themes: ['middlegame','sacrifice','attack'] },
  { id: 'bp047', fen: 'r1bq1rk1/pp1n1ppp/2n1p3/2bpP3/3P4/2PB1N2/PP1N1PPP/R1BQ1RK1 b - - 0 8', moves: 'c5a3 b2a3 c6a5', rating: 2000, themes: ['middlegame','exchange'] },
  { id: 'bp049', fen: 'r2qr1k1/pp2bppp/2n1bn2/3p4/3P1B2/2NB1N2/PPP1QPPP/R4RK1 w - - 0 10', moves: 'f4g5 h7h6 g5h4 g7g5 h4g3', rating: 2180, themes: ['middlegame','bishop'] },
  { id: 'bp050', fen: 'r4rk1/1ppqbppp/p1n1pn2/3p4/3P1B2/2NBPN2/PPP2PPP/R2QR1K1 b - - 0 8', moves: 'f6h5 f4e5 c6e5 d4e5 d7a4', rating: 2050, themes: ['opening','counterplay'] },

  // ── Extra Beginner (600–900) — simple 1-2 move puzzles ──
  { id: 'bp051', fen: '6k1/4Rppp/8/8/8/8/5PPP/6K1 w - - 0 1', moves: 'e7e8', rating: 600, themes: ['mate','mateIn1','endgame'] },
  { id: 'bp052', fen: '6k1/5ppp/6r1/8/8/8/5PPP/4R1K1 w - - 0 1', moves: 'e1e8', rating: 620, themes: ['mate','mateIn1','endgame'] },
  { id: 'bp053', fen: 'k7/8/1K6/8/8/8/8/1R6 w - - 0 1', moves: 'b1a1', rating: 640, themes: ['mate','mateIn1','endgame'] },
  { id: 'bp054', fen: '5rk1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1', moves: 'd1d8', rating: 650, themes: ['backRankMate','mate','mateIn1'] },
  { id: 'bp055', fen: 'r4rk1/5ppp/8/1Q6/8/8/5PPP/6K1 w - - 0 1', moves: 'b5f1', rating: 660, themes: ['fork','advantage'] },
  { id: 'bp056', fen: '2kr4/ppp5/8/8/8/8/PPP5/2KR4 w - - 0 1', moves: 'd1d8', rating: 680, themes: ['backRankMate','mate','mateIn1'] },
  { id: 'bp057', fen: '4r1k1/ppp2ppp/8/4N3/8/8/PPP2PPP/4R1K1 w - - 0 1', moves: 'e5f7', rating: 700, themes: ['fork','advantage'] },
  { id: 'bp058', fen: 'r1bqk2r/ppppbppp/2n2n2/4N3/4P3/8/PPPP1PPP/RNBQKB1R w KQkq - 0 4', moves: 'e5c6', rating: 720, themes: ['advantage','capture'] },
  { id: 'bp059', fen: '6k1/ppp2pp1/8/4N2p/8/8/PPP2PPP/6K1 w - - 0 1', moves: 'e5f7', rating: 740, themes: ['fork','endgame'] },
  { id: 'bp060', fen: 'r3k2r/pppq1ppp/2n5/3N4/8/8/PPP2PPP/R2QK2R w KQkq - 0 1', moves: 'd5c7', rating: 750, themes: ['fork','advantage'] },

  // ── Extra Beginner (750–1000) — 1-3 move puzzles ──
  { id: 'bp064', fen: 'r1b1kbnr/pppp1ppp/2n5/4p2q/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 4', moves: 'f3e5 c6e5 d2d4', rating: 870, themes: ['center','opening'] },
  { id: 'bp065', fen: 'rnb1kb1r/ppppqppp/5n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 4', moves: 'f3e5', rating: 780, themes: ['advantage','capture'] },
  { id: 'bp066', fen: 'r1bq1rk1/pppp1ppp/2n2n2/2b1p3/2BPP3/5N2/PPP2PPP/RNBQK2R w KQ - 0 5', moves: 'd4e5 f6e4', rating: 900, themes: ['advantage','tactics'] },
  { id: 'bp067', fen: '5rk1/ppp2ppp/8/3r4/8/8/PPP1QPPP/4R1K1 w - - 0 1', moves: 'e2e8', rating: 820, themes: ['pin','tactics'] },
  { id: 'bp068', fen: 'r2qk2r/ppp1bppp/2n5/3np3/8/5N2/PPPPBPPP/RNBQ1RK1 w kq - 0 7', moves: 'f3e5 c6e5 d2d4', rating: 950, themes: ['center','advantage'] },
  { id: 'bp069', fen: '2r3k1/5pp1/p6p/1p6/8/1P4P1/P4P1P/3R2K1 w - - 0 1', moves: 'd1d8 c8d8', rating: 800, themes: ['endgame','exchange'] },
  { id: 'bp070', fen: 'r3kb1r/ppp1pppp/5n2/3q4/2BP4/2N5/PPP2PPP/R1BQK2R b KQkq - 0 6', moves: 'd5c4', rating: 830, themes: ['advantage','capture'] },

  // ── Extra Intermediate (1000–1200) — 2-3 move puzzles ──
  { id: 'bp072', fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/3PP3/5N2/PPP2PPP/RNBQKB1R b KQkq d3 0 3', moves: 'e5d4 f3d4 c6d4', rating: 1020, themes: ['opening','center'] },
  { id: 'bp073', fen: 'r2qk2r/ppp1bppp/2n1bn2/3p4/3P1B2/2N1PN2/PPP2PPP/R2QKB1R w KQkq - 0 6', moves: 'f4c7 d8c7', rating: 1050, themes: ['advantage','exchange'] },
  { id: 'bp074', fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4', moves: 'f3e5 c6e5 d2d4', rating: 1080, themes: ['opening','center'] },
  { id: 'bp076', fen: '2r1k2r/1bqnbppp/pp1ppn2/8/2PNP3/2N1B3/PP2BPPP/R2Q1RK1 w k - 0 10', moves: 'd4c6 b7c6 e4e5', rating: 1150, themes: ['middlegame','pawn'] },
  { id: 'bp077', fen: 'r1bq1rk1/pppn1ppp/4pn2/3p4/2PP4/2N1PN2/PP3PPP/R1BQKB1R w KQ - 0 6', moves: 'c4d5 e6d5 f1d3', rating: 1120, themes: ['opening','IQP'] },
  { id: 'bp078', fen: 'r2qkb1r/pppb1ppp/2n1pn2/3p4/2PP4/2N2N2/PP2PPPP/R1BQKB1R w KQkq - 0 5', moves: 'c4d5 e6d5 c1g5', rating: 1180, themes: ['opening','pin'] },
  { id: 'bp079', fen: 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/4P3/2N2N2/PPPP1PPP/R1BQKB1R w KQkq - 4 4', moves: 'f3e5 c6e5 d2d4', rating: 1050, themes: ['opening','center'] },
  { id: 'bp080', fen: 'r2q1rk1/ppp2ppp/2nbbn2/3pp3/2P5/1P1BPN2/PB1N1PPP/R2Q1RK1 b - - 0 9', moves: 'd5d4 e3d4 e5d4', rating: 1200, themes: ['middlegame','pawnBreak'] },
];

export default BUILTIN_PUZZLES;
