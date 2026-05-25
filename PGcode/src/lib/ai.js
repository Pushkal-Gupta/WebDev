// AI helper layer. Routes to one of Anthropic Claude, OpenAI, or Google Gemini
// based on what the user has configured in Settings.
//
// The API key NEVER lives in source. The user supplies it via Settings → AI;
// it's stored in localStorage and only used for client-side fetch to the chosen
// provider. For production, set an `ai-proxy-url` and the proxy forwards with
// the real key server-side.
//
// All calls are best-effort: failures degrade to "AI unavailable" rather than
// breaking the surrounding feature.

const PROVIDERS = {
  anthropic: {
    label: 'Anthropic (Claude)',
    keyStorage: 'pgcode-anthropic-key',
    modelStorage: 'pgcode-anthropic-model',
    defaultModel: 'claude-haiku-4-5-20251001',
    url: 'https://api.anthropic.com/v1/messages',
  },
  openai: {
    label: 'OpenAI (GPT)',
    keyStorage: 'pgcode-openai-key',
    modelStorage: 'pgcode-openai-model',
    defaultModel: 'gpt-4o-mini',
    url: 'https://api.openai.com/v1/chat/completions',
  },
  gemini: {
    label: 'Google Gemini',
    keyStorage: 'pgcode-gemini-key',
    modelStorage: 'pgcode-gemini-model',
    defaultModel: 'gemini-1.5-flash-latest',
    url: 'https://generativelanguage.googleapis.com/v1beta/models',
  },
};

export const AI_PROVIDERS = Object.entries(PROVIDERS).map(([id, p]) => ({
  id, label: p.label, defaultModel: p.defaultModel,
}));

const PROVIDER_PREF_KEY = 'pgcode-ai-provider';

export function getAiProvider() {
  const v = localStorage.getItem(PROVIDER_PREF_KEY);
  return PROVIDERS[v] ? v : 'anthropic';
}

export function setAiProvider(id) {
  if (PROVIDERS[id]) localStorage.setItem(PROVIDER_PREF_KEY, id);
}

export function getAiKey(provider = getAiProvider()) {
  const cfg = PROVIDERS[provider];
  return cfg ? (localStorage.getItem(cfg.keyStorage) || '') : '';
}

export function setAiKey(key, provider = getAiProvider()) {
  const cfg = PROVIDERS[provider];
  if (!cfg) return;
  if (key) localStorage.setItem(cfg.keyStorage, key);
  else localStorage.removeItem(cfg.keyStorage);
}

export function getAiModel(provider = getAiProvider()) {
  const cfg = PROVIDERS[provider];
  if (!cfg) return '';
  return localStorage.getItem(cfg.modelStorage) || cfg.defaultModel;
}

export function setAiModel(model, provider = getAiProvider()) {
  const cfg = PROVIDERS[provider];
  if (!cfg) return;
  if (model) localStorage.setItem(cfg.modelStorage, model);
  else localStorage.removeItem(cfg.modelStorage);
}

export function getProxyUrl() {
  return localStorage.getItem('pgcode-ai-proxy-url') || '';
}

export function setProxyUrl(url) {
  if (url) localStorage.setItem('pgcode-ai-proxy-url', url);
  else localStorage.removeItem('pgcode-ai-proxy-url');
}

export function isAiEnabled() {
  if (getProxyUrl()) return true;
  // Any provider with a key is enough.
  return Object.values(PROVIDERS).some(p => Boolean(localStorage.getItem(p.keyStorage)));
}

// Tiny in-memory cache so repeated identical prompts within a session don't burn API calls.
const cache = new Map();
function cacheKey(provider, model, prompt) {
  let h = 5381;
  const s = `${provider}|${model}|${prompt}`;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return h.toString(36);
}

async function callAnthropic({ key, model, systemPrompt, userPrompt, maxTokens }) {
  const headers = {
    'content-type': 'application/json',
    'x-api-key': key,
    'anthropic-version': '2023-06-01',
    'anthropic-dangerous-direct-browser-access': 'true',
  };
  const body = {
    model,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  };
  const res = await fetch(PROVIDERS.anthropic.url, {
    method: 'POST', headers, body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Anthropic ${res.status}: ${text.slice(0, 200)}`);
  }
  const data = await res.json();
  return (data?.content || []).map(c => c.text || '').join('').trim();
}

async function callOpenAI({ key, model, systemPrompt, userPrompt, maxTokens }) {
  const headers = {
    'content-type': 'application/json',
    'authorization': `Bearer ${key}`,
  };
  const body = {
    model,
    max_tokens: maxTokens,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  };
  const res = await fetch(PROVIDERS.openai.url, {
    method: 'POST', headers, body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`OpenAI ${res.status}: ${text.slice(0, 200)}`);
  }
  const data = await res.json();
  return (data?.choices?.[0]?.message?.content || '').trim();
}

async function callGemini({ key, model, systemPrompt, userPrompt, maxTokens }) {
  const url = `${PROVIDERS.gemini.url}/${model}:generateContent?key=${encodeURIComponent(key)}`;
  const body = {
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    generationConfig: { maxOutputTokens: maxTokens },
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Gemini ${res.status}: ${text.slice(0, 200)}`);
  }
  const data = await res.json();
  const parts = data?.candidates?.[0]?.content?.parts || [];
  return parts.map(p => p.text || '').join('').trim();
}

async function callAi(systemPrompt, userPrompt, { maxTokens = 600 } = {}) {
  const proxy = getProxyUrl();
  const provider = getAiProvider();
  const cfg = PROVIDERS[provider];
  const key = getAiKey(provider);
  const model = getAiModel(provider);

  if (!proxy && !key) {
    throw new Error(`AI is not configured. Add a key for ${cfg?.label || 'a provider'} in Settings, or pick a different provider.`);
  }

  const ck = cacheKey(provider, model, `${systemPrompt}\n${userPrompt}`);
  if (cache.has(ck)) return cache.get(ck);

  let text;
  if (proxy) {
    // Proxy passes through with the user's chosen provider in a header so the
    // server can route accordingly without exposing the real key client-side.
    const res = await fetch(proxy, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-ai-provider': provider, 'x-ai-model': model },
      body: JSON.stringify({ systemPrompt, userPrompt, maxTokens, provider, model }),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => '');
      throw new Error(`AI proxy ${res.status}: ${t.slice(0, 200)}`);
    }
    const data = await res.json();
    text = (data.text || data.content || '').trim();
  } else if (provider === 'anthropic') {
    text = await callAnthropic({ key, model, systemPrompt, userPrompt, maxTokens });
  } else if (provider === 'openai') {
    text = await callOpenAI({ key, model, systemPrompt, userPrompt, maxTokens });
  } else if (provider === 'gemini') {
    text = await callGemini({ key, model, systemPrompt, userPrompt, maxTokens });
  } else {
    throw new Error(`Unknown AI provider: ${provider}`);
  }

  cache.set(ck, text);
  return text;
}

export async function aiExplainFailure({ problemName, problemDescription, failingInput, expectedOutput, actualOutput, code, language }) {
  const sys = 'You are a senior coding-interview tutor. Be concise. Explain why a submission failed and point at the specific line or logic error if possible. Do NOT rewrite the full solution. Keep the response under 180 words. Output plain prose, no markdown headings.';
  const user = `Problem: ${problemName}\n\n${problemDescription || ''}\n\nFailing test:\nInput: ${failingInput}\nExpected: ${expectedOutput}\nActual: ${actualOutput}\n\nUser's ${language} code:\n\`\`\`${language}\n${code}\n\`\`\`\n\nIn 2-4 sentences: what's wrong, where, and a one-line nudge toward the fix (no full solution).`;
  return callAi(sys, user, { maxTokens: 400 });
}

export async function aiAdaptiveHint({ problemName, problemDescription, levelsAlreadyShown, code }) {
  const sys = 'You are a senior coding-interview tutor. Give a single hint at the next level of detail. Keep it under 60 words. Do NOT reveal the full algorithm. Build on what the candidate has already seen.';
  const user = `Problem: ${problemName}\n\n${problemDescription || ''}\n\nHints already shown:\n${(levelsAlreadyShown || []).map((h, i) => `${i + 1}. ${h}`).join('\n') || '(none)'}\n\nUser's current code:\n${code ? `\`\`\`\n${code.slice(0, 600)}\n\`\`\`` : '(empty)'}\n\nGive the next hint level.`;
  return callAi(sys, user, { maxTokens: 200 });
}

export async function aiQuizFromConcept({ conceptTitle, conceptBody }) {
  const sys = 'You generate concise multiple-choice quiz questions to check understanding of an algorithm concept. Output STRICT JSON only: {"question": str, "options": [str x4], "correctIndex": int, "explanation": str}. The explanation should be under 60 words. The question should test understanding, not rote memorization.';
  const user = `Concept: ${conceptTitle}\n\nContent excerpt:\n${(conceptBody || '').slice(0, 1500)}\n\nGenerate one quiz question. Return JSON only with no markdown fence.`;
  const text = await callAi(sys, user, { maxTokens: 400 });
  try {
    const cleaned = text.replace(/^```json\s*|\s*```$/g, '').replace(/^```\s*|\s*```$/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    throw new Error('AI returned malformed JSON for the quiz.');
  }
}

// Generate a full multi-question quiz on demand. Shape mirrors the pre-built
// quiz objects in src/content/quizzes.js so the same QuizRunner renders them.
export async function aiCustomQuiz({ topic, difficulty = 'Intermediate', focus = '', count = 8 }) {
  const n = Math.min(15, Math.max(4, Number(count) || 8));
  const sys = `You generate technical multiple-choice quizzes for software engineering interview prep. Output STRICT JSON only — no markdown fence, no commentary. Shape:
{
  "id": "custom-<topic-slug>-<short>",
  "title": "<topic> — <focus or generic angle>",
  "topic": "<topic>",
  "difficulty": "${difficulty}",
  "summary": "<one-line description>",
  "questions": [
    { "id": "q1", "prompt": "...", "options": ["A","B","C","D"], "correct": 0, "explanation": "..." }
  ]
}
Every question must have exactly 4 options, one unambiguously correct, "correct" is a 0-based index. Explanations under 60 words, focused on why the right answer is right (not just restating). Questions should test understanding, not trivia.`;
  const focusLine = focus ? `Special focus: ${focus}.` : 'Cover the most interview-relevant angles.';
  const user = `Topic: ${topic}\nDifficulty: ${difficulty}\nQuestion count: exactly ${n}\n${focusLine}\n\nReturn the quiz JSON.`;
  const text = await callAi(sys, user, { maxTokens: 2400 });
  let parsed;
  try {
    const cleaned = text.replace(/^```json\s*|\s*```$/g, '').replace(/^```\s*|\s*```$/g, '').trim();
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('AI returned malformed JSON for the custom quiz.');
  }
  if (!parsed?.questions?.length) throw new Error('AI quiz had no questions.');
  // Normalize to the runner's expected shape.
  parsed.questions = parsed.questions.map((q, i) => ({
    id: q.id || `q${i + 1}`,
    prompt: q.prompt || q.question || '',
    options: Array.isArray(q.options) ? q.options.slice(0, 4) : [],
    correct: Number.isInteger(q.correct) ? q.correct : Number(q.correctIndex) || 0,
    explanation: q.explanation || '',
  })).filter(q => q.prompt && q.options.length >= 2);
  if (!parsed.questions.length) throw new Error('AI quiz had no usable questions.');
  if (!parsed.title) parsed.title = `${topic} — Custom`;
  if (!parsed.difficulty) parsed.difficulty = difficulty;
  return parsed;
}
