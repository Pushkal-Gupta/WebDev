const GAME_SERVER = 'https://chessserver-w8ou.onrender.com/api';

export async function postGame(token, { color, opponent, timerData, pgnStr }) {
  try {
    const response = await fetch(`${GAME_SERVER}/postGame`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ color, opponent, timerData, pgnStr }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (err) {
    console.error('postGame error:', err);
    return null;
  }
}

export async function getGames(token) {
  try {
    const response = await fetch(`${GAME_SERVER}/getGames`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (err) {
    console.error('getGames error:', err);
    return [];
  }
}
