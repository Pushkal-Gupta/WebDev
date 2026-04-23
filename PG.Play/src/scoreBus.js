// Loose coupling: games dispatch score events; App listens and persists.
export const submitScore = (gameId, score, meta = {}) => {
  window.dispatchEvent(new CustomEvent('pgplay:score', {
    detail: { gameId, score, meta },
  }));
};
