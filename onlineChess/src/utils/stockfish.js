const STOCKFISH_URL = 'https://stockfishserver.onrender.com/best-move';

export async function getBestMove(fen, { timeoutMs = 10000, maxRetries = 8 } = {}) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

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
      if (attempt === maxRetries - 1) {
        throw new Error(`Stockfish failed after ${maxRetries} attempts: ${err.message}`);
      }
      // Small delay before retry
      await new Promise((res) => setTimeout(res, 500));
    }
  }
}
