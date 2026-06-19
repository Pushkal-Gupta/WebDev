import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Star, CheckCircle, ExternalLink, Video, FileText, ChevronLeft, Code2, Lightbulb } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useTopicProblems, useUserProgress, useProblemsCompact, filterByRoadmap, qk } from '../lib/queries';
import { primaryTopicLabel } from '../lib/topicLabel';
import LearningsSection from './LearningsSection';
import './TopicModal.css';

const difficultyOrder = { 'Easy': 0, 'Medium': 1, 'Hard': 2 };

export default function TopicModal({ topic, onClose, roadmapMode, session }) {
  const queryClient = useQueryClient();
  const userId = session?.user?.id;
  const { data: rawProblems, isLoading } = useTopicProblems(topic?.id);
  const { data: allProblems } = useProblemsCompact();
  const { data: progressBundle } = useUserProgress(userId);
  const userProgress = progressBundle?.byId || {};
  const loading = isLoading;

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

  // Bug fix: TopicModal must intersect "this topic's problems" with "the
  // globally-ranked top-N for the current roadmap mode" — NOT apply the rank
  // limit on the topic-scoped subset (which would pick the top 100 problems
  // IN this topic, not the topic-subset of the global top 100).
  const problems = useMemo(() => {
    if (!rawProblems) return [];
    let filtered = rawProblems;
    if (roadmapMode !== 'all' && allProblems && allProblems.length) {
      const allowed = new Set(filterByRoadmap(allProblems, roadmapMode).map(p => p.id));
      filtered = rawProblems.filter(p => allowed.has(p.id));
    }
    const isGeneric = (name) => /Pattern #\d+|Challenge #\d+/.test(name);
    return [...filtered].sort((a, b) => {
      const ag = isGeneric(a.name) ? 1 : 0;
      const bg = isGeneric(b.name) ? 1 : 0;
      if (ag !== bg) return ag - bg;
      return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
    });
  }, [rawProblems, allProblems, roadmapMode]);

  const progressMutation = useMutation({
    mutationFn: async ({ problemId, patch }) => {
      const current = userProgress[problemId] || {};
      const next = {
        user_id: userId,
        problem_id: problemId,
        is_completed: current.is_completed ?? false,
        is_starred: current.is_starred ?? false,
        ...patch,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from('PGcode_user_progress').upsert(next);
      if (error) throw error;
      return next;
    },
    onMutate: async ({ problemId, patch }) => {
      const key = qk.userProgress(userId);
      await queryClient.cancelQueries({ queryKey: key });
      const prev = queryClient.getQueryData(key);
      queryClient.setQueryData(key, (old) => {
        const rows = old?.rows ? [...old.rows] : [];
        const byId = { ...(old?.byId || {}) };
        const existing = byId[problemId] || { problem_id: problemId, user_id: userId };
        const merged = { ...existing, ...patch };
        byId[problemId] = merged;
        const idx = rows.findIndex(r => r.problem_id === problemId);
        if (idx >= 0) rows[idx] = merged; else rows.push(merged);
        return { rows, byId };
      });
      return { prev, key };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(ctx.key, ctx.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: qk.userProgress(userId) });
    },
  });

  const toggleComplete = (problemId) => {
    if (!userId || progressMutation.isPending) return;
    const current = userProgress[problemId];
    const nextCompleted = !current?.is_completed;
    progressMutation.mutate({
      problemId,
      patch: {
        is_completed: nextCompleted,
        status: nextCompleted ? 'solved' : (current?.is_starred ? 'bookmarked' : 'attempted'),
        status_changed_at: new Date().toISOString(),
      },
    });
  };

  const toggleStar = (problemId) => {
    if (!userId || progressMutation.isPending) return;
    const current = userProgress[problemId];
    progressMutation.mutate({ problemId, patch: { is_starred: !current?.is_starred } });
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
  const mainTitle = primaryTopicLabel(rawTitle);

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
                      {/* Deterministic widths so re-renders don't shimmer-jitter */}
                      {[72, 58, 80, 65, 76, 62].map((w, i) => (
                        <div key={i} className="skeleton-row">
                          <div className="skel skel-circle" />
                          <div className="skel skel-circle" />
                          <div className="skel skel-text" style={{ width: `${w}%` }} />
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
                                <Link to={`/category/${topic.id}/${prob.id}`} className="solve-icon solve-platform" title="Solve on PG Hub">
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
