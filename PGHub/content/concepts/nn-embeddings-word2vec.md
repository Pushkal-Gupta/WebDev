---
slug: nn-embeddings-word2vec
module: neural-networks
title: Word Embeddings & word2vec
subtitle: Turn every word into a dense vector so that meaning becomes geometry — closeness is similarity and direction encodes analogy.
difficulty: Intermediate
position: 13
estimatedReadMinutes: 14
prereqs: [nn-perceptron, nn-gradient-descent]
relatedProblems: []
references:
  - title: "Mikolov et al. — Efficient Estimation of Word Representations in Vector Space (word2vec)"
    url: "https://arxiv.org/abs/1301.3781"
    type: paper
  - title: "Mikolov et al. — Distributed Representations of Words and Phrases and their Compositionality (negative sampling)"
    url: "https://arxiv.org/abs/1310.4546"
    type: paper
  - title: "Pennington, Socher & Manning — GloVe: Global Vectors for Word Representation"
    url: "https://nlp.stanford.edu/pubs/glove.pdf"
    type: paper
  - title: "Jay Alammar — The Illustrated Word2vec"
    url: "https://jalammar.github.io/illustrated-word2vec/"
    type: article
status: published
---

## intro
A neural network eats numbers, but language arrives as symbols. Before any model can reason over text, each word has to become a vector. The naive choice — a one-hot code with a single 1 in a slot the size of the vocabulary — carries no meaning at all: "cat" and "kitten" sit exactly as far apart as "cat" and "helicopter". Word embeddings replace that with a short, dense vector, typically 100 to 300 real numbers, learned so that words used in similar contexts land near each other. The word2vec family showed that a shallow network trained on nothing but "predict the neighbors" produces vectors whose geometry captures gender, tense, plurality, and even country-capital relationships as consistent directions in space.

## whyItMatters
Embeddings are the input layer of essentially every modern language system, and the ideas generalize far past words. The same recipe — learn a dense vector per token so that similarity becomes distance — powers product recommendations, search ranking, graph nodes, and the token embeddings inside every transformer and large language model. word2vec mattered because it made high-quality vectors cheap: a single pass of a two-layer network over a large corpus, no labels required, yielding representations that transfer to downstream tasks with a simple lookup. It also delivered the result that made the field pay attention — vector arithmetic that respects meaning, where subtracting "man" from "king" and adding "woman" lands near "queen". That a linear operation in a learned space recovers a semantic analogy is the clearest demonstration that these vectors encode structure, not noise, and it reframed representation learning as a first-class goal.

## intuition
The linguist J.R. Firth put it best: "a word is known by the company it keeps." This is the **distributional hypothesis** — words that appear in similar contexts tend to mean similar things. If you read thousands of sentences and blank out a word, the surrounding words usually pin down what it was: "I poured myself a cup of ___" strongly suggests coffee or tea. word2vec turns that observation into a training signal. It slides a window across the corpus and, for each center word, tries to predict the words around it. To do that well, words that share contexts must be pushed to have similar vectors — because similar vectors produce similar predictions.

Contrast this with the **one-hot** encoding. With a vocabulary of 50,000 words, every word is a 50,000-long vector that is all zeros except a single 1. These vectors are enormous, mostly empty, and mutually orthogonal: the dot product between any two distinct words is exactly zero, so the representation has no built-in notion of similarity. A **dense** embedding instead spends, say, 300 real numbers per word, and lets training decide how to use them. Nothing is wasted — every coordinate participates for every word.

The payoff is that **directions in space start to encode meaning**. One direction may track singular-versus-plural, another masculine-versus-feminine, another present-versus-past tense. Because these axes are roughly consistent across words, relationships become vector offsets: the step from "king" to "queen" is about the same displacement as "man" to "woman". **Similarity becomes geometric closeness** — words with related meaning cluster together, and you measure "related" with the angle between vectors rather than raw distance. That geometric view is the whole point: once meaning lives in a vector space, the tools of linear algebra let you compare, cluster, and even do arithmetic on concepts.

## visualization
```
2D sketch of a learned embedding space (axes are latent, not literal):

          plural/female ^
                        |        queen *
             woman *    |     *  king
                        |
   dog *  cat *         |            paris *
      * kitten          |         *  france
  ------------------------------------------> semantic axis
      (animals cluster) |        (places cluster)
                        |
  Analogy as a parallelogram:
      king  - man  + woman  ~=  queen
        \_________/           the SAME offset vector
         "royalty" step       reused from man->woman
```

## bruteForce
The pre-neural baseline is to build vectors by **counting**. The simplest is one-hot: index every word and give it a vector of length \(V\) (the vocabulary size) with a single 1. A step up is a **co-occurrence matrix** — an \(V \times V\) table where entry \((i, j)\) counts how often word \(j\) appears near word \(i\). A row of that matrix is a genuine context signature, so it does carry some meaning. But both suffer badly: the vectors are gigantic (length \(V\), often tens of thousands), overwhelmingly sparse, and grow with the vocabulary. Worse, raw counts are dominated by frequent function words like "the", and there is still no compact notion of similarity — two synonyms that never happen to share exact neighbors look unrelated. You can shrink and denoise a co-occurrence matrix with a **truncated SVD**, factoring it into low-rank dense vectors; this "latent semantic" approach is the historical bridge to word2vec and works, but recomputing an SVD over a huge sparse matrix is expensive and awkward to update as new text arrives. The lesson: counting captures the raw distributional signal, yet we want it compressed into small dense vectors *directly*, learned online, which is exactly what word2vec does.

## optimal
word2vec learns dense vectors by turning the distributional hypothesis into a prediction task. The **skip-gram** variant takes each center word \(w_I\) and tries to predict its surrounding context words \(w_O\) within a small window. Each word carries a learnable vector \(v_w\); the model scores a (center, context) pair by their dot product and normalizes over the whole vocabulary with a softmax:
\[ P(w_O\mid w_I)=\frac{\exp(v_{w_O}^\top v_{w_I})}{\sum_{w=1}^{V}\exp(v_w^\top v_{w_I})} \]
Training maximizes this probability for pairs that truly co-occur, via ordinary gradient descent. The catch is the denominator: summing \(\exp(v_w^\top v_{w_I})\) over every word in the vocabulary costs \(O(V)\) per step, which is ruinous for \(V\) in the tens of thousands. The fix that made word2vec practical is **negative sampling**. Instead of the full softmax, reframe the problem as binary classification: push the real (center, context) pair toward 1, and push a handful of \(k\) randomly sampled "negative" words toward 0. Each step now costs \(O(k)\) with \(k\) around 5–20, independent of \(V\). Frequent words are also subsampled so "the" does not drown the signal. After training, the learned matrix rows **are** the embeddings — you simply look up a word's vector; the network itself is discarded. To compare two vectors you use **cosine similarity**, the cosine of the angle between them, \( \cos(\theta)=\frac{u^\top v}{\lVert u\rVert\,\lVert v\rVert} \), which ignores magnitude and rewards shared direction. Analogies fall out as arithmetic: to solve "king is to man as ? is to woman", compute \(v_\text{king} - v_\text{man} + v_\text{woman}\) and return the vocabulary word whose vector has the highest cosine similarity to that result — which turns out to be "queen".

```python
import numpy as np

# Tiny hand-built embedding table (already "trained") to show the mechanics.
vec = {
    "king":  np.array([0.92, 0.85, 0.10]),
    "queen": np.array([0.90, 0.10, 0.12]),
    "man":   np.array([0.20, 0.88, 0.08]),
    "woman": np.array([0.18, 0.12, 0.10]),
}

def cos(a, b):
    return a @ b / (np.linalg.norm(a) * np.linalg.norm(b))

target = vec["king"] - vec["man"] + vec["woman"]
best = max(("queen", "man", "woman"), key=lambda w: cos(target, vec[w]))
print("king - man + woman ~=", best)   # -> queen
```

## complexity
time: Full-softmax skip-gram costs \(O(V)\) per (center, context) pair because the denominator sums over the whole vocabulary; negative sampling drops this to \(O(k)\) per pair with \(k\approx5\text{--}20\), independent of vocabulary size. A cosine similarity or a single analogy query is \(O(d)\) in the embedding dimension \(d\); finding the nearest neighbor across the vocabulary is \(O(Vd)\) by brute force.
space: The embedding table is \(O(Vd)\) — one \(d\)-dimensional vector per word (skip-gram keeps a second "context" matrix during training, doubling this transiently). Dense at \(d\approx300\) is dramatically smaller than an \(O(V^2)\) co-occurrence matrix.
notes: Training is one streaming pass (or a few epochs) over the corpus, so total cost scales with corpus length times \(k\) times \(d\), not with \(V^2\). Nearest-neighbor lookup at serve time is usually accelerated with an approximate index (e.g. HNSW) rather than the brute-force \(O(Vd)\) scan.

## pitfalls
- Assuming every analogy holds. \(v_\text{king}-v_\text{man}+v_\text{woman}\) landing on "queen" is real but cherry-picked; most random analogies fail or return the input words, and standard implementations quietly exclude the three query words from the answer. The fix: evaluate on a proper analogy benchmark, exclude query terms, and treat clean analogies as a nice property rather than a guarantee.
- Embeddings absorb and amplify social bias. Because they mirror the corpus, learned vectors reproduce stereotypes — occupation words skew along gender directions, for example. The fix: audit for biased directions and apply debiasing (project out the bias subspace) before deploying in ranking or hiring-adjacent systems.
- Out-of-vocabulary words have no vector. Classic word2vec can only look up words it saw during training, so a new or misspelled token returns nothing. The fix: use subword models like fastText that build a word vector from character n-grams, so unseen words still get a reasonable embedding.
- Frequency and anisotropy distort geometry. Very frequent words dominate training and the vector cloud tends to be squeezed into a narrow cone, inflating cosine similarities across unrelated words. The fix: subsample frequent words during training, and post-process (mean-center, remove top principal components, or length-normalize) so cosine comparisons are meaningful.

## interviewTips
- State the distributional hypothesis first ("a word is known by the company it keeps"), then frame skip-gram as predicting context from a center word — the intuition earns more than the equation.
- Be ready to explain why the softmax denominator is the bottleneck and how negative sampling replaces an \(O(V)\) normalization with an \(O(k)\) binary-classification objective, plus subsampling of frequent words.
- Know that the learned matrix rows are the embeddings, that cosine similarity (not Euclidean distance) is the standard comparison, and that analogies are solved by vector arithmetic followed by a nearest-neighbor search excluding the query words.

## keyTakeaways
- Dense embeddings map each word to a short real vector so that similar-context words sit close together, replacing huge, meaningless, mutually orthogonal one-hot codes.
- Skip-gram word2vec learns these vectors by predicting context words; negative sampling turns the expensive \(O(V)\) softmax into an \(O(k)\) binary objective, making training fast at scale.
- Meaning becomes geometry: cosine similarity measures relatedness by angle, and consistent directional offsets let vector arithmetic recover analogies like king − man + woman ≈ queen.

## code.python
```python
import numpy as np

# Fixed, hand-crafted embeddings (no RNG) — meaning is baked into the coordinates.
# Loose axes: [royalty, male-ness, animal-ness].
vec = {
    "king":    np.array([0.95, 0.90, 0.05]),
    "queen":   np.array([0.93, 0.12, 0.06]),
    "man":     np.array([0.20, 0.92, 0.08]),
    "woman":   np.array([0.18, 0.10, 0.09]),
    "prince":  np.array([0.80, 0.85, 0.05]),
    "dog":     np.array([0.05, 0.55, 0.95]),
}

def cosine(a, b):
    return float(a @ b / (np.linalg.norm(a) * np.linalg.norm(b)))

print(f"cos(king, queen) = {cosine(vec['king'], vec['queen']):.3f}")
print(f"cos(king, dog)   = {cosine(vec['king'], vec['dog']):.3f}")

# Analogy: king - man + woman, then nearest by cosine (excluding the query words).
target = vec["king"] - vec["man"] + vec["woman"]
query = {"king", "man", "woman"}
best = max((w for w in vec if w not in query), key=lambda w: cosine(target, vec[w]))
print("king - man + woman ~=", best)   # -> queen
```

## code.javascript
```javascript
// Fixed, hand-crafted embeddings (no RNG). Axes: [royalty, male-ness, animal-ness].
const vec = {
  king:   [0.95, 0.90, 0.05],
  queen:  [0.93, 0.12, 0.06],
  man:    [0.20, 0.92, 0.08],
  woman:  [0.18, 0.10, 0.09],
  prince: [0.80, 0.85, 0.05],
  dog:    [0.05, 0.55, 0.95],
};

const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
const norm = a => Math.sqrt(dot(a, a));
const cosine = (a, b) => dot(a, b) / (norm(a) * norm(b));

console.log(`cos(king, queen) = ${cosine(vec.king, vec.queen).toFixed(3)}`);
console.log(`cos(king, dog)   = ${cosine(vec.king, vec.dog).toFixed(3)}`);

// Analogy: king - man + woman, nearest by cosine excluding query words.
const target = vec.king.map((x, i) => x - vec.man[i] + vec.woman[i]);
const query = new Set(['king', 'man', 'woman']);
let best = null, bestScore = -Infinity;
for (const w of Object.keys(vec)) {
  if (query.has(w)) continue;
  const s = cosine(target, vec[w]);
  if (s > bestScore) { bestScore = s; best = w; }
}
console.log('king - man + woman ~=', best);   // -> queen
```

## code.java
```java
import java.util.*;

public class Word2VecAnalogy {
    static double dot(double[] a, double[] b) {
        double s = 0; for (int i = 0; i < a.length; i++) s += a[i] * b[i]; return s;
    }
    static double cosine(double[] a, double[] b) {
        return dot(a, b) / (Math.sqrt(dot(a, a)) * Math.sqrt(dot(b, b)));
    }

    public static void main(String[] args) {
        // Fixed, hand-crafted embeddings. Axes: [royalty, male-ness, animal-ness].
        Map<String, double[]> vec = new LinkedHashMap<>();
        vec.put("king",   new double[]{0.95, 0.90, 0.05});
        vec.put("queen",  new double[]{0.93, 0.12, 0.06});
        vec.put("man",    new double[]{0.20, 0.92, 0.08});
        vec.put("woman",  new double[]{0.18, 0.10, 0.09});
        vec.put("prince", new double[]{0.80, 0.85, 0.05});
        vec.put("dog",    new double[]{0.05, 0.55, 0.95});

        System.out.printf("cos(king, queen) = %.3f%n", cosine(vec.get("king"), vec.get("queen")));
        System.out.printf("cos(king, dog)   = %.3f%n", cosine(vec.get("king"), vec.get("dog")));

        double[] target = new double[3];
        for (int i = 0; i < 3; i++)
            target[i] = vec.get("king")[i] - vec.get("man")[i] + vec.get("woman")[i];

        Set<String> query = new HashSet<>(Arrays.asList("king", "man", "woman"));
        String best = null; double bestScore = Double.NEGATIVE_INFINITY;
        for (Map.Entry<String, double[]> e : vec.entrySet()) {
            if (query.contains(e.getKey())) continue;
            double s = cosine(target, e.getValue());
            if (s > bestScore) { bestScore = s; best = e.getKey(); }
        }
        System.out.println("king - man + woman ~= " + best);   // -> queen
    }
}
```

## code.cpp
```cpp
#include <cstdio>
#include <cmath>
#include <string>
#include <vector>
#include <set>

double dot(const std::vector<double>& a, const std::vector<double>& b) {
    double s = 0; for (size_t i = 0; i < a.size(); i++) s += a[i] * b[i]; return s;
}
double cosine(const std::vector<double>& a, const std::vector<double>& b) {
    return dot(a, b) / (std::sqrt(dot(a, a)) * std::sqrt(dot(b, b)));
}

int main() {
    // Fixed, hand-crafted embeddings. Axes: [royalty, male-ness, animal-ness].
    std::vector<std::string> words = {"king", "queen", "man", "woman", "prince", "dog"};
    std::vector<std::vector<double>> vec = {
        {0.95, 0.90, 0.05}, {0.93, 0.12, 0.06}, {0.20, 0.92, 0.08},
        {0.18, 0.10, 0.09}, {0.80, 0.85, 0.05}, {0.05, 0.55, 0.95},
    };
    auto get = [&](const std::string& w) -> std::vector<double>& {
        for (size_t i = 0; i < words.size(); i++) if (words[i] == w) return vec[i];
        return vec[0];
    };

    std::printf("cos(king, queen) = %.3f\n", cosine(get("king"), get("queen")));
    std::printf("cos(king, dog)   = %.3f\n", cosine(get("king"), get("dog")));

    std::vector<double> target(3);
    for (int i = 0; i < 3; i++)
        target[i] = get("king")[i] - get("man")[i] + get("woman")[i];

    std::set<std::string> query = {"king", "man", "woman"};
    std::string best; double bestScore = -1e18;
    for (size_t i = 0; i < words.size(); i++) {
        if (query.count(words[i])) continue;
        double s = cosine(target, vec[i]);
        if (s > bestScore) { bestScore = s; best = words[i]; }
    }
    std::printf("king - man + woman ~= %s\n", best.c_str());   // -> queen
    return 0;
}
```
