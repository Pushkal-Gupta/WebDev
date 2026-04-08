import React, { useEffect, useState, useRef, useCallback } from 'react';
import { X, Star, CheckCircle, ExternalLink, Video, FileText, ChevronLeft, Code2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import LearningsSection from './LearningsSection';
import './TopicModal.css';

const difficultyOrder = { 'Easy': 0, 'Medium': 1, 'Hard': 2 };

export default function TopicModal({ topic, onClose, roadmapMode, session }) {
  const [problems, setProblems] = useState([]);
  const [userProgress, setUserProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('problems');
  const [width, setWidth] = useState(parseInt(localStorage.getItem('pgcode_sidebar_width')) || 500);
  const isResizing = useRef(false);

  useEffect(() => {
    async function loadProblems() {
      try {
        // Parallel fetch: problems + user progress
        const [problemsRes, progressRes] = await Promise.all([
          supabase.from('PGcode_problems').select('*').eq('topic_id', topic.id),
          session?.user
            ? supabase.from('PGcode_user_progress').select('*').eq('user_id', session.user.id)
            : Promise.resolve({ data: null }),
        ]);

        if (problemsRes.error) throw problemsRes.error;

        let filtered = problemsRes.data || [];
        if (roadmapMode === '200') {
          filtered = filtered.filter(p =>
            p.roadmap_set === '200' || p.roadmap_set === 'both' || !p.roadmap_set
          );
        }

        const sorted = [...filtered].sort((a, b) =>
          difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]
        );
        setProblems(sorted);

        if (progressRes.data) {
          const map = {};
          progressRes.data.forEach(p => { map[p.problem_id] = p; });
          setUserProgress(map);
        }
      } catch (err) {
        console.error("Error fetching problems:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProblems();
  }, [topic.id, roadmapMode, session]);

  const toggleComplete = async (problemId) => {
    if (!session?.user) return;
    const current = userProgress[problemId];
    const newVal = !(current?.is_completed);

    const { error } = await supabase.from('PGcode_user_progress').upsert({
      user_id: session.user.id,
      problem_id: problemId,
      is_completed: newVal,
      is_starred: current?.is_starred ?? false,
      updated_at: new Date().toISOString()
    });

    if (error) { console.error('Toggle complete failed:', error); return; }

    setUserProgress(prev => ({
      ...prev,
      [problemId]: { ...prev[problemId], is_completed: newVal }
    }));
  };

  const toggleStar = async (problemId) => {
    if (!session?.user) return;
    const current = userProgress[problemId];
    const newVal = !(current?.is_starred);

    const { error } = await supabase.from('PGcode_user_progress').upsert({
      user_id: session.user.id,
      problem_id: problemId,
      is_starred: newVal,
      is_completed: current?.is_completed ?? false,
      updated_at: new Date().toISOString()
    });

    if (error) { console.error('Toggle star failed:', error); return; }

    setUserProgress(prev => ({
      ...prev,
      [problemId]: { ...prev[problemId], is_starred: newVal }
    }));
  };

  const handleMouseDown = () => {
    isResizing.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'ew-resize';
  };

  const handleMouseMove = useCallback((e) => {
    if (!isResizing.current) return;
    const newWidth = window.innerWidth - e.clientX;
    if (newWidth > 400 && newWidth < 950) {
      setWidth(newWidth);
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    isResizing.current = false;
    localStorage.setItem('pgcode_sidebar_width', width);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'default';
  }, [width, handleMouseMove]);

  if (!topic) return null;

  const rawTitle = topic.data?.label || topic.name || '';
  const [mainTitle] = rawTitle.split('\\n');

  const completedCount = problems.filter(p => userProgress[p.id]?.is_completed).length;
  const totalCount = problems.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="topicModalOverlay" onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <div className="topicModalContent" style={{ width: `${width}px` }}>
        <div className="resize-handle" onMouseDown={handleMouseDown} />

        <div className="topicModalHeader">
          <button className="backBtn" onClick={onClose}>
            <ChevronLeft size={18} />
            <span>Back</span>
          </button>

          <div className="headerCenter">
            <h2 className="modalMainTitle">{mainTitle}</h2>
            <div className="progressFraction">({completedCount} / {totalCount})</div>
            <div className="modalProgressBar">
              <div className="modalProgressFill" style={{ width: `${progressPercent}%` }}></div>
            </div>
          </div>

          <button className="closeBtn" onClick={onClose}><X size={20} /></button>
        </div>

        {/* Tab Bar */}
        <div className="modal-tabs">
          <button
            className={`modal-tab ${activeTab === 'problems' ? 'active' : ''}`}
            onClick={() => setActiveTab('problems')}
          >
            Problems ({totalCount})
          </button>
          <button
            className={`modal-tab ${activeTab === 'learnings' ? 'active' : ''}`}
            onClick={() => setActiveTab('learnings')}
          >
            Learnings
          </button>
        </div>

        <div className="topicModalBody">
          {activeTab === 'problems' && (
            <>
              <div className="problemTableSection">
                <div className="tableHeader">
                  <div className="col-status">Status</div>
                  <div className="col-star">Star</div>
                  <div className="col-problem">Problem</div>
                  <div className="col-diff">Difficulty</div>
                  <div className="col-solve">Solve</div>
                </div>

                {loading ? (
                  <div className="loadingState">Loading problems...</div>
                ) : (
                  <div className="tableBody">
                    {problems.map(prob => {
                      const progress = userProgress[prob.id] || {};
                      return (
                        <div key={prob.id} className="tableRow">
                          <div className="col-status">
                            <CheckCircle
                              size={18}
                              className={progress.is_completed ? "status-done" : "status-todo"}
                              onClick={() => toggleComplete(prob.id)}
                              style={{ cursor: session ? 'pointer' : 'default' }}
                            />
                          </div>
                          <div className="col-star">
                            <Star
                              size={18}
                              className={progress.is_starred ? "star-active" : "star-inactive"}
                              onClick={() => toggleStar(prob.id)}
                              style={{ cursor: session ? 'pointer' : 'default' }}
                            />
                          </div>
                          <div className="col-problem">
                            <Link to={`/category/${topic.id}/${prob.id}`} className="problemLink">
                              {prob.name}
                              <ExternalLink size={12} className="linkIcon" />
                            </Link>
                          </div>
                          <div className={`col-diff diff-${prob.difficulty.toLowerCase()}`}>
                            {prob.difficulty}
                          </div>
                          <div className="col-solve">
                            <div className="solveIcons">
                              <Link to={`/category/${topic.id}/${prob.id}`} className="solve-icon solve-platform" title="Solve on PGcode">
                                <Code2 size={15} />
                              </Link>
                              {prob.leetcode_url && (
                                <a href={prob.leetcode_url} target="_blank" rel="noopener noreferrer" className="solve-icon solve-lc" title="Solve on LeetCode">
                                  <ExternalLink size={14} />
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {problems.length === 0 && (
                      <div className="emptyState">No problems added yet.</div>
                    )}
                  </div>
                )}
              </div>

              <Link to={`/category/${topic.id}`} className="enterWorkspaceBtn">
                ENTER INTERACTIVE WORKSPACE
              </Link>
            </>
          )}

          {activeTab === 'learnings' && (
            <LearningsSection topicId={topic.id} />
          )}
        </div>
      </div>
    </div>
  );
}
