import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { Chess } from "https://esm.sh/chess.js@1.1.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MoveRequest {
  room_id: string;
  from: string; // e.g. "e2"
  to: string; // e.g. "e4"
  promotion?: string; // "q" | "r" | "b" | "n"
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Authenticate the caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Create a user-scoped client to get the caller's identity
    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: MoveRequest = await req.json();
    const { room_id, from, to, promotion } = body;

    if (!room_id || !from || !to) {
      return new Response(JSON.stringify({ error: "Missing room_id, from, or to" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch the current room state
    const { data: room, error: roomError } = await supabase
      .from("chess_rooms")
      .select("*")
      .eq("id", room_id)
      .single();

    if (roomError || !room) {
      return new Response(JSON.stringify({ error: "Room not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (room.status !== "playing") {
      return new Response(JSON.stringify({ error: "Game is not active" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the caller is a participant
    const isHost = user.id === room.host_id;
    const isGuest = user.id === room.guest_id;
    if (!isHost && !isGuest) {
      return new Response(JSON.stringify({ error: "Not a participant" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determine player's color
    const hostColor = room.host_color || "white";
    const playerColor = isHost ? hostColor : (hostColor === "white" ? "black" : "white");
    const playerTurnCode = playerColor === "white" ? "w" : "b";

    // Validate the move using chess.js
    const chess = new Chess(room.current_fen);

    // Check it's this player's turn
    if (chess.turn() !== playerTurnCode) {
      return new Response(JSON.stringify({ error: "Not your turn" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Attempt the move
    const moveObj: { from: string; to: string; promotion?: string } = { from, to };
    if (promotion) moveObj.promotion = promotion;

    const result = chess.move(moveObj);
    if (!result) {
      return new Response(JSON.stringify({ error: "Illegal move" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const newFen = chess.fen();
    const serverTimestamp = Date.now();

    // Determine game state
    let gameOver = false;
    let gameResult: { winner: string; reason: string } | null = null;

    if (chess.isCheckmate()) {
      const winner = chess.turn() === "w" ? "black" : "white";
      gameOver = true;
      gameResult = { winner, reason: "checkmate" };
    } else if (chess.isStalemate()) {
      gameOver = true;
      gameResult = { winner: "draw", reason: "stalemate" };
    } else if (chess.isDraw()) {
      gameOver = true;
      gameResult = { winner: "draw", reason: "draw" };
    }

    // Compute timing
    const tc = room.time_control;
    let whiteTimeMs = room.white_time_ms ?? tc?.total ?? 300_000;
    let blackTimeMs = room.black_time_ms ?? tc?.total ?? 300_000;
    const lastMoveAt = room.last_move_at ? new Date(room.last_move_at).getTime() : null;

    if (lastMoveAt && tc) {
      // Deduct elapsed time from the player who just moved
      const elapsed = serverTimestamp - lastMoveAt;
      if (playerTurnCode === "w") {
        whiteTimeMs = Math.max(0, whiteTimeMs - elapsed);
        // Fischer increment
        if (tc.incr) whiteTimeMs += tc.incr;
      } else {
        blackTimeMs = Math.max(0, blackTimeMs - elapsed);
        if (tc.incr) blackTimeMs += tc.incr;
      }
    }

    // Check for time expiry
    if (!gameOver) {
      if (playerTurnCode === "w" && whiteTimeMs <= 0) {
        gameOver = true;
        gameResult = { winner: "black", reason: "timeout" };
        whiteTimeMs = 0;
      } else if (playerTurnCode === "b" && blackTimeMs <= 0) {
        gameOver = true;
        gameResult = { winner: "white", reason: "timeout" };
        blackTimeMs = 0;
      }
    }

    // Update the room with new state
    const updateData: Record<string, unknown> = {
      current_fen: newFen,
      white_time_ms: whiteTimeMs,
      black_time_ms: blackTimeMs,
      last_move_at: new Date(serverTimestamp).toISOString(),
    };

    if (gameOver) {
      updateData.status = "finished";
      updateData.result = gameResult;
    }

    const { error: updateError } = await supabase
      .from("chess_rooms")
      .update(updateData)
      .eq("id", room_id);

    if (updateError) {
      console.error("Failed to update room:", updateError);
      return new Response(JSON.stringify({ error: "Failed to save move" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Broadcast the validated move via Realtime
    const channel = supabase.channel(`room:${room_id}`);
    await new Promise<void>((resolve) => {
      const timeout = setTimeout(resolve, 2000);
      channel.subscribe((status) => {
        if (status === "SUBSCRIBED") {
          clearTimeout(timeout);
          resolve();
        }
      });
    });

    await channel.send({
      type: "broadcast",
      event: "validated-move",
      payload: {
        from,
        to,
        promotion: promotion || null,
        fen: newFen,
        san: result.san,
        whiteTimeMs,
        blackTimeMs,
        serverTimestamp,
        gameOver,
        gameResult,
        color: result.color,
      },
    });

    supabase.removeChannel(channel);

    return new Response(
      JSON.stringify({
        ok: true,
        fen: newFen,
        san: result.san,
        whiteTimeMs,
        blackTimeMs,
        serverTimestamp,
        gameOver,
        gameResult,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("validate-move error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
