import React, { useEffect, useState } from 'react';
import { X, PlayCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import './TopicModal.css';

export default function TopicModal({ topic, onClose }) {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProblems() {
      // In case Supabase fails or data is not populated yet:
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

  return (
    <div className="topicModalOverlay" onClick={(e) => {
      if (e.target.className === 'topicModalOverlay') onClose();
    }}>
      <div className="topicModalContent">
        
        <div className="topicModalHeader">
          <h2>{topic.data?.label || topic.name}</h2>
          <button className="closeBtn" onClick={onClose}><X size={20} /></button>
        </div>

        {/* Example statically resolving YouTube embed based on data if available, or fallback */}
        {topic.topic_video_url ? (
          <div className="videoContainer">
            <iframe 
              src={`https://www.youtube.com/embed/${topic.topic_video_url}`} 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen
            ></iframe>
          </div>
        ) : (
          <div className="videoContainer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'var(--text-dim)'}}>
            <PlayCircle size={48} style={{ marginBottom: '1rem'}} />
            <p>No explanatory video found for this topic</p>
          </div>
        )}

        <div className="topicModalBody">
          <div>
            <h3 className="topicSectionTitle">Problems in this Topic</h3>
            {loading ? (
              <p style={{color: 'var(--text-dim)', fontFamily: 'var(--mono)'}}>Loading problems...</p>
            ) : problems.length > 0 ? (
              <div className="problemList">
                {problems.map(prob => (
                  <div key={prob.id} className="problemRow">
                    <div className="problemInfo">
                      <span className="problemTitle">{prob.name}</span>
                      <span className={`diff-badge diff-${prob.difficulty.toLowerCase()}`}>
                        {prob.difficulty}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{color: 'var(--text-dim)', fontFamily: 'var(--mono)'}}>
                Ready to dive in? Head to the workspace to start coding!
              </p>
            )}
          </div>

          <Link to={`/category/${topic.id}`} className="enterWorkspaceBtn">
            ENTER WORKSPACE
          </Link>
        </div>
      </div>
    </div>
  );
}
