import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { Play, Loader2, RotateCcw, Table, Database, Check, X, BookOpen, ChevronLeft } from 'lucide-react';
import sqlWasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import { SQL_COURSES, gradeResult } from '../content/sqlCourses';
import PlaygroundSwitcher from './PlaygroundSwitcher';
import './SqlPlayground.css';

// Seed schema — a familiar employees/departments toy database. Used by ~80% of
// SQL tutorials, so most "try this query" examples are immediately runnable.
const SEED_SQL = `
CREATE TABLE departments (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE employees (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  department_id INTEGER REFERENCES departments(id),
  salary INTEGER NOT NULL,
  hire_date TEXT NOT NULL
);

INSERT INTO departments (id, name) VALUES
  (1, 'Engineering'),
  (2, 'Design'),
  (3, 'Marketing'),
  (4, 'Operations');

INSERT INTO employees (id, name, department_id, salary, hire_date) VALUES
  (1, 'Asha Mehta',      1, 145000, '2021-03-15'),
  (2, 'Ben Carter',      1, 132000, '2022-07-01'),
  (3, 'Chen Wei',        2, 118000, '2020-11-22'),
  (4, 'Divya Iyer',      2, 124000, '2023-01-05'),
  (5, 'Eli Rodriguez',   3,  98000, '2019-08-30'),
  (6, 'Farah Hassan',    1, 158000, '2018-04-12'),
  (7, 'Gabriel Souza',   3, 102000, '2021-10-18'),
  (8, 'Hannah Park',     4,  87000, '2023-06-09'),
  (9, 'Ivan Petrov',     1, 141000, '2020-02-25'),
  (10,'Jamila Karam',    4,  95000, '2022-12-01');
`;

const STARTER_QUERY = `-- Try editing this query, then hit Run (Cmd/Ctrl+Enter).
SELECT
  d.name AS department,
  COUNT(e.id)    AS headcount,
  ROUND(AVG(e.salary)) AS avg_salary,
  MAX(e.salary)  AS top_salary
FROM employees e
JOIN departments d ON d.id = e.department_id
GROUP BY d.name
ORDER BY avg_salary DESC;
`;

const SAMPLE_QUERIES = [
  { label: 'All employees',
    sql: 'SELECT * FROM employees ORDER BY salary DESC;' },
  { label: 'Department headcount',
    sql: 'SELECT d.name, COUNT(*) AS n FROM employees e JOIN departments d ON d.id = e.department_id GROUP BY d.name;' },
  { label: 'Window: rank by salary',
    sql: 'SELECT name, salary, RANK() OVER (ORDER BY salary DESC) AS rank FROM employees;' },
  { label: 'CTE: above-avg earners',
    sql: 'WITH avg_s AS (SELECT AVG(salary) AS a FROM employees)\nSELECT name, salary FROM employees, avg_s WHERE salary > a ORDER BY salary DESC;' },
  { label: 'Schema',
    sql: "SELECT name, sql FROM sqlite_master WHERE type='table';" },
];

export default function SqlPlayground({ theme }) {
  const { courseSlug } = useParams();
  const course = courseSlug ? SQL_COURSES[courseSlug] : null;
  const courseMode = !!course;

  // Per-course question pointer.
  const [questionIdx, setQuestionIdx] = useState(0);
  const question = course?.questions?.[questionIdx];
  const [grade, setGrade] = useState(null); // { ok, reason } per question run

  // Effective seed + starter based on mode.
  const effectiveSeed = course ? course.seedSql : SEED_SQL;
  const localKey = course
    ? `pgcode_sql_course_${course.id}_${question?.id || 'q'}`
    : 'pgcode_sql_pg';

  const initialSql = courseMode
    ? (localStorage.getItem(localKey) || question?.starter || '-- write your query here')
    : (localStorage.getItem(localKey) || STARTER_QUERY);
  const [sql, setSql] = useState(initialSql);

  // When the question changes (course mode), swap the editor content.
  const questionStarter = question?.starter;
  useEffect(() => {
    if (!courseMode || !question) return;
    const k = `pgcode_sql_course_${course.id}_${question.id}`;
    setSql(localStorage.getItem(k) || questionStarter || '-- write your query here');
    setGrade(null);
  }, [courseMode, course?.id, question, questionStarter]);

  const [running, setRunning] = useState(false);
  const [dbReady, setDbReady] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState([]); // [{ columns: [], values: [[...], ...] }]
  const [elapsed, setElapsed] = useState(null);
  const dbRef = useRef(null);

  useEffect(() => {
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

  return (
    <div className="sql-pg">
      <header className="sql-pg-header">
        <div className="sql-pg-title-row">
          {courseMode ? (
            <Link to="/playground/sql" className="sql-pg-back"><ChevronLeft size={12} /> Free playground</Link>
          ) : (
            <PlaygroundSwitcher current="sql" />
          )}
          <h1 className="sql-pg-title">{course ? course.title : 'SQL Playground'}</h1>
          <p className="sql-pg-sub">
            <Database size={11} /> {course
              ? course.blurb
              : 'SQLite (sql.js, WASM). Runs in your browser. Sample employees / departments database loaded.'}
          </p>
          {!courseMode && (
            <p className="sql-pg-sub" style={{ marginTop: '0.25rem' }}>
              <BookOpen size={11} /> Try the <Link to="/playground/sql/usda" style={{ color: 'var(--accent)' }}>USDA agricultural production course</Link> — 8 graded SQL questions on real-world tables.
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
            {courseMode ? (
              <ul className="sql-pg-table-list">
                {course.tables.map(t => (
                  <li key={t}><code>{t}</code></li>
                ))}
              </ul>
            ) : (
              <ul className="sql-pg-table-list">
                <li>
                  <code>departments</code>
                  <span className="sql-pg-cols">id, name</span>
                </li>
                <li>
                  <code>employees</code>
                  <span className="sql-pg-cols">id, name, department_id, salary, hire_date</span>
                </li>
              </ul>
            )}
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
                {SAMPLE_QUERIES.map(q => (
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
          <div className="sql-pg-editor">
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

          <div className="sql-pg-output">
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
  );
}
