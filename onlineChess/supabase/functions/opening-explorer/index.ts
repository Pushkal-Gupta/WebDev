/**
 * Proxy for the Lichess Opening Explorer API.
 * Handles cases where the direct explorer.lichess.ovh endpoint
 * requires authentication or is blocked from certain origins.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LICHESS_BASE = "https://explorer.lichess.ovh";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const db = url.searchParams.get("db") || "lichess";
    const fen = url.searchParams.get("fen");

    if (!fen) {
      return new Response(JSON.stringify({ error: "Missing fen parameter" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const endpoint = db === "masters" ? "masters" : "lichess";
    const params = new URLSearchParams({ fen });

    if (db === "lichess") {
      params.set("speeds", url.searchParams.get("speeds") || "blitz,rapid,classical");
      params.set("ratings", url.searchParams.get("ratings") || "1600,1800,2000,2200,2500");
    }

    const lichessUrl = `${LICHESS_BASE}/${endpoint}?${params}`;

    const headers: Record<string, string> = {
      "Accept": "application/json",
      "User-Agent": "PGChess/1.0 (chess platform)",
    };
    const lichessToken = Deno.env.get("LICHESS_API_TOKEN");
    if (lichessToken) {
      headers["Authorization"] = `Bearer ${lichessToken}`;
    }

    const res = await fetch(lichessUrl, {
      headers,
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      // If Lichess returns 401/403, return empty explorer data
      if (res.status === 401 || res.status === 403) {
        return new Response(JSON.stringify({
          white: 0, draws: 0, black: 0,
          moves: [], topGames: [], opening: null,
          _error: "Explorer API requires authentication",
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: `Lichess returned ${res.status}` }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await res.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    console.error("opening-explorer proxy error:", err);
    return new Response(JSON.stringify({ error: "Proxy error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
