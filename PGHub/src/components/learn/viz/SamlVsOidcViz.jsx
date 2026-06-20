import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Play, Pause, RotateCcw, ChevronRight, SkipForward, ShieldCheck,
  User, AppWindow, KeyRound, Database, Check, ArrowRight, FileCode, Braces,
} from 'lucide-react';
import './SamlVsOidcViz.css';

// Two federated-SSO protocols carrying the SAME login, contrasted hop by hop.
// SAML moves a signed XML <saml:Assertion> from the IdP to the SP's ACS via an
// HTTP-POST binding. OIDC layers a signed JWT id_token on top of OAuth2's
// authorization-code grant. Toggle between them: the actor lanes relabel
// (SP/IdP vs RP/IdP), the flow steps swap, and the token panel switches from an
// XML assertion (XML-DSig signature element) to a three-part JWT (header.
// payload.signature signed with RS256/JWS). The point: same outcome, very
// different token format and transport.

const ACTOR_SETS = {
  saml: [
    { key: 'user', label: 'User', sub: 'browser', icon: 'user' },
    { key: 'app', label: 'SP', sub: 'service provider', icon: 'app' },
    { key: 'idp', label: 'IdP', sub: 'identity provider', icon: 'key' },
    { key: 'dir', label: 'Directory', sub: 'user store', icon: 'db' },
  ],
  oidc: [
    { key: 'user', label: 'User', sub: 'browser', icon: 'user' },
    { key: 'app', label: 'RP', sub: 'relying party', icon: 'app' },
    { key: 'idp', label: 'IdP / OP', sub: 'OpenID provider', icon: 'key' },
    { key: 'dir', label: 'Directory', sub: 'user store', icon: 'db' },
  ],
};

const PHASE_LABEL = {
  init: 'setup',
  request: 'auth request',
  login: 'authenticate',
  assert: 'assertion',
  callback: 'callback',
  exchange: 'token exchange',
  issue: 'id_token',
  validate: 'validate',
  session: 'session',
  done: 'done',
};

const SAMPLE = {
  subject: 'alice@corp',
  email: 'alice@corp.com',
  sp: 'https://app.pgcode.dev',
  acs: 'https://app.pgcode.dev/saml/acs',
  entityId: 'pgcode-sp',
  reqId: '_a1b9c4f',
  rp: 'pgcode-web',
  redirect: 'https://app.pgcode.dev/cb',
  iss: 'https://idp.corp.com',
  aud: 'pgcode-web',
  nonce: 'n-7Hq2Lp',
  code: 'AUTH_9f3aK',
  exp: '1718900000',
};

// XML assertion snippet (SAML) and JWT parts (OIDC), each pre-split into short
// lines so nothing overflows the panel width. These are DATA only — rendered as
// plain SVG/HTML text, never injected as markup.
const SAML_XML = [
  '<saml:Assertion',
  '    IssueInstant="2026-06-20T14:02:11Z"',
  '    Issuer="https://idp.corp.com">',
  '  <saml:Subject>',
  '    <saml:NameID>alice@corp</saml:NameID>',
  '  </saml:Subject>',
  '  <saml:AttributeStatement>',
  '    <saml:Attribute Name="email">',
  '      <saml:AttributeValue>',
  '        alice@corp.com',
  '      </saml:AttributeValue>',
  '    </saml:Attribute>',
  '    <saml:Attribute Name="role">',
  '      <saml:AttributeValue>admin</saml:AttributeValue>',
  '    </saml:Attribute>',
  '  </saml:AttributeStatement>',
  '  <ds:Signature>',
  '    <ds:SignatureValue>MIIB..a9F=</ds:SignatureValue>',
  '  </ds:Signature>',
  '</saml:Assertion>',
];

const JWT_HEADER = [
  '{ "alg": "RS256",',
  '  "typ": "JWT",',
  '  "kid": "idp-2026" }',
];
const JWT_PAYLOAD = [
  '{ "iss": "https://idp.corp.com",',
  '  "sub": "alice@corp",',
  '  "aud": "pgcode-web",',
  '  "exp": 1718900000,',
  '  "nonce": "n-7Hq2Lp",',
  '  "email": "alice@corp.com" }',
];
const JWT_SIG = [
  'RS256( base64url(header) + "." +',
  '       base64url(payload), idpKey )',
  '= K8sLp2..a9FQ',
];

// frame: { phase, active:[actorKey...], msg:{from,to,dir,label}|null,
//          params:[{k,v,xml?,jwt?}], inFlight, note }
function buildFrames(protocol) {
  const saml = protocol === 'saml';
  const frames = [];

  frames.push({
    phase: 'init',
    active: [],
    msg: null,
    params: [],
    inFlight: '—',
    note: saml
      ? 'SAML 2.0 web SSO. The service provider (SP) hands the browser off to the identity provider (IdP), which returns a signed XML assertion to the SP\'s ACS URL via an HTTP-POST binding. Step through each hop and watch the assertion take shape in the token panel.'
      : 'OpenID Connect (OIDC) — an identity layer on top of OAuth2. The relying party (RP) runs the authorization-code grant with scope=openid, and the provider returns a signed JWT id_token alongside the access token. Step through each hop and watch the JWT take shape.',
  });

  if (saml) {
    frames.push({
      phase: 'request',
      active: ['user', 'app'],
      msg: { from: 'user', to: 'app', dir: 'fwd', label: 'GET /dashboard (no session)' },
      params: [
        { k: 'target', v: SAMPLE.sp + '/dashboard' },
        { k: 'session', v: 'none' },
      ],
      inFlight: 'unauthenticated request',
      note: 'The user hits a protected SP page with no session. The SP must establish identity, so it builds a SAML AuthnRequest and redirects the browser to the IdP.',
    });
    frames.push({
      phase: 'request',
      active: ['app', 'idp'],
      msg: { from: 'app', to: 'idp', dir: 'fwd', label: 'redirect: SAMLRequest=AuthnRequest' },
      params: [
        { k: 'binding', v: 'HTTP-Redirect' },
        { k: 'Issuer', v: SAMPLE.entityId },
        { k: 'ID', v: SAMPLE.reqId },
        { k: 'AssertionConsumerServiceURL', v: SAMPLE.acs },
      ],
      inFlight: 'SAMLRequest (deflated, base64)',
      note: 'The SP issues an AuthnRequest — an XML document naming itself (Issuer) and where to send the answer (the ACS URL). It is deflated, base64-encoded, and carried in the redirect to the IdP. No password is involved on the SP side.',
    });
    frames.push({
      phase: 'login',
      active: ['idp', 'dir'],
      msg: { from: 'idp', to: 'dir', dir: 'fwd', label: 'authenticate user' },
      params: [
        { k: 'principal', v: SAMPLE.subject },
        { k: 'method', v: 'password + MFA' },
        { k: 'result', v: 'verified' },
      ],
      inFlight: 'IdP authenticates alice',
      note: 'The IdP runs its own login — password, MFA, whatever it enforces — against the directory. The SP never sees these credentials; that separation is the whole point of federation.',
    });
    frames.push({
      phase: 'assert',
      active: ['idp'],
      msg: { from: 'idp', to: 'idp', dir: 'self', label: 'build + sign <saml:Assertion>' },
      params: [
        { k: 'NameID', v: SAMPLE.subject, xml: true },
        { k: 'Attribute email', v: SAMPLE.email, xml: true },
        { k: 'Attribute role', v: 'admin', xml: true },
        { k: 'ds:Signature', v: 'XML-DSig over assertion', xml: true },
      ],
      inFlight: 'signed XML assertion',
      note: 'The IdP builds the assertion: a NameID identifying alice, an AttributeStatement carrying email and role, and a <ds:Signature> computed over the XML using XML-DSig. The signature is an element INSIDE the XML — that is the SAML way.',
    });
    frames.push({
      phase: 'callback',
      active: ['idp', 'app'],
      msg: { from: 'idp', to: 'app', dir: 'back', label: 'HTTP-POST -> ACS { SAMLResponse }' },
      params: [
        { k: 'binding', v: 'HTTP-POST' },
        { k: 'destination', v: SAMPLE.acs },
        { k: 'SAMLResponse', v: 'base64(signed Assertion)', xml: true },
        { k: 'InResponseTo', v: SAMPLE.reqId },
      ],
      inFlight: 'SAMLResponse via auto-POST form',
      note: 'The IdP returns the SAMLResponse using the HTTP-POST binding: a tiny auto-submitting HTML form that POSTs the base64 assertion straight to the SP\'s ACS URL through the browser. The assertion rides the front channel, but its signature protects it.',
    });
    frames.push({
      phase: 'validate',
      active: ['app'],
      msg: { from: 'app', to: 'app', dir: 'self', label: 'verify XML signature + conditions' },
      params: [
        { k: 'signature', v: 'XML-DSig valid', xml: true },
        { k: 'Issuer', v: SAMPLE.iss },
        { k: 'Audience', v: SAMPLE.entityId },
        { k: 'NotOnOrAfter', v: 'within window' },
        { k: 'InResponseTo', v: 'matches ' + SAMPLE.reqId },
      ],
      inFlight: 'assertion validated',
      note: 'The SP validates the XML signature against the IdP\'s certificate, checks the Audience names this SP, confirms the time conditions are current, and matches InResponseTo to the request it sent. Only then does it trust the attributes inside.',
    });
    frames.push({
      phase: 'session',
      active: ['app', 'user'],
      msg: { from: 'app', to: 'user', dir: 'back', label: 'Set-Cookie: session' },
      params: [
        { k: 'subject', v: SAMPLE.subject },
        { k: 'email', v: SAMPLE.email },
        { k: 'role', v: 'admin' },
        { k: 'status', v: '200 OK' },
      ],
      inFlight: 'SP session established',
      note: 'The SP reads the attributes, creates a local session, and sets a session cookie. The user lands on the dashboard logged in — having typed their password only at the IdP, never at the SP.',
    });
    return frames;
  }

  // OIDC flow
  frames.push({
    phase: 'request',
    active: ['user', 'app'],
    msg: { from: 'user', to: 'app', dir: 'fwd', label: 'click "Log in"' },
    params: [
      { k: 'action', v: 'login' },
      { k: 'session', v: 'none' },
    ],
    inFlight: 'login intent',
    note: 'The user clicks "Log in" on the relying party. The RP holds no credentials — it is about to start the OAuth2 authorization-code grant with the openid scope, which is what turns plain OAuth2 into OIDC.',
  });
  frames.push({
    phase: 'request',
    active: ['app', 'idp'],
    msg: { from: 'app', to: 'idp', dir: 'fwd', label: 'GET /authorize' },
    params: [
      { k: 'response_type', v: 'code' },
      { k: 'scope', v: 'openid email profile' },
      { k: 'client_id', v: SAMPLE.rp },
      { k: 'redirect_uri', v: SAMPLE.redirect },
      { k: 'nonce', v: SAMPLE.nonce, jwt: true },
    ],
    inFlight: 'scope=openid (id_token requested)',
    note: 'The RP redirects to the provider\'s /authorize endpoint asking for response_type=code. The openid scope is the trigger that asks for an id_token; the nonce is a random value the RP will later check inside that token to tie it to this exact request.',
  });
  frames.push({
    phase: 'login',
    active: ['idp', 'dir'],
    msg: { from: 'idp', to: 'dir', dir: 'fwd', label: 'authenticate user' },
    params: [
      { k: 'principal', v: SAMPLE.subject },
      { k: 'method', v: 'password + MFA' },
      { k: 'consent', v: 'email, profile approved' },
    ],
    inFlight: 'IdP authenticates alice',
    note: 'The provider authenticates the user against the directory and shows a consent screen for the requested scopes. As with SAML, the RP never sees the password — only the provider does.',
  });
  frames.push({
    phase: 'callback',
    active: ['idp', 'app'],
    msg: { from: 'idp', to: 'app', dir: 'back', label: 'redirect: code + state' },
    params: [
      { k: 'code', v: SAMPLE.code },
      { k: 'state', v: 'xyz789' },
      { k: 'binding', v: 'browser redirect' },
    ],
    inFlight: 'code=' + SAMPLE.code,
    note: 'The provider redirects back to redirect_uri with a short-lived authorization code in the query string. The code is not the id_token — it is a one-time ticket the RP will exchange on a back channel where no browser can watch.',
  });
  frames.push({
    phase: 'exchange',
    active: ['app', 'idp'],
    msg: { from: 'app', to: 'idp', dir: 'fwd', label: 'POST /token' },
    params: [
      { k: 'grant_type', v: 'authorization_code' },
      { k: 'code', v: SAMPLE.code },
      { k: 'client_id', v: SAMPLE.rp },
      { k: 'client_secret', v: 'cs_live_••••' },
    ],
    inFlight: 'code exchange (back channel)',
    note: 'The RP POSTs the code to the /token endpoint server-to-server, authenticating with its client_secret. This call never touches the browser, so the secret and the resulting tokens stay off the front channel.',
  });
  frames.push({
    phase: 'issue',
    active: ['idp'],
    msg: { from: 'idp', to: 'idp', dir: 'self', label: 'mint + sign JWT id_token' },
    params: [
      { k: 'header.alg', v: 'RS256', jwt: true },
      { k: 'payload.sub', v: SAMPLE.subject, jwt: true },
      { k: 'payload.email', v: SAMPLE.email, jwt: true },
      { k: 'payload.nonce', v: SAMPLE.nonce, jwt: true },
      { k: 'signature', v: 'JWS over header.payload', jwt: true },
    ],
    inFlight: 'JWT: header.payload.signature',
    note: 'The provider mints the id_token: a JWT with a header (alg=RS256), a payload of claims (iss, sub, aud, exp, nonce, email), and a JWS signature over the base64url(header).base64url(payload). Unlike SAML, the signature is the third dot-separated segment, not an element inside the body.',
  });
  frames.push({
    phase: 'issue',
    active: ['idp', 'app'],
    msg: { from: 'idp', to: 'app', dir: 'back', label: '200 OK { id_token, access_token }' },
    params: [
      { k: 'id_token', v: 'eyJ...header.eyJ...payload.sig', jwt: true },
      { k: 'access_token', v: 'at_7Hq2Lp' },
      { k: 'token_type', v: 'Bearer' },
      { k: 'expires_in', v: '3600' },
    ],
    inFlight: 'id_token (JWT) returned',
    note: 'The token endpoint returns both an id_token (the JWT proving who the user is, for the RP to consume) and an access_token (for calling APIs). The id_token is the OIDC-specific piece — it answers "who logged in," which plain OAuth2 never promised.',
  });
  frames.push({
    phase: 'validate',
    active: ['app'],
    msg: { from: 'app', to: 'app', dir: 'self', label: 'verify JWS + claims (iss/aud/exp/nonce)' },
    params: [
      { k: 'signature', v: 'JWS valid (RS256, kid)', jwt: true },
      { k: 'iss', v: SAMPLE.iss },
      { k: 'aud', v: SAMPLE.aud },
      { k: 'exp', v: 'not expired' },
      { k: 'nonce', v: 'matches ' + SAMPLE.nonce },
    ],
    inFlight: 'id_token validated',
    note: 'The RP fetches the provider\'s public key (by kid from the JWKS endpoint), verifies the JWS signature, and checks the claims: iss is the expected provider, aud is this client, exp is in the future, and nonce matches what it sent. Only then does it trust the identity.',
  });
  frames.push({
    phase: 'session',
    active: ['app', 'user'],
    msg: { from: 'app', to: 'user', dir: 'back', label: 'Set-Cookie: session' },
    params: [
      { k: 'sub', v: SAMPLE.subject },
      { k: 'email', v: SAMPLE.email },
      { k: 'status', v: '200 OK' },
    ],
    inFlight: 'RP session established',
    note: 'The RP creates a local session from the verified claims and sets a session cookie. Same outcome as the SAML flow — alice is logged in — but the proof travelled as a compact JWT over an OAuth2 token exchange instead of an XML assertion over an HTTP-POST binding.',
  });
  return frames;
}

const RUN_DELAY_MS = 1500;

export default function SamlVsOidcViz() {
  const [protocol, setProtocol] = useState('saml');
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const runTimer = useRef(null);

  const frames = useMemo(() => buildFrames(protocol), [protocol]);
  const ACTORS = ACTOR_SETS[protocol];
  const ACTOR_INDEX = useMemo(
    () => Object.fromEntries(ACTORS.map((a, i) => [a.key, i])),
    [ACTORS],
  );
  const saml = protocol === 'saml';
  const totalSteps = frames.length;
  const current = frames[Math.min(step, totalSteps - 1)];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(RUN_DELAY_MS / speed);

  useEffect(() => {
    if (!isRunning) return undefined;
    runTimer.current = setTimeout(() => {
      setStep((s) => Math.min(s + 1, totalSteps - 1));
    }, delay);
    return () => {
      if (runTimer.current) {
        clearTimeout(runTimer.current);
        runTimer.current = null;
      }
    };
  }, [isRunning, step, delay, totalSteps]);

  useEffect(() => () => {
    if (runTimer.current) clearTimeout(runTimer.current);
  }, []);

  const reset = () => {
    setIsRunning(false);
    setStep(0);
  };

  const switchProtocol = (next) => {
    if (next === protocol) return;
    setIsRunning(false);
    setStep(0);
    setProtocol(next);
  };

  // SVG geometry — four actor lanes with vertical lifelines.
  const W = 940;
  const H = 360;
  const laneTop = 56;
  const laneBottom = H - 26;
  const pad = 90;
  const laneDenom = Math.max(ACTORS.length - 1, 1);
  const laneX = (i) => pad + (i / laneDenom) * (W - 2 * pad);
  const msgY = laneTop + 118;

  const ActorIcon = (icon, cls) => {
    if (icon === 'user') return <User width={20} height={20} className={cls} />;
    if (icon === 'app') return <AppWindow width={20} height={20} className={cls} />;
    if (icon === 'key') return <KeyRound width={20} height={20} className={cls} />;
    return <Database width={20} height={20} className={cls} />;
  };

  const playLabel = isRunningRaw && step < totalSteps - 1
    ? 'Pause'
    : (step >= totalSteps - 1 ? 'Replay' : 'Play');

  const msg = current.msg;
  const isActive = (key) => current.active.includes(key);

  let msgLine = null;
  if (msg && msg.dir !== 'self') {
    const xa = laneX(ACTOR_INDEX[msg.from]);
    const xb = laneX(ACTOR_INDEX[msg.to]);
    msgLine = { xa, xb, mid: (xa + xb) / 2, ltr: xb >= xa };
  }
  const selfActor = msg && msg.dir === 'self' ? laneX(ACTOR_INDEX[msg.from]) : null;

  const toneForDir = (dir) => (dir === 'back' ? 'back' : dir === 'self' ? 'self' : 'fwd');

  return (
    <div className="sovz">
      <div className="sovz-head">
        <h3 className="sovz-title">SAML vs OIDC — the same login, two token formats</h3>
        <p className="sovz-sub">
          Trace one federated sign-in through both protocols. SAML POSTs a signed XML assertion to
          the SP; OIDC returns a signed JWT id_token on top of OAuth2. Toggle to relabel the actors,
          swap the hops, and watch the token panel switch from XML-DSig to JWS.
        </p>
      </div>

      <div className="sovz-controls">
        <div className="sovz-protocol" role="group" aria-label="Protocol">
          <button
            type="button"
            className={`sovz-proto-btn ${saml ? 'is-on' : ''}`}
            onClick={() => switchProtocol('saml')}
            aria-pressed={saml}
          >
            <FileCode size={14} /> SAML
          </button>
          <button
            type="button"
            className={`sovz-proto-btn ${!saml ? 'is-on' : ''}`}
            onClick={() => switchProtocol('oidc')}
            aria-pressed={!saml}
          >
            <Braces size={14} /> OIDC
          </button>
        </div>

        <span className="sovz-client-tag">{saml ? 'XML assertion · HTTP-POST' : 'JWT id_token · OAuth2 code'}</span>

        <label className="sovz-speed">
          <span className="sovz-input-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="sovz-speed-range"
            aria-label="Playback speed"
          />
          <span className="sovz-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <span className="sovz-spacer" aria-hidden="true" />

        <div className="sovz-buttons">
          <button
            type="button"
            className="sovz-btn sovz-btn-primary"
            onClick={() => {
              if (step >= totalSteps - 1) setStep(0);
              setIsRunning((v) => !v);
            }}
          >
            {isRunningRaw && step < totalSteps - 1 ? <Pause size={14} /> : <Play size={14} />}
            {playLabel}
          </button>
          <button
            type="button"
            className="sovz-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="sovz-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="sovz-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="sovz-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="sovz-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="sovz-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="sovz-arr-fwd" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="sovz-ah is-fwd" />
            </marker>
            <marker id="sovz-arr-back" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="sovz-ah is-back" />
            </marker>
            <marker id="sovz-arr-self" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="sovz-ah is-self" />
            </marker>
          </defs>

          {/* lifelines */}
          {ACTORS.map((a, i) => {
            const x = laneX(i);
            const on = isActive(a.key);
            return (
              <line
                key={`life-${a.key}`}
                className={`sovz-life ${on ? 'is-on' : ''}`}
                x1={x}
                y1={laneTop + 44}
                x2={x}
                y2={laneBottom}
              />
            );
          })}

          {/* in-flight message */}
          {msgLine && (
            <g>
              <line
                className={`sovz-msg is-${toneForDir(msg.dir)}`}
                x1={msgLine.ltr ? msgLine.xa + 6 : msgLine.xa - 6}
                y1={msgY}
                x2={msgLine.ltr ? msgLine.xb - 10 : msgLine.xb + 10}
                y2={msgY}
                markerEnd={`url(#sovz-arr-${toneForDir(msg.dir)})`}
              />
              <text
                className={`sovz-msg-label is-${toneForDir(msg.dir)}`}
                x={msgLine.mid}
                y={msgY - 10}
                textAnchor="middle"
              >
                {msg.label}
              </text>
            </g>
          )}
          {selfActor != null && (
            <g>
              <path
                className="sovz-msg is-self"
                d={`M ${selfActor} ${msgY - 14} q 54 0 54 16 q 0 16 -54 16`}
                fill="none"
                markerEnd="url(#sovz-arr-self)"
              />
              <text className="sovz-msg-label is-self" x={selfActor + 60} y={msgY + 4} textAnchor="start">
                {msg.label}
              </text>
            </g>
          )}

          {/* actor headers */}
          {ACTORS.map((a, i) => {
            const x = laneX(i);
            const on = isActive(a.key);
            return (
              <g key={`actor-${a.key}`}>
                <rect
                  className={`sovz-actor ${on ? 'is-on' : ''}`}
                  x={x - 62}
                  y={laneTop - 24}
                  width={124}
                  height={62}
                  rx={9}
                />
                <g transform={`translate(${x - 10}, ${laneTop - 16})`}>
                  {ActorIcon(a.icon, `sovz-actor-ic ${on ? 'is-on' : ''}`)}
                </g>
                <text className={`sovz-actor-label ${on ? 'is-on' : ''}`} x={x} y={laneTop + 12} textAnchor="middle">
                  {a.label}
                </text>
                <text className="sovz-actor-sub" x={x} y={laneTop + 27} textAnchor="middle">
                  {a.sub}
                </text>
              </g>
            );
          })}

          {/* phase ribbon */}
          <text className="sovz-phase-tag" x={W / 2} y={laneBottom + 16} textAnchor="middle">
            {`${PHASE_LABEL[current.phase] || current.phase} · in flight: ${current.inFlight}`}
          </text>
        </svg>
      </div>

      <div className="sovz-body">
        <div className="sovz-payload">
          <div className="sovz-payload-head">
            <ArrowRight size={13} className="sovz-ic" />
            <span className="sovz-payload-title">
              {msg ? (msg.dir === 'self' ? 'local step' : `${msg.from} -> ${msg.to}`) : 'no message'}
            </span>
            <span className="sovz-payload-label">{msg ? msg.label : 'idle'}</span>
          </div>
          <div className="sovz-params">
            {current.params.length === 0 && (
              <div className="sovz-param-empty">No params on the wire yet — press Play or Step.</div>
            )}
            {current.params.map((p) => (
              <div
                key={`${p.k}-${p.v}`}
                className={`sovz-param ${p.xml ? 'is-xml' : ''} ${p.jwt ? 'is-jwt' : ''}`}
              >
                <span className="sovz-param-k">{p.k}</span>
                <span className="sovz-param-eq">=</span>
                <span className="sovz-param-v">{p.v}</span>
                {p.xml && <span className="sovz-param-badge is-xml">XML</span>}
                {p.jwt && <span className="sovz-param-badge is-jwt">JWT</span>}
              </div>
            ))}
          </div>
        </div>

        <div className="sovz-metrics">
          <div className="sovz-metric">
            <span className="sovz-metric-label">protocol</span>
            <span className="sovz-metric-value">{saml ? 'SAML 2.0' : 'OIDC'}</span>
          </div>
          <div className="sovz-metric">
            <span className="sovz-metric-label">token format</span>
            <span className="sovz-metric-value">{saml ? 'XML assertion' : 'JWT id_token'}</span>
          </div>
          <div className="sovz-metric">
            <span className="sovz-metric-label">binding / transport</span>
            <span className="sovz-metric-value">{saml ? 'HTTP-POST / redirect' : 'OAuth2 code + token'}</span>
          </div>
          <div className="sovz-metric">
            <span className="sovz-metric-label">signature</span>
            <span className="sovz-metric-value">{saml ? 'XML-DSig' : 'JWS (RS256)'}</span>
          </div>
          <div className="sovz-metric sovz-metric-dim">
            <span className="sovz-metric-label">current hop</span>
            <span className="sovz-metric-value">{PHASE_LABEL[current.phase] || current.phase}</span>
          </div>
          <div className="sovz-metric sovz-metric-dim">
            <span className="sovz-metric-label">in flight</span>
            <span className="sovz-metric-value">{current.inFlight}</span>
          </div>
        </div>
      </div>

      {/* token panel — contrasts the assertion vs the id_token */}
      <div className="sovz-token">
        <div className="sovz-token-head">
          {saml ? <FileCode size={14} className="sovz-ic is-xml" /> : <Braces size={14} className="sovz-ic is-jwt" />}
          <span className="sovz-token-title">
            {saml ? 'SAML token — signed XML assertion' : 'OIDC token — signed JWT id_token'}
          </span>
          <span className="sovz-token-tag">{saml ? 'signature is an element inside the XML' : 'signature is the third dot-segment'}</span>
        </div>

        {saml ? (
          <pre className="sovz-code is-xml" aria-label="SAML XML assertion">
            {SAML_XML.map((line) => `${line}\n`).join('')}
          </pre>
        ) : (
          <div className="sovz-jwt">
            <div className="sovz-jwt-part is-header">
              <span className="sovz-jwt-tag">header</span>
              <pre className="sovz-code is-jwt">{JWT_HEADER.map((l) => `${l}\n`).join('')}</pre>
            </div>
            <span className="sovz-jwt-dot">.</span>
            <div className="sovz-jwt-part is-payload">
              <span className="sovz-jwt-tag">payload (claims)</span>
              <pre className="sovz-code is-jwt">{JWT_PAYLOAD.map((l) => `${l}\n`).join('')}</pre>
            </div>
            <span className="sovz-jwt-dot">.</span>
            <div className="sovz-jwt-part is-sig">
              <span className="sovz-jwt-tag">signature</span>
              <pre className="sovz-code is-jwt">{JWT_SIG.map((l) => `${l}\n`).join('')}</pre>
            </div>
          </div>
        )}

        <div className="sovz-token-foot">
          {saml
            ? 'XML carries attributes as nested elements; a <ds:Signature> block signs the document tree (XML-DSig over canonicalized XML).'
            : 'Three Base64URL segments joined by dots; the JWS signature covers base64url(header).base64url(payload), verifiable with the provider\'s public key.'}
        </div>
      </div>

      <div className="sovz-narration">
        <span className="sovz-narration-label">
          {PHASE_LABEL[current.phase] || current.phase}
        </span>
        <span className="sovz-narration-body">{current.note}</span>
      </div>

      <div className="sovz-summary">
        <ShieldCheck size={13} className="sovz-ic is-ok" />
        <span className="sovz-summary-text">
          Same login, two protocols: SAML ships a signed XML assertion to the SP’s ACS over an
          HTTP-POST binding; OIDC returns a signed JWT id_token over an OAuth2 code exchange. Both
          end with a local session and a password typed only at the IdP.
        </span>
      </div>

      <div className="sovz-legend">
        <span className="sovz-legend-item"><ArrowRight size={13} className="sovz-ic is-fwd" /> request hop (forward)</span>
        <span className="sovz-legend-item"><Check size={13} className="sovz-ic is-back" /> response hop (back)</span>
        <span className="sovz-legend-item"><FileCode size={13} className="sovz-ic is-xml" /> XML assertion field (SAML)</span>
        <span className="sovz-legend-item"><Braces size={13} className="sovz-ic is-jwt" /> JWT claim / segment (OIDC)</span>
      </div>
    </div>
  );
}
