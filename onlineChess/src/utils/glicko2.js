/**
 * Glicko-2 Rating System
 * Based on Mark Glickman's algorithm: http://www.glicko.net/glicko/glicko2.pdf
 *
 * Usage (single-game period):
 *   computeNewRating({ rating, rd, volatility, opponentRating, opponentRd, score })
 *   score: 1 = win, 0.5 = draw, 0 = loss
 */

const SCALE = 173.7178;  // Glicko-2 scale constant

function toInternal(rating, rd) {
  return { mu: (rating - 1500) / SCALE, phi: rd / SCALE };
}

function toExternal(mu, phi) {
  return {
    rating: Math.round(SCALE * mu + 1500),
    rd: Math.max(Math.round(SCALE * phi), 45), // floor RD at 45 per spec
  };
}

// g(φ): reduces the impact of opponents with high rating deviation
function g(phi) {
  return 1 / Math.sqrt(1 + (3 * phi * phi) / (Math.PI * Math.PI));
}

// E(μ, μj, φj): expected score
function expected(mu, mu_j, phi_j) {
  return 1 / (1 + Math.exp(-g(phi_j) * (mu - mu_j)));
}

// Step 5: Illinois algorithm to find new volatility σ'
function updateVolatility(phi, sigma, delta, v, tau = 0.5) {
  const a = Math.log(sigma * sigma);
  const eps = 1e-6;

  const f = (x) => {
    const ex = Math.exp(x);
    const phi2 = phi * phi;
    const d2 = delta * delta;
    const num = ex * (d2 - phi2 - v - ex);
    const den = 2 * Math.pow(phi2 + v + ex, 2);
    return num / den - (x - a) / (tau * tau);
  };

  let A = a;
  let B;
  if (delta * delta > phi * phi + v) {
    B = Math.log(delta * delta - phi * phi - v);
  } else {
    let k = 1;
    while (f(a - k * tau) < 0) k++;
    B = a - k * tau;
  }

  let fA = f(A);
  let fB = f(B);

  for (let i = 0; i < 100 && Math.abs(B - A) > eps; i++) {
    const C = A + (A - B) * fA / (fB - fA);
    const fC = f(C);
    if (fC * fB <= 0) {
      A = B;
      fA = fB;
    } else {
      fA /= 2;
    }
    B = C;
    fB = fC;
  }

  return Math.exp(A / 2);
}

/**
 * Compute a player's new Glicko-2 rating after a single game.
 *
 * @param {object} params
 * @param {number} params.rating         Current rating (e.g. 1500)
 * @param {number} params.rd             Current rating deviation (e.g. 350)
 * @param {number} params.volatility     Current volatility (e.g. 0.06)
 * @param {number} params.opponentRating Opponent's rating
 * @param {number} params.opponentRd     Opponent's rating deviation
 * @param {number} params.score          Game score: 1=win, 0.5=draw, 0=loss
 * @param {number} [params.tau=0.5]      System constant (controls volatility change)
 * @returns {{ rating, rd, volatility, ratingChange }}
 */
export function computeNewRating({ rating, rd, volatility, opponentRating, opponentRd, score, tau = 0.5 }) {
  const { mu, phi } = toInternal(rating, rd);
  const { mu: mu_j, phi: phi_j } = toInternal(opponentRating, opponentRd);

  const g_j = g(phi_j);
  const E_j = expected(mu, mu_j, phi_j);

  // Step 3: compute v (estimated variance)
  const v = 1 / (g_j * g_j * E_j * (1 - E_j));

  // Step 4: compute delta (estimated improvement)
  const delta = v * g_j * (score - E_j);

  // Step 5: update volatility
  const newSigma = updateVolatility(phi, volatility, delta, v, tau);

  // Step 6: update phi* (pre-rating-period RD)
  const phi_star = Math.sqrt(phi * phi + newSigma * newSigma);

  // Step 7: update phi' and mu'
  const newPhi = 1 / Math.sqrt(1 / (phi_star * phi_star) + 1 / v);
  const newMu = mu + newPhi * newPhi * g_j * (score - E_j);

  const { rating: newRating, rd: newRd } = toExternal(newMu, newPhi);

  return {
    rating: newRating,
    rd: newRd,
    volatility: newSigma,
    ratingChange: newRating - rating,
  };
}
