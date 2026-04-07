import React, { useEffect, useState } from 'react';
import { X, PlayCircle, Star, CheckCircle, ExternalLink, Video, FileText, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import './TopicModal.css';

export default function TopicModal({ topic, onClose }) {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProblems() {
      try {
        const { data, error } = await supabase
          .from('PGcode_problems')
          .select('*')
          .eq('topic_id', topic.id);
        
        if (error) throw error;
        setProblems(data || []);
      } catch (err) {
        console.error("Error fetching problems:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProblems();
  }, [topic.id]);

  if (!topic) return null;

  // Split title and tags
  const rawTitle = topic.data?.label || topic.name || '';
  const [mainTitle, ...tagParts] = rawTitle.split('\\n');
  const tags = tagParts.join(' ').split(',').map(t => t.trim()).filter(Boolean);

  // Mock progress for UI
  const completedCount = problems.filter(p => p.is_completed).length;
  const totalCount = problems.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="topicModalOverlay" onClick={(e) => {
      if (e.target.className === 'topicModalOverlay') onClose();
    }}>
      <div className="topicModalContent">
        
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

        <div className="topicModalBody">
          {tags.length > 0 && (
            <div className="prerequisitesSection">
              <span className="sectionLabel">Tags / Details</span>
              <div className="tagList">
                {tags.map((tag, i) => (
                  <div key={i} className="topicTag">{tag}</div>
                ))}
              </div>
            </div>
          )}

          <div className="problemTableSection">
            <div className="tableHeader">
              <div className="col-status">Status</div>
              <div className="col-star">Star</div>
              <div className="col-problem">Problem</div>
              <div className="col-diff">Difficulty</div>
              <div className="col-sol">Solution</div>
            </div>

            {loading ? (
              <div className="loadingState">Loading patterns...</div>
            ) : (
              <div className="tableBody">
                {problems.map(prob => (
                  <div key={prob.id} className="tableRow">
                    <div className="col-status">
                      <CheckCircle size={18} className={prob.is_completed ? "status-done" : "status-todo"} />
                    </div>
                    <div className="col-star">
                      <Star size={18} className={prob.is_starred ? "star-active" : "star-inactive"} />
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
                    <div className="col-sol">
                      <div className="solIcons">
                        <Video size={16} title="Video Solution" />
                        <FileText size={16} title="Code Template" />
                      </div>
                    </div>
                  </div>
                ))}
                {problems.length === 0 && (
                  <div className="emptyState">No problems added to this collection yet.</div>
                )}
              </div>
            )}
          </div>
          
          <Link to={`/category/${topic.id}`} className="enterWorkspaceBtn">
            ENTER INTERACTIVE WORKSPACE
          </Link>
        </div>
      </div>
    </div>
  );
}
