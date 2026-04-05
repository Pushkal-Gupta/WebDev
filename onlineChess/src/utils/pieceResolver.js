/**
 * Piece image URL resolver — maps (pieceType, color, pieceSet) to the correct URL
 * across local, chess.com, and lichess naming conventions.
 */
import { useCallback } from 'react';
import useThemeStore from '../store/themeStore';
import { getPieceSetById } from '../data/assetRegistry';

const PIECE_NAMES = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' };
const LOCAL_FALLBACK_PATH = 'pieces/';

/**
 * Resolve a piece image URL for any source.
 * @param {'p'|'n'|'b'|'r'|'q'|'k'} pieceType - chess.js piece type
 * @param {'w'|'b'} color - chess.js color
 * @param {object} pieceSet - piece set config from PIECE_SETS
 * @returns {string} full URL/path to the piece image
 */
export function resolvePieceUrl(pieceType, color, pieceSet) {
  if (!pieceSet) return fallbackUrl(pieceType, color);

  switch (pieceSet.source) {
    case 'local':
      return `./images/${pieceSet.path}${PIECE_NAMES[pieceType]}-${color === 'w' ? 'white' : 'black'}.png`;
    case 'chesscom':
      return `https://images.chesscomfiles.com/chess-themes/pieces/${pieceSet.slug}/150/${color}${pieceType}.png`;
    case 'lichess':
      return `https://lichess1.org/assets/piece/${pieceSet.slug}/${color === 'w' ? 'w' : 'b'}${pieceType.toUpperCase()}.svg`;
    default:
      return fallbackUrl(pieceType, color);
  }
}

function fallbackUrl(pieceType, color) {
  return `./images/${LOCAL_FALLBACK_PATH}${PIECE_NAMES[pieceType]}-${color === 'w' ? 'white' : 'black'}.png`;
}

/**
 * Get the preview URL for a piece set (white queen).
 */
export function getPieceSetPreviewUrl(pieceSet) {
  return resolvePieceUrl('q', 'w', pieceSet);
}

/**
 * React hook that returns a bound resolver for the current piece set.
 * Usage: const resolve = usePieceResolver();
 *        <img src={resolve('k', 'w')} />
 */
export function usePieceResolver() {
  const pieceSetId = useThemeStore(s => s.pieceSetId);
  const pieceSet = getPieceSetById(pieceSetId);
  return useCallback((type, color) => resolvePieceUrl(type, color, pieceSet), [pieceSet]);
}

/**
 * Get the fallback src for onError handlers.
 */
export function getFallbackUrl(pieceType, color) {
  return fallbackUrl(pieceType, color);
}
