import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, Bug } from 'lucide-react';
import './JwtPasetoViz.css';

const ATTACKS = [
  {
    id: 'none',
    label: 'alg:none',
    desc: 'Flip the header to {"alg":"none"} and drop the signature.',
    jwtField: 'header.alg = "none"',
    jwtVerdict: 'accept',
    jwtWhy: 'A naive verifier reads alg from the header and selects the no-op verifier, accepting any token.',
    pasetoWhy: 'The version+purpose prefix "v4.public." is constant — there is no alg field to set to "none". Dispatch is fixed.',
  },
  {
    id: 'confusion',
    label: 'HS256 / RS256 confusion',
    desc: 'Switch RS256 -> HS256; sign with the public RSA key as the HMAC secret.',
    jwtField: 'header.alg = "HS256"',
    jwtVerdict: 'accept',
    jwtWhy: 'The server configured the public key for RS256, but the header forces HMAC — the public key (readable from JWKS) becomes the MAC secret.',
    pasetoWhy: 'v4.public is Ed25519 only; v4.local is XChaCha20 only. Sign-keys and encrypt-keys are different opaque types; the API refuses to mix them.',
  },
  {
    id: 'kid',
    label: 'kid header injection',
    desc: 'Rewrite kid -> "../../dev/null" or an SQL payload to redirect key lookup.',
    jwtField: 'header.kid = "../../etc/passwd"',
    jwtVerdict: 'accept',
    jwtWhy: 'kid is unauthenticated input read before verification — path traversal or SQLi in key lookup can return an attacker-known key.',
    pasetoWhy: 'Key-routing metadata lives in the footer, which is included in the signature. Tamper with it and verification fails.',
  },
  {
    id: 'valid',
    label: 'genuine token',
    desc: 'A correctly signed token from the real signer.',
    jwtField: 'header.alg = "RS256" (signed)',
    jwtVerdict: 'accept-ok',
    jwtWhy: 'Signature matches the configured key — accepted, as intended.',
    pasetoWhy: 'Signature matches the Ed25519 public key — accepted, as intended.',
  },
];

export default function JwtPasetoViz() {
  const [attackId, setAttackId] = useState('none');
  const attack = ATTACKS.find((a) => a.id === attackId);
  const jwtForged = attack.jwtVerdict === 'accept';

  return (
    <div className="jpv">
      <div className="jpv-head">
        <h3 className="jpv-title">JWT footguns vs PASETO&rsquo;s fixed protocol</h3>
        <p className="jpv-sub">
          Pick an attack and watch the two verifiers respond. JWT trusts the header (so a forged header can flip
          the verifier); PASETO trusts the version (so the dispatch is constant and there is nothing to confuse).
        </p>
      </div>

      <div className="jpv-attacks">
        {ATTACKS.map((a) => (
          <button key={a.id} type="button" className={`jpv-attack ${attackId === a.id ? 'jpv-attack-on' : ''} ${a.id === 'valid' ? 'jpv-attack-valid' : ''}`} onClick={() => setAttackId(a.id)}>
            {a.id === 'valid' ? <ShieldCheck size={13} /> : <Bug size={13} />}
            {a.label}
          </button>
        ))}
      </div>
      <p className="jpv-attack-desc">{attack.desc}</p>

      <div className="jpv-grid">
        <div className={`jpv-panel ${jwtForged ? 'jpv-panel-bad' : 'jpv-panel-ok'}`}>
          <div className="jpv-panel-head">
            <span className="jpv-panel-name">JWT verifier</span>
            <span className={`jpv-verdict ${jwtForged ? 'jpv-verdict-bad' : 'jpv-verdict-ok'}`}>
              {jwtForged ? <ShieldAlert size={14} /> : <ShieldCheck size={14} />}
              {jwtForged ? 'ACCEPTS FORGERY' : 'verified'}
            </span>
          </div>
          {/* vertical token flow: header -> payload -> signature */}
          <div className="jpv-token">
            <div className={`jpv-seg ${(attackId !== 'valid') ? 'jpv-seg-hot' : ''}`}>
              <span className="jpv-seg-tag">header</span>
              <span className="jpv-seg-val">{attack.jwtField}</span>
            </div>
            <div className="jpv-flow">&darr;</div>
            <div className="jpv-seg"><span className="jpv-seg-tag">payload</span><span className="jpv-seg-val">{'{ sub: 42 }'}</span></div>
            <div className="jpv-flow">&darr;</div>
            <div className="jpv-seg"><span className="jpv-seg-tag">verify</span><span className="jpv-seg-val">{jwtForged ? 'header chose the verifier' : 'signature checked'}</span></div>
          </div>
          <p className="jpv-why">{attack.jwtWhy}</p>
        </div>

        <div className="jpv-panel jpv-panel-ok">
          <div className="jpv-panel-head">
            <span className="jpv-panel-name">PASETO v4.public</span>
            <span className="jpv-verdict jpv-verdict-ok">
              <ShieldCheck size={14} />
              {attackId === 'valid' ? 'verified' : 'REJECTS / N/A'}
            </span>
          </div>
          <div className="jpv-token">
            <div className="jpv-seg jpv-seg-fixed"><span className="jpv-seg-tag">version.purpose</span><span className="jpv-seg-val">v4.public  (constant)</span></div>
            <div className="jpv-flow">&darr;</div>
            <div className="jpv-seg"><span className="jpv-seg-tag">body</span><span className="jpv-seg-val">payload || Ed25519 sig</span></div>
            <div className="jpv-flow">&darr;</div>
            <div className="jpv-seg"><span className="jpv-seg-tag">verify</span><span className="jpv-seg-val">{attackId === 'valid' ? 'Ed25519 ok' : 'one fixed verifier — attack has no surface'}</span></div>
          </div>
          <p className="jpv-why jpv-why-ok">{attack.pasetoWhy}</p>
        </div>
      </div>

      <div className="jpv-takeaway">
        <span className="jpv-takeaway-label">the structural difference</span>
        <span className="jpv-takeaway-text">
          Every JWT CVE in this family comes from acting on an attacker-controlled header field before checking the signature. PASETO versions the protocol instead of negotiating the algorithm, so there is no field to confuse and no key directory to inject into.
        </span>
      </div>
    </div>
  );
}
