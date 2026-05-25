import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { Play, Loader2, RotateCcw, Table, Database, Check, X, BookOpen, ChevronLeft, ArrowRight } from 'lucide-react';
import sqlWasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import { SQL_COURSES, gradeResult, listPlaygroundDbs } from '../content/sqlCourses';
import PlaygroundSwitcher from './PlaygroundSwitcher';
import './SqlPlayground.css';

// Per-DB starter snippets that demo the schema without giving away anything.
const PLAYGROUND_STARTERS = {
  'employees-dept': '-- Try editing this query, then hit Run (Cmd/Ctrl+Enter).\nSELECT d.name AS department,\n       COUNT(e.id)         AS headcount,\n       ROUND(AVG(e.salary)) AS avg_salary,\n       MAX(e.salary)        AS top_salary\nFROM employees e\nJOIN departments d ON d.id = e.department_id\nGROUP BY d.name\nORDER BY avg_salary DESC;\n',
  chinook: "-- Top 5 best-selling tracks (by quantity).\nSELECT t.name AS track,\n       a.name AS artist,\n       SUM(ii.quantity) AS units_sold\nFROM invoice_items ii\nJOIN tracks  t ON t.id = ii.track_id\nJOIN albums  al ON al.id = t.album_id\nJOIN artists a ON a.id = al.artist_id\nGROUP BY t.id\nORDER BY units_sold DESC\nLIMIT 5;\n",
  sakila: "-- Revenue per film category.\nSELECT c.name AS category,\n       ROUND(SUM(p.amount), 2) AS revenue\nFROM payments p\nJOIN rentals    r ON r.id = p.rental_id\nJOIN films      f ON f.id = r.film_id\nJOIN categories c ON c.id = f.category_id\nGROUP BY c.name\nORDER BY revenue DESC;\n",
  world: "-- Largest city in each country, ranked by city population.\nSELECT co.name AS country,\n       ci.name AS largest_city,\n       ci.population\nFROM countries co\nJOIN cities    ci ON ci.country_code = co.code\nGROUP BY co.code\nHAVING ci.population = MAX(ci.population)\nORDER BY ci.population DESC;\n",
  ecommerce: "-- Top-spending customers in the last 60 days.\nSELECT c.name,\n       COUNT(o.id) AS orders,\n       ROUND(SUM(o.total), 2) AS spent\nFROM customers c\nJOIN orders    o ON o.customer_id = c.id\nWHERE o.status = 'shipped'\nGROUP BY c.id\nORDER BY spent DESC\nLIMIT 5;\n",
};

const DEFAULT_FREE_STARTER = '-- Pick a sample database to start writing SQL.\n';

const SAMPLE_QUERIES_BY_DB = {
  'employees-dept': [
    { label: 'All employees',           sql: 'SELECT * FROM employees ORDER BY salary DESC;' },
    { label: 'Department headcount',    sql: 'SELECT d.name, COUNT(*) AS n FROM employees e JOIN departments d ON d.id = e.department_id GROUP BY d.name;' },
    { label: 'Window: rank by salary',  sql: 'SELECT name, salary, RANK() OVER (ORDER BY salary DESC) AS rank FROM employees;' },
    { label: 'CTE: above-avg earners',  sql: 'WITH avg_s AS (SELECT AVG(salary) AS a FROM employees)\nSELECT name, salary FROM employees, avg_s WHERE salary > a ORDER BY salary DESC;' },
    { label: 'Schema',                  sql: "SELECT name, sql FROM sqlite_master WHERE type='table';" },
  ],
  chinook: [
    { label: 'All artists',             sql: 'SELECT * FROM artists ORDER BY name;' },
    { label: 'Tracks per album',        sql: 'SELECT a.title, COUNT(t.id) AS n_tracks\nFROM albums a LEFT JOIN tracks t ON t.album_id = a.id\nGROUP BY a.id ORDER BY n_tracks DESC;' },
    { label: 'Revenue by country',      sql: 'SELECT billing_country, ROUND(SUM(total), 2) AS revenue\nFROM invoices GROUP BY billing_country ORDER BY revenue DESC;' },
    { label: 'Avg track length by genre', sql: 'SELECT g.name, ROUND(AVG(t.milliseconds) / 1000.0) AS avg_seconds\nFROM tracks t JOIN genres g ON g.id = t.genre_id\nGROUP BY g.name ORDER BY avg_seconds DESC;' },
    { label: 'Schema',                  sql: "SELECT name, sql FROM sqlite_master WHERE type='table';" },
  ],
  sakila: [
    { label: 'Films by rating',         sql: 'SELECT rating, COUNT(*) AS n FROM films GROUP BY rating ORDER BY n DESC;' },
    { label: 'Active customers by city', sql: 'SELECT city, COUNT(*) AS n FROM customers WHERE active = 1 GROUP BY city ORDER BY n DESC;' },
    { label: 'Films per actor',         sql: 'SELECT a.first_name || \' \' || a.last_name AS actor, COUNT(fa.film_id) AS films\nFROM actors a LEFT JOIN film_actors fa ON fa.actor_id = a.id\nGROUP BY a.id ORDER BY films DESC;' },
    { label: 'Schema',                  sql: "SELECT name, sql FROM sqlite_master WHERE type='table';" },
  ],
  world: [
    { label: 'Top 5 by GDP',            sql: 'SELECT name, gdp_billion FROM countries ORDER BY gdp_billion DESC LIMIT 5;' },
    { label: 'Cities per continent',    sql: 'SELECT co.continent, COUNT(ci.id) AS n_cities\nFROM countries co JOIN cities ci ON ci.country_code = co.code\nGROUP BY co.continent ORDER BY n_cities DESC;' },
    { label: 'Multilingual countries',  sql: 'SELECT country_code, COUNT(*) AS langs\nFROM languages GROUP BY country_code\nHAVING COUNT(*) > 1 ORDER BY langs DESC;' },
    { label: 'Schema',                  sql: "SELECT name, sql FROM sqlite_master WHERE type='table';" },
  ],
  ecommerce: [
    { label: 'Revenue per category',    sql: 'SELECT p.category, ROUND(SUM(li.quantity * li.unit_price), 2) AS revenue\nFROM line_items li JOIN products p ON p.id = li.product_id\nGROUP BY p.category ORDER BY revenue DESC;' },
    { label: 'Average rating per product', sql: 'SELECT p.name, ROUND(AVG(r.rating), 2) AS avg_rating, COUNT(r.id) AS reviews\nFROM products p LEFT JOIN reviews r ON r.product_id = p.id\nGROUP BY p.id ORDER BY avg_rating DESC NULLS LAST;' },
    { label: 'Repeat customers',        sql: 'SELECT c.name, COUNT(o.id) AS orders\nFROM customers c JOIN orders o ON o.customer_id = c.id\nGROUP BY c.id HAVING COUNT(o.id) > 1 ORDER BY orders DESC;' },
    { label: 'Schema',                  sql: "SELECT name, sql FROM sqlite_master WHERE type='table';" },
  ],
};

const LAST_DB_KEY = 'pgcode_sql_last_playground_db';

export default function SqlPlayground({ theme }) {
  const navigate = useNavigate();
  const { courseSlug } = useParams();
  const entry = courseSlug ? SQL_COURSES[courseSlug] : null;

  // A course entry runs the graded surface (questions + grading panel).
  // A playground entry runs the free-form editor against the seed DB.
  // Missing entry = show the picker.
  const courseMode = entry?.kind === 'course';
  const playgroundMode = entry?.kind === 'playground';
  const course = courseMode ? entry : null;
  const playgroundDb = playgroundMode ? entry : null;

  const playgroundDbs = useMemo(() => listPlaygroundDbs(), []);

  useEffect(() => {
    if (playgroundMode && courseSlug) {
      try { localStorage.setItem(LAST_DB_KEY, courseSlug); } catch { /* ignore */ }
    }
  }, [playgroundMode, courseSlug]);

  // Per-course question pointer.
  const [questionIdx, setQuestionIdx] = useState(0);
  const question = course?.questions?.[questionIdx];
  const [grade, setGrade] = useState(null); // { ok, reason } per question run

  // Effective seed + starter based on mode.
  const effectiveSeed = entry?.seedSql || '';
  const localKey = course
    ? `pgcode_sql_course_${course.id}_${question?.id || 'q'}`
    : playgroundDb
      ? `pgcode_sql_pg_${playgroundDb.id}`
      : 'pgcode_sql_picker';

  const defaultStarter = courseMode
    ? (question?.starter || '-- write your query here')
    : playgroundDb
      ? (PLAYGROUND_STARTERS[playgroundDb.id] || DEFAULT_FREE_STARTER)
      : DEFAULT_FREE_STARTER;

  const initialSql = (typeof window !== 'undefined' && localStorage.getItem(localKey)) || defaultStarter;
  const [sql, setSql] = useState(initialSql);

  // When the question changes (course mode), swap the editor content.
  const questionStarter = question?.starter;
  useEffect(() => {
    if (!courseMode || !question) return;
    const k = `pgcode_sql_course_${course.id}_${question.id}`;
    setSql(localStorage.getItem(k) || questionStarter || '-- write your query here');
    setGrade(null);
  }, [courseMode, course?.id, question, questionStarter]);

  // Playground: when the user switches sample DB, reset editor to its starter
  // (or restore the saved draft for that DB).
  const playgroundDbId = playgroundDb?.id;
  useEffect(() => {
    if (!playgroundMode || !playgroundDbId) return;
    const k = `pgcode_sql_pg_${playgroundDbId}`;
    const starter = PLAYGROUND_STARTERS[playgroundDbId] || DEFAULT_FREE_STARTER;
    setSql(localStorage.getItem(k) || starter);
    setResults([]);
    setError(null);
    setElapsed(null);
  }, [playgroundMode, playgroundDbId]);

  const [running, setRunning] = useState(false);
  const [dbReady, setDbReady] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState([]); // [{ columns: [], values: [[...], ...] }]
  const [elapsed, setElapsed] = useState(null);
  const dbRef = useRef(null);

  const SPLIT_KEY = 'pgcode-sql-split';
  const [editorPct, setEditorPct] = useState(() => {
    const raw = Number(localStorage.getItem(SPLIT_KEY));
    return Number.isFinite(raw) && raw >= 20 && raw <= 80 ? raw : 50;
  });
  const splitContainerRef = useRef(null);
  const draggingRef = useRef(false);

  useEffect(() => {
    const onMove = (e) => {
      if (!draggingRef.current) return;
      const el = splitContainerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const pct = Math.min(80, Math.max(20, (y / rect.height) * 100));
      setEditorPct(pct);
    };
    const onUp = () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      document.body.classList.remove('pg-resizing-row');
      try { localStorage.setItem(SPLIT_KEY, String(editorPct)); } catch { /* ignore */ }
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [editorPct]);

  const startSplitDrag = (e) => {
    e.preventDefault();
    draggingRef.current = true;
    document.body.classList.add('pg-resizing-row');
  };

  useEffect(() => {
    if (!effectiveSeed) {
      setDbReady(false);
      return undefined;
    }
    let cancelled = false;
    (async () => {
      try {
        const initSqlJs = (await import('sql.js')).default;
        const SQL = await initSqlJs({
          // Bundled by Vite — version-locked to the installed sql.js so the JS
          // loader and WASM stay in sync (mismatched versions silently fail).
          locateFile: () => sqlWasmUrl,
        });
        if (cancelled) return;
        const db = new SQL.Database();
        db.run(effectiveSeed);
        dbRef.current = db;
        setDbReady(true);
      } catch (e) {
        if (!cancelled) setError(e?.message || String(e));
      }
    })();
    return () => {
      cancelled = true;
      if (dbRef.current) {
        try { dbRef.current.close(); } catch { /* ignore */ }
        dbRef.current = null;
      }
    };
  }, [effectiveSeed]);

  useEffect(() => {
    const id = setTimeout(() => localStorage.setItem(localKey, sql), 250);
    return () => clearTimeout(id);
  }, [sql, localKey]);

  const handleRun = useCallback(() => {
    if (!dbRef.current) return;
    setRunning(true);
    setError(null);
    setResults([]);
    setGrade(null);
    const t0 = performance.now();
    try {
      const res = dbRef.current.exec(sql);
      setResults(res || []);
      setElapsed(Math.round(performance.now() - t0));
      if (courseMode && question?.expected) {
        setGrade(gradeResult(res || [], question.expected));
      }
    } catch (e) {
      setError(e?.message || String(e));
      setElapsed(Math.round(performance.now() - t0));
    } finally {
      setRunning(false);
    }
  }, [sql, courseMode, question]);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleRun();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleRun]);

  const resetDb = () => {
    if (dbRef.current) {
      try { dbRef.current.close(); } catch { /* ignore */ }
    }
    (async () => {
      const initSqlJs = (await import('sql.js')).default;
      const SQL = await initSqlJs({
        locateFile: file => `https://cdn.jsdelivr.net/npm/sql.js@1.10.3/dist/${file}`,
      });
      const db = new SQL.Database();
      db.run(effectiveSeed);
      dbRef.current = db;
      setError(null);
      setResults([]);
      setGrade(null);
    })();
  };

  const monacoTheme = theme === 'light' || theme === 'solarized' ? 'light' : 'vs-dark';

  // Picker view — no DB chosen yet. Mode-style grid of sample databases.
  if (!courseMode && !playgroundMode) {
    return (
      <div className="sql-pg sql-pg-picker-page">
        <header className="sql-pg-header">
          <div className="sql-pg-title-row">
            <PlaygroundSwitcher current="sql" />
            <h1 className="sql-pg-title">SQL Playground</h1>
            <p className="sql-pg-sub">
              <Database size={11} /> Pick a sample database. Free-form editor, SQLite in your browser, results in milliseconds.
            </p>
          </div>
        </header>
        <div className="sql-pg-picker">
          <div className="sql-pg-picker-grid">
            {playgroundDbs.map(db => (
              <button
                key={db.id}
                className="sql-pg-picker-card"
                onClick={() => navigate(`/playground/sql/${db.id}`)}
              >
                <span className="sql-pg-picker-card-head">
                  <Database size={13} />
                  <span className="sql-pg-picker-card-title">{db.title}</span>
                </span>
                <span className="sql-pg-picker-card-blurb">{db.blurb}</span>
                <span className="sql-pg-picker-card-tables">
                  {db.tables.slice(0, 6).map(t => <code key={t}>{t}</code>)}
                  {db.tables.length > 6 && <code>+{db.tables.length - 6}</code>}
                </span>
                <span className="sql-pg-picker-card-cta">
                  Open <ArrowRight size={11} />
                </span>
              </button>
            ))}
          </div>
          <p className="sql-pg-picker-foot">
            <BookOpen size={11} /> Looking for graded exercises? Try the <Link to="/courses/sql-basics">SQL Basics course</Link> or the <Link to="/playground/sql/usda">USDA project</Link>.
          </p>
        </div>
      </div>
    );
  }

  const tablesList = entry?.tables || [];
  const sampleQueries = playgroundDb ? (SAMPLE_QUERIES_BY_DB[playgroundDb.id] || []) : [];

  return (
    <div className="sql-pg">
      <header className="sql-pg-header">
        <div className="sql-pg-title-row">
          <Link to="/playground/sql" className="sql-pg-back">
            <ChevronLeft size={12} /> {courseMode ? 'Pick a sample database' : 'Change database'}
          </Link>
          <h1 className="sql-pg-title">{entry.title}</h1>
          <p className="sql-pg-sub">
            <Database size={11} /> {entry.blurb}
          </p>
          {playgroundMode && (
            <p className="sql-pg-sub" style={{ marginTop: '0.25rem' }}>
              <BookOpen size={11} /> Want guided drills against this schema? The <Link to="/courses/sql-basics" style={{ color: 'var(--accent)' }}>SQL Basics course</Link> walks ten graded steps.
            </p>
          )}
        </div>
        <div className="sql-pg-controls">
          <button className="sql-pg-btn sql-pg-btn-ghost" onClick={resetDb} title="Reset to seed schema + data">
            <RotateCcw size={13} /> Reset DB
          </button>
          <button
            className="sql-pg-btn sql-pg-btn-primary"
            onClick={handleRun}
            disabled={!dbReady || running}
            title="Run query (Cmd/Ctrl+Enter)"
          >
            {running ? <Loader2 size={13} className="sql-pg-spin" /> : <Play size={13} />}
            {running ? 'Running' : dbReady ? 'Run' : 'Loading SQLite…'}
          </button>
        </div>
      </header>

      <div className="sql-pg-body">
        <aside className="sql-pg-side">
          <div className="sql-pg-side-section">
            <h3 className="sql-pg-side-title"><Table size={11} /> Tables</h3>
            <ul className="sql-pg-table-list">
              {tablesList.map(t => (
                <li key={t}><code>{t}</code></li>
              ))}
            </ul>
          </div>

          {courseMode ? (
            <div className="sql-pg-side-section">
              <h3 className="sql-pg-side-title">Questions</h3>
              <ol className="sql-pg-q-list">
                {course.questions.map((q, idx) => (
                  <li key={q.id}>
                    <button
                      className={`sql-pg-q-link ${idx === questionIdx ? 'active' : ''}`}
                      onClick={() => setQuestionIdx(idx)}
                    >
                      <span className="sql-pg-q-n">Q{idx + 1}</span>
                      <span className="sql-pg-q-t">{q.title}</span>
                    </button>
                  </li>
                ))}
              </ol>
            </div>
          ) : (
            <div className="sql-pg-side-section">
              <h3 className="sql-pg-side-title">Sample queries</h3>
              <ul className="sql-pg-sample-list">
                {sampleQueries.map(q => (
                  <li key={q.label}>
                    <button onClick={() => setSql(q.sql)}>{q.label}</button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>

        <div className="sql-pg-main">
          {courseMode && question && (
            <div className="sql-pg-prompt">
              <span className="sql-pg-prompt-label">Q{questionIdx + 1} of {course.questions.length}</span>
              <h2 className="sql-pg-prompt-title">{question.title}</h2>
              <p className="sql-pg-prompt-text">{question.prompt}</p>
            </div>
          )}
          {courseMode && grade && (
            <div className={`sql-pg-grade ${grade.ok ? 'ok' : 'bad'}`}>
              {grade.ok ? <Check size={14} /> : <X size={14} />}
              {grade.ok ? 'Correct — moves to next question on demand.' : <span style={{ whiteSpace: 'pre-wrap' }}>{grade.reason}</span>}
              {grade.ok && questionIdx + 1 < course.questions.length && (
                <button className="sql-pg-grade-next" onClick={() => setQuestionIdx(i => i + 1)}>Next →</button>
              )}
            </div>
          )}
          <div className="sql-pg-split" ref={splitContainerRef}>
          <div className="sql-pg-editor" style={{ flexBasis: `${editorPct}%` }}>
            <Editor
              height="100%"
              language="sql"
              theme={monacoTheme}
              value={sql}
              onChange={(v) => setSql(v ?? '')}
              options={{
                fontSize: 13,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                padding: { top: 10 },
                tabSize: 2,
                fontFamily: '"Space Mono", monospace',
              }}
            />
          </div>

          <div
            className="sql-pg-vsplitter"
            role="separator"
            aria-orientation="horizontal"
            aria-label="Resize editor and results"
            onMouseDown={startSplitDrag}
          />

          <div className="sql-pg-output" style={{ flexBasis: `${100 - editorPct}%` }}>
            <div className="sql-pg-output-head">
              <span className="sql-pg-output-label">Results</span>
              {elapsed != null && <span className="sql-pg-output-meta">{elapsed} ms</span>}
            </div>
            <div className="sql-pg-output-body">
              {error ? (
                <pre className="sql-pg-error">{error}</pre>
              ) : results.length === 0 ? (
                <p className="sql-pg-empty">
                  {running ? 'Running query…' : dbReady ? 'Run a query to see results.' : 'Loading SQLite engine…'}
                </p>
              ) : (
                results.map((r, ri) => (
                  <div key={ri} className="sql-pg-result-block">
                    <table className="sql-pg-table">
                      <thead>
                        <tr>
                          {r.columns.map((c, i) => <th key={i}>{c}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {r.values.map((row, i) => (
                          <tr key={i}>
                            {row.map((cell, j) => (
                              <td key={j}>{cell === null ? <em className="sql-pg-null">null</em> : String(cell)}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <span className="sql-pg-row-count">{r.values.length} row{r.values.length === 1 ? '' : 's'}</span>
                  </div>
                ))
              )}
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
