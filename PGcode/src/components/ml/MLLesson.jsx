import React, { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Info, Lightbulb } from 'lucide-react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { getLesson, getPillar } from '../../content/mlContent';

function katexHtml(tex, displayMode = false) {
  return katex.renderToString(tex, { throwOnError: false, displayMode, output: 'html' });
}
import VectorPlayground from './viz/VectorPlayground';
import VectorAdditionViz from './viz/VectorAdditionViz';
import VectorGeometryViz from './viz/VectorGeometryViz';
import MatrixTransform from './viz/MatrixTransform';
import GradientDescent from './viz/GradientDescent';
import AttentionHeatmap from './viz/AttentionHeatmap';
import NormBall from './viz/NormBall';
import SoftmaxViz from './viz/SoftmaxViz';
import NeuralNetViz from './viz/NeuralNetViz';
import ConvolutionViz from './viz/ConvolutionViz';
import EigenvectorViz from './viz/EigenvectorViz';
import BackpropViz from './viz/BackpropViz';
import KMeansViz from './viz/KMeansViz';
import KMeansFullViz from './viz/KMeansFullViz';
import LogisticRegressionViz from './viz/LogisticRegressionViz';
import NaiveBayesViz from './viz/NaiveBayesViz';
import GaussianViz from './viz/GaussianViz';
import ActivationsViz from './viz/ActivationsViz';
import AutoencoderViz from './viz/AutoencoderViz';
import KLDivergenceViz from './viz/KLDivergenceViz';
import ROCCurveViz from './viz/ROCCurveViz';
import ConfusionMatrixViz from './viz/ConfusionMatrixViz';
import TransformerBlockViz from './viz/TransformerBlockViz';
import TransformerBlockFullViz from './viz/TransformerBlockFullViz';
import BatchNormViz from './viz/BatchNormViz';
import BatchNormScatterViz from './viz/BatchNormScatterViz';
import PCAViz from './viz/PCAViz';
import GANViz from './viz/GANViz';
import GANLoopViz from './viz/GANLoopViz';
import TSNEViz from './viz/TSNEViz';
import FFTViz from './viz/FFTViz';
import PolicyGradientViz from './viz/PolicyGradientViz';
import DiffusionViz from './viz/DiffusionViz';
import DiffusionChainViz from './viz/DiffusionChainViz';
import VAEViz from './viz/VAEViz';
import VAELatentViz from './viz/VAELatentViz';
import BezierViz from './viz/BezierViz';
import GaussianProcessViz from './viz/GaussianProcessViz';
import ConvNetViz from './viz/ConvNetViz';
import ProjectionViz from './viz/ProjectionViz';
import CrossValidationViz from './viz/CrossValidationViz';
import BiasVarianceViz from './viz/BiasVarianceViz';
import SVDViz from './viz/SVDViz';
import ChainRuleViz from './viz/ChainRuleViz';
import AutogradTraceViz from './viz/AutogradTraceViz';
import BayesUpdateViz from './viz/BayesUpdateViz';
import LinearRegressionViz from './viz/LinearRegressionViz';
import EmbeddingEvolutionViz from './viz/EmbeddingEvolutionViz';
import WordEmbeddingViz from './viz/WordEmbeddingViz';
import ResidualGradientViz from './viz/ResidualGradientViz';
import ResidualBlockViz from './viz/ResidualBlockViz';
import SGDComparisonViz from './viz/SGDComparisonViz';
import NormalizationCompareViz from './viz/NormalizationCompareViz';
import GANDynamicsViz from './viz/GANDynamicsViz';
import PerceptronViz from './viz/PerceptronViz';
import SVMViz from './viz/SVMViz';
import DecisionTreeViz from './viz/DecisionTreeViz';
import RandomForestViz from './viz/RandomForestViz';
import LSTMGatesViz from './viz/LSTMGatesViz';
import BPETokenizerViz from './viz/BPETokenizerViz';
import SamplingViz from './viz/SamplingViz';
import KernelTrickViz from './viz/KernelTrickViz';
import ImageAugmentationViz from './viz/ImageAugmentationViz';
import BeamSearchViz from './viz/BeamSearchViz';
import LRScheduleViz from './viz/LRScheduleViz';
import VanishingGradientViz from './viz/VanishingGradientViz';
import DropoutTrainingViz from './viz/DropoutTrainingViz';
import KVCacheViz from './viz/KVCacheViz';
import ConvKernelViz from './viz/ConvKernelViz';
import WeightDecayViz from './viz/WeightDecayViz';
import ReceptiveFieldViz from './viz/ReceptiveFieldViz';
import MultiHeadAttentionViz from './viz/MultiHeadAttentionViz';
import Word2VecViz from './viz/Word2VecViz';
import AdamOptimizerViz from './viz/AdamOptimizerViz';
import ScalingLawsViz from './viz/ScalingLawsViz';
import PolyOverfitViz from './viz/PolyOverfitViz';
import GradientCheckViz from './viz/GradientCheckViz';
import MCMCViz from './viz/MCMCViz';
import EMAlgorithmViz from './viz/EMAlgorithmViz';
import L1L2RegularizationViz from './viz/L1L2RegularizationViz';
import GCNViz from './viz/GCNViz';
import QLearningViz from './viz/QLearningViz';
import KDEViz from './viz/KDEViz';
import DotProductSignViz from './viz/DotProductSignViz';
import MatrixColumnsViz from './viz/MatrixColumnsViz';
import LogLossCurveViz from './viz/LogLossCurveViz';
import PCAProjectionViz from './viz/PCAProjectionViz';
import ForwardBackwardGraphViz from './viz/ForwardBackwardGraphViz';
import ParabolaDescentViz from './viz/ParabolaDescentViz';
import AttentionStepViz from './viz/AttentionStepViz';
import LoRAStructureViz from './viz/LoRAStructureViz';
import DropoutMasksViz from './viz/DropoutMasksViz';
import AutoencoderShapeViz from './viz/AutoencoderShapeViz';
import RNNUnrollViz from './viz/RNNUnrollViz';
import MomentumZigzagViz from './viz/MomentumZigzagViz';
import MDPGridworldViz from './viz/MDPGridworldViz';
import RLHFPipelineViz from './viz/RLHFPipelineViz';
import FloatSpacingViz from './viz/FloatSpacingViz';
import PositionalWavelengthsViz from './viz/PositionalWavelengthsViz';
import ContrastiveEmbeddingViz from './viz/ContrastiveEmbeddingViz';
import KnowledgeDistillationViz from './viz/KnowledgeDistillationViz';
import SHAPValuesViz from './viz/SHAPValuesViz';
import QuantizationViz from './viz/QuantizationViz';
import AttentionRolloutViz from './viz/AttentionRolloutViz';
import InitVarianceViz from './viz/InitVarianceViz';
import OptimizerZooViz from './viz/OptimizerZooViz';
import FloatFormatGridViz from './viz/FloatFormatGridViz';
import DeadReLUViz from './viz/DeadReLUViz';
import MixupViz from './viz/MixupViz';
import LabelSmoothingViz from './viz/LabelSmoothingViz';
import CurriculumLearningViz from './viz/CurriculumLearningViz';
import MixedPrecisionViz from './viz/MixedPrecisionViz';
import SpeculativeDecodingViz from './viz/SpeculativeDecodingViz';
import BeamWidthEffectsViz from './viz/BeamWidthEffectsViz';
import OptimizerTrajectoriesViz from './viz/OptimizerTrajectoriesViz';
import LRWarmupCosineDecayViz from './viz/LRWarmupCosineDecayViz';
import GradientNoiseViz from './viz/GradientNoiseViz';
import TripletLossViz from './viz/TripletLossViz';
import ContrastiveTrainingDynamicsViz from './viz/ContrastiveTrainingDynamicsViz';
import EmbeddingProjectionUmapViz from './viz/EmbeddingProjectionUmapViz';
import AttentionHeatmapViz from './viz/AttentionHeatmapViz';
import PositionalEncodingViz from './viz/PositionalEncodingViz';
import SoftmaxTemperatureViz from './viz/SoftmaxTemperatureViz';
import DiffusionForwardReverseViz from './viz/DiffusionForwardReverseViz';
import LossLandscape2DViz from './viz/LossLandscape2DViz';
import GradientClippingViz from './viz/GradientClippingViz';
import TransformerLayerFlowViz from './viz/TransformerLayerFlowViz';
import RewardShapingViz from './viz/RewardShapingViz';
import VarianceReductionViz from './viz/VarianceReductionViz';
import BPETrainingTraceViz from './viz/BPETrainingTraceViz';
import LRSchedulerLandingViz from './viz/LRSchedulerLandingViz';
import FederatedAveragingViz from './viz/FederatedAveragingViz';
import ModelCalibrationViz from './viz/ModelCalibrationViz';
import MixtureOfExpertsViz from './viz/MixtureOfExpertsViz';
import ChainOfThoughtViz from './viz/ChainOfThoughtViz';
import InferenceBatchingViz from './viz/InferenceBatchingViz';
import RAGRetrievalPipelineViz from './viz/RAGRetrievalPipelineViz';
import KLDivergenceVsTemperatureViz from './viz/KLDivergenceVsTemperatureViz';
import TokenGenerationStreamViz from './viz/TokenGenerationStreamViz';
import CurriculumTemperatureViz from './viz/CurriculumTemperatureViz';
import VisionTransformerPatchViz from './viz/VisionTransformerPatchViz';
import SparseAttentionPatternViz from './viz/SparseAttentionPatternViz';
import PerplexityVsCalibrationViz from './viz/PerplexityVsCalibrationViz';
import TokenizerNormalizationViz from './viz/TokenizerNormalizationViz';
import DecodingStrategiesViz from './viz/DecodingStrategiesViz';
import DropoutMaskAblationViz from './viz/DropoutMaskAblationViz';
import SaliencyMapViz from './viz/SaliencyMapViz';
import TokenizerFairnessViz from './viz/TokenizerFairnessViz';
import './MLHub.css';
import './MLLesson.css';

const VIZ_REGISTRY = { VectorPlayground, VectorAdditionViz, VectorGeometryViz, MatrixTransform, GradientDescent, AttentionHeatmap, NormBall, SoftmaxViz, NeuralNetViz, ConvolutionViz, EigenvectorViz, BackpropViz, KMeansViz, KMeansFullViz, LogisticRegressionViz, NaiveBayesViz, GaussianViz, ActivationsViz, AutoencoderViz, KLDivergenceViz, ROCCurveViz, ConfusionMatrixViz, TransformerBlockViz, TransformerBlockFullViz, BatchNormViz, BatchNormScatterViz, PCAViz, GANViz, GANLoopViz, GANDynamicsViz, TSNEViz, FFTViz, PolicyGradientViz, DiffusionViz, DiffusionChainViz, VAEViz, VAELatentViz, BezierViz, GaussianProcessViz, ConvNetViz, ProjectionViz, CrossValidationViz, BiasVarianceViz, SVDViz, ChainRuleViz, AutogradTraceViz, BayesUpdateViz, LinearRegressionViz, EmbeddingEvolutionViz, WordEmbeddingViz, ResidualGradientViz, ResidualBlockViz, SGDComparisonViz, NormalizationCompareViz, PerceptronViz, SVMViz, DecisionTreeViz, RandomForestViz, LSTMGatesViz, BPETokenizerViz, SamplingViz, KernelTrickViz, ImageAugmentationViz, BeamSearchViz, LRScheduleViz, VanishingGradientViz, DropoutTrainingViz, KVCacheViz, ConvKernelViz, WeightDecayViz, ReceptiveFieldViz, MultiHeadAttentionViz, Word2VecViz, AdamOptimizerViz, ScalingLawsViz, PolyOverfitViz, GradientCheckViz, MCMCViz, EMAlgorithmViz, L1L2RegularizationViz, GCNViz, QLearningViz, KDEViz, DotProductSignViz, MatrixColumnsViz, LogLossCurveViz, PCAProjectionViz, ForwardBackwardGraphViz, ParabolaDescentViz, AttentionStepViz, LoRAStructureViz, DropoutMasksViz, AutoencoderShapeViz, RNNUnrollViz, MomentumZigzagViz, MDPGridworldViz, RLHFPipelineViz, FloatSpacingViz, PositionalWavelengthsViz, ContrastiveEmbeddingViz, KnowledgeDistillationViz, SHAPValuesViz, QuantizationViz, AttentionRolloutViz, InitVarianceViz, OptimizerZooViz, FloatFormatGridViz, DeadReLUViz, MixupViz, LabelSmoothingViz, CurriculumLearningViz, MixedPrecisionViz, SpeculativeDecodingViz, BeamWidthEffectsViz, OptimizerTrajectoriesViz, LRWarmupCosineDecayViz, GradientNoiseViz, TripletLossViz, ContrastiveTrainingDynamicsViz, EmbeddingProjectionUmapViz, AttentionHeatmapViz, PositionalEncodingViz, SoftmaxTemperatureViz, DiffusionForwardReverseViz, LossLandscape2DViz, GradientClippingViz, TransformerLayerFlowViz, RewardShapingViz, VarianceReductionViz, BPETrainingTraceViz, LRSchedulerLandingViz, FederatedAveragingViz, ModelCalibrationViz, MixtureOfExpertsViz, ChainOfThoughtViz, InferenceBatchingViz, RAGRetrievalPipelineViz, KLDivergenceVsTemperatureViz, TokenGenerationStreamViz, CurriculumTemperatureViz, VisionTransformerPatchViz, SparseAttentionPatternViz, PerplexityVsCalibrationViz, TokenizerNormalizationViz, DecodingStrategiesViz, DropoutMaskAblationViz, SaliencyMapViz, TokenizerFairnessViz };

/* Inline parser: handles `code`, **bold**, *italic*, [text](url), \(math\).
   Token order matters — backticks beat asterisks (so `*p` stays literal inside code). */
function renderInline(text) {
  if (!text) return [];
  const out = [];
  let key = 0;
  let buf = '';
  const flushBuf = () => { if (buf) { out.push(buf); buf = ''; } };

  let i = 0;
  while (i < text.length) {
    const ch = text[i];

    // Inline code: `...`
    if (ch === '`') {
      const end = text.indexOf('`', i + 1);
      if (end > i) {
        flushBuf();
        out.push(<code className="ml-icode" key={`c${key++}`}>{text.slice(i + 1, end)}</code>);
        i = end + 1;
        continue;
      }
    }

    // Inline math: \( ... \) — KaTeX
    if (ch === '\\' && text[i + 1] === '(') {
      const end = text.indexOf('\\)', i + 2);
      if (end > i) {
        flushBuf();
        out.push(
          <span
            className="ml-imath"
            key={`m${key++}`}
            dangerouslySetInnerHTML={{ __html: katexHtml(text.slice(i + 2, end), false) }}
          />
        );
        i = end + 2;
        continue;
      }
    }

    // Bold: **...**
    if (ch === '*' && text[i + 1] === '*') {
      const end = text.indexOf('**', i + 2);
      if (end > i) {
        flushBuf();
        out.push(<strong key={`b${key++}`}>{renderInline(text.slice(i + 2, end))}</strong>);
        i = end + 2;
        continue;
      }
    }

    // Italic: *...* — must open against non-space and not be a free-standing bullet/multiply
    if (
      ch === '*' &&
      text[i + 1] !== '*' &&
      text[i + 1] !== ' ' &&
      text[i - 1] !== '*' &&
      !/\w/.test(text[i - 1] || '')
    ) {
      const end = text.indexOf('*', i + 1);
      if (end > i && text[end + 1] !== '*' && text[end - 1] !== ' ') {
        flushBuf();
        out.push(<em key={`i${key++}`}>{renderInline(text.slice(i + 1, end))}</em>);
        i = end + 1;
        continue;
      }
    }

    // Link: [label](url)
    if (ch === '[') {
      const close = text.indexOf(']', i + 1);
      if (close > i && text[close + 1] === '(') {
        const urlEnd = text.indexOf(')', close + 2);
        if (urlEnd > close) {
          flushBuf();
          out.push(
            <a key={`l${key++}`} href={text.slice(close + 2, urlEnd)} target="_blank" rel="noreferrer noopener">
              {renderInline(text.slice(i + 1, close))}
            </a>
          );
          i = urlEnd + 1;
          continue;
        }
      }
    }

    buf += ch;
    i++;
  }
  flushBuf();
  return out;
}

const renderBold = renderInline;

/* Block parser: handles displayed-math \[...\], bullet/ordered lists, sub-headings, paragraphs. */
function renderProseBody(body, keyBase = 'pb') {
  const blocks = body.split(/\n\n+/);
  const nodes = [];
  blocks.forEach((blk, bi) => {
    // Displayed math: a block that contains one or more \[ ... \] expressions.
    // Split on them and emit <pre class="ml-math"> for the math, <p> for surrounding prose.
    if (/\\\[[\s\S]+?\\\]/.test(blk)) {
      const parts = blk.split(/(\\\[[\s\S]+?\\\])/g);
      parts.forEach((part, pi) => {
        const m = part.match(/^\\\[([\s\S]+?)\\\]$/);
        if (m) {
          nodes.push(
            <div
              key={`${keyBase}-${bi}-m${pi}`}
              className="ml-math"
              dangerouslySetInnerHTML={{ __html: katexHtml(m[1].trim(), true) }}
            />
          );
        } else if (part.trim()) {
          nodes.push(<p key={`${keyBase}-${bi}-p${pi}`} className="ml-p">{renderInline(part.trim())}</p>);
        }
      });
      return;
    }

    const lines = blk.split('\n');
    const isBullet = lines.every(l => /^\s*[-*]\s+/.test(l));
    const isOrdered = lines.every(l => /^\s*\d+\.\s+/.test(l));

    if (isBullet && lines.length) {
      nodes.push(
        <ul key={`${keyBase}-${bi}`} className="ml-ul">
          {lines.map((l, li) => (
            <li key={li}>{renderInline(l.replace(/^\s*[-*]\s+/, ''))}</li>
          ))}
        </ul>
      );
      return;
    }

    if (isOrdered && lines.length) {
      nodes.push(
        <ol key={`${keyBase}-${bi}`} className="ml-ol">
          {lines.map((l, li) => (
            <li key={li}>{renderInline(l.replace(/^\s*\d+\.\s+/, ''))}</li>
          ))}
        </ol>
      );
      return;
    }

    if (/^#{2,3}\s+/.test(blk)) {
      nodes.push(<h3 key={`${keyBase}-${bi}`} className="ml-h3">{renderInline(blk.replace(/^#{2,3}\s+/, ''))}</h3>);
      return;
    }

    nodes.push(<p key={`${keyBase}-${bi}`} className="ml-p">{renderInline(blk)}</p>);
  });
  return nodes;
}

function ProseBlock({ section, withHeading }) {
  return (
    <>
      {withHeading && section.heading && <h2 className="ml-h">{section.heading}</h2>}
      {renderProseBody(section.body, `pb-${section.heading || 'x'}`)}
    </>
  );
}

function AsciiBlock({ section }) {
  return (
    <div className="ml-ascii-wrap">
      <div className="ml-ascii-head">
        <span className="ml-ascii-head-dot">Diagram</span>
        {section.heading && <span>{section.heading}</span>}
      </div>
      <pre className="ml-ascii">{section.body}</pre>
      {section.caption && <p className="ml-caption">{section.caption}</p>}
    </div>
  );
}

function MathBlock({ section }) {
  const blocks = section.body.split(/\\\[([\s\S]+?)\\\]/g);
  return (
    <>
      {blocks.map((b, i) =>
        i % 2 === 1 ? (
          <div
            key={i}
            className="ml-math"
            dangerouslySetInnerHTML={{ __html: katexHtml(b.trim(), true) }}
          />
        ) : (
          b.split(/\n\n+/).map((p, j) =>
            p.trim() ? (
              <p key={`${i}-${j}`} className="ml-p">
                {renderInline(p)}
              </p>
            ) : null
          )
        )
      )}
    </>
  );
}

function CodeBlock({ section }) {
  return (
    <div className="ml-code-wrap">
      <div className="ml-code-head">
        <span className="ml-ascii-head-dot"><span className="ml-code-lang">{section.language || 'code'}</span></span>
        {section.heading && <span>{section.heading}</span>}
      </div>
      <pre className="ml-code">
        <code>{section.body}</code>
      </pre>
    </div>
  );
}

function Callout({ section }) {
  const Icon = section.tone === 'tip' ? Lightbulb : Info;
  return (
    <aside className={`ml-callout ml-callout-${section.tone || 'note'}`}>
      <Icon size={16} />
      <div>{renderBold(section.body)}</div>
    </aside>
  );
}

/* Group sections into rows. A "row" is either:
   - one prose section paired with the immediately following non-prose section (ascii/math/code/callout) → side-by-side
   - one standalone prose section → full-width prose
   - one standalone non-prose section → full-width figure
   Heading lives with the prose block of each row. */
function groupRows(sections) {
  const rows = [];
  let i = 0;
  while (i < sections.length) {
    const s = sections[i];
    if (s.kind === 'prose') {
      const next = sections[i + 1];
      if (next && next.kind !== 'prose') {
        rows.push({ prose: s, figure: next });
        i += 2;
      } else {
        rows.push({ prose: s, figure: null });
        i += 1;
      }
    } else {
      rows.push({ prose: null, figure: s });
      i += 1;
    }
  }
  return rows;
}

function VizBlock({ section }) {
  const Comp = VIZ_REGISTRY[section.component];
  if (!Comp) return null;
  return (
    <div className="ml-viz-wrap">
      {section.heading && (
        <div className="ml-viz-head">
          <span className="ml-ascii-head-dot">Interactive</span>
          <span>{section.heading}</span>
        </div>
      )}
      <Comp {...(section.props || {})} />
    </div>
  );
}

function renderFigure(section) {
  switch (section.kind) {
    case 'viz': return <VizBlock section={section} />;
    case 'ascii': return <AsciiBlock section={section} />;
    case 'math': return <MathBlock section={section} />;
    case 'code': return <CodeBlock section={section} />;
    case 'callout': return <Callout section={section} />;
    default: return null;
  }
}

export default function MLLesson() {
  const { pillarSlug, lessonSlug } = useParams();
  const lesson = getLesson(pillarSlug, lessonSlug);
  const pillar = getPillar(pillarSlug);

  const rows = useMemo(() => lesson ? groupRows(lesson.sections) : [], [lesson]);

  const toc = useMemo(() => {
    if (!lesson) return [];
    return lesson.sections
      .filter(s => s.kind === 'prose' && s.heading)
      .map(s => s.heading);
  }, [lesson]);

  if (!lesson) {
    return (
      <div className="ml-lesson">
        <Link to={pillar ? `/ml/${pillarSlug}` : '/ml'} className="learn-crumb">
          <ArrowLeft size={13} />
          <span>{pillar ? pillar.title : 'ML-DL-AI'}</span>
        </Link>
        <h1 className="ml-lesson-title">Not found</h1>
        <p className="ml-lesson-sub">No lesson "{lessonSlug}" in {pillar?.title || pillarSlug}.</p>
      </div>
    );
  }

  return (
    <div className="ml-lesson">
      <Link to={`/ml/${pillarSlug}`} className="learn-crumb">
        <ArrowLeft size={13} />
        <span>ML-DL-AI</span>
        <span className="learn-crumb-sep">/</span>
        <span>{pillar.title}</span>
        <span className="learn-crumb-sep">/</span>
        <span className="learn-crumb-here">{lesson.title}</span>
      </Link>

      <header className="ml-lesson-hero">
        <div className="ml-lesson-hero-text">
          <div className="ml-lesson-meta">
            <span>{lesson.difficulty}</span>
            <span>·</span>
            <span>{lesson.readMinutes} min read</span>
          </div>
          <h1 className="ml-lesson-title">{lesson.title}</h1>
          <p className="ml-lesson-sub">{lesson.oneLiner}</p>
        </div>

        {toc.length > 0 && (
          <nav className="ml-lesson-toc" aria-label="On this page">
            <h2 className="ml-lesson-toc-title">On this page</h2>
            <ol className="ml-lesson-toc-list">
              {toc.map((t) => <li key={t}>{t}</li>)}
            </ol>
          </nav>
        )}
      </header>

      <article className="ml-lesson-body">
        {rows.map((r, idx) => {
          if (r.prose && r.figure) {
            return (
              <section key={idx} className="ml-row">
                <div className="ml-row-prose">
                  <ProseBlock section={r.prose} withHeading />
                </div>
                <div className="ml-row-figure">
                  {renderFigure(r.figure)}
                </div>
              </section>
            );
          }
          if (r.prose) {
            return (
              <section key={idx} className="ml-row ml-row-solo">
                <div className="ml-row-prose">
                  <ProseBlock section={r.prose} withHeading />
                </div>
              </section>
            );
          }
          return (
            <section key={idx} className="ml-row ml-row-full">
              {renderFigure(r.figure)}
            </section>
          );
        })}
      </article>
    </div>
  );
}
