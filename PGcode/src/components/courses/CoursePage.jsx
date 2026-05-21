import React, { useState, useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { ChevronLeft, ArrowLeft, ArrowRight, Play, Loader2, Check, X, Lightbulb } from 'lucide-react';
import { COURSES } from '../../content/courses';
import { runCode } from '../../lib/codeRunner';
import './Courses.css';

function normalizeOutput(s) {
  if (s == null) return '';
  return String(s).replace(/\r\n/g, '\n').trim();
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

  const lessonStarter = lesson?.exercise?.starter ?? lesson?.code ?? '';
  const activeLessonId = lesson?.id;
  useEffect(() => {
    if (!activeLessonId) return;
    const key = `pgcode_course_${slug}_${activeLessonId}`;
    const saved = localStorage.getItem(key);
    setCode(saved ?? lessonStarter);
    setOutput('');
    setGrade(null);
    setShowHint(false);
  }, [slug, activeLessonId, lessonStarter]);

  useEffect(() => {
    if (!activeLessonId) return;
    const key = `pgcode_course_${slug}_${activeLessonId}`;
    const t = setTimeout(() => localStorage.setItem(key, code), 300);
    return () => clearTimeout(t);
  }, [code, slug, activeLessonId]);

  if (!course) {
    return (
      <div className="courses-container">
        <Link to="/courses" className="courses-back"><ChevronLeft size={12} /> All courses</Link>
        <h1 className="courses-title">Course not found</h1>
        <p className="courses-sub">No course with id "{slug}".</p>
      </div>
    );
  }

  const handleRun = async () => {
    setRunning(true);
    setOutput('');
    setGrade(null);
    try {
      const res = await runCode(code, course.language, '');
      const stdout = res?.stdout || '';
      const stderr = res?.stderr || res?.compile_output || '';
      setOutput(stderr ? `[stderr]\n${stderr}\n[stdout]\n${stdout}` : stdout);
      if (lesson.exercise?.expected != null) {
        const actual = normalizeOutput(stdout);
        const want = normalizeOutput(lesson.exercise.expected);
        if (actual === want) setGrade({ ok: true });
        else setGrade({ ok: false, reason: `Expected:\n  ${want}\n\nGot:\n  ${actual || '(no output)'}` });
      }
    } catch (e) {
      setOutput(`Error: ${e?.message || String(e)}`);
    } finally {
      setRunning(false);
    }
  };

  const prev = idx > 0 ? lessons[idx - 1] : null;
  const next = idx < lessons.length - 1 ? lessons[idx + 1] : null;

  return (
    <div className="course-page">
      <aside className="course-side">
        <Link to="/courses" className="courses-back"><ChevronLeft size={12} /> All courses</Link>
        <h1 className="course-side-title" style={{ '--course-color': course.color }}>{course.title}</h1>
        <ol className="course-side-list">
          {lessons.map((l, i) => (
            <li key={l.id}>
              <Link
                to={`/courses/${course.id}/${l.id}`}
                className={`course-side-link ${i === idx ? 'active' : ''}`}
                style={{ '--course-color': course.color }}
              >
                <span className="course-side-num">{i + 1}</span>
                <span className="course-side-name">{l.title.replace(/^\d+\.\s*/, '')}</span>
              </Link>
            </li>
          ))}
        </ol>
      </aside>

      <main className="course-main">
        <div className="course-lesson-head">
          <span className="course-lesson-progress">Lesson {idx + 1} of {lessons.length}</span>
          <h2 className="course-lesson-title">{lesson.title}</h2>
          <p className="course-lesson-intro">{lesson.intro}</p>
        </div>

        {lesson.code && (
          <div className="course-block">
            <div className="course-block-head">Example</div>
            <pre className="course-code"><code>{lesson.code}</code></pre>
          </div>
        )}

        {lesson.exercise && (
          <>
            <div className="course-block">
              <div className="course-block-head">Your turn</div>
              <p className="course-exercise-prompt">{lesson.exercise.prompt}</p>
              <button className="course-hint-btn" onClick={() => setShowHint(s => !s)}>
                <Lightbulb size={12} /> {showHint ? 'Hide hint' : 'Show hint'}
              </button>
              {showHint && (
                <p className="course-hint">
                  Expected output: <code>{lesson.exercise.expected}</code>
                </p>
              )}
            </div>

            <div className="course-editor-card">
              <Editor
                height="240px"
                language={course.language === 'cpp' ? 'cpp' : course.language}
                theme="vs-dark"
                value={code}
                onChange={(v) => setCode(v ?? '')}
                options={{
                  fontSize: 13,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  padding: { top: 10 },
                  fontFamily: '"Space Mono", monospace',
                }}
              />
              <div className="course-run-bar">
                <button className="course-run-btn" onClick={handleRun} disabled={running}>
                  {running ? <Loader2 size={13} className="spin" /> : <Play size={13} />}
                  {running ? 'Running…' : 'Run'}
                </button>
                {grade && (
                  <span className={`course-grade ${grade.ok ? 'ok' : 'bad'}`}>
                    {grade.ok ? <Check size={13} /> : <X size={13} />}
                    {grade.ok ? 'Correct!' : 'Not yet'}
                  </span>
                )}
              </div>
              {output && (
                <pre className="course-output">{output}</pre>
              )}
              {grade && !grade.ok && (
                <pre className="course-grade-reason">{grade.reason}</pre>
              )}
            </div>
          </>
        )}

        <div className="course-nav">
          {prev ? (
            <Link to={`/courses/${course.id}/${prev.id}`} className="course-nav-btn">
              <ArrowLeft size={13} /> {prev.title.replace(/^\d+\.\s*/, '')}
            </Link>
          ) : <span />}
          {next ? (
            <Link to={`/courses/${course.id}/${next.id}`} className="course-nav-btn course-nav-next">
              {next.title.replace(/^\d+\.\s*/, '')} <ArrowRight size={13} />
            </Link>
          ) : <span className="course-nav-done">Course complete</span>}
        </div>
      </main>
    </div>
  );
}
