import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import SolutionView from './SolutionView';
import './SolutionPage.css';

export default function SolutionPage() {
  const { problemId } = useParams();
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    if (!problemId) return;
    (async () => {
      setLoading(true);
      setFetchError(false);
      try {
        const { data } = await supabase
          .from('PGcode_problems')
          .select('*')
          .eq('id', problemId)
          .single();
        setProblem(data);
      } catch (err) {
        console.error('Error fetching problem:', err);
        setFetchError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [problemId]);

  if (loading) {
    return (
      <div className="solnpage">
        <div className="solnpage-loading">Loading solution...</div>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="solnpage">
        <div className="solnpage-error">
          {fetchError ? 'Failed to load problem. Check your connection.' : 'Problem not found.'}{' '}
          <Link to="/">Back to Roadmap</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="solnpage">
      <div className="solnpage-header">
        <Link to="/" className="solnpage-back">
          <ChevronLeft size={16} /> Back to Roadmap
        </Link>
      </div>
      <div className="solnpage-content">
        <SolutionView problem={problem} />
      </div>
    </div>
  );
}
