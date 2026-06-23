import React, { useMemo, useState } from 'react';
import { KeyRound, ChevronRight, RotateCcw, SkipForward, Lock } from 'lucide-react';
import './Sigv4AwsSigningViz.css';

// Deterministic, illustrative-only pseudo-HMAC so the digests are stable
// across renders (NOT real cryptography — just a visual hash for the demo).
function pseudoHash(label, ...parts) {
  let h = 2166136261 >>> 0;
  const s = label + '|' + parts.join('|');
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  let out = '';
  for (let i = 0; i < 8; i++) {
    h ^= h << 13; h >>>= 0;
    h ^= h >> 17;
    h ^= h << 5; h >>>= 0;
    out += (h >>> 0).toString(16).padStart(8, '0');
  }
  return out.slice(0, 64);
}

const REQ = {
  method: 'GET',
  service: 's3',
  region: 'us-east-1',
  date: '20260524',
  akid: 'AKIAEXAMPLE7Q',
};

export default function Sigv4AwsSigningViz() {
  const [step, setStep] = useState(0);

  const data = useMemo(() => {
    const scope = `${REQ.date}/${REQ.region}/${REQ.service}/aws4_request`;
    const canonical = pseudoHash('canonical', REQ.method, '/', 'host;x-amz-date');
    const sts = pseudoHash('sts', 'AWS4-HMAC-SHA256', scope, canonical);
    const kDate = pseudoHash('kDate', 'AWS4secret', REQ.date);
    const kRegion = pseudoHash('kRegion', kDate, REQ.region);
    const kService = pseudoHash('kService', kRegion, REQ.service);
    const kSigning = pseudoHash('kSigning', kService, 'aws4_request');
    const signature = pseudoHash('sig', kSigning, sts);
    return { scope, canonical, sts, kDate, kRegion, kService, kSigning, signature };
  }, []);

  const STAGES = [
    {
      key: 'canonical',
      title: 'Canonical Request',
      hue: 'var(--hue-sky)',
      lines: [
        `${REQ.method}`,
        '/',
        '(sorted query)',
        'host;x-amz-date',
        'SHA256(body)',
      ],
      out: data.canonical,
      outLabel: 'SHA256(canonicalRequest)',
      note: 'Stringify the request deterministically: method, URI, sorted query, sorted signed headers, and a body hash. Both client and server build the exact same bytes, then hash them.',
    },
    {
      key: 'sts',
      title: 'String-to-Sign',
      hue: 'var(--hue-violet)',
      lines: [
        'AWS4-HMAC-SHA256',
        '20260524T120000Z',
        data.scope,
        data.canonical.slice(0, 24) + '…',
      ],
      out: data.sts,
      outLabel: 'stringToSign',
      note: 'Wrap the canonical hash with the algorithm, timestamp, and the credential scope (date / region / service). The timestamp ties the request to a ~5-minute replay window.',
    },
    {
      key: 'key',
      title: 'Derived Signing Key',
      hue: 'var(--hue-mint)',
      chain: [
        { label: 'kDate = HMAC("AWS4"+secret, date)', val: data.kDate },
        { label: 'kRegion = HMAC(kDate, region)', val: data.kRegion },
        { label: 'kService = HMAC(kRegion, service)', val: data.kService },
        { label: 'kSigning = HMAC(kService, "aws4_request")', val: data.kSigning },
      ],
      out: data.kSigning,
      outLabel: 'kSigning',
      note: 'A four-link HMAC chain narrows the secret down to one day, region, and service. A leaked kSigning can only sign for that single scope — blast radius stays tiny.',
    },
    {
      key: 'sig',
      title: 'Signature',
      hue: 'var(--accent)',
      lines: [
        'hex( HMAC(',
        '  kSigning,',
        '  stringToSign',
        ') )',
      ],
      out: data.signature,
      outLabel: 'Signature',
      note: 'One final HMAC of the string-to-sign under the derived key produces the signature. AWS recomputes it server-side with the stored secret and compares — no secret ever crosses the wire.',
    },
    {
      key: 'auth',
      title: 'Authorization Header',
      hue: 'var(--easy)',
      lines: [
        'AWS4-HMAC-SHA256',
        `Credential=${REQ.akid}/${data.scope}`,
        'SignedHeaders=host;x-amz-date',
        `Signature=${data.signature.slice(0, 16)}…`,
      ],
      out: null,
      note: 'Everything the server needs to verify travels in one header (or, for presigned URLs, the query string): the key id, the scope, which headers were signed, and the signature.',
    },
  ];

  const total = STAGES.length;
  const visible = step + 1;

  return (
    <div className="sigv4">
      <div className="sigv4-head">
        <span className="sigv4-head-icon"><KeyRound size={16} /></span>
        <span className="sigv4-head-text">
          <span className="sigv4-head-title">SigV4 — five steps to a signed request</span>
          <span className="sigv4-head-sub">
            step down the derivation: canonical request → string-to-sign → signing key → signature → header
          </span>
        </span>
        <span className="sigv4-chip">{REQ.service} · {REQ.region}</span>
      </div>

      <div className="sigv4-flow">
        {STAGES.map((s, i) => {
          const on = i < visible;
          const active = i === step;
          return (
            <div className="sigv4-stagewrap" key={s.key}>
              <div
                className={`sigv4-stage${on ? ' is-on' : ''}${active ? ' is-active' : ''}`}
                style={{ '--stage-hue': s.hue }}
              >
                <div className="sigv4-stage-head">
                  <span className="sigv4-stage-num">{i + 1}</span>
                  <span className="sigv4-stage-title">{s.title}</span>
                  {s.key === 'key' && <Lock size={12} className="sigv4-stage-lock" />}
                </div>

                {on && (
                  <div className="sigv4-stage-body">
                    {s.chain ? (
                      <div className="sigv4-chain">
                        {s.chain.map((c) => (
                          <div className="sigv4-chain-row" key={c.label}>
                            <span className="sigv4-chain-label">{c.label}</span>
                            <span className="sigv4-chain-val">{c.val.slice(0, 18)}…</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <pre className="sigv4-lines">{s.lines.join('\n')}</pre>
                    )}
                    {s.out && (
                      <div className="sigv4-out">
                        <span className="sigv4-out-label">{s.outLabel}</span>
                        <span className="sigv4-out-val">{s.out}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              {i < total - 1 && (
                <div className={`sigv4-arrow${i < step ? ' is-on' : ''}`} aria-hidden="true">
                  <span className="sigv4-arrow-stem" />
                  <span className="sigv4-arrow-head" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="sigv4-controls">
        <button
          type="button"
          className="sigv4-btn sigv4-btn-primary"
          onClick={() => setStep((s) => Math.min(s + 1, total - 1))}
          disabled={step >= total - 1}
        >
          <ChevronRight size={14} /> Next step
        </button>
        <button
          type="button"
          className="sigv4-btn"
          onClick={() => setStep(total - 1)}
          disabled={step >= total - 1}
        >
          <SkipForward size={14} /> Show all
        </button>
        <button type="button" className="sigv4-btn" onClick={() => setStep(0)}>
          <RotateCcw size={14} /> Reset
        </button>
        <span className="sigv4-stepcount">step {visible} / {total}</span>
      </div>

      <div className="sigv4-narration">
        <span className="sigv4-narration-label">step {step + 1}</span>
        <span className="sigv4-narration-body">{STAGES[step].note}</span>
      </div>
    </div>
  );
}
