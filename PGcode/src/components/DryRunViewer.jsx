import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { SkipBack, SkipForward, Play, Pause } from 'lucide-react';
import ArrayRenderer from './renderers/ArrayRenderer';
import GraphRenderer from './renderers/GraphRenderer';
import TreeRenderer from './renderers/TreeRenderer';
import LinkedListRenderer from './renderers/LinkedListRenderer';
import StackQueueRenderer from './renderers/StackQueueRenderer';
import HashMapRenderer from './renderers/HashMapRenderer';
import './DryRunViewer.css';

function detectType(data) {
  if (!data) return 'unknown';
  if (data.type) return data.type;
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
    default:
      return <ArrayRenderer data={data} />;
  }
}

export default function DryRunViewer({ problemId }) {
  const [steps, setSteps] = useState([]);
  const [questions, setQuestions] = useState({});
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(1500);
  const playRef = useRef(null);

  useEffect(() => {
    async function loadDryRunData() {
      setLoading(true);
      try {
        const { data: stepData } = await supabase
          .from('PGcode_interactive_dry_runs')
          .select('*')
          .eq('problem_id', problemId)
          .order('step_number', { ascending: true });

        const { data: qData } = await supabase
          .from('PGcode_interactive_questions')
          .select('*');

        setSteps(stepData || []);

        const qMap = {};
        if (qData) {
          qData.forEach(q => { qMap[q.dry_run_step_id] = q; });
        }
        setQuestions(qMap);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    if (problemId) {
      loadDryRunData();
      setCurrentStepIndex(0);
      setActiveQuestion(null);
      setFeedback(null);
      setIsPlaying(false);
    }
  }, [problemId]);

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

  const answerQuestion = (option) => {
    if (option === activeQuestion.correct_answer) {
      setFeedback({ type: 'success', text: activeQuestion.explanation || 'Correct!' });
      setTimeout(() => {
        setActiveQuestion(null);
        setFeedback(null);
      }, 2000);
    } else {
      setFeedback({ type: 'error', text: activeQuestion.hint || 'Incorrect. Try again!' });
    }
  };

  if (loading) {
    return <div className="dryrun-placeholder">Loading Visualizer...</div>;
  }

  if (steps.length === 0) {
    return <div className="dryrun-placeholder">No visual dry run available for this problem yet.</div>;
  }

  const currentStep = steps[currentStepIndex];

  return (
    <div className="dryrun-container">
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
