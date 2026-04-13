import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── Glicko-2 implementation (ported from client-side glicko2.js) ─────────────

const SCALE = 173.7178;

function toInternal(rating: number, rd: number) {
  return { mu: (rating - 1500) / SCALE, phi: rd / SCALE };
}

function toExternal(mu: number, phi: number) {
  return {
    rating: Math.round(SCALE * mu + 1500),
    rd: Math.max(Math.round(SCALE * phi), 45),
  };
}

function g(phi: number) {
  return 1 / Math.sqrt(1 + (3 * phi * phi) / (Math.PI * Math.PI));
}

function expected(mu: number, mu_j: number, phi_j: number) {
  return 1 / (1 + Math.exp(-g(phi_j) * (mu - mu_j)));
}

function updateVolatility(phi: number, sigma: number, delta: number, v: number, tau = 0.5) {
  const a = Math.log(sigma * sigma);
  const eps = 1e-6;
  const f = (x: number) => {
    const ex = Math.exp(x);
    const phi2 = phi * phi;
    const d2 = delta * delta;
    const num = ex * (d2 - phi2 - v - ex);
    const den = 2 * Math.pow(phi2 + v + ex, 2);
    return num / den - (x - a) / (tau * tau);
  };
  let A = a;
  let B: number;
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
    if (fC * fB <= 0) { A = B; fA = fB; } else { fA /= 2; }
    B = C; fB = fC;
  }
  return Math.exp(A / 2);
}

function computeNewRating(params: {
  rating: number; rd: number; volatility: number;
  opponentRating: number; opponentRd: number;
  score: number; tau?: number;
}) {
  const { rating, rd, volatility, opponentRating, opponentRd, score, tau = 0.5 } = params;
  const { mu, phi } = toInternal(rating, rd);
  const { mu: mu_j, phi: phi_j } = toInternal(opponentRating, opponentRd);
  const g_j = g(phi_j);
  const E_j = expected(mu, mu_j, phi_j);
  const v = 1 / (g_j * g_j * E_j * (1 - E_j));
  const delta = v * g_j * (score - E_j);
  const newSigma = updateVolatility(phi, volatility, delta, v, tau);
  const phi_star = Math.sqrt(phi * phi + newSigma * newSigma);
  const newPhi = 1 / Math.sqrt(1 / (phi_star * phi_star) + 1 / v);
  const newMu = mu + newPhi * newPhi * g_j * (score - E_j);
  const { rating: newRating, rd: newRd } = toExternal(newMu, newPhi);
  return { rating: newRating, rd: newRd, volatility: newSigma, ratingChange: newRating - rating };
}

// ── Edge Function ────────────────────────────────────────────────────────────

interface RatingRequest {
  room_id: string;
  winner: "white" | "black" | "draw";
  reason: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify caller
    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: RatingRequest = await req.json();
    const { room_id, winner, reason } = body;

    // Fetch room
    const { data: room, error: roomErr } = await supabase
      .from("chess_rooms").select("*").eq("id", room_id).single();
    if (roomErr || !room) {
      return new Response(JSON.stringify({ error: "Room not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller is a participant
    const isHost = user.id === room.host_id;
    const isGuest = user.id === room.guest_id;
    if (!isHost && !isGuest) {
      return new Response(JSON.stringify({ error: "Not a participant" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Prevent double-rating: atomically claim the room by setting result
    // Only proceed if result is still null (first caller wins)
    const { data: claimData, error: claimErr } = await supabase
      .from("chess_rooms")
      .update({ result: { winner, reason }, status: "finished" })
      .eq("id", room_id)
      .is("result", null)
      .select("id");

    if (claimErr || !claimData?.length) {
      // Another request already set the result — skip rating update
      return new Response(JSON.stringify({ error: "Rating already updated", ok: false }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const hostColor = room.host_color || "white";
    const whiteUserId = hostColor === "white" ? room.host_id : room.guest_id;
    const blackUserId = hostColor === "black" ? room.host_id : room.guest_id;
    const whiteUsername = hostColor === "white" ? room.host_name : room.guest_name;
    const blackUsername = hostColor === "black" ? room.host_name : room.guest_name;

    // Determine category from time control
    const tc = room.time_control;
    const category = tc?.cat?.toLowerCase() || "blitz";

    // Fetch both players' ratings
    const { data: whiteRating } = await supabase
      .from("user_ratings").select("*")
      .eq("user_id", whiteUserId).eq("category", category).single();

    const { data: blackRating } = await supabase
      .from("user_ratings").select("*")
      .eq("user_id", blackUserId).eq("category", category).single();

    const wR = whiteRating || { rating: 1500, rd: 350, volatility: 0.06, games_played: 0, wins: 0, losses: 0, draws: 0, peak_rating: 1500 };
    const bR = blackRating || { rating: 1500, rd: 350, volatility: 0.06, games_played: 0, wins: 0, losses: 0, draws: 0, peak_rating: 1500 };

    // Compute scores
    const whiteScore = winner === "draw" ? 0.5 : winner === "white" ? 1 : 0;
    const blackScore = 1 - whiteScore;

    // Compute new ratings
    const newWhite = computeNewRating({
      rating: wR.rating, rd: wR.rd, volatility: wR.volatility,
      opponentRating: bR.rating, opponentRd: bR.rd, score: whiteScore,
    });

    const newBlack = computeNewRating({
      rating: bR.rating, rd: bR.rd, volatility: bR.volatility,
      opponentRating: wR.rating, opponentRd: wR.rd, score: blackScore,
    });

    // Update white's rating
    await supabase.from("user_ratings").upsert({
      user_id: whiteUserId,
      username: whiteUsername,
      category,
      rating: newWhite.rating,
      rd: newWhite.rd,
      volatility: newWhite.volatility,
      games_played: (wR.games_played || 0) + 1,
      wins: (wR.wins || 0) + (whiteScore === 1 ? 1 : 0),
      losses: (wR.losses || 0) + (whiteScore === 0 ? 1 : 0),
      draws: (wR.draws || 0) + (whiteScore === 0.5 ? 1 : 0),
      peak_rating: Math.max(wR.peak_rating || 1500, newWhite.rating),
      last_game_at: new Date().toISOString(),
    }, { onConflict: "user_id,category" });

    // Update black's rating
    await supabase.from("user_ratings").upsert({
      user_id: blackUserId,
      username: blackUsername,
      category,
      rating: newBlack.rating,
      rd: newBlack.rd,
      volatility: newBlack.volatility,
      games_played: (bR.games_played || 0) + 1,
      wins: (bR.wins || 0) + (blackScore === 1 ? 1 : 0),
      losses: (bR.losses || 0) + (blackScore === 0 ? 1 : 0),
      draws: (bR.draws || 0) + (blackScore === 0.5 ? 1 : 0),
      peak_rating: Math.max(bR.peak_rating || 1500, newBlack.rating),
      last_game_at: new Date().toISOString(),
    }, { onConflict: "user_id,category" });

    // Room already marked as rated in the atomic claim above

    return new Response(JSON.stringify({
      ok: true,
      white: { oldRating: wR.rating, newRating: newWhite.rating, change: newWhite.ratingChange },
      black: { oldRating: bR.rating, newRating: newBlack.rating, change: newBlack.ratingChange },
    }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("update-rating error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
