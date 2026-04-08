import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Play } from 'lucide-react';
import './LearningsSection.css';

export default function LearningsSection({ topicId }) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    async function fetchVideos() {
      try {
        const { data, error } = await supabase
          .from('PGcode_topic_videos')
          .select('*')
          .eq('topic_id', topicId)
          .order('sort_order', { ascending: true });

        if (error) throw error;
        setVideos(data || []);
      } catch (err) {
        console.error('Error fetching learning videos:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchVideos();
  }, [topicId]);

  if (loading) {
    return <div className="learnings-loading">Loading videos...</div>;
  }

  if (videos.length === 0) {
    return (
      <div className="learnings-empty">
        <p>No learning videos added for this topic yet.</p>
      </div>
    );
  }

  return (
    <div className="learnings-section">
      <p className="learnings-intro">
        Video explanations that cover the core concepts for this topic.
      </p>

      <div className="video-list">
        {videos.map((video) => (
          <div key={video.id} className="video-card">
            {expandedId === video.id ? (
              <div className="video-embed">
                <iframe
                  src={`https://www.youtube.com/embed/${video.youtube_video_id}`}
                  title={video.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <div
                className="video-thumbnail"
                onClick={() => setExpandedId(video.id)}
              >
                <img
                  src={`https://img.youtube.com/vi/${video.youtube_video_id}/mqdefault.jpg`}
                  alt={video.title}
                  loading="lazy"
                />
                <div className="play-overlay">
                  <Play size={32} />
                </div>
              </div>
            )}
            <div className="video-info">
              <span className="video-title">{video.title}</span>
              <span className="video-source">{video.source === 'neetcode' ? 'NeetCode' : 'Learning Resource'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
