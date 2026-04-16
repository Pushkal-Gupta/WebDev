import { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Html5Qrcode } from 'html5-qrcode';
import { p2p } from '../../utils/p2pService';
import styles from './P2PSetup.module.css';

/*
  Host flow:   role='host'  → generating offer → show offer QR
               → user clicks "Scan Answer" → scan / paste answer → connected
  Joiner flow: role='joiner' → scanning offer → show answer QR → connected
*/

export default function P2PSetup({ onConnected }) {
  const [role,   setRole]   = useState(null);   // 'host' | 'joiner'
  const [step,   setStep]   = useState('role');  // 'role'|'offer'|'answer-scan'|'joiner-scan'|'answer'|'connecting'
  const [sdp,    setSdp]    = useState('');      // SDP to display as QR
  const [error,  setError]  = useState('');
  const [busy,   setBusy]   = useState(false);
  const [pasteVal, setPasteVal] = useState('');
  const [scanning, setScanning] = useState(false);

  const scannerRef = useRef(null);
  const scanDivId  = 'p2p-qr-reader';

  // Register connection listener once
  useEffect(() => {
    p2p.on('open', () => {
      stopScanner();
      onConnected(role === 'host' ? 'w' : 'b');
    });
    p2p.on('error', (msg) => setError('Connection failed: ' + msg));
    return () => { p2p.off('open'); p2p.off('error'); };
  }, [role]);

  // ── Host: generate offer ────────────────────────────────────────────────────
  async function startHost() {
    setRole('host');
    setStep('offer');
    setBusy(true);
    setError('');
    try {
      const offerJson = await p2p.createOffer();
      setSdp(offerJson);
    } catch (e) {
      setError('Failed to create offer: ' + e.message);
    } finally {
      setBusy(false);
    }
  }

  // ── Host: accept pasted/scanned answer ─────────────────────────────────────
  async function acceptAnswer(json) {
    setBusy(true);
    setError('');
    try {
      await p2p.acceptAnswer(json);
      setStep('connecting');
    } catch (e) {
      setError('Invalid answer: ' + e.message);
      setBusy(false);
    }
  }

  // ── Joiner: accept scanned/pasted offer ────────────────────────────────────
  async function acceptOffer(json) {
    setBusy(true);
    setError('');
    try {
      const answerJson = await p2p.acceptOffer(json);
      setSdp(answerJson);
      setStep('answer');
    } catch (e) {
      setError('Invalid offer: ' + e.message);
    } finally {
      setBusy(false);
    }
  }

  // ── QR scanner ──────────────────────────────────────────────────────────────
  async function startScanner(onResult) {
    setScanning(true);
    setError('');
    try {
      const scanner = new Html5Qrcode(scanDivId);
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decoded) => {
          stopScanner();
          onResult(decoded);
        },
        () => { /* ignore frequent decode errors */ }
      );
    } catch (e) {
      setScanning(false);
      setError('Camera access denied. Use the paste field below instead.');
    }
  }

  function stopScanner() {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(() => {});
      scannerRef.current = null;
    }
    setScanning(false);
  }

  useEffect(() => () => stopScanner(), []);

  // ── Render ──────────────────────────────────────────────────────────────────

  if (step === 'role') {
    return (
      <div className={styles.wrap}>
        <div className={styles.header}>
          <div className={styles.title}>Nearby Play</div>
          <div className={styles.sub}>Play chess on the same Wi-Fi or offline — no internet needed after connecting.</div>
        </div>
        <div className={styles.roleRow}>
          <button className={styles.roleBtn} onClick={startHost}>
            <span className={styles.roleIcon}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <circle cx="12" cy="12" r="3"/><path d="M4.5 12a7.5 7.5 0 0115 0"/><path d="M1.5 12a10.5 10.5 0 0121 0"/>
              </svg>
            </span>
            <div className={styles.roleName}>New Game</div>
            <div className={styles.roleDesc}>Host &amp; share invite QR</div>
          </button>
          <button className={styles.roleBtn} onClick={() => { setRole('joiner'); setStep('joiner-scan'); }}>
            <span className={styles.roleIcon}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="3" height="3"/><rect x="18" y="18" width="3" height="3"/>
              </svg>
            </span>
            <div className={styles.roleName}>Join Game</div>
            <div className={styles.roleDesc}>Scan host&apos;s QR code</div>
          </button>
        </div>
      </div>
    );
  }

  // ── Host: show offer QR ─────────────────────────────────────────────────────
  if (step === 'offer') {
    return (
      <div className={styles.wrap}>
        <StepHeader title="Step 1 of 2 — Share invite" sub="Show this QR to your friend's device." />
        {busy ? <Spinner /> : sdp ? (
          <>
            <QRBox sdp={sdp} />
            <CopyBtn value={sdp} />
            <button className={styles.nextBtn} onClick={() => setStep('answer-scan')}>
              Friend has it → Scan their reply
            </button>
          </>
        ) : null}
        {error && <ErrMsg msg={error} />}
      </div>
    );
  }

  // ── Host: scan/paste answer ─────────────────────────────────────────────────
  if (step === 'answer-scan') {
    return (
      <div className={styles.wrap}>
        <StepHeader title="Step 2 of 2 — Scan friend's reply" sub="Point camera at their answer QR, or paste the text." />
        {!scanning && (
          <button className={styles.scanBtn} onClick={() => startScanner(acceptAnswer)}>
            Open Camera
          </button>
        )}
        <div id={scanDivId} className={styles.scanBox} />
        <PasteField
          label="Or paste answer JSON"
          value={pasteVal}
          onChange={setPasteVal}
          onSubmit={() => { if (pasteVal.trim()) acceptAnswer(pasteVal.trim()); }}
          busy={busy}
        />
        {error && <ErrMsg msg={error} />}
      </div>
    );
  }

  // ── Joiner: scan offer ──────────────────────────────────────────────────────
  if (step === 'joiner-scan') {
    return (
      <div className={styles.wrap}>
        <StepHeader title="Step 1 of 2 — Scan host's invite" sub="Point camera at the host's invite QR, or paste the text." />
        {!scanning && (
          <button className={styles.scanBtn} onClick={() => startScanner(acceptOffer)}>
            Open Camera
          </button>
        )}
        <div id={scanDivId} className={styles.scanBox} />
        <PasteField
          label="Or paste offer JSON"
          value={pasteVal}
          onChange={setPasteVal}
          onSubmit={() => { if (pasteVal.trim()) acceptOffer(pasteVal.trim()); }}
          busy={busy}
        />
        {error && <ErrMsg msg={error} />}
      </div>
    );
  }

  // ── Joiner: show answer QR ──────────────────────────────────────────────────
  if (step === 'answer') {
    return (
      <div className={styles.wrap}>
        <StepHeader title="Step 2 of 2 — Share your reply" sub="Show this QR to the host. The game will start automatically." />
        {busy ? <Spinner /> : sdp ? (
          <>
            <QRBox sdp={sdp} />
            <CopyBtn value={sdp} />
            <div className={styles.waitMsg}>Waiting for host to connect…</div>
          </>
        ) : null}
        {error && <ErrMsg msg={error} />}
      </div>
    );
  }

  // ── Connecting… ─────────────────────────────────────────────────────────────
  if (step === 'connecting') {
    return (
      <div className={styles.wrap}>
        <StepHeader title="Connecting…" sub="Establishing peer-to-peer link." />
        <Spinner />
        {error && <ErrMsg msg={error} />}
      </div>
    );
  }

  return null;
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function StepHeader({ title, sub }) {
  return (
    <div className={styles.stepHeader}>
      <div className={styles.stepTitle}>{title}</div>
      {sub && <div className={styles.stepSub}>{sub}</div>}
    </div>
  );
}

function QRBox({ sdp }) {
  // SDP can be 2-4KB. If too large for QR, show copy-paste fallback.
  const tooLarge = sdp.length > 2900;
  return (
    <div className={styles.qrWrap}>
      {tooLarge ? (
        <div style={{
          padding: '20px 16px',
          textAlign: 'center',
          color: 'rgba(255,255,255,0.5)',
          fontSize: '0.82rem',
          lineHeight: 1.5,
        }}>
          <div style={{ fontSize: '2rem', marginBottom: 8, opacity: 0.5 }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="7" height="7" rx="1"/>
              <rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/>
              <rect x="14" y="14" width="3" height="3"/>
              <rect x="18" y="18" width="3" height="3"/>
            </svg>
          </div>
          SDP too large for QR code.<br/>
          Use the <strong>Copy as text</strong> button below and paste on the other device.
        </div>
      ) : (
        <QRCodeSVG
          value={sdp}
          size={220}
          level="M"
          bgColor="transparent"
          fgColor="#00fff5"
        />
      )}
    </div>
  );
}

function CopyBtn({ value }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };
  return (
    <button className={styles.copyBtn} onClick={copy}>
      {copied ? 'Copied!' : 'Copy as text'}
    </button>
  );
}

function PasteField({ label, value, onChange, onSubmit, busy }) {
  return (
    <div className={styles.pasteWrap}>
      <div className={styles.pasteLabel}>{label}</div>
      <textarea
        className={styles.pasteArea}
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={3}
        placeholder='{"type":"offer","sdp":"..."}'
      />
      <button className={styles.nextBtn} onClick={onSubmit} disabled={busy || !value.trim()}>
        {busy ? 'Processing…' : 'Connect'}
      </button>
    </div>
  );
}

function Spinner() {
  return <div className={styles.spinner} />;
}

function ErrMsg({ msg }) {
  return <div className={styles.error}>{msg}</div>;
}
