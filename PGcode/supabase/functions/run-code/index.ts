// Supabase Edge Function: run-code
// Batches code execution requests to Judge0, running all test cases in parallel.
//
// Request:  { code: string, language: "python"|"javascript"|"java", stdins: string[] }
// Response: { results: Array<{ status: "success"|"compile_error"|"time_limit"|"runtime_error", output: string }> }
//
// Env (set via `supabase secrets set`):
//   JUDGE0_URL           - base url, default https://ce.judge0.com
//   JUDGE0_RAPIDAPI_KEY  - optional; if set, sends x-rapidapi-key header
//   JUDGE0_RAPIDAPI_HOST - optional; paired with the key (e.g. judge0-ce.p.rapidapi.com)

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const LANG_MAP: Record<string, number> = {
  python: 71,
  javascript: 63,
  java: 62,
  cpp: 54,
};

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const JUDGE0_URL = Deno.env.get("JUDGE0_URL") || "https://ce.judge0.com";
const RAPID_KEY = Deno.env.get("JUDGE0_RAPIDAPI_KEY");
const RAPID_HOST = Deno.env.get("JUDGE0_RAPIDAPI_HOST");

function judge0Headers(): HeadersInit {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (RAPID_KEY) h["x-rapidapi-key"] = RAPID_KEY;
  if (RAPID_HOST) h["x-rapidapi-host"] = RAPID_HOST;
  return h;
}

function mapResult(sub: {
  status?: { id: number };
  stdout?: string | null;
  stderr?: string | null;
  compile_output?: string | null;
  message?: string | null;
}): { status: string; output: string } {
  const id = sub.status?.id;
  if (id === 6) return { status: "compile_error", output: sub.compile_output || "Compilation failed" };
  if (id === 5) return { status: "time_limit", output: "Time Limit Exceeded (5s)" };
  if (id === 3) return { status: "success", output: sub.stdout || "(No output)" };
  return {
    status: "runtime_error",
    output: sub.stderr || sub.compile_output || sub.message || "Runtime error",
  };
}

async function pollBatch(tokens: string[]): Promise<any[]> {
  const tokenParam = tokens.join(",");
  const fields = "status,stdout,stderr,compile_output,message,token";
  const url = `${JUDGE0_URL}/submissions/batch?tokens=${tokenParam}&base64_encoded=false&fields=${fields}`;

  // Poll up to ~30s (20 tries * 1.5s)
  for (let attempt = 0; attempt < 20; attempt++) {
    const res = await fetch(url, { headers: judge0Headers() });
    if (!res.ok) throw new Error(`Judge0 poll failed: ${res.status}`);
    const data = await res.json();
    const subs = data.submissions || [];
    // statusId 1 = In Queue, 2 = Processing
    const pending = subs.some((s: any) => s.status?.id === 1 || s.status?.id === 2);
    if (!pending && subs.length === tokens.length) return subs;
    await new Promise((r) => setTimeout(r, 1500));
  }
  throw new Error("Judge0 poll timed out");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  try {
    const { code, language, stdins } = await req.json();
    if (!code || typeof code !== "string") throw new Error("code must be a non-empty string");
    if (code.length > 100_000) throw new Error("code exceeds maximum allowed size");
    const langId = LANG_MAP[language];
    if (!langId) throw new Error(`Unsupported language: ${language}`);
    if (!Array.isArray(stdins) || stdins.length === 0) throw new Error("stdins must be a non-empty array");
    if (stdins.length > 100) throw new Error("Too many test cases (max 100)");

    // Judge0 batch endpoint accepts up to ~20 submissions per call; chunk to be safe.
    const CHUNK = 20;
    const allResults: { status: string; output: string }[] = new Array(stdins.length);

    for (let start = 0; start < stdins.length; start += CHUNK) {
      const chunk = stdins.slice(start, start + CHUNK);
      const body = {
        submissions: chunk.map((stdin: string) => ({
          language_id: langId,
          source_code: code,
          stdin,
        })),
      };

      const createRes = await fetch(
        `${JUDGE0_URL}/submissions/batch?base64_encoded=false`,
        { method: "POST", headers: judge0Headers(), body: JSON.stringify(body) },
      );
      if (!createRes.ok) {
        const txt = await createRes.text();
        throw new Error(`Judge0 batch create failed: ${createRes.status} ${txt}`);
      }
      const created = await createRes.json();
      const tokens = created.map((c: any) => c.token).filter(Boolean);
      if (tokens.length !== chunk.length) throw new Error("Judge0 returned fewer tokens than requested");

      const subs = await pollBatch(tokens);
      // Preserve ordering by token since poll response order isn't guaranteed.
      const byToken: Record<string, any> = {};
      for (const s of subs) byToken[s.token] = s;
      tokens.forEach((t: string, i: number) => {
        allResults[start + i] = mapResult(byToken[t] || {});
      });
    }

    return new Response(JSON.stringify({ results: allResults }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
