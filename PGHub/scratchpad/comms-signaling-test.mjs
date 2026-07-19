// Isolate the PGBattle video-call SIGNALING layer: two clients join `comms:{code}`
// exactly like two browsers do, then exchange the same ring/accept/offer/answer/ice
// broadcast messages. Proves whether the Realtime transport is persistent + delivering,
// independent of WebRTC/TURN. Node lacks a global WebSocket, so inject `ws`.
import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';
import fs from 'fs';

globalThis.WebSocket = WebSocket;

const env = fs.readFileSync(new URL('../.env', import.meta.url), 'utf8');
const URL_ = env.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const KEY = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();

const code = 'DIAGTEST';
const A = createClient(URL_, KEY, { realtime: { params: { eventsPerSecond: 20 } } });
const B = createClient(URL_, KEY, { realtime: { params: { eventsPerSecond: 20 } } });

const mkChan = (client, label, onMsg) => {
  const ch = client.channel(`comms:${code}`, { config: { broadcast: { self: false } } });
  ch.on('broadcast', { event: 'comms' }, ({ payload }) => onMsg(label, payload));
  return ch;
};

const log = [];
const received = { A: [], B: [] };
const chA = mkChan(A, 'A', (l, p) => { received.A.push(p.t); log.push(`A recv <- ${p.t}`); });
const chB = mkChan(B, 'B', (l, p) => { received.B.push(p.t); log.push(`B recv <- ${p.t}`); });

const sub = (ch, label) => new Promise((res, rej) => {
  const t = setTimeout(() => rej(new Error(`${label} subscribe timeout`)), 12000);
  ch.subscribe((status) => { log.push(`${label} status: ${status}`); if (status === 'SUBSCRIBED') { clearTimeout(t); res(); } });
});

const send = (ch, from, t, extra = {}) => ch.send({ type: 'broadcast', event: 'comms', payload: { from, name: from, t, ...extra } });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

try {
  await Promise.all([sub(chA, 'A'), sub(chB, 'B')]);
  await wait(400);

  // Full signaling handshake (A = caller, B = callee)
  await send(chA, 'uidA', 'ring', { video: true }); await wait(350);
  await send(chB, 'uidB', 'accept');                await wait(350);
  await send(chA, 'uidA', 'offer', { sdp: '<sdp>' }); await wait(350);
  await send(chB, 'uidB', 'answer', { sdp: '<sdp>' }); await wait(350);
  await send(chA, 'uidA', 'ice', { candidate: '<c1>' }); await wait(350);
  await send(chB, 'uidB', 'ice', { candidate: '<c2>' }); await wait(600);

  // Persistence probe: after a 3s idle gap, does the channel still deliver?
  await wait(3000);
  await send(chA, 'uidA', 'chat', { body: 'still-alive?' }); await wait(700);

  console.log('--- signaling trace ---');
  log.forEach((l) => console.log(l));
  console.log('\nB received from A:', received.B.join(', '));
  console.log('A received from B:', received.A.join(', '));

  const bGot = ['ring', 'offer', 'ice', 'chat'].every((t) => received.B.includes(t));
  const aGot = ['accept', 'answer', 'ice'].every((t) => received.A.includes(t));
  const persistent = received.B.includes('chat'); // arrived AFTER the 3s idle gap
  console.log('\nRESULT:');
  console.log('  callee got caller signals :', bGot ? 'PASS' : 'FAIL');
  console.log('  caller got callee signals :', aGot ? 'PASS' : 'FAIL');
  console.log('  channel persistent (3s idle):', persistent ? 'PASS' : 'FAIL');
  console.log('\n  SIGNALING TRANSPORT:', bGot && aGot && persistent ? 'WORKING' : 'BROKEN');
} catch (e) {
  console.error('ERROR:', e.message);
  log.forEach((l) => console.log(l));
} finally {
  await A.removeAllChannels(); await B.removeAllChannels();
  process.exit(0);
}
