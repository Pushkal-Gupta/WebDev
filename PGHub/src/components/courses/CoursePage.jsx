import React, { useState, useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import {
  ArrowLeft,
  ArrowRight,
  Play,
  Loader2,
  Check,
  X,
  Lightbulb,
  AlertTriangle,
  KeyRound,
  Clock,
  Target,
  CheckCircle2,
} from 'lucide-react';
import { COURSES } from '../../content/courses';
import Breadcrumb from '../common/Breadcrumb';
import { runCode } from '../../lib/codeRunner';
import { registerMonacoThemes, resolveMonacoTheme } from '../../lib/monacoTheme';
import AlgoVisualizer, {
  ArrayBarRenderer,
  GraphRenderer,
  SlidingWindowRenderer,
  NumberGridRenderer,
  TreeRenderer,
} from '../learn/AlgoVisualizer';
import './Courses.css';

function LessonViz({ viz }) {
  if (!viz || !Array.isArray(viz.frames) || viz.frames.length === 0) return null;
  const r = viz.renderer || 'array';
  const render = (frame) => {
    if (r === 'graph') return <GraphRenderer frame={frame} />;
    if (r === 'window') return <SlidingWindowRenderer frame={frame} />;
    if (r === 'grid') return <NumberGridRenderer frame={frame} />;
    if (r === 'tree') return <TreeRenderer frame={frame} />;
    return <ArrayBarRenderer frame={frame} />;
  };
  return (
    <section className="course-block course-block-viz">
      <div className="course-block-head">{viz.title || 'Walkthrough'}</div>
      <AlgoVisualizer frames={viz.frames} render={render} />
    </section>
  );
}

function normalizeOutput(s) {
  if (s == null) return '';
  return String(s).replace(/\r\n/g, '\n').trim();
}

// Render a paragraph string with inline `backtick` spans turned into <code>.
function renderInlineParagraph(text, keyPrefix) {
  if (!text) return null;
  const parts = String(text).split(/(`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('`') && part.endsWith('`') && part.length > 1) {
      return <code key={`${keyPrefix}-c-${i}`} className="course-intro-code">{part.slice(1, -1)}</code>;
    }
    return <React.Fragment key={`${keyPrefix}-t-${i}`}>{part}</React.Fragment>;
  });
}

// Split intro text into paragraphs on blank lines.
function IntroBody({ text }) {
  if (!text) return null;
  const paragraphs = String(text).split(/\n{2,}/).map(s => s.trim()).filter(Boolean);
  return (
    <div className="course-lesson-intro">
      {paragraphs.map((para, i) => (
        <p key={`intro-${i}`}>{renderInlineParagraph(para, `intro-${i}`)}</p>
      ))}
    </div>
  );
}

function estimateReadMinutes(lesson) {
  const parts = [
    lesson?.intro || '',
    lesson?.code || '',
    lesson?.exercise?.prompt || '',
    ...(Array.isArray(lesson?.takeaways) ? lesson.takeaways : []),
    ...(Array.isArray(lesson?.mistakes) ? lesson.mistakes : []),
  ];
  const words = parts.join(' ').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 180));
}

function diffLines(want, got) {
  const wantLines = want.split('\n');
  const gotLines = got.split('\n');
  const max = Math.max(wantLines.length, gotLines.length);
  const rows = [];
  for (let i = 0; i < max; i++) {
    const w = wantLines[i];
    const g = gotLines[i];
    if (w === g) {
      rows.push({ type: 'same', text: w ?? '' });
    } else {
      if (w !== undefined) rows.push({ type: 'want', text: w });
      if (g !== undefined) rows.push({ type: 'got', text: g });
    }
  }
  return rows;
}

const STORAGE_PREFIX = 'pgcode_course_';
const COMPLETED_PREFIX = 'pgcode_course_done_';

function loadCompletedSet(slug) {
  try {
    const raw = localStorage.getItem(COMPLETED_PREFIX + slug);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function saveCompletedSet(slug, set) {
  try {
    localStorage.setItem(COMPLETED_PREFIX + slug, JSON.stringify(Array.from(set)));
  } catch {
    /* ignore quota */
  }
}

export default function CoursePage() {
  const { slug, lessonId } = useParams();
  const course = COURSES[slug];

  const lessons = useMemo(() => course?.lessons || [], [course]);
  const idx = useMemo(() => {
    if (!lessonId) return 0;
    const i = lessons.findIndex(l => l.id === lessonId);
    return i === -1 ? 0 : i;
  }, [lessons, lessonId]);
  const lesson = lessons[idx];

  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [running, setRunning] = useState(false);
  const [grade, setGrade] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [completed, setCompleted] = useState(() => loadCompletedSet(slug));
  const [justSolved, setJustSolved] = useState(false);

  const lessonStarter = lesson?.exercise?.starter ?? lesson?.code ?? '';
  const activeLessonId = lesson?.id;

  useEffect(() => {
    if (!activeLessonId) return;
    const key = STORAGE_PREFIX + slug + '_' + activeLessonId;
    const saved = localStorage.getItem(key);
    setCode(saved ?? lessonStarter);
    setOutput('');
    setGrade(null);
    setShowHint(false);
    setJustSolved(false);
  }, [slug, activeLessonId, lessonStarter]);

  useEffect(() => {
    if (!activeLessonId) return;
    const key = STORAGE_PREFIX + slug + '_' + activeLessonId;
    const t = setTimeout(() => localStorage.setItem(key, code), 300);
    return () => clearTimeout(t);
  }, [code, slug, activeLessonId]);

  useEffect(() => {
    setCompleted(loadCompletedSet(slug));
  }, [slug]);

  if (!course) {
    return (
      <div className="courses-container">
        <Breadcrumb items={[{ label: 'Courses', to: '/courses' }, { label: 'Course' }]} />
        <h1 className="courses-title">Course not found</h1>
        <p className="courses-sub">No course with id "{slug}".</p>
      </div>
    );
  }

  const readMin = estimateReadMinutes(lesson);
  const monacoLang = course.language === 'cpp' ? 'cpp' : course.language;
  const monacoTheme = resolveMonacoTheme();

  const markComplete = (lid) => {
    setCompleted(prev => {
      if (prev.has(lid)) return prev;
      const next = new Set(prev);
      next.add(lid);
      saveCompletedSet(slug, next);
      return next;
    });
  };

  const handleRun = async () => {
    setRunning(true);
    setOutput('');
    setGrade(null);
    setJustSolved(false);
    try {
      const res = await runCode(code, course.language, '');
      const stdout = res?.stdout || '';
      const stderr = res?.stderr || res?.compile_output || '';
      setOutput(stderr ? `[stderr]\n${stderr}\n[stdout]\n${stdout}` : stdout);
      if (lesson.exercise?.expected != null) {
        const actual = normalizeOutput(stdout);
        const want = normalizeOutput(lesson.exercise.expected);
        if (actual === want) {
          setGrade({ ok: true });
          markComplete(activeLessonId);
          setJustSolved(true);
          setTimeout(() => setJustSolved(false), 1400);
        } else {
          setGrade({ ok: false, want, actual });
        }
      }
    } catch (e) {
      setOutput(`Error: ${e?.message || String(e)}`);
    } finally {
      setRunning(false);
    }
  };

  const prev = idx > 0 ? lessons[idx - 1] : null;
  const next = idx < lessons.length - 1 ? lessons[idx + 1] : null;
  const lessonNumber = idx + 1;
  const totalLessons = lessons.length;
  const isComplete = completed.has(activeLessonId);

  const lessonTitle = lesson?.title ? lesson.title.replace(/^\d+\.\s*/, '') : null;
  const crumbItems = lessonTitle
    ? [
        { label: 'Courses', to: '/courses' },
        { label: course.title, to: `/courses/${course.id}` },
        { label: lessonTitle },
      ]
    : [
        { label: 'Courses', to: '/courses' },
        { label: course.title },
      ];

  return (
    <div className="course-page">
      <Breadcrumb items={crumbItems} className="course-crumb" />
      <aside className="course-side">
        <h1 className="course-side-title" style={{ '--course-color': course.color }}>{course.title}</h1>
        <div className="course-side-progress" style={{ '--course-color': course.color }}>
          <div
            className="course-side-progress-bar"
            style={{ width: `${(completed.size / Math.max(1, totalLessons)) * 100}%` }}
          />
          <span className="course-side-progress-label">
            {completed.size}/{totalLessons} done
          </span>
        </div>
        <ol className="course-side-list">
          {lessons.map((l, i) => {
            const done = completed.has(l.id);
            const isActive = i === idx;
            return (
              <li key={l.id}>
                <Link
                  to={`/courses/${course.id}/${l.id}`}
                  className={`course-side-link ${isActive ? 'active' : ''} ${done ? 'done' : ''}`}
                  style={{ '--course-color': course.color }}
                >
                  <span className={`course-side-marker ${done ? 'done' : ''}`}>
                    {done ? <Check size={11} strokeWidth={3} /> : <span className="course-side-num">{i + 1}</span>}
                  </span>
                  <span className="course-side-name">{l.title.replace(/^\d+\.\s*/, '')}</span>
                </Link>
              </li>
            );
          })}
        </ol>
      </aside>

      <main className="course-main">
        <header className="course-lesson-head" style={{ '--course-color': course.color }}>
          <div className="course-lesson-crumb">
            <span className="course-lesson-progress">Lesson {lessonNumber} of {totalLessons}</span>
            {isComplete && (
              <span className="course-lesson-done-pill">
                <CheckCircle2 size={11} /> Completed
              </span>
            )}
          </div>
          <div className="course-lesson-title-row">
            <span className="course-lesson-badge">{lessonNumber}</span>
            <h2 className="course-lesson-title">{lesson.title.replace(/^\d+\.\s*/, '')}</h2>
          </div>
          <div className="course-lesson-meta">
            <span className="course-meta-pill">
              <Clock size={11} /> {readMin} min read
            </span>
            <span className="course-meta-pill">
              <Target size={11} /> {course.language.toUpperCase()}
            </span>
          </div>
          <IntroBody text={lesson.intro} />
        </header>

        <LessonViz viz={lesson.viz} />

        {lesson.code && (
          <section className="course-block course-block-example">
            <div className="course-block-head">Example</div>
            <div className="course-code-wrap">
              <Editor
                height={`${Math.min(320, Math.max(110, lesson.code.split('\n').length * 22 + 28))}px`}
                language={monacoLang}
                beforeMount={(monaco) => registerMonacoThemes(monaco)}
                theme={monacoTheme}
                value={lesson.code}
                options={{
                  readOnly: true,
                  domReadOnly: true,
                  fontSize: 14,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  lineNumbers: 'on',
                  renderLineHighlight: 'none',
                  padding: { top: 12, bottom: 12 },
                  fontFamily: '"Space Mono", monospace',
                  contextmenu: false,
                  scrollbar: { vertical: 'auto', horizontal: 'auto' },
                }}
              />
            </div>
          </section>
        )}

        {Array.isArray(lesson.takeaways) && lesson.takeaways.length > 0 && (
          <section className="course-block">
            <div className="course-block-head">
              <KeyRound size={11} /> Key takeaways
            </div>
            <ul className="course-takeaways">
              {lesson.takeaways.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </section>
        )}

        {Array.isArray(lesson.mistakes) && lesson.mistakes.length > 0 && (
          <section className="course-mistakes">
            <div className="course-mistakes-head">
              <AlertTriangle size={11} /> Common mistakes
            </div>
            <ul className="course-mistakes-list">
              {lesson.mistakes.map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          </section>
        )}

        {lesson.exercise && (
          <>
            <section className="course-task-card">
              <div className="course-task-head">
                <span className="course-task-tag">
                  <Target size={11} /> Exercise
                </span>
                <span className="course-task-sub">Try it yourself</span>
              </div>
              <p className="course-task-prompt">{lesson.exercise.prompt}</p>
              {lesson.exercise.expected && (
                <p className="course-hint">
                  Expected output: <code>{lesson.exercise.expected}</code>
                </p>
              )}
              {lesson.exercise.hint && (
                <>
                  <button className="course-hint-btn" onClick={() => setShowHint(s => !s)}>
                    <Lightbulb size={12} /> {showHint ? 'Hide hint' : 'Show hint'}
                  </button>
                  {showHint && (
                    <p className="course-hint">{lesson.exercise.hint}</p>
                  )}
                </>
              )}
            </section>

            <section className={`course-editor-card ${justSolved ? 'pulse' : ''}`}>
              <Editor
                height="260px"
                language={monacoLang}
                beforeMount={(monaco) => registerMonacoThemes(monaco)}
                theme={monacoTheme}
                value={code}
                onChange={(v) => setCode(v ?? '')}
                options={{
                  fontSize: 14,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  lineNumbers: 'on',
                  padding: { top: 12, bottom: 12 },
                  fontFamily: '"Space Mono", monospace',
                }}
              />
              <div className="course-run-bar">
                <button className="course-run-btn" onClick={handleRun} disabled={running}>
                  {running ? <Loader2 size={13} className="spin" /> : <Play size={13} />}
                  {running ? 'Running…' : 'Run'}
                </button>
                {grade && grade.ok && (
                  <span className="course-grade ok">
                    <CheckCircle2 size={13} className="check-pop" />
                    Correct!
                  </span>
                )}
                {grade && !grade.ok && (
                  <span className="course-grade bad">
                    <X size={13} />
                    Not yet — check the diff
                  </span>
                )}
              </div>
              {output && (
                <pre className="course-output">{output}</pre>
              )}
              {grade && !grade.ok && (
                <div className="course-diff">
                  <div className="course-diff-head">Output diff</div>
                  <div className="course-diff-body">
                    {diffLines(grade.want, grade.actual || '').map((row, i) => (
                      <div key={i} className={`course-diff-row ${row.type}`}>
                        <span className="course-diff-mark">
                          {row.type === 'want' ? '-' : row.type === 'got' ? '+' : ' '}
                        </span>
                        <span className="course-diff-text">{row.text || ' '}</span>
                      </div>
                    ))}
                  </div>
                  <div className="course-diff-legend">
                    <span className="course-diff-legend-item want"><span>-</span> expected</span>
                    <span className="course-diff-legend-item got"><span>+</span> your output</span>
                  </div>
                </div>
              )}
            </section>
          </>
        )}

        {lesson.next?.label && lesson.next?.href && (
          <a className="course-next-pointer" href={lesson.next.href}>
            <span className="course-next-pointer-label">Next</span>
            <span className="course-next-pointer-arrow">&rarr;</span>
            <span className="course-next-pointer-target">{lesson.next.label}</span>
          </a>
        )}

        <nav className="course-nav-big">
          {prev ? (
            <Link to={`/courses/${course.id}/${prev.id}`} className="course-nav-big-btn prev">
              <ArrowLeft size={16} />
              <span className="course-nav-big-meta">
                <span className="course-nav-big-label">Previous</span>
                <span className="course-nav-big-title">{prev.title.replace(/^\d+\.\s*/, '')}</span>
              </span>
            </Link>
          ) : (
            <span className="course-nav-big-btn disabled">
              <ArrowLeft size={16} />
              <span className="course-nav-big-meta">
                <span className="course-nav-big-label">Previous</span>
                <span className="course-nav-big-title">Start of course</span>
              </span>
            </span>
          )}
          {next ? (
            <Link to={`/courses/${course.id}/${next.id}`} className="course-nav-big-btn next">
              <span className="course-nav-big-meta right">
                <span className="course-nav-big-label">Up next</span>
                <span className="course-nav-big-title">{next.title.replace(/^\d+\.\s*/, '')}</span>
              </span>
              <ArrowRight size={16} />
            </Link>
          ) : (
            <span className="course-nav-big-btn done">
              <span className="course-nav-big-meta right">
                <span className="course-nav-big-label">Course</span>
                <span className="course-nav-big-title">Complete</span>
              </span>
              <CheckCircle2 size={16} />
            </span>
          )}
        </nav>
      </main>
    </div>
  );
}
