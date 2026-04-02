/**
 * WebRTC P2P service for offline local chess.
 *
 * Flow:
 *   Host  → createOffer()   → share JSON/QR  → call acceptAnswer(answerJson)
 *   Joiner → acceptOffer(offerJson) → share JSON/QR  → (auto-complete)
 *
 * Both sides get an 'open' event when the data channel is ready.
 */

const STUN_CONFIG = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

let _pc  = null;
let _dc  = null;
const _h = {};  // event handlers

// ── Public API ────────────────────────────────────────────────────────────────

export const p2p = {
  /** Register a handler: 'open' | 'message' | 'close' | 'error' */
  on(event, fn) { _h[event] = fn; },
  off(event)    { delete _h[event]; },

  /**
   * Host: create an offer SDP.
   * @returns {Promise<string>} JSON string to share with the joiner.
   */
  async createOffer() {
    _cleanup();
    _pc = new RTCPeerConnection(STUN_CONFIG);
    _dc = _pc.createDataChannel('chess', { ordered: true });
    _wireChannel(_dc);
    _wirePC();

    const offer = await _pc.createOffer();
    await _pc.setLocalDescription(offer);
    return _waitForIce();
  },

  /**
   * Joiner: accept the host's offer and return an answer SDP.
   * @param {string} offerJson - JSON from createOffer()
   * @returns {Promise<string>} JSON string to share back with the host.
   */
  async acceptOffer(offerJson) {
    _cleanup();
    _pc = new RTCPeerConnection(STUN_CONFIG);
    _pc.ondatachannel = (e) => { _dc = e.channel; _wireChannel(_dc); };
    _wirePC();

    await _pc.setRemoteDescription(JSON.parse(offerJson));
    const answer = await _pc.createAnswer();
    await _pc.setLocalDescription(answer);
    return _waitForIce();
  },

  /**
   * Host: call this once you've received the joiner's answer QR/JSON.
   * @param {string} answerJson
   */
  async acceptAnswer(answerJson) {
    if (!_pc) throw new Error('Call createOffer first.');
    await _pc.setRemoteDescription(JSON.parse(answerJson));
  },

  /** Send a game message to the peer. */
  send(payload) {
    if (_dc?.readyState === 'open') {
      _dc.send(JSON.stringify(payload));
    }
  },

  /** Tear down the connection. */
  close() {
    _cleanup();
    Object.keys(_h).forEach(k => delete _h[k]);
  },

  get isOpen() { return _dc?.readyState === 'open'; },
};

// ── Internal helpers ──────────────────────────────────────────────────────────

function _emit(event, data) { _h[event]?.(data); }

function _wireChannel(ch) {
  ch.onopen    = ()  => _emit('open');
  ch.onclose   = ()  => _emit('close');
  ch.onmessage = (e) => {
    try { _emit('message', JSON.parse(e.data)); } catch { /* ignore bad frames */ }
  };
}

function _wirePC() {
  _pc.onconnectionstatechange = () => {
    if (_pc?.connectionState === 'failed') _emit('error', 'connection-failed');
  };
}

function _cleanup() {
  try { _dc?.close(); }  catch { /* ignore */ }
  try { _pc?.close(); }  catch { /* ignore */ }
  _dc = null;
  _pc = null;
}

/** Resolve when ICE gathering finishes, returning the local SDP as JSON. */
function _waitForIce() {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('ICE timeout')), 10_000);

    const done = () => {
      clearTimeout(timeout);
      resolve(JSON.stringify(_pc.localDescription));
    };

    if (_pc.iceGatheringState === 'complete') return done();

    _pc.addEventListener('icegatheringstatechange', () => {
      if (_pc.iceGatheringState === 'complete') done();
    });
  });
}
