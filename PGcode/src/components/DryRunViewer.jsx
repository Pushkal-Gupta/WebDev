import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { SkipBack, SkipForward, Play, Pause } from 'lucide-react';
import './DryRunViewer.css';

export default function DryRunViewer({ problemId }) {
  const [steps, setSteps] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDryRunData() {
      setLoading(true);
      try {
        // Fetch dry run steps
        const { data: stepData } = await supabase
          .from('PGcode_interactive_dry_runs')
          .select('*')
          .eq('problem_id', problemId)
          .order('step_number', { ascending: true });

        // Fetch interactive questions
        const { data: qData } = await supabase
          .from('PGcode_interactive_questions')
          .select('*');
        
        setSteps(stepData || []);
        
        // Map questions to standard
        const qMap = {};
        if (qData) {
          qData.forEach(q => {
            qMap[q.dry_run_step_id] = q;
          });
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
    }
  }, [problemId]);

  // Handle advancing step and popping up question
  useEffect(() => {
    if (steps.length === 0) return;
    const currentStep = steps[currentStepIndex];
    if (currentStep && questions[currentStep.id]) {
      setActiveQuestion(questions[currentStep.id]);
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
      setFeedback({ type: 'success', text: activeQuestion.explanation || 'Correct! Proceeding...' });
      setTimeout(() => {
        setActiveQuestion(null);
        setFeedback(null);
      }, 2000);
    } else {
      setFeedback({ type: 'error', text: activeQuestion.hint || 'Incorrect. Try again!' });
    }
  };

  if (loading) {
    return <div style={{padding: '2rem', textAlign: 'center', color: 'var(--text-dim)', fontFamily: 'var(--mono)'}}>Loading Visualizer...</div>;
  }

  if (steps.length === 0) {
    return <div style={{padding: '2rem', textAlign: 'center', color: 'var(--text-dim)', fontFamily: 'var(--mono)'}}>No visual dry run available for this problem yet. Check the video solution!</div>;
  }

  const currentStep = steps[currentStepIndex];

  return (
    <div className="dryRunContainer">
      <div className="dryRunHeader">
        <div style={{fontFamily: 'var(--mono)', fontSize: '0.9rem', color: 'var(--text-dim)'}}>
          Step {currentStepIndex + 1} of {steps.length}: <strong style={{color: 'var(--accent)'}}>{currentStep.title}</strong>
        </div>
        
        <div className="timelineControls">
          <button className="controlBtn" onClick={handlePrev} disabled={currentStepIndex === 0 || activeQuestion}>
            <SkipBack size={18} />
          </button>
          <button className="controlBtn" onClick={handleNext} disabled={currentStepIndex === steps.length - 1 || activeQuestion}>
            <SkipForward size={18} />
          </button>
        </div>
      </div>
      
      <div className="dryRunBody">
        {/* Visual Engine Renderer */}
        <div className="simulation-canvas">
          {currentStep.visual_state_data?.status && (
            <div className="sim-status">
              {currentStep.visual_state_data.status}
            </div>
          )}

          {currentStep.visual_state_data?.array && (
             <div className="sim-array-container">
               {currentStep.visual_state_data.array.map((val, idx) => {
                 const isPointer = currentStep.visual_state_data.pointer === idx;
                 return (
                   <div key={idx} className={`sim-array-element ${isPointer ? 'active-pointer' : ''}`}>
                     <div className="sim-element-val">{val}</div>
                     <div className="sim-element-idx">{idx}</div>
                     {isPointer && (
                       <div className="sim-pointer-indicator">
                          <span>↑</span>
                          <span className="pointer-label">i</span>
                       </div>
                     )}
                   </div>
                 );
               })}
             </div>
          )}

          {currentStep.visual_state_data?.hashset !== undefined && (
             <div className="sim-hashset-container">
                <h4>Hash Set</h4>
                <div className="sim-hashset-elements">
                   {currentStep.visual_state_data.hashset.map((val, idx) => (
                     <div key={idx} className="sim-hashset-val">{val}</div>
                   ))}
                   {currentStep.visual_state_data.hashset.length === 0 && (
                     <span className="empty-text">Empty</span>
                   )}
                </div>
             </div>
          )}
        </div>

        {/* Interactive Check / Question Popover */}
        {activeQuestion && (
          <div className="interactiveQuestionPopup">
            <h4 style={{ margin: 0, color: 'var(--accent)', fontFamily: 'var(--mono)'}}>Knowledge Check</h4>
            <div className="questionText">{activeQuestion.question_text}</div>
            
            {activeQuestion.options && activeQuestion.options.length > 0 && (
              <div className="optionsList">
                {activeQuestion.options.map((opt, i) => (
                  <button key={i} className="optionBtn" onClick={() => answerQuestion(opt)}>
                    {opt}
                  </button>
                ))}
              </div>
            )}
            
            {feedback && (
              <div className={`feedbackText ${feedback.type === 'success' ? 'feedbackSuccess' : 'feedbackError'}`}>
                {feedback.text}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
