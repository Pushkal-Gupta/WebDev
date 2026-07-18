import React, { useState, useEffect, useRef } from 'react';
import { useDryRun } from '../lib/queries';
import { SkipBack, SkipForward, Play, Pause, ChevronsLeft, ChevronsRight } from 'lucide-react';
import ArrayRenderer from './renderers/ArrayRenderer';
import GraphRenderer from './renderers/GraphRenderer';
import TreeRenderer from './renderers/TreeRenderer';
import LinkedListRenderer from './renderers/LinkedListRenderer';
import StackQueueRenderer from './renderers/StackQueueRenderer';
import HashMapRenderer from './renderers/HashMapRenderer';
import GeometryRenderer from './renderers/GeometryRenderer';
import DisjointSetRenderer from './renderers/DisjointSetRenderer';
import './DryRunViewer.css';

function detectType(data) {
  if (!data) return 'unknown';
  if (data.type) return data.type;
  if (data.parent) return 'disjoint-set';
  if (data.points || data.rectangles || data.lines) return 'geometry';
  if (data.array) return 'array';
  if (data.nodes && data.edges && data.directed !== undefined) return 'graph';
  if (data.nodes && data.edges) return 'tree';
  if (data.nodes && !data.edges) return 'linked-list';
  if (data.items) return 'stack';
  if (data.entries) return 'hashmap';
  return 'array';
}

function renderVisualState(data) {
  if (!data) return null;
  const type = detectType(data);

  switch (type) {
    case 'array':
      return <ArrayRenderer data={data} />;
    case 'graph':
      return <GraphRenderer data={data} />;
    case 'tree':
      return <TreeRenderer data={data} />;
    case 'linked-list':
      return <LinkedListRenderer data={data} />;
    case 'stack':
    case 'queue':
      return <StackQueueRenderer data={data} />;
    case 'hashmap':
      return <HashMapRenderer data={data} />;
    case 'geometry':
      return <GeometryRenderer data={data} />;
    case 'disjoint-set':
      return <DisjointSetRenderer data={data} />;
    default:
      return <ArrayRenderer data={data} />;
  }
}

export default function DryRunViewer({ problemId, sectionTitle, subtitle }) {
  const { steps, questions, isLoading: loading } = useDryRun(problemId);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(1500);
  const playRef = useRef(null);
  const feedbackTimeoutRef = useRef(null);

  useEffect(() => () => {
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
  }, []);

  // Reset playback state when problem changes
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setCurrentStepIndex(0);
    setActiveQuestion(null);
    setFeedback(null);
    setIsPlaying(false);
  }, [problemId]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Auto-play
  useEffect(() => {
    if (isPlaying && !activeQuestion) {
      playRef.current = setInterval(() => {
        setCurrentStepIndex(prev => {
          if (prev >= steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, playSpeed);
    }
    return () => clearInterval(playRef.current);
  }, [isPlaying, playSpeed, steps.length, activeQuestion]);

  // Question trigger on step change
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (steps.length === 0) return;
    const currentStep = steps[currentStepIndex];
    if (currentStep && questions[currentStep.id]) {
      setActiveQuestion(questions[currentStep.id]);
      setIsPlaying(false);
    } else {
      setActiveQuestion(null);
      setFeedback(null);
    }
  }, [currentStepIndex, steps, questions]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleJumpStart = () => {
    setIsPlaying(false);
    setCurrentStepIndex(0);
  };

  const handleJumpEnd = () => {
    setIsPlaying(false);
    setCurrentStepIndex(steps.length - 1);
  };

  const answerQuestion = (option) => {
    if (!activeQuestion) return;
    if (option === activeQuestion.correct_answer) {
      setFeedback({ type: 'success', text: activeQuestion.explanation || 'Correct!' });
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
      feedbackTimeoutRef.current = setTimeout(() => {
        setActiveQuestion(null);
        setFeedback(null);
        feedbackTimeoutRef.current = null;
      }, 2000);
    } else {
      setFeedback({ type: 'error', text: activeQuestion.hint || 'Incorrect. Try again!' });
    }
  };

  // A single authored step is not a "dry run" — it renders a useless one-frame
  // stepper. The step-by-step visualization (viz_steps) is the real walkthrough
  // now, so hide this legacy section entirely unless it has ≥2 real steps.
  if (loading || steps.length < 2) {
    return null;
  }

  // Detect placeholder-only data: rows whose array contents are short string
  // labels like "step1"/"input"/"algo" rather than real values. Such rows were
  // bulk-seeded with no real algorithmic content and produce a misleading viz.
  const isPlaceholderShape = steps.every(s => {
    const arr = s.visual_state_data?.array;
    if (!Array.isArray(arr) || arr.length === 0) return false;
    return arr.every(cell => {
      const v = cell && typeof cell === 'object' ? cell.value : cell;
      return typeof v === 'string' && /^(step\d+|input|algo|approach)$/i.test(v);
    });
  });
  if (isPlaceholderShape) {
    return null;
  }

  const currentStep = steps[currentStepIndex];

  return (
    <div className="dryrun-container">
      {sectionTitle && (
        subtitle
          ? <h4 className="sv-subtitle">{sectionTitle}</h4>
          : <h3 className="sv-section-title">{sectionTitle}</h3>
      )}
      {/* Title */}
      <div className="dryrun-title">
        <strong>{currentStep.title}</strong>
      </div>

      {/* Visualization Area */}
      <div className="dryrun-canvas">
        {currentStep.visual_state_data?.status && (
          <div className="dryrun-status">{currentStep.visual_state_data.status}</div>
        )}

        <div className="dryrun-visual">
          {renderVisualState(currentStep.visual_state_data)}
        </div>
      </div>

      {/* Question Overlay */}
      {activeQuestion && (
        <div className="dryrun-question">
          <h4>Knowledge Check</h4>
          <p className="question-text">{activeQuestion.question_text}</p>

          {activeQuestion.options?.length > 0 && (
            <div className="question-options">
              {activeQuestion.options.map((opt, i) => (
                <button key={i} className="question-opt-btn" onClick={() => answerQuestion(opt)}>
                  {opt}
                </button>
              ))}
            </div>
          )}

          {feedback && (
            <div className={`question-feedback ${feedback.type}`}>
              {feedback.text}
            </div>
          )}
        </div>
      )}

      {/* Controls Bar (GFG-style bottom) */}
      <div className="dryrun-controls">
        <button
          className="ctrl-btn"
          onClick={handleJumpStart}
          disabled={currentStepIndex === 0 || !!activeQuestion}
          title="Jump to start"
        >
          <ChevronsLeft size={18} />
        </button>

        <button
          className="ctrl-btn"
          onClick={handlePrev}
          disabled={currentStepIndex === 0 || !!activeQuestion}
          title="Previous"
        >
          <SkipBack size={18} />
        </button>

        <button
          className="ctrl-btn ctrl-play"
          onClick={() => setIsPlaying(!isPlaying)}
          disabled={!!activeQuestion}
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause size={20} /> : <Play size={20} />}
        </button>

        <button
          className="ctrl-btn"
          onClick={handleNext}
          disabled={currentStepIndex === steps.length - 1 || !!activeQuestion}
          title="Next"
        >
          <SkipForward size={18} />
        </button>

        <button
          className="ctrl-btn"
          onClick={handleJumpEnd}
          disabled={currentStepIndex === steps.length - 1 || !!activeQuestion}
          title="Jump to end"
        >
          <ChevronsRight size={18} />
        </button>

        <span className="step-counter">{currentStepIndex + 1} / {steps.length}</span>

        <select
          className="speed-select"
          value={playSpeed}
          onChange={e => setPlaySpeed(Number(e.target.value))}
        >
          <option value={2500}>0.5x</option>
          <option value={1500}>1x</option>
          <option value={800}>2x</option>
          <option value={400}>4x</option>
        </select>
      </div>
    </div>
  );
}
