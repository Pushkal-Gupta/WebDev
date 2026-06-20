import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { Play, Loader2, RotateCcw, Table, Database, Check, X, BookOpen, ChevronLeft, ArrowRight, ClipboardPaste, Link2, FilePlus2, Trash2, Layers } from 'lucide-react';
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
  library: "-- Books currently on loan (no return date yet).\nSELECT b.title,\n       a.name AS author,\n       m.name AS borrower,\n       l.loaned\nFROM loans l\nJOIN books   b ON b.id = l.book_id\nJOIN authors a ON a.id = b.author_id\nJOIN members m ON m.id = l.member_id\nWHERE l.returned IS NULL\nORDER BY l.loaned;\n",
  university: "-- Average grade (GPA) per student, highest first.\nSELECT s.name,\n       s.major,\n       ROUND(AVG(e.grade), 2) AS gpa,\n       COUNT(e.id)            AS courses\nFROM students s\nJOIN enrollments e ON e.student_id = s.id\nGROUP BY s.id\nORDER BY gpa DESC;\n",
  social: "-- Most-liked posts with their author.\nSELECT u.handle,\n       p.body,\n       COUNT(lk.user_id) AS likes\nFROM posts p\nJOIN users u  ON u.id = p.user_id\nLEFT JOIN likes lk ON lk.post_id = p.id\nGROUP BY p.id\nORDER BY likes DESC\nLIMIT 5;\n",
  flights: "-- Longest flights with airline and route.\nSELECT f.flight_no,\n       al.name AS airline,\n       o.city  AS from_city,\n       d.city  AS to_city,\n       f.distance_km\nFROM flights f\nJOIN airlines al ON al.id = f.airline_id\nJOIN airports o  ON o.code = f.origin\nJOIN airports d  ON d.code = f.destination\nORDER BY f.distance_km DESC\nLIMIT 5;\n",
  hospital: "-- Visit count and total billed per specialty.\nSELECT d.specialty,\n       COUNT(v.id)            AS visits,\n       ROUND(SUM(v.cost), 2)  AS billed\nFROM visits v\nJOIN doctors d ON d.id = v.doctor_id\nGROUP BY d.specialty\nORDER BY billed DESC;\n",
  bank: "-- Net movement per account: deposits minus withdrawals.\nSELECT a.id AS account,\n       c.name AS holder,\n       a.type,\n       ROUND(SUM(t.amount), 2) AS net_change\nFROM accounts a\nJOIN customers c    ON c.id = a.customer_id\nJOIN transactions t ON t.account_id = a.id\nGROUP BY a.id\nORDER BY net_change DESC;\n",
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
  library: [
    { label: 'Books on loan now',       sql: 'SELECT b.title, m.name AS borrower\nFROM loans l JOIN books b ON b.id = l.book_id\nJOIN members m ON m.id = l.member_id\nWHERE l.returned IS NULL ORDER BY l.loaned;' },
    { label: 'Loans per book',          sql: 'SELECT b.title, COUNT(l.id) AS times_loaned\nFROM books b LEFT JOIN loans l ON l.book_id = b.id\nGROUP BY b.id ORDER BY times_loaned DESC;' },
    { label: 'Books per genre',         sql: 'SELECT genre, COUNT(*) AS n FROM books GROUP BY genre ORDER BY n DESC;' },
    { label: 'Authors by birth year',   sql: 'SELECT name, country, birth_year FROM authors ORDER BY birth_year;' },
    { label: 'Schema',                  sql: "SELECT name, sql FROM sqlite_master WHERE type='table';" },
  ],
  university: [
    { label: 'GPA per student',         sql: 'SELECT s.name, ROUND(AVG(e.grade), 2) AS gpa\nFROM students s JOIN enrollments e ON e.student_id = s.id\nGROUP BY s.id ORDER BY gpa DESC;' },
    { label: 'Course roster sizes',     sql: 'SELECT c.title, COUNT(e.id) AS enrolled\nFROM courses c LEFT JOIN enrollments e ON e.course_id = c.id\nGROUP BY c.id ORDER BY enrolled DESC;' },
    { label: 'Avg grade by department', sql: 'SELECT c.department, ROUND(AVG(e.grade), 2) AS avg_grade\nFROM enrollments e JOIN courses c ON c.id = e.course_id\nGROUP BY c.department ORDER BY avg_grade DESC;' },
    { label: 'Courses per instructor',  sql: 'SELECT i.name, COUNT(c.id) AS courses\nFROM instructors i LEFT JOIN courses c ON c.instructor_id = i.id\nGROUP BY i.id ORDER BY courses DESC;' },
    { label: 'Schema',                  sql: "SELECT name, sql FROM sqlite_master WHERE type='table';" },
  ],
  social: [
    { label: 'Follower counts',         sql: 'SELECT u.handle, COUNT(f.follower_id) AS followers\nFROM users u LEFT JOIN follows f ON f.followee_id = u.id\nGROUP BY u.id ORDER BY followers DESC;' },
    { label: 'Most-liked posts',        sql: 'SELECT u.handle, p.body, COUNT(lk.user_id) AS likes\nFROM posts p JOIN users u ON u.id = p.user_id\nLEFT JOIN likes lk ON lk.post_id = p.id\nGROUP BY p.id ORDER BY likes DESC LIMIT 5;' },
    { label: 'Mutual follows',          sql: 'SELECT a.follower_id, a.followee_id\nFROM follows a JOIN follows b\n  ON a.follower_id = b.followee_id AND a.followee_id = b.follower_id\nWHERE a.follower_id < a.followee_id;' },
    { label: 'Posts per user',          sql: 'SELECT u.handle, COUNT(p.id) AS posts\nFROM users u LEFT JOIN posts p ON p.user_id = u.id\nGROUP BY u.id ORDER BY posts DESC;' },
    { label: 'Schema',                  sql: "SELECT name, sql FROM sqlite_master WHERE type='table';" },
  ],
  flights: [
    { label: 'Routes by distance',      sql: 'SELECT flight_no, origin, destination, distance_km\nFROM flights ORDER BY distance_km DESC;' },
    { label: 'Seats sold per flight',   sql: 'SELECT f.flight_no, COUNT(b.id) AS seats, ROUND(SUM(b.fare), 2) AS revenue\nFROM flights f LEFT JOIN bookings b ON b.flight_id = f.id\nGROUP BY f.id ORDER BY revenue DESC;' },
    { label: 'Flights per airline',     sql: 'SELECT al.name, COUNT(f.id) AS flights\nFROM airlines al LEFT JOIN flights f ON f.airline_id = al.id\nGROUP BY al.id ORDER BY flights DESC;' },
    { label: 'Departures by country',   sql: 'SELECT a.country, COUNT(f.id) AS departures\nFROM flights f JOIN airports a ON a.code = f.origin\nGROUP BY a.country ORDER BY departures DESC;' },
    { label: 'Schema',                  sql: "SELECT name, sql FROM sqlite_master WHERE type='table';" },
  ],
  hospital: [
    { label: 'Visits per specialty',    sql: 'SELECT d.specialty, COUNT(v.id) AS visits\nFROM visits v JOIN doctors d ON d.id = v.doctor_id\nGROUP BY d.specialty ORDER BY visits DESC;' },
    { label: 'Billing per doctor',      sql: 'SELECT d.name, ROUND(SUM(v.cost), 2) AS billed\nFROM doctors d LEFT JOIN visits v ON v.doctor_id = d.id\nGROUP BY d.id ORDER BY billed DESC;' },
    { label: 'Visits per patient',      sql: 'SELECT p.name, COUNT(v.id) AS visits\nFROM patients p LEFT JOIN visits v ON v.patient_id = p.id\nGROUP BY p.id ORDER BY visits DESC;' },
    { label: 'Most-prescribed drugs',   sql: 'SELECT drug, COUNT(*) AS times\nFROM prescriptions GROUP BY drug ORDER BY times DESC;' },
    { label: 'Schema',                  sql: "SELECT name, sql FROM sqlite_master WHERE type='table';" },
  ],
  bank: [
    { label: 'Balance per customer',    sql: 'SELECT c.name, ROUND(SUM(a.balance), 2) AS total_balance\nFROM customers c JOIN accounts a ON a.customer_id = c.id\nGROUP BY c.id ORDER BY total_balance DESC;' },
    { label: 'Deposits vs withdrawals', sql: "SELECT kind, COUNT(*) AS n, ROUND(SUM(amount), 2) AS total\nFROM transactions GROUP BY kind ORDER BY total DESC;" },
    { label: 'Net change per account',  sql: 'SELECT a.id, a.type, ROUND(SUM(t.amount), 2) AS net_change\nFROM accounts a JOIN transactions t ON t.account_id = a.id\nGROUP BY a.id ORDER BY net_change DESC;' },
    { label: 'Customers per branch',    sql: 'SELECT b.name, COUNT(c.id) AS customers\nFROM branches b LEFT JOIN customers c ON c.branch_id = b.id\nGROUP BY b.id ORDER BY customers DESC;' },
    { label: 'Schema',                  sql: "SELECT name, sql FROM sqlite_master WHERE type='table';" },
  ],
};

// Rotating theme-token accents so each scenario card reads distinctly.
const CARD_HUES = [
  'var(--accent)',
  'var(--hue-violet)',
  'var(--hue-sky)',
  'var(--hue-pink)',
  'var(--hue-mint)',
];

const LAST_DB_KEY = 'pgcode_sql_last_playground_db';
const CUSTOM_SEED_KEY = 'pgcode_sql_custom_seed';
const CUSTOM_STARTER = '-- Your tables are loaded. List them, then query away.\nSELECT name FROM sqlite_master WHERE type=\'table\';\n';

// Pull table names out of CREATE TABLE statements for the sidebar list.
function parseTableNames(sqlText) {
  const names = [];
  const re = /CREATE\s+(?:TEMP(?:ORARY)?\s+)?TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["`[]?([A-Za-z_][\w$]*)["`\]]?/gi;
  let m;
  while ((m = re.exec(sqlText)) !== null) {
    if (!names.includes(m[1])) names.push(m[1]);
  }
  return names;
}

export default function SqlPlayground({ theme }) {
  const navigate = useNavigate();
  const { courseSlug } = useParams();
  const entry = courseSlug ? SQL_COURSES[courseSlug] : null;

  // A course entry runs the graded surface (questions + grading panel).
  // A playground entry runs the free-form editor against the seed DB.
  // Missing entry = show the picker.
  const customMode = courseSlug === 'custom';
  const courseMode = entry?.kind === 'course';
  const playgroundMode = entry?.kind === 'playground';
  const course = courseMode ? entry : null;
  const playgroundDb = playgroundMode ? entry : null;

  const playgroundDbs = useMemo(() => listPlaygroundDbs(), []);

  // Custom-DB seed the user pasted or fetched. Persisted so a reload keeps the
  // loaded schema instead of dropping back to the setup screen.
  const [customSeed, setCustomSeed] = useState(() => {
    if (typeof window === 'undefined') return '';
    try { return localStorage.getItem(CUSTOM_SEED_KEY) || ''; } catch { return ''; }
  });
  // The setup screen shows until a custom seed is loaded.
  const customLoaded = customMode && !!customSeed;

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
  const effectiveSeed = customLoaded ? customSeed : (entry?.seedSql || '');
  const localKey = course
    ? `pgcode_sql_course_${course.id}_${question?.id || 'q'}`
    : playgroundDb
      ? `pgcode_sql_pg_${playgroundDb.id}`
      : customLoaded
        ? 'pgcode_sql_pg_custom'
        : 'pgcode_sql_picker';

  const defaultStarter = courseMode
    ? (question?.starter || '-- write your query here')
    : playgroundDb
      ? (PLAYGROUND_STARTERS[playgroundDb.id] || DEFAULT_FREE_STARTER)
      : customLoaded
        ? CUSTOM_STARTER
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

  // When a custom DB is loaded (or replaced), seed the editor with its starter
  // or the saved draft for the custom slot.
  useEffect(() => {
    if (!customLoaded) return;
    const k = 'pgcode_sql_pg_custom';
    setSql(localStorage.getItem(k) || CUSTOM_STARTER);
    setResults([]);
    setError(null);
    setElapsed(null);
  }, [customLoaded]);

  const [running, setRunning] = useState(false);
  const [dbReady, setDbReady] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState([]); // [{ columns: [], values: [[...], ...] }]
  const [elapsed, setElapsed] = useState(null);
  const dbRef = useRef(null);

  // Custom-DB setup form (paste / fetch).
  const [pasteSql, setPasteSql] = useState('');
  const [fetchUrl, setFetchUrl] = useState('');
  const [setupError, setSetupError] = useState(null);
  const [fetching, setFetching] = useState(false);

  // Validate a candidate seed by running it in a throwaway SQLite instance,
  // then commit it as the custom DB. Surfaces SQL errors without crashing.
  const loadCustomSeed = useCallback(async (seedText) => {
    const text = (seedText || '').trim();
    if (!text) {
      setSetupError('Nothing to load — paste some SQL or fetch a URL first.');
      return;
    }
    setSetupError(null);
    try {
      const initSqlJs = (await import('sql.js')).default;
      const SQL = await initSqlJs({ locateFile: () => sqlWasmUrl });
      const test = new SQL.Database();
      test.run(text); // throws on malformed SQL
      const tableCount = parseTableNames(text).length;
      test.close();
      if (tableCount === 0) {
        setSetupError('No CREATE TABLE statements found. Include at least one table definition.');
        return;
      }
      try { localStorage.setItem(CUSTOM_SEED_KEY, text); } catch { /* ignore */ }
      setCustomSeed(text);
    } catch (e) {
      setSetupError(`That SQL did not load:\n${e?.message || String(e)}`);
    }
  }, []);

  const fetchCustomSeed = useCallback(async () => {
    const url = fetchUrl.trim();
    if (!url) {
      setSetupError('Enter a URL pointing at a .sql file (CREATE TABLE + INSERT statements).');
      return;
    }
    setSetupError(null);
    setFetching(true);
    try {
      const res = await fetch(url, { method: 'GET' });
      if (!res.ok) {
        setSetupError(`Fetch failed: ${res.status} ${res.statusText}. Check the URL is a raw .sql file.`);
        return;
      }
      const text = await res.text();
      await loadCustomSeed(text);
    } catch (e) {
      setSetupError(
        `Could not fetch that URL — the host may block cross-origin requests (CORS) or be unreachable. Try a raw file URL (e.g. a raw gist), or paste the SQL instead.\n${e?.message || String(e)}`,
      );
    } finally {
      setFetching(false);
    }
  }, [fetchUrl, loadCustomSeed]);

  const clearCustomSeed = useCallback(() => {
    try { localStorage.removeItem(CUSTOM_SEED_KEY); } catch { /* ignore */ }
    try { localStorage.removeItem('pgcode_sql_pg_custom'); } catch { /* ignore */ }
    setCustomSeed('');
    setResults([]);
    setError(null);
    setElapsed(null);
    setPasteSql('');
    setSetupError(null);
  }, []);

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

  // Custom-DB setup view — paste or fetch SQL into a fresh SQLite instance.
  if (customMode && !customLoaded) {
    return (
      <div className="sql-pg sql-pg-picker-page">
        <header className="sql-pg-header">
          <div className="sql-pg-title-row">
            <Link to="/playground/sql" className="sql-pg-back">
              <ChevronLeft size={12} /> Back to sample databases
            </Link>
            <h1 className="sql-pg-title">Bring your own database</h1>
            <p className="sql-pg-sub">
              <Database size={11} /> Paste SQL or fetch a raw .sql URL — it runs in SQLite in your browser, nothing leaves the page.
            </p>
          </div>
        </header>
        <div className="sql-pg-custom-setup">
          <div className="sql-pg-custom-card">
            <h3 className="sql-pg-side-title"><ClipboardPaste size={12} /> Paste SQL</h3>
            <p className="sql-pg-custom-hint">
              Drop in CREATE TABLE statements followed by INSERTs. SELECTs run later in the editor.
            </p>
            <textarea
              className="sql-pg-custom-textarea"
              value={pasteSql}
              onChange={(e) => setPasteSql(e.target.value)}
              spellCheck={false}
              placeholder={'CREATE TABLE pets (id INTEGER PRIMARY KEY, name TEXT, species TEXT);\nINSERT INTO pets VALUES (1, \'Mochi\', \'cat\'), (2, \'Rex\', \'dog\');'}
            />
            <button
              className="sql-pg-btn sql-pg-btn-primary"
              onClick={() => loadCustomSeed(pasteSql)}
            >
              <Play size={13} /> Load &amp; open editor
            </button>
          </div>

          <div className="sql-pg-custom-card">
            <h3 className="sql-pg-side-title"><Link2 size={12} /> Fetch from a URL</h3>
            <p className="sql-pg-custom-hint">
              A plain GET of a raw .sql file (e.g. a raw gist). The host must allow cross-origin reads.
            </p>
            <input
              className="sql-pg-custom-input"
              type="url"
              value={fetchUrl}
              onChange={(e) => setFetchUrl(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') fetchCustomSeed(); }}
              spellCheck={false}
              placeholder="https://gist.githubusercontent.com/.../schema.sql"
            />
            <button
              className="sql-pg-btn sql-pg-btn-primary"
              onClick={fetchCustomSeed}
              disabled={fetching}
            >
              {fetching ? <Loader2 size={13} className="sql-pg-spin" /> : <Link2 size={13} />}
              {fetching ? 'Fetching…' : 'Fetch & load'}
            </button>
            {setupError && <pre className="sql-pg-error sql-pg-custom-error">{setupError}</pre>}
          </div>
        </div>
      </div>
    );
  }

  // Picker view — no DB chosen yet. Mode-style grid of sample databases.
  if (!courseMode && !playgroundMode && !customMode) {
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
            {playgroundDbs.map((db, i) => (
              <button
                key={db.id}
                className="sql-pg-picker-card"
                style={{ '--card-accent': CARD_HUES[i % CARD_HUES.length] }}
                onClick={() => navigate(`/playground/sql/${db.id}`)}
              >
                <span className="sql-pg-picker-card-head">
                  <Database size={14} />
                  <span className="sql-pg-picker-card-title">{db.title}</span>
                </span>
                <span className="sql-pg-picker-card-blurb">{db.blurb}</span>
                <span className="sql-pg-picker-card-tables">
                  {db.tables.slice(0, 5).map(t => <code key={t}>{t}</code>)}
                  {db.tables.length > 5 && <code>+{db.tables.length - 5}</code>}
                </span>
                <span className="sql-pg-picker-card-meta">
                  <Layers size={11} />
                  {db.tables.length} table{db.tables.length === 1 ? '' : 's'}
                  <span className="sql-pg-picker-card-cta" style={{ marginLeft: 'auto', marginTop: 0 }}>
                    Open <ArrowRight size={11} />
                  </span>
                </span>
              </button>
            ))}
            <button
              className="sql-pg-picker-card sql-pg-picker-card-custom"
              onClick={() => navigate('/playground/sql/custom')}
            >
              <span className="sql-pg-picker-card-head">
                <FilePlus2 size={14} />
                <span className="sql-pg-picker-card-title">Bring your own database</span>
              </span>
              <span className="sql-pg-picker-card-blurb">
                Paste your own CREATE TABLE + INSERT statements, or fetch them from a raw .sql URL, and query them in the same editor.
              </span>
              <span className="sql-pg-picker-card-tables">
                <code>paste SQL</code><code>fetch URL</code>
              </span>
              <span className="sql-pg-picker-card-meta">
                <ClipboardPaste size={11} />
                Your schema
                <span className="sql-pg-picker-card-cta" style={{ marginLeft: 'auto', marginTop: 0 }}>
                  Load <ArrowRight size={11} />
                </span>
              </span>
            </button>
          </div>
          <p className="sql-pg-picker-foot">
            <BookOpen size={11} /> Looking for graded exercises? Try the <Link to="/courses/sql-basics">SQL Basics course</Link> or the <Link to="/playground/sql/usda">USDA project</Link>.
          </p>
        </div>
      </div>
    );
  }

  const displayTitle = customLoaded ? 'Your database' : entry.title;
  const displayBlurb = customLoaded
    ? 'Your pasted or fetched SQL, running in browser SQLite. Reset re-seeds from the same SQL; Replace loads new SQL.'
    : entry.blurb;
  const tablesList = customLoaded ? parseTableNames(customSeed) : (entry?.tables || []);
  const sampleQueries = playgroundDb
    ? (SAMPLE_QUERIES_BY_DB[playgroundDb.id] || [])
    : customLoaded
      ? [
          { label: 'List tables', sql: "SELECT name FROM sqlite_master WHERE type='table';" },
          { label: 'Schema', sql: "SELECT name, sql FROM sqlite_master WHERE type='table';" },
          ...(tablesList[0] ? [{ label: `Rows of ${tablesList[0]}`, sql: `SELECT * FROM ${tablesList[0]} LIMIT 50;` }] : []),
        ]
      : [];

  return (
    <div className="sql-pg">
      <header className="sql-pg-header">
        <div className="sql-pg-title-row">
          <Link to="/playground/sql" className="sql-pg-back">
            <ChevronLeft size={12} /> {courseMode ? 'Pick a sample database' : 'Change database'}
          </Link>
          <h1 className="sql-pg-title">{displayTitle}</h1>
          <p className="sql-pg-sub">
            <Database size={11} /> {displayBlurb}
          </p>
          {playgroundMode && (
            <p className="sql-pg-sub" style={{ marginTop: '0.25rem' }}>
              <BookOpen size={11} /> Want guided drills against this schema? The <Link to="/courses/sql-basics" style={{ color: 'var(--accent)' }}>SQL Basics course</Link> walks ten graded steps.
            </p>
          )}
        </div>
        <div className="sql-pg-controls">
          {customLoaded && (
            <button className="sql-pg-btn sql-pg-btn-ghost" onClick={clearCustomSeed} title="Discard this database and load different SQL">
              <Trash2 size={13} /> Replace
            </button>
          )}
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
