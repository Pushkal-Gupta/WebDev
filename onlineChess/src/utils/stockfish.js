const STOCKFISH_URL = 'https://stockfishserver.onrender.com/best-move';
const MAX_RETRIES = 8;
const TIMEOUT_MS = 10000;

export async function getBestMove(fen) {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const response = await fetch(STOCKFISH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fen }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const data = await response.json();
      if (data && data.bestMove) {
        return data.bestMove;
      }
      throw new Error('No bestMove in response');
    } catch (err) {
      console.warn(`Stockfish attempt ${attempt + 1} failed:`, err.message);
      if (attempt === MAX_RETRIES - 1) {
        throw new Error(`Stockfish failed after ${MAX_RETRIES} attempts: ${err.message}`);
      }
      // Small delay before retry
      await new Promise((res) => setTimeout(res, 500));
    }
  }
}
