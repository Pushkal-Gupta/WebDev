import React from 'react';
import { Link } from 'react-router-dom';
import { Play, BookOpen, Sigma, ArrowRight } from 'lucide-react';
import { MATH_MODULES } from './pgForgeMathData';
import Breadcrumb from '../../common/Breadcrumb';
import ForgeThumb from './ForgeThumb';
import './PGForgeMath.css';

function TopicCard({ topic, index }) {
  const href = topic.vizSlug
    ? `/visualize/${topic.vizSlug}`
    : topic.lessonPath || null;
  const isViz = Boolean(topic.vizSlug);

  const inner = (
    <>
      <div className="forge-thumb-frame fmath-card-thumb">
        <ForgeThumb seed={topic.title} index={index} topic={topic.slug} label={topic.title} />
      </div>
      <div className="fmath-card-body">
        <h3 className="fmath-card-title">{topic.title}</h3>
        <p className="fmath-card-summary">{topic.summary}</p>
        {href && (
          <span className="fmath-card-cta">
            {isViz ? <Play size={13} /> : <BookOpen size={13} />}
            {isViz ? 'Visualize' : 'Read'}
            <ArrowRight size={13} className="fmath-card-cta-arrow" />
          </span>
        )}
      </div>
    </>
  );

  if (href) {
    return (
      <Link className="fmath-card fmath-card-link" to={href}>
        {inner}
      </Link>
    );
  }
  return <div className="fmath-card">{inner}</div>;
}

export default function PGForgeMath() {
  const topicCount = MATH_MODULES.reduce((acc, m) => acc + m.topics.length, 0);

  return (
    <div className="fmath">
      <Breadcrumb items={[{ label: 'PGForge', to: '/ml' }, { label: 'Foundations' }]} />

      <header className="fmath-head">
        <h1 className="fmath-title">
          <Sigma size={28} className="fmath-title-icon" />
          Foundations — the math under machine learning, in {MATH_MODULES.length} modules and {topicCount} topics.
        </h1>
      </header>

      <div className="fmath-body">
        {MATH_MODULES.map((mod) => (
          <section key={mod.slug} className="fmath-module">
            <div className="fmath-module-head">
              <h2 className="fmath-module-title">{mod.title}</h2>
              <p className="fmath-module-blurb">{mod.blurb}</p>
            </div>
            <div className="fmath-grid">
              {mod.topics.map((t, i) => (
                <TopicCard key={t.slug} topic={t} index={i} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
