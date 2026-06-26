import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Cpu, Search, ArrowRight } from 'lucide-react';
import { PG_FORGE_CUDA, PG_FORGE_CUDA_CATEGORIES } from './pgForgeCudaData';
import Breadcrumb from '../../common/Breadcrumb';
import ForgeThumb from './ForgeThumb';
import './PGForgeCuda.css';

const DIFFS = ['easy', 'medium', 'hard'];

// Pick a distinct ForgeThumb motif per kernel so cards don't all share the grid
// look. Title keywords win first (they're more specific than the category),
// then the broad category decides. Every branch lands on a different archetype.
function thumbFor(lesson) {
  const t = `${lesson.title} ${lesson.summary || ''}`.toLowerCase();
  const cat = lesson.category;

  if (/prefix|scan/.test(t)) return { kind: 'wave', label: 'scan' };
  if (/convolution|conv\b/.test(t)) return { kind: 'wave', label: 'conv' };
  if (/softmax/.test(t)) return { kind: 'bars', label: 'softmax' };
  if (/layernorm|relu|gelu|sigmoid|tanh|activation|gate/.test(t)) return { kind: 'bars', label: 'activation' };
  if (/histogram/.test(t)) return { kind: 'distribution', label: 'histogram' };
  if (/transpose/.test(t)) return { kind: 'matrix', label: 'transpose' };
  if (/embedding|gather|lookup/.test(t)) return { kind: 'scatter', label: 'gather' };
  if (/max\b/.test(t)) return { kind: 'rings', label: 'max' };
  if (/matrix-vector|mat-?vec/.test(t)) return { kind: 'field', label: 'matvec' };

  switch (cat) {
    case 'Reductions': return { kind: 'tree', label: 'reduce' };
    case 'GEMM': return { kind: 'matrix', label: 'gemm' };
    case 'Memory': return { kind: 'field', label: 'memory' };
    case 'Elementwise': return { kind: 'heat', label: 'elementwise' };
    case 'Fundamentals':
    default: return { kind: 'vectors', label: 'kernel' };
  }
}

export default function PGForgeCuda() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [difficulty, setDifficulty] = useState('All');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PG_FORGE_CUDA.filter((lesson) => {
      if (category !== 'All' && lesson.category !== category) return false;
      if (difficulty !== 'All' && lesson.difficulty !== difficulty) return false;
      if (q && !`${lesson.title} ${lesson.category} ${lesson.summary}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [query, category, difficulty]);

  return (
    <div className="forge-cuda">
      <Breadcrumb items={[{ label: 'PGForge', to: '/ml' }, { label: 'CUDA kernels' }]} />

      <header className="forge-cuda-header">
        <h1 className="forge-cuda-title">CUDA kernels</h1>
        <p className="forge-cuda-sub">
          Write the GPU primitives behind deep learning by hand — threads, shared memory, reductions, and tiled GEMM, one kernel at a time.
        </p>
      </header>

      <div className="forge-cuda-controls">
        <div className="forge-cuda-search">
          <Search size={15} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search kernels"
            aria-label="Search kernels"
          />
        </div>

        <div className="forge-cuda-chips">
          <button
            type="button"
            className={`forge-cuda-chip${category === 'All' ? ' is-on' : ''}`}
            onClick={() => setCategory('All')}
          >
            All
          </button>
          {PG_FORGE_CUDA_CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              className={`forge-cuda-chip${category === c ? ' is-on' : ''}`}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="forge-cuda-chips forge-cuda-chips-diff">
          <button
            type="button"
            className={`forge-cuda-chip${difficulty === 'All' ? ' is-on' : ''}`}
            onClick={() => setDifficulty('All')}
          >
            All levels
          </button>
          {DIFFS.map((d) => (
            <button
              key={d}
              type="button"
              className={`forge-cuda-chip forge-cuda-chip-${d}${difficulty === d ? ' is-on' : ''}`}
              onClick={() => setDifficulty(d)}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="forge-cuda-none">No kernels match those filters.</p>
      ) : (
        <div className="forge-cuda-grid">
          {filtered.map((lesson, i) => {
            const thumb = thumbFor(lesson);
            return (
            <Link key={lesson.slug} to={`/ml/cuda/${lesson.slug}`} className="forge-cuda-card">
              <div className="forge-thumb-frame">
                <ForgeThumb kind={thumb.kind} label={thumb.label} seed={lesson.title} index={i} />
              </div>
              <div className="forge-cuda-card-head">
                <Cpu size={16} className="forge-cuda-card-icon" />
                <span className={`forge-cuda-diff forge-cuda-diff-${lesson.difficulty}`}>{lesson.difficulty}</span>
              </div>
              <h2 className="forge-cuda-card-title">{lesson.title}</h2>
              <div className="forge-cuda-card-foot">
                <span className="forge-cuda-cat">{lesson.category}</span>
                <ArrowRight size={15} className="forge-cuda-card-arrow" />
              </div>
            </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
