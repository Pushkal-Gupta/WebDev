import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, FolderGit2, ArrowRight } from 'lucide-react';
import ForgeThumb from './ForgeThumb';
import './PGForgeProjects.css';

const PROJECTS = [
  {
    title: 'Digit classifier on MNIST',
    diff: 'easy',
    goal: 'Train a small network to read handwritten digits and reach 97%+ test accuracy.',
    tags: ['numpy', 'mlp', 'classification'],
  },
  {
    title: 'Backprop engine from scratch',
    diff: 'hard',
    goal: 'Build a tiny autograd: a Value class that tracks the graph and computes gradients on .backward().',
    tags: ['autograd', 'calculus', 'graphs'],
  },
  {
    title: 'Linear regression toolkit',
    diff: 'easy',
    goal: 'Fit, predict, and evaluate ordinary least squares two ways — closed form and gradient descent.',
    tags: ['regression', 'gradients'],
  },
  {
    title: 'Fine-tune a small transformer',
    diff: 'hard',
    goal: 'Take a tiny pretrained language model and adapt it to a new text task with LoRA.',
    tags: ['transformers', 'lora', 'nlp'],
  },
  {
    title: 'Movie recommender',
    diff: 'medium',
    goal: 'Learn user and item embeddings by matrix factorization and recommend unseen titles.',
    tags: ['embeddings', 'matrix-factorization'],
  },
  {
    title: 'Image autoencoder',
    diff: 'medium',
    goal: 'Compress images through a bottleneck and reconstruct them; visualize the latent space.',
    tags: ['autoencoder', 'unsupervised'],
  },
  {
    title: 'Sentiment classifier',
    diff: 'medium',
    goal: 'Turn reviews into bag-of-words or embeddings and predict positive vs negative.',
    tags: ['nlp', 'classification'],
  },
  {
    title: 'k-means image quantizer',
    diff: 'easy',
    goal: 'Cluster the pixels of an image into k colors and re-render it with the reduced palette.',
    tags: ['clustering', 'kmeans'],
  },
  {
    title: 'CartPole with policy gradients',
    diff: 'hard',
    goal: 'Train an agent to balance the pole using REINFORCE, then watch it improve over episodes.',
    tags: ['rl', 'policy-gradient'],
  },
  {
    title: 'Diffusion on toy 2D data',
    diff: 'hard',
    goal: 'Add noise to a 2D distribution, learn to reverse it, then sample new points from noise.',
    tags: ['diffusion', 'generative'],
  },
];

export default function PGForgeProjects() {
  return (
    <div className="forge-pj">
      <nav className="forge-crumb">
        <Link to="/ml" className="forge-crumb-link">PGForge</Link>
        <ChevronRight size={13} />
        <span className="forge-crumb-cur">Projects</span>
      </nav>

      <header className="forge-pj-header">
        <h1 className="forge-pj-title">
          <FolderGit2 size={26} className="forge-pj-title-icon" />
          Build something real
        </h1>
        <p className="forge-pj-sub">
          End-to-end builds that turn the concepts into something that runs. Pick one, ship it, then read the code you wrote.
        </p>
      </header>

      <section className="forge-pj-grid">
        {PROJECTS.map((p) => (
          <article key={p.title} className="forge-pj-card">
            <div className="forge-thumb-frame forge-pj-card-thumb">
              <ForgeThumb seed={p.title} />
              <span className={`forge-pj-diff forge-pj-diff-${p.diff}`}>{p.diff}</span>
            </div>
            <div className="forge-pj-card-body">
              <h2 className="forge-pj-card-title">{p.title}</h2>
              <p className="forge-pj-card-goal">{p.goal}</p>
              <div className="forge-pj-tags">
                {p.tags.map((t) => (
                  <span key={t} className="forge-pj-tag">{t}</span>
                ))}
              </div>
              <span className="forge-pj-card-cta">
                Build it <ArrowRight size={14} />
              </span>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
