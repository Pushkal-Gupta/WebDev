import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Breadcrumb from './common/Breadcrumb';
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
        <Breadcrumb items={[{ label: 'Practice', to: '/practice' }, { label: 'Solution' }]} />
        <div className="solnpage-loading">Loading solution...</div>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="solnpage">
        <Breadcrumb items={[{ label: 'Practice', to: '/practice' }, { label: 'Solution' }]} />
        <div className="solnpage-error">
          {fetchError ? 'Failed to load problem. Check your connection.' : 'Problem not found.'}
        </div>
      </div>
    );
  }

  return (
    <div className="solnpage">
      <Breadcrumb items={[{ label: 'Practice', to: '/practice' }, { label: problem.name || 'Solution' }]} />
      <div className="solnpage-content">
        <SolutionView problem={problem} />
      </div>
    </div>
  );
}
