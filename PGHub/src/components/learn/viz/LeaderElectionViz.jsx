import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, Crown, Vote, Skull, CheckCircle, XCircle } from 'lucide-react';
import './LeaderElectionViz.css';

// Raft-style leader election across a 5-node cluster. A follower whose election
// timeout fires bumps its term, becomes a candidate, votes for itself, and asks
// every other node for a vote. A node grants at most one vote per term, to the
// first candidate it hears. A candidate that collects a strict majority
// (>= 3 of 5) becomes leader for that term and starts sending heartbeats.
//
// THREE SCENARIOS:
//   clean    — one follower times out, requests votes, wins cleanly.
//   failover — an established leader dies; a follower times out, starts a new
//              term, wins with the dead node excluded from quorum.
//   split    — two candidates open the same term at once; the votes split 2-2
//              (one node unreachable), nobody reaches majority, the term times
//              out, and a single candidate then wins the next term. Randomized
//              timeouts are what break the tie in practice.

const N = 5;
const MAJORITY = Math.floor(N / 2) + 1; // 3

// follower | candidate | leader | down
function freshNodes(states, term, votedFor) {
  return Array.from({ length: N }, (_, i) => ({
    id: i + 1,
    state: states[i] || 'follower',
    term: term[i] != null ? term[i] : 0,
    votedFor: votedFor && votedFor[i] != null ? votedFor[i] : null,
  }));
}

// Shared frame shape:
//   nodes      : [{ id, state, term, votedFor }]
//   term       : cluster term being contested / current
//   candidates : [nodeId,...] nodes currently in candidate state
//   leader     : nodeId | null
//   votesFor   : { candidateId: [voterId,...] }  granted votes this term
//   edges      : [{ from, to, kind }]  kind: request | grant | reject | heartbeat
//   active     : nodeId | -1   node taking the spotlight action
//   phase      : init | follower-timeout | requesting-votes | elected | split-vote | re-election | heartbeat
//   note       : narration

function snapMaker(getState) {
  return (extra) => {
    const s = getState();
    return {
      nodes: s.nodes.map((n) => ({ ...n })),
      term: s.term,
      candidates: [...s.candidates],
      leader: s.leader,
      votesFor: Object.fromEntries(Object.entries(s.votesFor).map(([k, v]) => [k, [...v]])),
      edges: s.edges.map((e) => ({ ...e })),
      active: -1,
      phase: 'requesting-votes',
      note: '',
      ...extra,
    };
  };
}

function buildClean() {
  const frames = [];
  const state = {
    nodes: freshNodes([], [0, 0, 0, 0, 0], []),
    term: 0,
    candidates: [],
    leader: null,
    votesFor: {},
    edges: [],
  };
  const snap = snapMaker(() => state);

  frames.push(snap({
    phase: 'init',
    note: `Five nodes boot as followers at term 0, no leader yet. A node grants at most one vote per term. Winning the cluster needs a strict majority — ${MAJORITY} of ${N} votes. Watch a single follower time out and campaign.`,
  }));

  // Node 3 times out, becomes candidate, bumps term, votes for itself.
  state.term = 1;
  const cand = 3;
  state.nodes[cand - 1].state = 'candidate';
  state.nodes[cand - 1].term = 1;
  state.nodes[cand - 1].votedFor = cand;
  state.candidates = [cand];
  state.votesFor = { [cand]: [cand] };
  frames.push(snap({
    active: cand,
    phase: 'follower-timeout',
    note: `Node ${cand}'s election timeout fires first. It bumps the term to 1, switches to candidate, and votes for itself — tally ${cand}: 1/${N}.`,
  }));

  // Request votes from everyone else.
  state.edges = state.nodes
    .filter((n) => n.id !== cand)
    .map((n) => ({ from: cand, to: n.id, kind: 'request' }));
  frames.push(snap({
    active: cand,
    phase: 'requesting-votes',
    note: `Node ${cand} broadcasts RequestVote(term 1) to nodes 1, 2, 4, and 5. Each node decides whether it has already voted in term 1.`,
  }));

  // Votes come back one at a time until majority.
  const granters = [1, 2];
  granters.forEach((g, k) => {
    state.nodes[g - 1].votedFor = cand;
    state.nodes[g - 1].term = 1;
    state.votesFor[cand].push(g);
    state.edges = [{ from: g, to: cand, kind: 'grant' }];
    const tally = state.votesFor[cand].length;
    frames.push(snap({
      active: g,
      phase: 'requesting-votes',
      note: `Node ${g} has not voted in term 1, so it grants its vote to node ${cand} — tally ${cand}: ${tally}/${N}, majority = ${MAJORITY}.${k === granters.length - 1 && tally >= MAJORITY ? ' Majority reached.' : ''}`,
    }));
  });

  // Elected.
  state.nodes[cand - 1].state = 'leader';
  state.leader = cand;
  state.candidates = [];
  state.edges = state.nodes
    .filter((n) => n.id !== cand)
    .map((n) => ({ from: cand, to: n.id, kind: 'heartbeat' }));
  frames.push(snap({
    active: cand,
    phase: 'elected',
    note: `Node ${cand} has ${state.votesFor[cand].length}/${N} >= ${MAJORITY} — it becomes leader for term 1 and starts sending heartbeats. Nodes 4 and 5 never needed to answer; the majority already settled it.`,
  }));

  frames.push(snap({
    phase: 'heartbeat',
    leader: cand,
    note: `Stable. Node ${cand} is leader of term 1; its heartbeats reset every follower's election timeout, so no one else times out. One leader, one term — exactly what election guarantees.`,
  }));

  return frames;
}

function buildFailover() {
  const frames = [];
  const oldLeader = 1;
  const state = {
    nodes: freshNodes(
      ['leader', 'follower', 'follower', 'follower', 'follower'],
      [3, 3, 3, 3, 3],
      [oldLeader, oldLeader, oldLeader, oldLeader, oldLeader],
    ),
    term: 3,
    candidates: [],
    leader: oldLeader,
    votesFor: { [oldLeader]: [1, 2, 3, 4, 5] },
    edges: [],
  };
  const snap = snapMaker(() => state);

  frames.push(snap({
    phase: 'init',
    leader: oldLeader,
    note: `Node ${oldLeader} is the established leader of term 3 and the other four are healthy followers. Heartbeats keep their timeouts from firing. Then the leader dies.`,
  }));

  // Leader goes down.
  state.nodes[oldLeader - 1].state = 'down';
  state.leader = null;
  state.edges = [];
  frames.push(snap({
    active: oldLeader,
    phase: 'follower-timeout',
    note: `Node ${oldLeader} crashes. Its heartbeats stop, so it is greyed out and excluded from every future quorum — only ${N - 1} nodes can vote now.`,
  }));

  // Node 4 times out first.
  const cand = 4;
  state.term = 4;
  state.nodes[cand - 1].state = 'candidate';
  state.nodes[cand - 1].term = 4;
  state.nodes[cand - 1].votedFor = cand;
  state.candidates = [cand];
  state.votesFor = { [cand]: [cand] };
  frames.push(snap({
    active: cand,
    phase: 'follower-timeout',
    note: `With no heartbeats arriving, node ${cand}'s timeout fires first. It bumps the term to 4, becomes a candidate, and votes for itself — tally ${cand}: 1/${N}.`,
  }));

  // Request votes (dead node included in the message but never answers).
  state.edges = [2, 3, 5].map((id) => ({ from: cand, to: id, kind: 'request' }))
    .concat([{ from: cand, to: oldLeader, kind: 'reject' }]);
  frames.push(snap({
    active: cand,
    phase: 'requesting-votes',
    note: `Node ${cand} sends RequestVote(term 4) to the others. The dead node ${oldLeader} cannot reply — it is out of the quorum, so node ${cand} only needs ${MAJORITY} votes from the survivors.`,
  }));

  // Two live nodes grant -> majority of 3.
  [2, 3].forEach((g) => {
    state.nodes[g - 1].votedFor = cand;
    state.nodes[g - 1].term = 4;
    state.votesFor[cand].push(g);
    state.edges = [{ from: g, to: cand, kind: 'grant' }];
    const tally = state.votesFor[cand].length;
    frames.push(snap({
      active: g,
      phase: 'requesting-votes',
      note: `Node ${g} sees term 4 > its term 3 and has not voted yet, so it grants the vote — tally ${cand}: ${tally}/${N}.${tally >= MAJORITY ? ` That is the majority (${MAJORITY}).` : ''}`,
    }));
  });

  // New leader.
  state.nodes[cand - 1].state = 'leader';
  state.leader = cand;
  state.candidates = [];
  state.edges = [2, 3, 5].map((id) => ({ from: cand, to: id, kind: 'heartbeat' }));
  frames.push(snap({
    active: cand,
    phase: 'elected',
    note: `Node ${cand} reached ${state.votesFor[cand].length}/${N} >= ${MAJORITY} and becomes leader for term 4. The cluster recovered from the crash with a fresh term and a fresh leader.`,
  }));

  frames.push(snap({
    phase: 'heartbeat',
    leader: cand,
    note: `Failed over. Node ${cand} now leads term 4; nodes 2, 3, and 5 follow it. If node ${oldLeader} ever revives it will see the higher term and step down to follower — there is never more than one leader per term.`,
  }));

  return frames;
}

function buildSplit() {
  const frames = [];
  const state = {
    nodes: freshNodes([], [4, 4, 4, 4, 4], []),
    term: 4,
    candidates: [],
    leader: null,
    votesFor: {},
    edges: [],
  };
  const snap = snapMaker(() => state);

  frames.push(snap({
    phase: 'init',
    note: `Five followers at term 4, no leader. This time two nodes time out at almost the same instant and both campaign for the SAME term — the classic split-vote stalemate.`,
  }));

  // Two candidates open term 5 simultaneously.
  const c1 = 2;
  const c2 = 5;
  state.term = 5;
  [c1, c2].forEach((c) => {
    state.nodes[c - 1].state = 'candidate';
    state.nodes[c - 1].term = 5;
    state.nodes[c - 1].votedFor = c;
  });
  state.candidates = [c1, c2];
  state.votesFor = { [c1]: [c1], [c2]: [c2] };
  frames.push(snap({
    active: c1,
    phase: 'split-vote',
    note: `Nodes ${c1} and ${c2} both time out together. Each bumps to term 5, becomes a candidate, and votes for itself — tally ${c1}: 1/${N}, ${c2}: 1/${N}.`,
  }));

  // Both request votes.
  state.edges = [
    { from: c1, to: 1, kind: 'request' },
    { from: c2, to: 4, kind: 'request' },
    { from: c1, to: 3, kind: 'request' },
    { from: c2, to: 3, kind: 'request' },
  ];
  frames.push(snap({
    active: c1,
    phase: 'split-vote',
    note: `Both candidates broadcast RequestVote(term 5). Node 1 hears ${c1} first; node 4 hears ${c2} first; node 3 is unreachable this round and replies to neither.`,
  }));

  // Node 1 grants c1.
  state.nodes[0].votedFor = c1;
  state.nodes[0].term = 5;
  state.votesFor[c1].push(1);
  state.edges = [{ from: 1, to: c1, kind: 'grant' }];
  frames.push(snap({
    active: 1,
    phase: 'split-vote',
    note: `Node 1 votes for node ${c1} — tally ${c1}: 2/${N}. Having voted in term 5, node 1 will refuse node ${c2}.`,
  }));

  // Node 4 grants c2.
  state.nodes[3].votedFor = c2;
  state.nodes[3].term = 5;
  state.votesFor[c2].push(4);
  state.edges = [{ from: 4, to: c2, kind: 'grant' }];
  frames.push(snap({
    active: 4,
    phase: 'split-vote',
    note: `Node 4 votes for node ${c2} — tally ${c2}: 2/${N}. The cluster is now split 2-2 with node 3 silent.`,
  }));

  // Node 3 unreachable -> rejects both implicitly.
  state.edges = [
    { from: 3, to: c1, kind: 'reject' },
    { from: 3, to: c2, kind: 'reject' },
  ];
  frames.push(snap({
    active: 3,
    phase: 'split-vote',
    note: `Node 3 never answers (partitioned this round), so neither candidate gets a third vote. Both are stuck at 2/${N} < ${MAJORITY}. No one wins term 5.`,
  }));

  // Term times out, both step back to follower.
  state.candidates = [];
  state.nodes[c1 - 1].state = 'follower';
  state.nodes[c2 - 1].state = 'follower';
  state.edges = [];
  frames.push(snap({
    phase: 'split-vote',
    note: `Election timeout expires with no leader. Both candidates give up term 5 and return to follower. Randomized timeouts now make one of them wait noticeably longer than the other.`,
  }));

  // Single candidate retries on term 6, node 3 back.
  const winner = c1;
  state.term = 6;
  state.nodes[winner - 1].state = 'candidate';
  state.nodes[winner - 1].term = 6;
  state.nodes[winner - 1].votedFor = winner;
  state.candidates = [winner];
  state.votesFor = { [winner]: [winner] };
  state.edges = [1, 3, 4].map((id) => ({ from: winner, to: id, kind: 'request' }));
  frames.push(snap({
    active: winner,
    phase: 're-election',
    note: `Node ${winner}'s randomized timeout fires first this time, alone. It opens term 6, votes for itself, and requests votes — and node 3 is reachable again.`,
  }));

  // Grants from 1, 3, 4 -> majority.
  [1, 3, 4].forEach((g) => {
    state.nodes[g - 1].votedFor = winner;
    state.nodes[g - 1].term = 6;
    state.votesFor[winner].push(g);
    state.edges = [{ from: g, to: winner, kind: 'grant' }];
    const tally = state.votesFor[winner].length;
    frames.push(snap({
      active: g,
      phase: 're-election',
      note: `Node ${g} grants its term-6 vote to node ${winner} — tally ${winner}: ${tally}/${N}.${tally >= MAJORITY ? ` Majority (${MAJORITY}) reached.` : ''}`,
    }));
  });

  state.nodes[winner - 1].state = 'leader';
  state.leader = winner;
  state.candidates = [];
  state.edges = [1, 3, 4, c2].map((id) => ({ from: winner, to: id, kind: 'heartbeat' }));
  frames.push(snap({
    active: winner,
    phase: 'elected',
    note: `With ${state.votesFor[winner].length}/${N} >= ${MAJORITY}, node ${winner} wins term 6 and becomes leader. The split resolved because only one candidate woke up this round.`,
  }));

  frames.push(snap({
    phase: 'heartbeat',
    leader: winner,
    note: `Resolved. A 2-2 split wastes one term, but randomized election timeouts make a simultaneous retry unlikely, so a single candidate soon wins cleanly. Node ${winner} leads term 6.`,
  }));

  return frames;
}

const SCENARIOS = {
  'Clean election': 'clean',
  'Leader fails -> re-election': 'failover',
  'Split vote -> retry': 'split',
};
const SCEN_KEYS = Object.keys(SCENARIOS);

const STATE_LABEL = {
  follower: 'follower',
  candidate: 'candidate',
  leader: 'leader',
  down: 'down',
};

const PHASE_LABEL = {
  init: 'setup',
  'follower-timeout': 'timeout',
  'requesting-votes': 'requesting',
  elected: 'elected',
  'split-vote': 'split vote',
  're-election': 're-election',
  heartbeat: 'stable',
};

const RUN_DELAY_MS = 1200;

export default function LeaderElectionViz() {
  const [scenario, setScenario] = useState(SCEN_KEYS[0]);
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const runTimer = useRef(null);

  const mode = SCENARIOS[scenario];
  const frames = useMemo(() => {
    if (mode === 'failover') return buildFailover();
    if (mode === 'split') return buildSplit();
    return buildClean();
  }, [mode]);

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

  const switchScenario = (s) => {
    if (s === scenario) return;
    setIsRunning(false);
    setStep(0);
    setScenario(s);
  };

  const killLeader = () => {
    setIsRunning(false);
    setStep(0);
    setScenario('Leader fails -> re-election');
  };

  // SVG geometry — 5 nodes on a ring, centered.
  const W = 940;
  const H = 480;
  const cx = W / 2;
  const cy = 252;
  const R = 168;
  const nodeR = 46;

  // angle: node 1 at top, going clockwise.
  const nodePos = (id) => {
    const angle = -Math.PI / 2 + ((id - 1) / N) * 2 * Math.PI;
    return { x: cx + R * Math.cos(angle), y: cy + R * Math.sin(angle) };
  };

  const playLabel = isRunningRaw && step < totalSteps - 1 ? 'Pause' : (step >= totalSteps - 1 ? 'Replay' : 'Play');

  const leaderId = current.leader;
  const leaderExists = leaderId != null;

  // leading candidate + its vote count, for the metrics panel.
  const tallies = Object.entries(current.votesFor).map(([id, voters]) => ({ id: Number(id), count: voters.length }));
  tallies.sort((a, b) => b.count - a.count);
  const leading = tallies[0] || null;

  const nodesUp = current.nodes.filter((n) => n.state !== 'down').length;
  const candidateIds = current.candidates;

  const stateTone = (st) => {
    if (st === 'leader') return 'ok';
    if (st === 'candidate') return 'warn';
    if (st === 'down') return 'bad';
    return 'neutral';
  };

  const edgeTone = (kind) => {
    if (kind === 'grant') return 'grant';
    if (kind === 'heartbeat') return 'beat';
    if (kind === 'reject') return 'reject';
    return 'request';
  };

  const StateIcon = (st) => {
    if (st === 'leader') return <Crown width={20} height={20} className="lev-node-ic is-ok" />;
    if (st === 'down') return <Skull width={20} height={20} className="lev-node-ic is-bad" />;
    if (st === 'candidate') return <Vote width={20} height={20} className="lev-node-ic is-warn" />;
    return <CheckCircle width={18} height={18} className="lev-node-ic is-dim" />;
  };

  return (
    <div className="lev">
      <div className="lev-head">
        <h3 className="lev-title">Leader election — Raft-style term voting in a 5-node cluster</h3>
        <p className="lev-sub">
          A follower whose timeout fires bumps the term, becomes a candidate, and asks every node for a vote;
          a strict majority (3 of 5) wins the term. Step through a clean win, a crashed-leader failover, or a
          2-2 split vote that randomized timeouts break.
        </p>
      </div>

      <div className="lev-controls">
        <div className="lev-modes" role="tablist" aria-label="Scenario">
          {SCEN_KEYS.map((s) => (
            <button
              key={s}
              type="button"
              className={`lev-mode ${scenario === s ? 'is-on' : ''}`}
              onClick={() => switchScenario(s)}
              aria-pressed={scenario === s}
            >
              {s}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="lev-kill"
          onClick={killLeader}
          disabled={!leaderExists}
          title={leaderExists ? 'Kill the current leader and watch a re-election' : 'No leader to kill yet'}
        >
          <Skull size={14} /> Kill leader
        </button>

        <label className="lev-speed">
          <span className="lev-input-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="lev-speed-range"
            aria-label="Playback speed"
          />
          <span className="lev-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <span className="lev-spacer" aria-hidden="true" />

        <div className="lev-buttons">
          <button
            type="button"
            className="lev-btn lev-btn-primary"
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
            className="lev-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="lev-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="lev-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="lev-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="lev-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="lev-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="lev-arr-request" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="lev-ah is-request" />
            </marker>
            <marker id="lev-arr-grant" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="lev-ah is-grant" />
            </marker>
            <marker id="lev-arr-reject" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="lev-ah is-reject" />
            </marker>
            <marker id="lev-arr-beat" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="lev-ah is-beat" />
            </marker>
          </defs>

          {/* term badge in the center */}
          <g>
            <circle className="lev-term-ring" cx={cx} cy={cy} r={58} />
            <text className="lev-term-k" x={cx} y={cy - 14} textAnchor="middle">term</text>
            <text className="lev-term-v" x={cx} y={cy + 18} textAnchor="middle">{current.term}</text>
            <text className="lev-term-maj" x={cx} y={cy + 40} textAnchor="middle">{`majority ${MAJORITY}/${N}`}</text>
          </g>

          {/* edges (vote requests / grants / heartbeats) drawn behind nodes */}
          {current.edges.map((e, i) => {
            const a = nodePos(e.from);
            const b = nodePos(e.to);
            // shorten endpoints to node rims
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const len = Math.hypot(dx, dy) || 1;
            const ux = dx / len;
            const uy = dy / len;
            const sx = a.x + ux * (nodeR + 3);
            const sy = a.y + uy * (nodeR + 3);
            const ex = b.x - ux * (nodeR + 8);
            const ey = b.y - uy * (nodeR + 8);
            const tone = edgeTone(e.kind);
            return (
              <line
                key={`edge-${i}-${e.from}-${e.to}`}
                className={`lev-edge is-${tone}`}
                x1={sx}
                y1={sy}
                x2={ex}
                y2={ey}
                markerEnd={`url(#lev-arr-${tone})`}
              />
            );
          })}

          {/* nodes */}
          {current.nodes.map((n) => {
            const p = nodePos(n.id);
            const tone = stateTone(n.state);
            const active = current.active === n.id;
            const voteCount = current.votesFor[n.id] ? current.votesFor[n.id].length : null;
            return (
              <g key={`node-${n.id}`} className={active ? 'is-active' : ''}>
                <circle
                  className={`lev-node is-${tone} ${active ? 'is-active' : ''} ${n.state === 'down' ? 'is-down' : ''}`}
                  cx={p.x}
                  cy={p.y}
                  r={nodeR}
                />
                <g transform={`translate(${p.x - 10}, ${p.y - 30})`}>
                  {StateIcon(n.state)}
                </g>
                <text className="lev-node-id" x={p.x} y={p.y + 2} textAnchor="middle">{`N${n.id}`}</text>
                <text className={`lev-node-state is-${tone}`} x={p.x} y={p.y + 18} textAnchor="middle">
                  {STATE_LABEL[n.state]}
                </text>
                {/* per-node term + vote chips just outside the rim */}
                <text className="lev-node-term" x={p.x} y={p.y + nodeR + 16} textAnchor="middle">
                  {`t${n.term}${n.votedFor ? ` -> N${n.votedFor}` : ''}`}
                </text>
                {voteCount != null && (n.state === 'candidate' || n.state === 'leader') && (
                  <g>
                    <rect
                      className={`lev-tally ${voteCount >= MAJORITY ? 'is-win' : ''}`}
                      x={p.x - 26}
                      y={p.y - nodeR - 22}
                      width={52}
                      height={20}
                      rx={10}
                    />
                    <text className="lev-tally-text" x={p.x} y={p.y - nodeR - 8} textAnchor="middle">
                      {`${voteCount}/${N}`}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="lev-metrics">
        <div className="lev-metric">
          <span className="lev-metric-label">current term</span>
          <span className="lev-metric-value">{current.term}</span>
        </div>
        <div className="lev-metric">
          <span className="lev-metric-label">leader</span>
          <span className={`lev-metric-value ${leaderExists ? 'is-ok' : 'is-warn'}`}>
            {leaderExists ? `N${leaderId}` : 'none — election in progress'}
          </span>
        </div>
        <div className="lev-metric">
          <span className="lev-metric-label">candidate(s)</span>
          <span className={`lev-metric-value ${candidateIds.length > 1 ? 'is-bad' : ''}`}>
            {candidateIds.length === 0 ? '—' : candidateIds.map((id) => `N${id}`).join(' + ')}
          </span>
        </div>
        <div className="lev-metric">
          <span className="lev-metric-label">votes (leading)</span>
          <span className={`lev-metric-value ${leading && leading.count >= MAJORITY ? 'is-ok' : ''}`}>
            {leading ? `N${leading.id}: ${leading.count} / ${N}, maj = ${MAJORITY}` : '—'}
          </span>
        </div>
        <div className="lev-metric">
          <span className="lev-metric-label">nodes up</span>
          <span className={`lev-metric-value ${nodesUp < N ? 'is-warn' : ''}`}>{`${nodesUp} / ${N}`}</span>
        </div>
        <div className="lev-metric lev-metric-dim">
          <span className="lev-metric-label">phase</span>
          <span className={`lev-metric-value ${current.phase === 'elected' || current.phase === 'heartbeat' ? 'is-ok' : current.phase === 'split-vote' ? 'is-bad' : ''}`}>
            {PHASE_LABEL[current.phase] || current.phase}
          </span>
        </div>
      </div>

      <div className={`lev-narration ${current.phase === 'split-vote' ? 'is-bad' : ''}`}>
        <span className={`lev-narration-label ${current.phase === 'split-vote' ? 'is-bad' : current.phase === 'elected' || current.phase === 'heartbeat' ? 'is-ok' : ''}`}>
          {PHASE_LABEL[current.phase] || current.phase}
        </span>
        <span className="lev-narration-body">{current.note}</span>
      </div>

      <div className="lev-legend">
        <span className="lev-legend-item"><Vote size={13} className="lev-ic is-warn" /> candidate requests votes</span>
        <span className="lev-legend-item"><CheckCircle size={13} className="lev-ic is-ok" /> grant — one vote per term</span>
        <span className="lev-legend-item"><XCircle size={13} className="lev-ic is-bad" /> no reply / reject</span>
        <span className="lev-legend-item"><Crown size={13} className="lev-ic is-ok" /> majority wins leader, heartbeats</span>
      </div>
    </div>
  );
}
