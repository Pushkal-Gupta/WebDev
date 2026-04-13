import React, { useEffect, useState, useRef } from 'react';
import { X, Star, CheckCircle, ExternalLink, Video, FileText, ChevronLeft, Code2, Lightbulb } from 'lucide-react';
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
  const [width, setWidth] = useState(() => {
    const maxAllowed = window.innerWidth - 60;
    const preferred = Math.floor(window.innerWidth * 0.5);
    const minFloor = Math.min(600, maxAllowed);
    const stored = parseInt(localStorage.getItem('pgcode_sidebar_width'), 10);
    if (!isNaN(stored) && stored >= minFloor && stored <= maxAllowed) return stored;
    return Math.min(Math.max(preferred, minFloor), maxAllowed);
  });
  const isResizing = useRef(false);
  const resizeCleanup = useRef(null);

  // Cleanup any dangling resize listeners on unmount
  useEffect(() => {
    return () => {
      if (resizeCleanup.current) resizeCleanup.current();
    };
  }, []);

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
        } else if (roadmapMode === '300') {
          filtered = filtered.filter(p =>
            p.roadmap_set === '200' || p.roadmap_set === '300' || p.roadmap_set === 'both' || !p.roadmap_set
          );
        }

        const isGeneric = (name) => /Pattern #\d+|Challenge #\d+/.test(name);
        const sorted = [...filtered].sort((a, b) => {
          const ag = isGeneric(a.name) ? 1 : 0;
          const bg = isGeneric(b.name) ? 1 : 0;
          if (ag !== bg) return ag - bg;
          return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
        });
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
    if (!session?.user) { alert('Login to track progress'); return; }
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
    if (!session?.user) { alert('Login to star problems'); return; }
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

  const handleMouseDown = (e) => {
    e.preventDefault();
    isResizing.current = true;
    document.body.style.cursor = 'ew-resize';

    const maxWidth = window.innerWidth - 60;

    const onMove = (ev) => {
      if (!isResizing.current) return;
      const newW = window.innerWidth - ev.clientX;
      if (newW > 400 && newW < maxWidth) {
        setWidth(newW);
        localStorage.setItem('pgcode_sidebar_width', String(newW));
      }
    };

    const cleanup = () => {
      isResizing.current = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      resizeCleanup.current = null;
    };

    const onUp = () => cleanup();

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    resizeCleanup.current = cleanup;
  };

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
              <div className="problemsScrollArea">
                <div className="problemTableSection">
                  <div className="tableHeader">
                    <div className="col-status">Status</div>
                    <div className="col-star">Star</div>
                    <div className="col-problem">Problem</div>
                    <div className="col-solve">Solve</div>
                    <div className="col-diff">Difficulty</div>
                    <div className="col-solution">Solution</div>
                  </div>

                  {loading ? (
                    <div className="skeleton-list">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="skeleton-row">
                          <div className="skel skel-circle" />
                          <div className="skel skel-circle" />
                          <div className="skel skel-text" style={{ width: `${55 + Math.random() * 25}%` }} />
                          <div className="skel skel-text-short" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="tableBody">
                      {problems.map(prob => {
                        const progress = userProgress[prob.id] || {};
                        const displayName = prob.name.replace(/Pattern #(\d+)/, 'Problem #$1').replace(/Challenge #(\d+)/, 'Problem #$1');
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
                              <span className="problemName">{displayName}</span>
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
                            <div className={`col-diff diff-${prob.difficulty.toLowerCase()}`}>
                              {prob.difficulty}
                            </div>
                            <div className="col-solution">
                              <Link to={`/solution/${prob.id}`} className="solution-link" title="View Solution">
                                <Lightbulb size={15} />
                              </Link>
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
              </div>

              <div className="enterWorkspaceBtnWrap">
                <Link to={`/category/${topic.id}`} className="enterWorkspaceBtn">
                  ENTER INTERACTIVE WORKSPACE
                </Link>
              </div>
            </>
          )}

          {activeTab === 'learnings' && (
            <div className="learningsScrollArea">
              <LearningsSection topicId={topic.id} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
