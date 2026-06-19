// Architecture specs for the PGForge Papers pages.
//
// Each entry is a data-driven description of a model that ArchitectureDiagram
// renders as a clean, sizable flow of labeled blocks. The shape:
//
//   {
//     title,            // panel heading
//     orientation,      // 'vertical' (default) | 'horizontal'
//     blocks: [
//       {
//         key,          // matches a step's `block` value so hovering a
//                       // walkthrough step lights up this block
//         label,        // primary line on the block
//         sub,          // optional second line (dims / op detail)
//         kind,         // block-type -> hue + icon (see KIND below)
//         lane,         // 'left' | 'right' | 'center' (for two-lane models)
//         repeat,       // e.g. 'xN' -> draws a stack bracket around the run of
//                       // consecutive blocks sharing the same repeat tag
//       },
//     ],
//     skips: [          // optional curved residual / shortcut arrows
//       { from, to, label }   // from/to are 0-based block indices
//     ],
//   }
//
// `kind` drives colour + a small lucide glyph so the reader can scan block
// types at a glance. Hues map to theme tokens only (no hardcoded colours):
//   input/output -> accent,  embed -> sky,   attention -> violet,
//   conv -> sky,   norm -> mint,   dense/ffn -> pink,   sample/noise -> violet,
//   loss -> pink,  flow/op -> mint.
//
// Backwards compatible: getArchitecture(id) and the ARCHITECTURES export keep
// the same names PGForgePapers.jsx already imports.

export const ARCHITECTURES = {
  transformer: {
    title: 'Transformer',
    orientation: 'vertical',
    blocks: [
      { key: 'tok', label: 'Input Tokens', sub: 'subword ids', kind: 'input' },
      { key: 'pos', label: 'Token Embedding', sub: '+ positional encoding', kind: 'embed' },
      { key: 'attn', label: 'Multi-Head Attention', sub: 'scaled dot-product, h heads', kind: 'attention', repeat: 'block' },
      { key: 'attn', label: 'Add & Norm', sub: 'residual + LayerNorm', kind: 'norm', repeat: 'block' },
      { key: 'ffn', label: 'Feed Forward', sub: 'two-layer MLP, GELU', kind: 'ffn', repeat: 'block' },
      { key: 'ffn', label: 'Add & Norm', sub: 'residual + LayerNorm', kind: 'norm', repeat: 'block' },
      { key: 'cross', label: 'Linear', sub: 'project to vocabulary', kind: 'dense' },
      { key: 'cross', label: 'Softmax', sub: 'next-token probabilities', kind: 'output' },
    ],
    skips: [
      { from: 1, to: 3, label: 'residual' },
      { from: 3, to: 5, label: 'residual' },
    ],
  },

  alexnet: {
    title: 'AlexNet',
    orientation: 'vertical',
    blocks: [
      { key: 0, label: 'Input Image', sub: '224 x 224 x 3', kind: 'input' },
      { key: 1, label: 'Conv + ReLU', sub: '5 conv stages', kind: 'conv', repeat: 'features' },
      { key: 2, label: 'Max Pool', sub: 'overlapping, stride 2', kind: 'flow', repeat: 'features' },
      { key: 3, label: 'Fully Connected', sub: '2 x 4096, dropout 0.5', kind: 'dense' },
      { key: 4, label: 'Softmax', sub: '1000 classes', kind: 'output' },
    ],
  },

  resnet: {
    title: 'Residual Block',
    orientation: 'vertical',
    blocks: [
      { key: 'in', label: 'Input  x', sub: 'from previous block', kind: 'input' },
      { key: 'weight', label: 'Weight Layer', sub: '3x3 conv + ReLU', kind: 'conv' },
      { key: 'weight', label: 'Weight Layer', sub: '3x3 conv', kind: 'conv' },
      { key: 'add', label: 'Add  F(x) + x', sub: 'element-wise sum', kind: 'flow' },
      { key: 'add', label: 'ReLU', sub: 'block output', kind: 'output' },
    ],
    skips: [{ from: 0, to: 3, label: 'identity skip' }],
  },

  adam: {
    title: 'Adam Update',
    orientation: 'vertical',
    blocks: [
      { key: 0, label: 'Gradient  g_t', sub: 'backprop on mini-batch', kind: 'input' },
      { key: 1, label: 'First Moment  m', sub: 'm = b1*m + (1-b1)*g', kind: 'op' },
      { key: 1, label: 'Second Moment  v', sub: 'v = b2*v + (1-b2)*g^2', kind: 'op' },
      { key: 2, label: 'Bias Correction', sub: 'm/(1-b1^t),  v/(1-b2^t)', kind: 'norm' },
      { key: 3, label: 'Parameter Step', sub: 'th -= lr * m_hat / (sqrt(v_hat)+e)', kind: 'output' },
    ],
  },

  bert: {
    title: 'BERT',
    orientation: 'vertical',
    blocks: [
      { key: 0, label: 'WordPiece + [CLS]/[SEP]', sub: '15% masked tokens', kind: 'embed' },
      { key: 1, label: 'Transformer Encoder', sub: 'bidirectional, L layers', kind: 'attention', repeat: 'enc' },
      { key: 2, label: 'MLM + NSP Heads', sub: 'pre-training objectives', kind: 'dense' },
      { key: 3, label: 'Task Head', sub: 'fine-tune all weights', kind: 'output' },
    ],
  },

  vae: {
    title: 'Variational Autoencoder',
    orientation: 'vertical',
    blocks: [
      { key: 'enc', label: 'Encoder', sub: 'q(z|x)', kind: 'conv' },
      { key: 'params', label: 'Mu / Sigma', sub: 'latent parameters', kind: 'op' },
      { key: 'z', label: 'Sample  z', sub: 'z = mu + sigma * eps', kind: 'sample' },
      { key: 'dec', label: 'Decoder', sub: 'p(x|z)', kind: 'conv' },
      { key: 'dec', label: 'Reconstruct  x', sub: 'ELBO = recon - KL', kind: 'output' },
    ],
  },

  gan: {
    title: 'Generative Adversarial Net',
    orientation: 'vertical',
    blocks: [
      { key: 0, label: 'Noise  z', sub: 'Gaussian prior', kind: 'sample' },
      { key: 1, label: 'Generator', sub: 'G(z) -> fake', kind: 'conv' },
      { key: 2, label: 'Fake + Real', sub: 'paired for the critic', kind: 'flow' },
      { key: 3, label: 'Discriminator', sub: 'D(x) -> p(real)', kind: 'conv' },
      { key: 4, label: 'Real / Fake', sub: 'minimax loss', kind: 'loss' },
    ],
    skips: [{ from: 4, to: 1, label: 'backprop to G' }],
  },

  word2vec: {
    title: 'Word2Vec (skip-gram)',
    orientation: 'vertical',
    blocks: [
      { key: 0, label: 'Context Window', sub: 'center + neighbours', kind: 'input' },
      { key: 1, label: 'Embedding Lookup', sub: 'center word vector', kind: 'embed' },
      { key: 2, label: 'Predict Neighbours', sub: 'negative sampling', kind: 'dense' },
      { key: 3, label: 'Update Vectors', sub: 'co-occurring words pull close', kind: 'output' },
    ],
  },

  dropout: {
    title: 'Dropout',
    orientation: 'vertical',
    blocks: [
      { key: 0, label: 'Dense Layer', sub: 'full activations', kind: 'dense' },
      { key: 1, label: 'Sample Mask', sub: 'keep each unit w.p. p', kind: 'sample' },
      { key: 2, label: 'Thinned Network', sub: 'a different subnet per step', kind: 'flow' },
      { key: 3, label: 'Test-Time Scale', sub: 'multiply by p', kind: 'output' },
    ],
  },

  batchnorm: {
    title: 'Batch Normalization',
    orientation: 'vertical',
    blocks: [
      { key: 0, label: 'Activations', sub: 'pre-activation, mini-batch', kind: 'input' },
      { key: 1, label: 'Batch Stats', sub: 'per-feature mean / var', kind: 'op' },
      { key: 1, label: 'Normalize', sub: '(x - mu) / sqrt(var + e)', kind: 'norm' },
      { key: 2, label: 'Scale & Shift', sub: 'gamma * x_hat + beta', kind: 'output' },
    ],
  },

  unet: {
    title: 'U-Net',
    orientation: 'vertical',
    blocks: [
      { key: 'enc', label: 'Encoder', sub: 'conv + max pool, downsample', kind: 'conv', repeat: 'down' },
      { key: 'enc', label: 'Encoder', sub: 'conv + max pool, downsample', kind: 'conv', repeat: 'down' },
      { key: 'bottleneck', label: 'Bottleneck', sub: 'deepest features', kind: 'op' },
      { key: 'dec', label: 'Decoder', sub: 'up-conv + concat skip', kind: 'conv', repeat: 'up' },
      { key: 'dec', label: '1x1 Conv', sub: 'segmentation mask', kind: 'output' },
    ],
    skips: [
      { from: 1, to: 3, label: 'skip + concat' },
      { from: 0, to: 4, label: 'skip + concat' },
    ],
  },

  densenet: {
    title: 'DenseNet',
    orientation: 'vertical',
    blocks: [
      { key: 0, label: 'Input + Conv', sub: '7x7 stem', kind: 'input' },
      { key: 1, label: 'Dense Block', sub: 'concat all prior maps', kind: 'conv', repeat: 'dense' },
      { key: 2, label: 'Transition', sub: '1x1 conv + avg pool', kind: 'flow', repeat: 'dense' },
      { key: 3, label: 'Dense Block', sub: 'concat all prior maps', kind: 'conv' },
      { key: 4, label: 'Global Pool + Softmax', sub: 'classification head', kind: 'output' },
    ],
    skips: [{ from: 0, to: 3, label: 'dense concat' }],
  },

  ddpm: {
    title: 'Diffusion (DDPM)',
    orientation: 'vertical',
    blocks: [
      { key: 'forward', label: 'Forward Process', sub: 'add Gaussian noise', kind: 'sample' },
      { key: 'forward', label: 'x_T  pure noise', sub: 'after T steps', kind: 'flow' },
      { key: 'predict', label: 'U-Net  e(x_t, t)', sub: 'predict the noise', kind: 'conv' },
      { key: 'predict', label: 'MSE on epsilon', sub: 'training objective', kind: 'loss' },
      { key: 'reverse', label: 'Reverse Process', sub: 'denoise step by step', kind: 'output' },
    ],
  },

  vit: {
    title: 'Vision Transformer',
    orientation: 'vertical',
    blocks: [
      { key: 0, label: 'Patch Embed', sub: '16x16 patches + [CLS]', kind: 'embed' },
      { key: 1, label: 'Transformer Encoder', sub: 'L layers, MHA + MLP', kind: 'attention', repeat: 'enc' },
      { key: 2, label: 'MLP Head', sub: 'on [CLS] token', kind: 'dense' },
      { key: 3, label: 'Softmax', sub: 'class probabilities', kind: 'output' },
    ],
  },

  seq2seq: {
    title: 'Seq2Seq + Attention',
    orientation: 'vertical',
    blocks: [
      { key: 'enc', label: 'Encoder RNN', sub: 'reads source tokens', kind: 'conv', lane: 'left' },
      { key: 'attn', label: 'Attention', sub: 'context over states', kind: 'attention', lane: 'center' },
      { key: 'dec', label: 'Decoder RNN', sub: 'emits target tokens', kind: 'conv', lane: 'right' },
      { key: 'out', label: 'Softmax', sub: 'output vocabulary', kind: 'output', lane: 'right' },
    ],
  },
};

const ALIASES = {
  'attention-is-all-you-need': 'transformer',
  'deep-residual-learning': 'resnet',
  'imagenet-classification': 'alexnet',
};

export function getArchitecture(idOrSlug) {
  if (!idOrSlug) return null;
  const key = String(idOrSlug).toLowerCase();
  return ARCHITECTURES[key] || ARCHITECTURES[ALIASES[key]] || null;
}

export default ARCHITECTURES;
