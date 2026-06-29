import React, { useState } from 'react';
import { Split, Merge, RotateCcw, AlertTriangle, ArrowRight } from 'lucide-react';
import './DbNormalizationViz.css';

const ROWS = [
  { order_id: 1, cust: 'Ada', zip: '10001', city: 'New York' },
  { order_id: 2, cust: 'Ada', zip: '10001', city: 'New York' },
  { order_id: 3, cust: 'Linus', zip: '90210', city: 'Beverly' },
];

const ZIPS = [
  { zip: '10001', city: 'New York' },
  { zip: '90210', city: 'Beverly' },
];

const FDS = [
  { lhs: 'order_id', rhs: 'cust', kind: 'key' },
  { lhs: 'order_id', rhs: 'zip', kind: 'key' },
  { lhs: 'zip', rhs: 'city', kind: 'transitive' },
];

export default function DbNormalizationViz() {
  const [normalized, setNormalized] = useState(false);

  return (
    <div className="dbnorm">
      <div className="dbnorm-head">
        <div className="dbnorm-head-icon"><Split size={18} /></div>
        <div className="dbnorm-head-text">
          <h3 className="dbnorm-title">Decomposing away the update anomaly</h3>
          <p className="dbnorm-sub">
            <b>zip → city</b> is a transitive dependency, so <b>city</b> repeats once per row. Change one
            copy and the table contradicts itself. Splitting it to 3NF gives each fact a single home.
          </p>
        </div>
        <button type="button" className="dbnorm-reset" onClick={() => setNormalized(false)}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="dbnorm-fds">
        <span className="dbnorm-fd-label">functional dependencies:</span>
        {FDS.map((fd, i) => (
          <span key={i} className={`dbnorm-fd${fd.kind === 'transitive' ? ' is-transitive' : ''}`}>
            {fd.lhs} <ArrowRight size={11} /> {fd.rhs}
            {fd.kind === 'transitive' && <em> (transitive)</em>}
          </span>
        ))}
      </div>

      <div className={`dbnorm-stage${normalized ? ' is-normalized' : ''}`}>
        {/* denormalized */}
        <div className="dbnorm-panel dbnorm-denorm">
          <div className="dbnorm-tname">orders <span className="dbnorm-tag">denormalized</span></div>
          <table className="dbnorm-table">
            <thead>
              <tr><th>order_id</th><th>cust</th><th>zip</th><th>city</th></tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r.order_id} className={r.zip === '10001' ? 'dbnorm-dup' : ''}>
                  <td>{r.order_id}</td><td>{r.cust}</td><td>{r.zip}</td>
                  <td className="dbnorm-citycell">{r.city}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!normalized && (
            <div className="dbnorm-anomaly">
              <AlertTriangle size={13} />
              <span>Update anomaly: edit “New York” in one row and the two 10001 rows disagree.</span>
            </div>
          )}
        </div>

        {/* normalized: two tables linked by FK */}
        <div className="dbnorm-panel dbnorm-norm">
          <div className="dbnorm-split-tables">
            <div className="dbnorm-subtable">
              <div className="dbnorm-tname">orders <span className="dbnorm-tag is-ok">3NF</span></div>
              <table className="dbnorm-table">
                <thead><tr><th>order_id</th><th>cust</th><th>zip<span className="dbnorm-fk">FK</span></th></tr></thead>
                <tbody>
                  {ROWS.map((r) => (
                    <tr key={r.order_id}><td>{r.order_id}</td><td>{r.cust}</td><td className="dbnorm-fkcell">{r.zip}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="dbnorm-fk-link"><ArrowRight size={16} /></div>
            <div className="dbnorm-subtable">
              <div className="dbnorm-tname">zips <span className="dbnorm-tag is-ok">3NF</span></div>
              <table className="dbnorm-table">
                <thead><tr><th>zip<span className="dbnorm-pk">PK</span></th><th>city</th></tr></thead>
                <tbody>
                  {ZIPS.map((z) => (
                    <tr key={z.zip}><td>{z.zip}</td><td className="dbnorm-citycell">{z.city}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {normalized && (
            <div className="dbnorm-anomaly is-fixed">
              <Merge size={13} />
              <span>Each city stored once. One UPDATE on zips fixes it everywhere; a JOIN rebuilds the original (lossless).</span>
            </div>
          )}
        </div>
      </div>

      <div className="dbnorm-controls">
        <button type="button" className={`dbnorm-toggle${!normalized ? ' is-active' : ''}`} onClick={() => setNormalized(false)}>
          Denormalized
        </button>
        <button type="button" className={`dbnorm-toggle${normalized ? ' is-active' : ''}`} onClick={() => setNormalized(true)}>
          <Split size={13} /> Decompose to 3NF
        </button>
      </div>
    </div>
  );
}
