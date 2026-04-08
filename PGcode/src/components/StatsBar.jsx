import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Flame, Target, RotateCcw, TrendingUp } from 'lucide-react';
import './StatsBar.css';

export default function StatsBar({ session }) {
  const [stats, setStats] = useState({ streak: 0, totalSolved: 0, dueForReview: 0, avgConfidence: 0 });

  useEffect(() => {
    if (!session?.user) return;

    async function fetchStats() {
      try {
        const { data: progress } = await supabase
          .from('PGcode_user_progress')
          .select('*')
          .eq('user_id', session.user.id);

        if (!progress) return;

        const completed = progress.filter(p => p.is_completed);
        const totalSolved = completed.length;

        // Due for review: next_review_at <= now
        const now = new Date();
        const dueForReview = completed.filter(p => {
          if (!p.next_review_at) return false;
          return new Date(p.next_review_at) <= now;
        }).length;

        // Average confidence
        const withConfidence = completed.filter(p => p.confidence > 0);
        const avgConfidence = withConfidence.length > 0
          ? (withConfidence.reduce((sum, p) => sum + p.confidence, 0) / withConfidence.length).toFixed(1)
          : 0;

        // Streak from profile
        const { data: profile } = await supabase
          .from('PGcode_profiles')
          .select('current_streak')
          .eq('user_id', session.user.id)
          .single();

        setStats({
          streak: profile?.current_streak || 0,
          totalSolved,
          dueForReview,
          avgConfidence,
        });
      } catch (err) {
        // Stats are non-critical
      }
    }

    fetchStats();
  }, [session]);

  if (!session) return null;

  return (
    <div className="stats-bar">
      <div className="stat-item">
        <Flame size={16} className="stat-icon stat-streak" />
        <div className="stat-content">
          <span className="stat-value">{stats.streak}</span>
          <span className="stat-label">Day Streak</span>
        </div>
      </div>

      <div className="stat-item">
        <Target size={16} className="stat-icon stat-solved" />
        <div className="stat-content">
          <span className="stat-value">{stats.totalSolved}</span>
          <span className="stat-label">Solved</span>
        </div>
      </div>

      <div className="stat-item">
        <RotateCcw size={16} className="stat-icon stat-review" />
        <div className="stat-content">
          <span className="stat-value">{stats.dueForReview}</span>
          <span className="stat-label">Due Review</span>
        </div>
      </div>

      <div className="stat-item">
        <TrendingUp size={16} className="stat-icon stat-confidence" />
        <div className="stat-content">
          <span className="stat-value">{stats.avgConfidence}</span>
          <span className="stat-label">Confidence</span>
        </div>
      </div>
    </div>
  );
}
