/* ML / DL / AI content registry.
   Shape:
     PILLARS[slug] = {
       title, oneLiner, icon,
       lessons: [{
         slug, title, oneLiner, difficulty, readMinutes,
         sections: [
           { kind: 'prose' | 'ascii' | 'math' | 'code' | 'callout', ... }
         ]
       }]
     }
*/

import { OPTIMIZATION_EXTRA } from './ml-extra/optimization.js';
import { REGULARIZATION_EXTRA } from './ml-extra/regularization.js';
import { RL_EXTRA } from './ml-extra/rl.js';
import { NUMERICAL_EXTRA } from './ml-extra/numerical.js';
import { ARCHITECTURES_EXTRA } from './ml-extra/architectures.js';

export const PILLARS = {
  foundations: {
    title: 'Linear Algebra & Calculus',
    oneLiner: 'Vectors, matrices, dot products, norms, gradients — the math every ML formula stands on.',
    iconName: 'Sigma',
    lessons: [
      {
        slug: 'vectors',
        title: 'Vectors',
        oneLiner: 'A list of numbers with a direction and a length.',
        difficulty: 'foundation',
        readMinutes: 9,
        sections: [
          {
            kind: 'prose',
            heading: 'What a vector actually is',
            body: `A vector is just an ordered list of numbers — \\([3, -1, 4]\\) is a 3-dimensional vector, \\([0.2, 0.8]\\) is a 2-dimensional one. That is the entire definition. Everything else you will hear about vectors — magnitude, direction, dot products, projections — is a *consequence* of that definition once you decide how to interpret the numbers geometrically.

The standard interpretation in ML: a vector with \\(n\\) numbers is a point in \\(n\\)-dimensional space, with its tail glued to the origin. The numbers are the coordinates. \\([3, 4]\\) means "three steps east, four steps north." \\([3, -1, 4]\\) means the same idea, one dimension further in. The arrow from the origin to that point *is* the vector.

This matters because ML never deals with the actual world of cats, sentences, and emails. It deals with vectors that *represent* those things. A 768-dimensional sentence embedding from a transformer is a point in a 768-dimensional space. Two sentences with similar meaning land near each other in that space. The whole field is built on this one trick: turn the thing you care about into a vector, then do geometry.`,
          },
          {
            kind: 'viz',
            component: 'VectorPlayground',
            props: { mode: 'single' },
            heading: 'Drag the vector — watch length and angle update live',
          },
          {
            kind: 'viz',
            heading: 'Length and angle of a single vector',
            component: 'VectorGeometryViz',
          },
          {
            kind: 'prose',
            heading: 'Two operations, everything else falls out',
            body: `You only need two operations to do everything ML asks of vectors:

**Scalar multiplication** scales a vector. \\(2 \\cdot [3, -1, 4] = [6, -2, 8]\\). The arrow points the same way, but is now twice as long. Negative scalars flip the direction.

**Vector addition** is tip-to-tail. \\([3, 2] + [1, 4] = [4, 6]\\). Geometrically: walk along the first arrow, then start the second arrow where the first ended; the result is the arrow from your original starting point to where you ended up.

Together these two — *scale and add* — are called **linear combinations**, and they are the entire substance of linear algebra. A neural-net layer is a linear combination of its inputs (followed by a nonlinearity). Gradient descent is a linear combination of the current weights and the gradient. PCA is finding the directions along which linear combinations of features carry the most variance. Once you see "scale and add" you stop seeing anything else.`,
          },
          {
            kind: 'viz',
            component: 'VectorPlayground',
            props: { mode: 'add' },
            heading: 'v + u is tip-to-tail. Drag either to see.',
          },
          {
            kind: 'prose',
            heading: 'Three ways to see the same arrow',
            body: `Ask three different people what a vector is and three different answers come back, all correct, none agreeing on words. The computer scientist says a vector is a tuple — an ordered list of numbers, end of story. The physicist says a vector is an arrow in space, something with a length and a direction that exists independently of any coordinate system pinned to the wall. The mathematician shrugs at both and says a vector is anything at all that obeys the rules of vector addition and scalar multiplication — the actual stuff does not matter, only that scaling and adding behave sensibly.

These are not three definitions competing for the same job. They are three windows onto the same object, and the entire point of linear algebra is that the windows agree on what they show.

Take the tuple \\([2, 3]\\). The CS view stops there: two numbers in a row, stored in memory, addressable by index. The physics view glues the tail of an arrow to the origin and draws its head out to the point \\((2, 3)\\) on the plane — that arrow has a length of \\(\\sqrt{13}\\) and a direction roughly thirty-four degrees above the x-axis, and it would still mean the same thing if the page were rotated. The math view checks the rules: scale \\([2, 3]\\) by 5 and the result \\([10, 15]\\) is still a list of numbers obeying the same operations; add \\([2, 3]\\) and \\([1, 1]\\) and the result \\([3, 4]\\) does too. The object qualifies.

The tuple \\([2, 3]\\) **is** the arrow from \\((0, 0)\\) to \\((2, 3)\\) — they are not similar, not analogous, not corresponding. They are the same mathematical object expressed twice. Scalar multiplication on the tuple side becomes stretching or shrinking the arrow on the geometric side. Addition on the tuple side becomes tip-to-tail walking on the geometric side. The math view is what generalises later — once "obeys the rules" is the only thing that matters, polynomials become vectors, functions become vectors, neural-network gradients become vectors. Every visualisation in this lesson is the physics view; every NumPy snippet is the CS view; the reason both work is the math view sitting underneath them, guaranteeing the agreement.`,
          },
          {
            kind: 'viz',
            heading: 'Tip-to-tail vector addition',
            component: 'VectorAdditionViz',
          },
          {
            kind: 'prose',
            heading: 'Worked: adding (3, 1) and (1, 2)',
            body: `Let \\(a = [3, 1]\\) and \\(b = [1, 2]\\). The sum has to come out the same regardless of which view does the work; checking that it does is the point of the exercise.

**Step 1 — component-wise.** Line up the entries and add in pairs:

\\[
a + b = [\\,3 + 1,\\; 1 + 2\\,] = [4, 3]
\\]

Two additions, one new tuple. The CS view answers in a single line.

**Step 2 — geometric.** Draw \\(a\\) as an arrow from the origin to \\((3, 1)\\). Now lift \\(b\\) off the page and place its tail at the head of \\(a\\); the head of \\(b\\) lands at \\((3 + 1,\\; 1 + 2) = (4, 3)\\). The sum \\(a + b\\) is the single straight arrow from the original starting point — the origin — to the final landing point \\((4, 3)\\). Same answer.

**Step 3 — scalar multiplication.** Multiply \\(a\\) by 2.

\\[
2 \\cdot a = [2 \\cdot 3,\\; 2 \\cdot 1] = [6, 2]
\\]

Numerically each entry doubled. Geometrically the arrow keeps pointing in exactly the same direction (slope \\(1/3\\) before, slope \\(2/6 = 1/3\\) after) and is twice as long. Multiplying by \\(-2\\) would give \\([-6, -2]\\) — same line through the origin, opposite direction, twice the length.

**Why this matters.** Every operation in linear algebra reduces to combinations of these two moves: scale a vector, add it to another. A neural-network layer is a stack of scaled-and-added inputs. A gradient-descent update is the current weights plus a scaled gradient. PCA finds the direction along which scaled-and-added features carry the most variance. Master tip-to-tail and component-wise addition on this 2D toy and the rest is repetition in higher dimensions.`,
          },
          {
            kind: 'math',
            heading: 'Norms — how long is this vector?',
            body: `The length of a vector is called its **norm**, written \\(\\|v\\|\\). The default ("L2 norm" or "Euclidean norm") is just the Pythagorean theorem in \\(n\\) dimensions:

\\[
\\|v\\|_2 = \\sqrt{v_1^2 + v_2^2 + \\cdots + v_n^2}
\\]

For \\(v = [3, 2]\\): \\(\\|v\\|_2 = \\sqrt{9 + 4} = \\sqrt{13}\\).

Other norms exist, and you will meet them again in regularization:

- **L1 norm** \\(\\|v\\|_1 = |v_1| + |v_2| + \\cdots\\) — sum of absolute values. Used in Lasso regression because it encourages sparse vectors.
- **L\\(\\infty\\) norm** \\(\\|v\\|_\\infty = \\max_i |v_i|\\) — the largest single component. Used in adversarial robustness ("the attacker can change each pixel by at most ε").

A vector with norm 1 is called a **unit vector**. You make any non-zero vector into a unit vector by dividing it by its own norm: \\(\\hat{v} = v / \\|v\\|\\). This strips away the magnitude and keeps only the direction.`,
          },
          {
            kind: 'prose',
            heading: 'Geometric intuition: lengths and taxicabs',
            body: `Each norm is asking a different geometric question, and the question is more interesting than the formula.

**L2 is the length of the arrow.** That square-root-of-sum-of-squares is Pythagoras, full stop. In two dimensions, \\(\\sqrt{v_1^2 + v_2^2}\\) is the hypotenuse of the right triangle whose legs are the components. In three dimensions, the same formula is the diagonal of a box whose sides are \\(v_1, v_2, v_3\\) — Pythagoras applied twice. In a thousand dimensions you cannot draw the box, but the algebra is identical and the interpretation does not change: the L2 norm is how far the head of the arrow sits from the tail, as the crow flies.

**L1 is the taxicab.** Imagine Manhattan: every block is a unit, every street runs north-south or east-west, and you cannot cut diagonally through buildings. To get from the origin to the corner at \\((v_1, v_2)\\) you walk \\(|v_1|\\) blocks east-west and \\(|v_2|\\) blocks north-south. Add them and you have the L1 norm. It is the *grid-step distance*, not the straight-line distance.

**Worked: \\(v = [3, -4]\\).** The L2 norm is the straight line:

\\[
\\|v\\|_2 = \\sqrt{3^2 + (-4)^2} = \\sqrt{9 + 16} = \\sqrt{25} = 5
\\]

A clean 3-4-5 right triangle — the head of the arrow sits exactly 5 units from the origin as the crow flies.

The L1 norm is the taxicab:

\\[
\\|v\\|_1 = |3| + |-4| = 3 + 4 = 7
\\]

Seven blocks of walking — three east, four south — to reach the same corner the crow flew 5 units to. The signs are stripped because walking south four blocks costs you the same as walking north four blocks; only the count of blocks matters. The gap between 7 and 5 is the cost of being forced onto a grid. In higher dimensions the gap grows, and that is why L1 regularization pushes weights toward zero so aggressively — taking a detour off any axis is expensive in taxicab geometry, so the optimizer prefers to stay on one.`,
          },
          {
            kind: 'code',
            language: 'python',
            heading: 'Vectors in NumPy',
            body: `import numpy as np

v = np.array([3, -1, 4])
u = np.array([1,  2, 0])

# scale
print(2 * v)            # [ 6 -2  8]

# add
print(v + u)            # [4 1 4]

# L2 norm (Euclidean length)
print(np.linalg.norm(v))            # 5.099...
print(np.sqrt(v @ v))               # same thing, via dot product

# L1 norm (Manhattan length)
print(np.linalg.norm(v, ord=1))     # 8.0

# unit vector — same direction, length 1
v_hat = v / np.linalg.norm(v)
print(np.linalg.norm(v_hat))        # 1.0`,
          },
          {
            kind: 'callout',
            tone: 'note',
            body: `**Why \`v @ v\` equals \`|v|^2\`.** The dot product of a vector with itself is the sum of its squared components — exactly what is under the square root in the L2 norm. So \`np.sqrt(v @ v)\` and \`np.linalg.norm(v)\` compute the same number, and you will see both in ML code.`,
          },
          {
            kind: 'prose',
            heading: 'High dimensions break your intuition (this is the point)',
            body: `In 2D you can picture vectors as arrows on a page. In 3D, as arrows in a room. In 4D you cannot picture them at all, and that is fine — the algebra still works.

But the *geometry* of high-dimensional spaces is genuinely strange, and a few of these surprises matter in ML:

1. **Almost every pair of random vectors is nearly orthogonal.** In a 1000-dimensional space, two vectors drawn from independent Gaussian noise will have a cosine similarity tightly clustered near zero. This is why word embeddings can pack so many distinct meanings into a few hundred dimensions without them stepping on each other.

2. **Volume is concentrated in a thin shell.** Most of the volume of a high-dimensional ball is near its surface, not at its center. The opposite of what your 3D intuition tells you.

3. **Distances become uninformative.** Pick a query point and a million random points in a 1000-D space; the nearest and the furthest will have almost the same distance. This is why exact nearest-neighbour search dies in high dimensions and why ANN (approximate nearest neighbour) indices exist.

You do not need to fully internalize these yet. Just file them away — when something in an ML system feels mysterious ("why is cosine similarity such a popular metric?"), the answer is almost always *because of the geometry of high dimensions*.`,
          },
          {
            kind: 'prose',
            heading: 'What to take away',
            body: `A vector is a list of numbers, interpreted as a point or arrow in \\(n\\)-dimensional space. The two operations that matter — scaling and adding — generate every linear-algebra construction you will need. Norms measure length; unit vectors strip length and keep direction.

The next lesson covers **dot products**: a single number that measures how aligned two vectors are. That number is the engine inside cosine similarity, projection, the entire output of a linear layer in a neural net, and — once you generalize it to a matrix-vector product — most of deep learning's compute budget.`,
          },
          {
            kind: 'prose',
            heading: 'Basis vectors — every vector is a recipe',
            body: `Look at the tuple \\([3, 2]\\) again. The "3" and the "2" are not free-floating numbers; they are *amounts of two specific reference arrows*. The first reference arrow points one unit east — call it \\(\\hat{i} = [1, 0]\\). The second points one unit north — call it \\(\\hat{j} = [0, 1]\\). The tuple \\([3, 2]\\) is shorthand for a recipe: take three of \\(\\hat{i}\\), take two of \\(\\hat{j}\\), add them tip-to-tail. The arrow that lands at the point \\((3, 2)\\) is the result. Every coordinate vector you have ever written is secretly a linear combination of these two **basis vectors**.

The moment that lands, two things follow that previously felt arbitrary.

**Why "coordinates" need a choice.** The pair \\([3, 2]\\) only means "three east, two north" because \\(\\hat{i}\\) and \\(\\hat{j}\\) were silently agreed on. Rotate the grid forty-five degrees — call the new reference arrows \\(\\hat{u}\\) and \\(\\hat{v}\\) — and the very same arrow in space gets re-described with completely different numbers. The arrow did not move. The recipe changed because the ingredients changed. PCA is exactly this trick: find a new basis aligned with the variance of the data, rewrite every datapoint in those coordinates, and the small components fall off.

**Why neural-net layers feel mechanical.** A linear layer with weight matrix \\(W\\) takes the input vector \\(x\\) and re-expresses it as a linear combination of the rows of \\(W\\). The "neurons" are nothing more than custom-chosen basis vectors that the network learned because they happen to make the next layer's job easier. Once basis-as-recipe is the default mental picture, an entire dense layer collapses into "rewrite the input in a basis that highlights what matters."

The recipe view also lets infinite-dimensional things into the club. Polynomials have a basis \\(\\{1, x, x^2, x^3, \\ldots\\}\\); the polynomial \\(4 - 2x + x^2\\) is the tuple \\([4, -2, 1, 0, 0, \\ldots]\\) in that basis. Functions, signals, probability distributions — all of them become vectors the moment a basis is named. The arrow on the page is the kindergarten case of a much larger idea.`,
          },
          {
            kind: 'prose',
            heading: 'Worked: turning v = [4, 3] into a unit vector',
            body: `Take \\(v = [4, 3]\\). The lesson stated the recipe — divide by the norm — but never walked the arithmetic end to end. Doing it once makes the next hundred times automatic.

**Step 1 — measure the current length.** Apply the L2 norm:

\\[
\\|v\\|_2 = \\sqrt{4^2 + 3^2} = \\sqrt{16 + 9} = \\sqrt{25} = 5
\\]

A clean 3-4-5 triangle on purpose — the arrow from the origin to \\((4, 3)\\) is exactly 5 units long.

**Step 2 — scale every component by \\(1/\\|v\\|\\).** Divide each entry by 5:

\\[
\\hat{v} = \\frac{v}{\\|v\\|_2} = \\left[\\,\\frac{4}{5},\\; \\frac{3}{5}\\,\\right] = [\\,0.8,\\; 0.6\\,]
\\]

The new tuple has exactly the same *direction* as the original — slope is still \\(3/4\\), since \\(0.6 / 0.8 = 0.75\\) — but a different length.

**Step 3 — verify the length is now 1.** Apply the norm again:

\\[
\\|\\hat{v}\\|_2 = \\sqrt{0.8^2 + 0.6^2} = \\sqrt{0.64 + 0.36} = \\sqrt{1} = 1
\\]

Exactly 1, as advertised. The arrow points the same way as \\(v\\) but now lives on the unit circle.

**Sanity check via scaling.** Normalisation is the same as multiplying by the scalar \\(1/5\\), and scalar multiplication preserves direction while changing length. The slope of \\([4, 3]\\) is \\(3/4 = 0.75\\); the slope of \\([0.8, 0.6]\\) is \\(0.6 / 0.8 = 0.75\\). Identical. The angle with the x-axis is \\(\\arctan(3/4) \\approx 36.87^\\circ\\) for both arrows.

**Why this matters in practice.** Cosine similarity is the dot product of two *unit* vectors — normalisation removes magnitude so the comparison is purely about angle. Word embeddings are often normalised before lookup so that "king" and "queen" being twice as long as "frog" does not skew the nearest-neighbour search. Attention scores in transformers are computed on query/key vectors that get re-scaled by \\(\\sqrt{d_k}\\) for the same reason: keep direction, control magnitude. The five-line computation just done is the same one that runs millions of times per training step.`,
          },
          {
            kind: 'prose',
            heading: 'Further reading',
            body: `- [3Blue1Brown — "Vectors, what even are they?"](https://www.youtube.com/watch?v=fNk_zzaMoSs) — the visual mental model, ten minutes that fix the geometry forever.
- [3Blue1Brown — "Linear combinations, span, and basis vectors"](https://www.youtube.com/watch?v=k7RM-ot2NWY) — the next step: every vector as a recipe of basis vectors.
- [Khan Academy — Intro to vectors](https://www.khanacademy.org/math/linear-algebra/vectors-and-spaces) — slower, drill-style, with worked exercises.`,
          },
        ],
      },
      {
        slug: 'dot-product',
        title: 'Dot product',
        oneLiner: 'One scalar that measures how aligned two vectors are. The engine of every linear layer.',
        difficulty: 'foundation',
        readMinutes: 8,
        sections: [
          {
            kind: 'prose',
            heading: 'Definition first, intuition next',
            body: `The dot product of two vectors \\(u\\) and \\(v\\) of the same length \\(n\\) is:

\\[
u \\cdot v = u_1 v_1 + u_2 v_2 + \\cdots + u_n v_n = \\sum_{i=1}^{n} u_i v_i
\\]

Multiply the matched components, add them up, you get a single number. That is the whole definition. It costs \\(n\\) multiplies and \\(n-1\\) adds — what GPUs are physically optimised to do millions of times per second.

A second, equivalent definition — the geometric one — explains *why this operation is useful*:

\\[
u \\cdot v = \\|u\\| \\, \\|v\\| \\, \\cos\\theta
\\]

where \\(\\theta\\) is the angle between the two vectors. The dot product is the product of their lengths times the cosine of the angle between them.

Stare at that for a second. The dot product is positive when the vectors point *roughly the same way* (\\(\\cos\\theta > 0\\)), negative when they point *roughly opposite* (\\(\\cos\\theta < 0\\)), and exactly zero when they are *orthogonal* (\\(\\cos\\theta = 0\\)). One number, three regimes — alignment, anti-alignment, perpendicular. That is the whole story.`,
          },
          {
            kind: 'viz',
            heading: 'Sign of the dot product',
            component: 'DotProductSignViz',
            props: {},
          },
          {
            kind: 'prose',
            heading: 'Cosine similarity — the dot product, normalised',
            body: `Cosine similarity divides the dot product by both lengths:

\\[
\\text{cos\\_sim}(u, v) = \\frac{u \\cdot v}{\\|u\\| \\, \\|v\\|} = \\cos\\theta
\\]

This strips out magnitude and leaves only the angle. It is the metric used by virtually every embedding system in production — semantic search, retrieval-augmented generation, deduplication, clustering — because magnitude usually carries the wrong signal (a longer sentence is not a more *meaningful* sentence; an image with brighter pixels is not a more *cat-like* cat). Direction is what carries meaning in an embedding space.

When people say "the vector for *king* is close to the vector for *queen*," they mean cosine similarity, not Euclidean distance. The two metrics often agree, but cosine is robust to embeddings that happen to come out longer or shorter, which Euclidean is not.`,
          },
          {
            kind: 'viz',
            component: 'VectorPlayground',
            props: { mode: 'dot' },
            heading: 'Rotate u relative to v — watch the sign of v · u flip',
          },
          {
            kind: 'code',
            language: 'python',
            heading: 'Dot products and cosine similarity in NumPy',
            body: `import numpy as np

u = np.array([1, 0, 1])
v = np.array([1, 1, 0])
w = np.array([-1, 0, -1])   # anti-parallel to u

# componentwise definition
print(u @ v)             # 1*1 + 0*1 + 1*0 = 1
print(np.dot(u, w))      # -2  (anti-aligned)

# cosine similarity
def cos_sim(a, b):
    return (a @ b) / (np.linalg.norm(a) * np.linalg.norm(b))

print(cos_sim(u, v))      # 0.5   — 60° apart
print(cos_sim(u, w))      # -1.0  — exact opposite
print(cos_sim(u, u))      #  1.0  — same direction

# orthogonal vectors → 0
print(cos_sim(np.array([1, 0]), np.array([0, 1])))   # 0.0`,
          },
          {
            kind: 'prose',
            heading: 'Every linear layer is a stack of dot products',
            body: `A fully-connected layer in a neural network computes \\(y = Wx + b\\), where \\(x\\) is the input vector, \\(W\\) is a matrix of weights, and \\(b\\) is a bias vector. The matrix-vector product \\(Wx\\) is *just dot products*: row \\(i\\) of \\(W\\) is dotted with \\(x\\) to produce component \\(i\\) of \\(y\\).

So the question "what does a neuron in this layer compute?" has a one-line answer: it dots a learned weight vector with the input. The neuron fires strongly when the input points in roughly the same direction as the weight vector, weakly otherwise. Training tilts the weight vectors until each neuron points in a direction the network finds useful — edges in the early layers of a CNN, faces or words in the later ones, attention patterns in a transformer.

Attention itself, the operation that ate NLP, is a softmax over dot products: each query vector is dotted with every key vector, and the resulting score determines how much each value vector contributes to the output. Same primitive, same hardware path, billions of times per forward pass.`,
          },
          {
            kind: 'callout',
            tone: 'tip',
            body: `**Numerical gotcha.** When you dot two large vectors of small components, intermediate sums can lose precision. Most ML frameworks accumulate dot products in float32 even when inputs are float16, exactly to avoid this. If you write a custom CUDA kernel and skip that step, you will see your model "stop learning" mysteriously — that is why.`,
          },
          {
            kind: 'prose',
            heading: 'What to take away',
            body: `The dot product turns geometry — angle and length — into a single scalar your computer can manipulate. Positive means aligned, negative means opposed, zero means perpendicular. Normalising by the two lengths gives you cosine similarity, the workhorse metric of every embedding-based ML system on Earth.

Next up: **matrices**, which are just stacks of vectors. Once you see a matrix as "a list of rows you can dot against any input," the matrix-vector product stops being a definition to memorise and becomes the only sensible thing it could be.`,
          },
          {
            kind: 'prose',
            heading: 'Geometric picture: projection is the dot product',
            body: `The cleanest geometric reading of \\(u \\cdot v\\) is **projection**. Drop a perpendicular from the tip of \\(v\\) onto the line spanned by \\(u\\); the length of the resulting shadow is \\(\\|v\\| \\cos\\theta\\). Multiply that shadow by the length of \\(u\\) and the dot product falls out:

\\[
u \\cdot v = \\|u\\| \\cdot \\underbrace{\\|v\\| \\cos\\theta}_{\\text{shadow of } v \\text{ on } u}.
\\]

So "the dot product measures how aligned two vectors are" is literally true: it is the length of the part of \\(v\\) that lies *along* \\(u\\), scaled by \\(\\|u\\|\\). If \\(u\\) is a unit vector, \\(u \\cdot v\\) is exactly the signed shadow — positive if \\(v\\) leans the same way as \\(u\\), negative if it leans backwards, zero if it stands perpendicular.

This is the picture that makes a neuron's behaviour click. A neuron with weight vector \\(w\\) computes \\(w \\cdot x\\), which is the length of \\(x\\)'s shadow on \\(w\\) (times \\(\\|w\\|\\)). The neuron fires hardest when the input vector lies *along its weight direction*. Training rotates \\(w\\) until it points in whichever direction the network finds informative — the neuron then acts as a "detector" for that direction, lighting up for inputs that resemble \\(w\\) and going dark for inputs that do not.

The projection picture also explains an everyday trick: **decomposition**. Any vector \\(v\\) can be split into the part parallel to \\(u\\) and the part perpendicular to it,

\\[
v = \\underbrace{\\frac{u \\cdot v}{\\|u\\|^2}\\, u}_{v_{\\parallel}} \\;+\\; \\underbrace{\\left(v - \\frac{u \\cdot v}{\\|u\\|^2}\\, u\\right)}_{v_{\\perp}}.
\\]

The parallel piece is what \\(u\\) "sees." The perpendicular piece is invisible to \\(u\\). This is exactly the projection step inside Gram–Schmidt orthogonalisation, the residual step in least-squares regression, and the value-vector mixing inside attention — every one of them is "keep only the component along this direction."`,
          },
          {
            kind: 'prose',
            heading: 'Worked: ranking embeddings by cosine similarity',
            body: `A worked example to make the metric concrete. Suppose a tiny embedding model produces 3-dimensional vectors for four sentences:

\\[
\\begin{aligned}
q &= [\\;1.0,\\; 0.5,\\; 0.0\\;] && \\text{(query: "best running shoes")} \\\\
a &= [\\;0.9,\\; 0.4,\\; 0.2\\;] && \\text{(doc A: "top running sneakers")} \\\\
b &= [\\;0.0,\\; 1.0,\\; 0.0\\;] && \\text{(doc B: "running shoe history")} \\\\
c &= [-1.0, -0.5,\\; 0.0\\;] && \\text{(doc C: "worst hiking boots")}
\\end{aligned}
\\]

Goal: rank \\(a\\), \\(b\\), \\(c\\) by relevance to \\(q\\) using cosine similarity. Step through it once by hand.

**Step 1 — norms.** \\(\\|q\\| = \\sqrt{1.0^2 + 0.5^2 + 0^2} = \\sqrt{1.25} \\approx 1.118\\). \\(\\|a\\| = \\sqrt{0.81 + 0.16 + 0.04} = \\sqrt{1.01} \\approx 1.005\\). \\(\\|b\\| = 1\\). \\(\\|c\\| = \\sqrt{1 + 0.25 + 0} = \\sqrt{1.25} \\approx 1.118\\).

**Step 2 — dot products.** \\(q \\cdot a = (1.0)(0.9) + (0.5)(0.4) + (0)(0.2) = 0.9 + 0.2 + 0 = 1.1\\). \\(q \\cdot b = (1.0)(0) + (0.5)(1.0) + (0)(0) = 0.5\\). \\(q \\cdot c = (1.0)(-1.0) + (0.5)(-0.5) + 0 = -1.25\\).

**Step 3 — divide.** \\(\\cos(q, a) = 1.1 / (1.118 \\cdot 1.005) \\approx 1.1 / 1.123 \\approx 0.979\\). \\(\\cos(q, b) = 0.5 / (1.118 \\cdot 1) \\approx 0.447\\). \\(\\cos(q, c) = -1.25 / (1.118 \\cdot 1.118) \\approx -1.000\\).

**Step 4 — read the result.** Ranking: \\(a > b > c\\). Document \\(a\\) sits almost on top of the query (\\(\\cos \\approx 0.98\\) means an angle of about \\(12\\) degrees). Document \\(b\\) is roughly \\(63\\) degrees away — partially relevant. Document \\(c\\) is the perfect anti-vector (\\(\\cos \\approx -1\\), an angle of \\(180\\) degrees) — explicitly opposite. A retrieval system would return \\(a\\) first, maybe show \\(b\\), and never surface \\(c\\) without a re-ranker explicitly asking for contrast.

**Why the magnitudes hardly mattered.** Notice that \\(\\|q\\| = \\|c\\|\\) and yet their cosine is \\(-1\\). Notice that \\(a\\) has a non-zero third coordinate that \\(q\\) does not — and yet the cosine is still \\(0.98\\), because the dominant components are pointing the same way. Cosine cares about direction; lengths cancel. This is exactly the property that makes cosine the default similarity in production: an embedding that happens to come out a bit longer (because the sentence has more tokens, or the model is mid-fine-tuning) does not move the ranking, only its angular agreement does.`,
          },
          {
            kind: 'prose',
            heading: 'Projection onto a subspace, not just a line',
            body: `Single-vector projection is the warm-up. The real workhorse — the operation behind least squares, principal components, attention's value mixing, and every Gram–Schmidt routine — is projection onto a *subspace* spanned by several vectors at once.

Take an orthonormal basis \\(\\{q_1, q_2, \\ldots, q_k\\}\\) of a \\(k\\)-dimensional subspace \\(W\\) sitting inside \\(\\mathbb{R}^n\\). The projection of any vector \\(v\\) onto \\(W\\) is built out of dot products, one per basis direction:

\\[
\\text{proj}_W(v) = (q_1 \\cdot v)\\, q_1 + (q_2 \\cdot v)\\, q_2 + \\cdots + (q_k \\cdot v)\\, q_k.
\\]

Read that as: walk along each basis direction, ask "how much of \\(v\\) lies along this direction?" (the dot product), and rebuild the shadow piece by piece. The result is the unique point in \\(W\\) closest to \\(v\\) in Euclidean distance. Every other point in \\(W\\) is farther away. That uniqueness is what gives least-squares regression its identity — fitting a line, plane, or hyperplane to noisy data is exactly projecting the response vector onto the column space of the design matrix.

When the basis is *not* orthonormal — just \\(k\\) linearly independent vectors stacked into a matrix \\(A\\) — the projection becomes \\(\\text{proj}_W(v) = A(A^\\top A)^{-1} A^\\top v\\). The matrix \\(A^\\top A\\) is a \\(k \\times k\\) grid of pairwise dot products, often called the *Gram matrix*. Its inverse compensates for the fact that the columns are not perpendicular. The dot product is still doing the work — it is just hidden inside the matrix multiply.

The piece left over, \\(v - \\text{proj}_W(v)\\), is the *residual*. It is perpendicular to every direction in \\(W\\), which is exactly the condition that defines a least-squares fit: residuals orthogonal to the predictors. Attention's value vectors arrive at the output the same way — each head projects the residual stream onto a learned subspace, the rest of the stream passes through untouched.

So the projection-onto-a-line picture from the previous section generalises with no new machinery: more basis vectors, more dot products, same geometry. Orthogonal bases make the formula clean; non-orthogonal bases force a Gram-matrix inverse but compute the same shadow. Either way, the dot product is the only primitive in the room.`,
          },
          {
            kind: 'prose',
            heading: 'Worked: angle between vectors in degrees',
            body: `Take two concrete vectors and compute the exact angle between them. Numbers chosen so every step lands clean.

\\[
u = [\\,3,\\; 4,\\; 0\\,], \\qquad v = [\\,4,\\; 0,\\; 3\\,].
\\]

**Step 1 — dot product.** Multiply matched components and add:

\\[
u \\cdot v = (3)(4) + (4)(0) + (0)(3) = 12 + 0 + 0 = 12.
\\]

**Step 2 — norms.** Both vectors are 3-4-0 triangles, so:

\\[
\\|u\\| = \\sqrt{3^2 + 4^2 + 0^2} = \\sqrt{25} = 5, \\qquad \\|v\\| = \\sqrt{4^2 + 0^2 + 3^2} = \\sqrt{25} = 5.
\\]

**Step 3 — cosine.** Plug into \\(\\cos\\theta = (u \\cdot v) / (\\|u\\|\\|v\\|)\\):

\\[
\\cos\\theta = \\frac{12}{5 \\cdot 5} = \\frac{12}{25} = 0.48.
\\]

**Step 4 — invert to get the angle.** Apply \\(\\arccos\\):

\\[
\\theta = \\arccos(0.48) \\approx 1.0701\\ \\text{radians} \\approx 61.31^\\circ.
\\]

So the two vectors meet at roughly \\(61\\) degrees — well inside the "aligned" half-plane (anything under \\(90^\\circ\\)), but nowhere near parallel.

**Sanity check via projection.** The shadow of \\(v\\) on \\(u\\) has length \\(\\|v\\| \\cos\\theta = 5 \\cdot 0.48 = 2.4\\). The actual projection vector is \\((u \\cdot v / \\|u\\|^2)\\, u = (12/25)\\, [3, 4, 0] = [1.44,\\; 1.92,\\; 0]\\), whose norm is \\(\\sqrt{1.44^2 + 1.92^2} = \\sqrt{2.0736 + 3.6864} = \\sqrt{5.76} = 2.4\\). Matches. The residual \\(v - \\text{proj}_u(v) = [4 - 1.44,\\; 0 - 1.92,\\; 3 - 0] = [2.56,\\; -1.92,\\; 3]\\) should be perpendicular to \\(u\\); confirm with one dot product: \\((3)(2.56) + (4)(-1.92) + (0)(3) = 7.68 - 7.68 + 0 = 0\\). Clean orthogonal split.

**Why the degrees number is worth holding onto.** A cosine of \\(0.48\\) feels lukewarm because the human ear has been trained on cosine-similarity scores from embeddings, where anything below \\(0.6\\) is "probably unrelated." But \\(61\\) degrees is geometrically *less than* a typical "unrelated" pair — most random high-dimensional vectors sit near \\(90\\) degrees. The intuition that production embedding systems treat \\(0.7\\) as "very similar" comes from concentration of measure in high dimensions, not from the underlying geometry. In three dimensions, \\(\\cos\\theta = 0.48\\) is a genuinely close alignment.`,
          },
          {
            kind: 'prose',
            heading: 'Further reading',
            body: `- [3Blue1Brown — "Dot products and duality"](https://www.youtube.com/watch?v=LyGKycYT2v0) — why the geometric and algebraic definitions of the dot product are the same operation.
- [Khan Academy — Vector dot and cross products](https://www.khanacademy.org/math/linear-algebra/vectors-and-spaces/dot-cross-products) — drill problems with full solutions.
- [Wikipedia — Cosine similarity](https://en.wikipedia.org/wiki/Cosine_similarity) — the metric every embedding system reaches for; concise reference for the formula and its variants.`,
          },
        ],
      },
      {
        slug: 'matrices',
        title: 'Matrices',
        oneLiner: 'A grid of numbers that bends one vector space into another.',
        difficulty: 'foundation',
        readMinutes: 10,
        sections: [
          {
            kind: 'prose',
            heading: 'A matrix is a function',
            body: `A matrix is a grid of numbers. A 2-by-3 matrix has 2 rows and 3 columns. That is the surface definition, and it is true, but it misses the point.

The point: a matrix is a **function**. Specifically, a *linear* function from one vector space to another. Feed an \\(n\\)-dimensional vector \\(x\\) into an \\(m \\times n\\) matrix \\(M\\), and you get out an \\(m\\)-dimensional vector \\(Mx\\). The matrix is the rule that turned \\(x\\) into \\(Mx\\). Same input always produces the same output. No state, no surprises — just a fixed bend of the input space.

"Linear" means two things, both inherited from the vector operations in the previous lessons: \\(M(\\alpha x) = \\alpha (Mx)\\) — scaling the input scales the output by the same amount — and \\(M(x + y) = Mx + My\\) — adding inputs adds outputs. Every other property of matrices is a downstream consequence of these two rules. Neural-net layers, PCA, rotations, projections, Markov-chain transitions — every one of them is a matrix because every one of them respects these two rules.`,
          },
          {
            kind: 'prose',
            heading: 'Matrices are functions of space',
            body: `A 2-by-2 matrix is a recipe for warping the entire 2D plane. Not a single point, not a single vector — the whole infinite grid. Every line stays a line, the origin stays put, and parallel lines stay parallel. Inside those constraints the plane can be stretched, sheared, rotated, reflected, or collapsed onto a lower-dimensional shadow. Pick the four entries of the matrix and you have picked one specific warp out of that family.

The shortcut for reading any matrix is to track only two points: where \\(\\hat{\\imath} = (1, 0)\\) lands, and where \\(\\hat{\\jmath} = (0, 1)\\) lands. Those two destinations are exactly the columns of the matrix. Take

\\[
M = \\begin{bmatrix} 3 & 1 \\\\ 1 & 2 \\end{bmatrix}.
\\]

Column 1 is \\((3, 1)\\) — that is the new \\(\\hat{\\imath}\\). Column 2 is \\((1, 2)\\) — that is the new \\(\\hat{\\jmath}\\). The horizontal gridlines, which used to be evenly spaced copies of \\(\\hat{\\imath}\\), now tilt and stretch along \\((3, 1)\\). The vertical gridlines, which used to march along \\(\\hat{\\jmath}\\), now lean and stretch along \\((1, 2)\\). The grid gets sheared and scaled in one motion.

Every other vector rides along for the warp by linearity. A vector \\(v = a\\hat{\\imath} + b\\hat{\\jmath}\\) lands at \\(a \\cdot (3, 1) + b \\cdot (1, 2)\\). That is matrix-vector multiplication, geometrically. No formula to memorise — just "scale the new \\(\\hat{\\imath}\\) by \\(a\\), scale the new \\(\\hat{\\jmath}\\) by \\(b\\), add."

The **determinant** measures how the unit area is rescaled by the warp. The unit square spanned by the original basis becomes the parallelogram spanned by the columns; the determinant is the signed area of that parallelogram. A positive determinant keeps orientation (counter-clockwise stays counter-clockwise); a negative determinant means the plane was flipped over like a pancake. A **singular** matrix — determinant zero — squashes the entire 2D plane onto a single line. Both basis vectors land on the same line, so every output is a multiple of one direction. Two dimensions of input collapse into one dimension of output, and the lost dimension is gone for good.`,
          },
          {
            kind: 'prose',
            heading: 'Worked: applying [[2, 1], [1, 3]] to (2, 1)',
            body: `Take the matrix

\\[
M = \\begin{bmatrix} 2 & 1 \\\\ 1 & 3 \\end{bmatrix}
\\]

and the input vector \\(v = (2, 1)\\). The plan: read the columns, decompose the input, recombine. Three steps, no formula required.

**Step 1 — identify the columns.** Column 1 is \\((2, 1)\\). That is where \\(\\hat{\\imath} = (1, 0)\\) lands after the warp. Column 2 is \\((1, 3)\\). That is where \\(\\hat{\\jmath} = (0, 1)\\) lands. Those two destinations encode everything \\(M\\) does to the plane.

**Step 2 — decompose the input.** The input \\((2, 1)\\) is \\(2\\hat{\\imath} + 1\\hat{\\jmath}\\). Two steps east, one step north. That decomposition is the whole reason the column trick works: a vector written in the basis is already a recipe for how to mix the column destinations.

**Step 3 — combine the destinations with the same weights.** The output is

\\[
Mv = 2 \\cdot (2, 1) + 1 \\cdot (1, 3) = (4, 2) + (1, 3) = (5, 5).
\\]

**Verify with the row dot product.** Row 0 of \\(M\\) is \\((2, 1)\\); dot it with \\(v = (2, 1)\\) to get \\(2 \\cdot 2 + 1 \\cdot 1 = 5\\). Row 1 of \\(M\\) is \\((1, 3)\\); dot it with \\(v\\) to get \\(1 \\cdot 2 + 3 \\cdot 1 = 5\\). Output \\((5, 5)\\) — same answer. The row view and the column view are not two different rules; they are the same computation, organised by output coordinate or by input coordinate. The column view tells you *what the matrix is doing geometrically*; the row view tells you *what each output coordinate is reading from the input*.`,
          },
          {
            kind: 'prose',
            heading: 'Matrix multiplication = composing transformations',
            body: `The product \\(AB\\) means one specific thing: **first apply \\(B\\), then apply \\(A\\).** The matrix sitting next to the input vector is the one that touches it first. The order looks backwards because it reads exactly the way function composition reads in math: \\((AB)v = A(Bv)\\). Strip away the parentheses and the rightmost operator hits the input first, then the next, then the next.

Worked example. Let

\\[
A = \\begin{bmatrix} 1 & 1 \\\\ 0 & 1 \\end{bmatrix}, \\qquad B = \\begin{bmatrix} 0 & -1 \\\\ 1 & 0 \\end{bmatrix}.
\\]

\\(A\\) is a horizontal shear — it leaves \\(\\hat{\\imath}\\) at \\((1, 0)\\) but sends \\(\\hat{\\jmath}\\) to \\((1, 1)\\), tilting vertical lines to the right. \\(B\\) is a 90-degree counter-clockwise rotation — \\(\\hat{\\imath}\\) lands at \\((0, 1)\\) and \\(\\hat{\\jmath}\\) lands at \\((-1, 0)\\).

**Compute \\(AB\\) — rotate first, then shear.** Column \\(j\\) of \\(AB\\) is \\(A\\) applied to column \\(j\\) of \\(B\\). Column 1 of \\(B\\) is \\((0, 1)\\); apply \\(A\\) to get \\(0 \\cdot (1, 0) + 1 \\cdot (1, 1) = (1, 1)\\). Column 2 of \\(B\\) is \\((-1, 0)\\); apply \\(A\\) to get \\(-1 \\cdot (1, 0) + 0 \\cdot (1, 1) = (-1, 0)\\). So

\\[
AB = \\begin{bmatrix} 1 & -1 \\\\ 1 & 0 \\end{bmatrix}.
\\]

**Compute \\(BA\\) — shear first, then rotate.** Column 1 of \\(A\\) is \\((1, 0)\\); apply \\(B\\) to get \\((0, 1)\\). Column 2 of \\(A\\) is \\((1, 1)\\); apply \\(B\\) to get \\(1 \\cdot (0, 1) + 1 \\cdot (-1, 0) = (-1, 1)\\). So

\\[
BA = \\begin{bmatrix} 0 & -1 \\\\ 1 & 1 \\end{bmatrix}.
\\]

\\(AB \\neq BA\\). Same two matrices, different order, genuinely different warps of the plane. Matrix multiplication is **not commutative** because the underlying geometry is not commutative: shearing a rotated square is not the same shape as rotating a sheared square. The algebra is forced to disagree because the pictures disagree.`,
          },
          {
            kind: 'prose',
            heading: 'The columns tell you where the basis lands',
            body: `Here is the single most useful fact about matrices, and the one most textbooks bury under notation: **each column of \\(M\\) is where one basis vector of the input space ends up.**

In 2D, the input basis vectors are \\(\\hat{\\imath} = [1, 0]\\) (one step east) and \\(\\hat{\\jmath} = [0, 1]\\) (one step north). If \\(M\\) is

\\[
M = \\begin{bmatrix} 2 & -1 \\\\ 0 & 3 \\end{bmatrix}
\\]

then column 1 is \\([2, 0]\\) — that is where \\(\\hat{\\imath}\\) lands. Column 2 is \\([-1, 3]\\) — that is where \\(\\hat{\\jmath}\\) lands. The whole transformation is encoded in those two destination vectors. Everything else follows by linearity: any input \\(x = a\\hat{\\imath} + b\\hat{\\jmath}\\) gets sent to \\(a \\cdot (\\text{col}_1) + b \\cdot (\\text{col}_2)\\).

So to read a matrix, do not stare at the grid. Stare at the columns and ask "where did the basis go?" That is the geometric heart of the thing.`,
          },
          {
            kind: 'viz',
            component: 'MatrixTransform',
            props: {},
            heading: 'Drag the matrix entries — watch the grid bend in real time',
          },
          {
            kind: 'viz',
            heading: 'Reading a matrix by its columns',
            component: 'MatrixColumnsViz',
            props: {},
          },
          {
            kind: 'math',
            heading: 'Matrix-vector product, written out',
            body: `Take an \\(m \\times n\\) matrix \\(M\\) with entries \\(M_{ij}\\) and an \\(n\\)-dimensional input \\(x\\). The output \\(y = Mx\\) is \\(m\\)-dimensional, with components:

\\[
y_i = \\sum_{j=1}^{n} M_{ij}\\, x_j
\\]

Two equivalent ways to read this single formula — both worth keeping in your head:

1. **Row view.** Row \\(i\\) of \\(M\\) is a vector; dot it with \\(x\\) to get \\(y_i\\). This is how the previous lesson framed neural-net layers: every output is one dot product.

2. **Column view.** \\(y\\) is a **linear combination of the columns of \\(M\\)**, with the components of \\(x\\) as the weights:

\\[
Mx = x_1 \\, \\text{col}_1(M) + x_2 \\, \\text{col}_2(M) + \\cdots + x_n \\, \\text{col}_n(M)
\\]

The row view is faster to compute by hand. The column view is what gives you geometric intuition — "this output is a recipe that mixes the column destinations, with \\(x\\) as the recipe."`,
          },
          {
            kind: 'prose',
            heading: 'Identity, then composition',
            body: `The **identity matrix** \\(I\\) is the matrix that does nothing — it sends every vector to itself. In 2D:

\\[
I = \\begin{bmatrix} 1 & 0 \\\\ 0 & 1 \\end{bmatrix}
\\]

Its columns are \\(\\hat{\\imath}\\) and \\(\\hat{\\jmath}\\) — the basis vectors land exactly where they started, so nothing moves. \\(Ix = x\\) for every \\(x\\). It plays the same role for matrices that 1 plays for numbers: the no-op, the multiplicative anchor.

Now the second big move: **matrix multiplication is function composition.** If \\(A\\) and \\(B\\) are matrices and you write \\(AB\\), the product is the matrix that represents "apply \\(B\\), then apply \\(A\\)." That order trips everybody up the first time. The reason: \\((AB)x = A(Bx)\\). \\(B\\) touches \\(x\\) first because it sits closer to it.

This is why matrix multiplication is **not commutative**. \\(AB \\neq BA\\) in general, just like "put on socks, then shoes" is not the same as "put on shoes, then socks." Rotate-then-scale is genuinely different from scale-then-rotate when the scale is non-uniform. The algebra is non-commutative because the underlying geometry is.

The product \\(AB\\) is computed column-by-column: column \\(j\\) of \\(AB\\) is \\(A\\) applied to column \\(j\\) of \\(B\\). Same rule as before — columns are destinations. You are asking "where does \\(B\\) send each basis vector, and then where does \\(A\\) send *that*?"`,
          },
          {
            kind: 'math',
            heading: 'Determinant — how much area gets stretched',
            body: `The **determinant** of a square matrix \\(M\\), written \\(\\det M\\), is a single number that answers one question: how much does \\(M\\) scale area (in 2D) or volume (in 3D and up)?

For the 2-by-2 matrix

\\[
M = \\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}, \\qquad \\det M = ad - bc
\\]

The geometric content: the unit square spanned by \\(\\hat{\\imath}\\) and \\(\\hat{\\jmath}\\) has area 1. After applying \\(M\\), it becomes the parallelogram spanned by the two columns of \\(M\\). The area of that parallelogram is \\(|\\det M|\\). Every other shape in the plane has its area multiplied by the same factor — that is why the determinant is one number, not a function of the shape.

The sign matters too. \\(\\det M > 0\\) means orientation is preserved (counter-clockwise stays counter-clockwise). \\(\\det M < 0\\) means orientation is flipped — the transformation includes a reflection.

And the punchline: **\\(\\det M = 0\\) means the matrix is singular.** It collapses the input space into something lower-dimensional — a 2D square gets squashed onto a line, a 3D cube gets squashed onto a plane. Information is lost; the transformation cannot be undone. There is no inverse. Singular matrices show up in ML when features are perfectly correlated, when a covariance estimate is rank-deficient, or when a layer's weights collapse during a degenerate training run — all symptoms of "your input had less independent information than you thought."`,
          },
          {
            kind: 'code',
            language: 'python',
            heading: 'Matrices in NumPy',
            body: `import numpy as np

# a 2x3 matrix — sends 3D vectors to 2D
M = np.array([[2, -1, 0],
              [0,  3, 1]])

x = np.array([1, 1, 1])

# matrix-vector product — three equivalent spellings
print(M @ x)            # [1 4]
print(M.dot(x))         # [1 4]
print(np.dot(M, x))     # [1 4]

# columns of M are where the input basis vectors land
print(M[:, 0])          # [2 0]  — image of [1,0,0]
print(M[:, 1])          # [-1 3] — image of [0,1,0]
print(M[:, 2])          # [0 1]  — image of [0,0,1]

# transpose — swap rows and columns, turns m-by-n into n-by-m
print(M.T.shape)        # (3, 2)

# identity — the no-op
I = np.eye(3)
print(I @ x)            # [1 1 1]  — same as x

# composition — apply B then A
A = np.array([[0, -1], [1, 0]])    # 90 degree rotation
B = np.array([[2,  0], [0, 1]])    # stretch x by 2
print(A @ B)            # rotate-after-stretch
print(B @ A)            # stretch-after-rotate  — different matrix

# determinant — area scale factor (with sign)
print(np.linalg.det(A))         # 1.0   — pure rotation, area preserved
print(np.linalg.det(B))         # 2.0   — doubles area
print(np.linalg.det(A @ B))     # 2.0   — products multiply: det(AB) = det(A)*det(B)

# a singular matrix — columns are linearly dependent, area collapses to 0
S = np.array([[1, 2], [2, 4]])
print(np.linalg.det(S))         # 0.0`,
          },
          {
            kind: 'callout',
            tone: 'tip',
            body: `**NumPy broadcasting saves you transpose-juggling.** When you compute M @ x for a single vector, NumPy treats x as a column. When x is a batch — shape (batch, n) — the conventional ML idiom is x @ M.T, which gives back (batch, m). That is why almost every PyTorch nn.Linear internally stores weights as (out_features, in_features) and applies x @ W.T + b: it lines up with the broadcasting rules so a single matmul handles any batch shape.`,
          },
          {
            kind: 'callout',
            tone: 'note',
            body: `**Row-major vs column-major.** NumPy and PyTorch store arrays in **row-major** order by default — consecutive elements of a row sit next to each other in memory. Fortran, MATLAB, and most BLAS routines underneath are **column-major**. That is why .T is free in NumPy (just a stride trick, no copy) but a real matmul on a transposed array can be slower than on a contiguous one. When a kernel is "mysteriously slow," check whether you are reading down a column of a row-major array — every access jumps a full row stride in RAM.`,
          },
          {
            kind: 'prose',
            heading: 'What to take away',
            body: `A matrix is a linear function. Its columns are the destinations of the input basis vectors, so reading a matrix means reading its columns. Matrix-vector multiplication is a linear combination of those columns, weighted by the input. The identity matrix is the no-op; matrix multiplication is function composition, applied right-to-left, and is not commutative. The determinant is a single number that tells you how much the transformation scales area, with a sign for orientation — and a determinant of zero means the matrix collapses dimensions and cannot be inverted.

Every neural-net layer, every PCA decomposition, every rotation in a graphics pipeline, every step of a Markov chain — all of them are this same object, the matrix, dressed for different occasions. The next lessons stack more structure on top: eigenvalues (the directions a matrix only stretches), gradients (the matrix of partial derivatives), and the singular value decomposition (any matrix as rotation-stretch-rotation). The grid stays the same; the questions you ask it get sharper.`,
          },
          {
            kind: 'prose',
            heading: 'Intuition: why a grid of numbers is the right object',
            body: `The deepest intuition for a matrix is that it is the **complete description of a linear map**, written in coordinates. Linearity is a strong constraint: a function \\(f\\) on a vector space is linear when \\(f(\\alpha x + \\beta y) = \\alpha f(x) + \\beta f(y)\\) for every scalar pair and every input pair. That single rule is so restrictive that knowing \\(f\\) on the basis vectors pins down \\(f\\) on every input. Two destinations in 2D, three in 3D, \\(n\\) in \\(n\\)-dimensional space — that is all the data a linear map has. A matrix stacks those destinations into columns and hands the result back as a grid, not because the grid is the natural shape but because storing destinations as columns lets matrix-vector multiplication mechanically reproduce the rule \\(f(x) = \\sum_i x_i f(e_i)\\).

That perspective explains why almost every linear operation in ML factors through matrices. A neural-net layer mixes input features with fixed weights — that mixing is linear, so the weights pack into a matrix. A rotation, a reflection, a shear, a scaling, a projection onto a subspace — all linear, all matrices. A change of coordinates in PCA is a linear map from the standard basis to a basis of principal axes — again a matrix. Even the gradient of a vector-valued function, the Jacobian, is the matrix of all first-order partial derivatives because the local behaviour of a smooth function is linear and a matrix is exactly what a linear thing wants to be.

What a matrix is **not**: a list of numbers with no structure. The shape \\((m, n)\\) carries the type of the function — it eats \\(n\\)-vectors and spits out \\(m\\)-vectors. The columns carry the geometry. The rows carry the dot products that produce each output coordinate. Reading any matrix is reading those three layers at once: type signature on the outside, columns for "where does the input space go," rows for "what does each output measure."`,
          },
          {
            kind: 'prose',
            heading: 'Worked: a singular matrix collapses the plane onto a line',
            body: `Take the matrix
\\[
S = \\begin{bmatrix} 1 & 2 \\\\ 2 & 4 \\end{bmatrix}.
\\]
The plan: read its columns, compute its determinant, apply it to two different inputs, and watch the 2D plane fall onto a single line.

**Step 1 — read the columns.** Column 1 is \\((1, 2)\\) — that is where \\(\\hat{\\imath}\\) lands. Column 2 is \\((2, 4)\\) — that is where \\(\\hat{\\jmath}\\) lands. Notice column 2 is exactly twice column 1. The two destinations point in the same direction, just at different lengths. The new basis vectors are not independent.

**Step 2 — confirm with the determinant.** Using \\(ad - bc\\): \\(\\det S = 1 \\cdot 4 - 2 \\cdot 2 = 4 - 4 = 0\\). The parallelogram spanned by the columns has zero area. \\(S\\) is singular — no inverse exists, and the warp it performs squashes the plane.

**Step 3 — apply \\(S\\) to two genuinely different inputs and see where they land.** Take \\(u = (1, 0)\\) and \\(v = (0, 1)\\) first — the standard basis. \\(Su = (1, 2)\\) and \\(Sv = (2, 4)\\). Both outputs live on the line through the origin with direction \\((1, 2)\\): the second is the first scaled by 2. Now try a third input, \\(w = (3, -1)\\). Decompose: \\(w = 3\\hat{\\imath} - \\hat{\\jmath}\\). So \\(Sw = 3 \\cdot (1, 2) - 1 \\cdot (2, 4) = (3 - 2, 6 - 4) = (1, 2)\\). A fourth input, \\(z = (5, 5)\\), lands at \\(5 \\cdot (1, 2) + 5 \\cdot (2, 4) = (5 + 10, 10 + 20) = (15, 30)\\) — still on the line \\(y = 2x\\).

**The takeaway.** Every input, regardless of where it started in the plane, lands somewhere on the single line spanned by \\((1, 2)\\). Two dimensions of input collapse into one dimension of output. That collapse is why \\(S\\) cannot be inverted: many inputs map to the same output, so there is no rule that recovers the original. Singular matrices are the formal way to say "this transformation throws information away," and they show up in ML whenever features are perfectly correlated, a covariance estimate has fewer effective samples than dimensions, or a layer's weight matrix has rank-deficiency from a bad initialisation.`,
          },
          {
            kind: 'prose',
            heading: 'Further reading',
            body: `- [3Blue1Brown — "Linear transformations and matrices"](https://www.youtube.com/watch?v=kYB8IZa5AuE) — the chapter that makes "columns are where the basis lands" feel obvious.
- [3Blue1Brown — "Matrix multiplication as composition"](https://www.youtube.com/watch?v=XkY2DOUCWMU) — why matmul reads right-to-left and is not commutative.
- [Khan Academy — Matrices](https://www.khanacademy.org/math/precalculus/x9e81a4f98389efdf:matrices) — the drill set: row reduction, multiplication, inverses, determinants.`,
          },
        ],
      },
      {
        slug: 'pca',
        title: 'PCA',
        oneLiner: 'Find the directions data varies along most. Project onto them.',
        difficulty: 'intermediate',
        readMinutes: 10,
        sections: [
          {
            kind: 'prose',
            heading: 'The compression problem',
            body: `You have a dataset: \\(n\\) points in \\(d\\)-dimensional space. Maybe \\(d\\) is 784 (a flattened MNIST image), maybe 50,000 (a sparse bag-of-words document), maybe a few hundred (gene-expression levels for one patient). The points are not scattered uniformly — they cluster along certain directions and barely move along others. **Principal Component Analysis** is the algorithm that finds those directions and lets you throw away the ones that do not matter.

The geometric setup is identical to the matrices lesson: every data point is a vector, and "directions" are unit vectors. The question PCA asks is: among all unit vectors in \\(\\mathbb{R}^d\\), which one captures the most spread of my data when I project onto it? Then, which one is next-most-informative after that, perpendicular to the first? Keep going for \\(k\\) directions and you have a \\(k\\)-dimensional summary of a \\(d\\)-dimensional cloud.

This is not just compression for storage. PCA is denoising (low-variance directions are usually noise), visualization (project 1000-dimensional embeddings down to 2D and plot), preprocessing (decorrelated features train faster), and a sanity check (if the top two components capture 95% of the variance, your "high-dimensional" data was secretly 2D all along).`,
          },
          {
            kind: 'prose',
            heading: 'PCA finds the natural axes of a cloud',
            body: `Picture a thousand points scattered across a 2D plane in an ellipsoidal blob, tilted at thirty degrees from horizontal. The points are not aligned with the \\(x\\)-axis or the \\(y\\)-axis — they spread along a diagonal line. Ask a stranger to draw "the axes of this cloud" and they will draw a long arrow along the tilt and a short arrow perpendicular to it. They will not draw \\(x\\) and \\(y\\). The natural coordinate system for the cloud is not the one the dataset arrived in. It is the one the points themselves define.

That long arrow is **principal component 1**, the direction of maximum variance. Walk a step along it and the cloud spreads out a lot; walk a step along the short arrow and it barely moves. The short arrow is **principal component 2**, the direction of next-most variance, constrained to be perpendicular to the first. In two dimensions there are only two principal components and the picture stops there. In ten dimensions there are ten, ordered from most to least informative. In ten thousand dimensions there are ten thousand, and almost all of them carry no signal.

The whole machinery of PCA is the rotation that turns the dataset's arbitrary feature axes into the cloud's own natural axes. Eigendecomposing the covariance matrix is what does the rotation. The eigenvectors *are* the natural axes; the eigenvalues *are* the variance along each axis. Largest eigenvalue, longest arrow.

The deep payoff comes in high dimensions. A blob of points in \\(\\mathbb{R}^{100}\\) might be effectively a thin pancake — wide along two directions, paper-thin along the other ninety-eight. PCA tells you the pancake is essentially two-dimensional and hands you the exact 2D plane it lives in. Project the points onto that plane and you have lost almost nothing. The "hundred-dimensional dataset" was secretly a 2D one wearing a costume of irrelevant coordinates, and PCA undressed it.`,
          },
          {
            kind: 'prose',
            heading: 'Worked: PCA on a tiny 4-point dataset',
            body: `Take the smallest dataset that still has correlation: four points along the line \\(y = x\\), namely \\((1, 1), (2, 2), (3, 3), (4, 4)\\). The cloud is a perfectly straight line at 45 degrees. Intuition says principal component 1 should point along that line and principal component 2 should be perpendicular and carry zero variance. Work it out.

**Step 1: center.** The feature means are \\(\\bar{x} = 2.5\\) and \\(\\bar{y} = 2.5\\). Subtract them and the centered points are \\((-1.5, -1.5), (-0.5, -0.5), (0.5, 0.5), (1.5, 1.5)\\).

**Step 2: form the covariance matrix.** With \\(n = 4\\) points and using the unbiased divisor \\(n - 1 = 3\\):

\\[
s_{xx} = \\tfrac{(-1.5)^2 + (-0.5)^2 + (0.5)^2 + (1.5)^2}{3} = \\tfrac{2.25 + 0.25 + 0.25 + 2.25}{3} = \\tfrac{5}{3} \\approx 1.667
\\]

\\(s_{yy}\\) is identical (the \\(y\\)-coordinates are equal to the \\(x\\)-coordinates) and \\(s_{xy}\\) is the same sum because every \\(x_i = y_i\\). So

\\[
\\Sigma = \\begin{bmatrix} 1.667 & 1.667 \\\\ 1.667 & 1.667 \\end{bmatrix}.
\\]

**Step 3: eigenvalues.** Trace is \\(3.333\\), determinant is \\(1.667^2 - 1.667^2 = 0\\). For a 2x2 matrix the eigenvalues are \\(\\lambda = \\tfrac{\\text{trace}}{2} \\pm \\sqrt{(\\text{trace}/2)^2 - \\det}\\), giving \\(\\lambda_1 = 3.333\\) and \\(\\lambda_2 = 0\\). The second eigenvalue is exactly zero because the points are perfectly correlated — there is no spread perpendicular to the diagonal.

**Step 4: eigenvector for \\(\\lambda_1\\).** Solve \\((\\Sigma - 3.333 I)v = 0\\), which collapses to \\(v_x = v_y\\). Normalised, the eigenvector is \\(v_1 = (1/\\sqrt{2}, 1/\\sqrt{2})\\) — the 45-degree direction. Exactly what the picture predicted. The explained variance ratio for the first component is \\(\\lambda_1 / (\\lambda_1 + \\lambda_2) = 1.0\\). One component captures every bit of the spread, because the data really was one-dimensional.`,
          },
          {
            kind: 'prose',
            heading: 'Why PCA = SVD',
            body: `Eigendecomposing \\(\\Sigma = X^\\top X / n\\) is the textbook derivation, but the textbook is not what your library runs. Production PCA goes through the **Singular Value Decomposition** of the centered data matrix directly:

\\[
X = U \\Sigma V^\\top
\\]

where \\(U\\) has orthonormal columns, \\(\\Sigma\\) (overloaded notation — here the diagonal singular-value matrix, not the covariance) holds the nonnegative singular values \\(s_1 \\geq s_2 \\geq \\cdots\\), and \\(V\\) is orthogonal. The crucial identity is that the columns of \\(V\\) are exactly the eigenvectors of \\(X^\\top X / n\\) — the principal components — and the singular values relate to the covariance eigenvalues by \\(\\lambda_i = s_i^2 / n\\). One decomposition, two interpretations.

Why every numerical library prefers SVD: forming \\(X^\\top X\\) explicitly squares the condition number of \\(X\\). If your data matrix is even slightly ill-conditioned — near-duplicate features, near-linear dependencies, the usual mess of real tabular data — that squaring turns small numerical noise in \\(X\\) into large numerical noise in \\(\\Sigma\\), and the eigensolver lies to you. SVD works on \\(X\\) directly, never forms the product, and stays stable down to the floating-point limit.

The same identity \\(X = U \\Sigma V^\\top\\) shows up in three other places under different names. **Truncated SVD** in numerical linear algebra is the low-rank approximation \\(X \\approx U_k \\Sigma_k V_k^\\top\\). **Latent Semantic Analysis** in NLP is truncated SVD of a term-document matrix. **Matrix factorization** in recommender systems is truncated SVD of a user-item matrix. Three communities, three names, one decomposition — and PCA is the statistical sibling sitting in the middle.`,
          },
          {
            kind: 'prose',
            heading: 'Center first, or you measure the wrong thing',
            body: `PCA assumes your data is **centered** — the mean of every feature is zero. If it is not, you do that yourself before anything else: \\(X \\leftarrow X - \\bar{X}\\), where \\(\\bar{X}\\) is the row-wise mean. Skip this step and the first principal component will point at the centroid rather than along the spread, which is a popular way to get garbage out of an otherwise correct pipeline.

Optionally — and almost always when features live on different scales — you also **standardise**: divide each feature by its standard deviation so every column has unit variance. Without this, a feature measured in millimetres dominates a feature measured in kilometres for purely numerical reasons. Standardised PCA is what scikit-learn's \`StandardScaler\` + \`PCA\` chain gives you, and it is the safer default for tabular data with mixed units. For pixels or word counts where every feature is already on the same scale, centering alone is fine.`,
          },
          {
            kind: 'math',
            heading: 'The covariance matrix',
            body: `Once \\(X\\) is centered, the **covariance matrix** is

\\[
\\Sigma = \\tfrac{1}{n} X^\\top X
\\]

where \\(X\\) is the \\(n \\times d\\) data matrix (one row per point, one column per feature). \\(\\Sigma\\) is \\(d \\times d\\), symmetric, and positive semi-definite. Entry \\(\\Sigma_{ij}\\) is the covariance between feature \\(i\\) and feature \\(j\\) — positive if they tend to move together, negative if one rises while the other falls, zero if they are uncorrelated. The diagonal entries are the variances of the individual features.

The matrix encodes the entire second-order shape of the data cloud. If you imagine the cloud as an ellipsoid, \\(\\Sigma\\) is exactly the matrix whose eigenvectors are the axes of that ellipsoid and whose eigenvalues are the squared lengths of those axes. PCA is, literally, finding the principal axes of the data ellipsoid.`,
          },
          {
            kind: 'prose',
            heading: 'Eigenvectors as axes of variance',
            body: `For a symmetric matrix like \\(\\Sigma\\), the spectral theorem guarantees \\(d\\) real eigenvalues \\(\\lambda_1 \\geq \\lambda_2 \\geq \\cdots \\geq \\lambda_d \\geq 0\\) and a set of mutually orthogonal unit eigenvectors \\(v_1, v_2, \\ldots, v_d\\). The interpretation is everything:

- \\(v_1\\) is the direction along which the data has the **most variance** — the long axis of the cloud. The variance along that direction is exactly \\(\\lambda_1\\).
- \\(v_2\\) is the direction of next-most variance, *constrained to be perpendicular to* \\(v_1\\). Variance along it is \\(\\lambda_2\\).
- And so on, down to \\(v_d\\), the direction the data barely varies along — often pure noise.

These eigenvectors are the **principal components**. Sorting eigenvalues by magnitude gives you the natural ordering: keep the top \\(k\\), throw away the rest, and you have kept \\(\\sum_{i \\leq k} \\lambda_i / \\sum_i \\lambda_i\\) of the total variance. That ratio is the **explained variance ratio** and is the standard knob for deciding how many components to keep — usually you pick the smallest \\(k\\) that retains 90% or 95%.`,
          },
          {
            kind: 'viz',
            component: 'MatrixTransform',
            props: {},
            heading: 'The eigenvectors of a covariance matrix are the axes its cloud stretches along. Drag the entries to see the principal directions move.',
          },
          {
            kind: 'viz',
            heading: 'Projection onto the top-k directions',
            component: 'PCAProjectionViz',
            props: {},
          },
          {
            kind: 'math',
            heading: 'Projection: from x to its k-dimensional score',
            body: `Once you have the top \\(k\\) eigenvectors, stack them as the columns of a \\(d \\times k\\) matrix \\(V_k = [v_1 \\; v_2 \\; \\cdots \\; v_k]\\). For any centered point \\(x \\in \\mathbb{R}^d\\), the **projection** (the "score" vector) is

\\[
z = V_k^\\top x \\in \\mathbb{R}^k
\\]

This is just \\(k\\) dot products — the \\(i\\)-th coordinate of \\(z\\) is how far along \\(v_i\\) the point \\(x\\) sits. To go back, the **reconstruction** is

\\[
\\hat{x} = V_k z = V_k V_k^\\top x
\\]

\\(\\hat{x}\\) lives in \\(\\mathbb{R}^d\\) again, but is constrained to the \\(k\\)-dimensional subspace spanned by the top eigenvectors. The reconstruction error \\(\\|x - \\hat{x}\\|^2\\) is, on average, \\(\\sum_{i > k} \\lambda_i\\) — the variance you threw away. That single number tells you whether the truncation was honest or destructive.`,
          },
          {
            kind: 'prose',
            heading: 'SVD: the other route to the same answer',
            body: `In practice nobody forms \\(\\Sigma = X^\\top X / n\\) and runs an eigensolver on it. They compute the **Singular Value Decomposition** of \\(X\\) directly:

\\[
X = U S V^\\top
\\]

where \\(U\\) is \\(n \\times d\\) with orthonormal columns, \\(S\\) is a \\(d \\times d\\) diagonal matrix of nonnegative **singular values** \\(s_1 \\geq s_2 \\geq \\cdots\\), and \\(V\\) is \\(d \\times d\\) orthogonal. The columns of \\(V\\) are *the same principal components* you would have gotten from eigendecomposing \\(\\Sigma\\), and the singular values relate to the eigenvalues by \\(\\lambda_i = s_i^2 / n\\).

Why SVD is the default: forming \\(X^\\top X\\) squares the condition number of \\(X\\), so any near-singularity in the data gets amplified into numerical noise in \\(\\Sigma\\). SVD works on \\(X\\) directly and is far more stable for ill-conditioned or near-low-rank matrices — which describes most real-world feature matrices. \`sklearn.decomposition.PCA\` and \`numpy.linalg.svd\` both go this route under the hood.`,
          },
          {
            kind: 'code',
            language: 'python',
            heading: 'PCA two ways: sklearn and manual via numpy',
            body: `import numpy as np
from sklearn.decomposition import PCA

rng = np.random.default_rng(0)

# 200 points in 5D, but really living on a 2D plane plus noise
true_axes = rng.normal(size=(2, 5))
scores    = rng.normal(size=(200, 2)) * np.array([5.0, 1.5])
noise     = rng.normal(size=(200, 5)) * 0.1
X = scores @ true_axes + noise

# ---- sklearn path ----
pca = PCA(n_components=2)
Z   = pca.fit_transform(X)              # (200, 2)  — projected scores
print(pca.explained_variance_ratio_)    # roughly [0.93, 0.07]
print(Z.shape)                           # (200, 2)

# ---- manual path via numpy ----
Xc = X - X.mean(axis=0)                 # center
cov = (Xc.T @ Xc) / Xc.shape[0]          # 5x5 covariance
vals, vecs = np.linalg.eigh(cov)         # eigh: symmetric, returns ascending
order = np.argsort(vals)[::-1]           # sort descending
vals, vecs = vals[order], vecs[:, order]

V_k = vecs[:, :2]                        # top 2 principal components
Z_manual = Xc @ V_k                      # (200, 2) projections

ratio = vals[:2].sum() / vals.sum()
print(f"explained: {ratio:.3f}")         # ~0.93

# ---- SVD path (what sklearn actually uses) ----
U, S, Vt = np.linalg.svd(Xc, full_matrices=False)
Z_svd = U[:, :2] * S[:2]                 # equivalent up to column signs
print(np.allclose(np.abs(Z_svd), np.abs(Z_manual)))  # True

# reconstruction error — what we lose by keeping only 2 components
X_hat = Z_manual @ V_k.T + X.mean(axis=0)
print(f"recon MSE: {((X - X_hat) ** 2).mean():.4f}")`,
          },
          {
            kind: 'callout',
            tone: 'tip',
            body: `**Center your data before PCA, every time.** Forgetting to subtract the mean is the single most common PCA bug. The "first principal component" you get back will point from the origin to the data centroid and the next components will be wrong by an amount that depends on how far the data was from zero. \`sklearn.decomposition.PCA\` centers for you internally; if you write the math by hand, do it yourself or check that your input is already centered.`,
          },
          {
            kind: 'callout',
            tone: 'note',
            body: `**PCA is linear; t-SNE and UMAP are not.** If your data sits on a curved manifold — a Swiss roll, a sphere, anything where "close in the high-D space" does not mean "close in a flat low-D summary" — PCA will flatten it badly. t-SNE and UMAP optimize a non-linear embedding that preserves local neighborhoods at the cost of global distances; they make better visualizations of cluster structure but their axes have no meaning. Use PCA when you want interpretable linear directions and explained-variance guarantees; reach for t-SNE or UMAP when you only need a pretty 2D scatter.`,
          },
          {
            kind: 'prose',
            heading: 'What to take away',
            body: `PCA is the eigendecomposition of the covariance matrix, ordered by eigenvalue. The top \\(k\\) eigenvectors are the directions of greatest variance; projecting onto them gives the \\(k\\)-dimensional summary, and the ratio of kept eigenvalues to total is the explained variance you preserved. SVD is the numerically stable route to the same answer and is what every production library actually runs.

Two non-negotiables: center the data first, and remember PCA is linear — it cannot uncurl a manifold. For interpretable axes and a known-good compression, PCA is the right tool. For visualizing clusters in genuinely non-linear data, you want t-SNE or UMAP, and you accept that the axes mean nothing. The next lessons turn the same machinery — eigenvectors of a structured matrix — toward different ends: spectral clustering, kernel PCA, and the low-rank approximations that power recommender systems and modern LoRA fine-tuning.`,
          },
          {
            kind: 'prose',
            heading: 'Geometric intuition: PCA as rotation into the data’s own basis',
            body: `Strip every formula and PCA reduces to a single move: rotate the coordinate system until the axes line up with the directions the data actually cares about. Picture a tilted ellipsoidal cloud sitting in three-dimensional feature space. The original axes — the \\(x\\), \\(y\\), \\(z\\) the dataset arrived in — are a piece of bureaucratic furniture. They were chosen by whoever picked the sensors, not by the cloud. The cloud has its own native frame: one axis along the long stretch, one along the second-longest, one along the thinnest. PCA finds that native frame and hands it back to you as a rotation matrix \\(V\\). Multiply your data by \\(V^\\top\\) and the cloud now sits with its long axis on the new \\(x\\), the next-longest on the new \\(y\\), the thinnest on the new \\(z\\). Nothing has been compressed yet — the rotation is exact, lossless, undoable by applying \\(V\\). What changed is that the variance is now sorted: the new \\(x\\) carries \\(\\lambda_1\\) of it, the new \\(y\\) carries \\(\\lambda_2\\), the new \\(z\\) carries \\(\\lambda_3\\), with \\(\\lambda_1 \\geq \\lambda_2 \\geq \\lambda_3\\). The eigendecomposition is the rotation; the eigenvalues are the variance budget along each new axis.

Compression is what happens next, and it has a sharp geometric reading too. After the rotation, dropping the third coordinate is the same as projecting the cloud onto its widest 2D plane. The points slide down onto a flat sheet, losing exactly the variance \\(\\lambda_3\\) that was sitting along the thinnest direction. If \\(\\lambda_3\\) was tiny compared to \\(\\lambda_1 + \\lambda_2\\), the projection barely moved any point — the squashing is honest because there was nothing to squash. If \\(\\lambda_3\\) was comparable, the projection collapsed real signal and you lied about the shape of the cloud. The explained-variance ratio \\((\\lambda_1 + \\lambda_2) / (\\lambda_1 + \\lambda_2 + \\lambda_3)\\) is the fraction of the cloud you kept. This is the only thing PCA is doing in any dimension: rotate to expose the variance ordering, then optionally truncate along the directions that carry the least.`,
          },
          {
            kind: 'prose',
            heading: 'Worked: PCA on a 3-point 3D dataset',
            body: `Drop the abstraction and run the smallest 3D example that still has structure. Take three points in \\(\\mathbb{R}^3\\): \\((1, 2, 1)\\), \\((3, 4, 2)\\), \\((5, 6, 3)\\). The points sit on a perfectly straight line — each step adds \\((2, 2, 1)\\). Intuition says the first principal component should point along \\((2, 2, 1)/\\sqrt{9} = (2/3, 2/3, 1/3)\\) and the remaining eigenvalues should be exactly zero. Verify it.

**Step 1 — centre.** The feature means are \\(\\bar{x} = 3\\), \\(\\bar{y} = 4\\), \\(\\bar{z} = 2\\). Subtract: the centred points are \\((-2, -2, -1)\\), \\((0, 0, 0)\\), \\((2, 2, 1)\\). The middle point sits at the origin, which is exactly how centring should land any point that was the dataset mean.

**Step 2 — covariance matrix.** With \\(n = 3\\) and the biased divisor \\(n\\) (the MLE estimate), each entry is \\(\\Sigma_{ij} = \\tfrac{1}{3} \\sum_k x_k^{(i)} x_k^{(j)}\\) over centred coordinates. Compute the six unique entries:
\\[
\\Sigma_{xx} = \\tfrac{1}{3}(4 + 0 + 4) = \\tfrac{8}{3}, \\quad \\Sigma_{yy} = \\tfrac{8}{3}, \\quad \\Sigma_{zz} = \\tfrac{1}{3}(1 + 0 + 1) = \\tfrac{2}{3}
\\]
\\[
\\Sigma_{xy} = \\tfrac{1}{3}(4 + 0 + 4) = \\tfrac{8}{3}, \\quad \\Sigma_{xz} = \\tfrac{1}{3}(2 + 0 + 2) = \\tfrac{4}{3}, \\quad \\Sigma_{yz} = \\tfrac{4}{3}
\\]
The covariance matrix is therefore
\\[
\\Sigma = \\tfrac{1}{3} \\begin{bmatrix} 8 & 8 & 4 \\\\ 8 & 8 & 4 \\\\ 4 & 4 & 2 \\end{bmatrix}.
\\]

**Step 3 — inspect the rank.** Every row of \\(\\Sigma\\) is a multiple of \\((2, 2, 1)\\): row 1 is \\(\\tfrac{4}{3}(2, 2, 1)\\), row 2 is \\(\\tfrac{4}{3}(2, 2, 1)\\), row 3 is \\(\\tfrac{2}{3}(2, 2, 1)\\). A matrix whose rows are scalar multiples of one vector has rank one, so two of its three eigenvalues must be exactly zero. The trace is \\(\\tfrac{8}{3} + \\tfrac{8}{3} + \\tfrac{2}{3} = 6\\), and for a symmetric matrix the trace equals the sum of eigenvalues. With two zeros, the third eigenvalue is \\(\\lambda_1 = 6\\).

**Step 4 — the leading eigenvector.** Solve \\(\\Sigma v = 6 v\\). Try the guess \\(v = (2, 2, 1)\\). Multiply: \\(\\Sigma v = \\tfrac{1}{3}(16 + 16 + 4, 16 + 16 + 4, 8 + 8 + 2) = \\tfrac{1}{3}(36, 36, 18) = (12, 12, 6) = 6 \\cdot (2, 2, 1)\\). The guess is exact. Normalise: \\(\\|v\\| = \\sqrt{4 + 4 + 1} = 3\\), so the unit principal component is \\(v_1 = (2/3, 2/3, 1/3)\\). Exactly the direction the three points walk along, exactly as the geometry predicted.

**Step 5 — explained variance and projection scores.** The explained-variance ratio is \\(\\lambda_1 / (\\lambda_1 + \\lambda_2 + \\lambda_3) = 6 / 6 = 1.0\\). One component captures every bit of the spread. Project each centred point onto \\(v_1\\) to get its 1D score \\(z = v_1^\\top x\\): point one gives \\(z = -\\tfrac{4}{3} - \\tfrac{4}{3} - \\tfrac{1}{3} = -3\\), the middle point gives \\(z = 0\\), the third gives \\(z = +3\\). The original 3D dataset has collapsed to the 1D coordinates \\(\\{-3, 0, +3\\}\\) with zero reconstruction error. A "three-dimensional" dataset was secretly one-dimensional, and PCA undressed it in five arithmetic steps.`,
          },
          {
            kind: 'prose',
            heading: 'Further reading',
            body: `- [3Blue1Brown — "Eigenvectors and eigenvalues"](https://www.youtube.com/watch?v=PFDu9oVAE-g) — the geometric picture of the directions PCA actually keeps.
- [StatQuest — "Principal Component Analysis (PCA), Step-by-Step"](https://www.youtube.com/watch?v=FgakZw6K1QQ) — Josh Starmer walks through the algorithm end-to-end with a tiny worked example.
- [Khan Academy — Eigen-everything](https://www.khanacademy.org/math/linear-algebra/alternate-bases/eigen-everything/v/linear-algebra-introduction-to-eigenvalues-and-eigenvectors) — drill exercises for eigenvectors and eigenvalues.`,
          },
        ],
      },
      {
        slug: 'backprop',
        title: 'Backpropagation',
        oneLiner: 'The chain rule, applied automatically. The trick that made deep nets actually trainable.',
        difficulty: 'intermediate',
        readMinutes: 11,
        sections: [
          {
            kind: 'prose',
            heading: 'The problem backprop solves',
            body: `A modern neural net is a function with millions or billions of parameters, stitched together from matrix multiplies, nonlinearities, normalizations, and a final scalar loss. Training is gradient descent on that loss: every parameter needs its own partial derivative so you can nudge it the right way. The naive route — apply the limit definition of a derivative to every parameter, one perturbation at a time — costs you one full forward pass *per parameter*. At a billion parameters that is a billion forward passes per training step, which is impossible.

**Backpropagation** is the algorithm that computes every gradient in **one** backward pass that costs roughly the same as the forward pass. It is the reason deep learning is computationally feasible at all. The whole machinery comes from a single trick from first-year calculus — the **chain rule** — applied systematically over a graph of operations.

Everything you have built so far in this pillar plugs in here. Each layer multiplies its input by a weight matrix (the *Matrices* lesson), the forward pass evaluates a stack of those matrix-vector products plus elementwise nonlinearities, and the loss is a scalar reduction at the end. Backprop walks that graph backwards and hands every parameter the partial it needs for the next gradient-descent step.`,
          },
          {
            kind: 'prose',
            heading: 'The chain rule as a backward walk',
            body: `Strip the network down to the smallest object that still has two weights. Input \\(x\\) enters, gets multiplied by \\(w_1\\) to produce a hidden activation \\(a = w_1 x\\), then \\(a\\) gets multiplied by \\(w_2\\) to produce the output \\(y = w_2 a\\). The loss is mean-squared error against a target \\(t\\): \\(L = (y - t)^2\\). The forward pass reads left to right — \\(x \\to a \\to y \\to L\\) — and at the end you have a scalar.

The question backprop answers: how does \\(L\\) change when each weight wiggles? Start at the output and walk back. The derivative of the loss with respect to the prediction is \\(\\partial L / \\partial y = 2(y - t)\\). The output \\(y = w_2 a\\) depends on \\(w_2\\) linearly, so \\(\\partial y / \\partial w_2 = a\\). Multiply the two factors together along the path \\(L \\leftarrow y \\leftarrow w_2\\):

\\[
\\frac{\\partial L}{\\partial w_2} = \\frac{\\partial L}{\\partial y} \\cdot \\frac{\\partial y}{\\partial w_2} = 2(y - t) \\cdot a
\\]

For \\(w_1\\) the path is longer — \\(L \\leftarrow y \\leftarrow a \\leftarrow w_1\\) — so the chain has one more link. \\(y\\) depends on \\(a\\) through \\(\\partial y / \\partial a = w_2\\), and \\(a\\) depends on \\(w_1\\) through \\(\\partial a / \\partial w_1 = x\\). Stitch the four pieces together:

\\[
\\frac{\\partial L}{\\partial w_1} = \\frac{\\partial L}{\\partial y} \\cdot \\frac{\\partial y}{\\partial a} \\cdot \\frac{\\partial a}{\\partial w_1} = 2(y - t) \\cdot w_2 \\cdot x
\\]

That is the entire pattern. At every weight \\(w\\), the gradient is the product of two things: the gradient that has already been computed for the value flowing into this op (the **incoming gradient**), and the **local sensitivity** of this op's output to \\(w\\). "Backpropagation" is the name for the bookkeeping that propagates that incoming gradient backward through the network, multiplying by a local sensitivity at every step. The chain rule does the math; backprop does the walk.`,
          },
          {
            kind: 'prose',
            heading: 'Worked: tiny 2-layer net',
            body: `Concrete numbers make the mechanics obvious. Take the same two-weight network — \\(a = w_1 x\\), \\(y = w_2 a\\), \\(L = (y - t)^2\\) — and plug in \\(x = 2\\), \\(t = 1\\), \\(w_1 = 0.5\\), \\(w_2 = 0.5\\).

**Forward pass.** \\(a = w_1 x = 0.5 \\cdot 2 = 1\\). \\(y = w_2 a = 0.5 \\cdot 1 = 0.5\\). \\(L = (y - t)^2 = (0.5 - 1)^2 = 0.25\\). Cache \\(x = 2\\), \\(a = 1\\), \\(y = 0.5\\) — the backward pass needs all three.

**Backward pass.** Start at the loss and seed \\(\\partial L / \\partial L = 1\\). Walk back one edge at a time:

\\[
\\frac{\\partial L}{\\partial y} = 2(y - t) = 2(0.5 - 1) = -1
\\]

\\[
\\frac{\\partial y}{\\partial w_2} = a = 1 \\quad \\Rightarrow \\quad \\frac{\\partial L}{\\partial w_2} = -1 \\cdot 1 = -1
\\]

\\[
\\frac{\\partial y}{\\partial a} = w_2 = 0.5 \\quad \\Rightarrow \\quad \\frac{\\partial L}{\\partial a} = -1 \\cdot 0.5 = -0.5
\\]

\\[
\\frac{\\partial a}{\\partial w_1} = x = 2 \\quad \\Rightarrow \\quad \\frac{\\partial L}{\\partial w_1} = -0.5 \\cdot 2 = -1
\\]

Both gradients are negative, which says: increase both weights to decrease the loss. **Gradient-descent step** with learning rate \\(\\alpha = 0.1\\): \\(w_1 \\leftarrow 0.5 - 0.1 \\cdot (-1) = 0.6\\), \\(w_2 \\leftarrow 0.5 - 0.1 \\cdot (-1) = 0.6\\).

**Re-forward with the new weights.** \\(a = 0.6 \\cdot 2 = 1.2\\). \\(y = 0.6 \\cdot 1.2 = 0.72\\). \\(L = (0.72 - 1)^2 = 0.0784\\). The loss dropped from \\(0.25\\) to \\(0.0784\\) in a single step. The math works exactly as advertised — one forward pass, one backward pass, one update, and the prediction is measurably closer to the target. Every training loop in deep learning is this loop, scaled to billions of parameters.`,
          },
          {
            kind: 'prose',
            heading: 'Why we store activations',
            body: `Look at the chain-rule expressions from the worked example. \\(\\partial L / \\partial w_2 = (y - t) \\cdot a\\) — that "multiply by \\(a\\)" needs the actual numerical value of \\(a\\) from the forward pass. \\(\\partial L / \\partial w_1\\) has "multiply by \\(x\\)" — same story. Every local gradient that depends on the input or output of an op requires the cached value of that input or output. The backward pass cannot recompute these from scratch without redoing the whole forward pass, which would double training cost.

So the engine **stores activations**: at every op, the forward pass writes the values the backward pass will eventually consume into a buffer, and the buffer is held in memory until backward arrives. For a single tiny multiply that is one float. For a transformer it is every hidden state at every layer for every token in the batch.

The memory cost scales as roughly depth × layer-size × batch × sequence-length. For a 70B-parameter model with 80 layers, hidden dimension on the order of \\(10^4\\), an 8K-token sequence, and fp16 storage, activation memory alone can exceed 100 GB — often more than the parameters themselves. **Gradient checkpointing** exists for exactly this reason: drop most cached activations, recompute them on demand during backward, trade compute for memory.

The 3Blue1Brown observation is worth keeping. Backprop is mechanical once you accept the recursive chain-rule structure — multiply by the local derivative, ship the result upstream, repeat. The hard part of getting it to work in production is not the calculus; it is the bookkeeping of which activations to keep, when to free them, and how to fit a 100 GB working set into a 40 GB GPU. The concept is one line. The systems engineering is the rest.`,
          },
          {
            kind: 'math',
            heading: 'The chain rule, the entire idea on one line',
            body: `For a composition \\(z = f(y), \\; y = g(x)\\), the derivative of \\(z\\) with respect to \\(x\\) is

\\[
\\frac{dz}{dx} = \\frac{dz}{dy} \\cdot \\frac{dy}{dx}
\\]

That is it. Stack more layers and the rule extends by multiplication: \\(\\frac{dz}{dx} = \\frac{dz}{dw} \\cdot \\frac{dw}{dy} \\cdot \\frac{dy}{dx}\\). When the variables are vectors and the functions are matrix-valued the multiplications become **Jacobian-vector products**, but the structure is identical — a chain of local derivatives multiplied together end to end.

Backprop is the chain rule applied not to a single composition but to a whole *graph* of compositions, with one extra cleverness: instead of multiplying left-to-right (forward mode), it multiplies right-to-left (reverse mode). That single direction choice is what turns "one gradient per parameter" into "all gradients at once".`,
          },
          {
            kind: 'prose',
            heading: 'The computation graph: forward computes values, backward computes gradients',
            body: `Every program that a neural net runs can be written as a **directed acyclic graph** of elementary operations: add, multiply, exp, log, matmul, ReLU, softmax. Inputs flow in on the left, intermediate values get computed at each node, and a single scalar loss falls out on the right.

The **forward pass** evaluates the graph left to right: each node reads its inputs, applies its operation, writes its output, and **caches whatever it will need on the way back** (usually the inputs themselves, sometimes the output). At the end you have the loss value and a freezer full of cached intermediates.

The **backward pass** evaluates the graph right to left. It starts by seeding the gradient of the loss with respect to itself as 1.0, then walks each node in reverse topological order. At each node it reads the gradient flowing in from downstream (call it \`upstream_grad\`), multiplies by the node's **local Jacobian**, and routes the result to each input as that input's gradient contribution. Inputs with multiple consumers **accumulate** contributions by summing. By the time you reach the leaves, every parameter has its full \\(\\partial L / \\partial \\theta\\) sitting in its \`.grad\`.`,
          },
          {
            kind: 'viz',
            component: 'BackpropViz',
            props: {},
            heading: 'A tiny graph: y = (a+b)*c. Forward and back.',
          },
          {
            kind: 'viz',
            heading: 'Forward pass, then backward pass on the same graph',
            component: 'ForwardBackwardGraphViz',
            props: {},
          },
          {
            kind: 'math',
            heading: 'Local gradients are the only thing each op needs to know',
            body: `Every operation contributes one piece of information to backprop: its **local Jacobian** — the derivative of its output with respect to each of its inputs. Add knows \\(\\partial (a+b) / \\partial a = 1\\). Multiply knows \\(\\partial (a \\cdot b) / \\partial a = b\\) and \\(\\partial (a \\cdot b) / \\partial b = a\\). ReLU knows \\(\\partial \\max(0, x) / \\partial x = \\mathbb{1}[x > 0]\\). Matmul \\(y = Wx\\) knows \\(\\partial y / \\partial W = x^\\top\\) and \\(\\partial y / \\partial x = W^\\top\\) (the canonical Jacobians from the *Matrices* lesson).

The autograd engine combines them blindly. At every node it does

\\[
\\text{grad}_{\\text{input}_i} = \\text{grad}_{\\text{output}} \\cdot \\frac{\\partial \\text{output}}{\\partial \\text{input}_i}
\\]

then ships that gradient to the input's own producer. No node ever sees more than its own inputs, output, and the upstream gradient. The chain rule glues the local Jacobians into a global gradient as the engine walks the graph.`,
          },
          {
            kind: 'prose',
            heading: 'Reverse mode: O(1) cost per forward op',
            body: `The reason backprop is fast is the direction of multiplication. Consider a graph with \\(N\\) inputs and 1 output (a loss). The chain rule gives you a product of Jacobians; you can evaluate it in two orders.

**Forward mode** multiplies left-to-right: start from one input, push a perturbation forward through every operation, watch how it affects the loss. Cost: one pass per input, so \\(O(N)\\) passes total. Great when you have one input and many outputs.

**Reverse mode** multiplies right-to-left: start from the loss, pull the gradient back through every operation, watch how every input contributed. Cost: **one pass total**, regardless of \\(N\\). Each operation does roughly the same arithmetic on the way back as on the way forward — a constant-factor overhead per op, never a factor of \\(N\\).

Neural nets have millions of inputs (parameters) and one output (the loss), so reverse mode wins by a factor of "millions". That single asymmetry — many parameters, one scalar loss — is why every deep learning framework defaults to reverse-mode autodiff. The price you pay is memory: you have to cache intermediate forward values until the backward pass consumes them, which is why activation memory dominates training memory on large models.`,
          },
          {
            kind: 'code',
            language: 'python',
            heading: 'PyTorch autograd vs. the chain rule by hand',
            body: `import torch

# y = (a + b) * c, then L = y.
# The tiny graph BackpropViz drew above.

a = torch.tensor(2.0, requires_grad=True)
b = torch.tensor(3.0, requires_grad=True)
c = torch.tensor(4.0, requires_grad=True)

s = a + b            # forward: s = 5
y = s * c            # forward: y = 20
L = y                # forward: L = 20

L.backward()         # one reverse-mode pass over the whole graph

print(a.grad, b.grad, c.grad)   # tensor(4.) tensor(4.) tensor(5.)

# ----- Chain rule by hand, matching what autograd just did -----
# dL/dy = 1            (loss w.r.t. itself)
# dL/ds = dL/dy * c  = 1 * 4 = 4         (local grad of (*) w.r.t. s is c)
# dL/dc = dL/dy * s  = 1 * 5 = 5         (local grad of (*) w.r.t. c is s)
# dL/da = dL/ds * 1  = 4                 (local grad of (+) is 1)
# dL/db = dL/ds * 1  = 4
#
# Every number matches a.grad / b.grad / c.grad above.

# ----- A more realistic layer: y = ReLU(W x) -----
W = torch.randn(3, 2, requires_grad=True)
x = torch.randn(2)                      # not a parameter, no grad needed
y = torch.relu(W @ x)
loss = y.sum()

loss.backward()
print(W.grad.shape)                     # torch.Size([3, 2])  — one grad per weight
# By the chain rule with matmul + ReLU:
#   dloss/dW  =  diag(1[Wx > 0]) @ ones(3) outer x
# which is exactly what is sitting in W.grad. No manual calculus required.`,
          },
          {
            kind: 'callout',
            tone: 'tip',
            body: `**\`retain_graph=True\` when you need the graph more than once.** PyTorch frees the cached forward activations as soon as \`.backward()\` finishes — that is what keeps memory in check. If you call \`.backward()\` a second time on the same graph (multiple losses, higher-order gradients, debug inspection) it will error: "Trying to backward through the graph a second time". Pass \`loss.backward(retain_graph=True)\` on every call except the last to keep the cache alive. Use it sparingly: every retained graph is forward-activation memory you have not freed.`,
          },
          {
            kind: 'prose',
            heading: 'PyTorch and JAX: same idea, two flavors',
            body: `**PyTorch** builds the graph dynamically as your Python runs. Every tensor with \`requires_grad=True\` is a leaf; every op on such a tensor records a node into a tape. When you call \`.backward()\` on a scalar, the engine walks the tape in reverse, dispatches the registered backward function of each op, and writes gradients into every leaf's \`.grad\`. The graph is rebuilt on each forward pass, which makes control flow (Python \`if\`, loops with data-dependent termination) trivial — the engine only sees the operations that actually ran.

**JAX** does the same thing in spirit but separates tracing from execution. \`jax.grad(f)\` returns a new function that, when called, traces \`f\` with abstract values to produce a jaxpr (a static graph), then runs reverse-mode autodiff on that jaxpr. Because the graph is static once traced, JAX can JIT-compile it, fuse ops, and pipeline forward + backward into one optimized kernel. The trade-off is that data-dependent control flow needs primitives like \`jax.lax.cond\` and \`jax.lax.scan\` to be traceable.

Either way, your job as the user is the same: write the forward pass using framework ops, call \`grad\` or \`.backward()\`, and the engine handles every chain-rule multiplication for you.`,
          },
          {
            kind: 'callout',
            tone: 'note',
            body: `**\`.detach()\` and \`torch.no_grad()\` carve pieces out of the graph.** \`x.detach()\` returns a new tensor that shares storage with \`x\` but is treated as a leaf with no history — anything you compute from it has no backward edge to \`x\`. Use it when you want to use a value but stop gradient from flowing through it (target networks in RL, freezing the teacher in distillation, copying weights for an EMA). \`with torch.no_grad():\` disables graph construction for an entire block — every op inside runs without recording history, which is what you want during evaluation, inference, or any update step that should not contribute to training gradients. Both are correctness tools, not optimizations: forgetting them is how memory leaks and double-counted gradients sneak into a training loop.`,
          },
          {
            kind: 'prose',
            heading: 'Vanishing and exploding gradients',
            body: `Backprop multiplies local Jacobians along the path from the loss back to a parameter. If those Jacobians have spectral norm consistently less than 1, the product shrinks **exponentially** in depth and the gradient that finally reaches early layers is numerically zero — **vanishing gradients**. If they are consistently greater than 1, the product blows up and you get NaNs — **exploding gradients**. This is not a bug in backprop; it is a faithful report on the shape of the loss landscape under the current parameterization.

Three classic culprits, all in the *Matrices* lesson's vocabulary:

- **Saturating nonlinearities.** Sigmoid and tanh have derivatives in \\([0, 0.25]\\) and \\([0, 1]\\); stack 20 of them and the product is microscopic.
- **Poorly scaled weight matrices.** A matrix with spectral norm 1.1 multiplied through 50 layers gives a factor of \\(\\approx 117\\); norm 0.9 gives \\(\\approx 0.005\\).
- **Long recurrent unrolls.** RNNs share weights across time, so the same Jacobian appears once per timestep — the powers of a single matrix grow or shrink fast.

The fixes are by now standard: ReLU and GELU (non-saturating, derivative 0 or 1), careful weight initialization (Xavier, Kaiming) that keeps the per-layer Jacobian spectrum near 1, residual connections that add an identity path so the gradient has a length-1 shortcut backwards, layer/batch normalization that re-scales activations layer by layer, and gradient clipping for the exploding case. Each of these is downstream of one fact: backprop multiplies, and multiplication is unforgiving over depth.`,
          },
          {
            kind: 'prose',
            heading: 'Gradient checking: trust but verify',
            body: `When you implement a custom op or you suspect autograd is wrong (it almost never is, but your op definition might be), you check it numerically. The two-sided finite-difference estimate for any scalar function \\(f\\) is

\\[
\\frac{\\partial f}{\\partial x_i} \\approx \\frac{f(x + \\epsilon e_i) - f(x - \\epsilon e_i)}{2 \\epsilon}
\\]

with \\(\\epsilon\\) around \\(10^{-5}\\) to \\(10^{-7}\\) — small enough to be accurate, large enough that floating-point noise does not dominate (the *Floating point* lesson in the Numerical Methods pillar covers why). Run this perturbation per coordinate, compare against the autograd gradient, and demand agreement to roughly \\(10^{-5}\\) relative error.

This is exactly the comparison that makes backprop expensive in the naive setting and cheap in reverse mode: gradient checking is \\(O(N)\\) forward passes, the backward pass is \\(O(1)\\). You only ever use it to **validate** an implementation, never inside training. PyTorch ships \`torch.autograd.gradcheck\` to do this for you for any custom \`torch.autograd.Function\`. Failing a gradcheck means your backward function is wrong; passing it does not prove the rest of your pipeline is right, but it eliminates one of the most painful classes of silent bug.`,
          },
          {
            kind: 'code',
            language: 'python',
            heading: 'Numerical gradient check against autograd',
            body: `import torch

def f(x):
    # Some scalar function of a vector input
    return (x ** 2).sum() + torch.sin(x).sum()

x = torch.randn(5, dtype=torch.float64, requires_grad=True)

# Autograd gradient
y = f(x)
y.backward()
grad_autograd = x.grad.clone()

# Numerical gradient via central differences
eps = 1e-6
grad_numeric = torch.zeros_like(x)
for i in range(x.numel()):
    x_plus  = x.detach().clone(); x_plus[i]  += eps
    x_minus = x.detach().clone(); x_minus[i] -= eps
    grad_numeric[i] = (f(x_plus) - f(x_minus)) / (2 * eps)

rel_err = ((grad_autograd - grad_numeric).abs() /
           (grad_autograd.abs() + grad_numeric.abs() + 1e-12)).max()

print(f"max relative error: {rel_err.item():.2e}")   # ~ 1e-9 for float64
# A passing check is anything below ~1e-5. Use float64 for the check —
# float32 noise alone will give you ~1e-3 relative error and make this useless.`,
          },
          {
            kind: 'prose',
            heading: 'Why backprop works for any differentiable function',
            body: `Backprop is not specific to neural networks. It works on any function you can build out of elementary differentiable operations — physics simulators, rendering pipelines, optimization solvers, differentiable programming languages. The requirements are exactly two: every operation in your graph has a defined local Jacobian, and the graph is a DAG (no cycles). If those hold, reverse-mode autodiff will compute the gradient of any scalar output with respect to every input in one backward pass.

That generality is why "differentiable X" became a field. Differentiable rendering puts a renderer in the graph and back-propagates pixel loss into scene parameters. Differentiable physics back-propagates trajectory error into mass and friction. Implicit-layer methods (DEQs, neural ODEs) define the forward pass by a fixed point or an ODE solve, then use the implicit-function theorem to define a local Jacobian that autograd can chain. None of this needs new theory beyond the chain rule — every framework already has reverse-mode autodiff, and any new op just needs a forward and a backward function registered.

You are now at the boundary of this pillar. The next pillars use backprop as a black box: optimization (which gradients to step with), regularization (which loss to compute), attention (a particular graph structure that backprop handles like any other). Every one of them rests on this lesson — that the chain rule, applied to a graph, gives you every gradient you need for the price of one forward pass.`,
          },
          {
            kind: 'prose',
            heading: 'Further reading',
            body: `- [3Blue1Brown — "Backpropagation, intuitively"](https://www.youtube.com/watch?v=Ilg3gGewQ5U) — the picture of how each weight nudges the loss.
- [3Blue1Brown — "Backpropagation calculus"](https://www.youtube.com/watch?v=tIeHLnjs5U8) — the chain rule worked out step by step on a real net.
- [Andrej Karpathy — "Yes you should understand backprop"](https://karpathy.medium.com/yes-you-should-understand-backprop-e2f06eab496b) — vanishing gradients, dying ReLUs, and other traps you only see if you know the maths underneath.`,
          },
        ],
      },
      {
        slug: 'cross-entropy',
        title: 'Cross-entropy loss',
        oneLiner: 'The loss function classification models actually optimize. From information theory to softmax.',
        difficulty: 'intermediate',
        readMinutes: 10,
        sections: [
          {
            kind: 'prose',
            heading: 'Why classification needs its own loss',
            body: `Squared error is the natural loss for regression — predict a real number, measure how far off you are, square it, done. The moment the target is a *category* instead of a number, that story breaks. Mean-squared error on probabilities does train, technically, but it trains *badly*: the gradients vanish exactly where you need them strongest (when the model is confidently wrong), and the loss landscape develops flat plateaus that gradient descent crawls across for hundreds of epochs. The fix is not a tweak to MSE; it is a different loss altogether, derived from a different first principle.

That first principle is **information theory**. The right loss for a model that outputs a probability distribution \\(q\\) over classes, when the truth is a distribution \\(p\\), is the **cross-entropy** \\(H(p, q) = -\\sum_i p_i \\log q_i\\). This single quantity drops out of three different derivations — maximum likelihood, KL divergence, and information theory — and they all agree. It is also the one loss for which the gradient through a softmax output layer collapses to the cleanest expression in deep learning: \\(\\text{softmax}(z) - y\\). That clean gradient is what makes classification networks trainable.

Everything in this lesson cashes out that one paragraph. The vectors lesson built up the algebra of probability vectors; the floating point lesson explained why \\(\\log 0\\) is the most common NaN in machine learning; the dropout lesson described regularization on activations. Cross-entropy is regularization's natural target: a loss that *believes* the model outputs are probabilities, penalises overconfidence in the wrong direction, and rewards being calibrated.`,
          },
          {
            kind: 'prose',
            heading: 'Softmax inside CE: why exp(z) / Σ exp(z)',
            body: `Cross-entropy needs a probability vector to consume. Networks emit unbounded logits. The bridge is **softmax**:

\\[
\\sigma(z)_i = \\frac{e^{z_i}}{\\sum_j e^{z_j}}
\\]

Three properties are baked into that formula and you should be able to recite them on demand. First, every output is **strictly positive** because \\(e^x > 0\\) for any real \\(x\\) — no logit, however negative, can produce a zero probability. Second, the outputs **sum to exactly one** by construction; the denominator is the same partition function for every component, so dividing by it normalises the vector to the simplex. Third, the mapping is **monotonic** in each component: increasing \\(z_i\\) (holding the others fixed) strictly increases \\(\\sigma(z)_i\\). Order is preserved between logits and probabilities, so the argmax of the logit vector is also the argmax of the softmax.

The exponential is doing real work. It does not just push values into the positive orthant — it **magnifies differences**. Take \\(z = [1, 2, 3]\\). A naive normaliser like \\(z_i / \\sum_j z_j\\) would give \\([1/6, 2/6, 3/6] = [0.17, 0.33, 0.50]\\). Softmax gives \\([0.09, 0.24, 0.67]\\). The top class doubles its lead. A gap of \\(1\\) in logit space becomes a multiplicative factor of \\(e \\approx 2.718\\) in probability space, so confident logits map to confident probabilities and the network can express "I am sure" by widening the gap, not by stretching the values to extremes.

Why the exponential specifically and not some other positive normaliser? The honest answer is **cross-entropy**. The gradient \\(\\partial \\text{CE} / \\partial z_i = \\sigma_i - y_i\\) — a single line of NumPy, no Jacobian, no chain-rule landmines — only falls out because the loss takes \\(\\log\\) and softmax uses \\(\\exp\\). The \\(\\log\\) and the \\(\\exp\\) cancel inside the numerator and the denominator becomes \\(\\text{logsumexp}\\). Any other normaliser leaves messy factors in the gradient that vanish or explode at exactly the wrong moments. Softmax + CE is the one pair that gives a stable training signal at every confidence level, and that is why every classifier from logistic regression to GPT uses it.`,
          },
          {
            kind: 'prose',
            heading: 'Worked: temperature inside CE',
            body: `The same softmax formula picks up one extra knob in practice — a **temperature** \\(\\tau > 0\\) divided into the logits before the exponential:

\\[
\\sigma_\\tau(z)_i = \\frac{e^{z_i / \\tau}}{\\sum_j e^{z_j / \\tau}}
\\]

At \\(\\tau = 1\\) you recover the standard softmax. Run \\(z = [1, 2, 3]\\) through it and you get \\([0.09, 0.24, 0.67]\\) — the top class is favoured, but the other two retain meaningful mass. This is the regime cross-entropy training is calibrated for: probabilities that honestly reflect how separated the logits are.

Drop the temperature to \\(\\tau = 0.1\\) and the inputs are scaled up tenfold: \\(z / \\tau = [10, 20, 30]\\). The exponential of those numbers spans roughly nine orders of magnitude, so the softmax becomes \\([\\sim\\!0, \\sim\\!0, \\sim\\!1]\\) — effectively a hard argmax. This is the **greedy-decoding** regime: at inference time, drop the temperature toward zero and the model picks its top logit every step, with no diversity.

Push the temperature up to \\(\\tau = 10\\) and the scaled logits are \\([0.1, 0.2, 0.3]\\). The exponentials are now \\([1.11, 1.22, 1.35]\\), nearly equal. The softmax flattens out to roughly \\([0.30, 0.33, 0.37]\\) — almost uniform. The model still knows class 3 is its favourite, but the distribution is wide enough that **sampling** from it produces meaningful diversity.

The three regimes line up with three different use cases. Use \\(\\tau \\ll 1\\) when you want the model's single best answer (greedy decoding, deterministic output, lowest entropy). Use \\(\\tau \\gg 1\\) when you want exploration — a sampler that occasionally picks non-modal tokens for creative writing, or a temperature-annealed scheduler for reinforcement learning. Use \\(\\tau = 1\\) when you want the model's calibrated probabilities — what it was trained to produce, what loss functions and confidence intervals are defined against. Temperature is the one knob that bridges hard argmax and soft sampling without changing a single weight.`,
          },
          {
            kind: 'prose',
            heading: 'log-softmax inside CE: numerical stability',
            body: `Compute softmax naively on large logits and the implementation falls apart. A logit of \\(z = 1000\\) makes \\(e^z\\) overflow in fp32 (which tops out near \\(e^{88}\\)) and in fp16 (which tops out near \\(e^{11}\\)). The numerator and denominator both become \\(\\infty\\), the ratio is NaN, and training stops. The fix is a one-line algebraic identity: subtract the maximum logit before the exponential.

Let \\(m = \\max_j z_j\\). Then

\\[
\\frac{e^{z_i}}{\\sum_j e^{z_j}} = \\frac{e^{z_i - m} \\cdot e^m}{\\sum_j e^{z_j - m} \\cdot e^m} = \\frac{e^{z_i - m}}{\\sum_j e^{z_j - m}}
\\]

The \\(e^m\\) factors cancel exactly. The shifted logits \\(z_i - m\\) are all \\(\\le 0\\), so the largest exponential is \\(e^0 = 1\\) and overflow is impossible. Underflow on the very negative shifted values is harmless because they contribute negligibly to the denominator anyway.

The same identity gives the **log-softmax**, which is what cross-entropy actually consumes:

\\[
\\log \\sigma(z)_i = z_i - \\log \\sum_j e^{z_j} = z_i - \\text{logsumexp}(z)
\\]

\`logsumexp\` is the stable primitive: it computes \\(m + \\log \\sum_j e^{z_j - m}\\), never exponentiates anything positive, and never takes the log of a value that could underflow to zero. Every framework's \`F.cross_entropy\` and \`F.log_softmax\` route through this trick — the user passes raw logits, the kernel handles the shift, and the gradient \\(\\sigma - y\\) is computed without ever materialising a NaN. The lesson on numerical pitfalls below makes the same point about \`torch.log(F.softmax(...))\` as the canonical anti-pattern.`,
          },
          {
            kind: 'prose',
            heading: 'Cross-entropy as a code-length penalty',
            body: `Forget probabilities for a moment and think about codes. Imagine you need to send a stream of class labels over a wire, one symbol per sample, and you want to use as few bits per symbol as possible on average. Shannon's source coding theorem says the optimal code for a distribution \\(p\\) assigns the symbol with probability \\(p_i\\) a codeword of length \\(\\log(1/p_i) = -\\log p_i\\) bits. Rare events get long codewords, common events get short ones. The quantity \\(-\\log p_i\\) is the **surprise** of observing event \\(i\\) — a coin landing heads at \\(p = 0.5\\) is worth \\(1\\) bit of surprise; a one-in-a-million event is worth roughly \\(20\\) bits.

Take the expected surprise under the *same* distribution \\(p\\) and you get the **entropy** \\(H(p) = -\\sum_i p_i \\log p_i\\). That is the optimal expected code length — the floor below which no encoding scheme can go.

Now suppose you designed your code for a *different* distribution \\(q\\), then events actually arrive from \\(p\\). Each event \\(i\\) still costs \\(-\\log q_i\\) bits, because the codebook is whatever you built. But the *frequencies* of those events are governed by \\(p\\). The expected codeword length is the **cross-entropy** \\(H(p, q) = -\\sum_i p_i \\log q_i\\). The codebook is mismatched, so the average message is longer than it had to be. Gibbs' inequality guarantees \\(H(p, q) \\ge H(p)\\), with equality only when \\(q = p\\). The excess — the wasted bits per symbol — is exactly the **KL divergence** \\(D_{\\text{KL}}(p \\| q) = H(p, q) - H(p)\\).

This is the picture to carry into ML. In supervised classification, \\(p\\) is the true label distribution (a one-hot vector if the label is hard, a smoothed vector if it is soft) and \\(q\\) is your model's softmax output. Training the model is minimising the bits the data is being forced to pay because the model's codebook is wrong. The true entropy \\(H(p)\\) is fixed — the data is what it is — so the only knob is \\(q\\), and pushing \\(q\\) toward \\(p\\) drives the penalty toward zero. Cross-entropy is not an arbitrary scoring rule; it is the bill the model pays for disagreeing with reality, measured in bits.`,
          },
          {
            kind: 'prose',
            heading: 'Worked: CE for a 3-class classifier',
            body: `Work through one concrete example end to end. The dataset has three classes. The true label for this sample is class \\(2\\), so the one-hot vector is \\(p = [0, 0, 1]\\). The model outputs the softmax distribution \\(q = [0.1, 0.2, 0.7]\\). Compute the cross-entropy directly from the definition:

\\[
H(p, q) = -(0 \\cdot \\log 0.1 + 0 \\cdot \\log 0.2 + 1 \\cdot \\log 0.7) = -\\log 0.7 \\approx 0.357
\\]

Two of the three terms are killed by the zero entries of \\(p\\). Only the probability the model assigned to the *correct* class survives. That is the simplification that makes hard-label classification clean: cross-entropy collapses to \\(-\\log q_{\\text{true}}\\).

Now train for a while and the model improves to \\(q = [0.05, 0.05, 0.9]\\). The loss drops to \\(-\\log 0.9 \\approx 0.105\\). The model is more confident in the right answer, so the bill is smaller.

Suppose instead the model regresses and outputs \\(q = [0.45, 0.45, 0.1]\\) — it now thinks the correct class is the *least* likely. The loss jumps to \\(-\\log 0.1 \\approx 2.303\\). A factor of more than \\(20\\times\\) worse than the original prediction, even though the predicted probability for the correct class only fell from \\(0.7\\) to \\(0.1\\).

Why the asymmetry? The logarithm. Differentiate the loss with respect to the true-class probability:

\\[
\\frac{\\partial}{\\partial q_{\\text{true}}}\\left(-\\log q_{\\text{true}}\\right) = -\\frac{1}{q_{\\text{true}}}
\\]

The gradient blows up as \\(q_{\\text{true}} \\to 0\\). When the model is confidently wrong, the loss surface is steep — gradient descent gets a huge push to fix the mistake. When the model is already nearly perfect (\\(q_{\\text{true}} \\to 1\\)), the gradient flattens out and the model is left alone. That is exactly the behaviour you want from a training signal: be loud about big mistakes, quiet about already-correct answers.`,
          },
          {
            kind: 'prose',
            heading: 'BCE vs CE',
            body: `**Binary cross-entropy** is the two-class case of cross-entropy, written in the form a binary classifier actually uses. With label \\(y \\in \\{0, 1\\}\\) and predicted probability \\(p\\) for the positive class:

\\[
\\mathcal{L}_{\\text{BCE}} = -y \\log p - (1 - y) \\log (1 - p)
\\]

If \\(y = 1\\) only the first term survives and the loss is \\(-\\log p\\); if \\(y = 0\\) only the second term survives and the loss is \\(-\\log(1 - p)\\). Same code-length intuition, simpler form. The two probabilities \\(p\\) and \\(1 - p\\) are exactly the two-class softmax over logits \\([0, z]\\), so BCE on top of a sigmoid is algebraically identical to multi-class CE on top of a softmax with \\(K = 2\\).

The rule of thumb is the activation, not the maths. Use **BCE** when the output is a sigmoid — binary classification (one logit, one probability) and multi-label problems where each class is independent (\\(N\\) logits, \\(N\\) sigmoids, each fitted with its own BCE). Use **CE** when the output is a softmax — multi-class single-label problems where classes are mutually exclusive and the probabilities must sum to one.

The trap is mixing them up. Applying CE on top of sigmoids treats the outputs as if they competed, which they do not in multi-label. Applying BCE on top of softmax breaks the coupling the softmax just imposed. Pick the loss that matches what the output layer is claiming about the label space.`,
          },
          {
            kind: 'math',
            heading: 'Entropy, cross-entropy, KL divergence',
            body: `Information theory starts with one definition. The **entropy** of a discrete distribution \\(p\\) over \\(K\\) classes is the expected number of bits needed to encode a sample from it under the optimal code:

\\[
H(p) = -\\sum_{i=1}^{K} p_i \\log p_i
\\]

A peaked distribution (one class with probability 1) has entropy zero — no surprise, no information. A uniform distribution over \\(K\\) classes has entropy \\(\\log K\\) — maximum uncertainty.

The **cross-entropy** of \\(p\\) relative to a second distribution \\(q\\) is the expected number of bits needed to encode a sample from \\(p\\) using the optimal code *for* \\(q\\):

\\[
H(p, q) = -\\sum_{i=1}^{K} p_i \\log q_i
\\]

If \\(q = p\\), cross-entropy equals entropy. If \\(q\\) is wrong about which classes are likely, cross-entropy is *larger* than entropy — you pay extra bits for using the wrong code. That excess is the **Kullback-Leibler divergence**:

\\[
D_{\\text{KL}}(p \\| q) = H(p, q) - H(p) = \\sum_{i} p_i \\log \\frac{p_i}{q_i}
\\]

\\(D_{\\text{KL}}\\) is non-negative, zero iff \\(p = q\\), and asymmetric (\\(D_{\\text{KL}}(p \\| q) \\ne D_{\\text{KL}}(q \\| p)\\) in general). Now the training-loss interpretation falls out. Treat \\(p\\) as the *fixed* true label distribution (a one-hot vector for hard labels) and \\(q\\) as the model's prediction. Then \\(H(p)\\) is a constant the model cannot change, so

\\[
\\min_q H(p, q) \\;\\Leftrightarrow\\; \\min_q D_{\\text{KL}}(p \\| q)
\\]

Minimising cross-entropy is exactly the same as minimising KL divergence to the truth. The model is being trained to match the true distribution as closely as possible, measured by the only divergence that has an information-theoretic interpretation.`,
          },
          {
            kind: 'prose',
            heading: 'KL as "wrongness cost"',
            body: `KL divergence is the bill the model pays for believing the wrong distribution. Written out:

\\[
D_{\\mathrm{KL}}(p \\| q) = \\sum_{x} p(x) \\log \\frac{p(x)}{q(x)}
\\]

Read it aloud: the expected log-ratio of how much \\(p\\) prefers \\(x\\) over \\(q\\)'s belief, averaged over the events \\(p\\) actually generates. Each term \\(\\log \\bigl( p(x) / q(x) \\bigr)\\) asks "how surprised is \\(q\\) compared to \\(p\\) about this event?", and weighting by \\(p(x)\\) gives the surprise the *true* distribution will actually experience. When the two distributions agree on \\(x\\), the ratio is \\(1\\) and the log is \\(0\\); when \\(q\\) underestimates an event \\(p\\) finds common, the ratio blows up and the term contributes a heavy cost.

Three properties pin down the geometry. KL is always \\(\\ge 0\\) — Jensen's inequality on the concave \\(\\log\\) does the work. KL equals \\(0\\) iff \\(p = q\\) almost everywhere, so it acts like a distance in the "is this the same distribution?" sense. KL is **not symmetric**: in general \\(D_{\\mathrm{KL}}(p \\| q) \\ne D_{\\mathrm{KL}}(q \\| p)\\), which is why it is called a *divergence* and not a metric. There is no triangle inequality either.

The asymmetry has a name and a personality. **Forward KL** \\(D_{\\mathrm{KL}}(p \\| q)\\) is *mean-seeking*: wherever \\(p\\) puts mass, \\(q\\) is forced to put some too, otherwise \\(\\log(p/q)\\) explodes. A \\(q\\) that misses a mode of \\(p\\) gets infinite penalty, so the fit spreads \\(q\\) out to *cover* every mode — averaging across them when it cannot match them all. **Reverse KL** \\(D_{\\mathrm{KL}}(q \\| p)\\) is *mode-seeking*: the expectation is over \\(q\\) now, so \\(q\\) only pays where it places mass. Pick one mode of \\(p\\), put all of \\(q\\) there, ignore the rest — penalty stays small. The VAE objective uses reverse KL \\(D_{\\mathrm{KL}}(q(z|x) \\| p(z))\\), which is exactly why variational posteriors tend to *concentrate on one mode* of the true posterior rather than averaging across several. This is the variational-inference failure mode worth memorising before you ever debug a collapsed VAE.`,
          },
          {
            kind: 'prose',
            heading: 'Worked: KL between two distributions',
            body: `Take two discrete distributions over the same three classes. Set \\(p = [0.1, 0.4, 0.5]\\) and \\(q = [0.2, 0.3, 0.5]\\). Both are valid (positive, sum to one) and they disagree on the first two classes while matching exactly on the third. Compute the **forward KL** term by term, using natural log throughout:

\\[
D_{\\mathrm{KL}}(p \\| q) = 0.1 \\log\\!\\frac{0.1}{0.2} + 0.4 \\log\\!\\frac{0.4}{0.3} + 0.5 \\log\\!\\frac{0.5}{0.5}
\\]

The ratios are \\(0.5\\), \\(4/3\\), and \\(1\\). Their logs are \\(\\log 0.5 \\approx -0.693\\), \\(\\log(4/3) \\approx 0.288\\), and \\(\\log 1 = 0\\). Multiply by the \\(p\\)-weights:

\\[
D_{\\mathrm{KL}}(p \\| q) = 0.1 \\cdot (-0.693) + 0.4 \\cdot 0.288 + 0.5 \\cdot 0 = -0.0693 + 0.115 + 0 = 0.046
\\]

A small positive number, in nats. Now swap the arguments and compute the **reverse KL**:

\\[
D_{\\mathrm{KL}}(q \\| p) = 0.2 \\log\\!\\frac{0.2}{0.1} + 0.3 \\log\\!\\frac{0.3}{0.4} + 0.5 \\log\\!\\frac{0.5}{0.5}
\\]

The ratios flip to \\(2\\), \\(0.75\\), and \\(1\\). Their logs are \\(\\log 2 \\approx 0.693\\), \\(\\log 0.75 \\approx -0.288\\), and \\(0\\). Now the \\(q\\)-weights multiply in:

\\[
D_{\\mathrm{KL}}(q \\| p) = 0.2 \\cdot 0.693 + 0.3 \\cdot (-0.288) + 0.5 \\cdot 0 = 0.139 - 0.0864 + 0 = 0.052
\\]

The two answers are **different**: \\(0.046\\) forward, \\(0.052\\) reverse. That is the asymmetry made concrete. The numbers are close because the distributions only mildly disagree, but the inequality is real and it grows quickly the more the two distributions pull apart. Treat KL like a directed cost — the source argument is the one expectation is taken over, and the gap between forward and reverse is exactly the bias variational methods inherit.`,
          },
          {
            kind: 'prose',
            heading: 'Cross-entropy = entropy + KL',
            body: `The identity that ties this lesson together is one line:

\\[
H(p, q) = -\\sum_x p(x) \\log q(x) = H(p) + D_{\\mathrm{KL}}(p \\| q)
\\]

Cross-entropy decomposes cleanly into a term that depends only on the true distribution and a term that measures the gap between truth and model. The first piece, \\(H(p)\\), is the entropy of the data — irreducible noise, the floor below which no model can drive the loss. The second piece, \\(D_{\\mathrm{KL}}(p \\| q)\\), is the only piece the model can move. Minimising cross-entropy is therefore equivalent to minimising KL divergence, because the entropy term is a constant when \\(p\\) is fixed by the dataset. This is why every line of code that calls \`F.cross_entropy\` is, mathematically, calling a KL minimiser in disguise.

The decomposition shows up explicitly in **variational autoencoders**. The negative ELBO loss is

\\[
\\mathcal{L}_{\\mathrm{VAE}} = -\\mathbb{E}_{q(z|x)}[\\log p(x|z)] + D_{\\mathrm{KL}}\\bigl(q(z|x) \\,\\big\\|\\, \\mathcal{N}(0, I)\\bigr)
\\]

The reconstruction term is a per-pixel cross-entropy (or MSE under Gaussian likelihood) and the KL term shapes the latent space — pulling every per-input posterior toward the unit Gaussian prior, which is what makes the latents *sampleable* at generation time. Drop the KL term and the encoder is free to put each \\(x\\) on its own island; keep it and the islands merge into a smooth manifold. Cross-entropy and KL are not two losses — they are the same loss split across "fit the data" and "fit the prior".`,
          },
          {
            kind: 'viz',
            heading: 'Cross-entropy penalises overconfident wrong answers',
            component: 'LogLossCurveViz',
            props: {},
          },
          {
            kind: 'viz',
            component: 'SoftmaxViz',
            props: {},
            heading: 'Softmax turns logits into probabilities.',
          },
          {
            kind: 'prose',
            heading: 'Softmax is the partner cross-entropy was built for',
            body: `Networks do not emit probabilities — they emit unbounded real numbers called **logits**. The job of softmax is to convert a logit vector \\(z \\in \\mathbb{R}^K\\) into a valid probability distribution:

\\[
q_i = \\text{softmax}(z)_i = \\frac{e^{z_i}}{\\sum_j e^{z_j}}
\\]

Two properties matter. Every \\(q_i \\in (0, 1)\\), and they sum to one — softmax outputs are always a distribution, never quite zero, never quite one. The exponential preserves order (the largest logit is the largest probability) while shrinking small logits and amplifying large ones in a way that respects *differences* rather than absolute values: shifting every logit by a constant leaves the output unchanged. That shift-invariance is exactly the log-sum-exp trick the *floating point* lesson used for numerical stability, and the trick that makes \`nn.CrossEntropyLoss\` safe to call on raw logits in the hundreds.

The reason cross-entropy and softmax are the canonical pairing is what happens to the gradient when you compose them. For a one-hot target \\(y\\) with the correct class index \\(c\\), the loss for a single example is

\\[
\\mathcal{L}(z) = -\\log \\text{softmax}(z)_c = -z_c + \\log \\sum_j e^{z_j}
\\]

Differentiate with respect to logit \\(z_i\\):

\\[
\\frac{\\partial \\mathcal{L}}{\\partial z_i} = -\\mathbb{1}[i = c] + \\frac{e^{z_i}}{\\sum_j e^{z_j}} = q_i - y_i
\\]

That is the entire backward pass. The gradient at the output layer is **prediction minus target**, elementwise. No Jacobian to multiply through, no fragile derivatives of \\(\\exp\\), no division. The vanishing-gradient pathologies the *backprop* lesson cataloged — saturation of sigmoid, division by exploding denominators — simply do not arise here. The cross-entropy + softmax pair was *designed* to give this gradient, and the design is what makes deep classifiers trainable at all.`,
          },
          {
            kind: 'math',
            heading: 'The clean gradient, derived end to end',
            body: `Start from the per-example loss with one-hot target \\(y\\) at class \\(c\\):

\\[
\\mathcal{L}(z) = -\\sum_i y_i \\log q_i, \\qquad q_i = \\frac{e^{z_i}}{\\sum_j e^{z_j}}
\\]

The chain rule applied to \\(\\log q_i\\):

\\[
\\frac{\\partial \\log q_i}{\\partial z_k} = \\frac{1}{q_i} \\frac{\\partial q_i}{\\partial z_k}
\\]

For softmax itself, \\(\\partial q_i / \\partial z_k = q_i (\\delta_{ik} - q_k)\\). Substituting:

\\[
\\frac{\\partial \\log q_i}{\\partial z_k} = \\delta_{ik} - q_k
\\]

Sum over \\(i\\) weighted by \\(y_i\\):

\\[
\\frac{\\partial \\mathcal{L}}{\\partial z_k} = -\\sum_i y_i (\\delta_{ik} - q_k) = -y_k + q_k \\sum_i y_i = q_k - y_k
\\]

since \\(\\sum_i y_i = 1\\) for any valid target distribution. The whole vector gradient is one line of NumPy: \`grad_logits = q - y\`. That collapse is unique to this loss-activation pair. Use MSE on top of softmax and the gradient picks up a factor of \\(q_i (1 - q_i)\\) that goes to zero whenever the model is confidently right *or* confidently wrong — exactly the cases gradient descent needs to react to. Cross-entropy is the only loss that punishes confident-wrong proportionally to how wrong it is.`,
          },
          {
            kind: 'callout',
            tone: 'tip',
            body: `**Never write \`torch.log(F.softmax(x))\`.** The two-step version exponentiates first (overflowing for any logit above ~88 in fp32, ~11 in fp16), normalises, then takes a log that can underflow to \\(-\\infty\\). The combined \`F.log_softmax(x)\` and \`nn.CrossEntropyLoss\` both use the log-sum-exp identity \\(\\log \\sum_j e^{z_j} = m + \\log \\sum_j e^{z_j - m}\\) where \\(m = \\max_j z_j\\), so the largest exponent is always \\(0\\) and overflow is impossible. Same algebra, completely different numerics — and the cleanest way to make \`log(0)\` never appear in your training logs.`,
          },
          {
            kind: 'prose',
            heading: 'Binary cross-entropy is just the two-class case',
            body: `When there are exactly two classes, the softmax + cross-entropy story specialises to a more familiar form. Encode the target as a single scalar \\(y \\in \\{0, 1\\}\\) and the prediction as a single sigmoid output \\(q = \\sigma(z) = 1 / (1 + e^{-z})\\). The two-class softmax over \\([0, z]\\) gives \\(q\\) and \\(1 - q\\), and the cross-entropy collapses to

\\[
\\mathcal{L}_{\\text{BCE}}(z, y) = -y \\log \\sigma(z) - (1 - y) \\log (1 - \\sigma(z))
\\]

This is what every binary classifier — spam vs not-spam, click vs no-click, tumour vs benign — actually optimises. The gradient is again \\(\\sigma(z) - y\\), identical in form to the multi-class case (the multi-class gradient \\(q - y\\) just specialises to a 1-D version). PyTorch ships two versions: \`nn.BCELoss\` takes a probability already squashed by sigmoid (and is numerically dangerous for the same log-sum-exp reasons), while \`nn.BCEWithLogitsLoss\` takes raw logits and fuses the sigmoid + log internally. **Always use \`BCEWithLogitsLoss\` in production code.** The fused version is the binary twin of \`CrossEntropyLoss\` and inherits its numerical stability.

The same loss extends to multi-label problems (one image can be tagged "cat" *and* "indoor" *and* "fluffy" simultaneously) — apply \`BCEWithLogitsLoss\` independently per class. That is *not* the same as multi-class cross-entropy, which assumes the classes are mutually exclusive; the difference comes down to whether the softmax couples the outputs or each sigmoid stands alone.`,
          },
          {
            kind: 'code',
            language: 'python',
            heading: 'PyTorch: the fused softmax + log + NLL',
            body: `import torch
import torch.nn as nn
import torch.nn.functional as F

# A toy classifier: 8 examples, 5 classes.
logits = torch.randn(8, 5, requires_grad=True)    # raw outputs of the last linear layer
targets = torch.randint(0, 5, (8,))                # integer class indices, NOT one-hot

# The right way: feed raw logits straight into the loss. The internal pipeline is
#   log_softmax(logits)  ->  NLL(log_probs, targets)
# fused into one numerically stable kernel.
loss = nn.CrossEntropyLoss()(logits, targets)
loss.backward()
print("CrossEntropyLoss:", loss.item())
print("grad at logits[0]:", logits.grad[0])
# observe: logits.grad equals  (softmax(logits) - one_hot(targets)) / batch_size
# the clean (q - y) gradient, divided by the batch size because the default reduction is "mean"

# The wrong way: manual softmax + log. Works on toy inputs, NaN-prone on large logits.
manual_logits = torch.tensor([[-100.0, 0.0, 100.0]], requires_grad=True)
naive  = -torch.log(F.softmax(manual_logits, dim=-1))[0, 2]   # -log of a probability that underflowed
stable = -F.log_softmax(manual_logits, dim=-1)[0, 2]          # log-sum-exp shifts the max to 0
print("naive  loss:", naive.item())                           # inf or nan, depending on the build
print("stable loss:", stable.item())                          # 0.0, the correct answer

# Decomposing CrossEntropyLoss to see the equivalence:
#   CrossEntropyLoss(logits, targets)  ==  NLLLoss(log_softmax(logits), targets)
ce  = nn.CrossEntropyLoss()(logits, targets)
nll = F.nll_loss(F.log_softmax(logits, dim=-1), targets)
print("CE == NLL(log_softmax):", torch.allclose(ce, nll))     # True

# Binary classification uses the sigmoid twin. Same fusion, same reason.
binary_logits = torch.randn(8, requires_grad=True)
binary_targets = torch.randint(0, 2, (8,)).float()
bce = nn.BCEWithLogitsLoss()(binary_logits, binary_targets)   # safe
# never: nn.BCELoss()(torch.sigmoid(binary_logits), binary_targets)  # log(0) waiting to happen`,
          },
          {
            kind: 'prose',
            heading: 'Class weights for imbalanced datasets',
            body: `Real datasets are rarely class-balanced. Credit-card fraud is 0.1 percent of transactions. A medical screen finds disease in maybe 2 percent of patients. Hand a naive cross-entropy loss to a 99/1 split and the model learns to predict "no fraud" for every input — training loss looks great, recall on the positive class is zero. The loss is doing what it was told (minimise average log-likelihood) and the data told it the positive class barely matters.

The standard fix is to weight the per-class contributions to the loss inversely to their frequency:

\\[
\\mathcal{L}_{\\text{weighted}} = -\\sum_i w_{y_i} \\log q_{i, y_i}
\\]

with \\(w_c\\) typically set to \\(N / (K \\cdot n_c)\\) (the inverse class frequency, scaled so the weights average to 1) or simply \\(1 / n_c\\). PyTorch's \`nn.CrossEntropyLoss(weight=w)\` accepts a per-class tensor that multiplies each example's loss term by the weight of its true class. The gradient becomes \\(w_{y_i} (q - y)\\) instead of \\(q - y\\), which means rare-class mistakes produce proportionally larger updates and the model is forced to actually learn them.

Two warnings. First, weights amplify noise: if the rare class has only a handful of examples and they are mislabeled, large weights amplify the mistakes. Calibrate the weight by data quality, not just frequency. Second, weights interact with the gradient scale; you may need to re-tune the learning rate after introducing them. The alternatives are *resampling* (upsample the rare class, downsample the common one) and *focal loss* (a non-linear reweighting that focuses on hard examples). For most production settings, class-weighted cross-entropy is the right first move because it requires no change to the data pipeline.`,
          },
          {
            kind: 'prose',
            heading: 'Label smoothing as regularization on the target',
            body: `A one-hot target says: "the true class has probability exactly 1, every other class probability exactly 0". The cross-entropy gradient \\(q - y\\) then pushes the model to drive the correct logit to \\(+\\infty\\) and every other logit to \\(-\\infty\\). The model never converges — it just keeps growing logits, with the weight norm climbing and the calibration getting steadily worse. This is the *overconfidence* failure mode behind a lot of deployment surprises: 99.9 percent confident predictions that are wrong, no useful uncertainty signal.

**Label smoothing** is a one-line fix. Replace the one-hot target \\(y\\) with a softened distribution

\\[
y'_i = (1 - \\varepsilon) y_i + \\varepsilon / K
\\]

where \\(\\varepsilon\\) is typically \\(0.1\\) and \\(K\\) is the number of classes. The true class now has target probability \\(1 - \\varepsilon + \\varepsilon / K\\) (about \\(0.91\\) for \\(K = 10\\), \\(\\varepsilon = 0.1\\)) and every other class has \\(\\varepsilon / K\\) instead of zero. The loss becomes

\\[
\\mathcal{L}_{\\text{LS}} = (1 - \\varepsilon) \\mathcal{L}_{\\text{CE}} + \\varepsilon \\cdot H(\\text{uniform}, q)
\\]

— a convex combination of the standard cross-entropy and a uniform-target cross-entropy that acts as a regularizer on the output distribution. The gradient becomes \\(q - y'\\) instead of \\(q - y\\), so the model is no longer pushed toward infinite confidence. The same regularization intent as dropout (which constrains the *features*) and weight decay (which constrains the *weights*), here applied to the *target* — the cleanest place to add it for a calibration problem. Label smoothing typically buys a fraction of a point of accuracy and substantial improvements in expected calibration error, at the price of trusting the model's softmax probabilities being a separate decision from trusting its argmax.`,
          },
          {
            kind: 'callout',
            tone: 'note',
            body: `**Why natural log, not log base 2.** Information-theory textbooks use \\(\\log_2\\) — entropy is then measured in *bits* and is conceptually clean. Machine learning uses the natural log \\(\\ln\\), measuring in *nats*, for one practical reason: derivatives are cleaner. \\(\\frac{d}{dx} \\ln x = 1/x\\), with no log-base constant attached. \\(\\frac{d}{dx} \\log_2 x = 1 / (x \\ln 2)\\), with a \\(\\ln 2\\) factor that propagates through every chain-rule step. The two losses differ only by a constant multiplicative factor (\\(\\ln 2 \\approx 0.693\\)), which is absorbed into the learning rate and changes no gradient direction. Every framework — PyTorch, JAX, TensorFlow — uses \\(\\ln\\). When you compare your training loss against an "entropy" figure quoted in bits, divide by \\(\\ln 2\\) (or multiply your loss by \\(\\log_2 e\\)) before the comparison. Same information-theoretic content, different unit.`,
          },
          {
            kind: 'prose',
            heading: 'What to take away',
            body: `Cross-entropy is the loss for any model that outputs a distribution over discrete options. Information theory says it is the expected code length of the truth under the model — minimising it is exactly minimising KL divergence to the truth, since \\(H(p)\\) is a constant the model cannot move. Pair it with softmax and the output-layer gradient collapses to \\(q - y\\), the cleanest gradient in deep learning, which is why every classifier from logistic regression to GPT trains on this loss instead of MSE.

Practical deployment is three rules. Use the *fused* loss (\`nn.CrossEntropyLoss\` for multi-class, \`nn.BCEWithLogitsLoss\` for binary or multi-label) so the log-sum-exp trick from the *floating point* lesson keeps you out of NaN territory. Weight the per-class contributions when the data is imbalanced — otherwise the model learns to predict the majority class and the loss curve lies to you. Smooth the targets with \\(\\varepsilon \\approx 0.1\\) when calibration matters; one-hot targets push the model toward infinite confidence and the *dropout* lesson's lesson about distributional robustness applies to the output layer too. Get the loss right and almost every other knob — learning rate, regularization, architecture — has a cleaner gradient signal to work with.`,
          },
          {
            kind: 'prose',
            heading: 'Further reading',
            body: `- [3Blue1Brown — "Solving Wordle using information theory"](https://www.youtube.com/watch?v=v68zYyaEmEA) — entropy and information units derived from a tangible game, the cleanest intuition for "bits of surprise."
- [Khan Academy — Conditional probability and combinations](https://www.khanacademy.org/math/statistics-probability/probability-library/conditional-probability-independence/v/conditional-probability-and-combinations) — the probability building blocks underneath the loss.
- [Chris Olah — "Visual Information Theory"](https://colah.github.io/posts/2015-09-Visual-Information/) — KL divergence, cross-entropy, and code lengths in one set of diagrams.`,
          },
        ],
      },
      {
        slug: 'autoencoder',
        title: 'Autoencoders',
        oneLiner: 'Squeeze the input through a bottleneck. Whatever survives is the essence.',
        difficulty: 'intermediate',
        readMinutes: 9,
        sections: [
          {
            kind: 'prose',
            heading: 'The bottleneck is the whole idea',
            body: `An **autoencoder** is a neural net trained to copy its input to its output, with one cruel restriction in the middle: the activations are forced through a layer narrower than the input. That narrow layer — the **bottleneck**, the **latent code**, the **embedding** \\(z\\) — is the only thing the decoder gets to look at when it tries to reconstruct the original. The encoder has to compress, the decoder has to decompress, and the loss measures how badly the round trip wrecked the input.

If the bottleneck were the same size as the input, the net could memorise the identity function and learn nothing. Make it smaller, and the network is forced to throw something away. The *thing it learns to throw away* is the noise, the redundancy, the per-pixel jitter that does not matter. The *thing it learns to keep* is the structure — the shape of the digit, the topic of the sentence, the rhythm of the sensor trace. That keep-set is the representation, and you got it for free without a single label.

This is the same compression instinct as PCA from the *PCA* lesson, but with one upgrade: the encoder and decoder are nonlinear. PCA is forced to find a linear subspace; an autoencoder can carve out a curved manifold. When the data lives on a swiss roll, PCA flattens it badly; a deep autoencoder can roll it out.`,
          },
          {
            kind: 'prose',
            heading: 'Compression as a learning objective',
            body: `An autoencoder is a neural net that learns the round trip \\(x \\to z \\to x'\\). The encoder \\(f_\\phi\\) maps the input \\(x \\in \\mathbb{R}^d\\) to a code \\(z \\in \\mathbb{R}^k\\) with \\(k \\ll d\\). The decoder \\(g_\\theta\\) maps \\(z\\) back out to \\(x' \\in \\mathbb{R}^d\\). The bottleneck \\(z\\) is the entire information channel between the two halves of the network — every bit the decoder ever sees about \\(x\\) has to fit through it. That constraint is the lesson the network is being forced to learn.

The training signal is reconstruction error. For continuous inputs the natural distance is squared L2:
\\[
\\mathcal{L}(\\phi, \\theta) = \\| x - x' \\|^2 = \\| x - g_\\theta(f_\\phi(x)) \\|^2.
\\]
Backprop drives \\(\\phi\\) and \\(\\theta\\) to minimise this jointly. Nothing in the loss says anything about what \\(z\\) should look like; it only grades the round trip.

Why this objective ends up learning something useful is the whole point. If \\(z\\) is wide enough to carry every bit of \\(x\\), the network can learn the identity and the loss goes to zero without the model understanding anything. Make \\(z\\) narrower than \\(x\\) and the identity is unavailable — there is no longer enough channel capacity. The optimiser is forced to spend the bits of \\(z\\) on whatever yields the lowest expected reconstruction loss across the training distribution. That budget is spent on signal, not noise: per-pixel jitter is unpredictable and impossible to reconstruct, but the silhouette of a digit is shared across thousands of examples and pays back across the whole dataset.

For MNIST the math is concrete. Each image is \\(28 \\times 28 = 784\\) dimensions, but the manifold of plausible digits is far thinner — a 10-dimensional \\(z\\) is enough to reconstruct legible digits, and 32 dimensions reconstructs them near-perfectly. The intrinsic dimensionality of the data is two orders of magnitude below the raw pixel count.

A **linear autoencoder** — no nonlinearities anywhere — is mathematically equivalent to PCA. The optimal weights span the same subspace as the top-\\(k\\) principal directions of the data covariance, and the reconstruction loss is the same residual variance PCA leaves behind. Add a single ReLU or sigmoid and the equivalence shatters: the autoencoder can now carve out curved manifolds that no linear projection reaches. A swiss roll that PCA flattens into an ambiguous disc, a deep autoencoder unrolls into a clean 2-D sheet. That extra expressive power is the only reason to use gradient descent here instead of an SVD.`,
          },
          {
            kind: 'prose',
            heading: 'Worked: tiny denoising autoencoder',
            body: `Take a 4-pixel image \\(x = (0.9, 0.1, 0.8, 0.2)\\) — two bright pixels, two dark. Add gaussian noise to get the input the network actually sees: \\(\\tilde{x} = (0.95, 0.05, 0.83, 0.18)\\). The clean \\(x\\) is the **target**, the noisy \\(\\tilde{x}\\) is what the encoder reads.

The encoder is a single linear layer with weights \\(W_\\text{enc} \\in \\mathbb{R}^{2 \\times 4}\\) and a sigmoid nonlinearity. The bottleneck has dimension \\(k = 2\\):
\\[
z = \\sigma(W_\\text{enc} \\, \\tilde{x}) = (0.6, 0.7).
\\]
Two numbers now have to stand in for the whole image.

The decoder is also a single linear layer with weights \\(W_\\text{dec} \\in \\mathbb{R}^{4 \\times 2}\\), again with a sigmoid:
\\[
x' = \\sigma(W_\\text{dec} \\, z) = (0.88, 0.12, 0.79, 0.21).
\\]
The reconstruction is close to the clean target, not the noisy input it was actually given.

Score the round trip against the clean \\(x\\):
\\[
\\mathcal{L} = \\| x - x' \\|^2 = (0.02)^2 + (0.02)^2 + (0.01)^2 + (0.01)^2 = 0.001.
\\]
Small but nonzero. Backprop computes \\(\\partial \\mathcal{L} / \\partial W_\\text{dec}\\) and \\(\\partial \\mathcal{L} / \\partial W_\\text{enc}\\), the optimiser nudges both matrices, and the next pass shaves a little more off.

The denoising trick is in the asymmetry: the encoder reads \\(\\tilde{x}\\), the loss is graded against \\(x\\). The network cannot win by passing pixels through unchanged — the noise pattern is different every batch. The only stable strategy is to learn the structure that the clean image and the noisy image share, throw away the per-pixel jitter, and reconstruct from structure. That is the entire denoising loophole-closer in one equation.`,
          },
          {
            kind: 'prose',
            heading: 'Use cases beyond reconstruction',
            body: `Reconstruction loss is the training signal, but it is almost never the product. The reason to train an autoencoder is whatever the model learns along the way.

**Denoising autoencoder.** Train on \\((\\tilde{x}, x)\\) pairs where \\(\\tilde{x}\\) is a corrupted version of \\(x\\). The classic corruptions are gaussian noise, salt-and-pepper masking, and random pixel dropout. At inference time you feed in a noisy image and read off the clean reconstruction. Same trick scales to text (BERT's masked-token objective) and images (masked autoencoders, MAE).

**Sparse autoencoder.** Add an L1 penalty on \\(z\\): \\(\\mathcal{L} = \\| x - x' \\|^2 + \\lambda \\| z \\|_1\\). The penalty pushes most components of \\(z\\) to zero, so each input activates a small subset of hidden units. Those units end up specialising — one fires for vertical edges, another for round shapes, another for a specific texture. Sparse codes are easier to interpret and frequently beat dense codes on downstream classification.

**Contractive autoencoder.** Penalise the Frobenius norm of the encoder Jacobian \\(\\| \\partial f_\\phi / \\partial x \\|_F^2\\). This forces the encoder to be locally constant — small wiggles in \\(x\\) do not move \\(z\\). The result is an embedding that is invariant to the noise directions in the data and sensitive only to directions that matter for reconstruction.

**Anomaly detection.** Train the autoencoder on normal data only. At inference, score each new point by its reconstruction error \\(\\| x - x' \\|^2\\). Normal points reconstruct well because the model has seen their structure; anomalies reconstruct badly because the manifold the encoder learned does not contain them. This is the standard unsupervised baseline for fraud detection, network intrusion, and industrial fault monitoring.

**Dimensionality reduction.** Once trained, throw away the decoder and use \\(z = f_\\phi(x)\\) as a learned feature vector. The encoder is a nonlinear PCA — it captures curved structure that the linear method misses. The 2-D or 3-D codes are also the standard input for t-SNE / UMAP when you want to visualise high-dimensional data.

**Pretraining.** Train an autoencoder on a large unlabelled corpus, throw away the decoder, and fine-tune the encoder on a small labelled downstream task. This was the standard recipe for deep nets before ImageNet-scale supervised data existed, and it is the spiritual ancestor of every modern self-supervised method.`,
          },
          { kind: 'viz', heading: 'Encoder, bottleneck, decoder', component: 'AutoencoderShapeViz' },
          {
            kind: 'viz',
            component: 'AutoencoderViz',
            props: {},
            heading: 'Drag the inputs. Watch the reconstruction.',
          },
          {
            kind: 'math',
            heading: 'Reconstruction loss',
            body: `Write the encoder as \\(z = f_\\phi(x)\\) and the decoder as \\(\\hat{x} = g_\\theta(z)\\). The composed map is \\(\\hat{x} = g_\\theta(f_\\phi(x))\\) and the training objective is to make that composition as close to the identity as the bottleneck allows.

For continuous inputs (pixel intensities scaled to \\([0, 1]\\), sensor values, embeddings) the natural loss is **mean squared error**:

\\[
\\mathcal{L}_{\\text{MSE}}(x) = \\| x - g_\\theta(f_\\phi(x)) \\|^2 = \\sum_{i=1}^{d} (x_i - \\hat{x}_i)^2
\\]

For binary or \\([0,1]\\)-bounded inputs (black/white pixels, multi-hot vectors) you pair a sigmoid output with **binary cross-entropy**, treating each output as the probability that pixel \\(i\\) is on:

\\[
\\mathcal{L}_{\\text{BCE}}(x) = -\\sum_{i=1}^{d} \\big[\\, x_i \\log \\hat{x}_i + (1 - x_i) \\log (1 - \\hat{x}_i) \\,\\big]
\\]

BCE is the cross-entropy loss from the previous *cross-entropy* lesson, summed per pixel instead of per class. The encoder and decoder are trained jointly by backprop — both \\(\\phi\\) and \\(\\theta\\) move to minimise the round-trip error on every batch.`,
          },
          {
            kind: 'prose',
            heading: 'Why narrowness forces representation learning',
            body: `Suppose the input is a 784-pixel MNIST digit and the bottleneck is 32 floats. The decoder has to reconstruct 784 numbers from 32, so the encoder is forced to discover what 32 numbers about a handwritten digit are worth keeping. Those 32 numbers cannot be 32 random pixels — most pixels are background. They have to summarise stroke direction, loop count, slant, thickness. The bottleneck is a constraint that pushes the encoder into learning *semantically useful* features without anyone labeling a single image.

Make the bottleneck too wide and the model cheats: it learns a near-identity mapping that copies pixels through, and \\(z\\) carries no abstraction. Make it too narrow and the decoder cannot reconstruct even the easy cases — the loss plateaus high and the latents collapse to a mean image. The bottleneck width is the single most important hyperparameter in an autoencoder, and the right value is data-dependent: tens of dimensions for MNIST, hundreds for ImageNet, thousands for high-resolution audio.

This is also why dropping a sparsity penalty on \\(z\\) (an L1 term, or a KL to a low-target activation) helps even when the bottleneck is generous — it brings the *effective* dimensionality down without forcing you to guess the right width up front.`,
          },
          {
            kind: 'callout',
            tone: 'tip',
            body: `**Bottleneck size is the critical hyperparameter.** Sweep it. Train autoencoders with \\(k \\in \\{8, 16, 32, 64, 128\\}\\) and plot reconstruction loss against \\(k\\) on a validation set — you will see a knee where adding more dimensions stops buying you anything. Pick the smallest \\(k\\) on the flat side of the knee. That value is your data's *intrinsic dimensionality* under this architecture, and it is usually far below what your intuition would guess.`,
          },
          {
            kind: 'prose',
            heading: 'Linear autoencoder is PCA in disguise',
            body: `Strip every nonlinearity from the encoder and decoder. Let the encoder be a single \\(d \\times k\\) matrix \\(W_e\\) and the decoder be a single \\(k \\times d\\) matrix \\(W_d\\), no activations, no biases. The composition is \\(\\hat{x} = W_d W_e x\\), and the MSE loss is

\\[
\\mathcal{L} = \\| x - W_d W_e x \\|^2
\\]

Minimising this over \\(W_e, W_d\\) gives — up to an invertible linear change of basis inside the bottleneck — exactly the projection onto the top-\\(k\\) principal components of the data. The optimal \\(W_d\\) is the matrix whose columns are the top \\(k\\) eigenvectors of \\(\\Sigma\\) from the *PCA* lesson, and \\(W_e = W_d^\\top\\). A linear autoencoder *is* PCA, trained by gradient descent instead of by eigendecomposition.

The moment you add ReLU, sigmoid, or any other nonlinearity the equivalence breaks and the autoencoder can do strictly more — it can carve out curved manifolds that PCA cannot. That extra capacity is the entire reason deep autoencoders exist. Without nonlinearities, you would skip the gradient descent and just call \`numpy.linalg.svd\` like every sane PCA implementation already does.`,
          },
          {
            kind: 'prose',
            heading: 'Denoising autoencoders: train on the corrupted version',
            body: `A vanilla autoencoder can still cheat in subtle ways — copying low-level texture through the bottleneck instead of summarising structure. The **denoising autoencoder** closes that loophole by changing the training signal: corrupt the input first, then ask the network to reconstruct the *clean* version.

\\[
\\tilde{x} = \\text{corrupt}(x), \\qquad \\mathcal{L}(x) = \\| x - g_\\theta(f_\\phi(\\tilde{x})) \\|^2
\\]

Corruption can be Gaussian noise (\\(\\tilde{x} = x + \\varepsilon, \\, \\varepsilon \\sim \\mathcal{N}(0, \\sigma^2 I)\\)), random pixel masking (set 30% of inputs to zero), or a salt-and-pepper flip. The network cannot just memorise the input verbatim because the input it sees is no longer the target. It has to learn what *should* be there given what *is* there — which forces the bottleneck to encode the underlying structure of the data, not the surface noise.

This idea later evolved into masked autoencoders for images (MAE) and the mask-prediction objective behind BERT. Same intuition: hide part of the input, learn to fill it in, and the representation you discover transfers to every downstream task.`,
          },
          {
            kind: 'prose',
            heading: 'Variational autoencoders: latent space as a distribution',
            body: `A standard autoencoder gives you one point \\(z\\) per input. That point is somewhere in a latent space the model carved out, but the space between points is empty — sample a random \\(z\\) and decode it and you typically get a garbled mess, because the decoder was only ever trained on the specific codes the encoder produced.

The **variational autoencoder (VAE)** fixes this. Instead of mapping \\(x\\) to a single \\(z\\), the encoder maps \\(x\\) to the *parameters of a distribution* over latents — typically a diagonal Gaussian \\(\\mathcal{N}(\\mu_\\phi(x), \\sigma_\\phi(x)^2)\\). At training time you sample \\(z\\) from that distribution before decoding. The loss adds a **KL divergence** term that pushes the encoder's distribution toward a standard Gaussian prior \\(\\mathcal{N}(0, I)\\):

\\[
\\mathcal{L}_{\\text{VAE}}(x) = \\underbrace{\\mathbb{E}_{z \\sim q_\\phi(z \\mid x)} [\\, \\| x - g_\\theta(z) \\|^2 \\,]}_{\\text{reconstruction}} \\; + \\; \\beta \\, \\underbrace{D_{\\text{KL}}(q_\\phi(z \\mid x) \\, \\| \\, \\mathcal{N}(0, I))}_{\\text{regulariser}}
\\]

That second term — the **KL regulariser** — is what makes the latent space *sampleable*. It packs every input into a region centered near the origin with unit-ish variance, so a random draw from \\(\\mathcal{N}(0, I)\\) lands in a region the decoder has seen during training. Now you can generate new samples by sampling \\(z \\sim \\mathcal{N}(0, I)\\) and running the decoder — which is why VAEs are a generative model, and standard autoencoders are not.

The full objective is the **Evidence Lower Bound (ELBO)**: a lower bound on \\(\\log p(x)\\) that decomposes exactly into the reconstruction term and the KL term above. The derivation is in any VAE paper; the takeaway is that VAEs are doing approximate maximum-likelihood under a generative model where \\(z\\) is the unobserved cause of \\(x\\).`,
          },
          {
            kind: 'callout',
            tone: 'note',
            body: `**The KL term is what makes a VAE generative.** Drop it and you have a standard autoencoder with a sampling step in the middle — the latent space is still a punctured set of points and the decoder still produces garbage on random \\(z\\). Keep it and the prior pulls the encoder's per-input distributions into a single connected blob centered at zero, which the decoder learns to navigate. The \\(\\beta\\) weight is the knob between reconstruction fidelity and sample quality — \\(\\beta\\)-VAE turns this into an explicit lever and large \\(\\beta\\) gives more disentangled, less faithful latents.`,
          },
          {
            kind: 'code',
            language: 'python',
            heading: 'Toy autoencoder in PyTorch — MNIST shape',
            body: `import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import DataLoader, TensorDataset

# ---- model ----
class Autoencoder(nn.Module):
    def __init__(self, d_in=784, d_hidden=256, d_latent=32):
        super().__init__()
        # encoder: 784 -> 256 -> 32 (the bottleneck)
        self.enc1 = nn.Linear(d_in, d_hidden)
        self.enc2 = nn.Linear(d_hidden, d_latent)
        # decoder: 32 -> 256 -> 784 (symmetric)
        self.dec1 = nn.Linear(d_latent, d_hidden)
        self.dec2 = nn.Linear(d_hidden, d_in)

    def encode(self, x):
        return self.enc2(F.relu(self.enc1(x)))    # z

    def decode(self, z):
        return torch.sigmoid(self.dec2(F.relu(self.dec1(z))))  # x_hat in [0,1]

    def forward(self, x):
        z = self.encode(x)
        return self.decode(z), z

# ---- fake MNIST-shaped data (replace with torchvision MNIST in real use) ----
torch.manual_seed(0)
X = torch.rand(2000, 784)                         # (N, 784) flattened images
loader = DataLoader(TensorDataset(X), batch_size=64, shuffle=True)

# ---- training loop ----
model = Autoencoder(d_latent=32)
opt = torch.optim.Adam(model.parameters(), lr=1e-3)

for epoch in range(5):
    total = 0.0
    for (x,) in loader:
        x_hat, z = model(x)
        loss = F.binary_cross_entropy(x_hat, x)   # BCE for [0,1] pixels
        # alternative: F.mse_loss(x_hat, x) for continuous targets
        opt.zero_grad()
        loss.backward()
        opt.step()
        total += loss.item() * x.size(0)
    print(f"epoch {epoch}  recon loss = {total / len(X):.4f}")

# ---- using the trained encoder as a feature extractor ----
with torch.no_grad():
    Z = model.encode(X)         # (2000, 32) — 32-D embeddings of every input
    print(Z.shape, Z.std(dim=0).mean().item())`,
          },
          {
            kind: 'prose',
            heading: 'Where autoencoders earn their keep',
            body: `Four jobs come up again and again.

**Dimensionality reduction.** Train the autoencoder, throw away the decoder, and use the encoder as a learned compressor. The 32-D codes are usable as features for downstream classifiers, clustering, or visualization — same role as PCA scores from the *PCA* lesson but capable of nonlinear structure. This is the only reason a lot of people train autoencoders at all.

**Anomaly detection.** Train on normal data only. At test time, run the input through the round trip and measure the reconstruction error. Inputs that look like the training distribution reconstruct cheaply; outliers do not — the decoder has never seen a fraud transaction, a faulty bearing vibration, or a defective chip image, so it cannot reproduce one accurately. Threshold the reconstruction error and you have an unsupervised anomaly detector that does not need labeled bad examples.

**Pretraining.** Before deep learning had ImageNet-scale labeled data, stacked autoencoders were the standard way to initialise deep nets — train layer by layer to reconstruct, then fine-tune on the labeled task. Modern self-supervised methods (BERT, MAE, SimCLR) inherit the same idea: learn a representation from the data itself, fine-tune downstream. The masked autoencoder for images is literally a denoising autoencoder with a transformer backbone.

**Generative modeling (VAEs).** Once you have a sampleable latent space, you can generate new data by sampling \\(z\\) and decoding. VAEs produce smooth, slightly blurry samples and a well-behaved latent space you can interpolate and arithmetic on — the "king minus man plus woman equals queen" trick for images. They are not as sharp as GANs or diffusion models, but they are the cleanest probabilistic story and the easiest to train.`,
          },
          {
            kind: 'prose',
            heading: 'What to take away',
            body: `An autoencoder is two halves of a neural net welded at a narrow waist. The encoder compresses, the decoder reconstructs, the loss is whatever distance metric matches the data — MSE for continuous, BCE for binary. The bottleneck width controls how much abstraction the model is forced into and is the hyperparameter you have to sweep. Linear autoencoders are PCA in disguise; nonlinear ones go strictly further by curving the manifold instead of flattening it.

Variants stack on top. Denoising autoencoders force the network to learn structure by reconstructing clean from corrupted. VAEs replace the deterministic latent point with a distribution and add a KL regulariser, which makes the latent space sampleable and turns the model into a proper generator. The same machinery powers anomaly detection, unsupervised pretraining, and dimensionality reduction — all without a single label. Sitting at the intersection of the *vectors*, *matrices*, and *PCA* lessons, autoencoders are the simplest deep-learning demonstration that compression and understanding are the same problem in different clothes.`,
          },
          {
            kind: 'prose',
            heading: 'Further reading',
            body: `- [Lilian Weng — "From Autoencoder to Beta-VAE"](https://lilianweng.github.io/posts/2018-08-12-vae/) — the full family tree from vanilla autoencoders through VAE, Beta-VAE, and VQ-VAE.
- [Deep Learning Book — Chapter 14: Autoencoders](https://www.deeplearningbook.org/contents/autoencoders.html) — Goodfellow, Bengio, Courville's chapter; the textbook treatment.
- [Hinton & Salakhutdinov — "Reducing the Dimensionality of Data with Neural Networks"](https://www.cs.toronto.edu/~hinton/absps/science.pdf) — the 2006 Science paper that resurrected deep autoencoders.`,
          },
        ],
      },
      {
        slug: 'contrastive-learning',
        title: 'Contrastive learning',
        oneLiner: 'Learn embeddings without labels. Pull positives together, push negatives apart.',
        difficulty: 'intermediate',
        readMinutes: 10,
        sections: [
          {
            kind: 'prose',
            heading: 'The setup: pairs you trust, no labels needed',
            body: `Contrastive learning is the self-supervised cousin of every supervised classifier you have seen so far. You do not need labels. You need **pairs you already know belong together** — and the universe is full of those if you squint right. Two crops of the same photo. A sentence and a paraphrase. An image and the caption underneath. An audio clip and its time-shifted copy. Anything that two different sensors, two augmentations, or two modalities will produce from the same underlying event qualifies as a **positive pair**. Everything else in the batch — every *other* image, sentence, caption — is a **negative**.

The bet is simple: if you train an encoder that maps each input to a vector from the *vectors* lesson, and you push the network so positives land close in that vector space while negatives land far, the geometry of the embedding space will end up reflecting the semantics of the input. Two images of dogs taken seconds apart get mapped near each other, a dog and a fire hydrant get mapped far apart, and *nobody had to label anything*. The pretext task is "tell which pairs were actually a pair" — a fake job that, when solved well, leaves you with an embedding space useful for every real downstream job.

That is the entire trick. The rest of the lesson is how to write the loss, how to choose negatives, and how the SimCLR and CLIP papers cashed this in.`,
          },
          {
            kind: 'prose',
            heading: 'Pull positives close, push negatives away',
            body: `Step back and notice what just changed. A supervised classifier predicts a label: cat, dog, fire hydrant. A contrastive encoder predicts something humbler and stranger — *whether two views are of the same thing*. That is the whole pretext task, and dropping the label is what lets the data scale unboundedly.

Concretely: take a single image \\(x\\). Apply two random augmentations — a crop here, a flip there, a colour-jitter knob, a blur — and call the results \\(\\tilde{x}_1\\) and \\(\\tilde{x}_2\\). These are the same scene seen through two different lenses; the underlying object did not change. Push both through an encoder \\(f\\). The training objective is one sentence long: \\(f(\\tilde{x}_1)\\) and \\(f(\\tilde{x}_2)\\) should land close in embedding space. They form a **positive pair**.

Now pick any *other* image \\(y\\) from the dataset, augment it, encode it. The pair \\((f(\\tilde{x}_1), f(\\tilde{y}))\\) is a **negative pair** — two views of different things. The objective for negatives is the mirror image of the objective for positives: their embeddings should land far apart.

The big trick — the reason contrastive learning ate the self-supervised world — is that **you do not need labels for any of this**. Augmentation manufactures positives for free: two crops of the same JPEG are automatically a positive pair, no human required. Negatives are even cheaper — every *other* image in your batch is a free negative against every anchor, simultaneously. A batch of 256 images instantly yields 256 positive pairs and \\(256 \\times 255\\) negative pairs without a single annotation.

What falls out of training on this fake task is a representation that captures *what makes this image this image*. The encoder is forced to ignore everything an augmentation can change — lighting, crop, rotation, hue, blur, mild occlusion — because if it leaned on those features, the two views of the same image would look different and the loss would punish it. What remains in the embedding is invariant content: object identity, shape, texture, scene gist. That is a stronger prior than any single labelled task could teach, which is why a frozen contrastive encoder transfers to classification, detection, retrieval, and segmentation downstream — all from a pretext task that never saw a class name.`,
          },
          {
            kind: 'prose',
            heading: 'Worked: InfoNCE on a batch of 4',
            body: `Pick the geometry concrete. Imagine a batch of \\(N = 4\\) images, all encoded into 2D for the picture (real systems use 128 or 256 dims, but the arithmetic is the same). After two augmentations and a forward pass through the L2-normalised encoder, the four anchor embeddings and four positive embeddings are:

- Anchor \\(a_1 = (1.0,\\ 0.0)\\), positive \\(p_1 = (0.9,\\ 0.1)\\) — almost the same vector, as it should be.
- Anchor \\(a_2 = (0.0,\\ 1.0)\\), positive \\(p_2 = (0.1,\\ 0.9)\\).
- Anchor \\(a_3 = (-1.0,\\ 0.0)\\), positive \\(p_3 = (-0.9,\\ -0.1)\\).
- Anchor \\(a_4 = (0.0,\\ -1.0)\\), positive \\(p_4 = (-0.1,\\ -0.9)\\).

Focus on \\(a_1\\). Its row of the similarity matrix is cosine similarities against every positive in the batch: \\(\\text{sim}(a_1, p_1) = 1.0 \\cdot 0.9 + 0.0 \\cdot 0.1 = 0.9\\). The negatives \\(p_2, p_3, p_4\\) are scattered around the unit circle, so \\(\\text{sim}(a_1, p_2) = 0.1\\), \\(\\text{sim}(a_1, p_3) = -0.9\\), \\(\\text{sim}(a_1, p_4) = 0.0\\). The raw row is \\([0.9,\\ 0.1,\\ -0.9,\\ 0.0]\\), and only the first entry is the true positive.

Apply temperature \\(\\tau = 0.1\\) — divide everything by it — and the row balloons to \\([9,\\ 1,\\ -9,\\ 0]\\). Softmax that row and the gap explodes: the probability mass on the correct positive is \\(\\frac{e^{9}}{e^{9} + e^{1} + e^{-9} + e^{0}} \\approx 0.9996\\). The InfoNCE loss for this anchor is \\(-\\log(0.9996) \\approx 0.0004\\). Tiny. The model is already right; gradient barely moves.

Now break the example. Suppose the encoder is undertrained and \\(p_1\\) lands at \\((-0.5,\\ 0.5)\\) instead — far from \\(a_1\\). Then \\(\\text{sim}(a_1, p_1) = -0.5\\), and after \\(/\\tau\\) the row becomes \\([-5,\\ 1,\\ -9,\\ 0]\\). The softmax probability on the correct positive collapses to \\(\\approx 0.0024\\), and the loss is \\(-\\log(0.0024) \\approx 6.0\\). Big. The gradient of that loss has a clean direction: increase \\(\\text{sim}(a_1, p_1)\\) and decrease \\(\\text{sim}(a_1, p_j)\\) for the negatives that are currently *too* close — i.e. pull \\(p_1\\) toward \\(a_1\\) and push the wrong-looking neighbours away. Repeat 100k batches and the geometry settles into the picture from the ASCII figure above.`,
          },
          {
            kind: 'prose',
            heading: 'Batch size matters enormously',
            body: `The InfoNCE objective is a cross-entropy over \\((K{+}1)\\) options: one true positive and \\(K\\) negatives. The harder that classification problem, the more information each gradient step carries. And the difficulty knob with the biggest effect is **the size of the negative pool**.

Run with batch size 32 and each anchor sees 31 negatives. Cross-entropy over 32 options is a coarse signal — a lazy encoder can fool the softmax by spreading embeddings to any reasonable corners and still get most rows right. Push the batch to 4096 and suddenly each anchor is competing against 4095 distractors, many of which will be visually similar by sheer luck of the draw. The encoder cannot survive on coarse features anymore; it has to carve out fine-grained directions in embedding space to separate the true positive from the closest hard negative.

This is why SimCLR famously needed batch sizes of 4096 or 8192, distributed across 8 TPU pods, just to *train at all*. MoCo dodges the memory bill with a different trick — a **memory bank**: maintain a queue of the last 65k embeddings produced by a slowly-updated momentum encoder, and treat the whole queue as negatives. The anchor still sees tens of thousands of distractors per step without paying for them in batch RAM.

Temperature \\(\\tau\\) is the second magnifier. Smaller \\(\\tau\\) (say 0.05) sharpens the softmax, concentrating the loss on the hardest negative in the row — the encoder cannot ignore borderline cases. Larger \\(\\tau\\) (1.0) flattens the loss into mush. SimCLR uses \\(\\tau \\approx 0.1\\); CLIP learns the scalar end-to-end and lands around \\(\\tau \\approx 0.01\\). The pattern recurs everywhere contrastive learning ships: SimCLR and BYOL for image pretraining, CLIP for image-text alignment, SimCSE for sentence embeddings, MoCo for detection backbones. The recipe is identical; the supervision signal is whatever pair structure the data already gives you for free.`,
          },
          {
            kind: 'viz',
            component: 'ContrastiveEmbeddingViz',
            props: {},
            heading: 'Pull positives together, push negatives apart',
          },
          {
            kind: 'viz',
            component: 'SoftmaxViz',
            props: {},
            heading: 'Softmax over (anchor, positives, negatives).',
          },
          {
            kind: 'math',
            heading: 'InfoNCE — cross-entropy over similarities',
            body: `The standard contrastive loss is **InfoNCE** (Noise-Contrastive Estimation, info-theoretic flavour). Given an anchor embedding \\(a\\), a positive embedding \\(p\\), and \\(K\\) negative embeddings \\(n_1, \\ldots, n_K\\), the loss is

\\[
\\mathcal{L}_{\\text{InfoNCE}}(a, p, \\{n_i\\}) \\;=\\; -\\log \\frac{\\exp\\bigl(\\text{sim}(a, p) / \\tau\\bigr)}{\\exp\\bigl(\\text{sim}(a, p) / \\tau\\bigr) \\;+\\; \\sum_{i=1}^{K} \\exp\\bigl(\\text{sim}(a, n_i) / \\tau\\bigr)}
\\]

Stare at that expression for a second. It is the **cross-entropy** loss from the *cross-entropy* lesson, applied to a \\((K{+}1)\\)-way classification problem whose "classes" are "which of these candidates is the real positive?" The numerator scores the true positive. The denominator is a softmax partition over the positive plus every negative — which is exactly the SoftmaxViz visualisation above, just relabeled. \\(\\text{sim}(\\cdot, \\cdot)\\) is almost always cosine similarity on L2-normalised embeddings, so \\(\\text{sim}(a, b) = a^\\top b\\) when \\(\\|a\\| = \\|b\\| = 1\\).

The temperature \\(\\tau > 0\\) is the only hyperparameter inside the loss itself. Small \\(\\tau\\) (e.g. 0.05) sharpens the softmax — the loss puts almost all the pressure on the single hardest negative and ignores easy ones. Large \\(\\tau\\) (e.g. 1.0) flattens the softmax — every negative contributes about the same and the gradient signal is mushy. SimCLR's sweet spot is \\(\\tau \\in [0.07, 0.2]\\); CLIP learned a single scalar temperature and ended up around \\(\\tau \\approx 0.01\\). Tune it; it is not a free parameter you can ignore.`,
          },
          {
            kind: 'prose',
            heading: 'SimCLR — augmentations are the supervision',
            body: `**SimCLR** is the cleanest cookbook for contrastive learning on images. For every image \\(x\\) in a batch of \\(N\\), apply two independent random augmentations — random crop + flip + colour-jitter + Gaussian blur — to get \\(\\tilde{x}_1\\) and \\(\\tilde{x}_2\\). Push both through a shared encoder \\(f_\\theta\\) (a ResNet, ViT, whatever) to get representations \\(h_1, h_2\\). Then push each through a small **projection head** \\(g_\\phi\\) (a 2-layer MLP) to get \\(z_1, z_2\\). L2-normalise. Compute InfoNCE treating \\((z_1, z_2)\\) as the positive pair and every other \\(z\\) in the batch as a negative.

The two surprising design choices that make SimCLR work:

1. **The projection head is thrown away at the end.** You train \\(f \\circ g\\), but only \\(f\\)'s output \\(h\\) is used downstream. The projection head soaks up information that helps the contrastive task but hurts transfer (mostly: invariances to the specific augmentations you chose). Letting it absorb that and discarding it leaves the underlying \\(h\\) cleaner.

2. **Augmentation is the entire supervision signal.** What the encoder learns to be invariant to is whatever the augmentation pipeline randomises over. Strong colour jitter teaches "this dog is the same dog regardless of lighting." Random crop teaches "this dog is the same dog regardless of which corner I see." Pick weak augmentations and you learn a weak representation; pick adversarial ones and you learn nothing. The augmentation list is more important than the architecture.

SimCLR also famously needs enormous batches — 4096 or 8192 — because every other example in the batch is a negative and more negatives means a harder, more informative contrastive task.`,
          },
          {
            kind: 'callout',
            tone: 'tip',
            body: `**Batch size matters enormously for contrastive learning.** Every other example in the batch is a free negative, so doubling \\(N\\) doubles the difficulty of the cross-entropy problem and tightens the geometry. SimCLR's gains over earlier methods came largely from training at batch sizes of 4096+ on 128 TPU cores. If you cannot afford the memory, use a **memory bank** (MoCo): keep a queue of K=65,536 recent embeddings as negatives, updated each step. The momentum-encoder trick in MoCo lets you reuse old embeddings without them going too stale to be useful negatives.`,
          },
          {
            kind: 'prose',
            heading: 'CLIP — pair images with text instead of with themselves',
            body: `**CLIP** is the same machinery, generalised to two *different* encoders for two *different* modalities. Take a batch of \\(N\\) (image, caption) pairs scraped from the web. Run the images through an image encoder \\(f_{\\text{img}}\\), the captions through a text encoder \\(f_{\\text{txt}}\\), L2-normalise both. You now have two batches of vectors \\(I_1, \\ldots, I_N\\) and \\(T_1, \\ldots, T_N\\) in a shared embedding space. Compute the \\(N \\times N\\) similarity matrix \\(S_{ij} = I_i^\\top T_j / \\tau\\). The positives are on the diagonal — image \\(i\\) was actually paired with caption \\(i\\). Everything off-diagonal is a negative.

The loss is symmetric InfoNCE: one cross-entropy where each row should pick out its diagonal entry (image-to-text), one cross-entropy where each column should pick out its diagonal entry (text-to-image), averaged. After training on 400M pairs, the same embedding space holds both pictures and English, with a dog photo near the string "a photo of a dog" and far from "a screenshot of code."

What that buys you is wild: **zero-shot classification**. To classify a new image, do not retrain anything. Embed the image. Embed the candidate class names as captions ("a photo of a {cat, dog, fire hydrant}"). The class whose caption embedding is closest to the image embedding wins. No labels, no fine-tuning, no extra training. CLIP's accuracy on ImageNet zero-shot rivals fully-supervised ResNet-50 — because aligning the two encoders to the *same* embedding space implicitly indexed every concept the captions covered, which was nearly everything on the public internet.`,
          },
          {
            kind: 'callout',
            tone: 'note',
            body: `**The CLIP recipe is what makes zero-shot work.** A standard image classifier has a fixed output head — 1000 ImageNet classes, baked in at training time. CLIP has no output head at all; it has an *open* embedding space. Any string you can write down becomes a new "class" by being embedded as text and compared to the image. That is why CLIP-style models underpin every text-to-image generator (DALL-E, Stable Diffusion guidance), every multimodal search engine, and every "describe this picture" downstream tool. Contrastive alignment, not classification, is the primitive.`,
          },
          {
            kind: 'prose',
            heading: 'Older cousins: triplet loss and N-pair loss',
            body: `InfoNCE is the modern default but it inherits from a longer family tree, and the older losses still appear in metric-learning code and face-recognition pipelines.

**Triplet loss** (FaceNet) takes one anchor, one positive, one negative and asks that the positive be closer than the negative by at least a margin \\(m\\):

\\[
\\mathcal{L}_{\\text{triplet}}(a, p, n) = \\max\\bigl(0,\\; \\|a - p\\|^2 - \\|a - n\\|^2 + m\\bigr)
\\]

It is a hinge loss in Euclidean space. The headache is mining: most random triplets are too easy (positive is already much closer than negative, loss is 0, no gradient). FaceNet had to do **semi-hard mining** — only train on triplets where the negative is within a margin of the positive — to get a useful signal. That selection logic is exactly what InfoNCE replaces with the softmax over many negatives: every negative in the batch contributes proportional to how hard it is, automatically.

**N-pair loss** is the missing rung between triplet and InfoNCE: one anchor, one positive, and \\(N - 1\\) negatives, with softmax-cross-entropy as the comparator. That is InfoNCE without the temperature. The temperature was the one trick that made InfoNCE work much better at scale — flattening or sharpening the softmax to match the difficulty of the task. Once you see the family, the chain reads triplet → N-pair → InfoNCE, each one adding more negatives and more gradient signal per step.`,
          },
          {
            kind: 'math',
            heading: 'Why temperature τ controls everything',
            body: `Look at the softmax inside InfoNCE again. The probability assigned to the positive is

\\[
q_+ = \\frac{\\exp(s_+ / \\tau)}{\\exp(s_+ / \\tau) + \\sum_i \\exp(s_i / \\tau)}
\\]

where \\(s_+ = \\text{sim}(a, p)\\) and \\(s_i = \\text{sim}(a, n_i)\\). The gradient of \\(-\\log q_+\\) with respect to the negative similarities \\(s_i\\) is exactly \\(\\frac{1}{\\tau} \\cdot q_{n_i}\\) — each negative pulls on the encoder in proportion to *how much softmax mass it grabbed*, scaled by \\(1/\\tau\\).

That formula tells you the whole story:

- **Small \\(\\tau\\)** (e.g. 0.05) sharpens the softmax. The hardest single negative grabs almost all the probability mass, so almost all the gradient comes from it. The model focuses on the closest impostor and ignores the easy crowd. Good when negatives are mostly easy and you want to home in on the hard ones; bad if it makes training unstable or collapses representations.
- **Large \\(\\tau\\)** (e.g. 1.0) flattens the softmax. Every negative contributes about the same. The signal is mushy and the model has trouble distinguishing semantic difficulty. Embeddings end up under-discriminative.

A practical recipe: start at \\(\\tau = 0.1\\), sweep \\(\\{0.05, 0.07, 0.1, 0.2\\}\\), pick the one with the best linear-probe accuracy on a downstream task. CLIP made \\(\\tau\\) itself a learnable parameter (with a clamp to avoid collapse), which is a fine default if you do not want to tune by hand.`,
          },
          {
            kind: 'prose',
            heading: 'Negative sampling strategies',
            body: `The quality of contrastive learning is bottlenecked by the *quality* of negatives, not just the count. Three strategies dominate.

**In-batch negatives.** The default. Every other example in the same batch is a negative. Free, easy, requires no extra bookkeeping — and the entire reason SimCLR and CLIP cared so much about huge batches. In-batch is what InfoNCE assumes unless you build something fancier.

**Hard negative mining.** Pick negatives that are already close to the anchor in embedding space — they are the ones the model is currently confused about. Hard negatives produce the steepest gradients and the fastest learning. The danger: if you mine *too* hard, you keep handing the model false negatives (examples that look similar to the anchor because they actually *are* semantically similar — two different dog photos, two paraphrases of the same sentence). Curriculum-style mining (easy → semi-hard → hard) often beats always-hardest.

**Memory bank / queue (MoCo).** Maintain a FIFO queue of the last \\(K\\) embeddings produced by a slow-moving *momentum encoder*, and use those as negatives. The momentum encoder's weights are an exponential moving average of the main encoder's weights, so its embeddings are consistent enough to be useful negatives but not identical to the live encoder's outputs. This decouples the number of negatives from the batch size — MoCo trains at batch 256 with \\(K = 65{,}536\\) negatives and matches SimCLR at batch 8192. If you cannot afford SimCLR-scale batches, this is the trick.

There is also the **BYOL / SimSiam** branch that drops negatives entirely and uses architectural asymmetry (stop-gradient + predictor head) to avoid collapse. Different lesson; the InfoNCE family is where most contrastive papers live.`,
          },
          {
            kind: 'code',
            language: 'python',
            heading: 'InfoNCE loss and a SimCLR-style training step in PyTorch',
            body: `import torch
import torch.nn as nn
import torch.nn.functional as F

# ---- InfoNCE on two L2-normalised batches (one positive pair per row) ----
def info_nce(z1, z2, temperature=0.1):
    """
    z1, z2: (N, d) — two views of the same N inputs.
    z1[i] and z2[i] are a positive pair; all other pairings are negatives.
    Returns the symmetric InfoNCE loss.
    """
    z1 = F.normalize(z1, dim=-1)      # unit vectors for cosine sim
    z2 = F.normalize(z2, dim=-1)
    N = z1.size(0)

    # similarity matrix S[i,j] = sim(z1[i], z2[j]) / tau
    logits = z1 @ z2.t() / temperature   # (N, N)
    labels = torch.arange(N, device=z1.device)   # diagonal is the positive

    # cross-entropy in both directions: image->text and text->image
    loss_12 = F.cross_entropy(logits, labels)
    loss_21 = F.cross_entropy(logits.t(), labels)
    return 0.5 * (loss_12 + loss_21)

# ---- SimCLR-style encoder + projection head ----
class SimCLRModel(nn.Module):
    def __init__(self, backbone_dim=512, proj_dim=128):
        super().__init__()
        # in real use, the backbone is a ResNet or ViT; here a stand-in MLP
        self.backbone = nn.Sequential(
            nn.Linear(3 * 32 * 32, 1024), nn.ReLU(),
            nn.Linear(1024, backbone_dim), nn.ReLU(),
        )
        # projection head: discarded after pretraining
        self.projector = nn.Sequential(
            nn.Linear(backbone_dim, backbone_dim), nn.ReLU(),
            nn.Linear(backbone_dim, proj_dim),
        )

    def forward(self, x):
        h = self.backbone(x.flatten(1))    # representation we keep
        z = self.projector(h)              # projection used by the loss
        return h, z

# ---- one training step ----
def simclr_step(model, x, augment, optimizer, tau=0.1):
    # two independent augmentations of the same batch
    x1 = augment(x)
    x2 = augment(x)

    _, z1 = model(x1)
    _, z2 = model(x2)

    loss = info_nce(z1, z2, temperature=tau)

    optimizer.zero_grad()
    loss.backward()
    optimizer.step()
    return loss.item()

# ---- toy run ----
torch.manual_seed(0)
model = SimCLRModel()
opt = torch.optim.Adam(model.parameters(), lr=3e-4)
augment = lambda t: t + 0.05 * torch.randn_like(t)   # stand-in augmentation

x = torch.rand(256, 3, 32, 32)
for step in range(5):
    loss = simclr_step(model, x, augment, opt, tau=0.1)
    print(f"step {step}  infoNCE loss = {loss:.4f}")

# After pretraining: discard model.projector, use model.backbone(x) as features.`,
          },
          {
            kind: 'prose',
            heading: 'Connections to attention and cross-entropy',
            body: `Contrastive learning is not its own island — it sits on top of two earlier lessons.

The InfoNCE denominator is a softmax over similarities, which is structurally the same operation as the **softmax over scaled dot products** at the heart of the *attention* lesson. Attention asks "given a query, which keys should I average?" Contrastive asks "given an anchor, which candidate is the real positive?" Same math, different framing. A retrieval-style attention layer is essentially running InfoNCE at inference time over a key bank.

The full loss is **cross-entropy** from the *cross-entropy* lesson, applied to a many-way classification problem whose classes are dynamically defined by the batch. There is no fixed label set, no softmax over a vocabulary. The "vocabulary" at every step is whatever happened to be in the batch alongside the anchor. That is the magic: the supervision signal regenerates itself from the data each step, so the model never runs out of labels even though no human ever wrote one down.

Once you see these connections, contrastive learning stops looking like a separate area of ML and starts looking like cross-entropy plus attention with the labels removed.`,
          },
          {
            kind: 'prose',
            heading: 'Where contrastive learning earns its keep',
            body: `Four downstream jobs ride on the back of contrastive pretraining.

**Self-supervised pretraining.** Train a vision model on unlabeled images with SimCLR or MoCo, then fine-tune (or just linear-probe) on the actual labeled task. Linear-probe accuracy on ImageNet from a SimCLR-pretrained ResNet-50 lands in the high 70s — comparable to a supervised baseline that needed all the labels. Same trick applies to sentence encoders (SimCSE, contrastive on dropout-augmented pairs) and audio (CLAP).

**Retrieval and semantic search.** Embed your entire corpus with the trained encoder, store the vectors in a vector database (FAISS, ScaNN, pgvector). At query time, embed the query and pull the nearest neighbours. Contrastive losses are *designed* for this — the embedding geometry is exactly the metric you want at retrieval time, no extra fine-tuning needed.

**Zero-shot classification (CLIP).** Use text prompts as class definitions. New class? Write a new prompt. No retraining. The standard recipe at every multimodal API right now.

**Cross-modal alignment.** Anything with two views of the same thing — image and text, audio and video, ECG signal and clinical note, code and docstring — is a contrastive learning problem waiting to be set up. Align the two encoders to a shared space and you suddenly have transferable embeddings across both modalities.

The unifying thread: contrastive learning gives you a vector space where geometric distance equals semantic distance. Once you have that, every distance-based downstream task (k-NN classification, clustering, retrieval, anomaly detection) comes nearly for free.`,
          },
          {
            kind: 'prose',
            heading: 'What to take away',
            body: `Contrastive learning is self-supervised representation learning powered by one cheap insight: **pairs you trust beat labels you don't have**. Pick a way to generate positive pairs from your data — two augmentations of the same image, a sentence and a paraphrase, an image and its caption — and treat everything else in the batch as a negative. Push the anchor and the positive close in vector space, push the negatives away.

InfoNCE is the loss everyone uses; it is cross-entropy over a softmax of similarities scaled by temperature \\(\\tau\\). SimCLR cashed this in for images with augmentation pairs and huge batches; CLIP cashed it in across image and text with two encoders aligned to one shared embedding space, which is what makes zero-shot classification work. Temperature controls how hard the model focuses on the toughest negatives; batch size (or a memory bank) controls how many negatives the model gets to learn from at all.

Sitting downstream of the *vectors*, *cross-entropy*, and *attention* lessons, contrastive learning is what happens when you take their machinery and remove the labels — and it ends up powering most of the search, retrieval, and multimodal systems shipping today.`,
          },
          {
            kind: 'prose',
            heading: 'Further reading',
            body: `- [Chen et al. — SimCLR paper](https://arxiv.org/abs/2002.05709) — "A Simple Framework for Contrastive Learning of Visual Representations"; the recipe that made contrastive image learning work without labels.
- [Radford et al. — CLIP paper](https://arxiv.org/abs/2103.00020) — "Learning Transferable Visual Models From Natural Language Supervision"; image-text contrastive pretraining at 400M pairs.
- [Lilian Weng — "Contrastive Representation Learning"](https://lilianweng.github.io/posts/2021-05-31-contrastive/) — survey of losses (InfoNCE, triplet, NT-Xent) and the methods built on them.`,
          },
        ],
      },
      {
        slug: 'gaussian',
        title: 'Gaussian distribution',
        oneLiner: 'The bell curve — the distribution sitting under weight init, VAEs, diffusion, and regression.',
        difficulty: 'foundation',
        readMinutes: 11,
        sections: [
          {
            kind: 'prose',
            heading: 'The bell curve in one line',
            body: `The Gaussian — the normal distribution — is the bell-shaped curve \\(\\mathcal{N}(\\mu, \\sigma^2)\\) with mean \\(\\mu\\) at the peak and standard deviation \\(\\sigma\\) controlling the width. Two numbers fix the entire shape: pull \\(\\mu\\) and the bell slides; pull \\(\\sigma\\) and it widens or narrows. The density at \\(x\\) is \\(\\tfrac{1}{\\sigma\\sqrt{2\\pi}} \\exp\\!\\big(-\\tfrac{(x-\\mu)^2}{2\\sigma^2}\\big)\\) — a quadratic in the exponent, normalised so the area under the curve is one.

That is the whole object. Everything that follows in this lesson is a consequence of those two parameters and that one formula.`,
          },
          {
            kind: 'prose',
            heading: 'Why Gaussian is everywhere in ML',
            body: `The Gaussian shows up so often in ML that it stops looking like a choice and starts looking like a default. Four reasons, all worth knowing.

**Central limit theorem.** Sum a lot of independent random variables — any shape, any distribution, mild conditions only — and the sum converges to a Gaussian as the number of terms grows. Weights in a layer are sums over many inputs. Gradients are sums over many examples. Pixel intensities are sums over many photons. Anywhere a quantity is built by adding up many small independent effects, the resulting distribution is already shaped like a bell, and modelling it as Gaussian is the cheapest faithful description.

**Weight initialization.** The He and Xavier initializers draw weights from \\(\\mathcal{N}(0, \\sigma^2)\\) with \\(\\sigma\\) tuned to the fan-in. The reason is the same CLT logic: the pre-activation of a neuron is a sum over many weighted inputs, so it lands near Gaussian regardless of the input distribution. Choosing Gaussian weights makes the variance of that pre-activation predictable, which is the whole point of init.

**VAE priors.** A variational autoencoder regularises its latent code towards \\(\\mathcal{N}(0, I)\\). The choice is not arbitrary: an isotropic Gaussian is the maximum-entropy distribution given a mean and a variance, so it imposes the *least* extra structure beyond those two facts. Anything else would be adding assumptions the model does not need to make.

**Diffusion noise.** The forward process in DDPM adds Gaussian noise at every step: \\(x_t = \\sqrt{1-\\beta_t}\\, x_{t-1} + \\sqrt{\\beta_t}\\, \\varepsilon\\) with \\(\\varepsilon \\sim \\mathcal{N}(0, I)\\). Because Gaussians are closed under linear combinations, the marginal at any timestep stays Gaussian and has a closed-form mean and variance, which is what makes diffusion training tractable in a single equation rather than a thousand-step simulation.

**Regression MLE.** Squared-error loss is the negative log-likelihood of a Gaussian observation model: assume \\(y = f(x) + \\varepsilon\\) with \\(\\varepsilon \\sim \\mathcal{N}(0, \\sigma^2)\\) and the log-likelihood drops, up to constants, to \\(-\\tfrac{1}{2\\sigma^2}(y - f(x))^2\\). Every model trained on MSE is implicitly assuming Gaussian residuals. That is also why MSE is the wrong loss for heavy-tailed targets: a Gaussian gives almost no mass to outliers, so a few extreme examples dominate the gradient.

The deepest reason underneath all four is the **maximum-entropy** principle. Among all distributions on the real line with a given mean and variance, the Gaussian has the highest entropy. It is the distribution that assumes the least beyond what you have specified, which is exactly the default you want when you know only the first two moments.`,
          },
          {
            kind: 'prose',
            heading: 'Worked: multivariate Gaussian PDF',
            body: `Start with the one-dimensional density:
\\[ p(x) = \\frac{1}{\\sigma\\sqrt{2\\pi}} \\exp\\!\\left(-\\frac{(x-\\mu)^2}{2\\sigma^2}\\right). \\]
Two scalars in, one number out. The normaliser \\(\\sigma\\sqrt{2\\pi}\\) is whatever makes the curve integrate to one; the exponent is a downward parabola centred at \\(\\mu\\). At \\(x = \\mu\\) the exponent is zero and the density hits its maximum \\(1/(\\sigma\\sqrt{2\\pi})\\); one standard deviation away it drops to \\(e^{-1/2} \\approx 0.607\\) of the peak.

In \\(d\\) dimensions, the mean becomes a vector \\(\\mu \\in \\mathbb{R}^d\\), the variance becomes a \\(d \\times d\\) covariance matrix \\(\\Sigma\\), and the density generalises to
\\[ p(\\mathbf{x}) = \\frac{1}{\\sqrt{(2\\pi)^d \\, |\\Sigma|}} \\exp\\!\\left(-\\tfrac{1}{2} (\\mathbf{x}-\\mu)^\\top \\Sigma^{-1} (\\mathbf{x}-\\mu)\\right). \\]
The quadratic \\((\\mathbf{x}-\\mu)^\\top \\Sigma^{-1} (\\mathbf{x}-\\mu)\\) is the Mahalanobis distance — Euclidean distance reweighted by the inverse covariance, so directions of high variance count for less. The determinant \\(|\\Sigma|\\) inside the normaliser is the "volume" of the bell; a wider distribution is shorter at its peak so the total mass still integrates to one.

**Worked 2D example.** Take \\(\\mu = (0, 0)\\) and \\(\\Sigma = \\begin{pmatrix} 1 & 0.5 \\\\ 0.5 & 1 \\end{pmatrix}\\) — unit variance on each axis, correlation \\(0.5\\). Evaluate \\(p\\) at \\(\\mathbf{x} = (1, 1)\\).

Step 1 — centre: \\(\\mathbf{x} - \\mu = (1, 1)\\).

Step 2 — determinant: \\(|\\Sigma| = (1)(1) - (0.5)(0.5) = 0.75\\).

Step 3 — inverse. For a \\(2 \\times 2\\) matrix the inverse is \\(\\Sigma^{-1} = \\tfrac{1}{|\\Sigma|} \\begin{pmatrix} 1 & -0.5 \\\\ -0.5 & 1 \\end{pmatrix} = \\tfrac{1}{0.75} \\begin{pmatrix} 1 & -0.5 \\\\ -0.5 & 1 \\end{pmatrix}\\).

Step 4 — Mahalanobis distance. Compute \\(\\Sigma^{-1}(\\mathbf{x}-\\mu)\\):
\\[ \\Sigma^{-1} \\begin{pmatrix} 1 \\\\ 1 \\end{pmatrix} = \\frac{1}{0.75} \\begin{pmatrix} 1 - 0.5 \\\\ -0.5 + 1 \\end{pmatrix} = \\frac{1}{0.75} \\begin{pmatrix} 0.5 \\\\ 0.5 \\end{pmatrix} = \\begin{pmatrix} 0.667 \\\\ 0.667 \\end{pmatrix}. \\]
Then \\((\\mathbf{x}-\\mu)^\\top \\Sigma^{-1} (\\mathbf{x}-\\mu) = (1)(0.667) + (1)(0.667) = 1.333\\). Half of that for the exponent: \\(-0.667\\).

Step 5 — assemble. The normaliser is \\(1 / (2\\pi \\sqrt{0.75}) \\approx 1/(2\\pi \\cdot 0.866) \\approx 0.184\\). The exponential is \\(\\exp(-0.667) \\approx 0.513\\). Product: \\(p(1, 1) \\approx 0.184 \\cdot 0.513 \\approx 0.094\\).

For comparison, an *uncorrelated* unit Gaussian at \\((1, 1)\\) gives \\(p = (1/2\\pi) \\exp(-1) \\approx 0.0585\\). The positive correlation makes \\((1, 1)\\) a more probable point — it lies along the high-density diagonal — exactly as the geometry of the ellipse suggests.`,
          },
          {
            kind: 'prose',
            heading: 'KL divergence between two Gaussians',
            body: `KL divergence \\(D_{\\mathrm{KL}}(p \\| q) = \\mathbb{E}_p[\\log p - \\log q]\\) measures how much extra information you need to describe samples from \\(p\\) when you only have a code for \\(q\\). For two one-dimensional Gaussians \\(p = \\mathcal{N}(\\mu_1, \\sigma_1^2)\\) and \\(q = \\mathcal{N}(\\mu_2, \\sigma_2^2)\\) the expectation works out in closed form:
\\[ D_{\\mathrm{KL}}(p \\| q) = \\log\\!\\frac{\\sigma_2}{\\sigma_1} + \\frac{\\sigma_1^2 + (\\mu_1 - \\mu_2)^2}{2\\sigma_2^2} - \\tfrac{1}{2}. \\]
Three terms: a log-ratio of standard deviations, a quadratic penalty on the mismatch in means scaled by \\(q\\)'s variance, and a constant \\(-\\tfrac{1}{2}\\) that keeps the divergence at zero when \\(p = q\\).

**The VAE special case.** A VAE's encoder emits \\(q(z \\mid x) = \\mathcal{N}(\\mu, \\sigma^2)\\) and the prior is fixed at \\(p(z) = \\mathcal{N}(0, 1)\\). Substitute \\(\\mu_2 = 0\\) and \\(\\sigma_2 = 1\\) into the formula and the algebra collapses to
\\[ D_{\\mathrm{KL}}\\big(\\mathcal{N}(\\mu, \\sigma^2) \\,\\big\\|\\, \\mathcal{N}(0, 1)\\big) = \\tfrac{1}{2}\\big(\\sigma^2 + \\mu^2 - 1 - \\log \\sigma^2\\big). \\]
This is the regulariser inside every VAE objective. Closed form, no sampling needed, differentiable with respect to \\(\\mu\\) and \\(\\sigma\\) — which is what lets the encoder receive a gradient pushing each posterior towards the unit Gaussian while reconstruction pulls it the other way.

**Two quick sanity checks.** When \\(\\mu = 0\\) and \\(\\sigma = 1\\), the two distributions are identical and \\(D_{\\mathrm{KL}} = \\tfrac{1}{2}(1 + 0 - 1 - 0) = 0\\). Pass: identical distributions cost zero extra bits. Now take \\(\\mu = 2\\) and \\(\\sigma = 0.5\\):
\\[ D_{\\mathrm{KL}} = \\tfrac{1}{2}\\big(0.25 + 4 - 1 - \\log 0.25\\big) = \\tfrac{1}{2}(3.25 + 1.386) \\approx 2.32. \\]
A narrow distribution sitting two standard deviations off the prior centre costs about \\(2.32\\) nats. The first three terms penalise the shift in mean and shrinkage of the variance; the \\(-\\log \\sigma^2\\) term blows up as \\(\\sigma \\to 0\\), which is exactly what prevents a VAE from collapsing its posterior to a delta function and ignoring the prior.`,
          },
          {
            kind: 'prose',
            heading: 'Geometric picture: contour ellipses and the 68-95-99.7 rule',
            body: `Reading the bell curve as a geometric object — not a formula — sharpens every intuition that follows. In 1D the curve has a single hump centred at \\(\\mu\\) with inflection points at \\(\\mu \\pm \\sigma\\) (the second derivative of the density flips sign there). Between those two inflection points sits roughly \\(68\\%\\) of the total area. Extend to \\(\\mu \\pm 2\\sigma\\) and the captured mass climbs to about \\(95\\%\\); \\(\\mu \\pm 3\\sigma\\) gets \\(99.7\\%\\). The "68-95-99.7" rule is not a mnemonic invented for textbooks — it is the direct numerical reading of the Gaussian CDF at one, two, and three standard deviations, and it is the rule of thumb every ML engineer reaches for when sanity-checking weight distributions or activation statistics.

In 2D the bell becomes a hill, and slicing it horizontally at any height gives an ellipse. The principal axes of that ellipse are the eigenvectors of \\(\\Sigma\\); the axis lengths are proportional to \\(\\sqrt{\\lambda_i}\\) where \\(\\lambda_i\\) are the eigenvalues. A diagonal \\(\\Sigma = \\operatorname{diag}(\\sigma_x^2, \\sigma_y^2)\\) gives an axis-aligned ellipse with semi-axes \\(\\sigma_x\\) and \\(\\sigma_y\\). Off-diagonal entries tilt the ellipse. A correlation of \\(+1\\) collapses it to a line along \\(y = x\\); a correlation of \\(0\\) leaves it axis-aligned. This is exactly what the Mahalanobis distance is measuring — it is Euclidean distance after stretching the space so that the ellipse becomes a circle.

\\[
\\text{1D area capture:} \\quad P(|X - \\mu| \\le k\\sigma) = \\{0.683, 0.954, 0.997\\} \\text{ for } k = \\{1, 2, 3\\}.
\\]

The picture extends to \\(d\\) dimensions: level sets of the density are ellipsoids. The "1-sigma ellipsoid" — the set where \\((\\mathbf{x}-\\mu)^\\top \\Sigma^{-1}(\\mathbf{x}-\\mu) = 1\\) — captures less and less of the total mass as \\(d\\) grows, because volume in high dimensions concentrates in a thin shell. By \\(d = 100\\) almost all of the probability mass of a unit Gaussian sits in a shell of radius roughly \\(\\sqrt{100} = 10\\), not near the origin. This is the **Gaussian annulus theorem**, and it is why "sample from a high-dimensional Gaussian and reconstruct" — the core of every VAE and diffusion model — works at all: the model is not trying to hit the mode at the origin, it is trying to land somewhere on the shell.`,
          },
          {
            kind: 'prose',
            heading: 'When the Gaussian assumption breaks',
            body: `Modelling something as Gaussian when it is not is the most common silent failure in ML. Three symptoms to watch for, and what to do.

**Heavy tails.** Real-world data — financial returns, click distributions, gradient norms during training of large models — often has tails that decay like a power law, not like \\(\\exp(-x^2)\\). A Gaussian gives essentially zero mass to a \\(5\\sigma\\) event; a Student-\\(t\\) with \\(\\nu = 3\\) degrees of freedom gives roughly \\(10^4\\) times more. If MSE loss is dominated by a handful of examples that drag the rest of the gradient with them, the residuals are heavy-tailed and Gaussian-MLE (squared loss) is the wrong objective. Three fixes: switch to **Huber loss** (quadratic near zero, linear in the tail), clip gradients at a fixed norm before the optimizer sees them, or model the noise explicitly with a Student-\\(t\\) likelihood and minimise its negative log-likelihood.

**Skew.** A Gaussian is symmetric around its mean. House prices, response times, file sizes, and most "count-like" data are skewed right — there is a hard floor at zero and a long tail to the right. Fitting a Gaussian gives a mean that is pulled by the tail and a variance that overcovers the left side. The cheap fix is to model \\(\\log(y)\\) instead of \\(y\\): a log-normal is exactly a Gaussian on log-scale, and most positive skewed data is close enough to log-normal for downstream tasks to work. If the variable can be zero, model \\(\\log(y + 1)\\). If the skew is left, no log fixes it — use a Beta, a Gamma, or a quantile regression instead.

**Multimodal data.** A Gaussian has exactly one peak. Fitting a single bell to a distribution with two clusters lands you a mean that sits in the *gap between the clusters* — exactly where the probability is lowest. This is how clustering with K-means goes wrong on data that is not blob-shaped, and how a VAE with a unimodal prior fails to disentangle classes. The fix is a **mixture of Gaussians**: \\(p(x) = \\sum_k \\pi_k \\mathcal{N}(x \\mid \\mu_k, \\Sigma_k)\\), fit with EM. Each Gaussian covers one mode; the mixture weights say how much mass each mode owns. VAEs that suffer from posterior collapse on multimodal data often recover when the prior is swapped from \\(\\mathcal{N}(0, I)\\) to a mixture or a learnable flow.

**Diagnostic move.** Before assuming Gaussian, plot a histogram and a Q-Q plot against \\(\\mathcal{N}(0, 1)\\). The Q-Q plot is the single most informative diagnostic: a straight line on the diagonal means Gaussian; a curve at one end means skew; both ends fanning out means heavy tails; steps mean the data is discrete or multimodal. Five seconds of plotting prevents the kind of bug where a model "looks fine" on the training loss but silently misranks the rare events that matter.`,
          },
          {
            kind: 'prose',
            heading: 'Geometric intuition: stretching space until the bell becomes a ball',
            body: `The cleanest way to see what a multivariate Gaussian is doing is to forget the formula for a moment and watch the shape transform. Start with the standard isotropic Gaussian \\(\\mathcal{N}(0, I)\\): every level set is a circle in 2D, a sphere in 3D, a hypersphere in \\(d\\) dimensions. There is no preferred direction — variance is one along every axis, correlations are zero everywhere. The density at a point depends only on its Euclidean distance from the origin, so the whole object is rotationally symmetric.

Now introduce a covariance \\(\\Sigma\\). Diagonalise it as \\(\\Sigma = U \\Lambda U^\\top\\) where \\(U\\) is a rotation matrix of eigenvectors and \\(\\Lambda = \\operatorname{diag}(\\lambda_1, \\dots, \\lambda_d)\\) holds the eigenvalues. Sampling \\(\\mathbf{x} \\sim \\mathcal{N}(0, \\Sigma)\\) is the same as drawing \\(\\mathbf{z} \\sim \\mathcal{N}(0, I)\\) and applying \\(\\mathbf{x} = U \\Lambda^{1/2} \\mathbf{z}\\). The geometry is exactly that: take the unit sphere, stretch axis \\(i\\) by \\(\\sqrt{\\lambda_i}\\) so the sphere becomes an axis-aligned ellipsoid, then rotate by \\(U\\) so the ellipsoid sits along the eigenvector directions. The Gaussian is the shadow that the standard Gaussian casts after one stretch and one rotation.

That single picture explains four things at once. **First**, the Mahalanobis distance \\((\\mathbf{x}-\\mu)^\\top \\Sigma^{-1} (\\mathbf{x}-\\mu)\\) is just the Euclidean distance after undoing the stretch — it is the squared length of \\(\\Lambda^{-1/2} U^\\top (\\mathbf{x} - \\mu)\\), the coordinate of \\(\\mathbf{x}\\) back in the original spherical frame. **Second**, the determinant \\(|\\Sigma| = \\prod_i \\lambda_i\\) is the volume of the ellipsoid, which is why it appears under the square root in the normaliser — the bell has to spread its unit of mass over more space when the ellipsoid is large. **Third**, whitening a dataset is literally inverting this stretch: compute \\(\\Sigma^{-1/2}\\) of the data, multiply, and the cloud becomes spherical again. **Fourth**, PCA falls out for free — the eigenvectors of \\(\\Sigma\\) with the largest eigenvalues are the directions of greatest variance, which are exactly the longest axes of the ellipsoid. Linear algebra and probability are the same drawing read with different captions.`,
          },
          {
            kind: 'prose',
            heading: 'Worked: fitting a Gaussian to five exam scores',
            body: `Drop the abstraction and run the smallest possible numerical example end to end. A class of five students writes a test and scores \\(\\{72, 85, 90, 78, 95\\}\\). Fit a Gaussian by maximum likelihood, compute a tail probability, and translate the result back to plain language.

**Step 1 — sample mean.** \\(\\hat{\\mu} = \\tfrac{1}{5}(72 + 85 + 90 + 78 + 95) = \\tfrac{420}{5} = 84\\). The MLE for \\(\\mu\\) is just the arithmetic mean — the derivative of the Gaussian log-likelihood with respect to \\(\\mu\\) is \\(\\sum_i (x_i - \\mu)/\\sigma^2\\), and setting that to zero gives \\(\\mu = \\bar{x}\\).

**Step 2 — sample variance (MLE).** Subtract the mean from each score: residuals are \\(-12, +1, +6, -6, +11\\). Square and average: \\(\\hat{\\sigma}^2 = \\tfrac{1}{5}(144 + 1 + 36 + 36 + 121) = \\tfrac{338}{5} = 67.6\\). Standard deviation \\(\\hat{\\sigma} = \\sqrt{67.6} \\approx 8.22\\). (The MLE divides by \\(n\\); the unbiased Bessel-corrected estimator divides by \\(n - 1\\), giving \\(\\sqrt{84.5} \\approx 9.19\\). Both are reasonable; pick the unbiased one for inference, the MLE for plug-in prediction.)

**Step 3 — density at a point.** What is \\(p(80)\\) under the fitted bell? Compute the z-score: \\(z = (80 - 84)/8.22 \\approx -0.487\\). Plug in: \\(p(80) = \\tfrac{1}{8.22 \\sqrt{2\\pi}} \\exp(-z^2/2) = \\tfrac{1}{20.61} \\exp(-0.119) \\approx 0.0485 \\cdot 0.888 \\approx 0.043\\). A score of 80 sits about half a standard deviation below the mean, in the meat of the curve, with density roughly \\(0.043\\) per point on the score axis.

**Step 4 — tail probability.** What is the chance, under the fitted model, of a score above 100? \\(z = (100 - 84)/8.22 \\approx 1.946\\). The right-tail probability \\(P(Z > 1.946)\\) from a standard normal table is roughly \\(0.0259\\), so about \\(2.6\\%\\) of students should crack 100 if this Gaussian were the true generating process. With a real maximum of 100 on the exam this is the moment to notice that a Gaussian is the wrong model — it puts mass on impossible scores. A truncated normal or a Beta on \\([0, 100]\\) would be the honest fix; the unbounded bell is a fine local approximation but lies in the tails.

**Step 5 — sanity-check the 68-95-99.7 rule.** One standard deviation around the mean is \\([75.78, 92.22]\\); three of five scores (85, 90, 78) sit inside, which is \\(60\\%\\) — close enough to \\(68\\%\\) for a sample of size five. The exercise has done two things: it has produced concrete numbers and it has exposed the modelling assumption (unbounded support) that the formula buries. Every honest use of a Gaussian carries both.`,
          },
          {
            kind: 'prose',
            heading: 'Further reading',
            body: `- [3Blue1Brown — "But what is the Central Limit Theorem?"](https://www.youtube.com/watch?v=zeJD6dqJ5lo) — the visual derivation of why sums of independent variables converge to a Gaussian.
- [Khan Academy — Normal distributions](https://www.khanacademy.org/math/statistics-probability/modeling-distributions-of-data#normal-distributions-library) — drill-style coverage of the 1D Gaussian, z-scores, and tail probabilities.
- [Kingma & Welling — Auto-Encoding Variational Bayes](https://arxiv.org/abs/1312.6114) — the VAE paper where the closed-form Gaussian KL term first lands in deep learning.`,
          },
        ],
      },
    ],
  },

  optimization: {
    title: 'Optimization',
    oneLiner: 'Gradient descent and its zoo of variants — SGD, momentum, RMSprop, Adam.',
    iconName: 'Workflow',
    lessons: [
      {
        slug: 'gradient-descent',
        title: 'Gradient descent',
        oneLiner: 'Walk downhill, one step at a time. The optimizer behind 99% of trained models.',
        difficulty: 'foundation',
        readMinutes: 11,
        sections: [
          {
            kind: 'prose',
            heading: 'The loss landscape',
            body: `Training a model is a search problem. You have a function — the **loss** — that takes the model's parameters \\(\\theta\\) and returns a single number measuring how badly the model is doing on the data. The smaller the number, the better the model. The job of optimization is to find the \\(\\theta\\) that minimises it.

Picture the loss as a landscape. Each axis is one of the parameters, the height at every point is the loss. With two parameters you can actually draw it — a surface with peaks, valleys, ridges, plateaus. With a billion parameters (a modern LLM) you cannot draw it, but the geometry is still there. Somewhere in that landscape sits the lowest point you can reach, and that point is the trained model.

You cannot see the whole landscape. You only know two things at any given location: how high you are, and which way is *steepest*. Gradient descent is the strategy that uses just those two pieces of information to walk downhill — no map, no global view, just one step at a time in the direction that drops the loss fastest. That is the entire algorithm. Every optimizer in deep learning is a variation on that single idea.`,
          },
          {
            kind: 'prose',
            heading: 'The loss landscape, pictured honestly',
            body: `Take a network with exactly two weights, \\(w_1\\) and \\(w_2\\). Draw a 2D map of weight space — \\(w_1\\) on the horizontal axis, \\(w_2\\) on the vertical. Above every point on that map, plot the loss as height. You get a surface: hills where the network does badly, valleys where it does well, ridges that separate two basins, plateaus where the loss barely changes for thousands of parameter combinations. This is the picture every textbook draws because it is the only one a human eye can hold.

Now scale up. A real network has billions of weights, not two. The map is no longer a sheet of paper but a billion-dimensional cube; the loss is still a single number sitting above every point in that cube. The picture is unvisualizable, but the geometry is exactly the same. There are still valleys, still ridges, still saddle points. The intuition partially generalizes — descent still means "go down" — and partially does not, which is the entire reason this lesson exists.

The gradient \\(\\nabla L\\) is a vector with one entry per weight. Each component answers a single, sharp question: *how much does the loss change if I nudge THIS weight up by an infinitesimal amount, holding every other weight fixed?* Stack a billion of those numbers together and you have a vector that points in the direction of steepest ascent, measured locally, at this exact point in weight space. Walk in the direction of \\(-\\nabla L\\), the negation, and you are walking downhill faster than in any other direction of the same length.

A 3Blue1Brown observation worth sitting with: in a billion-dimensional space, *most* directions a random unit vector could pick are nearly flat — the loss barely changes if you walk that way. The few directions that aren't flat are the ones doing all the work. Gradient descent finds them automatically; it does not waste a single step on the flat directions, because their gradient components are tiny and the update barely touches those weights. That is why even momentum-free SGD makes steady progress in spaces this large — the geometry is sparse enough that following the gradient is already most of the win.`,
          },
          {
            kind: 'prose',
            heading: 'Worked: minimize L(w) = (w − 3)²',
            body: `Pick the simplest non-trivial loss: \\(L(w) = (w - 3)^2\\). Its minimum sits at \\(w = 3\\). The derivative is \\(L'(w) = 2(w - 3)\\), and the update rule is \\(w \\leftarrow w - \\alpha \\cdot L'(w)\\), where \\(\\alpha\\) is the learning rate.

Start at \\(w = 0\\) with \\(\\alpha = 0.1\\). Walk through the first five steps by hand:

- Step 1: \\(L'(0) = -6\\), so \\(w = 0 - 0.1 \\cdot (-6) = 0.6\\).
- Step 2: \\(L'(0.6) = -4.8\\), so \\(w = 0.6 - 0.1 \\cdot (-4.8) = 1.08\\).
- Step 3: \\(L'(1.08) = -3.84\\), so \\(w = 1.08 - 0.1 \\cdot (-3.84) = 1.464\\).
- Step 4: \\(L'(1.464) = -3.072\\), so \\(w \\approx 1.77\\).
- Step 5: \\(L'(1.77) \\approx -2.458\\), so \\(w \\approx 2.02\\).

Continue for five more steps and \\(w\\) marches steadily: \\(2.22, 2.37, 2.50, 2.60, 2.68\\), tightening toward \\(3\\) without ever overshooting. The distance to the minimum shrinks by a constant factor every step — geometric convergence, the best possible behavior for a smooth convex loss.

Now rerun the same problem with \\(\\alpha = 1.0\\). Step 1 lands at \\(w = 0 - 1.0 \\cdot (-6) = 6\\), already past the minimum on the other side. Step 2 lands back at \\(w = 0\\). The trajectory bounces between \\(0\\) and \\(6\\) forever — the step size exactly matches the curvature, so descent becomes an oscillation that never reaches the bottom.

Push to \\(\\alpha = 2.0\\) and it gets worse. Step 1: \\(w = 0 - 2.0 \\cdot (-6) = 12\\). Step 2: \\(w = 12 - 2.0 \\cdot 18 = -24\\). Step 3: \\(w = -24 - 2.0 \\cdot (-54) = 84\\). The iterates diverge, each step further from the minimum than the last. The loss explodes. This is the entire intuition for learning rate: small enough that local curvature does not flip the sign of progress, large enough to actually move.`,
          },
          {
            kind: 'prose',
            heading: 'What ∇ means in 3D',
            body: `Step up one dimension. Consider a loss surface \\(f(x, y)\\) — a hill sitting over the \\(xy\\) plane. The gradient is now a two-component vector:

\\[
\\nabla f = \\left( \\frac{\\partial f}{\\partial x}, \\; \\frac{\\partial f}{\\partial y} \\right)
\\]

Stand on the surface at some point and look at the arrow \\(\\nabla f\\) painted on the ground beneath you. It points in the direction of steepest ascent *on the surface* — the compass bearing you would take if you wanted to gain altitude as fast as possible. Walk \\(180°\\) the other way, in the direction of \\(-\\nabla f\\), and you descend as fast as possible. Walk perpendicular to \\(\\nabla f\\) and you stay on a contour line — the altitude does not change.

The magnitude \\(\\|\\nabla f\\|\\) tells you *how steep* that steepest direction is. A small magnitude means the surface is nearly flat at this point; a large magnitude means you are on a cliff face. Optimizers exploit this directly: a big gradient earns a big update, a small gradient earns a small update.

Khan-style worked example: take \\(f(x, y) = x^2 + 2y^2\\). The partials are \\(\\partial f / \\partial x = 2x\\) and \\(\\partial f / \\partial y = 4y\\). At the point \\((1, 1)\\):

\\[
\\nabla f(1, 1) = (2, 4)
\\]

The \\(y\\) component is twice the \\(x\\) component. Uphill is heavily skewed in the \\(y\\) direction — because \\(y\\) carries a coefficient of \\(2\\) in the loss, a small change in \\(y\\) raises the loss faster than the same change in \\(x\\). Plain SGD takes a single step \\(-\\alpha (2, 4)\\), which means it moves twice as far in \\(y\\) as in \\(x\\). On a narrow ravine that is exactly wrong: you overshoot the short axis and crawl along the long one.

This is precisely why imbalanced features make Adam outperform SGD. Adam keeps a running estimate of \\(\\|\\nabla f\\|^2\\) per coordinate and divides each update by it, rescaling so that big-gradient and small-gradient coordinates take comparably sized steps. The geometry of \\(\\nabla\\) — that its components can differ by orders of magnitude across parameters — is the entire reason adaptive optimizers exist.`,
          },
          {
            kind: 'prose',
            heading: 'Why steepest descent is not the shortest path',
            body: `The gradient is the direction of steepest descent at the point you are standing on, and that is not the same thing as the direction of the minimum. The 3Blue1Brown picture worth carrying around is two ellipses on a contour map. The function is \\(f(x, y) = x^2 + 10 y^2\\) — a bowl that is stretched ten times more along \\(y\\) than along \\(x\\). The contours are ellipses, narrow vertically, wide horizontally. The minimum sits at the origin. Stand at the point \\((1, 1)\\) and look at the gradient \\(\\nabla f(1, 1) = (2, 20)\\). It points almost straight up — the \\(y\\) component is ten times the \\(x\\) component because the surface drops ten times faster in \\(y\\). Yet the *minimum* sits at the origin, on a line through \\((1, 1)\\) whose direction is roughly \\((1, 1) / \\sqrt 2\\). Walking along \\(-\\nabla f\\) and walking toward the minimum are two different journeys.

Gradient descent takes the first journey, repeatedly. From \\((1, 1)\\) it overshoots in \\(y\\) and undershoots in \\(x\\), lands across the valley at something like \\((0.9, -0.8)\\), then the gradient points the other way and the iterate zig-zags back. Each step plants its foot perpendicular to the contour line it stands on, which is *not* the line through the minimum on an anisotropic surface. The trajectory bounces between the steep walls of the valley while crawling along its long axis. The narrower the valley, the worse the bouncing — the iteration count to reach the minimum scales like the **condition number** of the Hessian, the ratio of largest to smallest curvature. A condition number of \\(10\\) costs you a factor of ten in iterations over a perfect circle; a condition number of \\(1000\\), a factor of a thousand.

The geometry is honest about what gradient descent does and does not know. It knows the steepest direction at the current point — that is the gradient. It does not know how *long* that steepness lasts in any direction. The Hessian, the matrix of second derivatives, carries that information. Newton's method uses the Hessian to step toward the minimum directly: \\(\\theta \\leftarrow \\theta - H^{-1} \\nabla f\\). One step on the quadratic bowl above lands exactly at the origin, regardless of the condition number — the Hessian rescales the step so each axis converges at the same rate. The price is computing and inverting an \\(n \\times n\\) Hessian, which for a million-parameter model is impossible.

Every modern optimiser is a cheaper approximation of that idea. Momentum averages out the perpendicular bounce so the along-valley component reinforces step by step. Adam tracks the variance of each coordinate's gradient and divides by its square root, which is a rough per-coordinate Hessian estimate without the cross-terms. AdamW, RMSprop, Adafactor, Shampoo — all of them are trying to build a cheap surrogate for the rescaling Newton's method does exactly. Knowing that gradient descent does not point at the minimum is the entire reason this lineage exists.`,
          },
          {
            kind: 'prose',
            heading: 'Khan-style worked example: descent on f(x, y) = x² + 10y²',
            body: `Walk the anisotropic bowl by hand. The function is \\(f(x, y) = x^2 + 10 y^2\\). The partial derivatives are \\(\\partial f / \\partial x = 2 x\\) and \\(\\partial f / \\partial y = 20 y\\), so the gradient at any point \\((x, y)\\) is \\(\\nabla f = (2 x,\\, 20 y)\\). The minimum sits at the origin with \\(f(0, 0) = 0\\).

Start at \\((1, 1)\\) with learning rate \\(\\alpha = 0.05\\). The first gradient is \\(\\nabla f(1, 1) = (2, 20)\\). The update rule \\((x, y) \\leftarrow (x, y) - \\alpha \\nabla f\\) gives \\(x_1 = 1 - 0.05 \\cdot 2 = 0.9\\) and \\(y_1 = 1 - 0.05 \\cdot 20 = 0\\). One step along \\(y\\) erased the whole \\(y\\)-coordinate; one step along \\(x\\) shaved off ten percent. The new loss is \\(f(0.9, 0) = 0.81\\), down from \\(f(1, 1) = 11\\). Big drop, almost entirely from the \\(y\\) coordinate.

Continue. At \\((0.9, 0)\\) the gradient is \\((1.8, 0)\\), so the next iterate is \\((0.81, 0)\\). After that \\((0.729, 0)\\), then \\((0.6561, 0)\\), and so on — geometric convergence along \\(x\\) at rate \\(0.9\\), with the \\(y\\) coordinate frozen at zero. After ten steps \\(x \\approx 0.349\\); after twenty \\(x \\approx 0.122\\); after fifty \\(x \\approx 0.005\\). The first step solved the easy direction. The remaining work is the slow grind along the long axis.

Now break the example. Raise the learning rate to \\(\\alpha = 0.06\\) — only a twenty-percent bump. The first \\(y\\)-update is \\(y_1 = 1 - 0.06 \\cdot 20 = -0.2\\). The iterate is \\((0.88, -0.2)\\); the gradient is now \\((1.76, -4)\\); the next iterate becomes \\((0.7744, 0.04)\\). The \\(y\\) coordinate has crossed zero and is now positive, with the next gradient pointing back negative. Each \\(y\\)-step overshoots the minimum and lands on the opposite wall — the iteration is bouncing across the valley while the \\(x\\)-component slowly descends. After ten steps \\(x \\approx 0.305\\) and \\(y\\) is oscillating between \\(\\pm 0.04\\), nowhere near the floor. The same learning rate that converges cleanly on the \\(x\\)-axis diverges in spirit on the \\(y\\)-axis, even though the algorithm and the function have not changed.

Push to \\(\\alpha = 0.11\\) and the \\(y\\)-iteration diverges absolutely: \\(y_1 = 1 - 0.11 \\cdot 20 = -1.2\\), then \\(y_2 = -1.2 - 0.11 \\cdot (-24) = 1.44\\), then \\(y_3 = -1.728\\), each step further from the minimum than the last. The loss explodes geometrically. The stability condition is exact: for the quadratic \\(\\tfrac{1}{2} \\beta y^2\\), gradient descent converges only when \\(\\alpha < 2 / \\beta\\), here \\(\\alpha < 0.1\\). The same learning rate the \\(x\\)-axis tolerates up to \\(\\alpha < 1\\) the \\(y\\)-axis rejects above \\(0.1\\). The two axes set different ceilings, and the global learning rate must satisfy the tighter one — so the \\(x\\)-axis is forced to crawl at a tenth of the rate it could have used in isolation. That mismatch, by an exact factor of ten in this example, is the condition number of the Hessian \\(\\operatorname{diag}(2, 20)\\) showing up as wall-clock penalty.`,
          },
          {
            kind: 'math',
            heading: 'The gradient is the direction of steepest ascent',
            body: `The **gradient** of a scalar function \\(f(\\theta)\\) is the vector of its partial derivatives:

\\[
\\nabla f(\\theta) = \\left[ \\frac{\\partial f}{\\partial \\theta_1}, \\frac{\\partial f}{\\partial \\theta_2}, \\ldots, \\frac{\\partial f}{\\partial \\theta_n} \\right]
\\]

Two facts about this vector are everything you need:

1. It **points in the direction of steepest ascent** of \\(f\\). If you take an infinitesimal step in the direction of \\(\\nabla f\\), the loss goes *up* faster than in any other direction of the same length.
2. Its **magnitude** is the slope of that steepest ascent.

So if you want to go *down* — which you do, because you are minimising — you step in the *negative* gradient direction. That is why every optimizer you have ever seen has a minus sign in it. The gradient tells you the worst direction; you negate it.`,
          },
          {
            kind: 'viz',
            heading: '1D picture — rolling down a parabola',
            component: 'ParabolaDescentViz',
            props: {},
          },
          {
            kind: 'math',
            heading: 'The update rule',
            body: `Put the two pieces together and you get the update rule that all of deep learning runs on:

\\[
\\theta \\;\\leftarrow\\; \\theta \\;-\\; \\eta \\, \\nabla f(\\theta)
\\]

In words: new parameters equal old parameters minus a small fraction of the gradient. The fraction \\(\\eta\\) is called the **learning rate** (or step size). Typical values: \\(10^{-1}\\) for shallow models on clean data, \\(10^{-3}\\) for most deep networks with Adam, \\(10^{-5}\\) for fine-tuning a pretrained language model.

That is the entire algorithm. Compute the gradient, take a small step against it, repeat until the loss stops dropping. SGD, momentum, RMSprop, Adam, AdamW, Lion — every one of them is this same line with extra machinery bolted on to choose \\(\\eta\\) more cleverly or to remember where you were heading before.`,
          },
          {
            kind: 'viz',
            component: 'GradientDescent',
            props: {},
            heading: 'Drag the ball. Click Step. Watch it find the minimum.',
          },
          {
            kind: 'callout',
            tone: 'tip',
            body: `**Learning rate too high and the loss explodes.** If \\(\\eta\\) is larger than the curvature of the landscape can tolerate, every step *overshoots* the bottom of the valley and lands higher up the opposite wall. The next step overshoots again, even worse. The loss diverges to infinity in a handful of iterations — you will see it as \`NaN\` in the logs. When a brand-new training run NaNs out within 50 steps, the learning rate is the first thing to halve.`,
          },
          {
            kind: 'code',
            language: 'python',
            heading: 'Gradient descent on f(x) = 0.5 * x² in NumPy',
            body: `import numpy as np

# the function we want to minimise, and its gradient
def f(x):       return 0.5 * x ** 2
def grad(x):    return x          # d/dx (0.5 x^2) = x

# starting point, learning rate, step budget
x   = 4.0
lr  = 0.3
steps = 15

print(f"{'step':>4}  {'x':>10}  {'f(x)':>10}  {'grad':>10}")
for t in range(steps):
    g = grad(x)
    print(f"{t:>4}  {x:>10.4f}  {f(x):>10.4f}  {g:>10.4f}")
    x = x - lr * g                 # the update rule

print(f"{steps:>4}  {x:>10.4f}  {f(x):>10.4f}")

# expected: x marches geometrically toward 0, loss collapses fast.
# step  0:  x = 4.0000   f = 8.0000
# step  1:  x = 2.8000   f = 3.9200
# step  2:  x = 1.9600   f = 1.9208
# ...
# step 15:  x ≈ 0.0122   f ≈ 0.0001

# try lr = 2.1 to see divergence: each step overshoots further than the last.`,
          },
          {
            kind: 'prose',
            heading: 'Convex vs non-convex — when the algorithm is honest',
            body: `A function is **convex** if every line segment between two points on its graph lies above the graph — informally, it has one bowl-shaped valley and no other dips. Linear regression with mean-squared error, logistic regression, SVMs with the hinge loss — all convex. On a convex loss, gradient descent with a sensible learning rate is *guaranteed* to converge to the global minimum. There is no other minimum to get stuck in.

Neural networks are not convex. The loss surface of a deep model has saddle points (flat in some directions, descending in others), local minima (small dips that are not the lowest point), and vast plateaus where the gradient is nearly zero. Strictly speaking, gradient descent on a non-convex loss has no guarantee of finding the global minimum at all.

In practice it works anyway, for two reasons. First, in very high dimensions, true local minima are rare — almost every critical point is a saddle, and saddles are escapable because at least one direction still slopes down. Second, the local minima that exist tend to be "good enough": empirically the network generalises about as well from any of them. You stopped caring about the global minimum the moment you decided "training to convergence" meant "stops improving on a validation set."`,
          },
          {
            kind: 'callout',
            tone: 'note',
            body: `**Non-convex losses do not have one answer.** Two training runs of the same architecture on the same data with different random seeds will land in *different* minima with different weights. They will usually have similar validation loss, but they are not the same model — ensembling them often gives a measurable bump for exactly that reason.`,
          },
          {
            kind: 'prose',
            heading: 'Why everyone uses stochastic gradient descent',
            body: `The gradient \\(\\nabla f(\\theta)\\) is, properly, an average over the *entire training set* — every example contributes a term, and you sum them. For a dataset with millions of examples that is prohibitively expensive: one gradient evaluation costs one full pass through the data, and you need thousands of them.

**Stochastic gradient descent (SGD)** estimates the gradient using a small random subset — a **mini-batch** of, say, 32 to 1024 examples — and uses that estimate as if it were the true gradient. The estimate is noisy: any given mini-batch will pull you in a slightly different direction than the full dataset would. But it is *unbiased* (averaged over many mini-batches, it equals the true gradient), and it is *cheap* (one mini-batch step costs the same as evaluating the model on 32 examples, not 32 million).

The noise is not just tolerated; it is sometimes useful. A noisy step can knock you out of a shallow local minimum or off a saddle point that a clean full-batch step would have stalled on. Most modern optimizers — Adam, AdamW — are SGD variants with adaptive per-parameter learning rates layered on top. The "stochastic" part is non-negotiable; the rest is engineering on top.`,
          },
          {
            kind: 'viz',
            heading: 'Gradient accumulation — a big batch on a small GPU, one micro-batch at a time',
            component: 'GradientAccumulationViz',
          },
          {
            kind: 'prose',
            heading: 'When gradient descent fails',
            body: `Three failure modes show up often enough that recognising them is half the battle:

1. **Vanishing gradients.** In a deep network with the wrong activation or initialisation, gradients shrink by a constant factor at every layer as they propagate backward. By the time they reach the first layer they are effectively zero, and that layer never updates. The model "trains" but the early features are random forever. The fix is ReLU-family activations, careful initialisation (He, Xavier), residual connections, normalisation.

2. **Exploding gradients.** The mirror image: gradients grow at every layer and the early-layer updates become huge, throwing the parameters somewhere absurd. Loss NaNs out within a few steps. The fix is gradient clipping — cap the global gradient norm at some threshold (commonly 1.0) before applying it. Recurrent networks need this almost always; transformers usually do.

3. **Plateaus.** The gradient is small for hundreds of steps and the loss barely changes, then suddenly drops. This is normal — the optimizer is crossing a flat region of the landscape — but it can look like training has died. Adaptive optimizers (Adam, RMSprop) handle plateaus better than vanilla SGD because their per-parameter step sizes grow when the recent gradients have been small.

If your training run is stuck, your first three diagnostics should be: check the gradient norm (vanishing or exploding?), halve the learning rate (overshooting?), and look at the loss curve scale on a log axis (it might be making progress invisible on a linear plot).`,
          },
          {
            kind: 'prose',
            heading: 'What to take away',
            body: `Gradient descent is one line: subtract a small multiple of the gradient from the parameters, repeat. The gradient points uphill; you go the other way. The learning rate is the single most important hyperparameter — too small wastes wall-clock time, too large diverges. Convex losses give guarantees; non-convex losses do not, but the algorithm works anyway because high-dimensional landscapes are kinder to it than the textbook 2D picture suggests.

The next lessons in this pillar add memory and adaptivity to the basic loop: **momentum** remembers the recent direction so you can power through plateaus, **RMSprop** rescales per parameter so the learning rate stops being a single global number, and **Adam** combines both. Every one of them is still gradient descent underneath.`,
          },
          {
            kind: 'prose',
            heading: 'Further reading',
            body: `- [3Blue1Brown — "Gradient descent, how neural networks learn"](https://www.youtube.com/watch?v=IHZwWFHWa-w) — the visual mental model: a ball rolling down a loss surface, in two and many dimensions.
- [Khan Academy — Multivariable derivatives](https://www.khanacademy.org/math/multivariable-calculus/multivariable-derivatives) — the calculus underneath (gradients, partial derivatives, directional derivatives).
- [Sebastian Ruder — "An overview of gradient descent optimization algorithms"](https://www.ruder.io/optimizing-gradient-descent/) — the cleanest survey of the GD family beyond vanilla SGD.`,
          },
        ],
      },
      {
        slug: 'optimizer-zoo',
        title: 'The optimizer zoo: SGD → Adam',
        oneLiner: 'Five optimizers, five tradeoffs. The cheat sheet you will come back to.',
        difficulty: 'intermediate',
        readMinutes: 12,
        sections: [
          {
            kind: 'prose',
            heading: 'Why one update rule was never going to be enough',
            body: `Vanilla gradient descent has exactly one knob: the learning rate \\(\\eta\\). One number, applied to every parameter, at every step, for the whole run. That single number has to be small enough that the loss does not diverge on the sharpest curvature in the landscape, but large enough that you actually finish training before the deadline. Those two requirements fight each other.

The trouble is that real loss landscapes are not isotropic bowls. One direction might be a steep narrow ravine; another, a wide flat plateau. A learning rate sized for the ravine crawls across the plateau; a learning rate sized for the plateau bounces off the ravine walls. The same \\(\\eta\\) is wrong in both places at once, and the contradiction gets worse as the parameter count grows.

The optimizer zoo is a sequence of attempts to fix this. Each variant keeps the negative-gradient skeleton from the previous lesson and adds one more piece of bookkeeping — a velocity, a per-parameter scale, a bias correction. By the time you reach Adam there are four extra state tensors and three hyperparameters to tune, but every line is still a small step against the gradient. Knowing which extras matter when is what separates a clean training run from a week of \`NaN\` debugging.`,
          },
          {
            kind: 'prose',
            heading: 'SGD with momentum — physical intuition',
            body: `Vanilla SGD is one line: \\(w \\leftarrow w - \\alpha \\, g\\). Pick a learning rate \\(\\alpha\\), subtract the gradient, repeat. The update has no memory of the last step, no record of which directions have been productive, no way to recognise that the loss surface has shape beyond what the current gradient is reporting. That memorylessness is what makes it slow.

The two failure modes are easy to picture. In a narrow valley — short axis steep, long axis shallow — the gradient at every point is dominated by the wall on the short axis. Vanilla SGD bounces between the walls, taking a tiny step along the floor of the valley between each bounce. In a shallow region, the gradient itself is small, so the step is small, so progress crawls even though you could safely take much larger steps without overshooting anything.

**Momentum** carries a velocity vector \\(v\\) and updates it with each gradient:

\\[
v \\leftarrow \\mu \\, v - \\alpha \\, g, \\qquad w \\leftarrow w + v
\\]

The hyperparameter \\(\\mu \\in [0.9, 0.99]\\) controls how much of the previous velocity survives. Past gradients accumulate as a running "velocity" — when consecutive steps point the same way, contributions reinforce and the effective step grows; when they flip sign step-to-step (the zig-zag across a valley), contributions cancel and only the consistent component survives.

The mechanics map cleanly onto physics. A ball rolling down a hill builds up speed in the direction of consistent slope, and its inertia carries it through small bumps and across short uphill stretches. Vanilla SGD is a ball that gets teleported to rest after every step; momentum lets it actually roll.

**Nesterov momentum** sharpens the idea further. Instead of evaluating the gradient at the current position, peek ahead by \\(\\mu \\cdot v\\) — to where pure inertia would carry you — and compute the gradient *there*. That lookahead gives a correction term that brakes the velocity before you overshoot a minimum, instead of after. The convergence guarantee is provably better for convex problems, and in practice it is a free swap for plain momentum at the same per-step cost.`,
          },
          {
            kind: 'prose',
            heading: 'Adam — per-parameter learning rates, worked step by step',
            body: `Vanilla SGD applies the same learning rate to every parameter. Adam does not. It keeps running averages of *two* quantities per parameter — the gradient itself, and the squared gradient — and uses them together to produce a per-parameter effective step.

The two moments are exponential moving averages:

\\[
m_t = \\beta_1 \\, m_{t-1} + (1 - \\beta_1) \\, g_t \\qquad \\text{(first moment, momentum-style)}
\\]

\\[
v_t = \\beta_2 \\, v_{t-1} + (1 - \\beta_2) \\, g_t^{\\,2} \\qquad \\text{(second moment, gradient magnitude)}
\\]

Both \\(m_t\\) and \\(v_t\\) start at zero, which biases them toward zero for the first few hundred steps. Adam corrects for this with the bias-corrected estimates \\(\\hat{m}_t = m_t / (1 - \\beta_1^t)\\) and \\(\\hat{v}_t = v_t / (1 - \\beta_2^t)\\). The update is then:

\\[
w \\leftarrow w - \\alpha \\, \\frac{\\hat{m}_t}{\\sqrt{\\hat{v}_t} + \\epsilon}
\\]

What this buys you is **per-parameter learning rates**. Parameters that are updated frequently with large gradients accumulate a large running \\(v_t\\), so the denominator grows and their effective step *shrinks*. Parameters that are rarely-updated keep a small \\(v_t\\), so the denominator stays small and their effective step *grows*. Adam self-tunes the learning rate per coordinate, every step, with no human in the loop.

The defaults are nearly never worth changing: \\(\\beta_1 = 0.9\\), \\(\\beta_2 = 0.999\\), \\(\\epsilon = 10^{-8}\\).

**Worked step.** Suppose at step 100, the gradient on some parameter is \\(g_t = 0.1\\), with \\(\\beta_1 = 0.9\\). Then \\(m_t = 0.9 \\cdot m_{99} + 0.1 \\cdot 0.1\\). If the previous first-moment estimate was \\(m_{99} = 0.05\\), the new value is \\(m_t = 0.045 + 0.01 = 0.055\\). The bias correction divides by \\(1 - 0.9^{100} \\approx 1.0\\) — by step 100 the bias is effectively gone — so \\(\\hat{m}_t = 0.055\\). The same arithmetic on the second moment with \\(\\beta_2 = 0.999\\) gives a smoothly tracked estimate of \\(g_t^{\\,2}\\), and the ratio \\(\\hat{m}_t / (\\sqrt{\\hat{v}_t} + \\epsilon)\\) is the per-parameter step direction and size for this coordinate.`,
          },
          {
            kind: 'prose',
            heading: 'AdamW and modern variants',
            body: `Original Adam has one defect that took years to fix. When you add an L2 penalty \\(\\tfrac{\\lambda}{2} \\|w\\|^2\\) to the loss, the gradient picks up a \\(\\lambda w\\) term, and Adam folds that term into \\(g_t\\) *before* the per-parameter rescaling by \\(\\sqrt{\\hat{v}_t}\\). The result: parameters with large running \\(v_t\\) get *less* weight decay than parameters with small running \\(v_t\\). Coupling decay to the adaptive rescale is not what L2 regularisation is supposed to mean — it silently breaks the regulariser.

**AdamW** decouples the two. The adaptive part of Adam operates only on the loss gradient; the weight decay is applied directly to the weights as a separate uniform shrink, not routed through the gradient:

\\[
w \\leftarrow w - \\alpha \\Big( \\frac{\\hat{m}_t}{\\sqrt{\\hat{v}_t} + \\epsilon} + \\lambda \\, w \\Big)
\\]

That single change restores actual L2 regularisation, not the broken-Adam version, and it is the standard choice for every modern transformer training pipeline.

The frontier keeps moving. **Lion** (Google, 2023) drops the second-moment buffer entirely and uses only the sign of a momentum-style EMA — half the optimizer state of Adam, competitive results on large models when the learning rate is dropped by a factor of 3-10. **Shampoo** uses a full-matrix preconditioner instead of a per-coordinate scale; slower per step, but better convergence on the largest training runs. **Adafactor** is a memory-efficient Adam variant that factorises the second-moment matrix, designed for training models so large the optimizer state itself is the bottleneck.

The recipe modern LLM training has converged on is unromantic: **AdamW with a linear warmup followed by cosine decay** on the learning rate. The same three lines train almost every public foundation model. Optimizer sophistication has moved into the schedule, not the update rule.`,
          },
          {
            kind: 'math',
            heading: 'Vanilla SGD — the baseline everything is measured against',
            body: `**Stochastic gradient descent** is the rule from the previous lesson, applied to a mini-batch gradient \\(g_t = \\nabla_\\theta L(\\theta_t; \\text{batch}_t)\\):

\\[
\\theta_{t+1} = \\theta_t - \\eta \\, g_t
\\]

That is the entire update. No memory of previous steps, no per-parameter scaling, no second moment. State per parameter: zero. Hyperparameters: just \\(\\eta\\).

SGD's failure mode is its silence about geometry. It will happily zig-zag across a narrow ravine because the gradient flips sign every step on the short axis while still slowly progressing along the long axis. It also has nothing to say about plateaus — when \\(g_t \\approx 0\\) over a flat region, the step size collapses too and the run looks stuck even though there is structure to find on the other side.

Still, vanilla SGD with a hand-tuned learning-rate schedule (warmup + cosine decay, say) trains some of the best vision models in the world. The reason it is still in the toolkit is that the noise in the gradient estimate acts as an implicit regularizer; the noisier path often generalises *better* than a cleaner optimiser would.`,
          },
          {
            kind: 'math',
            heading: 'SGD with momentum — remember which way you were going',
            body: `**Momentum** carries a running average of the recent gradients in a velocity vector \\(v_t\\), and steps along the velocity instead of the raw gradient:

\\[
\\begin{aligned}
v_{t+1} &= \\beta \\, v_t + g_t \\\\
\\theta_{t+1} &= \\theta_t - \\eta \\, v_{t+1}
\\end{aligned}
\\]

\\(\\beta\\) is the **momentum coefficient**, typically \\(0.9\\). On consecutive steps where the gradient points roughly the same way, the velocity grows — successive contributions reinforce each other — and you accelerate down the slope. When the gradient flips sign step-to-step (the zig-zag across a ravine), the contributions cancel in the velocity and only the consistent long-axis direction survives.

The intuition that nails it: a ball rolling downhill carries inertia. Vanilla SGD is a ball that gets teleported back to a standstill after every step; momentum lets it actually roll. State per parameter: one extra tensor \\(v\\). One extra hyperparameter \\(\\beta\\). One of the highest-impact, lowest-cost upgrades in optimization.`,
          },
          { kind: 'viz', heading: 'Why momentum kills the zig-zag', component: 'MomentumZigzagViz' },
          {
            kind: 'math',
            heading: 'Nesterov accelerated gradient — look before you leap',
            body: `**Nesterov momentum** changes one detail: evaluate the gradient at the point you are *about to step to* under pure inertia, not at where you are now. The cleanest form:

\\[
\\begin{aligned}
v_{t+1} &= \\beta \\, v_t + \\nabla_\\theta L(\\theta_t - \\eta \\beta \\, v_t) \\\\
\\theta_{t+1} &= \\theta_t - \\eta \\, v_{t+1}
\\end{aligned}
\\]

The "lookahead" point \\(\\theta_t - \\eta \\beta v_t\\) is where momentum alone would carry you with no fresh gradient input. Computing the gradient *there* gives you a correction term that brakes the velocity before you overshoot a minimum, instead of after.

For convex problems Nesterov gives a provably better convergence rate than plain momentum. For deep networks the gain is smaller and largely empirical, but it is a free win in most frameworks — PyTorch's \`SGD(momentum=0.9, nesterov=True)\` is the same cost per step as the non-Nesterov version. Same hyperparameters \\(\\beta\\) and \\(\\eta\\), same state tensor \\(v\\).`,
          },
          {
            kind: 'math',
            heading: 'AdaGrad — per-parameter learning rates from sum-of-squared-gradients',
            body: `**AdaGrad** is the first optimizer to give every parameter its own effective learning rate. It accumulates the *sum of squared gradients seen so far*, per parameter, and divides the update by its square root:

\\[
\\begin{aligned}
G_{t+1} &= G_t + g_t \\odot g_t \\\\
\\theta_{t+1} &= \\theta_t - \\frac{\\eta}{\\sqrt{G_{t+1}} + \\epsilon} \\odot g_t
\\end{aligned}
\\]

\\(\\odot\\) is element-wise. Parameters whose gradients have been large historically get small effective steps; parameters whose gradients have been consistently small get large effective steps. This is exactly what you want for sparse problems (NLP with bag-of-words features, recommender embeddings) where most parameters move rarely but a few move every step.

The killer flaw: \\(G_t\\) is monotonically non-decreasing, so the effective learning rate *only ever shrinks*. After enough steps the denominator dominates and the model freezes — even if there is still loss to push down. AdaGrad is excellent for convex problems with sparse gradients and short training runs; it is the wrong tool for the long, dense training runs that deep learning actually does.`,
          },
          {
            kind: 'math',
            heading: 'RMSprop — fix AdaGrad by forgetting old gradients',
            body: `**RMSprop** keeps AdaGrad's per-parameter scaling idea but replaces the unbounded sum with an *exponential moving average* of squared gradients:

\\[
\\begin{aligned}
G_{t+1} &= \\rho \\, G_t + (1 - \\rho) \\, g_t \\odot g_t \\\\
\\theta_{t+1} &= \\theta_t - \\frac{\\eta}{\\sqrt{G_{t+1}} + \\epsilon} \\odot g_t
\\end{aligned}
\\]

\\(\\rho\\) is typically \\(0.9\\) or \\(0.99\\). Squared-gradient information older than the EMA's effective window decays out, so the effective learning rate is allowed to *grow back* if recent gradients have been small. Stuck on a plateau? The denominator shrinks and the step size opens up.

RMSprop carried recurrent networks for years before Adam took over. State per parameter: one extra tensor \\(G\\). Hyperparameters: \\(\\eta\\) and \\(\\rho\\). It is essentially "Adam with the velocity term removed" — and that is exactly the gap Adam fills.`,
          },
          {
            kind: 'math',
            heading: 'Adam — momentum and RMSprop in one block, with bias correction',
            body: `**Adam** keeps both a first-moment EMA (the momentum-style velocity) and a second-moment EMA (the RMSprop-style squared-gradient scale), and corrects both for the initialisation bias that comes from starting them at zero:

\\[
\\begin{aligned}
m_{t+1} &= \\beta_1 m_t + (1 - \\beta_1) g_t \\\\
v_{t+1} &= \\beta_2 v_t + (1 - \\beta_2) g_t \\odot g_t \\\\
\\hat{m} &= \\frac{m_{t+1}}{1 - \\beta_1^{\\,t+1}} \\quad\\quad \\hat{v} = \\frac{v_{t+1}}{1 - \\beta_2^{\\,t+1}} \\\\
\\theta_{t+1} &= \\theta_t - \\frac{\\eta}{\\sqrt{\\hat{v}} + \\epsilon} \\, \\hat{m}
\\end{aligned}
\\]

Defaults — and these are nearly never worth changing — are \\(\\beta_1 = 0.9\\), \\(\\beta_2 = 0.999\\), \\(\\epsilon = 10^{-8}\\). The bias correction \\(1 / (1 - \\beta^{\\,t+1})\\) matters most in the first few hundred steps: without it the EMAs are biased toward zero because they started there, and the early updates would be artificially tiny.

State per parameter: *two* extra tensors \\(m\\) and \\(v\\). This is why Adam-trained large models need roughly 4× the optimizer memory of vanilla-SGD models, and why memory-frugal alternatives keep getting proposed. The tradeoff is that Adam works on almost any architecture, almost any dataset, with almost no learning-rate hunting. It is the dishwasher of optimizers.`,
          },
          {
            kind: 'callout',
            tone: 'note',
            body: `**Adam is the right default; reach for anything else only with a reason.** New project, new architecture, no infrastructure for a careful schedule? Use Adam with \\(\\eta = 3 \\times 10^{-4}\\) and ship. The cases where SGD-with-momentum beats Adam — ResNet on ImageNet, some RL setups — are well-known and you will know when you are in one. Everywhere else, Adam saves you a week of tuning.`,
          },
          {
            kind: 'math',
            heading: 'AdamW — the weight-decay fix that should have always been there',
            body: `In any L2-regularised loss \\(L(\\theta) + \\tfrac{\\lambda}{2} \\|\\theta\\|^2\\), the gradient picks up an extra \\(\\lambda \\theta\\) term. Vanilla SGD applies that decay correctly: the update becomes \\(\\theta - \\eta (g + \\lambda \\theta)\\), a uniform \\(\\eta \\lambda\\) shrink toward zero on top of the gradient step.

Original Adam folds the same \\(\\lambda \\theta\\) into the gradient *before* the adaptive rescaling — so it gets divided by \\(\\sqrt{\\hat{v}}\\) along with the real gradient. Parameters that have seen large gradients get *less* weight decay than parameters that have seen small ones. That is not what L2 regularisation is supposed to mean.

**AdamW** decouples the two. The adaptive part of Adam operates only on the loss gradient; the decay is applied as a separate uniform shrink:

\\[
\\theta_{t+1} = \\theta_t - \\eta \\Big( \\frac{\\hat{m}}{\\sqrt{\\hat{v}} + \\epsilon} + \\lambda \\theta_t \\Big)
\\]

In practice this is one of the single most impactful one-line changes you can make to a training run — better generalisation on transformers, near-zero cost, no new hyperparameters. PyTorch's \`torch.optim.AdamW\` is the recommended choice for almost every modern training pipeline, including every public LLM.`,
          },
          {
            kind: 'math',
            heading: 'Lion — sign of momentum, no second moment',
            body: `**Lion** ("EvoLved Sign Momentum") is a 2023 result from a symbolic search over optimizer programs. The update is shockingly simple — no second-moment buffer at all:

\\[
\\begin{aligned}
c_t &= \\beta_1 m_t + (1 - \\beta_1) g_t \\\\
\\theta_{t+1} &= \\theta_t - \\eta \\, \\text{sign}(c_t) - \\eta \\lambda \\theta_t \\\\
m_{t+1} &= \\beta_2 m_t + (1 - \\beta_2) g_t
\\end{aligned}
\\]

The update direction is \\(\\pm 1\\) on every coordinate. Magnitude information is thrown away — the gradient only tells you which way to push each weight, never how hard.

Why anyone uses it: the optimiser state is *half* the size of Adam (one buffer instead of two), and on the large transformer training runs Google evaluated, Lion matched or beat AdamW with smaller hyperparameter budgets. The catch: learning rates need to be roughly 3× to 10× smaller than what you would use with Adam, because the sign-only update is much more aggressive than a scaled gradient when the gradient is small. Lion is not yet a universal drop-in, but on memory-bound large-model training it is a real contender.`,
          },
          {
            kind: 'viz',
            heading: 'The zoo at a glance',
            component: 'OptimizerZooViz',
            props: {},
          },
          {
            kind: 'viz',
            component: 'GradientDescent',
            props: {},
            heading: 'Drag the ball, change the learning rate, watch the steps. Same intuition powers every optimizer in this lesson.',
          },
          {
            kind: 'callout',
            tone: 'tip',
            body: `**Learning rate is the #1 hyperparameter, every time.** Before you tune anything else — batch size, weight decay, dropout — sweep the learning rate. A factor-of-3 grid (\\(1\\text{e-}5, 3\\text{e-}5, 1\\text{e-}4, 3\\text{e-}4, 1\\text{e-}3\\)) on a 1000-step pilot run will tell you more than a week of fiddling with the optimizer choice. Most "Adam vs SGD" arguments in the wild are really "I never tuned the learning rate for the other one" arguments.`,
          },
          {
            kind: 'code',
            language: 'python',
            heading: 'A side-by-side bake-off on a noisy quadratic',
            body: `import torch
import torch.nn as nn

torch.manual_seed(0)

# a 100-D noisy quadratic. true minimum at zero.
D = 100
A = torch.randn(D, D)
H = A @ A.T / D          # PSD curvature
def loss_fn(theta, noise=0.05):
    g_noise = noise * torch.randn_like(theta)
    return 0.5 * theta @ H @ theta + (g_noise * theta).sum()

def run(opt_cls, opt_kwargs, steps=400, label=""):
    theta = nn.Parameter(torch.ones(D) * 3.0)   # same start every time
    opt   = opt_cls([theta], **opt_kwargs)
    for t in range(steps):
        opt.zero_grad()
        l = loss_fn(theta)
        l.backward()
        opt.step()
    final = 0.5 * (theta.detach() @ H @ theta.detach()).item()
    print(f"{label:>16}  final clean loss = {final:7.4f}")

# same total budget — only the optimizer changes
run(torch.optim.SGD,    dict(lr=1e-2),                                 label="SGD")
run(torch.optim.SGD,    dict(lr=1e-2, momentum=0.9),                   label="SGD+momentum")
run(torch.optim.SGD,    dict(lr=1e-2, momentum=0.9, nesterov=True),    label="Nesterov")
run(torch.optim.Adagrad,dict(lr=1e-1),                                 label="AdaGrad")
run(torch.optim.RMSprop,dict(lr=1e-2, alpha=0.9),                      label="RMSprop")
run(torch.optim.Adam,   dict(lr=3e-3, betas=(0.9, 0.999)),             label="Adam")
run(torch.optim.AdamW,  dict(lr=3e-3, betas=(0.9, 0.999), weight_decay=1e-2),
                                                                       label="AdamW")
# Lion is not in stock PyTorch yet; pip install lion-pytorch for the real thing.
# typical printout: SGD and SGD+momentum land highest; Adam / AdamW lowest;
# AdaGrad stalls partway as its denominator grows.`,
          },
          {
            kind: 'prose',
            heading: 'What to take away',
            body: `Every optimizer in this lesson is the same update rule with bookkeeping bolted on. SGD has zero state; momentum adds a velocity; AdaGrad/RMSprop add a per-parameter scale; Adam combines the two; AdamW fixes Adam's weight-decay coupling; Lion drops the second moment and trades it for a sign-only step. The order in this lesson is also the rough historical order — each variant was a response to a specific failure mode of the previous one.

The pragmatic rules: start with **AdamW** at \\(\\eta = 3\\times 10^{-4}\\) and weight decay \\(10^{-2}\\) on anything transformer-shaped. Use **SGD with momentum** when you have an existing learning-rate schedule someone already tuned (vision benchmarks live here). Tune the **learning rate** before you tune anything else, every time. And remember that all of this is still one line: subtract a small multiple of the gradient — possibly smoothed, possibly rescaled, possibly bias-corrected — from the parameters, repeat.`,
          },
          {
            kind: 'prose',
            heading: 'Further reading',
            body: `- [Sebastian Ruder — "An overview of gradient descent optimization algorithms"](https://www.ruder.io/optimizing-gradient-descent/) — momentum, Nesterov, Adagrad, RMSprop, Adam side-by-side with the same notation.
- [Kingma & Ba — Adam paper](https://arxiv.org/abs/1412.6980) — the original "Adam: A Method for Stochastic Optimization" with the bias-correction derivation.
- [Loshchilov & Hutter — AdamW paper](https://arxiv.org/abs/1711.05101) — "Decoupled Weight Decay Regularization"; why the default optimizer for every modern transformer is AdamW, not Adam.`,
          },
        ],
      },
      {
        slug: 'weight-initialization',
        title: 'Weight initialization',
        oneLiner: 'The hidden hyperparameter. Get it wrong and the network never learns.',
        difficulty: 'intermediate',
        readMinutes: 9,
        sections: [
          {
            kind: 'prose',
            heading: 'The silent hyperparameter',
            body: `Every other lesson in this pillar assumes the network can actually start training. Pick a good optimizer, tune the learning rate, and the loss comes down. But there is a step before any of that — choosing the *initial* values of the weight matrices — and getting it wrong does not produce a noisy training curve or a slightly worse final model. It produces a network that does not learn at all. The loss stays at its initial value forever, or it explodes to \`NaN\` on the second batch, and no amount of optimizer-tuning will rescue you.

The reason init matters so much is geometric. The *Matrices* lesson showed that every layer is a linear map \\(W x + b\\) followed by a nonlinearity. Stack ten of those and the signal travelling forward is a product of ten matrices applied to the input; the gradient travelling backward is a product of ten Jacobian matrices applied to the upstream gradient. If the typical singular value of \\(W\\) is \\(s\\), then forward activations scale like \\(s^{10}\\) and gradients scale like \\(s^{10}\\) too. \\(s = 0.5\\) gives a factor of \\(10^{-3}\\); \\(s = 2\\) gives a factor of \\(10^3\\). One is vanishing, the other is exploding, and the only difference is the variance of the numbers you sampled before the first forward pass.

This lesson is the recipe for picking those initial numbers so the forward signal and the backward gradient both stay in a useful range. The math is variance bookkeeping; the takeaway is two lines of PyTorch.`,
          },
          {
            kind: 'prose',
            heading: 'The activation variance problem',
            body: `The whole game is keeping activation variance roughly constant as the signal travels through depth. Two failure modes bracket the right answer.

**Weights too small.** Each layer multiplies the incoming signal by numbers near zero. After ten layers the activations are a thousand times smaller than the input, after twenty layers they are numerically indistinguishable from zero. The loss surface is flat — every prediction is the same near-zero vector, every cross-entropy gradient points in the same direction, no parameter receives a useful update. The optimizer wanders aimlessly on a plateau because the forward pass has no information left to distinguish one input from another.

**Weights too large.** The opposite catastrophe. Each layer amplifies the signal, after ten layers the activations are a thousand times larger than the input, and the nonlinearity saturates — \`tanh\` pins at \\(\\pm 1\\), softmax collapses to one-hot, \`ReLU\` outputs scale linearly to absurd magnitudes. Gradients explode on the backward pass for the same reason: the Jacobian product through ten layers of large weights is a tensor of huge numbers, and the first update step throws the parameters into \`NaN\` land.

**The Goldilocks condition.** Variance of activations stays roughly constant through depth. Forward signal carries useful information at every layer; backward gradient carries useful information back. Both pathologies disappear.

Make the condition quantitative. Consider one layer with \\(n_{\\text{in}}\\) inputs, weights drawn i.i.d. from \\(\\mathcal{N}(0, \\sigma^2)\\), independent of the input. The output is the dot product

\\[
y = \\sum_{i=1}^{n_{\\text{in}}} w_i \\, x_i.
\\]

If the inputs \\(x_i\\) are independent with per-coordinate variance \\(\\mathrm{Var}[x]\\), then each term \\(w_i x_i\\) is zero-mean with variance \\(\\sigma^2 \\, \\mathrm{Var}[x]\\), and independent zero-mean variances sum:

\\[
\\mathrm{Var}[y] = n_{\\text{in}} \\, \\sigma^2 \\, \\mathrm{Var}[x].
\\]

The preservation demand is \\(\\mathrm{Var}[y] = \\mathrm{Var}[x]\\) — the layer neither grows nor shrinks the variance. Solve for the weight scale:

\\[
\\sigma^2 = \\frac{1}{n_{\\text{in}}}.
\\]

That single equation is the seed of every modern init scheme. The next section adjusts it for the specific shape of the nonlinearity downstream — \`tanh\` and \`ReLU\` need slightly different constants — but the structural rule "scale the weight variance inversely with the fan-in" is the only thing that keeps deep nets trainable.`,
          },
          {
            kind: 'prose',
            heading: 'Worked: Xavier vs He init numerics',
            body: `Take the variance-preservation rule and run it through the two activation families that matter. **Xavier (Glorot 2010)** was derived assuming the nonlinearity behaves linearly near zero — true for \`tanh\` and \`sigmoid\` once you account for their slope at the origin. The Glorot compromise averages the forward fan-in and backward fan-out constraints:

\\[
\\sigma^2 = \\frac{2}{n_{\\text{in}} + n_{\\text{out}}}.
\\]

**He (Kaiming 2015)** assumes \`ReLU\`. Half the input is zeroed by the threshold at zero, so the variance of the post-activation is half the variance of the pre-activation. Compensate by doubling the weight variance:

\\[
\\sigma^2 = \\frac{2}{n_{\\text{in}}}.
\\]

Plug in a concrete layer with \\(n_{\\text{in}} = n_{\\text{out}} = 100\\) and watch the constants come out:

- **Xavier.** \\(\\sigma = \\sqrt{2 / 200} = \\sqrt{0.01} = 0.1\\). Weights drawn from \\(\\mathcal{N}(0, 0.01)\\).
- **He.** \\(\\sigma = \\sqrt{2 / 100} \\approx 0.141\\). Weights drawn from \\(\\mathcal{N}(0, 0.02)\\). About \\(1.41\\times\\) larger standard deviation — exactly the \\(\\sqrt{2}\\) factor that cancels ReLU's halving.

Now propagate through a five-layer \`ReLU\` network starting from input variance \\(\\mathrm{Var}[x_0] = 1\\). With He init each layer's pre-activation has variance \\(n_{\\text{in}} \\cdot \\sigma^2 \\cdot \\mathrm{Var}[x_{\\ell-1}] = 100 \\cdot 0.02 \\cdot \\mathrm{Var}[x_{\\ell-1}] = 2 \\, \\mathrm{Var}[x_{\\ell-1}]\\), and the ReLU halves it back. Layer by layer:

- Layer 1: \\(\\mathrm{Var} = 1\\) (the factor of 2 from He cancels the \\(1/2\\) from ReLU).
- Layer 2: \\(\\mathrm{Var} = 1\\).
- Layer 3: \\(\\mathrm{Var} = 1\\).
- Layer 4: \\(\\mathrm{Var} = 1\\).
- Layer 5: \\(\\mathrm{Var} \\approx 1\\). Signal preserved end to end.

Repeat with the *wrong* init — \\(\\sigma^2 = 0.01\\), the Xavier constant applied to a ReLU stack. Each layer's pre-activation variance is \\(100 \\cdot 0.01 \\cdot \\mathrm{Var}[x_{\\ell-1}] = \\mathrm{Var}[x_{\\ell-1}]\\), ReLU halves it, so the post-activation variance halves layer to layer:

- Layer 1: \\(\\mathrm{Var} = 0.5\\).
- Layer 2: \\(\\mathrm{Var} = 0.25\\).
- Layer 3: \\(\\mathrm{Var} = 0.125\\).
- Layer 4: \\(\\mathrm{Var} = 0.0625\\).
- Layer 5: \\(\\mathrm{Var} = 1/32 \\approx 0.031\\). Vanishing.

After five layers the signal has lost 97% of its variance. Stack twenty layers and the per-coordinate standard deviation is below \\(10^{-3}\\) — the forward signal is gone, the gradient is gone with it, and the network never trains. One missing factor of two in the init constant is enough to break the entire stack.`,
          },
          {
            kind: 'prose',
            heading: 'Modern init choices',
            body: `The practical defaults are short and worth memorising.

**PyTorch defaults.** Use He init (\`kaiming_normal_\` with \`mode='fan_in'\`, \`nonlinearity='relu'\`) for any \`ReLU\`-family activation — plain ReLU, leaky ReLU, GELU, SiLU. Use Xavier (\`xavier_normal_\`) for \`sigmoid\` and \`tanh\` layers, including the output projection when it feeds a sigmoid or softmax. The framework's \`nn.Linear\` default is a uniform Kaiming variant with the wrong \`a\` argument; override it on any network deeper than a few layers.

**Transformers.** Xavier is still common in the FFN and attention projections, but production codebases often replace it with **depth-scaled init** — divide each layer's weight scale by \\(\\sqrt{2 L}\\) where \\(L\\) is the number of residual blocks. Residual connections add the layer output back to the residual stream, so without scaling the variance grows linearly with depth; the depth-scaled rule cancels that growth. GPT-2 onward and the LLaMA family use small Gaussian weights (std around \\(0.02\\)) plus this depth correction.

**LoRA adapters.** The low-rank update \\(\\Delta W = B A\\) is initialised with \\(A \\sim \\mathcal{N}(0, \\sigma^2 / r)\\) and \\(B = \\mathbf{0}\\). The zero on \\(B\\) is the key: at step zero the product is exactly zero, so \\(W + \\Delta W = W\\) and the pretrained model is unchanged. The first gradient step starts moving \\(B\\) away from zero in directions that reduce the loss, and only then does the adapter start contributing. This is the LoRA equivalent of the dead-RNN warm-start trick: identity at step zero, learned drift afterwards.

**Diffusion U-Nets.** Zero-init the final convolution of each residual block. Each block then starts as the identity — the residual stream passes through unchanged — and training carves out the denoising function as a sequence of small departures from identity. Same structural idea as LoRA: identity start, learned drift.`,
          },
          {
            kind: 'prose',
            heading: 'Why nonlinearity is the whole point',
            body: `A stack of linear layers without activations is mathematically equivalent to a single linear layer. Take a two-layer network with weights \\(W_1, W_2\\) and biases \\(b_1, b_2\\) and compute the composition:

\\[
y = W_2 (W_1 x + b_1) + b_2 = (W_2 W_1) x + (W_2 b_1 + b_2).
\\]

The product \\(W_2 W_1\\) is just another matrix, call it \\(W'\\), and \\(W_2 b_1 + b_2\\) is just another bias vector \\(b'\\). The "deep" network collapses to \\(y = W' x + b'\\) — one layer. Stack a hundred of them and the result is still one layer. No matter how many parameters you allocate, the function class you can represent is exactly the set of affine maps from input to output, which is what a single \\(W\\) and \\(b\\) already give you.

Nonlinear activations break that collapse. The instant you insert any function \\(\\sigma\\) that is not affine — between the layers, \\(y = W_2 \\, \\sigma(W_1 x + b_1) + b_2\\) — the algebra no longer factors. The composition can curve, bend, and partition input space in ways no single linear map can match. *That* is what makes "deep" mean something. Depth without nonlinearity is just a slow way to multiply matrices.

The activation functions you actually pick from are a small zoo, and each makes a different tradeoff between smoothness, gradient flow, and compute cost.

**ReLU.** \\(\\sigma(x) = \\max(0, x)\\). The simplest possible nonlinearity. Identity for positive inputs, zero for negative. The gradient is \\(1\\) if \\(x > 0\\) and \\(0\\) otherwise — a single comparison, no exponentials, trivially fast on every accelerator. It is the default for almost every modern conv net and MLP.

**Sigmoid.** \\(\\sigma(x) = 1 / (1 + e^{-x})\\). Bounded in \\((0, 1)\\), which makes it the natural choice for outputs you want to interpret as probabilities. The derivative \\(\\sigma'(x) = \\sigma(x)(1 - \\sigma(x))\\) peaks at \\(0.25\\) and decays toward zero for \\(|x| > 5\\) — the saturating tails are where vanishing-gradient pathologies are born.

**Tanh.** Bounded in \\((-1, 1)\\), zero-centered (unlike sigmoid, which sits above zero). Used as the hidden-state activation in old-school RNNs because the zero-centered output keeps the recurrent multiplications from drifting in one direction. Still saturates at the tails.

**GELU and SiLU.** Smooth ReLU variants — flat below zero, linear above zero, with a curved transition in between. Modern transformers (BERT, GPT, LLaMA) use these almost exclusively. The next sections work through why ReLU's simplicity is not free, and why these smoother variants ended up winning the big-model competition.`,
          },
          {
            kind: 'prose',
            heading: 'Worked: ReLU breaks linear collapse',
            body: `Watch the collapse and the rescue on the smallest possible example. Take a two-layer network with scalar weights \\(W_1 = 2, W_2 = 3\\), no bias, no batch dimension — just one number flowing through two layers.

**Without any activation.** Forward pass on input \\(x = 5\\):

\\[
y = W_2 \\cdot W_1 \\cdot x = 3 \\cdot 2 \\cdot 5 = 30.
\\]

The same value comes out of a single-layer network with weight \\(W' = W_2 \\cdot W_1 = 6\\): \\(y = 6 \\cdot 5 = 30\\). The two-layer model has two parameters; the equivalent one-layer model has one. The extra parameter bought nothing.

**With ReLU between the layers.** Forward pass on the same input:

\\[
y = W_2 \\cdot \\mathrm{ReLU}(W_1 \\cdot x) = 3 \\cdot \\mathrm{ReLU}(10) = 3 \\cdot 10 = 30.
\\]

Same answer on \\(x = 5\\). For positive inputs ReLU acts as the identity, so the nonlinear network agrees with the linear one. The interesting case is the other side of zero.

**Take \\(x = -3\\).** Without ReLU:

\\[
y = W_2 \\cdot W_1 \\cdot x = 3 \\cdot 2 \\cdot (-3) = -18.
\\]

With ReLU:

\\[
y = W_2 \\cdot \\mathrm{ReLU}(W_1 \\cdot x) = 3 \\cdot \\mathrm{ReLU}(-6) = 3 \\cdot 0 = 0.
\\]

The two networks now disagree. The linear stack gives \\(-18\\); the ReLU stack gives \\(0\\). That single threshold at zero — flipping the function from linear to constant as the input crosses the origin — is what gives the network its expressive power. Each ReLU unit carves a hyperplane in input space (the set of inputs where its pre-activation crosses zero), and the network output is one affine function on each side of that hyperplane. Combine many ReLU units and their hyperplane arrangement partitions input space into polyhedral regions, with a different affine function on each region. That is the source of every piecewise-linear function a ReLU network can approximate — and the universal-approximation theorems guarantee the family is dense enough to fit anything you want, given enough units.`,
          },
          {
            kind: 'prose',
            heading: 'Dying ReLU and the modern alternatives',
            body: `ReLU's simplicity has a price. Its gradient is exactly zero for any \\(x \\le 0\\), so a neuron whose pre-activation stays negative across every training input outputs zero on every forward pass and receives zero gradient on every backward pass. The weights into it never update, the bias never updates, and the neuron is dead for the rest of training. The same backprop machinery that makes ReLU networks trainable from scratch (constant gradient on the active side) is what kills neurons that drift to the wrong side of the origin.

**Leaky ReLU.** \\(\\sigma(x) = \\max(\\alpha x, x)\\) for a small slope \\(\\alpha\\), typically \\(0.01\\). The negative side is no longer flat — it leaks a tiny gradient through, so a neuron stuck in the negative regime still gets a nudge each step and can climb back. The price is one extra multiply per element; the upside is no more permanently dead units.

**ELU and PReLU.** Same fix with different curves. ELU uses \\(\\alpha (e^x - 1)\\) for \\(x \\le 0\\), which is smooth at the origin and saturates to \\(-\\alpha\\) for large negative inputs. PReLU makes the slope \\(\\alpha\\) a learned parameter per channel, so the network decides how much to leak rather than baking in a hyperparameter.

**GELU (Gaussian Error Linear Unit).** \\(\\sigma(x) = x \\cdot \\Phi(x)\\) where \\(\\Phi\\) is the standard normal CDF. Smooth everywhere, nearly linear for large positive inputs, smoothly tapers toward zero for large negative inputs without the hard threshold ReLU imposes. Used in BERT, GPT-2, and most early transformer architectures. The smoothness matters for the optimization landscape — every gradient step moves through a differentiable surface rather than a piecewise-linear one with a kink at zero.

**SiLU / Swish.** \\(\\sigma(x) = x \\cdot \\mathrm{sigmoid}(x)\\). Behaviorally similar to GELU — smooth, mostly linear above zero, smoothly negative-then-zero below — but cheaper to compute since sigmoid is one exponential instead of a CDF evaluation. The LLaMA family and most current open-weight LLMs use SiLU in the feedforward blocks.

The modern rule of thumb: use GELU or SiLU for transformer feedforward layers and attention output projections. Plain ReLU is still the right default for vanilla MLPs, conv nets where compute is the bottleneck, and any architecture where you want the piecewise-linear inductive bias. Leaky ReLU is the cheap insurance policy when dead neurons have shown up in your training logs.`,
          },
          {
            kind: 'prose',
            heading: 'Why all-zero init never works',
            body: `The first instinct of anyone new to neural networks is to initialise every weight to zero. It is symmetric, it is simple, the bias terms get the same treatment, and the optimiser will figure out the right values from there. This fails completely, and the reason teaches you something about every later init scheme.

Take a layer with weights \\(W \\in \\mathbb{R}^{m \\times n}\\), all zero, feeding into a nonlinearity \\(\\sigma\\). The forward pass produces the same output for every neuron in the layer: \\(\\sigma(0 \\cdot x + 0) = \\sigma(0)\\), a constant. The backward pass then assigns the same gradient to every weight in the row, because the chain rule walks back through identical paths. Every weight in row \\(i\\) updates to the same value. Every weight in row \\(j\\) updates to the same (possibly different) value. After one optimiser step the matrix has at most \\(m\\) distinct rows, each one a repeated copy of the same scalar across all \\(n\\) input dimensions.

The neurons are now permanently entangled. Whatever feature row \\(i\\) ends up computing, row \\(i'\\) computes the exact same thing. The hidden layer has the representational capacity of *one* neuron, no matter how wide you made it. This is the **symmetry-breaking** requirement, and it is non-negotiable: the initial weights must be *random*, with enough variance that no two neurons start out computing the same function. Constant init — zero or otherwise — gives every neuron the same future. Random init gives them different futures, which is what lets gradient descent specialise them into different features.

The bias term is the one exception. Biases can safely start at zero (or a small positive constant) because the rows of \\(W\\) above them are already distinct after one random draw — the bias does not need to break symmetry on its own.`,
          },
          {
            kind: 'prose',
            heading: 'Why "just use small random numbers" is also wrong',
            body: `The obvious fix to the symmetry problem is to draw weights from a narrow Gaussian: \\(W_{ij} \\sim \\mathcal{N}(0, 0.01^2)\\). The neurons are now distinct, training can begin, and on a two-layer network everything is fine. Stack ten of those layers and the forward pass dies.

Consider a single layer with input \\(x \\in \\mathbb{R}^n\\), assumed for the moment to have unit variance per coordinate, fed through \\(z = W x\\) with \\(W_{ij} \\sim \\mathcal{N}(0, \\sigma_W^2)\\) drawn independently. Each output coordinate \\(z_i = \\sum_j W_{ij} x_j\\) is a sum of \\(n\\) independent zero-mean products, so its variance is \\(n \\sigma_W^2\\). If \\(\\sigma_W = 0.01\\) and \\(n = 1000\\), the per-coordinate variance of \\(z\\) drops from \\(1\\) to \\(10^{-1}\\). Pass through the nonlinearity, multiply by another such matrix, and the variance drops again. By layer ten the activations are numerically indistinguishable from zero. The forward signal has *vanished*, and the gradient — which is the symmetric quantity going the other way — vanishes with it.

The opposite mistake is just as bad. Use \\(\\sigma_W = 1\\) on the same width-1000 layer and the per-coordinate variance grows from \\(1\\) to \\(1000\\). Push that through a \`tanh\` and every neuron is pinned at \\(\\pm 1\\) with a derivative of essentially zero — gradient-saturation, no learning. Push it through a softmax and you get one-hot outputs on the first batch; push it through a deep stack and you get \`NaN\`. Naive small or large init both kill training; the question is what scale \\(\\sigma_W\\) *just* preserves the variance from layer to layer. The next two sections answer that question for the two activation families that matter.`,
          },
          {
            kind: 'math',
            heading: 'Xavier / Glorot init: preserve variance for tanh and sigmoid',
            body: `**Xavier initialization** (also called Glorot) is the variance-preservation rule, derived for activations that are roughly linear near the origin — \`tanh\`, \`sigmoid\`, and any other "S-shaped" nonlinearity. The derivation is two lines of variance algebra.

Assume the input \\(x \\in \\mathbb{R}^n\\) has zero mean and per-coordinate variance \\(\\mathrm{Var}(x_j) = \\sigma_x^2\\), with the coordinates independent. Draw the weights \\(W_{ij}\\) i.i.d. with zero mean and variance \\(\\sigma_W^2\\), independent of \\(x\\). For each output coordinate

\\[
z_i = \\sum_{j=1}^{n} W_{ij} \\, x_j
\\]

the terms in the sum are independent zero-mean products. Independence gives \\(\\mathrm{Var}(W_{ij} x_j) = \\mathrm{Var}(W_{ij}) \\, \\mathrm{Var}(x_j) = \\sigma_W^2 \\sigma_x^2\\), and zero-mean independence gives \\(\\mathrm{Var}\\) of the sum equal to the sum of variances:

\\[
\\mathrm{Var}(z_i) = \\sum_{j=1}^{n} \\sigma_W^2 \\sigma_x^2 = n \\, \\sigma_W^2 \\, \\sigma_x^2.
\\]

The variance-preservation demand is \\(\\mathrm{Var}(z_i) = \\sigma_x^2\\) — pass through the layer and the per-coordinate variance neither grows nor shrinks. Solving for \\(\\sigma_W\\):

\\[
\\sigma_W^2 = \\frac{1}{n} \\quad \\Longrightarrow \\quad W_{ij} \\sim \\mathcal{N}\\!\\left(0, \\frac{1}{n}\\right).
\\]

That is the Xavier rule for the forward pass: scale by \\(1 / \\sqrt{n_{\\text{in}}}\\). Running the symmetric calculation on the backward pass — where the Jacobian product moves an upstream gradient through \\(W^\\top\\) — gives the same form with \\(n_{\\text{out}}\\) instead of \\(n_{\\text{in}}\\). The standard Glorot compromise averages the two:

\\[
\\sigma_W^2 = \\frac{2}{n_{\\text{in}} + n_{\\text{out}}}.
\\]

Sample uniformly or normally with this variance, and forward activations *and* backward gradients keep roughly unit per-coordinate variance through every \`tanh\`/\`sigmoid\` layer. The training curve becomes well-behaved on its own.`,
          },
          {
            kind: 'math',
            heading: 'He / Kaiming init: variance preservation for ReLU',
            body: `Xavier was derived assuming the nonlinearity is approximately linear near zero — true for \`tanh\` once you account for its slope at the origin, but very wrong for **ReLU**, which is exactly zero on half of its input range. The He / Kaiming derivation adjusts for that.

Let the pre-activation \\(z\\) be zero-mean with per-coordinate variance \\(\\sigma_z^2\\). The post-activation is \\(a = \\max(0, z)\\). For a symmetric zero-mean distribution like the Gaussian, exactly half the mass is below zero and contributes nothing, while the other half is the positive tail squared:

\\[
\\mathrm{Var}(a) = \\mathbb{E}[a^2] = \\frac{1}{2} \\, \\mathbb{E}[z^2] = \\frac{1}{2} \\sigma_z^2.
\\]

ReLU *halves* the variance of the pre-activation. If you carried Xavier's \\(\\sigma_W^2 = 1/n\\) through a ReLU stack, the per-layer variance would shrink by a factor of two every layer — by layer ten the signal is \\(2^{-10} \\approx 10^{-3}\\) of where it started, the same vanishing pathology that motivated all of this.

He's fix is to double the weight variance so the post-ReLU variance comes out right:

\\[
\\sigma_W^2 = \\frac{2}{n_{\\text{in}}} \\quad \\Longrightarrow \\quad W_{ij} \\sim \\mathcal{N}\\!\\left(0, \\frac{2}{n_{\\text{in}}}\\right).
\\]

In standard-deviation form: scale by \\(\\sqrt{2 / n_{\\text{in}}}\\). This is the right default for any ReLU-family activation — plain ReLU, leaky ReLU (with a small slope-correction factor in the constant), GELU, SiLU. Run the per-layer variance accounting again with this \\(\\sigma_W^2\\) and the factor of two from the doubled weight variance cancels the factor of one-half from the ReLU, leaving \\(\\mathrm{Var}(a) = \\sigma_x^2\\) layer to layer. Deep ReLU networks become trainable from scratch.`,
          },
          {
            kind: 'viz',
            heading: 'What goes wrong without the right scale',
            component: 'InitVarianceViz',
            props: {},
          },
          {
            kind: 'prose',
            heading: 'Orthogonal init for very deep nets and RNNs',
            body: `Xavier and He get the *average* variance right, but on very deep networks — 50+ layers without skip connections, vanilla RNNs unrolled over hundreds of timesteps — the variance of the *product* of weight matrices still drifts. The reason is that Gaussian matrices have a spread of singular values; the product of many such matrices is dominated by the largest singular value, which slowly squeezes the smaller ones to zero. Even with the right per-layer variance, the *effective rank* of the composed map collapses, and gradients lose information about most input directions.

**Orthogonal initialization** dodges this by sampling \\(W\\) from the orthogonal group directly: pick a random Gaussian matrix, QR-decompose it, and use \\(Q\\). Every singular value of \\(Q\\) is exactly \\(1\\), so the composed map preserves norms perfectly through any depth. For square hidden-to-hidden recurrent weights this is decisive — \\(W^t\\) for an orthogonal \\(W\\) stays bounded for all \\(t\\), which is the closest thing to a fix for the RNN gradient-explosion problem that does not involve changing the architecture (LSTMs and GRUs, covered in the RNN lesson, change the architecture).

For non-square layers you can use the same trick on a semi-orthogonal matrix: the larger dimension hosts an orthonormal basis, the smaller dimension is the projection. PyTorch's \`torch.nn.init.orthogonal_\` does this for arbitrary shapes. The cost over He/Xavier is one QR decomposition per layer at init time, which is invisible in any real training run. Use it as the default for deep linear stacks, RNNs, and any architecture where you watched gradients explode and threw your hands up.`,
          },
          {
            kind: 'prose',
            heading: 'LSUV: data-driven init for fine-tuning',
            body: `Xavier and He assume the inputs to each layer have unit variance, the weights are independent of the inputs, and the nonlinearity has the shape they were derived for. Real networks break all three assumptions — batch statistics depend on the data, deep stacks compose in non-trivial ways, and modern activations (GELU, Swish) sit between the tanh and ReLU families.

**LSUV — Layer-Sequential Unit-Variance init** — is a data-driven correction that gives you exactly the layer-by-layer variance the theory promises, without trusting the theory. The recipe:

1. Initialise the whole network with orthogonal (or any reasonable random) weights.
2. Run one mini-batch forward.
3. Walk the layers in order. For each layer, measure the actual standard deviation \\(s_\\ell\\) of its output on that batch. Rescale the layer's weights in place: \\(W_\\ell \\gets W_\\ell / s_\\ell\\). The output of the layer is now unit-variance on this batch.
4. Re-run the forward pass with the rescaled weights, so the next layer sees its true input distribution. Move on.

A handful of passes converges to a network whose every hidden layer outputs unit-variance activations on the calibration batch. It is the empirical equivalent of the analytical derivations above, and it sidesteps the assumption-mismatch problem entirely. Worth the trouble when you are fine-tuning a frozen feature extractor and the downstream randomly-initialised head needs to start in the right regime, or when you are debugging a deep custom architecture whose loss refuses to drop.`,
          },
          {
            kind: 'prose',
            heading: 'Biases: zero by default, sometimes positive for ReLU',
            body: `Biases get a much simpler treatment than weights, for a structural reason: the bias only adds, it does not multiply. Setting \\(b = 0\\) does not cause symmetry problems because the rows of \\(W\\) above the bias are already distinct after one random draw — bias adds the same scalar to every output of the layer, but the weights have already broken the tie.

Zero is the right default for almost every layer. The one notable exception is the **dead-ReLU problem**. A ReLU neuron whose pre-activation is negative on every batch outputs zero, gets gradient zero, and never updates again — it is dead for the rest of training. With He init and zero bias, roughly half the neurons in each layer start out on the dead side of zero for any given input, and a small fraction of them stay dead forever because the random walk of their bias never crosses back over.

The mitigation is to initialise ReLU biases at a small positive constant — \\(0.01\\) or \\(0.1\\) — so the pre-activation starts on the active side of zero with high probability. The cost is essentially nothing; the upside is that fewer neurons die in the first few hundred steps before the data has had a chance to push them around. PyTorch's default for \`nn.Linear\` is uniform-in-\\([-1/\\sqrt{n}, 1/\\sqrt{n}]\\) for *both* weights and bias, which is harmless but neither optimal nor scary — the explicit positive-bias trick is one extra line for ReLU stacks and worth doing on architectures where you have seen dead neurons.

The other special case is the **forget-gate bias of an LSTM**, traditionally initialised to \\(+1\\) so the network remembers by default at the start of training. The general principle: when a sigmoid-gated unit has a "do nothing / pass through" mode at one end of its range, bias the unit toward that mode at init so the gradient signal has a chance to teach the gate the cases where it should do something else.`,
          },
          {
            kind: 'viz',
            heading: 'Slide the bias — watch dead neurons disappear',
            component: 'DeadReLUViz',
            props: {},
          },
          {
            kind: 'code',
            language: 'python',
            heading: 'Kaiming init across a real model in PyTorch',
            body: `import torch
import torch.nn as nn

# a small ReLU MLP — same pattern works for CNNs, transformers, anything
class Net(nn.Module):
    def __init__(self, in_dim=784, hidden=512, depth=8, out_dim=10):
        super().__init__()
        layers = []
        d = in_dim
        for _ in range(depth):
            layers.append(nn.Linear(d, hidden))
            layers.append(nn.ReLU(inplace=True))
            d = hidden
        layers.append(nn.Linear(d, out_dim))
        self.net = nn.Sequential(*layers)

    def forward(self, x):
        return self.net(x)

model = Net()

# PyTorch's nn.Linear default is uniform in [-1/sqrt(n), 1/sqrt(n)] —
# fine, but Kaiming is the right call for ReLU stacks.
def init_kaiming(m):
    if isinstance(m, nn.Linear):
        # fan_in matches our forward-pass variance derivation above
        nn.init.kaiming_normal_(m.weight, mode='fan_in', nonlinearity='relu')
        if m.bias is not None:
            nn.init.constant_(m.bias, 0.01)   # small positive — mitigates dead ReLUs
    elif isinstance(m, nn.Conv2d):
        nn.init.kaiming_normal_(m.weight, mode='fan_in', nonlinearity='relu')
        if m.bias is not None:
            nn.init.constant_(m.bias, 0.0)

model.apply(init_kaiming)

# sanity-check: per-layer activation std on a random batch should stay near 1
x = torch.randn(64, 784)
h = x
for i, layer in enumerate(model.net):
    h = layer(h)
    if isinstance(layer, nn.Linear):
        print(f"layer {i:>2}  out std = {h.std().item():.3f}")

# typical printout: 1.00, 1.00, 1.00, ... — variance preserved through the stack.
# swap to nn.init.xavier_normal_(m.weight) and you will see it halve every layer.`,
          },
          {
            kind: 'callout',
            tone: 'tip',
            body: `**Never trust the framework default.** PyTorch's \`nn.Linear\` and \`nn.Conv2d\` use a uniform Kaiming-flavoured init that is *close* to right for ReLU but not exact — \`a=sqrt(5)\` instead of \`a=0\`, which under-scales the variance by a noticeable factor on deep nets. Apply your own init function and use \`kaiming_normal_(mode='fan_in', nonlinearity='relu')\` for ReLU layers, \`xavier_normal_\` for tanh/sigmoid layers. The two extra lines pay for themselves the first time you watch a 30-layer network actually train from scratch.`,
          },
          {
            kind: 'callout',
            tone: 'note',
            body: `**Once batch norm is in the picture, init matters far less.** The *Batch norm* lesson covers why: batch norm rescales each layer's pre-activation to zero mean and unit variance every forward pass, which papers over a bad init within one step. The same applies to layer norm and group norm. Modern transformer codebases set weights with a small Gaussian (std around \\(0.02\\)) and let layer norm do the variance bookkeeping; deep ResNets do the same with batch norm. Init is critical for raw deep MLPs, vanilla RNNs, and any architecture *without* a normalization layer. Add a normalizer and the problem softens — but the *Dropout* and weight-decay lessons remind you that regularisation is a separate axis, not a substitute for it.`,
          },
          {
            kind: 'prose',
            heading: 'What to take away',
            body: `Initialization is variance bookkeeping. The *Vectors* and *Matrices* lessons gave you the algebra of a linear layer; this lesson uses that algebra to pick the scale at which the first forward pass keeps the signal alive. Zero init dies to symmetry. Tiny-random init dies to vanishing. Xavier and He fix the average variance for their respective nonlinearities. Orthogonal init fixes the singular-value drift for very deep stacks and RNNs. LSUV measures the actual statistics and rescales empirically when the theory's assumptions do not hold. Biases stay at zero, with a small positive constant for ReLU layers to dodge the dead-neuron failure.

The pragmatic recipe is two lines. For any modern architecture you can plausibly train: **Kaiming normal with fan-in mode and ReLU nonlinearity for the weights, zero or small-positive constant for the biases.** Verify by running one batch and printing per-layer activation std — you should see numbers near one, all the way through. If you do, the optimizer-zoo lesson from earlier in this pillar is what trains the model from there; the *Batch norm* lesson explains why teams stop worrying about init once normalisation is in the stack; the *Dropout* lesson is the next axis of regularisation on top. Get init right once, copy the function into every project, and stop thinking about it.`,
          },
          {
            kind: 'prose',
            heading: 'Further reading',
            body: `- [He et al. — "Delving Deep into Rectifiers"](https://arxiv.org/abs/1502.01852) — the Kaiming / He initialization paper; the variance-preservation argument for ReLU networks.
- [Glorot & Bengio — Xavier initialization paper](https://proceedings.mlr.press/v9/glorot10a.html) — "Understanding the difficulty of training deep feedforward neural networks"; the variance-matching analysis for tanh / sigmoid nets.
- [Saxe, McClelland & Ganguli — "Exact solutions to the nonlinear dynamics of learning in deep linear neural networks"](https://arxiv.org/abs/1312.6120) — the paper behind orthogonal initialization and the dynamical-isometry argument for very deep nets.`,
          },
        ],
      },
    ],
  },
  regularization: {
    title: 'Regularization & Generalization',
    oneLiner: 'Overfitting is the default. L1, L2, dropout, batch norm — pick the right knob for the right symptom.',
    iconName: 'Layers',
    lessons: [
      {
        slug: 'dropout',
        title: 'Dropout',
        oneLiner: 'Randomly silence neurons during training. The lazy fix that works embarrassingly well.',
        difficulty: 'intermediate',
        readMinutes: 9,
        sections: [
          {
            kind: 'prose',
            heading: 'The problem dropout solves',
            body: `A wide neural network has many more parameters than your training set has examples. Left to its own devices it will memorise the training data — every quirk, every label-noise mistake, every accidental shortcut — and validation loss starts climbing while training loss keeps dropping. That is overfitting in its purest form.

The deeper failure mode underneath is **co-adaptation**. Neurons in the same layer learn to lean on each other. Neuron 7 only fires when neurons 3 and 12 fire in a specific pattern, because during training those three were always available together. The network ends up with brittle little cliques of features that work as a unit but fall apart the moment one of their members sees something unfamiliar. The representation is fragile, even though the training accuracy looks great.

Classical regularization — L2 penalties on the weights — pushes against this, but bluntly: it shrinks every weight a little, regardless of whether that weight is part of a useful feature or a memorisation hack. Dropout attacks the problem from a different angle. Instead of shrinking weights, it forces the *features themselves* to be redundant. If any neuron might be silenced on the next forward pass, no neuron can afford to rely on a specific partner being alive. Every feature has to carry its own weight.`,
          },
          {
            kind: 'prose',
            heading: 'Dropout as ensemble of subnetworks',
            body: `Hold the architecture fixed for a moment and watch what dropout actually does across training steps. On every forward pass, each neuron is independently dropped with probability \\(p\\). The mask \\(m \\in \\{0, 1\\}^n\\) is resampled fresh — there is no memory between minibatches, no schedule, just an independent coin flip per unit per step. The forward graph that results is a *subnetwork*: the same weights as the full model, but only the surviving neurons participate in the computation.

Now count subnetworks. A layer with \\(n\\) units has \\(2^n\\) possible alive/dead patterns. A hundred-neuron layer has \\(2^{100}\\) — astronomically more subnetworks than your training run will ever sample. Yet each minibatch picks one of them, runs forward, computes a gradient, and updates the *shared* weights. Over an epoch the same weight matrix has been used inside thousands of different subnetworks. The optimizer is not training a single model; it is training a giant family of models whose parameters happen to overlap.

At inference the mask is turned off and every neuron is alive. Multiplying activations by \\((1 - p)\\) — or, equivalently in inverted dropout, dividing by \\((1 - p)\\) at training time — approximates a weighted geometric average over that exponential family. The prediction you get from the full network is, roughly, what you would get by running every subnetwork in parallel and averaging their outputs. You get an ensemble of \\(2^n\\) models for the wall-clock cost of one.

The geometric picture sharpens the intuition. Without dropout, neurons co-adapt: neuron 7 learns to fire only when neuron 3 fires in a particular pattern, because neuron 3 is *always* there during training. The two form a chain — a fragile partnership where one compensates for the other's quirk. Drop neuron 3 once and the whole chain breaks; neuron 7 is suddenly producing meaningless output on whatever input survives. With dropout, every neuron must work alone or with a randomly chosen subset of partners. Co-adaptation has no fixed neighbour to lean on, so each feature is forced to be independently useful. Robust, distributed features instead of brittle cliques.

This is bagging in disguise. Bagging trains many models on bootstrap samples of the data and averages them; dropout trains many subnetworks on the same minibatch and the shared-weight averaging happens implicitly. The variance reduction is the same flavour — an exponentially large ensemble, almost free.`,
          },
          {
            kind: 'prose',
            heading: 'Worked: inverted dropout numerics',
            body: `Work a single forward pass by hand. Take a layer activation \\(a = [0.8,\\ 0.2,\\ 0.9,\\ 0.5]\\) and a drop probability \\(p = 0.5\\). Sample a Bernoulli mask with survival probability \\(1 - p = 0.5\\). Suppose the coin flips give \\(m = [1,\\ 0,\\ 1,\\ 1]\\) — the second neuron is dropped on this minibatch.

Apply inverted dropout:
\\[
a_{\\text{after}} = \\frac{a \\odot m}{1 - p} = \\frac{[0.8,\\ 0,\\ 0.9,\\ 0.5]}{0.5} = [1.6,\\ 0,\\ 1.8,\\ 1.0]
\\]

Three things to notice. The dropped neuron is exactly zero — the next layer sees no signal from it. The surviving neurons are *doubled*. And the rescale factor \\(1 / (1 - p)\\) is what makes the doubling happen.

Why divide by \\((1 - p)\\)? Because the next layer's weights were trained against activations of a particular average magnitude, and we want the *expected* magnitude to be constant across train and test. Without the rescale, the layer downstream would receive roughly half of its expected input during training (since half the neurons are dead) and the full input at inference (when every neuron is alive). The mismatch is exactly the factor of \\((1 - p)\\), and the next layer's learned weights would be calibrated to the wrong scale.

Check the expectation arithmetic. For any unit \\(i\\):
\\[
\\mathbb{E}[a_{\\text{after}, i}] = \\mathbb{E}\\!\\left[\\frac{m_i}{1 - p}\\right] \\cdot a_i = \\frac{\\mathbb{E}[m_i]}{1 - p} \\cdot a_i = \\frac{1 - p}{1 - p} \\cdot a_i = a_i
\\]

The expected post-dropout activation equals the original activation. The variance is larger — that is the regularization noise — but the mean is preserved exactly. At inference, no mask is sampled, no rescale is applied: the activations pass through unchanged, and they already match the expected magnitude the next layer was trained against. The rescale at training time did the work so inference can be a no-op.`,
          },
          {
            kind: 'prose',
            heading: 'When dropout helps vs hurts',
            body: `Dropout earns its keep on dense fully-connected layers in a model with more capacity than the data can naturally support. The classifier head on top of a frozen pretrained backbone, the feed-forward block inside a transformer, the wide MLP at the end of a small CNN — these are the layers where co-adaptation is most likely to form and where breaking it pays off. Use \\(p \\in [0.1,\\ 0.3]\\) as a starting point and tune from there.

Dropout helps less, or not at all, on convolutional layers. A convolutional filter is already a weight-sharing constraint — the same filter slides across every spatial position, so the network is implicitly trained against many "different inputs" at once. Spatial redundancy is built in. Dropping individual pixels barely registers as noise because neighbouring pixels are heavily correlated and the network can average over the gap. Modern conv nets typically skip dropout in the conv trunk and rely on data augmentation and batch norm instead.

Dropout fights batch-norm-heavy models. BN already injects regularization-like noise via the batch statistics — every forward pass sees slightly different normalization parameters depending on which other examples landed in the same minibatch. Stacking dropout on top often slows convergence without improving generalization; the two noise sources interact badly and the running statistics drift. The standard fix is to pick one. CNNs with BN skip dropout in the conv trunk. Transformers with LayerNorm — which is per-token, not batch-statistical — combine freely with dropout and that is the modern default.

Modern transformer recipes apply dropout in two specific places: on the attention probabilities after the softmax (attention dropout) and on the residual branch outputs (residual dropout). Typical rates land between \\(0.1\\) and \\(0.3\\), with larger models often using lower values because the data-to-parameter ratio is more favourable on huge pretraining corpora.

Rule of thumb for whether to enable dropout at all: look at the gap between training and validation loss. If \\(\\text{val\\_loss}\\) exceeds \\(\\text{train\\_loss}\\) by more than ten percent, the model is overfitting and dropout will likely help. If the two curves are already close, dropout is solving a problem you do not have and will just slow training without buying generalization.`,
          },
          {
            kind: 'prose',
            heading: 'The trick, in one sentence',
            body: `During each training forward pass, independently set each neuron's activation to zero with probability \\(p\\). That is it.

The mask is fresh every minibatch. Neuron 3 might be alive on step 100 and dead on step 101. The same image processed twice produces two different forward paths through the network. Backprop only flows through the surviving neurons, so weights attached to silenced units do not get updated on that step.

At **inference** time you turn dropout off entirely. Every neuron is alive, every weight is used. The whole point of dropout is to make training pessimistic about which neurons it can count on; once the model is trained, you want the full ensemble of features available to make the prediction.

This single change — multiply activations by a random Bernoulli mask during training, do nothing at test time — turns out to be one of the strongest regularizers in deep learning. It costs a few extra multiplies per forward pass and roughly nothing in code.`,
          },
          {
            kind: 'math',
            heading: 'The dropout mask and inverted scaling',
            body: `Let \\(h \\in \\mathbb{R}^n\\) be the activations of one hidden layer, and let \\(p \\in [0, 1)\\) be the **drop probability** — the fraction of units we want to silence. Draw an independent Bernoulli mask:

\\[
m_i \\sim \\text{Bernoulli}(1 - p), \\quad i = 1, \\ldots, n
\\]

so \\(m_i = 1\\) with probability \\(1 - p\\) (the unit survives) and \\(m_i = 0\\) with probability \\(p\\) (the unit is dropped). The naive dropout output is the elementwise product:

\\[
\\tilde h_i = m_i \\cdot h_i
\\]

There is a problem with this. The expected magnitude of \\(\\tilde h_i\\) is \\((1 - p) \\cdot h_i\\) — smaller than \\(h_i\\) by a factor of \\(1 - p\\). At test time we feed in the full \\(h_i\\), so the layer downstream sees inputs that are systematically *larger* than what it was trained on. The activations no longer match the distribution the next layer learned to expect.

The fix is **inverted dropout**: scale the survivors back up during training so that the expectation matches the test-time value.

\\[
\\tilde h_i = \\frac{m_i}{1 - p} \\cdot h_i, \\qquad \\mathbb{E}[\\tilde h_i] = \\frac{1 - p}{1 - p} \\cdot h_i = h_i
\\]

Now the training-time activations and the test-time activations agree in expectation, and at inference you simply pass \\(h\\) through unchanged — no scaling, no mask, nothing to remember. Every modern framework (PyTorch, JAX, TensorFlow) implements inverted dropout, which is why \\(p\\) in \`nn.Dropout(p)\` is the *drop* probability, and why your model evaluation code only needs to call \`.eval()\` to flip the behaviour.`,
          },
          {
            kind: 'viz',
            heading: 'One layer, three minibatches, three different masks',
            component: 'DropoutMasksViz',
            props: {},
          },
          {
            kind: 'prose',
            heading: 'Why it works — implicit ensembling',
            body: `Each forward pass during training uses a different random subset of neurons. A network with \\(N\\) hidden units has \\(2^N\\) possible subnetworks, and over the course of training you sample from this enormous pool. Every gradient step trains a different subnetwork, but they all share the same underlying weights — so the weights end up doing well *on average* across the ensemble of subnetworks.

At inference, when every neuron is on, you are using the full network, which behaves like a geometric average of all those subnetworks at once. You get the variance reduction of a giant ensemble for the wall-clock price of a single model. That is the punchline of the original paper, and it is still the cleanest way to think about why dropout helps.

There is a second, more practical effect: any feature that the network learns has to be useful on its own, because its neighbours might be missing. The co-adaptation that drove overfitting can no longer exploit a fixed partnership between neurons. The features become more independent, more redundant, and more robust to perturbation — which is the same property you want at test time when the inputs do not exactly match the training distribution.

This is also why dropout pairs well with very wide networks. A 4096-unit hidden layer with \\(p = 0.5\\) effectively trains a 2048-unit network on average — you get the regularization of a smaller model and the representational capacity of the bigger one. On narrow networks the same \\(p\\) just throws away too much signal.`,
          },
          {
            kind: 'code',
            language: 'python',
            heading: 'Dropout from scratch — NumPy forward and backward',
            body: `import numpy as np

class Dropout:
    """Inverted dropout. Mask drawn fresh on every forward pass during training."""
    def __init__(self, p=0.5):
        assert 0.0 <= p < 1.0
        self.p = p
        self.mask = None
        self.training = True

    def forward(self, h):
        if not self.training or self.p == 0.0:
            return h
        # Bernoulli(1 - p) survival mask, rescaled by 1 / (1 - p)
        keep = 1.0 - self.p
        self.mask = (np.random.rand(*h.shape) < keep) / keep
        return h * self.mask

    def backward(self, grad_out):
        # gradient flows only through the surviving units, with the same 1/(1-p) factor
        if not self.training or self.p == 0.0:
            return grad_out
        return grad_out * self.mask


# quick sanity check: expectation matches at train and test time
np.random.seed(0)
layer = Dropout(p=0.5)
h = np.ones((10_000,))

layer.training = True
train_out = layer.forward(h)
print("train E[out] =", train_out.mean())   # ~1.0  (inverted dropout preserves the mean)

layer.training = False
test_out = layer.forward(h)
print("test  E[out] =", test_out.mean())    # exactly 1.0  (identity)


# the same thing in PyTorch — one line
import torch
import torch.nn as nn

drop = nn.Dropout(p=0.5)       # p is the DROP probability, not the keep probability
x = torch.ones(1, 10)

drop.train()
print(drop(x))                 # roughly half zeros, the rest doubled (1 / (1 - 0.5))

drop.eval()
print(drop(x))                 # identity — every entry is 1.0`,
          },
          {
            kind: 'callout',
            tone: 'tip',
            body: `**\`.train()\` vs \`.eval()\` is the single most common dropout bug.** Dropout (and batch norm) behave differently in training and inference mode, and the switch is global per module. Forgetting \`model.eval()\` before validation gives you noisy, wrong loss numbers that change every time you run the loop. Forgetting \`model.train()\` after validation freezes dropout off for the rest of the epoch and your training accuracy will look suspiciously high while generalization collapses. Wrap validation in \`with torch.no_grad(): model.eval(); ...; model.train()\` and the bug stops happening.`,
          },
          {
            kind: 'prose',
            heading: 'Variants and when to use them',
            body: `Vanilla dropout is the default. A handful of variants exist for specific situations:

- **Spatial dropout** (a.k.a. dropout2d). For convolutional layers, dropping individual pixels is barely a regularizer — neighbouring pixels are heavily correlated, so the network can just average over the missing one and ignore the mask. Spatial dropout drops an *entire channel* at a time instead, forcing the network to be robust to the loss of a whole feature map. Use this in CNNs rather than the plain version.
- **DropConnect.** Instead of zeroing activations, zero individual *weights* in the layer. Same Bernoulli idea, applied one level deeper. Usually a bit stronger than dropout, harder to implement efficiently on a GPU, and only worth the trouble on very small networks.
- **Scheduled / annealed dropout.** Start training with a high \\(p\\) and decay it over epochs, so the early training is aggressively regularised and the late training fine-tunes the full network. Helps when the model is much bigger than the dataset can naturally support.
- **DropPath / stochastic depth.** In very deep residual networks (ResNets, vision transformers), drop entire residual blocks at random during training. The residual connection still flows through, so the network shortens stochastically. This is the dropout idea applied at the *layer* level rather than the *neuron* level, and it is the standard regularizer in modern vision transformers.

When to use dropout at all: large fully-connected networks, classifier heads on top of pretrained backbones, transformer feed-forward blocks (almost every transformer puts dropout after the attention output and inside the FFN). When to skip it: small networks where you are already underfitting (dropout just makes it worse), the convolutional trunk of a modern CNN once batch normalization is doing the regularization for you, and inside the attention softmax — attention dropout is a separate, tunable thing and you usually want it lower than the post-attention dropout.`,
          },
          {
            kind: 'prose',
            heading: 'The bugs you will actually hit',
            body: `Four failure modes show up repeatedly in real code:

1. **Forgetting \`.eval()\` at inference.** Discussed in the callout above. Symptom: noisy, irreproducible validation numbers; metrics that change between runs even with a fixed seed.
2. **Stacking dropout on top of batch norm.** The two regularizers fight. BN normalises using batch statistics that already include dropped units, so its running mean and variance drift away from the test-time distribution. The standard fix is to pick one — modern CNNs use BN and skip dropout in the conv trunk, while transformers use LayerNorm (which does not see batch statistics) and freely combine it with dropout. If you must use both, put dropout *after* the BN layer, not before.
3. **\\(p\\) too high.** \\(p = 0.5\\) was the original recommendation for fully-connected layers in 2014 and it is *aggressive*. With modern architectures and good initialization, \\(p\\) in the \\(0.1\\) to \\(0.3\\) range is usually a better default; \\(0.5\\) makes training unstable and slow on anything but very large MLPs. If your training loss is flatlining, your dropout is too high before your learning rate is too low.
4. **Applying dropout to the input or the logits.** Dropout on the input layer destroys signal indiscriminately — there is no redundancy to exploit yet. Dropout on the final logits or after the softmax silently destroys class probabilities. Place dropout *between* hidden layers, not at the boundaries of the network.`,
          },
          {
            kind: 'callout',
            tone: 'note',
            body: `**Reproducibility.** Dropout is the most common reason a "deterministic" PyTorch run produces different numbers across two runs with the same seed. The mask is sampled from a CUDA RNG whose state advances differently depending on kernel launch order. If you need bitwise reproducibility — usually for unit tests or paper-quality ablations — seed \`torch.manual_seed\`, \`torch.cuda.manual_seed_all\`, set \`torch.backends.cudnn.deterministic = True\`, and run on a single GPU. Or just turn dropout off in the test by calling \`model.eval()\`.`,
          },
          {
            kind: 'prose',
            heading: 'What to take away',
            body: `Dropout is a single line of code that randomly zeros activations during training and rescales the survivors by \\(1 / (1 - p)\\) so the expected output stays put. At inference it is a no-op. The mechanism breaks co-adaptation between neurons (every feature has to stand on its own) and approximates an ensemble over an exponential number of subnetworks (every weight ends up doing well on average across that ensemble). The two together explain why dropout often beats every other regularizer on overparameterised fully-connected models.

Real-world deployment is about the bookkeeping: train vs eval mode, where you put the dropout in the architecture, and what \\(p\\) you pick. Get those three right and dropout costs nothing and buys you a couple of points of validation accuracy almost for free. The next lessons in this pillar — L1 / L2 weight decay, batch normalization, and early stopping — give you a complete toolkit so you can pick the right regularizer for the symptom in front of you, the same way the *Vectors* lesson set up the algebra you are now applying one layer at a time.`,
          },
          {
            kind: 'prose',
            heading: 'Geometric intuition: corners of a hypercube',
            body: `Picture the activation vector \\(h \\in \\mathbb{R}^n\\) of a single hidden layer as a point in \\(n\\)-dimensional space. Without dropout, every training step pushes the gradient signal through that exact point. The weights downstream learn to read it precisely — they know the value of each coordinate and can rely on every dimension carrying its share of the answer. The geometry the next layer sees is a single, well-defined location in \\(\\mathbb{R}^n\\).

Now turn on dropout with \\(p = 0.5\\). The mask \\(m \\in \\{0, 1\\}^n\\) is a vertex of the \\(n\\)-dimensional Bernoulli hypercube — there are exactly \\(2^n\\) such vertices. After elementwise multiplication and the \\(1 / (1 - p)\\) rescale, the post-dropout activation \\(\\tilde h\\) lives at one of \\(2^n\\) possible positions, scattered around \\(h\\). The next layer is no longer asked "approximate the function at this one point"; it is asked "approximate the function on average across all \\(2^n\\) of these scattered points". The optimisation surface has been replaced by a noisy, averaged version of itself — and the minima it finds are the ones that are flat in every direction simultaneously, because a sharp minimum at \\(h\\) would not survive being jittered to a random vertex of the hypercube.

That single picture explains why dropout finds robust features. A sharp minimum is one where a small perturbation of the input ruins the answer. The hypercube of dropped activations is exactly a small perturbation of \\(h\\). The optimiser, forced to do well at every vertex, abandons sharp minima and settles into broad, flat basins. Flat basins generalise; sharp basins overfit. The geometry of the Bernoulli hypercube is doing the work that hand-tuned weight decay used to do, with none of the bookkeeping. Sample a mask, evaluate at a corner, descend on the average — that is the whole algorithm, and the whole reason it works.`,
          },
          {
            kind: 'prose',
            heading: 'Worked: dropout on a tiny two-layer MLP',
            body: `Step through one forward pass and one backward pass on a network small enough to do by hand. Two inputs, four hidden units, one output. Drop probability \\(p = 0.5\\) on the hidden layer. Inputs \\(x = [1,\\ 2]\\). Weights from input to hidden are \\(W_1\\) with rows \\([1,\\ 0]\\), \\([0,\\ 1]\\), \\([1,\\ 1]\\), \\([-1,\\ 1]\\); biases zero. Output weights \\(W_2 = [1,\\ 1,\\ 1,\\ 1]\\); bias zero. Target \\(y = 6\\). Use ReLU activations.

**Forward, no dropout.** Pre-activations: \\(z_1 = (1)(1) + (0)(2) = 1\\), \\(z_2 = (0)(1) + (1)(2) = 2\\), \\(z_3 = (1)(1) + (1)(2) = 3\\), \\(z_4 = (-1)(1) + (1)(2) = 1\\). All positive, so \\(h = [1,\\ 2,\\ 3,\\ 1]\\). Output \\(\\hat y = 1 + 2 + 3 + 1 = 7\\). MSE loss \\(\\tfrac{1}{2}(7 - 6)^2 = 0.5\\).

**Forward with dropout mask \\(m = [1,\\ 0,\\ 1,\\ 1]\\).** Survival probability is \\(1 - p = 0.5\\), so the rescale is \\(1 / 0.5 = 2\\). Post-dropout activations: \\(\\tilde h = [2,\\ 0,\\ 6,\\ 2]\\). Output \\(\\hat y = 2 + 0 + 6 + 2 = 10\\). Loss \\(\\tfrac{1}{2}(10 - 6)^2 = 8\\). The noise from the mask pushed the prediction further off — that is the point, the gradient that follows is noisy too.

**Backward.** Output gradient \\(\\partial L / \\partial \\hat y = \\hat y - y = 4\\). Gradient on the rescaled activations: \\(\\partial L / \\partial \\tilde h = 4 \\cdot W_2 = [4,\\ 4,\\ 4,\\ 4]\\). Multiply by the mask and rescale: \\(\\partial L / \\partial h = [4 \\cdot 2,\\ 0,\\ 4 \\cdot 2,\\ 4 \\cdot 2] = [8,\\ 0,\\ 8,\\ 8]\\). Neuron 2 received zero gradient — its row of \\(W_1\\) does not update on this minibatch. The other three rows update with a doubled gradient because the rescale factor came along for the ride. Average that pattern over many minibatches and every weight gets touched roughly the same number of times, but each individual step is sparse and aggressive on the survivors — exactly the bagging dynamic that produces robust features.`,
          },
          {
            kind: 'prose',
            heading: 'Further reading',
            body: `- [Srivastava, Hinton et al. — Dropout paper](https://jmlr.org/papers/v15/srivastava14a.html) — "Dropout: A Simple Way to Prevent Neural Networks from Overfitting"; the original JMLR paper with the full ablation table.
- [Hinton et al. — "Improving neural networks by preventing co-adaptation of feature detectors"](https://arxiv.org/abs/1207.0580) — the 2012 tech report that introduced dropout; the noisy ensemble intuition in its purest form.
- [Gal & Ghahramani — "Dropout as a Bayesian Approximation"](https://arxiv.org/abs/1506.02142) — why MC-dropout at inference time gives you calibrated uncertainty estimates for free.`,
          },
        ],
      },
      {
        slug: 'batch-norm',
        title: 'Batch normalization',
        oneLiner: 'Re-center and re-scale layer activations. Made training 10x deeper networks possible.',
        difficulty: 'intermediate',
        readMinutes: 11,
        sections: [
          {
            kind: 'prose',
            heading: 'The pre-2015 problem',
            body: `Before batch normalization, training a deep network was a fragile art. Stack ten fully-connected layers, pick a learning rate slightly off, and the network would either diverge in the first hundred steps or sit at the random-init loss for an epoch and refuse to learn. You ended up tuning learning-rate schedules, initialization schemes (Xavier, He), and per-layer activation choices like a chemist balancing reagents, and even then six-layer networks were the comfortable ceiling for image classification.

The mechanical reason: as gradients flow backward through many layers, small numerical mismatches compound. A layer whose pre-activations are slightly too large pushes its successor into the saturating tail of \`tanh\`, which kills the gradient, which starves the layer before it, which now updates too slowly to fix the distribution it was emitting. The whole stack is coupled. This is the same numerical sensitivity the *Floating point* lesson in the Numerical Methods pillar warned about, except now it is dynamic — the distribution your layer outputs changes every gradient step as the upstream weights move.

In 2015 Ioffe and Szegedy proposed a single-paragraph fix that turned out to be one of the most consequential papers of the decade: normalise the activations of every layer to zero mean and unit variance *as part of the network itself*, using the statistics of the current minibatch. After batch normalization, ResNet-152 trains in a long weekend on hardware that had previously struggled with VGG-16. Dropout, which used to be the dominant regularizer for the conv trunk, became unnecessary on most CNN architectures. The whole stack of tricks the field had accumulated around fragile-deep-network training collapsed into one layer.`,
          },
          {
            kind: 'prose',
            heading: 'What batch norm actually fixes',
            body: `Picture the activations flowing through an untrained ten-layer network on the first forward pass. Layer 1 emits values roughly bounded by whatever the initialisation scheme picked — say \\([-1, 1]\\). Layer 2 multiplies those by its own random weights and emits values in \\([-5, 5]\\). Layer 5, after four more random multiplications, might be producing activations in \\([0, 1000]\\); the next layer, with a slightly different weight magnitude, lands in \\([-50, 50]\\). Nothing here is broken — the forward pass runs fine — but the optimizer that consumes the resulting gradients now has to chase a distribution that changes shape every single step. Every gradient update to layer 4's weights moves the distribution that layer 5 sees, which moves the distribution that layer 6 sees, and so on down the stack. The original Ioffe–Szegedy paper named this **internal covariate shift**: deeper layers cannot settle on a useful representation because the inputs they are trying to learn against are a moving target.

Batch norm intervenes by normalising each feature column to mean zero and unit variance across the current minibatch — \\(\\hat x = (x - \\mu) / \\sigma\\) — and then re-scaling with learned \\(\\gamma\\) and \\(\\beta\\). After the layer, the next stage of the network sees activations from a controlled, predictable distribution regardless of what the upstream weights happen to look like right now. The optimizer no longer has to spend capacity tracking distribution drift; it can use that capacity to learn the actual task. Because the post-BN activations are bounded in scale, the gradients flowing backward through them are also bounded, which is what lets you push the learning rate up by an order of magnitude without diverging — the practical effect that turned ResNet-152 from a research curiosity into a weekend training job.

The original covariate-shift framing is now disputed. In 2018 Santurkar et al. ran the experiment of *deliberately re-introducing* distribution shift after the BN layer — randomly perturbing the post-BN activations to move the mean and variance around — and found that the network trained just as fast. If the shift were the real bottleneck, that intervention should have wrecked optimisation. It did not. The modern explanation is that BN **smooths the loss landscape**: the normalisation step reparameterises the optimisation problem so that the loss surface has smaller, more uniform curvature, which is why bigger steps stay safe. The fix works either way; the named diagnosis just turned out to be incomplete.`,
          },
          {
            kind: 'prose',
            heading: 'Worked: BN on a tiny batch',
            body: `Walk through the arithmetic on a minibatch small enough to do by hand. Take one feature dimension flowing through a hidden layer; the five values produced by the current minibatch are \\(x = [2,\\ 4,\\ 6,\\ 8,\\ 10]\\). Batch size \\(B = 5\\). The goal is to produce the BN output \\(y\\) one step at a time.

Step 1, mean. Sum the values: \\(2 + 4 + 6 + 8 + 10 = 30\\). Divide by the batch size: \\(\\mu = 30 / 5 = 6\\). So the column is centred at 6, which the next layer would otherwise have to learn to handle as an offset.

Step 2, variance. Subtract the mean from each entry and square:
\\[
\\sigma^2 = \\frac{(2-6)^2 + (4-6)^2 + (6-6)^2 + (8-6)^2 + (10-6)^2}{5} = \\frac{16 + 4 + 0 + 4 + 16}{5} = \\frac{40}{5} = 8
\\]
Standard deviation: \\(\\sigma = \\sqrt{8} \\approx 2.83\\). Ignore the \\(\\epsilon\\) for hand calculation — it only matters when the batch happens to be constant.

Step 3, normalise. For each entry compute \\(\\hat x_i = (x_i - \\mu) / \\sigma\\):
\\[
\\hat x = \\left[\\tfrac{2-6}{2.83},\\ \\tfrac{4-6}{2.83},\\ \\tfrac{6-6}{2.83},\\ \\tfrac{8-6}{2.83},\\ \\tfrac{10-6}{2.83}\\right] \\approx [-1.41,\\ -0.71,\\ 0,\\ 0.71,\\ 1.41]
\\]
Confirm: the mean of \\(\\hat x\\) is zero, the variance is one. That is the whole point — the column the next layer sees has a fixed scale regardless of how the upstream weights drift.

Step 4, scale and shift. The network now applies \\(y = \\gamma \\cdot \\hat x + \\beta\\). With the BN module freshly initialised at \\(\\gamma = 1\\), \\(\\beta = 0\\), the output is just \\(\\hat x\\) unchanged. After training, suppose the optimizer has settled on \\(\\gamma = 2\\), \\(\\beta = 3\\). Then \\(y = 2 \\hat x + 3 \\approx [0.18,\\ 1.58,\\ 3,\\ 4.42,\\ 5.82]\\). The learned \\(\\gamma, \\beta\\) let the network *recover* whatever mean and variance it actually wants downstream of the normalisation — including, in the limit, the original raw distribution.`,
          },
          {
            kind: 'prose',
            heading: 'BatchNorm at inference time',
            body: `Everything above assumed a real minibatch was available so that \\(\\mu\\) and \\(\\sigma\\) could be computed from the data in front of the layer. At inference time that assumption breaks. You might be classifying a single image, where the "batch" of one has variance zero and the normalisation would divide by \\(\\epsilon\\); or you might be serving requests one at a time on production hardware, where there is no meaningful batch at all. Using the current batch statistics in that regime would make the output of the network depend on whatever other inputs happened to be in the call, which violates the most basic guarantee a model is supposed to give — same input, same output.

The fix is built into the layer. During training, alongside the trainable \\(\\gamma\\) and \\(\\beta\\), BatchNorm maintains two non-trainable *buffers*: \\(\\mu_{\\text{run}}\\) and \\(\\sigma^2_{\\text{run}}\\). Each forward pass updates them by exponential moving average — the new batch statistics get a small weight (PyTorch defaults the momentum to \\(0.1\\)), the accumulated estimate keeps the rest. After thousands of training steps these running averages are good estimates of the population statistics on the training distribution.

At inference time the layer switches behaviour entirely. It ignores the current batch and normalises with the frozen \\(\\mu_{\\text{run}}\\) and \\(\\sigma^2_{\\text{run}}\\), then applies the learned \\(\\gamma, \\beta\\) on top. Same input gives the same output every call, batch size of one works fine, and the network is reproducible across deployment environments. The trade-off is that the running stats encode *which data you trained on* — re-train on a different distribution and the running averages move with it, which makes BN networks subtly sensitive to training-time data order and augmentation choices.

This batch-coupling is exactly what **LayerNorm** avoids. LayerNorm normalises across the feature axis within a single example, never touching the batch dimension, so it behaves identically at train and inference time and the question of running averages never comes up. That is why every modern transformer uses LayerNorm. Two more variants worth knowing: **GroupNorm** (normalise across a group of channels per example, batch-independent like LayerNorm but more localised per-channel — the standard choice for detection and segmentation models stuck with tiny batches) and **RMSNorm** (LayerNorm with the mean-subtraction step dropped, used in the LLaMA family because it saves one reduction per forward pass at no measurable loss in quality).`,
          },
          {
            kind: 'prose',
            heading: 'Internal covariate shift — the hypothesis, and the rebuttal',
            body: `The original paper framed the problem as **internal covariate shift**: as the weights of layer \\(k\\) change during training, the distribution of inputs that layer \\(k+1\\) sees keeps shifting underneath it. Layer \\(k+1\\) cannot settle on a useful representation because its input is a moving target. Normalising every layer's inputs, the argument went, fixes the target and lets each layer optimise against a stable distribution.

This explanation stuck for years. It is intuitive, it explains why deeper networks suffer more (more layers, more shift), and it suggests the cure follows directly. The trouble is that later research could not actually confirm the mechanism. In 2018 Santurkar et al. ran the experiment of *adding* artificial covariate shift after the batch norm layer — randomly perturbing the post-BN activations to deliberately move the distribution around — and found that the network still trained just as fast. If covariate shift were the bottleneck, that intervention should have wrecked training. It did not.

What batch norm actually does, the follow-up papers argue, is **smooth the loss landscape**. The normalisation step reparameterises the optimisation problem so that the loss as a function of the weights has smaller, more uniform curvature. Gradients become more predictable from step to step, which is why you can crank the learning rate up by an order of magnitude without diverging. The "internal covariate shift" story is a plausible narrative for a real effect (smoother optimisation, faster convergence), but the named mechanism is mostly wrong. The cure works; the diagnosis was off. This is a healthy reminder that "explains what we observe" and "is the actual cause" are different bars in ML research.`,
          },
          {
            kind: 'math',
            heading: 'The batch norm transform',
            body: `Take a minibatch of \\(B\\) examples flowing through a hidden layer that produces activations \\(x \\in \\mathbb{R}^{B \\times d}\\) — one row per example, \\(d\\) features per row. Batch norm operates **per feature dimension**, treating each column independently. For column \\(j\\):

\\[
\\mu_j = \\frac{1}{B} \\sum_{i=1}^{B} x_{i,j}, \\qquad \\sigma_j^2 = \\frac{1}{B} \\sum_{i=1}^{B} (x_{i,j} - \\mu_j)^2
\\]

Subtract the mean, divide by the standard deviation (with a tiny \\(\\epsilon\\) to avoid dividing by zero on a degenerate batch):

\\[
\\hat x_{i,j} = \\frac{x_{i,j} - \\mu_j}{\\sqrt{\\sigma_j^2 + \\epsilon}}
\\]

Now every column has mean zero and unit variance across the batch. If we stopped here we would have lost something — the layer can no longer represent any output whose first two moments differ from \\((0, 1)\\). So we add two learned per-feature parameters \\(\\gamma_j\\) (scale) and \\(\\beta_j\\) (shift) and emit:

\\[
y_{i,j} = \\gamma_j \\, \\hat x_{i,j} + \\beta_j
\\]

\\(\\gamma\\) and \\(\\beta\\) are vectors of length \\(d\\), trained by backprop alongside the rest of the weights. Their job is to give the network back the freedom we just took away — if the *optimal* output of this layer happens to have mean \\(\\beta_j\\) and standard deviation \\(\\gamma_j\\), the network can recover it exactly. In the extreme case, setting \\(\\gamma_j = \\sqrt{\\sigma_j^2 + \\epsilon}\\) and \\(\\beta_j = \\mu_j\\) makes batch norm a no-op — the network can *undo* the normalisation if that turns out to be the right thing to do. In practice it almost never wants to, but the option being available is what keeps batch norm from costing representational capacity.`,
          },
          { kind: 'viz', heading: 'Activations before and after batch norm', component: 'BatchNormScatterViz' },
          {
            kind: 'prose',
            heading: 'Train mode, eval mode, and the running averages',
            body: `Batch norm has two distinct behaviours and the framework decides which one runs based on the module's mode — the same \`.train()\` / \`.eval()\` switch the *Dropout* lesson warned about, with the same family of bugs attached.

In **training mode** the layer uses the statistics of the current minibatch: compute \\(\\mu_B\\) and \\(\\sigma_B^2\\) from the \\(B\\) rows in front of you, normalise with those, apply \\(\\gamma, \\beta\\). The same forward pass also updates two non-trainable buffers, \\(\\mu_{\\text{run}}\\) and \\(\\sigma_{\\text{run}}^2\\), by exponential moving average:

\\[
\\mu_{\\text{run}} \\leftarrow (1 - \\alpha) \\, \\mu_{\\text{run}} + \\alpha \\, \\mu_B
\\]

with \\(\\alpha\\) the *momentum* (PyTorch defaults to \\(0.1\\); confusingly, this is the weight on the *new* batch, not the historical estimate). Same recurrence for the variance. These running averages accumulate across thousands of minibatches and end up being good estimates of the population statistics on the training distribution.

In **eval mode** the layer ignores the current batch entirely and uses \\(\\mu_{\\text{run}}\\) and \\(\\sigma_{\\text{run}}^2\\) instead. This is essential at inference time — you might be classifying a single image, and a "batch" of one has variance zero, which would make the normalisation explode. It is also essential for **deterministic** behaviour: at eval time the same input always produces the same output, regardless of what other inputs happen to be in the same call.

This is why batch norm and dropout share the same family of bugs. Forgetting \`model.eval()\` before validation makes BN renormalise every validation batch with its own (small, noisy) statistics, and your reported loss becomes a function of validation batch size rather than model quality. Forgetting \`model.train()\` after validation freezes the running averages and the network slowly drifts away from them as training continues. The fix is identical to dropout: wrap evaluation in \`model.eval(); ...; model.train()\` and the bug stops happening.`,
          },
          {
            kind: 'callout',
            tone: 'tip',
            body: `**Batch size eats batch norm alive.** The whole layer is built around treating the minibatch as a stand-in for the population. When \\(B = 32\\) on ImageNet, the batch statistics are tight estimates of the underlying distribution and BN works beautifully. When \\(B = 2\\) — which is what you get on large detection / segmentation models that barely fit a single image in GPU memory — \\(\\mu_B\\) and \\(\\sigma_B^2\\) are noisy guesses, the normalisation jitters wildly between steps, and training destabilises. Below \\(B \\approx 8\\) batch norm starts hurting more than it helps. The standard fixes are **synchronized BN** (compute statistics across GPUs to get a bigger effective batch), **group norm** (normalise across a group of channels in a single example — independent of batch size), or just switching to **layer norm** for transformer-style architectures.`,
          },
          {
            kind: 'prose',
            heading: 'Before or after the activation? The debate that will not die',
            body: `The original 2015 paper put batch norm **before** the activation function: \`Linear -> BN -> ReLU\`. The argument was clean — you want the *input* to the nonlinearity to be a tame, zero-mean distribution so it does not saturate the activation. With \`tanh\` and \`sigmoid\` this matters a lot; with ReLU it matters less but still helps. Almost every textbook and the official ResNet code follow this ordering.

A vocal minority argues the other way: \`Linear -> ReLU -> BN\`. The intuition is that ReLU produces a non-negative, half-Gaussian-shaped distribution that BN can normalise much more *informatively* than a symmetric pre-activation, since the post-ReLU distribution is what the next layer actually sees and is what you really want to control. Empirically, results are within noise on most benchmarks, with the post-activation ordering sometimes winning by a hair on very deep networks.

For practical purposes: use the **pre-activation** ordering (\`Linear -> BN -> ReLU\`) unless you are reproducing a paper that explicitly does it the other way. ResNet v2, the version most modern code is based on, actually puts BN even *earlier* — inside the residual block as \`BN -> ReLU -> Conv\` — but that is an architecture-specific choice tied to the residual connection, not a general rule. When in doubt, follow the architecture you are copying; the difference is small enough that consistency matters more than which side wins.`,
          },
          {
            kind: 'code',
            language: 'python',
            heading: 'BatchNorm1d and BatchNorm2d in PyTorch',
            body: `import torch
import torch.nn as nn

# ---- BatchNorm1d: one statistic per feature dimension ----
# input shape: (B, C) for an MLP, or (B, C, L) for a 1D conv signal
bn1 = nn.BatchNorm1d(num_features=64)

x_mlp = torch.randn(32, 64)            # batch of 32, 64 features
y_mlp = bn1(x_mlp)
print(y_mlp.shape)                      # torch.Size([32, 64])

# parameter count: 2 per channel (gamma, beta)
n_params = sum(p.numel() for p in bn1.parameters())
print(f"BatchNorm1d(64) trainable params: {n_params}")    # 128  (= 2 * 64)

# plus two non-trainable BUFFERS (running mean, running var) — same size, same count
buffers = sum(b.numel() for b in bn1.buffers() if b.dtype.is_floating_point)
print(f"BatchNorm1d(64) running-stat buffers: {buffers}") # 128

# ---- BatchNorm2d: one statistic per channel for convnets ----
# input shape: (B, C, H, W). statistics computed across B, H, W for each channel.
bn2 = nn.BatchNorm2d(num_features=16)
x_img = torch.randn(8, 16, 32, 32)      # batch of 8, 16 feature maps of 32x32
y_img = bn2(x_img)
print(y_img.shape)                      # torch.Size([8, 16, 32, 32])

# again, 2 trainable params per channel
print(sum(p.numel() for p in bn2.parameters()))   # 32  (= 2 * 16)

# ---- Train vs eval mode in action ----
bn = nn.BatchNorm1d(4)
bn.train()
for _ in range(5):
    bn(torch.randn(16, 4) * 2 + 3)      # mean ~3, std ~2
print("running_mean after training:", bn.running_mean)
print("running_var  after training:", bn.running_var)

bn.eval()
sample = torch.randn(1, 4) * 2 + 3
print("eval output uses running stats, ignores this batch:", bn(sample))

# ---- A typical MLP block: Linear -> BN -> ReLU ----
block = nn.Sequential(
    nn.Linear(128, 256),
    nn.BatchNorm1d(256),
    nn.ReLU(inplace=True),
)`,
          },
          {
            kind: 'prose',
            heading: 'Layer norm, group norm, instance norm',
            body: `Batch norm normalises across the *batch* axis: one statistic per feature, computed by sweeping over the examples in the minibatch. Three close relatives swap that axis for a different one, and each one solves a problem that vanilla BN does not.

**Layer norm.** Normalise across the *feature* axis instead. For a single example with hidden vector \\(h \\in \\mathbb{R}^d\\), compute \\(\\mu\\) and \\(\\sigma\\) over those \\(d\\) entries, normalise, then apply per-feature \\(\\gamma, \\beta\\). Every example is normalised independently — the batch size could be one and nothing changes. This is the right choice for sequence models and transformers, where a "minibatch" might actually be a single very long sequence and the batch statistics would be meaningless. Every transformer block uses layer norm; batch norm essentially never appears in modern NLP architectures.

**Instance norm.** For images, normalise across spatial dimensions \\(H \\times W\\) per channel, per example. Used in style-transfer networks where the average brightness / contrast of an image is a *style* you want to strip out before the network looks at content. Instance norm makes the network ignore global tone and focus on local structure — exactly what you want when synthesizing a Van Gogh from a photograph.

**Group norm.** A compromise between layer norm and instance norm: split the \\(C\\) channels into \\(G\\) groups (often \\(G = 32\\)) and normalise across the group plus the spatial dimensions, per example. Independent of batch size like layer norm, but more localised per-channel than pure layer norm. The standard choice for detection and segmentation models that have to use tiny batch sizes — Mask R-CNN, DETR variants — where batch norm collapses.

The pattern across all four is the same as in the *Vectors* lesson on norms: you pick a set of axes to sweep when computing the statistic, and the choice encodes what kind of variation you want to *normalise out* versus what you want the network to learn to handle. BN treats batch variation as noise; LN treats feature scale as noise; IN treats spatial average as noise; GN compromises. The right choice depends on the model and the data, not on tradition.`,
          },
          {
            kind: 'prose',
            heading: 'Effects on optimisation — why it actually helps',
            body: `Three concrete things change when you add batch norm to a network, and all three are worth tracking in your own ablations.

**Higher learning rates become safe.** Without BN, a learning rate twice too large in a 50-layer network sends the activations to infinity within a hundred steps. With BN, the post-normalisation activations are bounded in scale every layer, so a large gradient on one weight cannot blow up the downstream distribution. The standard ResNet recipe trains at learning rate \\(0.1\\) — an order of magnitude higher than what worked pre-BN — and that single change accounts for much of the wall-clock speedup. The smooth-loss-landscape story from earlier formalises this: BN bounds the gradient magnitudes, so the optimiser tolerates bigger steps before destabilising.

**Faster convergence.** ImageNet-scale CNNs reach the same validation accuracy in a third to a half of the epochs they used to need. The effect compounds with depth: small networks see a modest speedup, very deep ones see a dramatic one. This is the reason ResNet-152, GoogLeNet, and the architectures that followed became practical at all — without BN, simply stacking enough layers caused the optimisation to fail before it could exploit the extra capacity.

**Implicit regularisation.** Because the batch statistics are noisy estimates of the population, each forward pass during training sees slightly different normalisation parameters depending on which other examples landed in the same batch. The network sees this noise as a mild stochastic perturbation, similar in spirit to dropout but coming from a different source. In modern CNNs this regularisation is often *enough on its own* — adding dropout on top stops helping, as called out in the *Dropout* lesson's "bugs you will actually hit" section. The two regularizers fight, and BN usually wins.`,
          },
          {
            kind: 'callout',
            tone: 'note',
            body: `**The train/eval mode bug, one more time.** It bears repeating because it shows up constantly. If your validation loss is suspiciously *better* than your training loss, or it changes when you re-run validation with a different batch size, or it diverges in the first few epochs and then mysteriously recovers — check that \`model.eval()\` is called before the validation loop and \`model.train()\` is restored after. Same trap as dropout, different symptom: with BN, the bug warps your reported metrics; with dropout, it adds noise. The fix is identical. Wrap validation in a single helper that flips the mode for you and you will never debug this again.`,
          },
          {
            kind: 'prose',
            heading: 'What to take away',
            body: `Batch normalization normalises each feature channel by the mean and variance of the current minibatch, then re-scales by learned \\(\\gamma\\) and shifts by learned \\(\\beta\\) — two extra parameters per channel, which is rounding error next to the rest of the network. At inference it switches to the running averages accumulated during training so the layer is independent of whatever happens to be in the current batch. The transform makes deep networks trainable at learning rates that would have diverged without it, smooths the loss landscape so gradients stay predictable across steps, and supplies a free dose of regularisation on top.

The original "internal covariate shift" story is mostly a folk explanation; the real win is the geometry of the loss landscape. The cure works whether or not the diagnosis was right — but knowing the difference keeps you from chasing the wrong knob when BN does not solve your problem. The bookkeeping (train vs eval mode, batch size large enough to estimate statistics, ordering relative to the activation) is the same kind of detail the *Dropout* lesson covered, and the same kind that separates a model that just works from one that mysteriously trains badly.

The next lessons in this pillar push regularisation further: explicit weight penalties (L1, L2 / weight decay), early stopping, and data augmentation. Each one attacks the overfitting problem from a different angle, and the same rule from *Vectors* and *Matrices* applies — pick the tool whose assumptions match your symptom, not the one that worked on the last project.`,
          },
          {
            kind: 'prose',
            heading: 'Further reading',
            body: `- [Ioffe & Szegedy — Batch Normalization paper](https://arxiv.org/abs/1502.03167) — "Batch Normalization: Accelerating Deep Network Training by Reducing Internal Covariate Shift"; the original paper, including the running-stats trick used at inference.
- [Santurkar et al. — "How Does Batch Normalization Help Optimization?"](https://arxiv.org/abs/1805.11604) — the smoother-loss-landscape rebuttal to "internal covariate shift" as the real explanation.
- [Ba, Kiros & Hinton — Layer Normalization paper](https://arxiv.org/abs/1607.06450) — the per-sample variant that every modern transformer uses instead of BN.`,
          },
        ],
      },
      {
        slug: 'residual-connections',
        title: 'Residual connections',
        oneLiner: 'Add the input back to the output. The one-line trick that made 100-layer networks trainable.',
        difficulty: 'intermediate',
        readMinutes: 9,
        sections: [
          {
            kind: 'prose',
            heading: 'The degradation problem nobody expected',
            body: `By 2014 the field had spent two years convincing itself that depth was the lever. AlexNet at 8 layers beat everything; VGG at 19 layers beat AlexNet; GoogLeNet at 22 layers beat VGG. The natural extrapolation was simple — keep stacking. Then someone tried 56 layers on CIFAR-10 and the network was *worse* than a 20-layer baseline. Not just worse on validation, where overfitting could have been the culprit, but worse on the **training** set. The deeper network could not even memorise the data the shallower one had no trouble with. That was a surprise. Capacity went up, optimisation got harder, and the model failed to use the extra layers it had.

This was not vanishing gradients — by 2015 the *Batch norm* lesson's tools (sensible init, batch normalisation, ReLU activations) had already tamed the worst of that problem. The 56-layer net trained smoothly; its activations did not explode or collapse; its gradient norms looked healthy. It just refused to learn anything useful past a certain depth. He, Zhang, Ren and Sun named this the **degradation problem** and pointed out a deeply uncomfortable fact: a 56-layer network can always *simulate* a 20-layer network by setting the extra 36 layers to the identity function. So the deeper model has strictly more representational capacity than the shallow one. The fact that SGD could not find that solution meant the optimisation landscape was the bottleneck, not the model class.

The fix turned out to be a single line of code. Make it easier for a layer to *do nothing* — to behave like the identity — by changing what the layer is asked to learn. That is the entire idea behind residual connections, and it is the reason every architecture you have heard of since 2015 — ResNet, U-Net, every transformer block in the *Attention* lesson, every diffusion model backbone — is built around it.`,
          },
          {
            kind: 'prose',
            heading: 'Identity shortcut for gradient flow',
            body: `Strip the block down to a single scalar to see why the skip matters at the level of calculus. Without a residual connection, a layer is a function \\(y = F(x)\\) and the gradient that flows back through it is

\\[
\\frac{\\partial y}{\\partial x} = F'(x).
\\]

Stack \\(L\\) of those and the gradient at the input is a product \\(\\prod_{k=1}^{L} F_k'(x_k)\\). If each factor is even slightly less than 1 — which it almost always is after a saturating activation, a normalisation that shrinks variance, or a linear layer initialised conservatively — the product collapses exponentially. Backprop is multiplication, and multiplication is brutal over depth. The first layer of a 50-deep network receives a gradient that is numerically zero, never updates, and its features stay random forever. The *Backprop* lesson called this the vanishing-gradient regime; it is the reason early-2010s networks plateaued around 20 layers regardless of how clever the initialisation got.

Add a skip and the same algebra produces a different answer. The block now computes \\(y = x + F(x)\\), and differentiating gives

\\[
\\frac{\\partial y}{\\partial x} = 1 + F'(x).
\\]

That \\(1\\) is not a coincidence — it is the derivative of the skip wire, which copies \\(x\\) through with no transformation. Whatever \\(F'(x)\\) does, the gradient that flows backward is bounded *below* by a constant. It cannot vanish, because there is a path through the block that has multiplicative factor exactly 1. The learned branch \\(F\\) can still contribute — and during training it learns to — but the gradient highway is always open underneath.

This connects directly to the **identity mapping hypothesis** that motivated the architecture in the first place. The easiest function for a residual block to represent is the identity: set \\(F \\approx 0\\) and the block outputs \\(x\\) unchanged. Random initialisation puts \\(F\\) near zero by default, so untrained ResNets start out as near-identity stacks and learn small useful corrections on top. ResNet's 2015 paper trained a 152-layer network to convergence — five times deeper than anything before it — because the gradient at layer 1 was still O(1) regardless of how many residual blocks sat between it and the loss.`,
          },
          {
            kind: 'prose',
            heading: 'Worked: gradient through 50 residual layers',
            body: `Pick a concrete number and follow it backward through a deep stack. Suppose every block's learned branch \\(F\\) has spectral radius around \\(0.9\\) — a realistic figure for a ReLU-conv-BN sub-network after a few epochs of training. That means each block, viewed as a linear map for small perturbations, shrinks gradients by a factor of \\(0.9\\) on average.

Stack 50 of these the classical way, with no skips. The gradient at the input is the product of 50 per-layer Jacobians, and each Jacobian contributes a factor of \\(0.9\\):

\\[
\\left|\\frac{\\partial \\mathcal{L}}{\\partial x_0}\\right| \\approx 0.9^{50} \\approx 0.0052.
\\]

The signal that reaches the first layer is roughly \\(1/200\\) of the signal at the loss. In single-precision float, after dividing by a typical learning rate, the update is well below the noise floor of the optimiser. The first layer simply does not move. Try 100 layers and \\(0.9^{100} \\approx 2.7 \\times 10^{-5}\\) — vanished entirely. This is the empirical wall the field hit before residual connections existed: training loss on a 56-layer plain net stayed strictly worse than on a 20-layer baseline, because the deeper net's early layers received no usable gradient and could not contribute.

Now switch every block to a residual one. The per-block Jacobian becomes \\(1 + F'(x)\\), which for our spectral-radius-\\(0.9\\) branch sits around \\(1 + 0.9 = 1.9\\) in the worst direction and very close to \\(1\\) on average across input directions. Even taking the pessimistic upper bound, the product over 50 layers is

\\[
\\prod_{k=1}^{50}\\big(1 + F_k'(x_k)\\big) \\approx 1.9^{50},
\\]

which is large rather than small — and in practice the optimiser controls this by keeping \\(F\\) near zero early in training. The point is not that the gradient grows; it is that it never *collapses*. Along the identity component the factor is exactly \\(1\\) per block, so the gradient that reaches \\(x_0\\) stays O(1) no matter how deep the stack goes. ResNet-152 has 152 layers; before residuals it would have been untrainable by a factor of \\(0.9^{152} \\approx 10^{-7}\\); after, it matches state of the art. The architecture's claim to fame is one subtraction inside a Jacobian.`,
          },
          {
            kind: 'prose',
            heading: 'Why every modern arch uses residual',
            body: `Once the gradient-highway argument is in hand, every architecture that succeeded after 2015 reads as a variation on the same theme. The trick generalises far past convolutional vision nets.

**Transformers.** Every encoder and decoder block in the *Attention* lesson has the structure \`x + Attention(LN(x))\` followed by \`x + FFN(LN(x))\` — two residual additions per block. The pre-LN variant moves LayerNorm *inside* the residual branch so the skip carries raw activations end-to-end; the post-LN variant from the original 2017 paper put LN after the addition and was harder to train at depth. Modern stacks — GPT, Llama, every production LLM — use pre-LN exactly because it preserves the gradient highway. A 70-layer transformer would be untrainable without it.

**U-Net.** The encoder-decoder segmentation architecture skips features from each encoder resolution directly to the matching decoder resolution. Same idea: give the decoder an unmolested copy of the spatial detail that the bottleneck would otherwise destroy. Without those skips, U-Net's upsampling path cannot reconstruct fine boundaries. Every diffusion-model backbone since 2020 — Stable Diffusion's UNet, the DALL-E variants — is built on this pattern.

**DenseNet.** Push the idea further: instead of *adding* \\(x + F(x)\\), *concatenate* \\([x, F(x)]\\) so every later layer sees every earlier layer's features stacked along the channel axis. More expensive in memory; same underlying insight that direct connections from early features to late layers fix gradient flow and parameter efficiency at once.

The mental model worth carrying out of this lesson is this: stop thinking of a deep network as a sequence of *replacements*, where each layer transforms its input into something completely new. Think of it as a sequence of *refinements* to a running representation. The skip is the running representation; the learned branch is this layer's small contribution to refining it. Every block has the option to do nothing — to pass the representation through unchanged — and the optimisation problem is to figure out which blocks should add what. This is the architectural lens the field has used since 2015, and it is not going away.`,
          },
          {
            kind: 'prose',
            heading: 'The fix — learn the residual, not the mapping',
            body: `Take a stack of two or three layers that you want to behave like a function \\(H(x)\\). The classical view is to train those layers to *produce* \\(H(x)\\) directly. The residual view rewrites the same target as

\\[
H(x) = F(x) + x
\\]

and asks the layers to produce only \\(F(x) = H(x) - x\\) — the *correction* to \\(x\\). The \\(+ x\\) at the end is not learned; it is a wire that copies the block's input around the layers and adds it to whatever they produced. Same expressive power, completely different optimisation problem.

Why is the second formulation easier? Because the *default* behaviour of the block changes. In the classical setup, the easiest function to represent is whatever the random init happens to produce — typically a small linear map close to zero, which is nowhere near the identity. To recover the identity the layers have to learn to be exactly \\(H(x) = x\\), which means \\(F(x) = x\\) — a non-trivial target. In the residual setup, the easiest function is \\(F(x) = 0\\), which is what a layer with small weights produces *by default*, and that gives you \\(H(x) = 0 + x = x\\) for free. The identity mapping — the thing the degradation experiment proved deep networks needed but could not find — is now the path of least resistance instead of a target that needs hunting.

This is the same kind of reparameterisation trick the *Batch norm* lesson described: the function class is unchanged but the geometry of the loss landscape is reshaped so that gradient descent flows toward useful solutions. ResNet-152 was the first network to train to convergence at 100+ layers and beat every shallower competitor. The architecture won the 2015 ImageNet challenge by a margin that ended the depth debate permanently.`,
          },
          {
            kind: 'viz',
            heading: 'A residual block',
            caption: 'The block computes F(x) through two conv-bn-relu sub-layers, then adds the original input x back before the final ReLU. The skip line carries x untouched around the transformation.',
            component: 'ResidualBlockViz',
          },
          {
            kind: 'math',
            heading: 'The gradient highway',
            body: `Set aside intuition for a second and just differentiate. For a residual block with output \\(y = F(x) + x\\), the Jacobian with respect to the input is

\\[
\\frac{\\partial y}{\\partial x} = \\frac{\\partial F(x)}{\\partial x} + I
\\]

where \\(I\\) is the identity matrix. That single \\(+ I\\) term is the whole story of why ResNets train.

In a classical deep network without skips, the gradient flowing backward through \\(L\\) layers is a product of \\(L\\) Jacobians: \\(J_L \\, J_{L-1} \\cdots J_1\\). If any one of those Jacobians has small singular values — and after the saturating regions of ReLU, BN, and a small-init linear layer, they often do — the product shrinks geometrically and the gradient that reaches the early layers is numerically zero. That is the vanishing-gradient problem the *Backprop* lesson called out: gradients survive only if every layer in the chain plays nice.

With residual blocks the per-block Jacobian is \\(F'(x) + I\\). Even if \\(F'(x) \\approx 0\\) — which is exactly what happens when the block has not learned anything yet, or is just being asked to behave like the identity — the gradient that flows backward is multiplied by something close to \\(I\\), not by zero. The signal survives. Stack a hundred residual blocks and the chain becomes

\\[
\\prod_{k=1}^{L} \\big(F_k'(x_k) + I\\big)
\\]

which, even when every \\(F_k'\\) is small, stays close to \\(I\\) instead of collapsing to zero. The skip connection is a gradient highway — a route along which the upstream gradient gets to the early layers unmolested. The learned residuals \\(F_k\\) are small corrections on top of that highway, not the load-bearing path. That is also why initialising the residual branch close to zero (a trick called Fixup or ReZero) makes very deep networks trainable without any normalisation at all: at init, every block is a near-identity and the gradient signal is preserved exactly.`,
          },
          {
            kind: 'prose',
            heading: 'Identity vs projection shortcuts',
            body: `The clean formula \\(y = F(x) + x\\) assumes \\(F(x)\\) and \\(x\\) have the same shape. Inside a single resolution / channel-count regime that holds by construction: the convs inside the block preserve spatial dimensions (stride 1, same padding) and keep the channel count fixed. The skip is a literal copy — zero parameters, zero compute.

The trouble arrives at the boundaries where the network downsamples spatially (stride 2) or widens the channel dimension. Now \\(F(x)\\) is, say, \\((B, 128, 28, 28)\\) but \\(x\\) is still \\((B, 64, 56, 56)\\); you cannot add tensors of different shapes. Two repairs are standard:

- **Identity with padding / pooling.** Average-pool \\(x\\) by stride 2 to match the spatial size and zero-pad the channel dimension from 64 to 128. Zero parameters, but the new channels start at zero and have to be filled in by \\(F\\) alone. This is the original ResNet paper's "option A".
- **Projection shortcut.** Replace the bare skip with a \\(1 \\times 1\\) convolution of stride 2 that maps \\((B, 64, 56, 56) \\to (B, 128, 28, 28)\\) directly. This adds a small number of learnable parameters (one per \\((in, out)\\) channel pair) and is what every modern implementation actually uses — the paper's "option B". The extra cost is negligible and the network learns a slightly better mapping than the zero-padded identity.

Inside a stage where the shape does not change, the skip stays a literal identity. Between stages — every place the network downsamples — the skip is a projection. The block's "residual" structure is preserved; only the wire carrying \\(x\\) gets a tiny linear adapter so the shapes line up. This is the same pattern any place residuals show up in a network with shape transitions: in a Transformer the embedding dimension stays constant across the entire encoder so the skip is always pure identity, which is why transformer code never has to worry about projection shortcuts.`,
          },
          {
            kind: 'prose',
            heading: 'Pre-activation vs post-activation',
            body: `The original 2015 ResNet paper put the block in the order \`Conv -> BN -> ReLU -> Conv -> BN -> (+) -> ReLU\`. The skip is added *before* the final ReLU; the activation function sits between blocks. This is **post-activation** residuals — the same kind of "BN before activation" decision the *Batch norm* lesson covered.

A year later the same authors published ResNet v2 with a reordered block: \`BN -> ReLU -> Conv -> BN -> ReLU -> Conv -> (+)\`, with no activation at the end. The activations now sit *inside* the residual branch, and the skip carries an unmodified tensor straight from the start of one block to the start of the next. This is **pre-activation**. On very deep networks (200+ layers) the pre-activation ordering trains more cleanly because the gradient highway is no longer interrupted by a ReLU at the join — the upstream gradient flows through the skip exactly, with no nonlinearity in the way. For depths under 100 the two orderings are within noise.

Transformers — covered in the *Attention* lesson — settled this question by going even further: every modern transformer block is **pre-norm**, meaning \`LayerNorm -> Attention -> (+) -> LayerNorm -> FFN -> (+)\`. The normalisation is moved *inside* the residual branch so the skip carries the raw activations through untouched. This is the same idea as ResNet v2 applied to a different architecture: protect the gradient highway. If you are building a network from scratch in 2026, use pre-activation / pre-norm by default; the only reason to use post-activation is reproducing a specific older paper.`,
          },
          {
            kind: 'code',
            language: 'python',
            heading: 'A ResidualBlock module in PyTorch',
            body: `import torch
import torch.nn as nn
import torch.nn.functional as F

class ResidualBlock(nn.Module):
    """Post-activation residual block, ResNet v1 style.
    out = ReLU( BN( Conv( ReLU( BN( Conv(x) ) ) ) ) + shortcut(x) )
    """

    def __init__(self, in_channels, out_channels, stride=1):
        super().__init__()
        self.conv1 = nn.Conv2d(
            in_channels, out_channels,
            kernel_size=3, stride=stride, padding=1, bias=False,
        )
        self.bn1 = nn.BatchNorm2d(out_channels)
        self.conv2 = nn.Conv2d(
            out_channels, out_channels,
            kernel_size=3, stride=1, padding=1, bias=False,
        )
        self.bn2 = nn.BatchNorm2d(out_channels)

        # projection shortcut when shape changes; identity otherwise
        if stride != 1 or in_channels != out_channels:
            self.shortcut = nn.Sequential(
                nn.Conv2d(in_channels, out_channels,
                          kernel_size=1, stride=stride, bias=False),
                nn.BatchNorm2d(out_channels),
            )
        else:
            self.shortcut = nn.Identity()

    def forward(self, x):
        residual = self.shortcut(x)

        out = F.relu(self.bn1(self.conv1(x)))      # first sub-layer
        out = self.bn2(self.conv2(out))            # F(x), no activation yet

        out = out + residual                       # the +x part
        return F.relu(out)                         # final activation


# A ResNet stage: blocks of the same channel width, first block may downsample.
def make_stage(in_c, out_c, n_blocks, stride):
    layers = [ResidualBlock(in_c, out_c, stride=stride)]
    for _ in range(n_blocks - 1):
        layers.append(ResidualBlock(out_c, out_c, stride=1))
    return nn.Sequential(*layers)


# Smoke test: stack 50 blocks, verify gradients reach the first layer.
net = nn.Sequential(*[ResidualBlock(16, 16) for _ in range(50)])
x = torch.randn(2, 16, 8, 8, requires_grad=True)
y = net(x).sum()
y.backward()
first_grad_norm = net[0].conv1.weight.grad.norm().item()
print(f"gradient norm at first layer after 50 blocks: {first_grad_norm:.4f}")
# Without residuals, this would be effectively zero. With them, it is order 1.`,
          },
          {
            kind: 'callout',
            tone: 'tip',
            body: `**The "+x" is why ResNet broke 100 layers.** Before residuals, the deepest networks that trained reliably were around 20 layers. ResNet-152 trained at 152 layers and won ImageNet by 3.6% top-5 error in a year when the field was fighting over tenths of a point. The next year ResNet-1001 trained — a thousand layers, all of them stacked residual blocks — and the only reason to stop there was diminishing returns, not optimisation failure. One line of code in the forward pass moved the practical depth ceiling by an order of magnitude. Almost no other architectural change has had that big a single-shot effect.`,
          },
          {
            kind: 'prose',
            heading: 'Residuals everywhere — Transformer, U-Net, diffusion',
            body: `Once you have seen the pattern you cannot un-see it. The *Attention* lesson's transformer block is two residual connections in a row: one around the multi-head attention layer, one around the position-wise feed-forward layer. Strip those skips out and a 12-layer transformer becomes untrainable — the same degradation problem ResNets fixed, in a different guise. Every modern language model is, structurally, a stack of residual blocks where \\(F\\) happens to be attention or an MLP instead of convolutions.

The U-Net family — the workhorse of medical image segmentation and the backbone of every diffusion model — is residual in a different way. It has the same "add the input back" trick across each encoder-decoder pair: features at a given resolution on the encoder side are concatenated (or added) to features at the same resolution on the decoder side, giving the decoder direct access to the high-resolution information without forcing it through the bottleneck. Stable Diffusion's UNet, the SDXL backbone, and every video diffusion model in the wild are built on top of residual blocks at every resolution, with attention layers (themselves residual) wired in at the deeper stages.

DenseNets generalise the idea further: instead of \\(y = F(x) + x\\), use \\(y = F(x, x_{\\text{prev1}}, x_{\\text{prev2}}, \\ldots)\\) where every block has access to the outputs of every previous block at the same resolution. More parameter-efficient than ResNet at small scales; the residual sum is just the simplest member of a family of "give the next layer direct access to earlier features" tricks. ResNet won because it is the easiest version of the idea to implement and reason about, and because the simple sum has the cleanest gradient algebra.

The takeaway is general: any time you find yourself stacking many homogeneous transformations and finding that the optimiser struggles past a certain depth, the residual trick is the first thing to try. It is one line of code, has near-zero compute cost (an addition), and converts a problem that needs careful initialisation, normalisation, and learning-rate scheduling into one that "just works."`,
          },
          {
            kind: 'callout',
            tone: 'note',
            body: `**The residual block is the secret sauce of Transformers too.** It is tempting to think of attention as the magic ingredient that made GPT and friends possible — but a 24-layer attention stack *without* residuals does not train. The residual connection around each attention block and each FFN block is what lets you scale a transformer past a handful of layers. Read any transformer paper's architecture diagram closely: the two "(+)" symbols inside the block are doing as much work as the multi-head attention boxes everyone draws. The architecture that ate NLP, vision, audio, and protein folding is structurally a deep ResNet whose \\(F\\) functions happen to be attention and MLPs.`,
          },
          {
            kind: 'prose',
            heading: 'What to take away',
            body: `Residual connections rewrite the target of a stack of layers from \\(H(x)\\) to \\(F(x) + x\\), where \\(F(x)\\) is the *correction* the layers are asked to learn. The identity mapping — the thing the degradation experiment proved deep networks needed — becomes the default behaviour of an un-trained block instead of a target that has to be hunted in weight space. The Jacobian picks up a \\(+ I\\) term, which means the gradient that flows backward through a hundred blocks stays close to the identity instead of collapsing to zero. One line of code, an order of magnitude in trainable depth.

Inside a stage the skip is a literal identity (zero parameters, zero compute). At resolution / channel-width transitions it becomes a small \\(1 \\times 1\\) projection so the shapes line up. The block can be wired post-activation (ResNet v1, \`Conv -> BN -> ReLU -> Conv -> BN -> (+) -> ReLU\`) or pre-activation (ResNet v2 and every modern transformer, normalisation and activation inside the residual branch, skip carries raw tensors through). At depths past a hundred, pre-activation wins; below that the two are within noise.

The same trick scales out of vision. Every transformer block in the *Attention* lesson is two residuals stacked back-to-back. Every U-Net is residual across encoder-decoder pairs. Every diffusion model backbone is a residual-block stack with attention wired in at the deeper resolutions. Once you see the pattern, the only architectures *without* residual connections are the ones that predate 2015 — and none of them are competitive any more. If you are stacking layers and the optimiser is struggling past a depth that should not be hard, the residual is the first thing to try and the last thing you will regret reaching for.`,
          },
          {
            kind: 'prose',
            heading: 'Further reading',
            body: `- [He et al. — ResNet paper](https://arxiv.org/abs/1512.03385) — "Deep Residual Learning for Image Recognition"; the original 152-layer network and the identity-shortcut argument.
- [He et al. — "Identity Mappings in Deep Residual Networks"](https://arxiv.org/abs/1603.05027) — the follow-up that nails *why* the identity path matters and introduces pre-activation residual blocks.
- [Veit, Wilber & Belongie — "Residual Networks Behave Like Ensembles of Relatively Shallow Networks"](https://arxiv.org/abs/1605.06431) — the "ensemble of shorter paths" mental model that explains why dropping random blocks barely hurts accuracy.`,
          },
        ],
      },
    ],
  },
  transformers: {
    title: 'Attention & Transformers',
    oneLiner: 'Scaled dot-product attention, multi-head, positional encodings — the architecture that ate the field.',
    iconName: 'Brain',
    lessons: [
      {
        slug: 'attention',
        title: 'Attention',
        oneLiner: 'Every token decides who to listen to. Then it averages their values.',
        difficulty: 'intermediate',
        readMinutes: 12,
        sections: [
          {
            kind: 'prose',
            heading: 'The problem attention solves',
            body: `Before transformers, the dominant way to process a sequence was a recurrent net — an RNN, LSTM, or GRU — that read tokens one at a time, carrying a hidden state forward. That state was a fixed-size vector trying to remember everything seen so far. By token 200, the influence of token 1 has been multiplied through 199 nonlinearities, and the gradient signal flowing back the other way has been multiplied through 199 derivatives. In practice this means RNNs are bad at long-range dependencies: the model forgets, the gradient vanishes, and the only fix is to make the hidden state larger and hope.

Attention throws that whole picture out. Instead of pushing information sequentially through a bottleneck, every token gets to look directly at every other token in the sequence and pull in whatever it needs. No fixed-size state. No sequential bottleneck. The cost is quadratic in sequence length — \\(O(n^2)\\) pairwise interactions — and the benefit is that *long-range* is no longer different from *short-range*. Token 1 and token 1000 are exactly one dot product apart.

The mechanism that makes this work is built entirely out of operations you already know: linear projections (matrix multiplies), dot products (the *Dot product* lesson), softmax (rescales scores to sum to 1), and a weighted average. Once you see those four pieces snap together, attention stops being mysterious.`,
          },
          {
            kind: 'prose',
            heading: 'Encoder vs decoder vs encoder-decoder',
            body: `Attention is a primitive. The three families of transformer architecture differ in *which* attention pattern they run and *what* the model is being trained to predict. Three shapes, three jobs.

**Encoder-only** — the BERT family. Every token attends to every other token in both directions. There is no causal mask: the representation at position \\(i\\) can see positions \\(1..n\\) freely. Training objective is masked language modelling — knock out 15% of the input tokens, ask the model to fill them back in. The end product is a bidirectional, context-saturated embedding per token, which is exactly what you want for classification ("is this review positive?"), retrieval ("how similar are these two sentences?"), token tagging (named-entity recognition), and any downstream task that consumes a *fixed* representation of an input you already have in hand. Encoders are not designed to generate; they read.

**Decoder-only** — the GPT family. Every token attends only to itself and earlier tokens; the upper triangle of the attention matrix is masked to \\(-\\infty\\). Training objective is next-token prediction over a corpus: feed in tokens \\(1..i\\), predict token \\(i+1\\), shift, repeat. At inference the model samples one token at a time, appends it, and runs again. This shape is the natural fit for *any* task that produces text: chat, code completion, summarisation, translation, agentic tool calls. Bidirectional context is sacrificed; autoregressive generation is what you get back.

**Encoder-decoder** — the original Vaswani architecture and its descendants (T5, BART, the translation models). The encoder reads the source sequence with full bidirectional attention and produces a stack of contextual representations. The decoder generates the target sequence one token at a time, with two kinds of attention per layer: causal self-attention over its own partial output, plus *cross-attention* into the encoder's final representations. Cross-attention is where queries come from the decoder and keys/values come from the encoder — the decoder is asking the encoder "what part of the source do I need next?". This shape shines when the input and output are conceptually different sequences: English-to-French translation, document-to-summary, image-to-caption.

The choice maps directly onto the task. Understand text — encoder. Generate text — decoder. Transform a text into a different text — encoder-decoder. The 2024 reality is that decoder-only with instruction tuning has eaten almost every category, because a sufficiently large decoder trained on input/output pairs can be prompted to do retrieval, classification, summarisation, and translation in a single model. Encoders survive as embedding models inside RAG pipelines; encoder-decoders survive in specialised translation and structured-rewrite settings. Most new frontier models you read about are decoder-only.`,
          },
          {
            kind: 'prose',
            heading: 'Multi-head attention — worked numerics',
            body: `Numbers make multi-head concrete. Start with three tokens and a model dimension \\(d_{\\text{model}} = 4\\). The input is an embedding matrix \\(X \\in \\mathbb{R}^{3 \\times 4}\\) — three rows, four columns. Pick two heads (\\(h = 2\\)) and split the model dimension evenly: each head gets \\(d_k = d_v = d_{\\text{model}} / h = 2\\).

The three projection matrices are each shaped \\((d_{\\text{model}}, d_{\\text{model}}) = (4, 4)\\). Conceptually each is *two stacked head-projections*: the first two output columns of \\(W_Q\\) belong to head 1, the last two belong to head 2. Same for \\(W_K\\) and \\(W_V\\). One matmul \\(X W_Q\\) produces all heads' queries at once, shaped \\((3, 4)\\); you then reshape to \\((3, 2, 2)\\) — three tokens, two heads, two features per head — and transpose to \\((2, 3, 2)\\) so the head axis is leading. Same trick for \\(K\\) and \\(V\\). At the end of the projection step you have \\(Q, K, V\\) each of shape \\((h, n, d_k) = (2, 3, 2)\\).

Now run scaled dot-product attention inside each head independently. For head 1, compute \\(Q_1 K_1^\\top\\) — an \\((n, n) = (3, 3)\\) matrix of raw similarity scores. Divide by \\(\\sqrt{d_k} = \\sqrt{2} \\approx 1.414\\). Softmax row-wise — each row sums to 1, giving a probability distribution over the three keys. Multiply the resulting \\((3, 3)\\) weights matrix by \\(V_1\\), shaped \\((3, 2)\\), and you get head 1's output: \\((3, 2)\\). Do the exact same thing for head 2 with its own \\(Q_2, K_2, V_2\\) and you have a second \\((3, 2)\\) output.

Concatenate the two head outputs along the feature axis: \\((3, 2)\\) plus \\((3, 2)\\) becomes \\((3, 4)\\). Multiply by the output projection \\(W_O \\in \\mathbb{R}^{4 \\times 4}\\), which mixes the heads back together and lets the model decide how to combine them. The final output is \\((3, 4)\\) — the same shape as the input, ready to be added to the residual stream.

The point of running multiple heads is that the \\(Q, K, V\\) projections are *different* per head, so each head can learn a *different* attention pattern in parallel. One head might learn "subject of verb" and concentrate its softmax mass on subject tokens. Another might learn "noun being modified" and concentrate on adjectives. A third might learn positional adjacency, peaking on neighbours. The \\(W_O\\) projection at the end is how the model decides which head matters for which output direction. With \\(h = 8\\) heads at \\(d_{\\text{model}} = 512\\), you get 8 independent specialists working on the same sequence simultaneously, for the same total compute as a single head at the full dimension.`,
          },
          {
            kind: 'prose',
            heading: 'Why FFN after attention',
            body: `A transformer block is not just attention. Every block is *attention followed by a position-wise feed-forward network*, with residual connections and layer norm around each. The FFN is where most of the model's parameters live and where most of the per-token computation happens. Skipping it leaves you with a model that can mix information beautifully but cannot do much with the mix.

The division of labour is clean. **Attention mixes information across tokens**: every output position is a weighted sum of value vectors drawn from the rest of the sequence. **The FFN applies the same small MLP to each token independently**: no token-to-token communication, just a per-position non-linear transform. One way to phrase it: attention decides *what to look at*; FFN decides *what to do with what was looked at*. Attention routes; FFN computes.

The standard FFN is two linear layers with a non-linearity in between, and the hidden layer is wider than the model dimension — typically \\(4 \\times d_{\\text{model}}\\). So at \\(d_{\\text{model}} = 768\\) the FFN has shape \\((768, 3072) \\to \\text{GELU} \\to (3072, 768)\\). The expansion gives the per-token computation room to combine features non-linearly before projecting back. Empirically these two FFN matrices account for roughly two-thirds of the total parameter count in a transformer; attention's \\(W_Q, W_K, W_V, W_O\\) make up the other third.

**Mixture of Experts (MoE)** is the modern variation. Instead of one wide FFN per block, you have \\(E\\) parallel FFNs ("experts") and a small router that, for each token, picks the top-\\(k\\) experts to send it to. A token only flows through \\(k\\) experts out of \\(E\\), so the *active* parameter count per token stays small even though the *total* parameter count is large. Mixtral and DeepSeek-V3 take this to scale: 8 or more experts per layer, top-2 routing, and the effective FFN size grows without proportional inference cost. The attention block stays the same; only the FFN changes.`,
          },
          {
            kind: 'viz',
            heading: 'See the attention pattern shift as you change the query',
            component: 'AttentionHeatmap',
            props: {},
          },
          {
            kind: 'prose',
            heading: 'Why attention beats convolution for long-range dependencies',
            body: `Convolution sees a sequence through a narrow window. A 1D conv layer with kernel size \\(k = 3\\) lets every output position look at three input positions — its immediate neighbours. That is a **local receptive field**: information from token \\(i\\) cannot reach token \\(j\\) in a single layer unless \\(|i - j| \\le 1\\). To connect two tokens that are \\(d\\) positions apart, the signal has to travel through \\(d / (k - 1)\\) stacked layers. For a sequence of length \\(N = 4096\\) and a typical kernel \\(k = 3\\), the receptive field doubles each layer only if you dilate; with plain convs you need on the order of \\(\\log_2 N \\approx 12\\) layers before every output position can in principle see every input position. Twelve layers of stacked nonlinearity between two tokens means twelve chances for the signal to get diluted, distorted, or dropped — the same vanishing-information problem the RNN had, just rebranded.

Attention skips the stack entirely. Every query dots with every key in a single matmul: \\(Q K^\\top\\) is \\(N \\times N\\), and every output row is a weighted average of *all* \\(N\\) value vectors. The **sequential depth** between token \\(i\\) and token \\(j\\) is exactly \\(1\\), regardless of how far apart they sit in the sequence. Token 1 and token 4095 are one dot product apart. Token 1 and token 2 are one dot product apart. The distinction long-range vs short-range, the thing that defined an entire decade of NLP architecture research, vanishes inside a single attention layer.

The price is paid in compute, not in depth. Attention is \\(O(N^2 \\cdot d)\\): every pair of tokens scores against every other pair. Convolution is \\(O(N \\cdot k \\cdot d)\\): linear in \\(N\\), constant in receptive-field width. For short sequences (\\(N \\le k \\cdot \\text{depth}\\)) conv wins on FLOPs. For \\(N = 4096\\) the cross-over is long past — \\(N^2 = 16{,}777{,}216\\) pairwise scores versus \\(N \\cdot k = 12{,}288\\) per conv layer, but the conv needs a dozen layers and still cannot match attention's modelling capacity for non-local mixing. The quadratic cost buys constant-depth global mixing, and constant depth is what makes transformers trainable at scale: gradient signal flows through one layer of attention rather than twelve layers of conv, residuals do the rest.

This is the structural reason transformers replaced LSTMs and CNNs for sequence tasks. LSTMs had constant memory but linear sequential depth — \\(O(N)\\) hops for token 1 to influence token \\(N\\). CNNs had constant work per token but logarithmic sequential depth — \\(O(\\log N)\\) hops via dilation or stacking. Attention collapses both: \\(O(1)\\) sequential depth, \\(O(N^2)\\) work, and that work parallelises perfectly onto a GPU's matmul units. The hardware does the heavy lifting; the architecture does the modelling.`,
          },
          {
            kind: 'prose',
            heading: 'Updating embeddings with context',
            body: `Every token enters the network as a static embedding — a fixed point in \\(\\mathbb{R}^{d_{\\text{model}}}\\) read out of a lookup table. The word "queen" maps to a specific vector, the same vector regardless of the sentence around it. The lookup table cannot know, on its own, that "queen" in *chess queen* lives near *rook, bishop, pawn*, while "queen" in *queen of England* lives near *monarch, crown, sovereign*. Both meanings start at the same point. Something has to move them apart before the model can do anything useful with them.

That something is attention. Attention is the mechanism by which a token *absorbs context to update its own embedding*. The static vector goes in; a context-aware vector comes out, displaced toward the meaning the surrounding tokens imply. By the top of a deep transformer, the vector at position \\(i\\) is no longer "the token at position \\(i\\)" — it is "the token at position \\(i\\) re-expressed in light of everything else in the sequence."

The 3Blue1Brown framing makes the mechanics concrete. Every token broadcasts two probes into the sequence: a key \\(K\\) advertising what it *is*, and a query \\(Q\\) advertising what it *wants*. When my query lines up with your key — when the dot product \\(Q \\cdot K\\) is large — I pull in a slice of your value \\(V\\), the actual payload you contribute. A high-scoring match between "chess" and "queen" pulls the rook/bishop neighbourhood into queen's updated embedding. A high-scoring match with "England" pulls the monarch neighbourhood in instead. Same starting vector, different context, different output.

Multi-head attention is the natural extension. One head asks one kind of question — "who is the subject of my verb?" — and a separate head asks another — "what adjective is modifying me?" Each head has its own \\(W_Q, W_K, W_V\\) matrices and runs its own match in parallel. A typical transformer has 8 to 32 heads per layer, each specialising in a different kind of relevance: positional adjacency, syntactic role, coreference, topic, sentence boundaries. The outputs are concatenated and mixed back together so the next layer sees a richer composite.

Stack this operation 24 or 96 times, and the embedding for a token gets refined again and again, each layer answering a slightly higher-level question about what it means in this sentence. Early layers fix syntax. Middle layers fix semantics. Late layers fix the specific prediction the model is about to make. Attention is what makes that refinement possible.`,
          },
          {
            kind: 'prose',
            heading: 'Worked: tiny 3-token attention',
            body: `Concrete numbers make the abstraction stick. Take three tokens with 2D embeddings: \\(x_{\\text{cat}} = (1, 0)\\), \\(x_{\\text{sat}} = (0, 1)\\), \\(x_{\\text{mat}} = (1, 1)\\). Use identity weight matrices \\(W_Q = W_K = W_V = I\\), so the queries, keys, and values are just the embeddings themselves: \\(Q[i] = K[i] = V[i] = x_i\\). The key dimension \\(d_k = 2\\), so the scaling factor is \\(\\sqrt{2} \\approx 1.414\\).

Compute attention for the middle token, "sat" (index 1). Its query is \\(Q[1] = (0, 1)\\). Dot it with every key:

\\[
Q[1] \\cdot K[0] = (0, 1) \\cdot (1, 0) = 0
\\]
\\[
Q[1] \\cdot K[1] = (0, 1) \\cdot (0, 1) = 1
\\]
\\[
Q[1] \\cdot K[2] = (0, 1) \\cdot (1, 1) = 1
\\]

Raw scores: \\([0,\\ 1,\\ 1]\\). Scale by \\(\\sqrt{2}\\): \\([0,\\ 0.707,\\ 0.707]\\). Apply softmax — exponentiate each entry, then normalise:

\\[
e^0 = 1,\\quad e^{0.707} \\approx 2.028,\\quad e^{0.707} \\approx 2.028,\\quad \\text{sum} \\approx 5.056
\\]

Attention weights: \\([1/5.056,\\ 2.028/5.056,\\ 2.028/5.056] \\approx [0.18,\\ 0.41,\\ 0.41]\\). The output for "sat" is the weighted sum of value vectors:

\\[
0.18 \\cdot (1, 0) + 0.41 \\cdot (0, 1) + 0.41 \\cdot (1, 1) = (0.18 + 0 + 0.41,\\ 0 + 0.41 + 0.41) = (0.59,\\ 0.82)
\\]

Read what happened. "sat" started at \\((0, 1)\\). Its updated embedding is \\((0.59, 0.82)\\) — pulled toward "mat" because mat's key \\((1, 1)\\) aligned with sat's query \\((0, 1)\\) just as strongly as sat's own key did. "cat" contributed almost nothing because its key \\((1, 0)\\) is orthogonal to sat's query. Three tokens, six dot products, one softmax, one weighted average — and the middle token's representation has visibly shifted toward the context that mattered most.`,
          },
          {
            kind: 'prose',
            heading: 'Why scale by √d_k?',
            body: `The division by \\(\\sqrt{d_k}\\) in the attention formula looks like a fudge factor. It is not — it is the one line that keeps deep transformers trainable, and the argument is purely statistical.

Treat the components of \\(q\\) and \\(k\\) as independent random variables with mean 0 and variance 1. The dot product \\(q \\cdot k = \\sum_{i=1}^{d_k} q_i k_i\\) is a sum of \\(d_k\\) independent products. Each product has variance \\(\\text{Var}(q_i k_i) = E[q_i^2]\\,E[k_i^2] = 1\\). The full sum has variance \\(d_k\\), so its standard deviation is \\(\\sqrt{d_k}\\). For \\(d_k = 4\\), raw dot products land within roughly \\(\\pm 2\\). For \\(d_k = 64\\), they spread to roughly \\(\\pm 8\\). For \\(d_k = 128\\), \\(\\pm 11\\). At \\(d_k = 512\\), \\(\\pm 23\\). Some entries reach \\(\\pm 100\\) in the tails.

Feed those into softmax. \\(e^{100}\\) is astronomical, \\(e^{-100}\\) is negligibly small, so softmax produces a near-one-hot vector: one weight at essentially 1, the rest at essentially 0. The gradient of softmax at a one-hot output is essentially zero everywhere, so the layer stops learning. Worse, the gradient with respect to the *other* keys is also zero — backprop cannot tell the optimiser which directions to move.

Dividing every score by \\(\\sqrt{d_k}\\) rescales the variance back to exactly 1, regardless of \\(d_k\\). At \\(d_k = 4\\) and at \\(d_k = 512\\) the post-scaling dot products live in the same range, softmax stays in its responsive regime, and gradients flow. Run the experiment with random unit vectors: at \\(d_k = 4\\), unscaled dot products have empirical variance \\(\\approx 4\\); at \\(d_k = 64\\), variance \\(\\approx 64\\). After dividing by \\(\\sqrt{d_k}\\), both collapse to variance \\(\\approx 1\\). One scalar division per score, paid once per matrix multiply — and without it, every transformer past a handful of layers refuses to train.`,
          },
          {
            kind: 'prose',
            heading: 'Q, K, V — three views of the same token',
            body: `Every input token starts as a single embedding vector \\(x \\in \\mathbb{R}^{d_{\\text{model}}}\\). Attention immediately projects it into three different vectors using three learned weight matrices:

- **Query** \\(q = W_Q x\\) — "what am I looking for?" The thing this token wants to find in the sequence.
- **Key** \\(k = W_K x\\) — "what do I advertise?" The thing this token offers to be matched against.
- **Value** \\(v = W_V x\\) — "what do I deliver if matched?" The actual content this token contributes.

Think of it like a library lookup. The query is your search query. The keys are the spines of every book on the shelf. You compare your query to every key (dot product), the closest matches get the highest scores (softmax), and you walk away with a weighted blend of the books' actual contents (the values).

Crucially, all three projections come from the *same* token \\(x\\). It is asking, advertising, and delivering simultaneously. The Q, K, V matrices are learned during training — the model figures out, for each layer, what aspects of each token should be exposed as a query, a key, or a value.`,
          },
          {
            kind: 'math',
            heading: 'The scaled dot-product attention formula',
            body: `Stack all the queries into a matrix \\(Q \\in \\mathbb{R}^{n \\times d_k}\\) (one row per token), all the keys into \\(K \\in \\mathbb{R}^{n \\times d_k}\\), all the values into \\(V \\in \\mathbb{R}^{n \\times d_v}\\). The entire attention layer is one line:

\\[
\\text{Attention}(Q, K, V) = \\text{softmax}\\!\\left( \\frac{Q K^\\top}{\\sqrt{d_k}} \\right) V
\\]

Read it piece by piece:

1. \\(Q K^\\top\\) — an \\(n \\times n\\) matrix of raw similarity scores. Entry \\((i, j)\\) is \\(q_i \\cdot k_j\\), the dot product of token \\(i\\)'s query with token \\(j\\)'s key. High score means "token \\(i\\) wants what token \\(j\\) has." This is the *Dot product* lesson stacked into a matrix — same primitive, same hardware path.
2. \\(\\div \\sqrt{d_k}\\) — divide every score by the square root of the key dimension. This is the "scaled" in scaled dot-product attention. Skip it and the softmax saturates as \\(d_k\\) grows.
3. \\(\\text{softmax}(\\cdot)\\) — applied row-wise. Each row becomes a probability distribution over the \\(n\\) keys, summing to 1. These are the **attention weights**.
4. \\(\\cdot V\\) — multiply the weights by the value matrix. Each output row is a weighted average of the value vectors, where the weights come from how strongly that token's query matched each token's key.

That is the entire layer. One matrix product to compute scores, a softmax, one more matrix product to mix the values.`,
          },
          {
            kind: 'callout',
            tone: 'tip',
            body: `**Why divide by \\(\\sqrt{d_k}\\)?** If \\(q\\) and \\(k\\) are independent vectors with components drawn from a unit-variance distribution, their dot product \\(q \\cdot k\\) has variance \\(d_k\\) — it grows with the dimension. For typical transformer sizes \\(d_k\\) is 64 or 128, which would make some pre-softmax scores enormous (10+ in magnitude). Softmax of a vector containing one large entry collapses to a one-hot distribution, killing the gradient for every other position. Dividing by \\(\\sqrt{d_k}\\) rescales the variance back to 1 so the softmax stays well-behaved at every depth.`,
          },
          {
            kind: 'viz',
            heading: 'One token, one attention step',
            component: 'AttentionStepViz',
            props: {},
          },
          {
            kind: 'viz',
            component: 'AttentionHeatmap',
            props: {},
            heading: 'Type a sentence. See which token attends to which.',
          },
          {
            kind: 'code',
            language: 'python',
            heading: 'Scaled dot-product attention in PyTorch',
            body: `import torch
import torch.nn.functional as F

def scaled_dot_product_attention(Q, K, V, mask=None):
    # Q: (batch, n, d_k)  K: (batch, n, d_k)  V: (batch, n, d_v)
    d_k = Q.size(-1)

    # raw similarity scores: (batch, n, n)
    scores = Q @ K.transpose(-2, -1) / (d_k ** 0.5)

    # optional causal / padding mask: forbidden positions -> -inf
    if mask is not None:
        scores = scores.masked_fill(mask == 0, float('-inf'))

    # row-wise softmax: attention weights summing to 1
    weights = F.softmax(scores, dim=-1)

    # weighted average of value vectors
    return weights @ V, weights`,
          },
          {
            kind: 'prose',
            heading: 'Multi-head attention — same idea, in parallel',
            body: `A single attention layer pools information one way. But a sentence has many kinds of structure simultaneously — syntactic agreement, coreference, topic, sentiment, position — and forcing one set of Q, K, V projections to model all of them is a bottleneck.

**Multi-head attention** runs \\(h\\) attention operations in parallel, each with its own \\(W_Q, W_K, W_V\\) matrices projecting into a smaller dimension \\(d_k = d_{\\text{model}} / h\\). Each head learns a different attention pattern — one head might track subject-verb agreement, another might point each pronoun back to its antecedent, another might mark sentence boundaries. The outputs are concatenated along the feature dimension and run through one final projection \\(W_O\\) to mix the heads back together.

The total compute is roughly the same as single-head attention at the full \\(d_{\\text{model}}\\), because each head works in a smaller subspace. You get the diversity essentially for free, and empirically it is the single most important hyperparameter after model size.`,
          },
          {
            kind: 'prose',
            heading: 'Causal masking — attention for decoders',
            body: `Encoders (like BERT) let every token attend to every other token — fully bidirectional. Decoders (like GPT) cannot: at training time you want to predict token \\(i+1\\) from tokens \\(1..i\\), so token \\(i\\) must not see anything to its right, or the model would cheat by reading the answer.

The fix is a **causal mask**: before the softmax, set every score \\(\\text{scores}[i, j]\\) where \\(j > i\\) to \\(-\\infty\\). Softmax of \\(-\\infty\\) is exactly 0, so those positions get zero attention weight. Mechanically it is a single \\(n \\times n\\) upper-triangular matrix of \\(-\\infty\\) added to the scores. The forward pass cost is identical; only the mask changes.

The same masking machinery handles padding (set scores for pad tokens to \\(-\\infty\\)) and sliding-window attention (set scores outside the window to \\(-\\infty\\)). One primitive, three jobs.`,
          },
          {
            kind: 'callout',
            tone: 'note',
            body: `**Causal mask, in code.** Build it once per sequence length: \`mask = torch.tril(torch.ones(n, n))\`. Pass it to \`scaled_dot_product_attention\` above. Position \\((i, j)\\) is 1 if \\(j \\le i\\) (allowed) and 0 otherwise; \`masked_fill\` then drops the disallowed scores to \\(-\\infty\\) before softmax. Every autoregressive language model from GPT-2 onward is doing exactly this under the hood.`,
          },
          {
            kind: 'prose',
            heading: 'KV cache — why attention dominates inference cost',
            body: `At training time you process the whole sequence in one shot. At inference time, autoregressive generation produces one token, appends it, then runs the model again to produce the next. Naively, each new token would recompute \\(K\\) and \\(V\\) for the entire prefix — \\(O(n^2)\\) work per token, \\(O(n^3)\\) total to generate \\(n\\) tokens. That is unworkable.

The fix is the **KV cache**: store the key and value vectors for every past token, and at each generation step only compute \\(Q, K, V\\) for the *new* token. Append its \\(K\\) and \\(V\\) to the cache, and attention reduces to a single new query attending over the cached keys and values — \\(O(n)\\) per step, \\(O(n^2)\\) total.

This is also why long-context LLMs are memory-hungry. The KV cache scales linearly with sequence length, number of layers, and number of heads. For a 70B-parameter model at 100k context, the KV cache can be tens of gigabytes — larger than the model weights themselves. Most of the recent work on efficient LLM serving (paged attention, grouped-query attention, multi-query attention, sliding-window attention) is about shrinking or sharing this cache. Attention dominates inference because *the cache* dominates inference, and the cache exists because attention needs every past key and value to compute the next output.`,
          },
          {
            kind: 'viz',
            heading: 'Flash attention — sweep the score matrix one SRAM tile at a time',
            component: 'FlashAttentionTilingViz',
          },
          {
            kind: 'prose',
            heading: 'What to take away',
            body: `Attention is a softmax over scaled dot products, followed by a weighted average of value vectors. Every token splits itself into three roles — query, key, value — and queries get matched to keys to decide how much of each value to mix into the output. Scaling by \\(\\sqrt{d_k}\\) keeps the softmax in a workable regime. Multi-head attention runs the same machinery in parallel subspaces so each head can specialise. Causal masking turns the encoder version into the decoder version without changing a single matrix multiply.

Once you internalise this, the rest of the transformer stack is bookkeeping: residual connections to let gradients flow, layer norm to keep activations stable, a position-wise feed-forward block after attention to add depth, and positional encodings so the model can tell token 5 from token 50. Attention is the load-bearing idea. Every other piece is there to support it.`,
          },
          {
            kind: 'prose',
            heading: 'Further reading',
            body: `- [3Blue1Brown — "Attention in transformers, step-by-step"](https://www.youtube.com/watch?v=eMlx5fFNoYc) — the visual mental model: queries, keys, values, and the attention pattern as a softmax-weighted mixture.
- [Jay Alammar — "The Illustrated Transformer"](https://jalammar.github.io/illustrated-transformer/) — the diagram-first walkthrough of Vaswani et al.; the canonical reference everyone re-reads.
- [Vaswani et al. — "Attention Is All You Need"](https://arxiv.org/abs/1706.03762) — the original 2017 paper; short enough to read straight through after the two above.`,
          },
        ],
      },
      {
        slug: 'rnn-lstm',
        title: 'RNN and LSTM',
        oneLiner: 'Sequence models from before attention. Why they were the SOTA — and why they got replaced.',
        difficulty: 'intermediate',
        readMinutes: 11,
        sections: [
          {
            kind: 'prose',
            heading: 'Why sequences need their own model',
            body: `Everything in the *Matrices* lesson assumed inputs of a fixed shape: a vector of \\(d\\) features, a batch stacked into an \\(n \\times d\\) matrix, multiply by \\(W\\), repeat. That works for images cropped to 224 by 224 and for tabular rows of fixed width. It does not work for language, audio, time series, DNA, or sensor logs — inputs whose length is part of the data, not the schema. A sentence might be 4 tokens or 400. A recording might be 2 seconds or 20 minutes. You cannot pick a single \\(W\\) shape and be done.

You also cannot just flatten the sequence into one giant vector. The first reason is shape: a flat MLP requires a fixed input dimension, so every sentence would have to be padded or truncated to one canonical length, and the model would relearn the meaning of "the second token" separately from "the seventeenth token" even though syntactically they are the same role. The second reason is structure: language has local dependencies (adjective modifies the next noun), medium-range dependencies (a verb agrees with a subject five tokens back), and long-range dependencies (a pronoun in sentence three refers to a name in sentence one). A flat MLP destroys this geometry; it sees \\(n \\cdot d\\) independent inputs and has to recover the order from raw correlations.

The clean fix — the one that ruled NLP from roughly 2014 to 2017 — was the **recurrent neural network**. Process one token at a time. Carry a hidden state forward. At each step, mix the new token with the running state to produce a new state. The same set of weights handles every step, so the model genuinely learns "what does a token mean given what came before" rather than memorising positions. The next sections build that mechanism from the cell upward, then show why attention eventually ate its lunch.`,
          },
          {
            kind: 'prose',
            heading: 'Vanishing gradients — the original RNN problem',
            body: `An RNN processes a sequence by updating a hidden state at each step. The update is one line:

\\[
h_t = \\tanh\\!\\left( W_h \\, h_{t-1} + W_x \\, x_t \\right)
\\]

Same \\(W_h\\) and \\(W_x\\) every step, hidden state threaded forward, output read off \\(h_t\\) whenever needed. The forward pass is clean. The trouble is the backward pass.

Training requires the gradient of the loss with respect to \\(W_h\\) and \\(W_x\\). Because the same weights are reused at every step, the chain rule stretches across time: the gradient at step \\(T\\) has to flow all the way back to step \\(1\\) through every intermediate hidden state. Each backward hop multiplies by the Jacobian of the recurrence, which is

\\[
\\frac{\\partial h_t}{\\partial h_{t-1}} = W_h^\\top \\cdot \\text{diag}\\!\\left( \\tanh'(\\cdot) \\right)
\\]

After \\(T\\) steps the signal at the earliest token has been multiplied by \\(T\\) copies of that same matrix. The product is governed by the spectral radius — the largest singular value — of \\(W_h \\cdot \\text{diag}(\\tanh'(\\cdot))\\). Since \\(\\tanh'\\) is bounded above by \\(1\\) and is usually well below it, the diagonal already shrinks the matrix. Two regimes follow and both are bad.

If the spectral radius of that product is less than \\(1\\), the gradient signal decays geometrically as \\(\\rho^T\\). After \\(20\\) or \\(30\\) steps it is numerically indistinguishable from zero. The model literally cannot learn long-range dependencies because there is no learning signal back there — the loss surface is flat in every direction that would adjust weights for early tokens. This is **vanishing gradients**.

If the spectral radius is greater than \\(1\\), the product blows up as \\(\\rho^T\\). Updates grow by orders of magnitude per step, weights jump out of any usable region, and the loss NaNs out within a few iterations. This is **exploding gradients** — easier to fix (clip the global gradient norm before each optimizer step) but a constant nuisance.

The hard regime is vanishing, because there is no signal to react to. In practice this meant sequences longer than about \\(20\\) steps were unlearnable for vanilla RNNs. Sentiment over a paragraph, agreement across a long sentence, anything that needed memory more than a handful of words back — all out of reach. The 1997 fix from Hochreiter and Schmidhuber was structural: replace the multiplicative recurrent state with a **cell state** that has an additive update path. That cell state is the load-bearing idea behind the LSTM.`,
          },
          {
            kind: 'prose',
            heading: 'LSTM as four gates — a worked step',
            body: `The LSTM splits the recurrence into two streams. A **cell state** \\(c_t\\) carries memory along a near-linear highway. A **hidden state** \\(h_t\\) is read out from the cell state through a gate. Four small networks govern what flows where, each one a sigmoid or tanh of the same linear combination of the previous hidden state and the current input:

\\[
\\begin{aligned}
f_t &= \\sigma(W_f \\cdot [h_{t-1}, x_t] + b_f) \\quad &\\text{forget gate} \\\\
i_t &= \\sigma(W_i \\cdot [h_{t-1}, x_t] + b_i) \\quad &\\text{input gate} \\\\
g_t &= \\tanh(W_g \\cdot [h_{t-1}, x_t] + b_g) \\quad &\\text{candidate} \\\\
o_t &= \\sigma(W_o \\cdot [h_{t-1}, x_t] + b_o) \\quad &\\text{output gate}
\\end{aligned}
\\]

Read the gates as scalar dials in \\([0, 1]\\) per dimension. The **forget gate** \\(f\\) decides how much of the previous cell state to keep — \\(0\\) wipes the slot, \\(1\\) preserves it untouched. The **input gate** \\(i\\) decides how much of the new candidate to write. The **candidate** \\(g\\) is the new information itself, in \\([-1, 1]\\) so it can push the cell state in either direction. The **output gate** \\(o\\) decides how much of the (now updated) cell state to expose as the hidden state.

The cell state update is the part that fixes vanishing gradients:

\\[
c_t = f_t \\odot c_{t-1} + i_t \\odot g_t
\\]

This is linear in \\(c_{t-1}\\). No repeated nonlinearity, no shrinking Jacobian — gradients flow back through the addition with multiplier \\(f_t\\), which the model learns to keep near \\(1\\) for dimensions it wants to remember. The hidden state is then a squashed, gated readout:

\\[
h_t = o_t \\odot \\tanh(c_t)
\\]

A single step in numbers. Take \\(x_t = 0.5\\), \\(h_{t-1} = 0.2\\), \\(c_{t-1} = 0.8\\). Assume the gates have already computed \\(f_t = 0.7\\), \\(i_t = 0.3\\), \\(g_t = 0.5\\), \\(o_t = 0.6\\) from some tiny dummy weights. Plug in:

\\[
c_t = 0.7 \\cdot 0.8 + 0.3 \\cdot 0.5 = 0.56 + 0.15 = 0.71
\\]

\\[
h_t = 0.6 \\cdot \\tanh(0.71) \\approx 0.6 \\cdot 0.611 = 0.367
\\]

That is the entire LSTM step. The forget gate kept \\(56\\%\\) of the old memory, the input gate added \\(15\\%\\) of a new value, the output gate exposed \\(60\\%\\) of the squashed result. Stack \\(T\\) of these and the gradient at step \\(1\\) is no longer multiplied by \\(T\\) copies of a contractive matrix — it is multiplied by \\(T\\) copies of \\(f_t\\), and the model learns to make those ones whenever it needs long memory.`,
          },
          {
            kind: 'prose',
            heading: 'Why transformers killed RNNs',
            body: `An RNN is sequential by construction. To compute \\(h_t\\) you need \\(h_{t-1}\\), and the only way to get \\(h_{t-1}\\) is to have already computed \\(h_{t-2}\\), and so on. There is no shortcut. Sequence length \\(T\\) buys you \\(O(T)\\) sequential depth on any hardware — even an infinite GPU cannot parallelize over the time axis, because step \\(t\\) literally cannot start until step \\(t - 1\\) is done.

A transformer takes the opposite trade. Every token attends to every other token in parallel. The whole sequence's attention scores are a single \\((T \\times d) \\cdot (d \\times T)\\) matrix multiply, and modern GPUs are tuned to make that the fastest thing in the world. Sequential depth collapses to \\(O(1)\\) per layer; only layer count is sequential, and layer count is small and fixed.

The compute cost does flip the other way. Attention is \\(O(T^2)\\) in arithmetic because every pair of tokens interacts; an RNN is \\(O(T)\\) per layer because only adjacent steps interact. On paper the RNN wins on FLOPs. In practice the \\(T^2\\) of attention parallelizes near-perfectly and the \\(T\\) of an RNN does not parallelize at all, so wall-clock time goes the other way. For sequence length \\(4096\\) on a modern GPU, a transformer trains \\(10\\) to \\(100\\) times faster than an LSTM at comparable parameter count.

The result is that RNNs are now niche. They survive where the sequential bottleneck does not matter or actively helps: low-latency streaming inference where you only ever process one new token at a time, edge devices where the constant per-step cost beats a transformer's growing KV cache, and time series with strong locality where there is nothing far-away worth attending to. Everything else moved to attention.

A small recurrent renaissance is underway — Mamba, linear attention, RWKV all try to recover the RNN's \\(O(T)\\) wall-clock behaviour while matching transformer quality on long context. The recurrent idea is not dead; it has been reformulated. But the simple LSTM that owned NLP from 2014 to 2017 was decisively retired by what attention bought.`,
          },
          {
            kind: 'math',
            heading: 'The vanilla RNN cell',
            body: `At each time step \\(t\\) you have an input token \\(x_t \\in \\mathbb{R}^{d_x}\\) and the previous hidden state \\(h_{t-1} \\in \\mathbb{R}^{d_h}\\). The cell produces a new hidden state \\(h_t \\in \\mathbb{R}^{d_h}\\) by one matrix-vector product per input, one matrix-vector product per state, summed and squashed:

\\[
h_t = \\tanh\\!\\left( W_h \\, h_{t-1} + W_x \\, x_t + b \\right)
\\]

Three things to notice. First, \\(W_h \\in \\mathbb{R}^{d_h \\times d_h}\\), \\(W_x \\in \\mathbb{R}^{d_h \\times d_x}\\), and \\(b \\in \\mathbb{R}^{d_h}\\) are *shared across every time step* — the cell at \\(t = 1\\) and the cell at \\(t = 500\\) use the exact same weights. This is why the model handles variable-length input: there is only ever one cell, applied over and over. Second, the recurrence is a single nonlinear function of the previous state and the current input, exactly the kind of dynamical system you would write down for a discrete-time process. Third, the only memory of the past is whatever fits in \\(h_t\\) — a fixed-size vector, typically 256 or 512 dimensions. Everything the model knows about the first 200 tokens has to be compressed into that vector by the time the 201st token arrives.

For a sequence-classification task you take the final hidden state \\(h_T\\) and run it through a linear layer plus softmax to get a class distribution. For a language-modelling task you read out from every \\(h_t\\) — one output per time step — and predict the next token from each. The *Matrices* lesson covers the per-step linear algebra; this lesson is about what happens when you stack \\(T\\) of those steps together with a shared weight matrix.`,
          },
          { kind: 'viz', heading: 'Unrolling the RNN across time', component: 'RNNUnrollViz' },
          {
            kind: 'prose',
            heading: 'Backprop through time, and the gradient that vanishes',
            body: `Training an RNN means computing the gradient of the loss with respect to the shared weights \\(W_h, W_x, b\\). Because the same weights are reused at every step, the chain rule from the *Backprop* lesson now stretches across time as well as depth. This is called **backpropagation through time** (BPTT): unroll the network into \\(T\\) copies of the cell, treat it as a deep feed-forward network of depth \\(T\\), apply standard backprop, then sum the gradients for the shared weights across every step.

The problem becomes visible the moment you write out the gradient that flows from \\(h_T\\) back to \\(h_1\\). At each step the backward pass multiplies by \\(W_h^\\top\\) times the Jacobian of the \\(\\tanh\\), which is bounded above by 1. After \\(T\\) steps the gradient signal at step 1 has been multiplied by something on the order of \\(\\| W_h \\|^T\\). Two things can happen and both are bad:

- **Vanishing gradients.** If the largest singular value of \\(W_h\\) is less than 1, the product shrinks geometrically. After 50 or 100 steps, the gradient reaching the early tokens is numerically zero. The model literally cannot learn long-range dependencies because there is no learning signal back there. This is the same failure mode the *Gradient descent* lesson flagged for very deep networks — RNNs hit it on time depth instead of layer depth.
- **Exploding gradients.** If the largest singular value is greater than 1, the product blows up. Updates become enormous, the weights jump into a useless region, and the loss NaNs out within a few steps.

Vanishing is the harder of the two to fix because there is no signal to react to — the loss just plateaus. Exploding has a cheap, robust workaround called **gradient clipping**: cap the global gradient norm at some threshold (typically 1.0 or 5.0) before applying it. Every RNN training run from 2014 onward used clipping. The real fix for vanishing came from redesigning the cell itself — and that is the LSTM.`,
          },
          {
            kind: 'callout',
            tone: 'tip',
            body: `**Always clip gradients when training a recurrent net.** Add one line before \`optimizer.step()\`: \`torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)\`. This computes the global L2 norm of every gradient tensor, and if it exceeds 1.0, rescales them all by the same factor so the norm equals 1.0. Costs essentially nothing and removes a whole class of NaN failures from your training loop. Modern transformers usually do this too, but for RNNs it is non-negotiable.`,
          },
          {
            kind: 'math',
            heading: 'The LSTM cell — gates instead of a single tanh',
            body: `The **long short-term memory** (LSTM) cell, introduced by Hochreiter and Schmidhuber in 1997, fixes vanishing gradients by giving the recurrence an *additive* path. Instead of one hidden state, the cell maintains two parallel streams: a **cell state** \\(c_t\\) that flows along a near-linear highway, and a **hidden state** \\(h_t\\) that is read out from it through a gate. Three sigmoid-gated linear projections control what gets written to, kept in, and read out of the cell state:

\\[
\\begin{aligned}
f_t &= \\sigma(W_f \\, [h_{t-1}, x_t] + b_f) \\quad &\\text{forget gate} \\\\
i_t &= \\sigma(W_i \\, [h_{t-1}, x_t] + b_i) \\quad &\\text{input gate} \\\\
o_t &= \\sigma(W_o \\, [h_{t-1}, x_t] + b_o) \\quad &\\text{output gate} \\\\
\\tilde c_t &= \\tanh(W_c \\, [h_{t-1}, x_t] + b_c) \\quad &\\text{candidate update} \\\\
c_t &= f_t \\odot c_{t-1} + i_t \\odot \\tilde c_t \\quad &\\text{cell state} \\\\
h_t &= o_t \\odot \\tanh(c_t) \\quad &\\text{hidden state}
\\end{aligned}
\\]

Compare to the vanilla RNN on the left and the LSTM on the right:

\\[
\\underbrace{h_t = \\tanh(W_h h_{t-1} + W_x x_t + b)}_{\\text{vanilla RNN}}
\\qquad\\Bigg|\\qquad
\\underbrace{c_t = f_t \\odot c_{t-1} + i_t \\odot \\tilde c_t}_{\\text{LSTM cell state}}
\\]

The vanilla RNN multiplies the past state by \\(W_h\\) at every step — that is exactly the operation that vanishes. The LSTM *adds* the new candidate to the gated past, and the forget gate \\(f_t\\) is a per-dimension number in \\([0, 1]\\) controlled by the data. If the model wants to remember a feature indefinitely, it learns \\(f_t \\approx 1\\) and the cell state passes through unchanged — gradients flow back through that addition with no contractive multiplier. If it wants to overwrite, it learns \\(f_t \\approx 0\\) and the cell state resets. This is why LSTMs can hold information across hundreds of time steps where vanilla RNNs gave up after about 20.`,
          },
          {
            kind: 'prose',
            heading: 'GRU — the LSTM, simplified',
            body: `The LSTM works but it is heavy: three gates, two states, four matrix multiplies per step. The **gated recurrent unit** (GRU), proposed by Cho et al. in 2014, asks whether all of that is really necessary. It merges the cell state and the hidden state into one, and replaces the forget and input gates with a single **update gate** \\(z_t\\) that interpolates between keeping the old state and writing the new candidate:

\\[
\\begin{aligned}
z_t &= \\sigma(W_z [h_{t-1}, x_t]) \\\\
r_t &= \\sigma(W_r [h_{t-1}, x_t]) \\\\
\\tilde h_t &= \\tanh(W_h [r_t \\odot h_{t-1}, x_t]) \\\\
h_t &= (1 - z_t) \\odot h_{t-1} + z_t \\odot \\tilde h_t
\\end{aligned}
\\]

Two gates instead of three, one state instead of two, three matrix multiplies instead of four — roughly 25 percent cheaper per step than an LSTM. Empirically the GRU performs about as well as the LSTM on most tasks; the LSTM has a small edge on very long sequences (the separate cell-state highway buys a tiny bit more memory) and the GRU wins on small datasets where the parameter count matters. Pick by benchmark; both still appear in production today as the "small recurrent block" inside larger models.`,
          },
          {
            kind: 'prose',
            heading: 'Bidirectional RNNs — reading both directions',
            body: `A plain RNN at position \\(t\\) only sees \\(x_1, \\ldots, x_t\\). That is the right constraint for autoregressive generation, but for tasks like named-entity recognition or sentiment classification, the model is allowed to see the whole sequence at once — and the token at position \\(t\\) is often disambiguated by tokens to its right. ("Apple" the company or the fruit? Depends on what comes after.)

A **bidirectional RNN** runs two RNNs in parallel: a forward one reading left to right and a backward one reading right to left. At each position, the two hidden states are concatenated (or summed) before being fed to the downstream classifier. The forward state encodes everything up to and including \\(t\\); the backward state encodes everything from \\(t\\) to the end. Together they give the model a representation that has seen the entire sequence.

Bidirectional LSTMs were the dominant architecture for NER, part-of-speech tagging, and reading comprehension from 2015 through 2018. ELMo, the breakthrough contextual-embedding model that preceded BERT, was a stack of bidirectional LSTMs. The pattern carries over almost unchanged into the BERT-style encoder transformer, which is "bidirectional" by default because self-attention sees the whole sequence at once — no gating needed.`,
          },
          {
            kind: 'prose',
            heading: 'Encoder-decoder — sequence to sequence',
            body: `For tasks where the input *and* output are sequences — translation, summarization, speech recognition — the standard recurrent architecture is the **encoder-decoder**. An encoder RNN reads the source sequence one token at a time and produces a final hidden state \\(h_T^{\\text{enc}}\\) that is supposed to summarise the whole input. A decoder RNN is then initialised from that state and generates the output sequence one token at a time, conditioning each step on the previous output token and its own hidden state.

This is what won the first round of neural machine translation in 2014. It also exposed the bottleneck that motivated attention. The encoder has to cram an entire source sentence — sometimes 50 or 100 tokens — into a single fixed-size vector. The decoder then has to unpack that vector and reproduce a fluent target sentence from it. Long source sentences get worse translations; the longer the input, the more information has been squeezed into the same \\(d_h\\)-dimensional pipe. Bahdanau et al. (2014) added a soft attention mechanism over the encoder's hidden states — exactly the dot-product-and-weighted-average from the *Attention* lesson — and the bottleneck dissolved. That paper is the line between the recurrent era and the transformer era.

The other recurrent-era trick worth knowing is **teacher forcing**. At training time the decoder is supposed to predict each target token given the previous ones. If you feed it its own (often wrong) predictions during early training, errors compound and the model never learns. Teacher forcing instead feeds the decoder the *ground-truth* previous token at every step, regardless of what it predicted. Training is much faster and more stable, at the cost of a train-test mismatch (at inference the model sees its own outputs, which it never trained on). Mitigations like scheduled sampling were proposed but rarely needed in practice — every modern transformer-based seq2seq model still trains with teacher forcing.`,
          },
          {
            kind: 'callout',
            tone: 'note',
            body: `**Teacher forcing in one line.** During training, the decoder input at step \\(t\\) is \`y_target[t-1]\` (the true previous token), not \`y_pred[t-1]\` (the model's previous guess). At inference time you have no choice — feed the previous guess. This train-test gap is real but, in practice, transformers shrug it off because each position attends directly to the source rather than threading information through a hidden state that errors compound in. Worth knowing because every seq2seq training script you read assumes you already know this is how it works.`,
          },
          {
            kind: 'code',
            language: 'python',
            heading: 'An LSTM in PyTorch — built-in and from-scratch',
            body: `import torch
import torch.nn as nn

# Built-in: one line. batch_first=True so input is (B, T, d_x).
lstm = nn.LSTM(input_size=64, hidden_size=128, num_layers=2, batch_first=True)
x = torch.randn(8, 50, 64)               # batch=8, T=50, d_x=64
out, (h_n, c_n) = lstm(x)                # out: (8, 50, 128)

# From-scratch cell: shows what the four gates actually compute.
class LSTMCell(nn.Module):
    def __init__(self, d_x, d_h):
        super().__init__()
        # one big linear computes all four gates' pre-activations at once
        self.W = nn.Linear(d_x + d_h, 4 * d_h)
        self.d_h = d_h

    def forward(self, x_t, state):
        h_prev, c_prev = state
        gates = self.W(torch.cat([h_prev, x_t], dim=-1))     # (B, 4*d_h)
        f, i, o, g = gates.chunk(4, dim=-1)
        f, i, o = torch.sigmoid(f), torch.sigmoid(i), torch.sigmoid(o)
        g = torch.tanh(g)
        c_t = f * c_prev + i * g                              # cell state highway
        h_t = o * torch.tanh(c_t)
        return h_t, (h_t, c_t)`,
          },
          {
            kind: 'prose',
            heading: 'Why attention beat RNNs',
            body: `Two failures killed the recurrent era, and the *Attention* lesson is essentially the fix for both.

The first is **parallelism**. An RNN is sequential by construction — you cannot compute \\(h_5\\) until you have \\(h_4\\), which needs \\(h_3\\), and so on. On a GPU, which wants to multiply huge matrices in parallel, that sequentiality is poison. A 200-token sentence forces 200 sequential cell evaluations even though you have thousands of CUDA cores idle. A transformer block, by contrast, processes the entire sequence in one matrix multiply — \\(QK^\\top\\) is a single \\((n \\times d_k) \\cdot (d_k \\times n)\\) GEMM, and modern GPUs are tuned to make that the fastest possible operation. Throughput on identical hardware can be 10-50 times higher.

The second is **long-range dependencies**. Even with LSTMs and clipping, gradients still degrade across 500+ time steps, and the fixed-size hidden state still has to compress everything that came before. Attention removes both constraints: any token can attend to any other token through a single dot product, regardless of distance, and there is no hidden state to compress through. Distance becomes irrelevant. This is also exactly why attention is quadratic in sequence length — every pair of tokens interacts directly — and it is the trade-off the rest of the field has been refining ever since (sparse attention, sliding windows, state-space models, all trying to recover near-linear cost without losing the direct-access property).

The result was a clean handover. By 2018 every translation benchmark had been taken over by transformers. By 2020 every language model worth talking about was a transformer. The RNN-era papers still teach you the right vocabulary — sequence, hidden state, autoregressive, encoder-decoder, teacher forcing — but the architecture itself moved on.`,
          },
          {
            kind: 'prose',
            heading: 'Where RNNs still matter',
            body: `RNNs are not extinct. They survive in three niches where the transformer's strengths do not pay off.

**Low-latency streaming inference.** An RNN processes one token in \\(O(d_h^2)\\) time with \\(O(d_h)\\) memory of state. A transformer with KV cache processes one new token in \\(O(n d)\\) time with \\(O(n d)\\) cache memory — both grow with sequence length. For always-on voice assistants, keyboard autocomplete on a phone, or wake-word detection running on a microcontroller, the RNN's constant per-step cost is a real advantage. Whisper still uses a transformer encoder, but plenty of on-device speech models are LSTMs.

**Small models on tiny hardware.** A 2-layer LSTM with 256 hidden dims is roughly 1.5 MB of parameters. The smallest useful transformer is an order of magnitude bigger. Embedded sensor processing, anomaly detection on IoT devices, and lightweight time-series forecasting all still ship LSTMs and GRUs because they fit and run fast on Cortex-M class chips.

**State-space models — the recurrent renaissance.** The S4 / Mamba family of models, which have started to compete with transformers on long-context tasks since 2023, are recurrent by design — they update a hidden state at each step with a linear recurrence, then read out. They are not LSTMs (the recurrence is linear and structured, the parameterisation comes from continuous-time signal processing), but the *shape* is the same: state evolves over time, one step at a time, with constant per-step cost. The recurrent idea is being rediscovered as the way to get sub-quadratic long-context behaviour without giving up modelling power. If transformers eventually get displaced, it will probably be by something that looks more like an LSTM than people expected in 2018.`,
          },
          {
            kind: 'prose',
            heading: 'What to take away',
            body: `RNNs answered a real question — how do you process variable-length sequences with a fixed-size model? — by sharing one cell across time and threading a hidden state through it. Vanilla RNNs hit the vanishing-gradient wall around 20-30 steps. LSTMs and GRUs fixed it with gated additive recurrences that let gradients flow through unchanged when the gates say so. Bidirectional and encoder-decoder variants stacked the same primitive into the architectures that owned NLP from 2014 to 2017.

Attention then made all of that obsolete for sequence modelling at scale by removing the sequential bottleneck and the fixed-size summary state in one stroke. But the vocabulary and intuitions from the recurrent era — hidden state, autoregressive generation, teacher forcing, gradient clipping — still show up in every modern transformer-based pipeline. And as state-space models suggest, the recurrent idea itself has not gone away; it has just been reformulated. Worth knowing what the recurrence buys you, and what it costs, before you decide which one to reach for.`,
          },
          {
            kind: 'prose',
            heading: 'Further reading',
            body: `- [Chris Olah — "Understanding LSTM Networks"](https://colah.github.io/posts/2015-08-Understanding-LSTMs/) — the canonical blog post that makes the gates and the cell state click.
- [Andrej Karpathy — "The Unreasonable Effectiveness of Recurrent Neural Networks"](https://karpathy.github.io/2015/05/21/rnn-effectiveness/) — char-rnn samples and the intuition for why a recurrent state can carry useful structure across hundreds of tokens.
- [Hochreiter & Schmidhuber — original LSTM paper](https://deeplearning.cs.cmu.edu/F23/document/readings/LSTM.pdf) — the 1997 Neural Computation paper; dense but worth reading once to see where the gates come from.`,
          },
        ],
      },
      {
        slug: 'positional-encoding',
        title: 'Positional encoding',
        oneLiner: 'Attention is permutation-invariant. Positional encoding is how the transformer learns order.',
        difficulty: 'intermediate',
        readMinutes: 10,
        sections: [
          {
            kind: 'prose',
            heading: 'Why attention needs position information at all',
            body: `Walk back through what the *Attention* lesson actually computed. For a sequence of \\(n\\) tokens with embeddings stacked into \\(X \\in \\mathbb{R}^{n \\times d}\\), you formed \\(Q = XW_Q\\), \\(K = XW_K\\), \\(V = XW_V\\), and produced \\(\\text{softmax}(QK^\\top / \\sqrt{d_k}) V\\). Every operation in that pipeline is a matrix multiply followed by a row-wise softmax. Nowhere does any step ask "where is this token in the sequence?" Permute the rows of \\(X\\) and you permute the rows of the output by the same permutation — nothing else changes. Self-attention is, by construction, a set operation.

That is fine if your input genuinely is a set (a bag of features, an unordered list of detected objects in an image). It is catastrophic for language. The sentences "dog bites man" and "man bites dog" share the same three tokens; the only difference is the order, and a model that cannot tell them apart cannot do anything useful with text. The *RNN and LSTM* lesson got order for free because the recurrence threaded the hidden state left to right — position was implicit in *when* a token was processed. Throwing away the recurrence threw away the order along with it.

The fix is to inject position information into the embeddings *before* attention sees them. Each token's representation becomes \\(x_i + p_i\\), where \\(p_i \\in \\mathbb{R}^d\\) is some function of the position \\(i\\). The matrix multiplications downstream now operate on something that differs depending on where the token lives. Two permutations of the same tokens produce different \\(X + P\\), hence different \\(QK^\\top\\), hence different outputs. Order is back. The rest of this lesson is about which function \\(p_i\\) to use and why the answer has changed three times in seven years.`,
          },
          {
            kind: 'prose',
            heading: 'Why transformers need position info',
            body: `Attention has no inherent notion of "first" versus "last". Look at the computation again: a query attends to every key with a softmax over dot products, then takes a weighted average of values. Reorder the input rows and the output rows reorder identically — nothing in the math distinguishes "the token at index 0" from "the token at index 47". Self-attention operates on a *set* of tokens, not a sequence. That is a desirable property in some domains: a bag of detected objects in an image, an unordered collection of features for a tabular row. It is fatal for language.

The cleanest illustration is two sentences that share an identical token set. "The dog bit the man" and "The man bit the dog" contain the same five tokens — \\(\\{\\text{the}, \\text{dog}, \\text{bit}, \\text{the}, \\text{man}\\}\\) — and differ only in order. A pure attention layer fed either sentence would produce the exact same attention scores, the same weighted sums, the same downstream representations. The model could not tell who bit whom. Every legal, ethical, and grammatical distinction collapses the moment position is thrown away. The recurrence in an RNN dodged this for free because the hidden state was threaded left to right; attention's parallel structure gave that up in exchange for throughput and had to pay for the ordering separately.

The solution is to inject a position vector into the embedding before attention sees it. Each token's representation becomes \\(x_i + p_i\\), where \\(p_i \\in \\mathbb{R}^d\\) encodes "I am token #i". After this addition the two sentences above produce different \\(X + P\\) matrices, different \\(QK^\\top\\) products, different outputs. Order is restored without touching the attention math itself.

Two main families of solution exist. **Absolute position** encodes \\(p_i\\) as a function of the integer index \\(i\\) alone — the sinusoidal recipe of the original transformer paper and the learned lookup tables used by BERT and GPT-2 both live here. **Relative position** encodes the *offset* \\(j - i\\) between a query and a key directly inside the attention score — T5's learned scalar bias, RoPE's rotation of query and key vectors, and ALiBi's linear distance penalty are all examples. The rest of this lesson walks through each, starting with sinusoidal because every later scheme is a deliberate response to one of its limitations.`,
          },
          {
            kind: 'prose',
            heading: 'Worked: sinusoidal encoding',
            body: `The sinusoidal scheme picks a fixed, parameter-free function of position. For position \\(p \\in \\{0, 1, 2, \\ldots\\}\\) and embedding dimension \\(d\\), the position vector \\(PE(p) \\in \\mathbb{R}^d\\) is defined coordinate by coordinate as

\\[
PE(p, 2i) = \\sin\\!\\left( \\frac{p}{10000^{2i/d}} \\right), \\qquad PE(p, 2i+1) = \\cos\\!\\left( \\frac{p}{10000^{2i/d}} \\right)
\\]

The index \\(i\\) runs from 0 to \\(d/2 - 1\\) and selects a pair of dimensions. Even coordinates hold a sine, odd coordinates hold a cosine, and pair \\(i\\) uses angular frequency \\(\\omega_i = 1 / 10000^{2i/d}\\). Work a concrete example with \\(d = 4\\) and position \\(p = 1\\):

- \\(PE(1, 0) = \\sin(1 / 10000^{0/4}) = \\sin(1 / 1) = \\sin(1) \\approx 0.841\\)
- \\(PE(1, 1) = \\cos(1 / 10000^{0/4}) = \\cos(1 / 1) = \\cos(1) \\approx 0.540\\)
- \\(PE(1, 2) = \\sin(1 / 10000^{2/4}) = \\sin(1 / 100) \\approx 0.010\\)
- \\(PE(1, 3) = \\cos(1 / 10000^{2/4}) = \\cos(1 / 100) \\approx 0.99995\\)

So \\(PE(1) \\approx [0.841, 0.540, 0.010, 0.99995]\\). Notice the structure. The first pair lives at \\(\\omega_0 = 1\\) — one full revolution every \\(2\\pi \\approx 6.28\\) positions. The second pair lives at \\(\\omega_1 = 0.01\\) — one full revolution every \\(628\\) positions. Bump the position to \\(p = 2\\): the first pair becomes \\([\\sin 2, \\cos 2] \\approx [0.909, -0.416]\\) — a large swing. The second pair becomes \\([\\sin 0.02, \\cos 0.02] \\approx [0.020, 0.99980]\\) — barely a flicker. Low-\\(i\\) dimensions are the *high-frequency* part of the code; they distinguish neighbouring positions sharply. High-\\(i\\) dimensions are the *low-frequency* part; they vary smoothly across the whole sequence and let the model read absolute "early in sequence" versus "late in sequence" from one or two coordinates.

The combination gives every position a unique signature in \\(\\mathbb{R}^d\\) while staying continuous: \\(PE(p)\\) and \\(PE(p+1)\\) are close in the slow dimensions and only differ noticeably in the fast ones, so the network can interpolate smoothly between neighbouring positions instead of having to memorise a separate code per row.

The deeper reason this functional form was chosen, not merely a binary-like signature: \\(PE(p+k)\\) is a *linear* transformation of \\(PE(p)\\). Applying \\(\\sin(\\alpha + \\beta) = \\sin\\alpha\\cos\\beta + \\cos\\alpha\\sin\\beta\\) inside each pair shows that shifting position by \\(k\\) is exactly multiplication by a fixed rotation matrix whose entries depend only on \\(k\\) and \\(\\omega_i\\). The model can learn "shift by 5" as one weight pattern that works at every absolute position — relative offsets fall out of the algebra of the encoding itself.`,
          },
          {
            kind: 'prose',
            heading: 'RoPE — what modern transformers use',
            body: `Rotary Position Embedding, introduced by Su et al. in 2021, is the position scheme used in essentially every open-weight LLM released from 2023 onward. The structural move is small but consequential: instead of *adding* a position vector to the input embedding, *rotate* the query and key vectors by a position-dependent angle inside the attention layer.

The mechanics. Split each \\(d\\)-dimensional query and key into \\(d/2\\) pairs of consecutive entries. For pair \\(i\\), assign angular frequency \\(\\theta_i = 1 / 10000^{2i/d}\\) — the same geometric ladder of frequencies the sinusoidal scheme used. At position \\(p\\), rotate the pair by angle \\(\\theta_{p, i} = p \\, \\theta_i\\) using the 2D rotation matrix. Apply this rotation to every \\(q\\) and every \\(k\\) before the dot product.

The payoff is what falls out of the dot product after rotation. For query at position \\(m\\) and key at position \\(n\\), the rotated inner product satisfies \\(R(m)q \\cdot R(n)k = q \\cdot R(n - m) k\\) — the result depends only on the *offset* \\(m - n\\), never on either absolute position. The model learns "what does attention 5 tokens back look like" once, and that learned pattern applies whether the pair sits at positions \\((10, 5)\\) or \\((10000, 9995)\\). Relative position is structurally guaranteed by the rotation algebra; the optimiser does not have to discover it.

Extrapolation is the practical win. The rotation is a continuous function of \\(p\\), well-defined at any integer (or any real). A model trained on context length 4096 produces sensible rotations at position 16000; combined with interpolation tricks (NTK-aware scaling, YaRN) RoPE models routinely extend to 8-32x their training context with light fine-tuning. Absolute learned embeddings cannot do this at all — there is no row 16000 in a table sized for 4096.

This is the scheme inside LLaMA, LLaMA-2, LLaMA-3, Mistral, Mixtral, Qwen, DeepSeek, Yi, GPT-NeoX, Falcon-7B's later revisions — basically every 2023+ open-source LLM. When a model card mentions "context window extended to 128k", what powered the extension is almost always a tweak to the RoPE frequency schedule rather than retraining from scratch.`,
          },
          {
            kind: 'math',
            heading: 'The original sinusoidal recipe',
            body: `Vaswani et al. (2017) needed a function from integer positions to \\(d\\)-dimensional vectors that was (a) defined for arbitrarily long sequences, (b) easy for the network to learn to use, and (c) cheap to compute. Their answer was a stack of sinusoids at geometrically spaced wavelengths:

\\[
PE(\\text{pos}, 2i) = \\sin\\!\\left( \\frac{\\text{pos}}{10000^{2i/d}} \\right), \\qquad PE(\\text{pos}, 2i+1) = \\cos\\!\\left( \\frac{\\text{pos}}{10000^{2i/d}} \\right)
\\]

Read the indexing carefully. \\(\\text{pos}\\) is the integer position in the sequence (0, 1, 2, ...). \\(i\\) runs from 0 to \\(d/2 - 1\\) and indexes pairs of dimensions. The even dimensions of \\(p_{\\text{pos}}\\) hold sines and the odd dimensions hold cosines, and dimension pair \\(i\\) uses angular frequency \\(\\omega_i = 1 / 10000^{2i/d}\\). The lowest pair (\\(i = 0\\)) has wavelength \\(2\\pi\\) — it ticks once per token. The highest pair (\\(i = d/2 - 1\\)) has wavelength \\(2\\pi \\cdot 10000\\) — it crawls across the entire sequence. The dimensions in between cover everything geometrically in between.

Why this exact functional form? Two reasons, both showing up downstream in the attention scores. First, every component is bounded in \\([-1, 1]\\), so adding \\(p_i\\) to an embedding of comparable magnitude does not blow it up. Second, and crucially, sines and cosines obey \\(\\sin(\\alpha + \\beta) = \\sin\\alpha\\cos\\beta + \\cos\\alpha\\sin\\beta\\) — so \\(PE(\\text{pos} + k)\\) is a *linear function* of \\(PE(\\text{pos})\\) for any fixed offset \\(k\\). The network can, in principle, learn to attend to "the token \\(k\\) steps back" by computing a fixed linear combination of the position embedding, regardless of the absolute position. Relative position falls out of the algebra.`,
          },
          {
            kind: 'viz',
            heading: 'Wavelengths across dimensions',
            component: 'PositionalWavelengthsViz',
          },
          {
            kind: 'prose',
            heading: 'Why sinusoidal extrapolates (sort of)',
            body: `The argument that sold the sinusoidal recipe in the original paper was extrapolation. Because the function \\(PE(\\text{pos}, \\cdot)\\) is defined for every real \\(\\text{pos}\\), you can in principle feed it position 5000 even if you only trained on sequences up to length 512. The values it returns are still in \\([-1, 1]\\), still smooth, still obey the same trig identities — so the relative-position trick from the previous section still works at any distance. Compared to learning a lookup table that has no row for position 5000, this is an obvious win.

In practice the win turned out smaller than hoped. Sinusoidal PEs do let the model run inference at sequence lengths it never saw in training without immediately crashing, but quality degrades as you move further outside the training distribution. The attention layers have learned weight matrices that interact with a certain range of PE values; at unfamiliar positions those interactions land in regions the optimiser never visited. Modern long-context models do not rely on sinusoidal extrapolation; they use methods (covered below) that target relative position directly.

Still, the sinusoidal scheme is the canonical example to understand because every later positional-encoding idea is a deliberate response to one of its limitations. Knowing what it does and where it falls short is what makes RoPE and ALiBi legible.`,
          },
          {
            kind: 'code',
            language: 'python',
            heading: 'Sinusoidal PE in PyTorch',
            body: `import math, torch

def sinusoidal_positional_encoding(seq_len: int, d_model: int) -> torch.Tensor:
    pe = torch.zeros(seq_len, d_model)
    pos = torch.arange(seq_len, dtype=torch.float32).unsqueeze(1)        # (T, 1)
    i = torch.arange(0, d_model, 2, dtype=torch.float32)                 # (d/2,)
    div = torch.exp(-math.log(10000.0) * i / d_model)                    # 1 / 10000^(2i/d)
    pe[:, 0::2] = torch.sin(pos * div)                                   # even dims: sin
    pe[:, 1::2] = torch.cos(pos * div)                                   # odd  dims: cos
    return pe                                                            # (T, d_model)

# usage inside a transformer:  x = token_embed(tokens) + pe[:tokens.size(1)]
# pe is fixed, no parameters, registered as a buffer not a parameter`,
          },
          {
            kind: 'callout',
            tone: 'tip',
            body: `**Positional encoding is *added*, not concatenated.** Every implementation does \\(X \\leftarrow X + P\\) before the first attention layer, not \\([X \\, ; \\, P]\\). Adding keeps the dimensionality at \\(d\\) so all the downstream weight matrices (\\(W_Q, W_K, W_V\\), feed-forward, output) keep their shapes. The model is free to use a few dimensions almost exclusively for position information and others almost exclusively for content — superposition in a shared \\(d\\)-dimensional space works fine because the matrices in the *Matrices* lesson can project the sum into any pair of subspaces they want.`,
          },
          {
            kind: 'prose',
            heading: 'Learned positional embeddings',
            body: `BERT and GPT-2 threw out the sinusoidal recipe and used the simplest possible alternative: a lookup table. Allocate a parameter matrix \\(P \\in \\mathbb{R}^{L_{\\max} \\times d}\\) where \\(L_{\\max}\\) is the maximum sequence length the model will ever see (512 for BERT, 1024 for GPT-2). Row \\(i\\) is the position embedding for position \\(i\\). Add it to the token embedding before the first transformer block, exactly as with sinusoidal — same downstream code. Train it end-to-end like any other parameter.

The argument for this is empirical: a model with enough data will learn whatever position representation is best for the task, possibly something the hand-designed sinusoidal scheme is missing. Vaswani et al. actually tried both in the original paper and reported no meaningful quality difference, so they kept the sinusoidal one for its extrapolation property. BERT and GPT-2 leaned the other way — extrapolation was not a goal because they always ran at the training length, and the parameter cost (\\(L_{\\max} \\cdot d\\), so around 400k extra parameters for BERT-base) was negligible against the rest of the model.

The cost of learned position embeddings is hard length capping. There is no row for position 513 in BERT; if you want to handle longer inputs you must either chunk them, retrain with a larger \\(L_{\\max}\\), or switch to a position scheme that does not bake the maximum length into the parameter count. This limitation is exactly what motivated the next generation.`,
          },
          {
            kind: 'prose',
            heading: 'Relative positional encoding (T5)',
            body: `Both sinusoidal and learned PEs encode the *absolute* position of every token, then let attention work out relative offsets from the difference. T5 (Raffel et al., 2020) noticed this is a roundabout way to encode information the model actually needs in relative form. Their version adds a learned scalar bias \\(b_{i - j}\\) directly to the attention score between query position \\(i\\) and key position \\(j\\):

\\[
\\text{score}(i, j) = \\frac{q_i \\cdot k_j}{\\sqrt{d_k}} + b_{i - j}
\\]

The bias is a function of the *offset* \\(i - j\\) only, not of either absolute position. Offsets are bucketed (small offsets get their own bucket each, large offsets share buckets logarithmically) so the parameter count stays small — typically 32 buckets per attention head. There is no embedding added to the token vector at all; position information lives entirely inside the attention computation.

This buys two things. First, the model is structurally invariant to absolute position — the same content at offset \\(j - i = 3\\) is treated identically whether it sits at positions (0, 3) or (1000, 1003). This matches what language actually cares about. Second, sequences longer than training can still attend across distances that *were* seen in training; only very large offsets that the model never bucketed before are new. T5-style relative bias was the first scheme that genuinely extrapolated in a useful way, and it dominated encoder-decoder transformers in 2020-2021.`,
          },
          {
            kind: 'math',
            heading: 'RoPE — rotary position embedding',
            body: `RoPE (Su et al., 2021) is the scheme used in LLaMA, Mistral, Qwen, DeepSeek, GPT-NeoX, and most open-weight LLMs released after 2022. The idea is to rotate the query and key vectors by a position-dependent angle so that the inner product \\(q_i^\\top k_j\\) depends *only* on the offset \\(i - j\\).

Split the \\(d\\)-dimensional query and key into \\(d/2\\) pairs of consecutive entries. For pair \\(m\\), assign angular frequency \\(\\theta_m = 10000^{-2m/d}\\) — the same geometric ladder as sinusoidal PE. At position \\(i\\), rotate the pair by angle \\(i \\theta_m\\):

\\[
R(i, m) = \\begin{pmatrix} \\cos(i\\theta_m) & -\\sin(i\\theta_m) \\\\ \\sin(i\\theta_m) & \\phantom{-}\\cos(i\\theta_m) \\end{pmatrix}, \\qquad q_i^{(m)} \\leftarrow R(i, m)\\, q_i^{(m)}
\\]

Apply the analogous rotation to \\(k_j\\). Now look at the dot product between a rotated query and a rotated key for pair \\(m\\):

\\[
(R(i,m) q)^\\top (R(j,m) k) = q^\\top R(i,m)^\\top R(j,m) k = q^\\top R(j - i, m) k
\\]

The matrix that survives is parameterised by the *offset* \\(j - i\\), not by either absolute position. Sum across all pairs and the full attention score \\(q_i \\cdot k_j\\) is a function of the content of \\(q\\), the content of \\(k\\), and the offset between them — never of where in the sequence they happen to sit. This is exactly the property T5's relative bias engineered into the score, but RoPE gets it for free out of a rotation that costs only \\(O(d)\\) extra multiplies per token.`,
          },
          {
            kind: 'viz',
            heading: 'RoPE — slide the positions, watch the dot product read only the offset',
            component: 'RotaryEmbeddingViz',
          },
          {
            kind: 'callout',
            tone: 'note',
            body: `**RoPE generalises well to far-longer contexts than it was trained on.** The rotations are continuous in position, so feeding RoPE position 16000 when training only ever saw up to 4096 produces well-defined values rather than landing outside a learned lookup table. Combined with tricks like NTK-aware scaling (stretching the angular frequency to match the new context length) and YaRN (a more careful interpolation of the rotation schedule), pretrained RoPE models can be extended to context lengths 8-32x what they were trained on with minimal fine-tuning. This is the property that powered the 100k-context releases of Yi, Mistral, and LLaMA-3 — it would not have been possible with absolute learned PEs at all.`,
          },
          {
            kind: 'prose',
            heading: 'ALiBi — bias instead of embedding',
            body: `ALiBi (Press et al., 2022) takes the relative-position idea to its minimal extreme: do not add any embedding at all, just add a linear penalty to the attention score that grows with the offset. For head \\(h\\) with a head-specific slope \\(m_h\\), the score becomes

\\[
\\text{score}(i, j) = \\frac{q_i \\cdot k_j}{\\sqrt{d_k}} - m_h \\cdot |i - j|
\\]

Closer keys get a smaller penalty, more distant keys get a larger one, and different heads get different slopes (chosen geometrically) so some heads attend locally and others can still reach far. The token embeddings themselves contain no position information; the model figures out order from this bias plus the causal mask alone.

ALiBi is dirt cheap (no extra parameters, no extra matrix multiplies — just a subtraction) and extrapolates beautifully because the bias is a continuous function of offset that is well-defined at any distance. It is the position scheme used in BLOOM and several Falcon variants. Its weakness, compared to RoPE, is that the penalty is monotone in distance — useful for "language tends to attend locally" but limiting for tasks where distant tokens really do matter equally. RoPE has become the more common choice in 2024-onward open-weight LLMs because it composes better with very long contexts that contain genuinely long-range structure.`,
          },
          {
            kind: 'prose',
            heading: 'Why modern models prefer RoPE and ALiBi',
            body: `Absolute position schemes (sinusoidal, learned) all share the same flaw: the attention score is a function of \\((i, j)\\), not of \\(j - i\\). Whatever the model learned at training positions (100, 105) does not automatically transfer to inference positions (5000, 5005), even though the offset is the same. Relative schemes (T5 bias, RoPE, ALiBi) make the score a function of the offset only — so all the learning about "what does it mean to attend 5 tokens back" is *one* thing to learn, valid at every absolute position, including positions far outside the training range.

This is why every flagship long-context release since 2023 — LLaMA-2, LLaMA-3, Mistral, Qwen, DeepSeek, Yi — uses RoPE, often with some interpolation trick on top for context extension. ALiBi is the runner-up where simplicity and very long extrapolation matter more than fine-grained attention shape. Sinusoidal and learned absolute PEs survive in older codebases and in encoder-only models where the training length matches the inference length, but they have stopped being the default for new large models.

The lesson here echoes the *Attention* lesson. Each refinement of attention — multi-head, causal masking, KV caching — was a small structural change that paid off at scale. Positional encoding has gone through the same arc: a clever hand-designed function, then a learned lookup, then a structural reformulation (relative bias, rotation) that just makes the right invariance hold. The right architecture *bakes the invariance in*; you do not train the model to discover it.`,
          },
          {
            kind: 'prose',
            heading: 'What to take away',
            body: `Self-attention is permutation-invariant — without help, the model would treat "dog bites man" and "man bites dog" as the same input. Positional encoding is how that help is added. The original sinusoidal scheme is a fixed function of position whose trig identities make relative offsets representable as linear combinations; learned PEs replace it with a lookup table indexed by absolute position. Both work at fixed context length and both struggle to extrapolate.

The modern answer is relative position. T5 adds a learned bias to the attention score as a function of offset; RoPE rotates queries and keys by position-dependent angles so the dot product depends only on the difference; ALiBi adds a head-specific linear penalty that grows with distance. RoPE and ALiBi are the schemes you will see in any LLM released after 2022, and the extension tricks built on top of RoPE are what made 100k-token context windows shippable.

Inside the transformer block this is one line of code, slotted between embedding and attention. But it is the line that decides whether your model can read a 50-token sentence or a 50,000-token codebase, and the design choice has reshaped itself three times in five years — worth knowing all three to read any modern model card.`,
          },
          {
            kind: 'prose',
            heading: 'Intuition: a clock with many hands',
            body: `Picture a wall clock with not two hands but \\(d/2\\) of them, all spinning at different rates. The fastest hand sweeps a full circle every six positions. The next one slower takes about twenty. The next about sixty. The slowest hand crawls so gradually it barely moves across the whole sequence. At any moment, read off the angle of every hand and write those angles down as a vector. That vector is the positional encoding for that moment in the sequence. No two moments produce exactly the same configuration of hands, because the rates are incommensurate — the slow hands fingerprint where in the document the token lives, while the fast hands distinguish neighbours that the slow hands cannot tell apart.

This is also why sines and cosines, not arbitrary functions. The pair (sine, cosine) at frequency \\(\\omega\\) lives on the unit circle, so reading the pair as a 2D point gives the angle of one hand on the clock. Shifting position by \\(k\\) rotates each hand by \\(k\\omega\\). Rotation is a *linear* operation — a fixed \\(2 \\times 2\\) matrix — and the same matrix works at every starting angle. The network does not have to memorise "what does position 5 look like" separately from "what does position 5005 look like." It learns one rotation, applies it everywhere, and gets the relative offset for free.

RoPE makes this more literal: instead of adding the hand angles to the embedding, rotate the query and key vectors *by* those angles. Then \\(q \\cdot k\\) automatically depends only on how much one hand turned relative to the other — which is exactly the relative offset \\(j - i\\). The clock metaphor is not decoration. It is the geometry the transformer is actually doing.`,
          },
          {
            kind: 'prose',
            heading: 'Worked example: encoding three positions in 4D',
            body: `Set \\(d = 4\\) and compute the sinusoidal encoding for positions \\(p = 0, 1, 2\\) by hand. With \\(d/2 = 2\\) pairs, the angular frequencies are \\(\\omega_0 = 1/10000^{0/4} = 1\\) and \\(\\omega_1 = 1/10000^{2/4} = 1/100 = 0.01\\).

Position \\(p = 0\\): every argument is zero, so \\(PE(0) = [\\sin 0, \\cos 0, \\sin 0, \\cos 0] = [0, 1, 0, 1]\\). The cosine hands start pointing "up"; the sine hands start at zero. This is the canonical position-zero fingerprint.

Position \\(p = 1\\): arguments are \\(1 \\cdot 1 = 1\\) for pair 0 and \\(1 \\cdot 0.01 = 0.01\\) for pair 1. So \\(PE(1) = [\\sin 1, \\cos 1, \\sin 0.01, \\cos 0.01] \\approx [0.841, 0.540, 0.010, 0.99995]\\). The fast pair has swung noticeably — \\(\\sin\\) jumped from 0 to 0.841, \\(\\cos\\) dropped from 1 to 0.540. The slow pair has barely moved.

Position \\(p = 2\\): arguments are 2 and 0.02. So \\(PE(2) = [\\sin 2, \\cos 2, \\sin 0.02, \\cos 0.02] \\approx [0.909, -0.416, 0.020, 0.99980]\\). The fast pair has crossed into negative cosine territory — it is past a quarter-turn. The slow pair has still barely moved.

Verify the relative-offset property numerically. Compute \\(PE(1) \\cdot PE(2) = 0.841 \\cdot 0.909 + 0.540 \\cdot (-0.416) + 0.010 \\cdot 0.020 + 0.99995 \\cdot 0.99980 \\approx 0.764 - 0.225 + 0.0002 + 0.9998 \\approx 1.539\\). Now compute \\(PE(0) \\cdot PE(1) = 0 \\cdot 0.841 + 1 \\cdot 0.540 + 0 \\cdot 0.010 + 1 \\cdot 0.99995 = 1.540\\). The two dot products agree to three decimal places — both pairs sit at offset 1, and the encoding makes that offset show up in the inner product. That is the trig identity in action: dot products of sinusoidal encodings are a function of the position *difference*, which is exactly what attention needs to learn "look 1 token back" once and apply it everywhere.`,
          },
          {
            kind: 'prose',
            heading: 'Further reading',
            body: `- [Jay Alammar — "The Illustrated Transformer"](https://jalammar.github.io/illustrated-transformer/) — the section on the sinusoidal scheme that shipped with the original transformer.
- [Su et al. — RoFormer / RoPE paper](https://arxiv.org/abs/2104.09864) — "Enhanced Transformer with Rotary Position Embedding"; the rotation-matrix scheme used by Llama, Mistral, Qwen, and almost every modern open LLM.
- [Karpathy — nanoGPT](https://github.com/karpathy/nanoGPT) — ~300 lines of training code with both learned and rotary positional embeddings; the cleanest reading-while-running reference.`,
          },
        ],
      },
      {
        slug: 'lora',
        title: 'LoRA: low-rank adapters',
        oneLiner: 'Fine-tune a 70B model on a single GPU. The math behind it is small matrices.',
        difficulty: 'intermediate',
        readMinutes: 9,
        sections: [
          {
            kind: 'prose',
            heading: 'Why full fine-tuning broke',
            body: `By 2021 the standard recipe for "adapting a pretrained transformer to a new task" was unambiguous: load the checkpoint, swap in a new head, run gradient descent on every weight matrix in the model. For BERT-base (110M params) this was painful but doable on a single GPU. For GPT-3 (175B) it was not. Updating every weight means an Adam optimizer state (two moments per parameter), a gradient tensor (one per parameter), and a copy of the parameters in higher precision — at FP32, that is 16 bytes per parameter, or roughly **2.8 TB of optimizer state for a 175B model**. No single GPU holds that. No reasonable team can pay for it per downstream task.

The problem compounds because every new task needs its own copy. Fine-tune a 70B model on legal documents, on medical notes, on customer-support tickets, and you have *three* 140 GB checkpoints to store, serve, and route between. The *Attention* lesson explained why the model has that many parameters — multi-head projections, feed-forward blocks, layer after layer. The *Weight initialization* lesson explained why every one of those parameters matters for the forward pass. Together they form an architecture whose strength on the pretraining task is exactly what makes per-task fine-tuning untenable.

The pragmatic question this set up was: do you actually *need* to move every parameter to adapt to a downstream task, or is the change you need much smaller than the full weight space? LoRA's answer is the second, and the answer is sharper than anyone expected.`,
          },
          {
            kind: 'prose',
            heading: 'The low-rank hypothesis',
            body: `A pretrained LLM stores its knowledge in weight matrices \\(W\\) — billions of parameters spread across attention projections, feed-forward layers, and embeddings. Fine-tuning for a specific downstream task — legal summarisation, customer-support tone, medical coding — transforms each \\(W\\) into \\(W + \\Delta W\\). The classical assumption was that \\(\\Delta W\\) is dense and roughly the same shape as \\(W\\) itself: every dimension matters, every coordinate needs an optimizer slot, and the update is structurally as expensive as the model.

The empirical observation that broke this assumption is the one Hu et al. (2021) reported. They ran full fine-tuning on standard benchmarks, extracted \\(\\Delta W\\) for the attention projections, decomposed each with an SVD, and found that the spectrum collapsed almost immediately. A 4096×4096 update with 16.7M nominal degrees of freedom had effective rank in the single digits. The task-adaptation signal lived in a tiny subspace; the remaining 16M+ directions held noise the optimizer chose not to populate.

That gives a concrete compression ratio. A full \\(4096 \\times 4096\\) matrix has \\(d^2 = 16{,}777{,}216\\) entries. A rank-8 factorisation needs \\(2 d r = 2 \\cdot 4096 \\cdot 8 = 65{,}536\\) entries — roughly **256x fewer numbers** for the same expressive subspace the optimizer was actually using during full fine-tuning. The pretrained weights stay in their dense form; only the *update* is parameterised by something small.

This is why LoRA works. Instead of allocating \\(\\Delta W \\in \\mathbb{R}^{d \\times d}\\) and training every entry, factorise it as \\(\\Delta W = B A\\) where \\(A \\in \\mathbb{R}^{r \\times d}\\), \\(B \\in \\mathbb{R}^{d \\times r}\\), and \\(r \\ll d\\). The product \\(BA\\) lives on a rank-\\(r\\) subspace of the full update space — exactly the regime where the empirical \\(\\Delta W\\) was already sitting. During training the original \\(W\\) is frozen — no gradient, no optimizer state, no copy in higher precision — and only \\(A\\) and \\(B\\) receive updates. The model's pretrained behaviour is preserved by construction; the adaptation lives entirely in the small factor pair.`,
          },
          {
            kind: 'prose',
            heading: 'Worked: parameter savings for r=8 on LLaMA-7B',
            body: `Numbers make the compression concrete. LLaMA-7B is a 32-layer transformer with hidden dimension \\(d = 4096\\). Each attention block holds four projection matrices — query, key, value, and output — and each is \\(4096 \\times 4096\\). Counting just the attention projections that LoRA typically wraps:

\\[
N_{\\text{full}} = 32 \\text{ layers} \\times 4 \\text{ projections} \\times 4096^2 \\approx 2.15 \\times 10^9
\\]

So full fine-tuning of the attention projections alone updates **2.15 billion parameters**. (The whole model is ~7B; the rest sits in MLPs, embeddings, and layer norms.) Now apply LoRA at rank \\(r = 8\\) to the same projections. Per matrix the trainable shape is \\(A \\in \\mathbb{R}^{8 \\times 4096}\\) plus \\(B \\in \\mathbb{R}^{4096 \\times 8}\\), totalling \\(2 \\cdot 8 \\cdot 4096 = 65{,}536\\) parameters. Aggregate across the model:

\\[
N_{\\text{LoRA}} = 32 \\times 4 \\times 65{,}536 \\approx 8.4 \\times 10^6
\\]

That is **8.4 million trainable parameters** — a compression of \\(2.15 \\times 10^9 / 8.4 \\times 10^6 \\approx 256\\times\\). Adam stores first and second moments per trainable parameter (two extra FP32 buffers), so the optimizer state shrinks by the same factor: instead of holding ~17 GB of moments for the attention projections, the optimizer holds ~67 MB. Gradient buffers shrink proportionally. The frozen base weights still need their memory footprint, but they sit in inference precision and need no optimizer slots.

The downstream effect is the one the LoRA paper sells. Adam moments for a 7B fine-tune, which previously needed multi-GPU sharding, now fit alongside the model on a single 24 GB consumer GPU. The fine-tuning run that required an A100 cluster collapses to one RTX 4090 with room left for activations.`,
          },
          {
            kind: 'prose',
            heading: 'QLoRA — 4-bit base + LoRA',
            body: `LoRA shrinks the trainable parameters; QLoRA (Dettmers et al., 2023) shrinks the frozen ones. The base weights \\(W\\) are quantized to 4 bits — NF4, a normal-float format the QLoRA paper introduced because INT4 destroyed quality and FP4 was not enough better to justify. Storage drops by 16x: a 65B model that needed ~130 GB in FP16 now fits in ~33 GB on disk and in GPU memory.

The LoRA factors \\(A\\) and \\(B\\) stay in BF16 — high precision matters for the parameters that actually receive gradients. The forward pass dequantizes each 4-bit weight tile to BF16 on the fly inside the kernel, adds the LoRA contribution at the same precision, and runs the matmul as normal. No accuracy loss in the math itself; the quantization shows up only in the stored representation of \\(W\\). Backward is even cleaner — gradients never need to touch the base weights, so they flow only through the small BF16 LoRA buffers. Optimizer state is the same compact set of Adam moments LoRA already gave you.

The combined effect is what made the QLoRA paper's headline result possible: fine-tune a 65B model on a single 48 GB GPU. Pure LoRA could not pull this off because the FP16 base alone exceeded 48 GB; full fine-tuning was off the table by orders of magnitude. The 4-bit base plus 16-bit LoRA adapter plus paged optimizer states is the recipe behind every "consumer-hardware fine-tune of a frontier-scale model" claim from 2023 onward. Quality matches 16-bit LoRA on most instruction-following and reasoning benchmarks — the rank-8 LoRA hypothesis is robust enough to absorb the base-weight quantization without losing the downstream adaptation signal.`,
          },
          {
            kind: 'prose',
            heading: 'The hypothesis — adapters are low-rank',
            body: `Hu et al. (2021) ran the diagnostic experiment that motivates the entire method. They took a pretrained transformer, fully fine-tuned it on a downstream task, and looked at the *difference* matrix \\(\\Delta W = W_{\\text{tuned}} - W_{\\text{pretrained}}\\) for every weight in the model. Then they decomposed \\(\\Delta W\\) with an SVD and counted how many singular values were meaningful.

The answer, across attention projections (\\(W_Q\\), \\(W_K\\), \\(W_V\\), \\(W_O\\)) and across tasks, was striking. For a matrix of dimension \\(4096 \\times 4096\\), the change introduced by fine-tuning had effective rank in the single or low double digits — sometimes as low as 1 or 2, almost never above 32. Out of 16 million degrees of freedom available to the update, fine-tuning was using a few hundred. The optimizer kept the rest at noise level because the task did not need them.

That observation is the LoRA hypothesis. Downstream adaptation lives on a *low-dimensional subspace* of the full weight space. If you commit to that subspace from the start — parameterise the update as a low-rank matrix and only train those parameters — you should recover most of the fine-tuning quality at a tiny fraction of the cost. The rest of the lesson is the architecture, the math, and the engineering that follow from taking this seriously.`,
          },
          {
            kind: 'math',
            heading: 'The LoRA factorization',
            body: `Pick a weight matrix \\(W \\in \\mathbb{R}^{d \\times d}\\) in the pretrained model — most commonly the query and value projections of every attention layer. LoRA represents the adapted weight as

\\[
W' = W + \\Delta W, \\qquad \\Delta W = B \\, A
\\]

where \\(A \\in \\mathbb{R}^{r \\times d}\\) and \\(B \\in \\mathbb{R}^{d \\times r}\\), with the **rank** \\(r\\) chosen to be much smaller than \\(d\\) — typically \\(r = 8\\) or \\(r = 16\\) for any model whose hidden dimension is in the thousands. The original \\(W\\) is **frozen**: no gradient flows to it, no optimizer state is allocated for it, the pretrained values are read once and never written. Only \\(A\\) and \\(B\\) are trained.

Count the parameters. The full weight matrix has \\(d^2\\) entries — for \\(d = 4096\\) that is \\(16{,}777{,}216\\). The LoRA factorization has \\(d r + r d = 2 d r\\) entries — for \\(d = 4096, r = 8\\) that is \\(65{,}536\\). The trainable count drops by a factor of

\\[
\\frac{d^2}{2 d r} = \\frac{d}{2 r}
\\]

which is **256x** for those numbers, and roughly **10{,}000x** if you remember that fine-tuning a transformer touches a small subset of layers, not the entire weight stack. The optimizer state shrinks by the same factor — the Adam moments now live on the LoRA parameters only. A 70B model that would have needed many GPUs for full fine-tuning fits its adapter, optimizer state, and gradients on a single 24 GB consumer card.`,
          },
          {
            kind: 'viz',
            heading: 'The frozen W plus low-rank update',
            component: 'LoRAStructureViz',
            props: {},
          },
          {
            kind: 'callout',
            tone: 'tip',
            body: `**Initialize A from \\(\\mathcal{N}(0, 1/r)\\) and B to exact zeros.** This is not optional bookkeeping — it is what makes the adapter *start* as a no-op. With \\(B = 0\\), the product \\(BA = 0\\) at step zero, so \\(W' = W\\) and the model behaves identically to the pretrained checkpoint on step one. Training then nudges \\(B\\) away from zero in whatever direction reduces the downstream loss. If you reverse the convention (zero \\(A\\), random \\(B\\)) the gradient at step one is exactly zero for both factors and nothing moves — you have to break the symmetry, and the standard way is A-random-B-zero. The *Weight initialization* lesson covered why initial conditions decide whether training starts at all; LoRA is the cleanest example of a deliberately *asymmetric* init being load-bearing.`,
          },
          {
            kind: 'math',
            heading: 'The scaling factor and which layers to wrap',
            body: `The full LoRA forward, including the scale that the paper makes explicit, is

\\[
h = W x + \\frac{\\alpha}{r} \\, B A \\, x
\\]

with \\(\\alpha\\) a constant hyperparameter (commonly \\(\\alpha = r\\) or \\(\\alpha = 2r\\), so the scale factor is \\(1\\) or \\(2\\)). The point of the \\(\\alpha / r\\) term is to **decouple the rank from the learning rate**. Without it, doubling \\(r\\) doubles the magnitude of \\(BA\\) at initialisation and you would need to halve the learning rate to compensate. With it, you can sweep \\(r\\) at fixed \\(\\alpha\\) and the effective step size on the adapter stays roughly constant.

Which weight matrices to wrap is the other practical knob. The original paper found that wrapping only \\(W_Q\\) and \\(W_V\\) in every attention layer captured most of the fine-tuning gains, and that wrapping all four attention matrices (\\(W_Q, W_K, W_V, W_O\\)) was strictly better. Modern PEFT recipes (HuggingFace, Axolotl, Unsloth) extend LoRA to the feed-forward projections too, and for instruction-tuning on small datasets often wrap *every* linear layer in the transformer. Each extra wrapped layer adds \\(2 d r\\) parameters — still tiny on the scale of the full model, still a fraction of the optimizer state full fine-tuning would have demanded. The rule of thumb is: wrap more layers for harder adaptation tasks, fewer for narrow ones, and let \\(r\\) be the lever you actually sweep.`,
          },
          {
            kind: 'code',
            language: 'python',
            heading: 'A LoRA-wrapped linear layer in PyTorch',
            body: `import math
import torch
import torch.nn as nn

class LoRALinear(nn.Module):
    """Wrap an existing nn.Linear with a low-rank trainable adapter."""

    def __init__(self, base: nn.Linear, r: int = 8, alpha: int = 16, dropout: float = 0.0):
        super().__init__()
        self.base = base                          # frozen pretrained weight
        for p in self.base.parameters():
            p.requires_grad = False

        in_features = base.in_features
        out_features = base.out_features

        # A: (r, in)  init from N(0, 1/r)
        # B: (out, r) init to zero so BA = 0 at step 0
        self.A = nn.Parameter(torch.empty(r, in_features))
        self.B = nn.Parameter(torch.zeros(out_features, r))
        nn.init.normal_(self.A, mean=0.0, std=1.0 / math.sqrt(r))

        self.scaling = alpha / r
        self.dropout = nn.Dropout(dropout) if dropout > 0 else nn.Identity()
        self.r = r

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # base path: the original pretrained linear, no gradient
        out = self.base(x)
        # adapter path: x -> A^T -> B^T, scaled
        delta = self.dropout(x) @ self.A.t() @ self.B.t()
        return out + self.scaling * delta

    @torch.no_grad()
    def merge_into_base(self):
        """Fold BA back into the base weight. Use before deploying for zero-latency inference."""
        delta_w = self.scaling * (self.B @ self.A)        # (out, in)
        self.base.weight.add_(delta_w)
        # adapter is now redundant; you can drop it from the module list
        self.A.data.zero_()
        self.B.data.zero_()`,
          },
          {
            kind: 'callout',
            tone: 'tip',
            body: `**Always merge adapters at inference for production deployment.** During training the LoRA path adds two extra matrix multiplies per wrapped layer, which costs measurable latency on long contexts. At inference time you can fold the adapter into the base weight in one shot — \\(W_{\\text{merged}} = W + \\frac{\\alpha}{r} B A\\) — and the resulting model has *zero* extra runtime cost compared to the unadapted checkpoint. The forward pass is one matmul, not three. The only reason to keep the adapter separate at inference is if you need to **swap adapters per request** (a customer-support adapter for some queries, a legal-review adapter for others) — which is exactly what the next section is about.`,
          },
          {
            kind: 'prose',
            heading: 'Inference: merge or swap',
            body: `LoRA gives you two clean deployment modes, and the choice is set by your serving pattern.

**Merge mode.** If every request to a given GPU uses the same adapter, merge it. Run \`merge_into_base\` once at startup, throw away the LoRA parameters, and serve the resulting checkpoint with the same code path you would have used for the original model. No latency overhead, no extra memory, no framework changes downstream. This is the right mode for a fine-tuned chatbot, a domain-specific code assistant, a single-task internal tool — anything where the adapter identity is fixed per deployment.

**Adapter-swap mode.** If you need to switch between adapters per request — multi-tenant SaaS where each customer trained their own LoRA, an internal platform routing legal queries to one adapter and medical queries to another — keep the base model loaded once and treat adapters as small lookup tables. A 70B base model is ~140 GB; each LoRA adapter is ~50 MB. You can hold the base on the GPU and stream adapters in and out per request, paying milliseconds of bandwidth instead of reloading the model. Frameworks like vLLM and HuggingFace TGI now support exactly this — *multi-LoRA serving* — and it has become the standard way to operate fine-tuned LLMs at scale.

Both modes share the same trained checkpoint. You decide at deploy time whether to bake the adapter in or keep it swappable, and you can switch later by re-running the merge step. The *Attention* lesson described why the base model dominates VRAM at inference; LoRA leverages that exact property to amortise it across hundreds of downstream tasks at once.`,
          },
          {
            kind: 'prose',
            heading: 'QLoRA — quantize the base, train the adapter',
            body: `LoRA shrinks the trainable parameter count, but the *frozen* base model still needs to live in GPU memory at full precision. A 70B model in FP16 is 140 GB. The single-GPU consumer-fine-tune story did not quite close until QLoRA (Dettmers et al., 2023) added the missing piece: **quantize the base weights to 4 bits, keep the LoRA adapter in FP16 or BF16.**

The base model goes from 140 GB to 35 GB once quantized to NF4 (a 4-bit normal-float format the QLoRA paper introduced because INT4 destroyed quality and FP4 was not enough better to matter). Forward passes through the quantized weights are dequantized on the fly into a high-precision compute kernel, so the math is still done at full precision — only the *storage* is shrunk. The LoRA adapter trains in full precision because it is small enough that the cost is negligible.

The combined recipe — 4-bit base, 16-bit LoRA adapter, paged optimizer states so gradient accumulation does not spike — is what made fine-tuning a 65B-parameter model on a single 48 GB GPU possible in 2023. Every open-weight LLM with a "fine-tuned on consumer hardware" claim attached to it is doing some variant of QLoRA. The pure-LoRA paper opened the door; QLoRA pushed it through.`,
          },
          {
            kind: 'prose',
            heading: 'Modern usage — PEFT, multi-LoRA, the variants',
            body: `LoRA is not a research artifact you build by hand any more; it is a one-line call in **HuggingFace PEFT** (\`get_peft_model(base, LoraConfig(r=16, lora_alpha=32, target_modules=["q_proj", "v_proj"]))\`) or a config knob in **Axolotl**, **Unsloth**, **LLaMA-Factory**, and every fine-tuning stack built on top of \`transformers\`. The recipe is so standardised that a typical instruction-tuning run on a 7B model takes one config file, half a GPU-day on a single 24 GB card, and produces a 50 MB adapter file you push to the Hugging Face Hub next to the base.

The serving side has caught up. **vLLM**, **TGI**, and **SGLang** support multi-LoRA — load the base model once, register dozens of adapters, route each incoming request to its adapter at the kernel level. The cost per extra adapter is the disk size of the adapter file plus a few microseconds of routing per request. This is the architecture behind every "fine-tune your own model" SaaS product currently in production: one base GPU pool, thousands of customer-specific LoRAs, hot-swapped per request.

LoRA itself has spawned a family of refinements, each fixing a specific limitation. **DoRA** (Liu et al., 2024) decomposes the weight update into magnitude and direction components, training the direction with LoRA and the magnitude separately, and consistently outperforms vanilla LoRA at the same rank. **AdaLoRA** (Zhang et al., 2023) treats the rank as a *learned* allocation — some layers get rank 32, others rank 2, decided by a singular-value-based importance score during training. **VeRA** ties \\(A\\) and \\(B\\) across layers and trains only scaling vectors, dropping the parameter count another 10x. Each is a tweak on the same core idea: parameterise the update as a small object, freeze the rest, and pay only for what the task actually needs.`,
          },
          {
            kind: 'callout',
            tone: 'note',
            body: `**The LoRA → DoRA → AdaLoRA → VeRA progression.** If LoRA is the version you should understand from first principles, DoRA is the version you should reach for first when you actually train something — it is a near drop-in replacement, supported in PEFT, and is usually 1-2 quality points better on instruction-tuning benchmarks at the same rank. AdaLoRA is the right pick when you have a fine-tuning budget and want the rank allocated where it helps most rather than uniformly. VeRA is for the regime where even LoRA's parameter count is too high — research models, edge deployment, or systems hosting thousands of adapters simultaneously. The base idea is the same in all four; what changes is the structure of the small object you train.`,
          },
          {
            kind: 'prose',
            heading: 'What to take away',
            body: `Full fine-tuning of a modern LLM updates every one of billions of parameters and demands an optimizer state larger than the model itself. The empirical observation that fine-tuning actually moves the weights on a low-dimensional subspace turned that cost from intrinsic into accidental. LoRA commits to the subspace from the start: keep \\(W\\) frozen, parameterise the update as \\(\\Delta W = BA\\) with rank \\(r\\) in the single or low double digits, train only \\(A\\) and \\(B\\). Initialize \\(A\\) from \\(\\mathcal{N}(0, 1/r)\\), \\(B\\) to zero, scale by \\(\\alpha / r\\), and the adapter starts as a no-op and trains in the same loss landscape as the original model.

The trainable-parameter count drops by roughly \\(d / 2r\\) per wrapped layer — four orders of magnitude on a typical transformer. Optimizer state, gradient buffers, and disk footprint shrink by the same factor. Pair LoRA with 4-bit quantization of the base weights (QLoRA) and a 65B-parameter model fits its full fine-tuning run on a single consumer GPU. At inference time you either merge the adapter into the base for zero-latency serving or keep it separate so dozens of adapters can be hot-swapped against a single shared base model — the multi-LoRA pattern that powers fine-tune-your-own-LLM SaaS in 2025.

The *Attention* and *Weight initialization* lessons explain why the base model has the parameter count and the loss landscape it does. The *Batch norm* lesson is the canonical example of "find the right reparameterisation and the optimisation problem changes shape." LoRA is the same move applied at a different layer of the stack: the right factorisation of the *update*, not the *layer*, is what made fine-tuning at scale tractable. Every modern open-weight LLM ecosystem — HuggingFace PEFT, vLLM multi-LoRA, the DoRA / AdaLoRA / VeRA family — is built on that one observation about rank.`,
          },
          {
            kind: 'prose',
            heading: 'Further reading',
            body: `- [Hu et al. — LoRA paper](https://arxiv.org/abs/2106.09685) — "LoRA: Low-Rank Adaptation of Large Language Models"; the original paper with the rank ablation tables and the parameter-count math.
- [Hugging Face — PEFT documentation](https://huggingface.co/docs/peft) — the production-ready library: LoRA, QLoRA, IA³, prompt tuning, adapter merging, all with code snippets.
- [Dettmers et al. — QLoRA paper](https://arxiv.org/abs/2305.14314) — "QLoRA: Efficient Finetuning of Quantized LLMs"; how 4-bit base weights + LoRA adapters fit a 65B fine-tune onto a single 48 GB GPU.`,
          },
        ],
      },
      {
        slug: 'quantization',
        title: 'Model quantization',
        oneLiner: 'Drop weights from fp32 to int8 or int4 and a 14 GB model fits in 3.5 GB — the dominant compression trick behind every served LLM.',
        difficulty: 'intermediate',
        readMinutes: 13,
        sections: [
          {
            kind: 'prose',
            heading: 'What quantization actually is',
            body: `Quantization is the practice of representing a neural network's weights and activations with fewer bits than the precision it was trained in. A model trained in fp32 stores every weight as a 32-bit floating-point number; quantizing it to int8 replaces each weight with an 8-bit integer plus a small per-tensor or per-channel scale factor, and quantizing to int4 cuts another bit-width in half. The arithmetic at inference time is then performed in the lower precision — int8 matmuls on tensor cores, int4 with custom kernels — and a final dequantization brings activations back to fp16 or fp32 wherever the next layer needs them.`,
          },
          {
            kind: 'prose',
            heading: 'Why it matters for serving',
            body: `A Llama-7B model in fp16 occupies roughly 14 GB of weights — 7 billion parameters times 2 bytes per parameter. Quantize the same weights to int4 and the footprint drops to about 3.5 GB, with 4-bit storage plus a tiny scale overhead per group. The same model now fits comfortably on a single consumer GPU with 8 GB of VRAM, or two of them on a 16 GB card with room for the kv-cache and activations. Llama-70B sits at 140 GB in fp16 and around 35 GB in int4 — the difference between an eight-GPU node and a single A100. Memory bandwidth, not compute, is the bottleneck at batch size one, so a 4x reduction in weight size translates almost directly into a 2-3x speedup on autoregressive token generation.`,
          },
          {
            kind: 'prose',
            heading: 'Intuition — picking a smart grid where the weights actually live',
            body: `A trained network's weights are not uniformly distributed across the fp32 range. Plot the histogram of any well-trained layer and you will see a tight cluster around zero with an approximately Gaussian shape, often with a standard deviation in the range of \\(0.01\\) to \\(0.1\\). Almost every weight has magnitude below \\(0.5\\); a handful of outliers sit out past \\(1.0\\) or \\(2.0\\). fp32 spends 32 bits of precision uniformly across an enormous dynamic range — from \\(10^{-38}\\) to \\(10^{38}\\) — and the network uses approximately none of that range. The bits encoding the exponent are almost all wasted, and the bits encoding the mantissa are giving you precision down to the eighth decimal place on weights that the optimizer was never going to land within \\(10^{-3}\\) of the next gradient step anyway.

The 3B1B-style reframe: imagine the number line stretched across the page, and the trained weights as dust scattered across it. fp32 lays down a ruler with \\(2^{32}\\) tick marks evenly spaced from \\(-3.4 \\times 10^{38}\\) to \\(+3.4 \\times 10^{38}\\); the dust occupies a microscopic interval near the origin and ignores the rest of the ruler entirely. Quantization is the act of *throwing away the ruler and drawing a new, much shorter one* — say, 256 evenly spaced tick marks (int8) or 16 tick marks (int4) — sized exactly to cover where the dust actually sits. Each weight then snaps to its nearest tick.

The grid is parameterised by a single number, the **scale** \\(s\\), which says how wide each tick is in floating-point units. Choose \\(s\\) too large and the grid is coarse; small weights all collapse onto the same tick and the model loses its fine-grained structure. Choose \\(s\\) too small and the outliers fall off the end of the grid; they get clipped to the maximum representable integer and the model loses its tails. The whole craft of quantization is finding the \\(s\\) that balances these two failures — and then doing it per-tensor, per-channel, or per-group depending on how much the optimum varies across the weight matrix.`,
          },
          {
            kind: 'viz',
            heading: 'Weights → quantization grid → dequantized weights',
            component: 'QuantizationViz',
          },
          {
            kind: 'prose',
            heading: 'Worked tiny example — eight weights through int8',
            body: `Take the weight vector \\(w = [-0.84, -0.21, 0.05, 0.13, 0.42, 0.67, 1.02, 1.45]\\) and walk it through symmetric int8 quantization by hand.

**Step 1 — pick the scale.** Symmetric quantization uses the max absolute value of the tensor as the reference: \\(\\max(|w|) = 1.45\\). The int8 range covers \\([-127, 127]\\) (we exclude \\(-128\\) to keep the grid symmetric around zero). Scale is \\(s = 1.45 / 127 = 0.011417\\). Each integer tick is worth about \\(0.0114\\) in floating-point units.

**Step 2 — quantize each weight.** Compute \\(q_i = \\mathrm{round}(w_i / s)\\). For \\(-0.84\\): \\(-0.84 / 0.011417 = -73.57\\), rounds to \\(-74\\). Run the same on every entry: \\(q = [-74, -18, 4, 11, 37, 59, 89, 127]\\). All eight values fit inside the \\([-127, 127]\\) range; no clipping needed. Notice that \\(1.45\\) lands exactly on \\(127\\) — that is the boundary case the symmetric scheme is designed for.

**Step 3 — dequantize back to floats.** Multiply by the scale: \\(\\hat{w}_i = q_i \\cdot s\\). For \\(-74\\): \\(-74 \\cdot 0.011417 = -0.8449\\). The full reconstruction is \\(\\hat{w} \\approx [-0.8449, -0.2055, 0.0457, 0.1256, 0.4224, 0.6736, 1.0162, 1.4500]\\).

**Step 4 — measure the error.** Per-entry differences are \\(w - \\hat{w} \\approx [0.0049, -0.0045, 0.0043, 0.0044, -0.0024, -0.0036, 0.0038, 0.0000]\\). The max absolute error is about \\(0.005\\) — half the tick width, as you would expect from rounding. The mean squared error is on the order of \\(10^{-5}\\). For a weight tensor where typical values are in the tenths, a per-weight perturbation of \\(0.005\\) is well below the noise floor the model already absorbed during stochastic training.

Notice what would have happened if a single outlier of magnitude \\(10\\) had been hiding in the same tensor: the scale would have jumped to \\(10/127 \\approx 0.079\\), every other weight would have lost an order of magnitude of resolution, and the small weights would have collapsed onto a handful of grid points. That is the outlier problem the more advanced methods all fight in different ways.`,
          },
          {
            kind: 'math',
            heading: 'Quantize and dequantize, formally',
            body: `Symmetric uniform quantization is two equations. The forward map sends a float \\(w\\) to an integer \\(q\\):

\\[
q = \\mathrm{round}\\!\\left( \\frac{w}{s} \\right), \\qquad s = \\frac{\\max(|w|)}{2^{b-1} - 1}
\\]

The reverse map (used at inference time, or to inspect reconstruction error) recovers an approximation \\(\\hat{w}\\):

\\[
\\hat{w} = q \\cdot s
\\]

For asymmetric quantization the grid is shifted by a zero-point \\(z\\) so the minimum and maximum of the tensor land at \\(0\\) and \\(2^{b} - 1\\) respectively:

\\[
q = \\mathrm{round}\\!\\left( \\frac{w}{s} \\right) + z, \\qquad \\hat{w} = (q - z) \\cdot s
\\]`,
          },
          {
            kind: 'callout',
            tone: 'note',
            body: `**Symbols.** \\(w\\) is the original floating-point weight (fp32 or fp16). \\(q\\) is its quantized integer representation, stored in \\(b\\) bits (typically \\(b \\in \\{8, 4\\}\\)). \\(s > 0\\) is the **scale**, a single floating-point number per tensor (or per channel, or per group of \\(g\\) consecutive weights) that says how wide each integer tick is in float units. \\(z\\) is the **zero-point**, the integer value that decodes to floating-point zero; in symmetric quantization \\(z = 0\\) by construction. \\(\\hat{w}\\) is the dequantized weight — what the model effectively uses at inference time. The reconstruction error \\(w - \\hat{w}\\) is bounded by \\(s/2\\) per weight.`,
          },
          {
            kind: 'callout',
            tone: 'tip',
            body: `**Symmetric vs asymmetric.** Symmetric quantization fixes \\(z = 0\\) and uses a grid centred on the origin: \\(q = \\mathrm{round}(w/s)\\). It is the natural fit for weights, which are roughly zero-centred after training, and the int8 matmul kernels on tensor cores assume zero-point zero so symmetric weights compile to the fastest possible paths. Asymmetric quantization picks both a scale and a zero-point so the grid can shift; \\(q = \\mathrm{round}(w/s) + z\\). It is the right choice for **activations**, which are often non-negative (post-ReLU) or otherwise lop-sided, because symmetric grids waste half their bits on a range the activation never visits. Modern stacks default to symmetric weights, asymmetric activations.`,
          },
          {
            kind: 'callout',
            tone: 'tip',
            body: `**Per-tensor vs per-channel vs per-group.** Per-tensor uses one scale for the entire weight matrix — cheapest to store, worst when channels have wildly different magnitudes. Per-channel (per-row for the output dimension of a linear layer) gives each channel its own scale — far better quality, costs one extra fp16 number per output channel. Per-group splits each row into groups of \\(g\\) consecutive weights (typical \\(g \\in \\{32, 64, 128\\}\\)) and stores a scale per group — the GPTQ / AWQ default, recovers most of per-channel's accuracy at int4 while keeping the scale overhead under 5% of the storage budget. Granularity is a knob you tune against accuracy on a held-out calibration set.`,
          },
          {
            kind: 'prose',
            heading: 'Post-training quantization (PTQ)',
            body: `Post-training quantization is the path of least resistance. Take an already-trained fp16 or fp32 checkpoint, run a few hundred unlabelled samples through it to collect activation statistics, fit the per-tensor or per-channel scales to those statistics, and write out the integer weights. No gradient steps, no labels, no optimizer state — calibration finishes in minutes on a single GPU even for a 70B model. The catch is that PTQ commits to whatever scale the calibration distribution implied, and any drift between calibration data and production traffic shows up as accuracy loss. For int8 weights on transformers PTQ is usually within a fraction of a point of the fp16 baseline; at int4 the gap widens, which is what GPTQ and AWQ exist to close. PTQ is the right call whenever you do not have access to the training pipeline — closed-source weights, no labelled data, no compute budget for retraining.`,
          },
          {
            kind: 'prose',
            heading: 'Quantization-aware training (QAT)',
            body: `Quantization-aware training inserts **fake-quant** operators into the forward pass at training time. Each weight (and optionally each activation) is rounded to its int8 or int4 grid in the forward pass, then dequantized back to float before the matmul, so the model sees the rounding error during training. The backward pass uses the **straight-through estimator**: gradients flow through the round as if it were the identity, so the optimizer can still update the underlying fp32 master weights. Over a few hundred to a few thousand steps the master weights drift to positions where their quantized projections produce small loss — the network actively learns to compensate for the rounding it knows is coming. QAT closes most of the accuracy gap at int4 and is the standard recipe whenever the training pipeline is in reach: int4 QAT often matches int8 PTQ on accuracy at half the storage. Cost is a fine-tuning run, not a from-scratch retrain.`,
          },
          {
            kind: 'prose',
            heading: 'GPTQ, AWQ, SmoothQuant — what beats round-to-nearest',
            body: `Round-to-nearest (RTN) — quantize every weight independently to its closest grid point — is the naive baseline and the floor everything else must beat. **GPTQ** (Frantar et al. 2022) reframes quantization as a layerwise reconstruction problem: for each linear layer, find the integer weights that minimise the squared error of the layer's output on a small calibration set, solving a quadratic with the inverse Hessian via OBS-style updates. The result is a one-shot int3 or int4 quantization that loses under 1% on perplexity for OPT-175B in about four GPU-hours. **AWQ** (Lin et al. 2023) starts from the observation that only a tiny fraction (~1%) of weight channels are *salient* — the channels feeding the activations with the largest magnitude. Scale those channels up before quantizing and back down after, and the quantization error on the channels that matter shrinks dramatically; AWQ runs without backprop, finishes faster than GPTQ, and matches or beats it at int4. **SmoothQuant** (Xiao et al. 2022) attacks the dual problem — activations have nastier outliers than weights — by migrating difficulty from activations to weights via a per-channel multiplicative rescaling, making int8 PTQ feasible for activations on transformer architectures that would otherwise need int16.`,
          },
          {
            kind: 'prose',
            heading: 'Mixed precision — pick a precision per tensor, not per model',
            body: `Most production stacks do not quantize uniformly. A typical 4-bit serving setup might keep weights in int4 with per-group scales, run activations in fp16, hold the kv-cache in int8 (or int4 with NF4 tiles), and leave layer-norm, softmax, and embedding layers at full precision. The kv-cache split alone matters disproportionately: at long context, the cache dominates memory, and int8 kv-cache nearly doubles the maximum sequence length on a fixed GPU. Outlier-prone layers — the first and last transformer block, the attention output projection — sometimes get bumped back to int8 even when the rest of the model runs at int4, because the few extra bits there protect the layers that everything else flows through. Mixed precision is the rule, not the exception, on any model big enough to need quantizing in the first place.`,
          },
          {
            kind: 'code',
            language: 'python',
            heading: 'PyTorch QAT skeleton with FX-graph fake-quant',
            body: `import torch
import torch.nn as nn
from torch.ao.quantization import get_default_qat_qconfig_mapping
from torch.ao.quantization.quantize_fx import prepare_qat_fx, convert_fx

def quantize_aware_train(model, train_loader, calib_batch, epochs=3, lr=1e-5):
    model.train()
    qconfig_mapping = get_default_qat_qconfig_mapping("x86")

    prepared = prepare_qat_fx(model, qconfig_mapping, example_inputs=calib_batch)

    optimizer = torch.optim.AdamW(prepared.parameters(), lr=lr)
    loss_fn = nn.CrossEntropyLoss()

    for _ in range(epochs):
        for x, y in train_loader:
            optimizer.zero_grad()
            logits = prepared(x)
            loss_fn(logits, y).backward()
            optimizer.step()

    prepared.eval()
    quantized = convert_fx(prepared)
    return quantized

# Dynamic int8 PTQ alternative — one line, no calibration data needed
ptq_model = torch.ao.quantization.quantize_dynamic(
    model, {nn.Linear}, dtype=torch.qint8
)`,
          },
          {
            kind: 'callout',
            tone: 'note',
            body: `**Pitfalls.**

- **Outliers destroy the scale.** A single weight of magnitude \\(10\\) in a tensor whose other values sit under \\(0.5\\) blows the scale up 20x and squashes every other weight onto a handful of grid points. Clip the tensor to a percentile (\\(99.9\\%\\) is a safe default) before fitting the scale, or use per-group quantization so the outlier only contaminates its own group.
- **Activations are harder than weights.** Weights are static and roughly Gaussian; activations are sample-dependent and have heavy tails — single tokens can push activation magnitudes 10–100x above the mean. Symmetric int8 on activations often fails where the same scheme on weights succeeds. SmoothQuant exists precisely to migrate this difficulty back into the weights, where it is easier to handle.
- **Layer-norm and softmax need full precision.** Layer-norm computes a per-token mean and variance that are sensitive to small numerical perturbations; softmax has an \\(\\exp\\) that is unstable in low precision. Keep both in fp16 or fp32. The matmuls around them can still quantize freely.
- **Do not quantize the embedding layer naively.** Token-embedding rows for rare tokens can drift far from the typical scale, and quantizing the whole table per-tensor crushes the rare-token rows. Either leave the embedding in fp16 or quantize per-row (per-token), never per-tensor.`,
          },
          {
            kind: 'prose',
            heading: 'Variants and frontier — int4, FP8, BitNet',
            body: `Int4 weight-only quantization with GPTQ or AWQ is now the default for open-weight LLM serving in 2025 — the bitsandbytes, llama.cpp, vLLM, and TensorRT-LLM stacks all ship int4 paths and the accuracy cost is negligible for most chat workloads. **FP8** (E4M3 for weights, E5M2 for gradients) is the precision Hopper-class GPUs train in natively; H100 and B100 expose FP8 tensor cores, and frontier-lab pretraining runs are increasingly FP8 end-to-end, with fp16 master weights only for the optimizer state. **BitNet b1.58** (Ma et al. 2024) trains the network with ternary weights \\(\\{-1, 0, +1\\}\\) from scratch and shows that, at scale, a 1.58-bit model can match an fp16 model of the same parameter count — replacing every multiplication with addition and unlocking a hypothetical custom-hardware regime where serving a 70B model costs roughly what serving a 7B model costs today. The frontier is moving toward fewer bits at every layer of the stack.`,
          },
          {
            kind: 'prose',
            heading: 'When NOT to quantize',
            body: `Quantize for inference; do not quantize a training run unless you know exactly what you are doing — gradients have wider dynamic range than weights and quantization noise compounds across steps. Skip quantization on tiny models where the absolute memory savings do not justify the kernel complexity (a 50M-parameter model is 100 MB in fp16; int4 buys you 75 MB, not worth the calibration). Be cautious with models that lean heavily on rare-token embeddings or domain-specific vocabularies, where the embedding table is both large and lopsided; per-row quantization handles this but per-tensor will silently destroy accuracy on the tail.`,
          },
          {
            kind: 'callout',
            tone: 'tip',
            body: `**Further reading.**

- [Jacob et al. — "Quantization and Training of Neural Networks for Efficient Integer-Arithmetic-Only Inference" (2017)](https://arxiv.org/abs/1712.05877) — the foundational paper that put int8 inference into MobileNet and every on-device CV stack since; symmetric/asymmetric schemes, per-channel scales, and the co-designed training procedure all originate here.
- [Frantar et al. — "GPTQ: Accurate Post-Training Quantization for Generative Pre-trained Transformers" (2022)](https://arxiv.org/abs/2210.17323) — the layerwise OBS-style PTQ algorithm that made int3/int4 quantization of 175B-parameter models a four-GPU-hour job.
- [Lin et al. — "AWQ: Activation-aware Weight Quantization for LLM Compression and Acceleration" (2023)](https://arxiv.org/abs/2306.00978) — the salient-channel scaling trick that beats GPTQ on most chat workloads and powers the TinyChat / mobile-GPU Llama-2-70B demos.
- [Hugging Face — "A Gentle Introduction to 8-bit Matrix Multiplication" (Dettmers et al.)](https://huggingface.co/blog/hf-bitsandbytes-integration) — the bitsandbytes integration blog covering the LLM.int8() outlier-aware scheme that fits BLOOM-176B on a single 8x A100 node instead of three.`,
          },
        ],
      },
      {
        slug: 'knowledge-distillation',
        title: 'Knowledge distillation',
        oneLiner: 'A small student model learns to mimic a big teacher’s soft probability distribution — not just its top guess.',
        difficulty: 'intermediate',
        readMinutes: 11,
        sections: [
          {
            kind: 'prose',
            heading: 'The compression problem distillation solves',
            body: `A trained model the size of GPT-4 or a 70B LLaMA is wonderful on a benchmark and impossible to serve on a phone. The serving budget — latency, memory, energy per request — is set by the *deployed* model, not the trained one. The classical answer was to retrain a smaller architecture from scratch with the same labels and accept that it would be worse. Knowledge distillation is the observation that the smaller architecture does not have to learn from the labels alone. It can learn from the *outputs of the larger model*, and those outputs carry strictly more information than the labels do.

That extra information is the difference between a teacher writing "the answer is C" on the board and a teacher saying "I am 91% sure the answer is C, 7% on B, 1% on D, and 1% on A". The first line is the hard label. The second line is the *soft distribution*. Both agree on the right answer; only the second tells you that B was a near miss and A was obviously wrong. A student that fits only the hard label has no way to know which mistakes are forgivable and which are absurd; a student that fits the soft distribution inherits that judgement for free.

Hinton, Vinyals and Dean's 2015 paper formalised this: train the small model to match a temperature-softened version of the large model's logits, mix that loss with the usual hard-label cross-entropy, and a 1–1000x smaller network ends up within a percent or two of the teacher on the held-out set. The technique now sits at the bottom of every "phone-sized LLM" pipeline — DistilBERT, DistilGPT, TinyLLaMA, Gemma 2, the Phi family — and is the standard partner to quantisation and pruning when a model has to ship.`,
          },
          {
            kind: 'prose',
            heading: 'Intuition: the dark knowledge in soft labels',
            body: `Picture a teacher network that has spent millions of GPU-hours internalising the geometry of its label space. For an image of a husky it does not output \\([0, 0, 1, 0, \\ldots]\\) on the one-hot axis "husky". It outputs something like \\([0.001, 0.04, 0.91, 0.04, 0.005, \\ldots]\\) — huge mass on husky, a sliver on malamute, another sliver on Siberian wolf, near zero on goldfish. Those non-zero entries are the teacher quietly admitting *which classes live near each other in its internal feature space*. The teacher has not just learned "this is a husky"; it has learned "this is a husky, and if it weren’t, malamute would be the second-best guess". That side information is sometimes called **dark knowledge** — it is invisible in the argmax but rich in the full vector.

The student is a much smaller network trying to learn the same task. If you train it on hard labels only, the only signal it ever sees is "the right index is 2"; every wrong class is treated as equally wrong. The student has to rediscover the husky/malamute proximity from scratch, with far less capacity than the teacher used, and usually fails. If you train it on the teacher’s full soft distribution instead, every gradient step pushes the student’s probabilities to be close to the teacher’s probabilities — including the near-misses. The student is no longer learning the labels; it is learning the *teacher’s view of the label geometry*. That is why a 60M-parameter DistilBERT keeps 97% of a 110M-parameter BERT’s GLUE score, even though training a 60M model from scratch on the same labels lands far worse.

The 3B1B-style reframe: hard labels are arrows pointing at a single corner of the probability simplex. Soft labels are points *inside* the simplex, and the location inside encodes the full similarity structure the teacher learned. The student’s job is to land at the same point, not just in the same corner.`,
          },
          {
            kind: 'viz',
            heading: 'Teacher softens → student matches',
            component: 'KnowledgeDistillationViz',
          },
          {
            kind: 'math',
            heading: 'The distillation loss',
            body: `Let \\(z_T\\) be the teacher’s logits on an input and \\(z_S\\) be the student’s logits. Define the temperature-softened probability distributions

\\[
p^T_i = \\frac{\\exp(z_{T,i} / T)}{\\sum_j \\exp(z_{T,j} / T)}, \\qquad p^S_i = \\frac{\\exp(z_{S,i} / T)}{\\sum_j \\exp(z_{S,j} / T)}
\\]

with a temperature \\(T \\geq 1\\). The full distillation objective combines a soft-target term that matches the teacher and a hard-target term that anchors to the true label \\(y\\):

\\[
\\mathcal{L} = \\alpha \\cdot T^2 \\cdot \\mathrm{KL}\\!\\left(p^T \\;\\|\\; p^S\\right) \\;+\\; (1 - \\alpha) \\cdot \\mathrm{CE}\\!\\left(y, \\; p^S_{T=1}\\right)
\\]

The \\(T^2\\) multiplier on the KL term is the Hinton trick — derivatives through the softmax with temperature \\(T\\) scale as \\(1/T^2\\), so multiplying by \\(T^2\\) keeps the gradient magnitude comparable to the hard-label term and lets you change \\(T\\) without re-tuning the learning rate.`,
          },
          {
            kind: 'callout',
            tone: 'note',
            body: `**Symbols in the loss.** \\(z_T, z_S\\) are the pre-softmax logits of teacher and student; \\(p^T, p^S\\) are their temperature-softened distributions over classes. \\(T\\) is the temperature — raise it to flatten, drop it to sharpen. \\(\\alpha \\in [0, 1]\\) is the mixing weight on the soft loss; common practice is \\(\\alpha \\in [0.5, 0.9]\\) when the teacher is strong. \\(\\mathrm{KL}(p \\| q) = \\sum_i p_i \\log(p_i / q_i)\\) is the Kullback–Leibler divergence — zero when the student matches the teacher, positive otherwise. \\(\\mathrm{CE}(y, p) = -\\log p_y\\) is the usual hard-label cross-entropy, evaluated at \\(T = 1\\) so the hard-label gradient is not also flattened.`,
          },
          {
            kind: 'prose',
            heading: 'Worked tiny example — three classes, end to end',
            body: `Take a 3-class problem with teacher logits \\(z_T = [4, 2, -1]\\) and student logits \\(z_S = [3, 2.5, -2]\\) on the same input. The true label is class 0. Set \\(T = 2\\), \\(\\alpha = 0.7\\), and walk the loss in numbers.

**Step 1 — temperature-softened teacher.** Divide each logit by \\(T = 2\\): \\(z_T / T = [2.0, 1.0, -0.5]\\). Exponentiate: \\([e^{2.0}, e^{1.0}, e^{-0.5}] = [7.389, 2.718, 0.607]\\). Sum is \\(10.714\\). Normalise: \\(p^T = [0.690, 0.254, 0.057]\\). Compare to the \\(T = 1\\) distribution \\(\\mathrm{softmax}(z_T) = [0.866, 0.117, 0.018]\\): the temperature smeared mass away from class 0 onto classes 1 and 2, exactly the dark-knowledge effect the lesson keeps describing.

**Step 2 — temperature-softened student.** \\(z_S / T = [1.5, 1.25, -1.0]\\), exponentiated \\([4.482, 3.490, 0.368]\\), sum \\(8.340\\), \\(p^S = [0.537, 0.418, 0.044]\\). The student’s peak is in the right place but considerably flatter than the teacher’s.

**Step 3 — KL divergence.** \\(\\mathrm{KL}(p^T \\| p^S) = \\sum_i p^T_i \\log(p^T_i / p^S_i)\\):
\\(0.690 \\log(0.690/0.537) = 0.690 \\cdot 0.2509 = 0.1731\\),
\\(0.254 \\log(0.254/0.418) = 0.254 \\cdot (-0.4972) = -0.1263\\),
\\(0.057 \\log(0.057/0.044) = 0.057 \\cdot 0.2595 = 0.0148\\).
Sum: \\(\\mathrm{KL} \\approx 0.0616\\). Multiply by \\(T^2 = 4\\): the soft-loss contribution is \\(\\approx 0.2465\\).

**Step 4 — hard-label cross-entropy.** Compute \\(\\mathrm{softmax}(z_S)\\) at \\(T = 1\\): \\(e^{z_S} = [20.086, 12.182, 0.135]\\), sum \\(32.403\\), so \\(p^S_{T=1} = [0.620, 0.376, 0.004]\\). True label is class 0, so \\(\\mathrm{CE} = -\\log(0.620) \\approx 0.4780\\).

**Step 5 — combine.** \\(\\mathcal{L} = 0.7 \\cdot 0.2465 + 0.3 \\cdot 0.4780 \\approx 0.1726 + 0.1434 = 0.3160\\). The student’s gradient comes from two simultaneous signals: drive the soft distribution toward the teacher’s flatter shape (KL term, where the student’s 0.418 on class 1 is the largest single contribution) and stay confident on the true label (CE term). Drop the KL term and the student converges on a one-hot answer with no sense of class 1 being a near miss; drop the CE term and the student trusts the teacher even when the teacher is wrong.`,
          },
          {
            kind: 'prose',
            heading: 'Why temperature — flattening the distribution to expose the structure',
            body: `Temperature is the single knob that turns distillation from a re-run of cross-entropy into something genuinely different. The softmax with temperature is

\\[
p_i(T) = \\frac{\\exp(z_i / T)}{\\sum_j \\exp(z_j / T)}
\\]

Three regimes are worth memorising. **At \\(T = 1\\)** you get the usual softmax; if the teacher is confident the soft distribution looks almost like a one-hot vector and the student gets very little extra signal beyond what the hard label gave it. **At \\(T \\to \\infty\\)** the distribution collapses to uniform; every class looks equally likely and the dark knowledge is gone. **At \\(T\\) in the sweet spot — typically 2 to 5 —** the peaks remain peaks but the tails inflate, and the relative ratios between non-peak classes become large enough that the student’s KL gradient can actually move them.

Pictorially: \\(T\\) is the spread of the distribution along the probability simplex. Crank \\(T\\) up and the teacher’s point in the simplex drifts toward the centroid — the same answer, but with all the runner-up information visible. Crank \\(T\\) down and the teacher’s point snaps to a corner, indistinguishable from the hard label. The student learns from whatever shape is on offer, which is why a wrong \\(T\\) silently kills distillation: too high and you are matching uniform-with-noise, too low and you have re-derived hard-label training with extra steps.

Hinton’s practical recipe: try \\(T \\in \\{2, 4, 8\\}\\) with the \\(T^2\\) loss rescaling, pick the one that gives the best held-out accuracy. For image classification \\(T = 4\\) is a defensible default; for language models with much larger vocabularies, \\(T = 2\\) is usually enough because the logit scale is already larger.`,
          },
          {
            kind: 'code',
            language: 'python',
            heading: 'Distillation loss in PyTorch',
            body: `import torch
import torch.nn.functional as F

def distillation_loss(student_logits, teacher_logits, labels, T=4.0, alpha=0.7):
    soft_targets = F.softmax(teacher_logits / T, dim=-1)
    soft_pred    = F.log_softmax(student_logits / T, dim=-1)
    kl = F.kl_div(soft_pred, soft_targets, reduction="batchmean") * (T * T)

    ce = F.cross_entropy(student_logits, labels)

    return alpha * kl + (1.0 - alpha) * ce

# Typical training step
teacher.eval()
with torch.no_grad():
    teacher_logits = teacher(x)

student_logits = student(x)
loss = distillation_loss(student_logits, teacher_logits, y, T=4.0, alpha=0.7)
loss.backward()
optimizer.step()`,
          },
          {
            kind: 'callout',
            tone: 'tip',
            body: `**\`teacher.eval()\` and \`torch.no_grad()\` are not optional.** The teacher is a frozen reference; if it is in training mode its dropout and batch-norm running stats will drift every step, and if you forget \`torch.no_grad()\` you will allocate a full backward graph through a model whose gradients you will never use. The *Backprop* lesson covered the same pattern from the autograd side — use \`detach\` or \`no_grad\` whenever you want a value but not its history.`,
          },
          {
            kind: 'prose',
            heading: 'Common pitfalls',
            body: `Distillation looks like cross-entropy and acts like cross-entropy, which is exactly why it goes wrong in subtle ways. The four failure modes below cover most of the bugs in real distillation runs.`,
          },
          {
            kind: 'callout',
            tone: 'note',
            body: `**Pitfall 1 — \\(T\\) too high.** Raising the temperature past the useful range pushes \\(p^T\\) toward uniform; the student’s KL gradient now points at "every class is equally likely" plus a small perturbation. The student’s peak softens toward the centroid, held-out accuracy drops, and looking at the soft loss alone you would think training was going fine because the KL number is small. Fix: sweep \\(T \\in \\{1, 2, 4, 8\\}\\) at fixed \\(\\alpha\\) and pick on validation accuracy, not training loss.

**Pitfall 2 — \\(\\alpha\\) miscalibrated.** \\(\\alpha\\) too high makes the student copy the teacher’s mistakes verbatim and inherit any calibration issues the teacher has. \\(\\alpha\\) too low collapses to hard-label training, throwing away the dark knowledge that was the whole point. A safe default is \\(\\alpha = 0.7\\) when the teacher is much stronger than the student; drop to \\(\\alpha = 0.5\\) when teacher and student are close in capacity and you trust the labels.

**Pitfall 3 — the teacher is overconfident.** A teacher trained with no label smoothing on clean labels often outputs \\(p^T_i > 0.99\\) on its top class even at \\(T = 4\\). The "soft" distribution is then almost one-hot and distillation collapses to a noisy version of hard-label training. Fix: train the teacher with label smoothing, raise \\(T\\) further, or distill from an ensemble whose averaged logits are naturally flatter.

**Pitfall 4 — student capacity mismatch.** A student that is too small (less than ~10% of the teacher’s parameter count) cannot represent the teacher’s function class, and no amount of soft labels will close the gap. A student that is too large is wasting capacity and would have done better with plain supervised training. The DistilBERT recipe — cut depth in half, keep width — was chosen because halving depth halves latency on the dominant attention cost while leaving enough capacity for the teacher’s representations to survive.`,
          },
          {
            kind: 'prose',
            heading: 'Variants — where the field went after Hinton',
            body: `The 2015 loss matches output distributions. Almost every subsequent variant matches *more* of the teacher’s internals. **Feature distillation** (FitNets, Romero et al. 2014) adds an MSE penalty between an intermediate teacher layer and a projected student layer, so the student’s representations are pulled toward the teacher’s and not just its outputs. **Attention transfer** (Zagoruyko & Komodakis 2017) matches the spatial attention maps of teacher and student CNNs, which preserves where in the input the model is looking. **Patient knowledge distillation** (Sun et al. 2019) distils from every transformer layer of BERT into the corresponding student layer, not just the final one — the source of DistilBERT’s strong GLUE numbers.

In LLM-land the same idea drives current frontier model compression. **Sequence-level distillation** for translation and summarisation has the student match the teacher’s decoded sequence, not just per-token logits. **Self-distillation** (a model distils into a fresh copy of itself, sometimes repeatedly) gives a free 1–2 point bump on language and vision benchmarks with no architecture change. **RLHF-as-distillation** views supervised fine-tuning on outputs from a reward-tuned teacher as plain distillation with the teacher’s logits; this is essentially how Alpaca, Vicuna, and most early open-source instruction-tuned LLaMAs were built. Across all of these the underlying signal is the same one Hinton named: the teacher’s soft outputs encode more than the labels do, and the student’s job is to inherit that structure.`,
          },
          {
            kind: 'prose',
            heading: 'What to take away',
            body: `Hard labels are corners of the probability simplex; soft labels from a trained teacher are points inside it, and the location encodes a similarity structure the teacher spent its entire training run discovering. Knowledge distillation lets a small student inherit that structure for free by matching a temperature-softened version of the teacher’s distribution while staying anchored to the true label through a smaller cross-entropy term. The loss \\(\\mathcal{L} = \\alpha T^2 \\mathrm{KL}(p^T \\| p^S) + (1 - \\alpha) \\mathrm{CE}(y, p^S)\\) is two lines of PyTorch and the dominant compression technique behind every "smaller, faster" production model since 2019.

Temperature controls how much dark knowledge is visible, \\(\\alpha\\) controls how much of it the student trusts, and the student’s capacity decides how much it can absorb. Get any of the three wrong and distillation degenerates: too-high \\(T\\) bleaches the signal, too-high \\(\\alpha\\) copies the teacher’s mistakes, too-small a student cannot represent the function at all. Pair distillation with quantisation and pruning when a model has to ship, and pair it with LoRA on the *teacher* when you cannot afford to retrain the full teacher per task. The earlier lessons on *Attention*, *LoRA*, and *Cross-entropy* are the prerequisites; this lesson is the bridge from "I have trained a giant model" to "I can serve a useful fraction of it on a phone".`,
          },
          {
            kind: 'prose',
            heading: 'Further reading',
            body: `- [Hinton, Vinyals & Dean — "Distilling the Knowledge in a Neural Network" (2015)](https://arxiv.org/abs/1503.02531) — the original paper; the temperature, the \\(T^2\\) scaling, and the dark-knowledge intuition all come from here.
- [Sanh et al. — DistilBERT paper (2019)](https://arxiv.org/abs/1910.01108) — the production-grade application that put distillation on every LLM serving roadmap; 40% smaller, 60% faster, 97% of BERT’s GLUE score.
- [Victor Sanh — "Smaller, faster, cheaper, lighter: introducing DistilBERT"](https://medium.com/huggingface/distilbert-8cf3380435b5) — the author’s own blog walkthrough of the DistilBERT recipe, including the soft-target loss, the cosine embedding loss, and the layer-init trick.`,
          },
        ],
      },
      {
        slug: 'generative-models',
        title: 'Generative models',
        oneLiner: 'GANs, VAEs, diffusion — three ways to learn to generate.',
        difficulty: 'intermediate',
        readMinutes: 11,
        sections: [
          {
            kind: 'prose',
            heading: 'What "generative" actually means',
            body: `A classifier learns \\(p(y \\mid x)\\) — given an image, what label. A **generative model** learns \\(p(x)\\) directly — given nothing, produce a sample that looks like it came from the data distribution. No conditioning, no label, just *make a new image that could have been in the training set*. This is a strictly harder problem. Telling a cat from a dog is a one-bit decision; drawing a cat from scratch is choosing one of \\(256^{3 \\cdot 1024 \\cdot 1024}\\) possible RGB images and landing on one that a human would call a cat.

Three families of models solved this problem at different times, with three very different mechanisms. **GANs** train two networks to fight each other until the generator's outputs are indistinguishable from real data. **VAEs** wrap an *Autoencoder* (from the earlier lesson) in a probabilistic shell so the latent space becomes sampleable. **Diffusion models** train a network to denoise corrupted data, then run that denoiser backwards from pure noise. Each one trades off sample quality, training stability, latent-space structure, and inference cost in a different way, and the choice between them is the choice that drives every modern image, audio, and video generator.

This lesson is the boundary between the *Attention* / *Positional encoding* lessons and how those ingredients show up in actual generative systems — Stable Diffusion's UNet, DALL-E's transformer prior, MusicLM's autoregressive head. The transformer architecture from the previous lessons is, in modern systems, almost always wrapped inside one of the three frames covered here.`,
          },
          {
            kind: 'prose',
            heading: 'The four flavors',
            body: `A generative model is any system that learns to produce *new* samples that look like they came from the training set — not classify, not regress, not summarise, but *invent*. The output distribution it learns should be statistically indistinguishable from the data distribution. Four families dominate the modern landscape, and each one makes a different bet about how to learn \\(p(x)\\).

**GANs (Generative Adversarial Networks)** pit a generator against a discriminator in a minimax game. Inference is fast — one forward pass through \\(G\\) and a sample is out — and the samples are typically *sharp* because \\(G\\) is rewarded for committing rather than averaging. The cost is training stability: the two-player game is delicate, and the generator is prone to **mode collapse**, where it locks onto a small handful of outputs that consistently fool \\(D\\) and ignores the rest of the data distribution.

**VAEs (Variational Autoencoders)** wrap an encoder–decoder pair in a probabilistic shell. The encoder predicts a Gaussian over latents \\(z\\); the decoder reconstructs \\(x\\) from a sampled \\(z\\); a KL term pulls the encoder's posterior towards the standard-normal prior. Training is *stable* — there is a single coherent loss with a closed-form gradient — and the latent space is genuinely sampleable. The downside: averaging over the Gaussian posterior smooths fine detail, so samples come out *blurry*.

**Autoregressive models** factor \\(p(x) = \\prod_i p(x_i \\mid x_{<i})\\) and predict one element at a time. PixelCNN does this for pixels; GPT does it for tokens; WaveNet for raw audio. Quality is *high* and likelihood is exact, but inference is *slow* — generating an image at 1024×1024 means a million sequential forward passes, and you cannot parallelise over the spatial dimension at sampling time.

**Diffusion models** train a denoiser to invert a fixed noise-corruption process. They currently produce the *highest quality and most diverse* samples — Stable Diffusion, Imagen, DALL-E 3 are all diffusion — but they are also the *slowest* to sample from, requiring tens to thousands of denoiser passes per image (mitigated by DDIM, consistency models, distillation, but never reduced to a single step without a quality hit).

A useful mental ranking: GAN is fast + sharp + unstable; VAE is stable + structured + blurry; autoregressive is high-quality + likelihood-exact + sequential; diffusion is highest-quality + diverse + expensive. Modern systems mix and match — Stable Diffusion runs diffusion in the *latent space* of a VAE, getting VAE's compression on top of diffusion's sample quality.`,
          },
          {
            kind: 'prose',
            heading: 'Worked: GAN minimax game',
            body: `Make the GAN loss concrete by computing it on real numbers. The discriminator's loss, written as an expectation, is

\\[
\\mathcal{L}_D = -\\, \\mathbb{E}_{x \\sim p_{\\text{data}}}[\\log D(x)] \\;-\\; \\mathbb{E}_{z \\sim p_z}[\\log(1 - D(G(z)))]
\\]

so \\(D\\) is *minimising* the negation of the minimax objective — i.e., maximising \\(\\log D(x_{\\text{real}}) + \\log(1 - D(G(z)))\\). The generator, in the non-saturating form, minimises \\(-\\log D(G(z))\\), pushing \\(D(G(z))\\) towards 1. At the game's Nash equilibrium, when \\(G\\)'s output distribution exactly matches the data distribution, the discriminator cannot do better than chance and outputs \\(D(x) = 0.5\\) for every input — real or fake.

**A worked step.** Suppose at some point during training the discriminator scores a real example at \\(D(x_{\\text{real}}) = 0.9\\) and a generated example at \\(D(G(z)) = 0.2\\). Compute each term of \\(\\mathcal{L}_D\\):

- Real-term contribution: \\(-\\log D(x_{\\text{real}}) = -\\log(0.9) \\approx 0.105\\).
- Fake-term contribution: \\(-\\log(1 - D(G(z))) = -\\log(1 - 0.2) = -\\log(0.8) \\approx 0.223\\).
- Total discriminator loss on this pair: \\(0.105 + 0.223 = 0.328\\).

Read off what the gradient will do. The real-term penalty (0.105) is *small* — \\(D\\) is already close to 1 on the real example, so there is little gradient asking it to push higher. The fake-term penalty (0.223) is *larger* — \\(D\\) is outputting 0.2 on the fake, but the optimum is 0, so the gradient pushes \\(D(G(z))\\) further down. Net effect of this step: \\(D\\) becomes slightly more confident on reals, noticeably less fooled by fakes.

Meanwhile the generator sees \\(D(G(z)) = 0.2\\) and computes \\(\\mathcal{L}_G = -\\log 0.2 \\approx 1.609\\) — a large penalty. Its gradient pushes the generator's parameters to produce samples that \\(D\\) will rate higher. Both players move in the same step, and the loss numbers oscillate as the game plays out.`,
          },
          {
            kind: 'prose',
            heading: 'Why mode collapse',
            body: `Mode collapse is the most famous failure of GANs and it has a clean explanation. The generator's objective rewards *any* output that fools the discriminator. There is no term anywhere in \\(\\mathcal{L}_G\\) that says "cover the full data distribution" or "produce diverse samples". So if \\(G\\) stumbles onto one output — say, a single very convincing digit-3 image — that consistently scores high under \\(D\\), the gradient asks \\(G\\) to produce *more* of that same output, regardless of the input noise \\(z\\). The mapping \\(z \\mapsto G(z)\\) collapses to a near-constant function: every \\(z\\) routes to the same image.

The discriminator does notice — eventually it starts rating that one image as fake, because it sees it too often. But by the time \\(D\\) catches up, \\(G\\) has already abandoned the rest of the data manifold and only knows how to produce that one mode. \\(G\\) then jumps to a different single-output equilibrium, \\(D\\) catches up, and the cycle repeats. The samples *look* fine in isolation; the failure only shows up when you sample many and notice they are nearly identical.

**Fixes that actually work.** **Wasserstein GAN** replaces the JS-divergence objective with the Earth-Mover distance, which gives meaningful gradients even when \\(G\\)'s distribution and the data distribution have disjoint support — the regime where vanilla GANs go silent. **Spectral normalisation** caps the Lipschitz constant of \\(D\\)'s layers, preventing \\(D\\) from becoming a near-step-function whose gradients vanish away from the decision boundary. **Mini-batch discrimination** lets \\(D\\) see statistics across a whole batch — if every sample in the batch is the same image, \\(D\\) can flag the batch as fake regardless of individual quality, directly punishing collapse.

VAEs do not suffer mode collapse for a structural reason. The KL term in the ELBO forces \\(q_\\phi(z \\mid x)\\) towards \\(\\mathcal{N}(0, I)\\), so the *aggregate* distribution of latent codes ends up covering the prior. Different training examples are pulled to different regions of latent space, and the decoder is trained to reconstruct every one. No single decoder output can dominate, because the reconstruction loss explicitly penalises ignoring \\(x\\).`,
          },
          {
            kind: 'prose',
            heading: 'GANs — generator vs discriminator',
            body: `Goodfellow et al. (2014) framed generation as a two-player game. A **generator** \\(G_\\theta\\) takes random noise \\(z \\sim \\mathcal{N}(0, I)\\) and outputs a candidate sample \\(G(z)\\). A **discriminator** \\(D_\\phi\\) takes a sample — either a real one from the dataset or a fake one from \\(G\\) — and outputs the probability that it is real. The two networks have opposing objectives. The discriminator wants to assign 1 to real samples and 0 to generated ones; the generator wants the discriminator to assign 1 to its outputs. They are trained alternately: one step of \\(D\\) to push its accuracy up, one step of \\(G\\) to push its samples past \\(D\\)'s current decision boundary, repeat.

At convergence — if it ever reaches one — the discriminator cannot tell real from fake better than chance, which means \\(G\\)'s output distribution has matched the data distribution. In practice the game rarely converges cleanly: \\(D\\) might get too strong (\\(G\\) sees a zero gradient and stops learning), or \\(G\\) might collapse onto a single high-quality output that always fools \\(D\\) (mode collapse). The history of GAN research is mostly the history of stabilising this game — Wasserstein distance, spectral normalisation, gradient penalties, two-timescale update rules.

When it works, the samples are *sharp*. GANs do not average over possibilities — they pick one and commit. That is why a well-trained StyleGAN produces faces that are crisp at every pixel, while a VAE of the same capacity produces faces that look slightly blurred. The flip side is that nothing in the GAN training objective gives you a tractable density, an encoder, or a structured latent space. You can sample, but you cannot easily ask "how likely is this real image under my model?" or "what latent code produced this image?"`,
          },
          {
            kind: 'viz',
            component: 'GANLoopViz',
            props: {},
            heading: 'The adversarial loop',
            caption: 'Step training one sub-iteration at a time: G produces samples, D classifies, losses fire, both players update.',
          },
          {
            kind: 'math',
            heading: 'The minimax objective',
            body: `The original GAN loss writes the two players' goals as a single minimax problem:

\\[
\\min_G \\, \\max_D \\;\\; \\mathbb{E}_{x \\sim p_{\\text{data}}}[\\log D(x)] + \\mathbb{E}_{z \\sim p_z}[\\log(1 - D(G(z)))]
\\]

Read it slowly. The inner max wants \\(D\\) to output 1 on real samples (push the first term up) and 0 on generated samples (push \\(1 - D(G(z))\\) up). The outer min wants \\(G\\) to choose outputs so that \\(D(G(z))\\) is close to 1 (push \\(1 - D(G(z))\\) down). Each player only controls one network's parameters; gradients flow through \\(D\\) when updating \\(G\\) (because \\(G\\) only sees the world via \\(D\\)'s score), which is why \\(D\\) being too strong or too weak both break training.

In practice the generator is trained with the **non-saturating** form \\(-\\log D(G(z))\\) instead of \\(\\log(1 - D(G(z)))\\). Algebraically they have the same minimum, but the original form has near-zero gradient when \\(D(G(z))\\) is near 0 (which it is at the start of training), and the non-saturating form does not. This single change — Goodfellow et al. mention it as a footnote — is what made GANs trainable at all. Every modern GAN variant (WGAN, LSGAN, hinge-loss GAN) is a different choice of distance between distributions, but the alternating two-player structure is the constant.`,
          },
          {
            kind: 'code',
            language: 'python',
            heading: 'GAN training loop sketch',
            body: `# alternating D-step then G-step; standard non-saturating BCE losses
for real_x in dataloader:
    # ---- discriminator step ----
    z = torch.randn(batch, z_dim, device=device)
    fake_x = G(z).detach()                                   # detach: G isn't trained here
    d_real = D(real_x);  d_fake = D(fake_x)
    loss_D = bce(d_real, ones_like(d_real)) + bce(d_fake, zeros_like(d_fake))
    opt_D.zero_grad(); loss_D.backward(); opt_D.step()

    # ---- generator step ----
    z = torch.randn(batch, z_dim, device=device)
    d_fake = D(G(z))                                         # gradient flows back through D into G
    loss_G = bce(d_fake, ones_like(d_fake))                  # non-saturating: -log D(G(z))
    opt_G.zero_grad(); loss_G.backward(); opt_G.step()`,
          },
          {
            kind: 'callout',
            tone: 'tip',
            body: `**GAN training tricks that actually move the needle.** Label smoothing (use 0.9 instead of 1.0 as the real-label target so \\(D\\) cannot become arbitrarily confident). Spectral normalisation on \\(D\\)'s weights (caps the discriminator's Lipschitz constant so its gradients to \\(G\\) stay informative). Two-timescale update rule — Adam with \\(\\beta_1 = 0.5\\) for both and a slower learning rate on \\(D\\) than \\(G\\). Batch sizes large enough that \\(D\\) sees a representative mix of real and fake in every batch. None of these are tweaks; each one fixes a specific failure mode and skipping them is why so many first GAN experiments collapse on day one.`,
          },
          {
            kind: 'prose',
            heading: 'VAEs — autoencoders with a probabilistic spine',
            body: `The *Autoencoder* lesson trained \\(z = f_\\phi(x)\\) and \\(\\hat{x} = g_\\theta(z)\\) so that \\(\\hat{x} \\approx x\\). The latent code \\(z\\) was a single deterministic point — useful for compression, but no obvious way to *sample* from it. If you pick a random \\(z\\) and run the decoder, the output is usually garbage, because almost no point in latent space corresponds to a plausible image. The latent geometry was never constrained to be sampleable.

A **variational autoencoder** (Kingma & Welling, 2014) fixes this by making the encoder output a *distribution* over \\(z\\) instead of a single point. Specifically, the encoder predicts the mean \\(\\mu(x)\\) and log-variance \\(\\log \\sigma^2(x)\\) of a Gaussian, and the actual latent is drawn as \\(z = \\mu(x) + \\sigma(x) \\odot \\epsilon\\) with \\(\\epsilon \\sim \\mathcal{N}(0, I)\\) (the **reparameterisation trick**, which lets gradients flow through the sample). The decoder then reconstructs \\(x\\) from this sampled \\(z\\). To make the latent space sampleable, the training objective adds a second term that pulls every encoded distribution \\(q_\\phi(z \\mid x)\\) towards a standard normal \\(\\mathcal{N}(0, I)\\) — the **prior**. After training, you can draw \\(z \\sim \\mathcal{N}(0, I)\\), run the decoder, and get a coherent sample.

The samples are typically *blurry* — averaging over the Gaussian posterior smooths fine detail away — but the latent space is now genuinely structured. You can interpolate, you can do arithmetic in \\(z\\)-space, you can compute an exact-ish likelihood. VAEs are the model family that gave us latent-space face arithmetic ("man with glasses minus man plus woman = woman with glasses") and they remain the standard choice when you need both generation *and* a useful representation, especially when paired with discrete latents (VQ-VAE, the autoencoder under Stable Diffusion's pixel space).`,
          },
          {
            kind: 'viz',
            component: 'AutoencoderViz',
            props: {},
            heading: 'The architecture VAEs build on.',
          },
          {
            kind: 'math',
            heading: 'The ELBO — reconstruction plus KL',
            body: `VAEs are trained by maximising the **evidence lower bound** (ELBO) on the log-likelihood of the data. The derivation starts from \\(\\log p_\\theta(x)\\), introduces the encoder \\(q_\\phi(z \\mid x)\\) as a variational approximation to the true posterior \\(p_\\theta(z \\mid x)\\), and applies Jensen's inequality. What pops out is one of the cleanest objectives in deep learning:

\\[
\\mathcal{L}_{\\text{ELBO}}(x) = \\underbrace{\\mathbb{E}_{z \\sim q_\\phi(z \\mid x)}[\\log p_\\theta(x \\mid z)]}_{\\text{reconstruction}} \\;-\\; \\underbrace{D_{\\text{KL}}\\big( q_\\phi(z \\mid x) \\,\\|\\, p(z) \\big)}_{\\text{regulariser}}
\\]

The **reconstruction term** is exactly the autoencoder loss — the negative MSE or BCE between \\(x\\) and the decoder's output, given a sampled \\(z\\). The **KL term** is the divergence between the encoder's posterior \\(\\mathcal{N}(\\mu(x), \\sigma^2(x))\\) and the standard-normal prior. For two diagonal Gaussians this has a closed form: \\(D_{\\text{KL}} = \\tfrac{1}{2} \\sum_j (\\mu_j^2 + \\sigma_j^2 - 1 - \\log \\sigma_j^2)\\) — no Monte Carlo needed.

Maximising the ELBO trades off two pressures. The reconstruction term wants \\(q_\\phi(z \\mid x)\\) to be tight and informative about \\(x\\). The KL term wants it to look like the prior. The balance is the whole game: too much weight on KL and the encoder collapses (it ignores \\(x\\), outputs the prior, and the decoder learns nothing — **posterior collapse**). Too little, and the latent space is no longer sampleable. Frameworks like \\(\\beta\\)-VAE expose this trade-off as a hyperparameter \\(\\beta\\) on the KL term and use it to encourage disentanglement.`,
          },
          {
            kind: 'prose',
            heading: 'Diffusion — destroy then learn to rebuild',
            body: `**Diffusion models** (Ho et al., 2020) take a different route entirely. Instead of training a generator to produce samples in one shot, they train a network to *denoise* slightly. The trick: define a fixed **forward process** that takes a clean image \\(x_0\\) and progressively adds Gaussian noise over \\(T\\) steps until it is indistinguishable from pure noise \\(x_T \\sim \\mathcal{N}(0, I)\\). This forward process has no learnable parameters — it is a deterministic recipe. Then train a single neural net \\(\\epsilon_\\theta(x_t, t)\\) to predict the noise that was added at step \\(t\\), given the noisy image and the timestep. To generate, sample \\(x_T\\) from pure noise and run the learned denoiser backwards \\(T\\) times.

This decomposition turns generation into a sequence of small, well-conditioned regression problems. Predicting "what noise was added in step 873 of 1000" is a much easier task than "draw a cat from scratch", and modelling it well is enough — the chain of small denoising steps composes into a powerful generator. The architecture inside \\(\\epsilon_\\theta\\) is usually a U-Net with attention layers at the deeper resolutions (every modern diffusion model is exactly this, including Stable Diffusion, Imagen, and SDXL). The transformer block from the *Attention* lesson lives inside the U-Net at every coarse scale.

The two original samplers are **DDPM** (stochastic, follows the reverse-noise process exactly, 1000 steps) and **DDIM** (deterministic, skips most steps, 20-50 steps for similar quality). The DDIM paper showed you can run the same trained network on a much shorter denoising trajectory and still get coherent samples — the *training* uses many steps for good gradient signal, but *inference* does not have to. Every modern fast diffusion sampler (DPM-Solver, k-LMS, Euler-a, the distilled one-step models) is a different choice of how to compress the reverse trajectory.`,
          },
          {
            kind: 'math',
            heading: 'The forward noise process',
            body: `The forward process is defined by a variance schedule \\(\\beta_1, \\beta_2, \\ldots, \\beta_T\\), small numbers that grow with \\(t\\). At each step, mix in a little Gaussian noise:

\\[
q(x_t \\mid x_{t-1}) = \\mathcal{N}\\big( x_t;\\; \\sqrt{1 - \\beta_t}\\, x_{t-1},\\; \\beta_t I \\big)
\\]

Because each step is Gaussian and linear in \\(x_{t-1}\\), the marginal distribution at any time \\(t\\) has a closed form. With \\(\\alpha_t = 1 - \\beta_t\\) and \\(\\bar\\alpha_t = \\prod_{s=1}^t \\alpha_s\\):

\\[
q(x_t \\mid x_0) = \\mathcal{N}\\big( x_t;\\; \\sqrt{\\bar\\alpha_t}\\, x_0,\\; (1 - \\bar\\alpha_t) I \\big) \\quad\\Longleftrightarrow\\quad x_t = \\sqrt{\\bar\\alpha_t}\\, x_0 + \\sqrt{1 - \\bar\\alpha_t}\\, \\epsilon, \\;\\; \\epsilon \\sim \\mathcal{N}(0, I)
\\]

This is the key practical fact: you do **not** simulate the noise chain step by step during training. To get a training example at step \\(t\\), sample a clean image, sample a random timestep, sample one Gaussian noise vector, and combine them with the closed form above. The loss is then the simple regression \\(\\| \\epsilon - \\epsilon_\\theta(x_t, t) \\|^2\\) — predict the noise you just added. As \\(\\bar\\alpha_t \\to 0\\), the image becomes pure noise; as \\(\\bar\\alpha_t \\to 1\\) (small \\(t\\)) the image is barely corrupted. The network learns a single denoiser that handles every noise level.`,
          },
          {
            kind: 'callout',
            tone: 'note',
            body: `**Diffusion's wall is inference cost.** A DDPM with the original schedule runs the U-Net 1000 times per sample. DDIM cuts that to 50 with negligible quality loss, modern solvers cut it to 20, and distilled one-step models (consistency models, progressive distillation) cut it to 1-4 — but each step still requires a forward pass through a network that is often hundreds of millions of parameters. A GAN samples in one forward pass; a VAE samples in one forward pass; diffusion needs many. This is why GANs still get used for realtime applications (StyleGAN-T, video-game asset generators) even though diffusion has higher peak quality.`,
          },
          {
            kind: 'prose',
            heading: 'Conditional generation and text-to-image',
            body: `All three families extend to **conditional generation** \\(p(x \\mid c)\\) — generate samples conditioned on some context \\(c\\), like a class label or a text prompt. Conditional GANs feed \\(c\\) into both \\(G\\) and \\(D\\); conditional VAEs concatenate \\(c\\) to the encoder and decoder inputs; conditional diffusion concatenates \\(c\\) (or attends to it) inside \\(\\epsilon_\\theta\\). The math barely changes; the conditioning is just another input.

The blow-up moment was text-to-image. Encode the text prompt with a frozen language model (CLIP's text encoder in Stable Diffusion, T5 in Imagen, the model's own text tower in DALL-E 3) into a sequence of token embeddings, then attend to those embeddings from inside the U-Net using **cross-attention** layers. This is the same scaled-dot-product attention from the *Attention* lesson, except the queries come from image features and the keys/values come from text embeddings. The model learns that "a fluffy red dog on a skateboard" lights up a particular set of attention patterns, and those patterns steer the denoising trajectory towards images that satisfy the text.

The other piece that made text-to-image actually work was **classifier-free guidance**: at training time, randomly drop the text condition some fraction of the time (typically 10%) so the same network learns both \\(\\epsilon_\\theta(x_t, t, c)\\) and the unconditional \\(\\epsilon_\\theta(x_t, t, \\emptyset)\\). At inference, combine them: \\(\\hat\\epsilon = \\epsilon_\\theta(x_t, t, \\emptyset) + w \\cdot (\\epsilon_\\theta(x_t, t, c) - \\epsilon_\\theta(x_t, t, \\emptyset))\\) with guidance scale \\(w > 1\\). Higher \\(w\\) follows the prompt more aggressively at the cost of diversity. Every modern text-to-image model exposes this dial — it is the single most user-visible hyperparameter at inference time.`,
          },
          {
            kind: 'prose',
            heading: 'Latent-space arithmetic and interpolation',
            body: `One unexpected reward of generative models is that the latent space carries structure you can manipulate. In a VAE or a well-trained GAN, the mapping from \\(z\\) to image is smooth enough that *interpolating* between two latents \\(z_1\\) and \\(z_2\\) along a line \\(z_t = (1-t) z_1 + t z_2\\) produces a smooth morph between the corresponding images — not a pixel-wise crossfade but a semantically meaningful blend, like a face slowly turning from one identity into another.

Even more, you can do **arithmetic**. Encode many images of men, average their latents to get \\(z_{\\text{man}}\\); same for women; same for "smiling" vs "neutral". Then \\(z_{\\text{man, smiling}} - z_{\\text{man}} + z_{\\text{woman}}\\) decodes to a smiling woman. This works because the encoder has learned an approximately *disentangled* coordinate system where individual axes (or learned directions) correspond to interpretable factors. It was the headline finding of the early DCGAN paper and remains the cleanest demonstration that these models learn structure, not just memorise pixels.

For diffusion the picture is slightly different — there is no single latent \\(z\\) per sample, but there is an analogous structure in the noise vector that seeded the reverse process. DDIM, being deterministic, makes the noise-to-image map a function you can interpolate through. Stable Diffusion's "img2img" and "inpainting" are exactly this: run the forward process partway on an existing image, then run the reverse process from there, optionally with a different prompt. The same latent geometry that gave VAEs interpolation lives inside diffusion's noise schedule.`,
          },
          {
            kind: 'prose',
            heading: 'Failure modes worth memorising',
            body: `Each family has a signature failure that you will see if you train one yourself.

**Mode collapse (GANs).** The generator finds a small set of outputs that reliably fool the current discriminator and stops exploring. Sample diversity collapses — you can draw 10000 latents and get back the same 5 images. The discriminator never gets the signal to push back because every generated batch looks identical and \\(D\\) has nothing to compare against. Fixes: minibatch discrimination (give \\(D\\) batches not single samples so it can detect lack of variety), unrolled GANs (let \\(G\\) see several future \\(D\\) updates), Wasserstein loss with gradient penalty.

**Posterior collapse (VAEs).** The KL term wins. The encoder outputs \\(\\mathcal{N}(0, I)\\) regardless of \\(x\\), the latent carries zero information, and the decoder learns to ignore \\(z\\) entirely (often by becoming powerful enough to model the data marginal on its own). Reconstructions look mean-image; samples look the same. Fixes: KL annealing (start with KL weight 0 and ramp it up over training), free bits (cap the KL of each latent dimension at a small floor so the model is forced to use it), \\(\\beta\\)-VAE with \\(\\beta < 1\\).

**Diffusion's failure mode is less catastrophic but still real.** The denoiser can be miscalibrated at certain noise levels — typically very small or very large \\(t\\) — producing samples that look fine globally but have unnatural high-frequency texture. The fix is almost always a better noise schedule (cosine instead of linear, or zero-SNR shifted schedules) or a different parameterisation (predict \\(x_0\\) directly instead of \\(\\epsilon\\) at high noise levels, "v-prediction").`,
          },
          {
            kind: 'prose',
            heading: 'Comparing the three',
            body: `A summary of the trade-offs that decides which family to reach for.

**GANs** — sharpest samples, fastest inference (one forward pass), no tractable density, no encoder, finicky training, prone to mode collapse. Best when you need realtime generation of a narrow domain (faces, anime, specific art styles), and you have engineering budget for the training run. StyleGAN3 remains the SOTA single-domain image generator on speed.

**VAEs** — blurrier samples, structured latent space, fastest inference, tractable likelihood lower bound, stable training, well-defined encoder for downstream tasks. Best when you need an encoder *and* a generator, especially for representation learning. Modern usage is overwhelmingly as a *component* of larger systems — the encoder in Stable Diffusion's latent space, the speech tokeniser in VALL-E, the discrete codebook in VQ-VAE-based language-on-image models.

**Diffusion** — best peak sample quality across nearly every modern benchmark, expensive multi-step inference, very stable training (just a regression loss), no encoder, no tractable density but an excellent score estimate. Best when quality is the only thing that matters. Every state-of-the-art text-to-image, text-to-video, text-to-audio, and protein-structure model in 2025 is a diffusion model — usually with a transformer inside the denoiser.

In practice these no longer compete in isolation: Stable Diffusion runs diffusion *inside the latent space of a VAE*, getting the VAE's compression and the diffusion's quality together; consistency models distill a multi-step diffusion sampler into a one-step GAN-like generator. The three families have become a vocabulary of components rather than three rival product lines.`,
          },
          {
            kind: 'prose',
            heading: 'What to take away',
            body: `Generation is harder than classification, and the field solved it three times in three different ways. GANs cast it as a two-player game; the minimax objective produces sharp samples at the cost of training stability. VAEs wrap an *Autoencoder* in a probabilistic shell with an ELBO that combines reconstruction error and KL to a prior; you get a structured, sampleable latent space and slightly blurry samples. Diffusion models define a fixed forward noise process and train a denoiser to reverse it; you trade inference speed for the highest peak quality the field has ever seen.

Conditional versions of all three exist, and text-to-image is the killer application: a frozen language model encodes the prompt, cross-attention layers (built from the same scaled-dot-product attention as the *Attention* lesson) inject it into the generator, and classifier-free guidance dials up prompt adherence at inference time. Latent-space arithmetic, interpolation, and image-to-image edits all come from the smooth geometry these models impose on their latents — first surfaced in GAN and VAE work, alive today in DDIM's deterministic trajectories.

The three failure modes — mode collapse, posterior collapse, miscalibrated denoising — are signatures, not symptoms. If you see them, you know which family you are in and roughly what the fix looks like. And the modern systems on top of all this no longer pick one; Stable Diffusion is a diffusion model running in a VAE's latent space, consistency models distill diffusion samplers into near-one-step generators, and every flagship image system has a transformer block from the *Attention* lesson somewhere inside it. The three families became a vocabulary, and the next pillar will use that vocabulary as a black box.`,
          },
          {
            kind: 'prose',
            heading: 'Further reading',
            body: `- [Goodfellow et al. — GAN paper](https://arxiv.org/abs/1406.2661) — "Generative Adversarial Nets"; the 2014 paper that started one of the three families covered in this lesson.
- [Kingma & Welling — VAE paper](https://arxiv.org/abs/1312.6114) — "Auto-Encoding Variational Bayes"; the ELBO derivation and the reparameterisation trick.
- [Lilian Weng — "Flow-based Deep Generative Models"](https://lilianweng.github.io/posts/2018-10-13-flow-models/) — survey of the fourth family (normalising flows) and how it relates to GANs, VAEs, and diffusion.`,
          },
        ],
      },
    ],
  },
  architectures: {
    title: 'Generative Architectures',
    oneLiner: 'Diffusion, autoregressive, latent — the templates every modern generator stretches.',
    iconName: 'Brain',
    lessons: [
      {
        slug: 'diffusion-models',
        title: 'Diffusion models',
        oneLiner: 'Learn to reverse noise. The recipe behind Stable Diffusion, DALL-E, Sora.',
        difficulty: 'advanced',
        readMinutes: 11,
        sections: [
          {
            kind: 'prose',
            heading: 'The shape of the trick',
            body: `Diffusion models solve generation by refusing to attempt it in one shot. Instead of asking a network to map random noise straight to a photograph — the framing the *Generative models* lesson explored under GANs and VAEs — diffusion frames the same problem as a *thousand* much smaller problems: take an image that is *slightly* noisier than the answer, and predict the noise that was added. Compose a thousand of those small predictions and the noise turns into a picture.

The structural shift is what makes it work. A GAN's generator has to invent the entire output distribution from one forward pass; it can collapse onto a few modes and never recover. A VAE compresses to a latent and pays for that compression in blurry samples. A diffusion model never tries to model the full data distribution in a single step — it models the much easier conditional distribution \\(p(x_{t-1} \\mid x_t)\\) at every noise level, then chains those small steps together. The result is the cleanest training objective in modern generative modelling: predict noise with mean-squared error. No adversary. No KL trade-off. No mode collapse. Just regression, repeated.

Every flagship image, video, and audio generator in 2025 — Stable Diffusion, DALL-E 3, Sora, AudioLDM, Imagen Video — is a diffusion model wrapped around a U-Net or DiT backbone. That backbone is built from the residual blocks of *Residual connections*, the layer norms of *Batch normalization*, and the cross-attention layers of *Attention*. The diffusion frame sits on top of those primitives.`,
          },
          {
            kind: 'prose',
            heading: 'Forward noising — the easy part',
            body: `Start with the destruction half of the chain, because nothing here has to be learned. Pick a **noise schedule** — a fixed sequence of small positive numbers \\(\\beta_1, \\beta_2, \\ldots, \\beta_T\\) with values like \\(\\beta_1 = 0.0001\\) growing linearly to \\(\\beta_T = 0.02\\). These are not hyperparameters the network sees; they are constants baked into the recipe. From each \\(\\beta_t\\) define the per-step signal coefficient \\(\\alpha_t = 1 - \\beta_t\\) and the cumulative product \\(\\bar\\alpha_t = \\prod_{s=1}^{t} \\alpha_s\\). Both are deterministic functions of the schedule — precomputed once and looked up by index.

The single equation that runs the entire forward process is

\\[
x_t = \\sqrt{\\bar\\alpha_t}\\, x_0 + \\sqrt{1 - \\bar\\alpha_t}\\, \\epsilon, \\qquad \\epsilon \\sim \\mathcal{N}(0, I)
\\]

Read it endpoint by endpoint. At \\(t = 0\\), \\(\\bar\\alpha_0 = 1\\), so \\(x_0\\) is literally the original image — the square-root-of-one coefficient is the identity and the noise term vanishes. At \\(t = T\\) with \\(T = 1000\\) and the default schedule, the cumulative product \\(\\bar\\alpha_T\\) collapses to roughly \\(4 \\times 10^{-5}\\) — close enough to zero that the image term is wiped out and \\(x_T \\approx \\epsilon\\), a sample from a standard Gaussian. Every intermediate \\(t\\) is a convex-ish mixture of the clean image and pure noise, with the mixture coefficient set by \\(\\bar\\alpha_t\\).

The reason this matters is the word *directly*. Nothing about that equation says "iterate". To produce \\(x_{500}\\) from \\(x_0\\), the recipe does not simulate 500 noise-injection steps — it draws one Gaussian \\(\\epsilon\\), looks up \\(\\bar\\alpha_{500}\\), and computes the answer in one multiplication. That is the gift of the Gaussian closure property: every forward step is linear in \\(x_{t-1}\\) with Gaussian noise, so the marginal at step \\(t\\) is itself Gaussian with a closed-form mean \\(\\sqrt{\\bar\\alpha_t}\\, x_0\\) and variance \\((1 - \\bar\\alpha_t)\\, I\\). Training will need noisy samples at uniformly random timesteps, and this property turns each one into a single matmul instead of a thousand-step roll-out.`,
          },
          {
            kind: 'prose',
            heading: 'Reverse process — the hard part',
            body: `Now run the chain backwards. Given a noisy \\(x_t\\), the task is to step back to \\(x_{t-1}\\) — a slightly cleaner image. The true reverse conditional \\(p(x_{t-1} \\mid x_t)\\) is the object every generator would love to have in closed form. It does not exist in closed form. It depends on the data distribution \\(p(x_0)\\) being modelled, which is exactly the thing the diffusion model is being built to learn. The forward direction was tractable because Gaussians compose with Gaussians; the reverse direction is not, because conditioning a Gaussian on a sample from an unknown distribution is not a Gaussian.

The DDPM trick is to approximate it. For small enough \\(\\beta_t\\), the true reverse step is *approximately* Gaussian, and its mean is determined by the noise \\(\\epsilon\\) that was added at the forward step. So instead of trying to model \\(p(x_{t-1} \\mid x_t)\\) directly, the network is trained to predict that noise. One neural network \\(\\epsilon_\\theta(x_t, t)\\) — shared across all timesteps — receives the noisy image and the timestep index, and outputs an estimate of the \\(\\epsilon\\) used to corrupt it. The training loss is plain mean-squared error against random timesteps and random noise vectors:

\\[
\\mathcal{L}(\\theta) = \\mathbb{E}_{x_0,\\, t,\\, \\epsilon} \\Big[\\, \\big\\| \\epsilon - \\epsilon_\\theta(x_t,\\, t) \\big\\|^2 \\,\\Big]
\\]

That is the entire objective. No adversary, no KL term, no reparameterised lower bound — just regression on noise.

Once the network is trained, inference is a denoising loop. Sample \\(x_T \\sim \\mathcal{N}(0, I)\\). For \\(t = T, T-1, \\ldots, 1\\), call the network to estimate the noise, subtract a scaled version of it from the current sample, and add a small fresh Gaussian \\(z\\) for stochasticity:

\\[
x_{t-1} = \\frac{1}{\\sqrt{\\alpha_t}} \\left( x_t - \\frac{\\beta_t}{\\sqrt{1 - \\bar\\alpha_t}}\\, \\epsilon_\\theta(x_t, t) \\right) + \\sigma_t\\, z
\\]

Each step is a tiny refinement — peel off the network's estimate of the noise at this level, take one step down the chain, repeat. After \\(T\\) iterations, \\(x_0\\) is a sample from the learned distribution.`,
          },
          {
            kind: 'prose',
            heading: 'Why diffusion beat GANs',
            body: `The GAN recipe needs a tightrope-walk between two networks. The generator \\(G\\) tries to fool the discriminator \\(D\\); the discriminator tries to call out the generator. The training objective is a minimax game, and the gradients each side sees depend on how well the other is currently doing. Tilt the balance and training collapses — \\(D\\) overpowers \\(G\\) and the generator gradient vanishes, or \\(G\\) finds a mode \\(D\\) cannot distinguish and produces the same output forever. Every GAN paper before 2020 reads like a list of stabilisation tricks: spectral normalisation, gradient penalty, two timescales, careful initialisation.

Diffusion replaces the game with a single regression target. There is one network, one loss, no adversary. The network's job is "predict the noise that was added" — a supervised learning problem with the ground-truth label sitting right there in the training batch. Training is monotone, the loss curve descends, and there is no second player to balance against.

The structural reason diffusion produces better samples is the **step size**. A GAN's generator has to map a 100-dimensional noise vector straight to a 512×512 image in one forward pass — a single huge transformation that has to cover every mode of the distribution. A diffusion model breaks the same task into a thousand tiny denoising refinements, each conditioned on the current slightly-noisier draft. Each step is an easy regression problem; chained together, they compose into a powerful generator. A thousand small steps × a small change per step adds up to a higher-quality, more diverse sample than one giant leap.

The price is inference cost. A trained diffusion model needs hundreds to a thousand forward passes to draw one sample, where a GAN needs one. The fix is a stack of sampler tricks. **DDIM** runs the same trained network on a deterministic 20-50 step trajectory with no quality loss. **DPM-Solver** treats the reverse process as an ODE and uses higher-order integrators for 10-20 step sampling. **Latent diffusion** — the engine inside Stable Diffusion — moves the entire chain into the compressed latent space of a VAE, so 50 denoising steps run on a \\(64 \\times 64\\) latent instead of a \\(512 \\times 512\\) pixel grid, and the heavy decoder runs only once at the end.`,
          },
          {
            kind: 'prose',
            heading: 'The forward process — destroy the image on a fixed schedule',
            body: `The forward process is the part with no learnable parameters. Start from a clean image \\(x_0\\) drawn from your dataset. Pick a **variance schedule** \\(\\beta_1, \\beta_2, \\ldots, \\beta_T\\) — small positive numbers, growing slowly with \\(t\\). At each step, the next noisier image is a tiny mixing of the previous one with a fresh Gaussian draw:

\\[
q(x_t \\mid x_{t-1}) = \\mathcal{N}\\big( x_t;\\; \\sqrt{1 - \\beta_t}\\, x_{t-1},\\; \\beta_t I \\big)
\\]

Read that carefully. The mean is the previous image scaled down by \\(\\sqrt{1 - \\beta_t}\\) (slightly less than 1), and the covariance is \\(\\beta_t I\\) — diagonal Gaussian noise. After one step the image is barely different; after \\(T\\) steps (typically \\(T = 1000\\) for DDPM-style training) it is indistinguishable from a pure Gaussian sample. There is no neural network involved in this part at all. It is a recipe.

The choice of \\(\\beta_t\\) is the **schedule**. The original DDPM paper used a *linear* schedule with \\(\\beta_1 = 10^{-4}\\) and \\(\\beta_T = 0.02\\) — small to start, gently growing. The *cosine* schedule from Nichol & Dhariwal (2021) instead defines \\(\\bar\\alpha_t\\) as a cosine curve and derives \\(\\beta_t\\) backwards from it; it adds noise more slowly near \\(t = 0\\) and \\(t = T\\) and accelerates in the middle, which avoids spending too much network capacity on noise levels at which there is almost nothing left to predict.`,
          },
          {
            kind: 'math',
            heading: 'The closed-form noisy sample (the reparameterisation that makes training cheap)',
            body: `Because every forward step is Gaussian and linear in \\(x_{t-1}\\), the marginal distribution at any time \\(t\\) is also Gaussian and has a closed form. Define

\\[
\\alpha_t = 1 - \\beta_t, \\qquad \\bar\\alpha_t = \\prod_{s=1}^{t} \\alpha_s
\\]

so \\(\\bar\\alpha_t\\) is the cumulative product of the per-step signal coefficients. Then the noisy image at any step \\(t\\) can be written directly in terms of the clean image \\(x_0\\):

\\[
q(x_t \\mid x_0) = \\mathcal{N}\\big( x_t;\\; \\sqrt{\\bar\\alpha_t}\\, x_0,\\; (1 - \\bar\\alpha_t) I \\big)
\\]

which, using the reparameterisation trick from the *Autoencoders* lesson, becomes

\\[
x_t = \\sqrt{\\bar\\alpha_t}\\, x_0 + \\sqrt{1 - \\bar\\alpha_t}\\, \\epsilon, \\qquad \\epsilon \\sim \\mathcal{N}(0, I)
\\]

This is the single equation that makes diffusion training tractable. To get a training example at noise level \\(t\\), you do **not** simulate the noise chain step by step. You sample one clean image \\(x_0\\), one timestep \\(t\\), one Gaussian \\(\\epsilon\\), and combine them in one line. As \\(\\bar\\alpha_t \\to 1\\) (small \\(t\\)) the image is barely corrupted; as \\(\\bar\\alpha_t \\to 0\\) (large \\(t\\)) the image is pure noise. The network never has to roll the chain forward.`,
          },
          {
            kind: 'viz',
            component: 'GaussianViz',
            props: {},
            heading: 'Each step adds Gaussian noise; we learn to subtract it.',
          },
          {
            kind: 'viz',
            component: 'DiffusionChainViz',
            heading: 'Forward chain vs reverse chain',
            caption: 'Forward adds Gaussian noise on a fixed schedule. Reverse subtracts noise with a learned network. Same chain, opposite directions — scrub t to walk it.',
          },
          {
            kind: 'prose',
            heading: 'The reverse process — a network that predicts noise',
            body: `The forward process is a fixed recipe; the reverse process is what the model learns. The goal is to walk back along the same chain — start from \\(x_T \\sim \\mathcal{N}(0, I)\\) and produce \\(x_{T-1}, x_{T-2}, \\ldots, x_0\\). Bayes' rule says the true reverse step \\(p(x_{t-1} \\mid x_t)\\) is intractable (it depends on the data distribution we are trying to model), but for small enough \\(\\beta_t\\) it is *also* approximately Gaussian, and Ho et al. (2020) showed that the entire problem reduces to learning a single network that predicts the **noise** \\(\\epsilon\\) added at step \\(t\\):

\\[
\\epsilon_\\theta(x_t, t) \\;\\approx\\; \\epsilon \\quad \\text{such that} \\quad x_t = \\sqrt{\\bar\\alpha_t}\\, x_0 + \\sqrt{1 - \\bar\\alpha_t}\\, \\epsilon
\\]

This single network handles **every** noise level. Timestep \\(t\\) is fed in as an embedding (a sinusoidal positional encoding from the *Positional encoding* lesson, projected through an MLP and added to every residual block) so the network knows how aggressive a denoising step to take. The architecture is almost always a U-Net for images — downsampling path, bottleneck with attention, upsampling path with skip connections — with cross-attention layers wired to a text or class embedding when conditioning is in play. Newer systems (Sora, Stable Diffusion 3) use a Diffusion Transformer (DiT) instead: a pure transformer with attention at every scale, treating patches the way *Attention* treated tokens.

The point is that \\(\\epsilon_\\theta\\) is one network, one set of weights, used at every timestep. The "many small problems" framing of diffusion is solved by amortisation — the network learns a denoiser that interpolates smoothly across noise levels rather than \\(T\\) separate denoisers.`,
          },
          {
            kind: 'math',
            heading: 'The training loss — predict noise with MSE',
            body: `Plug \\(x_t\\) from the closed-form equation into the network, ask it to predict the \\(\\epsilon\\) you just sampled, and penalise the squared error. That is the entire training objective:

\\[
\\mathcal{L}_{\\text{simple}}(\\theta) = \\mathbb{E}_{x_0,\\, t,\\, \\epsilon} \\Big[\\, \\big\\| \\epsilon - \\epsilon_\\theta\\big( \\sqrt{\\bar\\alpha_t}\\, x_0 + \\sqrt{1 - \\bar\\alpha_t}\\, \\epsilon,\\; t \\big) \\big\\|^2 \\,\\Big]
\\]

where \\(t \\sim \\text{Uniform}\\{1, \\ldots, T\\}\\), \\(\\epsilon \\sim \\mathcal{N}(0, I)\\), and \\(x_0\\) is drawn from the dataset.

This is just regression. No adversarial game, no KL trade-off, no minibatch tricks for posterior collapse — the loss is the L2 distance between two tensors. That is why diffusion training is *boring* in the best possible way: you set a learning rate, you let the network warm up, and the loss curve descends. The original DDPM paper noted that this simplified loss — they call it \\(L_{\\text{simple}}\\) — works dramatically better than the formally-correct ELBO weighting derived from the variational lower bound, because it stops the model from over-allocating capacity to noise levels that contribute almost nothing to perceived sample quality.`,
          },
          {
            kind: 'code',
            language: 'python',
            heading: 'PyTorch sketch — model, training step, sampling loop',
            body: `import torch
import torch.nn as nn
import torch.nn.functional as F

# --- variance schedule (linear or cosine) ---
def cosine_schedule(T, s=0.008):
    steps = torch.arange(T + 1, dtype=torch.float32) / T
    f = torch.cos((steps + s) / (1 + s) * torch.pi / 2) ** 2
    alpha_bar = f / f[0]
    betas = 1 - (alpha_bar[1:] / alpha_bar[:-1])
    return betas.clamp(max=0.999)

T = 1000
betas = cosine_schedule(T)              # (T,)
alphas = 1.0 - betas
alpha_bar = torch.cumprod(alphas, dim=0) # closed-form alpha_bar_t

# --- noise prediction model: U-Net with timestep embedding ---
class NoisePredictor(nn.Module):
    def __init__(self, channels=3, hidden=128):
        super().__init__()
        self.time_mlp = nn.Sequential(
            nn.Linear(hidden, hidden * 4), nn.SiLU(),
            nn.Linear(hidden * 4, hidden),
        )
        # ... downsampling blocks, bottleneck with attention, upsampling with skips
        self.unet = build_unet(channels, hidden)  # any U-Net with time conditioning

    def forward(self, x_t, t):
        # t: (batch,) integer timesteps
        t_emb = sinusoidal_embedding(t, dim=128)          # like positional encoding
        t_emb = self.time_mlp(t_emb)                      # (batch, hidden)
        return self.unet(x_t, t_emb)                      # predict noise eps_hat

# --- training step ---
def train_step(model, x0, optimizer):
    b = x0.size(0)
    t = torch.randint(0, T, (b,), device=x0.device)      # one t per example
    eps = torch.randn_like(x0)                            # sample noise
    a_bar = alpha_bar[t].view(-1, 1, 1, 1).to(x0.device)
    x_t = a_bar.sqrt() * x0 + (1 - a_bar).sqrt() * eps    # closed-form noisy sample
    eps_hat = model(x_t, t)
    loss = F.mse_loss(eps_hat, eps)                       # the entire objective
    optimizer.zero_grad(); loss.backward(); optimizer.step()
    return loss.item()

# --- sampling: start from N(0, I), denoise for T steps ---
@torch.no_grad()
def sample(model, shape, device):
    x = torch.randn(shape, device=device)                 # x_T ~ N(0, I)
    for t in reversed(range(T)):
        t_batch = torch.full((shape[0],), t, device=device, dtype=torch.long)
        eps_hat = model(x, t_batch)
        a_t = alphas[t].to(device)
        a_bar_t = alpha_bar[t].to(device)
        # mean of p(x_{t-1} | x_t) under the learned reverse process
        mean = (1 / a_t.sqrt()) * (x - (betas[t].to(device) / (1 - a_bar_t).sqrt()) * eps_hat)
        if t > 0:
            z = torch.randn_like(x)
            x = mean + betas[t].to(device).sqrt() * z     # stochastic step (DDPM)
        else:
            x = mean                                      # last step is deterministic
    return x`,
          },
          {
            kind: 'prose',
            heading: 'Sampling — start from noise, take T denoising steps',
            body: `Once the network is trained, sampling is a deterministic recipe. Draw \\(x_T \\sim \\mathcal{N}(0, I)\\) — a tensor of pure Gaussian noise the same shape as your target. Run the network to predict \\(\\hat\\epsilon = \\epsilon_\\theta(x_T, T)\\). Use the predicted noise to estimate the previous (less-noisy) image \\(x_{T-1}\\). Repeat for \\(t = T-1, T-2, \\ldots, 1\\) until you land on \\(x_0\\), which is your generated sample.

The per-step update under the original DDPM is

\\[
x_{t-1} = \\frac{1}{\\sqrt{\\alpha_t}} \\left( x_t - \\frac{\\beta_t}{\\sqrt{1 - \\bar\\alpha_t}}\\, \\epsilon_\\theta(x_t, t) \\right) + \\sigma_t z, \\quad z \\sim \\mathcal{N}(0, I)
\\]

— a deterministic drift back towards a less-noisy image, plus a small fresh Gaussian kick to keep the trajectory on the correct stochastic manifold. The \\(\\sigma_t z\\) term is the **stochastic** part of stochastic differential equation sampling; setting it to zero turns DDPM into **DDIM**, a deterministic sampler that produces nearly identical samples in 20-50 steps instead of 1000. Every modern fast sampler — DPM-Solver, k-Euler, the distilled one-step Consistency Models — is a different way of compressing this reverse trajectory while preserving the score-function picture underneath.`,
          },
          {
            kind: 'prose',
            heading: 'Why this works — diffusion is a discretised stochastic differential equation',
            body: `The deepest justification for the recipe came after the recipe existed. Song et al. (2021) showed that the discrete diffusion chain is a *discretisation* of a continuous-time stochastic differential equation (SDE). In the limit \\(T \\to \\infty\\), the forward process becomes

\\[
\\mathrm{d}x = f(x, t)\\,\\mathrm{d}t + g(t)\\,\\mathrm{d}w
\\]

— a drift term \\(f\\) plus a diffusion term \\(g\\) times a Brownian motion \\(w\\). The reverse-time SDE, which describes denoising, has a closed form due to Anderson (1982):

\\[
\\mathrm{d}x = \\big[\\, f(x, t) - g(t)^2 \\nabla_x \\log p_t(x) \\,\\big]\\,\\mathrm{d}t + g(t)\\,\\mathrm{d}\\bar w
\\]

The only thing the reverse SDE needs that we do not have for free is \\(\\nabla_x \\log p_t(x)\\) — the **score function**, the gradient of the log-density of the noisy data. And that is exactly what \\(\\epsilon_\\theta(x_t, t)\\) is approximating: under the closed-form forward marginal, \\(\\nabla_x \\log q(x_t \\mid x_0) = -\\epsilon / \\sqrt{1 - \\bar\\alpha_t}\\), so predicting \\(\\epsilon\\) is the same as predicting the score up to a sign and a known constant.

This is why "predict the noise" is not arbitrary. It is the discrete version of *score matching*, and the SDE perspective tells you why the chain produces samples from the data distribution: you are numerically integrating a reverse-time SDE whose stationary distribution is exactly \\(p_{\\text{data}}\\). Different ODE/SDE solvers give different samplers; the network only needs to learn the score, and every sampler is downstream of that one learned function.`,
          },
          {
            kind: 'prose',
            heading: 'Conditioning — text-to-image and classifier-free guidance',
            body: `An unconditional diffusion model samples from \\(p(x)\\). A **conditional** diffusion model samples from \\(p(x \\mid c)\\) where \\(c\\) is a class label, a text prompt, a sketch, or a depth map. Mechanically, the conditioning is fed into \\(\\epsilon_\\theta(x_t, t, c)\\) — usually as an extra input that the U-Net cross-attends to. For text-to-image, \\(c\\) is the sequence of token embeddings produced by a frozen CLIP text encoder (Stable Diffusion 1.x / 2.x), a T5 encoder (Imagen, SD3), or the model's own learned text tower (DALL-E 3); the U-Net's attention layers compute keys and values from those embeddings and queries from the image features, exactly like the cross-attention in an encoder-decoder transformer.

The trick that made text-to-image *actually work* is **classifier-free guidance** (Ho & Salimans, 2022). At training time, randomly drop the conditioning some fraction of the time (typically 10%) and train the network on \\(c = \\emptyset\\). The same network now learns both the conditional score \\(\\epsilon_\\theta(x_t, t, c)\\) and the unconditional score \\(\\epsilon_\\theta(x_t, t, \\emptyset)\\). At inference, combine them:

\\[
\\hat\\epsilon = \\epsilon_\\theta(x_t, t, \\emptyset) + w \\cdot \\big( \\epsilon_\\theta(x_t, t, c) - \\epsilon_\\theta(x_t, t, \\emptyset) \\big)
\\]

with **guidance scale** \\(w \\geq 1\\). At \\(w = 1\\) you get the plain conditional sample. At \\(w = 7\\) (a typical Stable Diffusion default) you over-shoot in the direction the prompt pulls you, getting samples that adhere more aggressively to the prompt at the cost of diversity. This is the single dial users tune on every text-to-image UI — "CFG scale" or "guidance" — and it is also why prompts that work at \\(w = 7\\) look washed-out at \\(w = 15\\): you are extrapolating along a gradient direction past the regime where the score estimate is reliable.`,
          },
          {
            kind: 'callout',
            tone: 'tip',
            body: `**Why classifier-free guidance works.** The original "classifier guidance" idea trained a separate noisy-image classifier and used its gradient \\(\\nabla_x \\log p(c \\mid x_t)\\) to steer sampling. Classifier-free guidance gets the same effect *without* the extra classifier by noticing that Bayes' rule gives \\(\\nabla_x \\log p(c \\mid x_t) = \\nabla_x \\log p(x_t \\mid c) - \\nabla_x \\log p(x_t)\\) — the difference of the conditional and unconditional scores. Train the same denoiser to model both (cheap: just drop \\(c\\) some of the time), then subtract them at inference. The guided score \\(\\hat\\epsilon\\) is a linear extrapolation along the *conditional minus unconditional* direction, pushing the trajectory toward regions where the prompt is more likely. No second model, no extra training, one hyperparameter \\(w\\) at inference. That is why every modern conditional diffusion model uses it.`,
          },
          {
            kind: 'callout',
            tone: 'note',
            body: `**Latent diffusion — Stable Diffusion does not run in pixel space.** Running a U-Net on \\(512 \\times 512 \\times 3\\) images for 1000 steps is impossibly expensive. Stable Diffusion (Rombach et al., 2022) sidesteps this by training a VAE first — the same VAE from the *Generative models* lesson — that compresses images into a much smaller latent \\(z\\) of shape \\(64 \\times 64 \\times 4\\). The diffusion model is then trained *in latent space*: the forward process noises \\(z\\), the reverse process denoises \\(z\\), and only at the very end does the VAE decoder map the final latent back to a full-resolution image. The latent has 48x fewer dimensions, so the U-Net is 48x cheaper per step. The image quality lives in the decoder; the diffusion model only has to learn the latent distribution. This is the architectural move that turned diffusion from a research curiosity into a model you could run on a consumer GPU.`,
          },
          {
            kind: 'prose',
            heading: 'Compared to GANs and VAEs',
            body: `The *Generative models* lesson laid out three families; this is the punchline for diffusion's row in that comparison.

**Versus GANs.** Diffusion training is *boring* in the best sense — one regression loss, no adversary, no mode collapse, no Wasserstein gradient penalties. GANs train an order of magnitude faster *per step* but their training is fragile and they cover modes badly: a GAN on faces might forget about red hair entirely, while a diffusion model of the same capacity reliably produces every hair colour in the training distribution. The cost is inference: a GAN samples in one forward pass, diffusion needs 20-50 in the cheapest modern samplers and 1000 in the original DDPM. For realtime applications GANs still win; for offline batch generation diffusion is the default.

**Versus VAEs.** Diffusion samples are sharp where VAE samples are blurry — the VAE's Gaussian decoder averages over a posterior and smooths fine detail away, while diffusion's iterative denoising commits to specific high-frequency structure. VAEs have a tractable encoder, which diffusion lacks (you can run the forward process to encode, but it is lossy). The two are now usually combined rather than compared: latent diffusion runs the diffusion sampler *inside a VAE's latent space*, getting the VAE's compression for cheap inference and the diffusion's quality for sharp samples. Stable Diffusion is the canonical example.

**Versus autoregressive.** GPT-style image and audio generators predict one token at a time in raster or scan order. They give you exact likelihoods, but generation is even slower than diffusion and the raster bias creates artefacts. Diffusion generates the whole image in parallel at each step, which is why it scales so well to high resolutions and to 3D / video data where autoregressive ordering becomes awkward.`,
          },
          {
            kind: 'prose',
            heading: 'Use cases — where diffusion is currently the default',
            body: `**Image generation.** Stable Diffusion, SDXL, SD3, Midjourney, DALL-E 3, Imagen — every flagship text-to-image system is a conditional latent diffusion model with a transformer-conditioned U-Net or DiT backbone. Inpainting, outpainting, img2img, ControlNet, IP-Adapter — all of them are different ways of conditioning the same denoiser. The visual generation market is a diffusion market.

**Video generation.** Sora (OpenAI), Veo (Google DeepMind), Movie Gen (Meta), Stable Video Diffusion — all diffusion models, usually with a DiT backbone operating on spacetime patches and an additional VAE for temporal compression. Conditioning is text, an initial image, or both; the same classifier-free guidance trick applies. Frame consistency across long clips remains the open research problem, addressed with various forms of temporal attention and noise correlation.

**Audio and music.** AudioLDM, MusicLM, Stable Audio, Riffusion — diffusion in latent spaces of audio VAEs, often conditioned on text or melody contour. The same recipe — fixed forward noise process, learned denoiser, classifier-free guidance for prompt adherence — works directly on spectrograms or raw waveforms.

**Beyond media.** AlphaFold 3 and RFdiffusion use diffusion for protein structure generation; molecular conformations, robot trajectories, point clouds, and 3D meshes have all been generated with the same framework. The architectural details change — equivariant networks for molecules, SE(3) symmetry for 3D — but the forward-noise / learned-denoiser / classifier-free-guidance template is the constant.`,
          },
          {
            kind: 'prose',
            heading: 'What to take away',
            body: `Diffusion turns generation into denoising. Define a fixed forward process \\(q(x_t \\mid x_{t-1}) = \\mathcal{N}(\\sqrt{1 - \\beta_t}\\, x_{t-1}, \\beta_t I)\\) that gradually corrupts an image into pure Gaussian noise over \\(T\\) steps. Exploit the closed-form marginal \\(x_t = \\sqrt{\\bar\\alpha_t}\\, x_0 + \\sqrt{1 - \\bar\\alpha_t}\\, \\epsilon\\) to sample any noise level in one line. Train a single network \\(\\epsilon_\\theta(x_t, t)\\) — almost always a U-Net or DiT with timestep embedding and cross-attention to conditioning — to predict the noise, with the entire objective being one MSE loss. Sample by drawing \\(x_T \\sim \\mathcal{N}(0, I)\\) and iteratively denoising for \\(T\\) (or with modern samplers, 20-50) steps.

The framing matches a stochastic differential equation whose reverse-time formulation requires the score \\(\\nabla_x \\log p_t(x)\\) — and \\(\\epsilon_\\theta\\) is exactly that score up to a known constant. This is why the recipe works: you are numerically integrating an SDE whose stationary distribution is \\(p_{\\text{data}}\\). Conditioning comes via cross-attention to text embeddings; classifier-free guidance trades diversity for prompt adherence with a single hyperparameter \\(w\\) at inference. Stable Diffusion runs the entire process *inside* a VAE's latent space — the architectural move that took diffusion from research to commodity.

Versus GANs, diffusion training is stable and covers modes; inference is slower. Versus VAEs, samples are sharp; there is no tractable encoder. Versus autoregressive, generation is parallel; likelihoods are not tractable. Almost every flagship image, video, and audio generator in 2025 is a diffusion model, usually conditional, usually in a latent space, almost always with a transformer block from the *Attention* lesson somewhere inside the denoiser. The components from the earlier pillars — residual blocks, layer norm, attention, positional encoding, VAEs — are no longer competing architectures; they are the pieces a diffusion model is built from.`,
          },
          {
            kind: 'prose',
            heading: 'Further reading',
            body: `- [Lilian Weng — "What are Diffusion Models?"](https://lilianweng.github.io/posts/2021-07-11-diffusion-models/) — the long-form survey with the forward / reverse process derivations and a clean tour through DDPM, DDIM, score-based, and consistency models.
- [Ho, Jain & Abbeel — DDPM paper](https://arxiv.org/abs/2006.11239) — "Denoising Diffusion Probabilistic Models"; the 2020 paper that made diffusion competitive with GANs for image synthesis.
- [Calvin Luo — "Understanding Diffusion Models: A Unified Perspective"](https://arxiv.org/abs/2208.11970) — the pedagogical tech report that walks every term in the ELBO and ties VAEs, hierarchical VAEs, and diffusion together.`,
          },
        ],
      },
      {
        slug: 'vae',
        title: 'Variational autoencoders',
        oneLiner: 'Autoencoders with a probabilistic twist. Learn a smooth latent space you can sample from.',
        difficulty: 'intermediate',
        readMinutes: 10,
        sections: [
          {
            kind: 'prose',
            heading: 'A vanilla autoencoder cannot generate',
            body: `An *Autoencoder* squeezes \\(x\\) through a deterministic bottleneck \\(z = f_\\phi(x)\\) and asks the decoder \\(\\hat{x} = g_\\theta(z)\\) to reverse the squeeze. Trained on enough data, both halves get sharp: the encoder maps each training image to a single point in latent space, and the decoder learns to reconstruct that exact point with high fidelity. Reconstruction loss falls, validation MSE drops, the dimensionality-reduction story works, and the lesson ends.

Now try to *generate* a new image. Sample a random \\(z\\) — say uniform in a box, or Gaussian around the origin — and feed it to the decoder. The result is almost always garbage. Not a slightly noisy version of a training image; structurally garbage. Strokes that do not connect, faces with three eyes, fragments of unrelated digits superimposed. The decoder has only ever seen the very specific points the encoder produced — a discrete cloud floating in a much larger volume — and the spaces *between* those points are uncharted territory. The latent space looks like a colander: holes everywhere, and most random \\(z\\) lands in one.

A VAE fixes the colander. Instead of mapping \\(x\\) to a single point, the encoder outputs the parameters of a *distribution* over \\(z\\), and a loss term pulls every per-input distribution toward a shared standard normal prior. The decoder, trained on samples drawn from that pulled-in posterior, learns to handle a connected blob of latent space rather than a scattered set of dots. Now random draws from \\(\\mathcal{N}(0, I)\\) land somewhere the decoder has seen, and the output is a plausible new sample. That is the entire trick.`,
          },
          {
            kind: 'prose',
            heading: 'Why a latent space needs structure',
            body: `A vanilla autoencoder learns the map \\(x \\to z \\to x'\\) and is graded entirely on whether \\(x'\\) matches \\(x\\). Nothing in that objective cares about *where* in latent space \\(z\\) ends up. The encoder is free to fling each training image to whatever coordinate makes reconstruction easiest, and the typical result is a sparse, hole-y manifold: a thin scaffolding of training points connected by empty volume that the decoder has never been asked to interpret.

Pick a random \\(z\\) near the training data — say a Gaussian around the centroid of the encoded cloud — and decode it. The output is rarely a clean blend of two digits. It is a noisy garbage reconstruction: half-strokes, broken loops, smeared edges. The decoder treats the off-manifold sample as nonsense input because that is, mechanically, what it is. It was never trained on anything in that neighbourhood.

A VAE forces the latent code to look like a **standard normal distribution**. The encoder no longer emits a point; it emits the parameters of a Gaussian, and a regulariser pulls every per-input Gaussian toward \\(\\mathcal{N}(0, I)\\). After training, the cloud of posteriors covers the unit ball densely and overlaps with itself — no holes, no scaffolding. Sampling \\(z \\sim \\mathcal{N}(0, I)\\) lands inside the region the decoder has actually been trained on, so the output is a meaningful image. Interpolating between two encoded points \\(z_1\\) and \\(z_2\\) traces a path through populated latent space, and decoding along that path produces a meaningful blend — a digit that morphs continuously from a 3 into an 8 rather than dissolving through static.

The mechanism is a single regularisation term. KL divergence between the encoder's per-input posterior \\(q(z \\mid x)\\) and the prior \\(p(z) = \\mathcal{N}(0, I)\\) penalises every posterior that drifts away from the unit Gaussian. Add that term to the reconstruction loss and the latent space transforms from a colander into a smooth, full manifold you can sample from. The encoder still has to encode enough information for the decoder to recover \\(x\\), but it must do so using a latent code that lives near the origin and overlaps with its neighbours. The two pressures — reconstruct accurately, stay near \\(\\mathcal{N}(0, I)\\) — together carve out a usable generative geometry.`,
          },
          {
            kind: 'prose',
            heading: 'Worked: ELBO decomposition',
            body: `The goal is to maximise \\(\\log p_\\theta(x)\\) — the likelihood the model assigns to a training image. That is the standard maximum-likelihood objective applied to a latent-variable model. The trouble is the marginal:

\\[
p_\\theta(x) = \\int p_\\theta(x \\mid z) \\, p(z) \\, dz
\\]

That integral runs over every possible \\(z\\) the prior could produce, weighted by the decoder's likelihood of \\(x\\) at each one. For a neural-network decoder this has no closed form, and Monte-Carlo estimating it directly requires draws from \\(p(z) = \\mathcal{N}(0, I)\\) that almost never land near the true posterior of any particular \\(x\\). The estimator has astronomical variance and the gradient is unusable.

The **variational trick** introduces a helper distribution \\(q_\\phi(z \\mid x)\\) — an approximation to the intractable true posterior \\(p_\\theta(z \\mid x)\\) — and derives a tractable lower bound on the log-likelihood. A few lines of Jensen's inequality give:

\\[
\\log p_\\theta(x) \\;\\geq\\; \\mathbb{E}_{q_\\phi(z \\mid x)}\\!\\left[\\log p_\\theta(x \\mid z)\\right] \\;-\\; D_{\\text{KL}}\\!\\big(q_\\phi(z \\mid x) \\,\\|\\, p(z)\\big) \\;=\\; \\text{ELBO}
\\]

Two terms, both computable. The first, \\(\\mathbb{E}_q[\\log p(x \\mid z)]\\), is **reconstruction quality**: sample \\(z\\) from the encoder's posterior, decode it, and measure how well the result matches \\(x\\). The second, \\(D_{\\text{KL}}(q(z \\mid x) \\,\\|\\, p(z))\\), **penalises the posterior for straying far from** \\(\\mathcal{N}(0, I)\\). Since \\(\\log p_\\theta(x) \\geq \\text{ELBO}\\) always, maximising the ELBO indirectly maximises the log-likelihood the model assigns to training data — the gap between the two is exactly \\(D_{\\text{KL}}(q \\,\\|\\, p_\\theta(z \\mid x))\\), which shrinks toward zero as the encoder gets better at approximating the true posterior. Optimising the ELBO does two jobs at once: it pushes the model parameters \\(\\theta\\) up the likelihood curve, and it pulls the encoder parameters \\(\\phi\\) toward a tighter posterior approximation.

Make it concrete on MNIST. Let \\(x \\in \\mathbb{R}^{784}\\) be a flattened digit, pixels in \\([0, 1]\\). The decoder distribution \\(p_\\theta(x \\mid z)\\) is a Gaussian with mean \\(\\mu_x = \\text{decoder}(z)\\) and identity covariance — so \\(\\log p(x \\mid z)\\) collapses to negative MSE up to a constant. The encoder posterior \\(q_\\phi(z \\mid x)\\) is a diagonal Gaussian with mean \\(\\mu_z = \\text{encoder}_\\mu(x)\\) and variance \\(\\sigma_z^2 = \\text{encoder}_{\\sigma^2}(x)\\), both produced by two linear heads off a shared backbone. Plug those into the ELBO: the reconstruction term becomes \\(-\\|x - \\text{decoder}(z)\\|^2\\) averaged over a sampled \\(z\\); the KL term becomes the closed-form Gaussian-to-Gaussian distance \\(\\tfrac{1}{2}\\sum_i (\\mu_{z,i}^2 + \\sigma_{z,i}^2 - 1 - \\log \\sigma_{z,i}^2)\\). Backprop on the negative of that sum is the entire training step — one Monte-Carlo sample of \\(z\\) per image, closed-form KL, no second-order tricks.`,
          },
          {
            kind: 'prose',
            heading: 'Reparameterization trick',
            body: `The ELBO derivation hides a practical problem. The reconstruction term is an expectation over \\(z \\sim q_\\phi(z \\mid x)\\), and computing it requires actually sampling \\(z\\) from the encoder's posterior. Sampling is non-differentiable: a random number generator is a black box that consumes \\((\\mu, \\sigma)\\) and emits a number, and the chain rule cannot reach back through it. Gradients of the reconstruction loss with respect to \\(\\mu\\) and \\(\\sigma\\) never reach the encoder, and end-to-end training fails before it begins.

The **reparameterization trick** rewrites the sample as a deterministic function of the encoder outputs and an external noise source:

\\[
z = \\mu + \\sigma \\cdot \\epsilon, \\qquad \\epsilon \\sim \\mathcal{N}(0, 1)
\\]

Now \\(z\\)'s randomness lives entirely inside \\(\\epsilon\\), which is sampled once per forward pass and treated as a constant input. The path from the loss back through \\(z\\) to \\(\\mu\\) is the identity; the path back to \\(\\sigma\\) multiplies by \\(\\epsilon\\). Both are differentiable. Backprop flows through everything in the network *except* \\(\\epsilon\\) itself, which has no parameters to update.

Walk through a single dimension. Suppose the encoder predicts \\(\\mu = 2\\), \\(\\sigma = 1\\). Draw \\(\\epsilon = 0.5\\). Then \\(z = 2 + 1 \\cdot 0.5 = 2.5\\). The partial derivatives are \\(\\partial z / \\partial \\mu = 1\\) and \\(\\partial z / \\partial \\sigma = \\epsilon = 0.5\\). Both gradients are non-zero, both flow upstream into the encoder weights, and a step of gradient descent updates \\(\\mu\\) and \\(\\sigma\\) to make the next reconstruction better. Without the trick those derivatives do not exist — the sampling op breaks the graph — and the encoder receives no learning signal at all.

This single rewrite is why VAEs work. The same factorisation reappears in diffusion models (\\(x_t = \\sqrt{\\bar\\alpha_t} x_0 + \\sqrt{1 - \\bar\\alpha_t} \\epsilon\\)), in score-based generators, in any model that needs gradients to flow through a sampled latent. Drop it and there is no end-to-end training; the encoder and decoder become two disconnected networks talking past each other through a noisy channel.`,
          },
          {
            kind: 'viz',
            component: 'VAELatentViz',
            props: {},
            heading: 'Vanilla AE collapses to points · VAE smears into a blob',
            caption: 'Vanilla AE scatters 12 inputs as isolated dots with empty space between them. The VAE replaces each dot with a Gaussian blob and a KL term pulls the cloud into the unit-Gaussian prior. Slide β to watch the regulariser take over: β = 0 collapses to vanilla AE, β = 5 piles every blob onto the origin.',
          },
          {
            kind: 'viz',
            component: 'VAEViz',
            props: {},
            heading: 'Encoder collapses to a Gaussian, decoder expands.',
          },
          {
            kind: 'prose',
            heading: 'The encoder predicts (μ, log σ²), not a single z',
            body: `Rewrite the encoder. Instead of emitting a single latent vector, it emits **two** vectors of the same shape: a mean \\(\\mu_\\phi(x) \\in \\mathbb{R}^k\\) and a log-variance \\(\\log \\sigma_\\phi^2(x) \\in \\mathbb{R}^k\\). Together they define a diagonal Gaussian *posterior* over latents conditioned on \\(x\\):

\\[
q_\\phi(z \\mid x) = \\mathcal{N}\\big(z;\\; \\mu_\\phi(x),\\; \\operatorname{diag}(\\sigma_\\phi^2(x))\\big)
\\]

In code this is a single linear layer per output: \`mu = nn.Linear(d_hidden, d_latent)\` and \`log_var = nn.Linear(d_hidden, d_latent)\`. Both project off the same encoder backbone. At training time you do not feed \\(\\mu\\) into the decoder — you *sample* \\(z \\sim q_\\phi(z \\mid x)\\) and feed the sample. That single line of stochasticity is what turns the model from a deterministic compressor into a generative one.

Why log variance and not variance directly? Variance has to be positive. A linear layer's output is not. Predicting \\(\\log \\sigma^2\\) lets the network output anything in \\(\\mathbb{R}\\), and \\(\\sigma = \\exp(0.5 \\cdot \\log \\sigma^2)\\) is automatically positive. It also gives the loss a much friendlier gradient — the KL term has \\(\\log \\sigma^2\\) appearing linearly, so the natural parameterisation matches the natural gradient flow. Every VAE implementation in the wild does this. If you ever see \`sigma = nn.Linear(...)\` with a softplus on top, the author is fighting the framework.`,
          },
          {
            kind: 'callout',
            tone: 'tip',
            body: `**Predict \\(\\log \\sigma^2\\), not \\(\\sigma\\).** Variance must be positive, but a linear layer output is not. Predicting the log lets the head be a plain \\(\\verb|nn.Linear|\\), and \\(\\sigma = \\exp(0.5 \\cdot \\log \\sigma^2)\\) is positive by construction. As a side benefit the KL term simplifies — \\(\\log \\sigma^2\\) appears linearly inside it — so the optimiser sees a clean, well-conditioned gradient on the variance head. The same trick shows up in *Mixture Density Networks*, GANs with learned noise scales, and most score-based models.`,
          },
          {
            kind: 'math',
            heading: 'The reparameterisation trick — making the sample differentiable',
            body: `A sample drawn from \\(\\mathcal{N}(\\mu, \\sigma^2)\\) is, in general, a function of two things: the parameters \\(\\mu\\) and \\(\\sigma\\) (we want gradients on these) and an external source of randomness (we do not). If we write the sample naively as \\(z = \\verb|np.random.normal|(\\mu, \\sigma)\\), the operation is non-differentiable — the chain rule has nowhere to flow through a black-box random number generator. The decoder loss never reaches the encoder, and training collapses.

The **reparameterisation trick** rewrites the sample as a deterministic function of the parameters and an auxiliary noise:

\\[
z = \\mu + \\sigma \\odot \\epsilon, \\qquad \\epsilon \\sim \\mathcal{N}(0, I)
\\]

The randomness is now *outside* the network — \\(\\epsilon\\) is drawn once per forward pass and treated as a constant input. The path from loss back to \\(\\mu\\) is the identity; the path back to \\(\\sigma\\) multiplies by \\(\\epsilon\\). Both are differentiable. The decoder gradient flows through \\(z\\) into the encoder, the encoder updates \\(\\mu\\) and \\(\\sigma\\), and the whole network trains end-to-end with standard backprop.

The trick is shockingly general. Any location-scale distribution — Gaussian, Laplace, Cauchy — admits the same factorisation. For categorical samples you cannot do this exactly, so VAE-style work on discrete latents uses the Gumbel-softmax or straight-through estimators instead. The same idea reappears in the *Diffusion models* lesson when we write \\(x_t = \\sqrt{\\bar\\alpha_t} x_0 + \\sqrt{1 - \\bar\\alpha_t} \\epsilon\\) — same factorisation, different motivation.`,
          },
          {
            kind: 'math',
            heading: 'The ELBO — what the VAE is actually optimising',
            body: `The VAE is doing approximate maximum-likelihood on a latent-variable model where \\(z\\) is the unobserved cause of \\(x\\). The true log-likelihood \\(\\log p_\\theta(x) = \\log \\int p_\\theta(x \\mid z) p(z) \\, dz\\) is intractable — the integral has no closed form for a neural-network decoder. The fix is to introduce the encoder \\(q_\\phi(z \\mid x)\\) as an *approximate posterior* and derive a tractable lower bound.

The **Evidence Lower Bound (ELBO)** is:

\\[
\\log p_\\theta(x) \\;\\geq\\; \\mathcal{L}(x; \\phi, \\theta) \\;=\\; \\mathbb{E}_{q_\\phi(z \\mid x)}\\!\\left[\\, \\log p_\\theta(x \\mid z) \\,\\right] \\;-\\; D_{\\text{KL}}\\!\\big(q_\\phi(z \\mid x) \\,\\|\\, p(z)\\big)
\\]

where \\(p(z) = \\mathcal{N}(0, I)\\) is the prior. Two terms — that is all there ever is.

**Reconstruction.** \\(\\mathbb{E}_{q}[\\log p_\\theta(x \\mid z)]\\) is the log-likelihood of the input under the decoder's output distribution. For Gaussian decoders this collapses to negative MSE up to a constant; for Bernoulli outputs (binary MNIST), to negative BCE. In practice you Monte-Carlo it with a single sample of \\(z\\) per forward pass — that is the whole point of the reparameterisation trick.

**KL regulariser.** \\(D_{\\text{KL}}(q_\\phi(z \\mid x) \\,\\|\\, \\mathcal{N}(0, I))\\) measures how far the encoder's per-input Gaussian is from the prior. For diagonal Gaussians it has a closed form:

\\[
D_{\\text{KL}}\\!\\big(\\mathcal{N}(\\mu, \\sigma^2) \\,\\|\\, \\mathcal{N}(0, 1)\\big) = \\tfrac{1}{2} \\big(\\mu^2 + \\sigma^2 - 1 - \\log \\sigma^2\\big)
\\]

summed over latent dimensions. No sampling needed — it is a function of the encoder outputs directly. The VAE training loss is the **negative ELBO**: minimise reconstruction error plus KL.`,
          },
          {
            kind: 'prose',
            heading: 'Why the KL term is the whole regulariser',
            body: `Look at what the KL term does, dimension by dimension. The closed form \\(\\tfrac{1}{2}(\\mu^2 + \\sigma^2 - 1 - \\log \\sigma^2)\\) is minimised at \\(\\mu = 0, \\sigma = 1\\) — exactly the standard normal prior. Push \\(\\mu\\) far from zero and the \\(\\mu^2\\) term punishes you. Make \\(\\sigma\\) tiny and the \\(-\\log \\sigma^2\\) term blows up. Make it huge and the \\(\\sigma^2\\) term blows up. The KL is a quadratic-ish bowl with its bottom at the prior.

That bowl is the regulariser. Without it, the encoder is free to fling each input's posterior anywhere in latent space and shrink \\(\\sigma\\) to zero, recovering a deterministic autoencoder — and inheriting its colander problem. With it, every input's posterior is pulled toward the origin and prevented from collapsing to a point. The result is that posteriors *overlap*: nearby inputs share latent volume, and the gaps between training-set points are no longer empty. The decoder, forced to handle this overlap during training, learns a smooth function across the whole prior.

This is what makes generation work. Sample \\(z \\sim \\mathcal{N}(0, I)\\) and you land somewhere the encoder has covered during training (because every encoder posterior overlapped with the prior). The decoder produces a plausible output because it has seen something like this \\(z\\) before. Drop the KL term and the encoder rushes back to determinism; the latent space punctures; the generator dies. The reconstruction term wants sharp samples and large \\(\\sigma\\) shrinkage; the KL term wants smooth coverage. The ELBO is the *exact* compromise between those two pressures.`,
          },
          {
            kind: 'prose',
            heading: 'β-VAE — turning the regulariser into a knob',
            body: `The standard ELBO weights the KL term at \\(\\beta = 1\\). The \\(\\beta\\)-VAE (Higgins et al., 2017) replaces that 1 with a tunable scalar:

\\[
\\mathcal{L}_\\beta(x) = \\mathbb{E}_{q}[\\log p_\\theta(x \\mid z)] - \\beta \\cdot D_{\\text{KL}}\\!\\big(q_\\phi(z \\mid x) \\,\\|\\, p(z)\\big)
\\]

\\(\\beta = 1\\) recovers the original VAE. \\(\\beta > 1\\) makes the prior pull harder: the posteriors are squeezed even tighter toward \\(\\mathcal{N}(0, I)\\) and the latent code is forced to carry less information per input. The reconstruction gets blurrier, but the latent dimensions become *more disentangled* — individual axes start to control individual factors of variation (one axis for lighting, one for rotation, one for object identity) instead of all axes mixing together.

The intuition is information-theoretic. The KL term upper-bounds the mutual information between \\(x\\) and \\(z\\). With \\(\\beta > 1\\) you cap that information more aggressively, forcing the encoder to be more selective about what it encodes; the bits it does keep tend to be the high-level, independent factors of variation in the data. \\(\\beta = 4\\) to \\(\\beta = 10\\) is a typical range for disentanglement work on faces, 3D shapes, dSprites.

The flip side: \\(\\beta < 1\\) lets reconstruction win. Samples get sharper, but the latent space drifts back toward the colander and pure generation degrades. Almost no one uses this regime; it is the autoencoder direction. The whole \\(\\beta\\) lever is a knob between "good reconstruction" and "clean generative geometry", and the right setting depends entirely on what you plan to do with the latents.`,
          },
          {
            kind: 'callout',
            tone: 'note',
            body: `**Posterior collapse — the failure mode that kills VAEs in the wild.** If the decoder is powerful enough to model \\(p(x)\\) without needing \\(z\\) at all (think autoregressive PixelCNN decoders, large transformer decoders, or any decoder with enough capacity to memorise the marginal), the optimiser discovers that setting \\(q_\\phi(z \\mid x) = p(z) = \\mathcal{N}(0, I)\\) zeros out the KL term *for free*. The encoder stops carrying any information about the input, and the decoder ignores \\(z\\) and just outputs its best guess at the data mean. Reconstruction collapses to a blur, KL goes to zero exactly, and the model has technically minimised the ELBO without learning anything. Fixes include KL annealing (start \\(\\beta\\) at 0 and ramp it up), the free-bits trick (only penalise KL beyond a floor), or weakening the decoder so it actually needs \\(z\\). If your VAE samples all look the same, posterior collapse is the first thing to check.`,
          },
          {
            kind: 'code',
            language: 'python',
            heading: 'VAE in PyTorch — encoder, reparameterise, decoder, loss',
            body: `import torch
import torch.nn as nn
import torch.nn.functional as F

class VAE(nn.Module):
    def __init__(self, d_in=784, d_hidden=400, d_latent=20):
        super().__init__()
        # encoder backbone
        self.enc1 = nn.Linear(d_in, d_hidden)
        # two heads off the same backbone: mu and log_var
        self.fc_mu = nn.Linear(d_hidden, d_latent)
        self.fc_logvar = nn.Linear(d_hidden, d_latent)   # predict log sigma^2, not sigma
        # decoder
        self.dec1 = nn.Linear(d_latent, d_hidden)
        self.dec2 = nn.Linear(d_hidden, d_in)

    def encode(self, x):
        h = F.relu(self.enc1(x))
        return self.fc_mu(h), self.fc_logvar(h)          # mu, log_var

    def reparameterize(self, mu, log_var):
        # the trick: z = mu + sigma * eps, with eps ~ N(0, I)
        # sigma = exp(0.5 * log_var) is positive by construction
        sigma = torch.exp(0.5 * log_var)
        eps = torch.randn_like(sigma)                    # external randomness, no grad
        return mu + sigma * eps                          # differentiable in mu, log_var

    def decode(self, z):
        h = F.relu(self.dec1(z))
        return torch.sigmoid(self.dec2(h))               # x_hat in [0, 1]

    def forward(self, x):
        mu, log_var = self.encode(x)
        z = self.reparameterize(mu, log_var)
        return self.decode(z), mu, log_var

def vae_loss(x_hat, x, mu, log_var, beta=1.0):
    # reconstruction: BCE summed over pixels, averaged over batch
    recon = F.binary_cross_entropy(x_hat, x, reduction='sum') / x.size(0)
    # KL(q(z|x) || N(0,I)) closed form, per-dim, summed then averaged over batch
    # KL = 0.5 * sum(mu^2 + sigma^2 - 1 - log sigma^2)
    kl = -0.5 * torch.sum(1 + log_var - mu.pow(2) - log_var.exp()) / x.size(0)
    return recon + beta * kl, recon.item(), kl.item()

# ---- training step ----
model = VAE(d_latent=20)
opt = torch.optim.Adam(model.parameters(), lr=1e-3)

x = torch.rand(64, 784)                                  # fake batch in [0,1]
x_hat, mu, log_var = model(x)
loss, r, k = vae_loss(x_hat, x, mu, log_var, beta=1.0)
opt.zero_grad(); loss.backward(); opt.step()
print(f"recon = {r:.3f}  kl = {k:.3f}")

# ---- generation: sample from the prior, decode, get a fresh image ----
with torch.no_grad():
    z = torch.randn(16, 20)                              # 16 samples from N(0, I)
    samples = model.decode(z)                            # (16, 784) fresh outputs`,
          },
          {
            kind: 'prose',
            heading: 'Where VAEs sit among generators',
            body: `Compared to a **vanilla autoencoder**, the VAE pays for a slightly worse reconstruction with a *sampleable* latent space and a probabilistic story. You can interpolate between two inputs by linearly mixing their \\(\\mu\\)s and decoding — the path stays on the data manifold because the KL term has trained the decoder to handle the whole connected blob. The classic "king − man + woman = queen" trick for latent arithmetic was first demonstrated on VAE faces.

Compared to **GANs**, training is dramatically more stable: the loss is a clean MSE + KL, there is no minimax game, no mode collapse, and you get an encoder for free. The cost is sample sharpness — GANs and diffusion models produce visibly crisper images at the same scale. VAE samples have a characteristic slight blur, an artefact of the Gaussian decoder averaging over the posterior.

Compared to **diffusion models** (from the previous lesson), VAE sampling is *one forward pass* through the decoder, not 50 or 1000 iterative steps. Diffusion wins on peak sample quality; VAE wins on inference speed and the existence of an encoder. The modern hybrid is Stable Diffusion: a VAE compresses images into a small latent space, and a diffusion model runs *inside that latent space*. The VAE provides the encoder and the compression; the diffusion provides the sample quality. The two architectures stopped competing and became layers of the same stack.

The role VAEs play today is overwhelmingly as a *component*: the encoder in latent-diffusion systems, the speech tokeniser in VALL-E and AudioLM, the discrete codebook in VQ-VAE that feeds autoregressive image and audio transformers. Stand-alone VAEs are rare in flagship 2025 systems, but their *machinery* — predict (\\(\\mu\\), \\(\\log \\sigma^2\\)), reparameterise, regularise with KL to a prior — shows up in dozens of modern generators.`,
          },
          {
            kind: 'prose',
            heading: 'What to take away',
            body: `A VAE is an *Autoencoder* with one structural change: the encoder outputs distribution parameters \\((\\mu_\\phi(x), \\log \\sigma_\\phi^2(x))\\) instead of a single latent point. Sample \\(z\\) from that distribution with the reparameterisation trick \\(z = \\mu + \\sigma \\odot \\epsilon, \\epsilon \\sim \\mathcal{N}(0, I)\\) — which keeps the sample differentiable so backprop reaches the encoder — and feed it to the decoder. Train on the negative ELBO: reconstruction loss plus KL divergence between \\(q_\\phi(z \\mid x)\\) and the standard normal prior. The KL term is the entire regulariser; drop it and the model degenerates back to a deterministic autoencoder whose latent space is unsampleable.

The two practical knobs are \\(\\beta\\) (KL weight) and the decoder capacity. Large \\(\\beta\\) buys disentangled latents at the cost of reconstruction; tiny \\(\\beta\\) wins reconstruction but loses generation. Powerful decoders risk posterior collapse — the KL goes to zero, \\(z\\) carries no information, and the model degenerates into an unconditional generator. Fixes are KL annealing, free bits, or weakening the decoder.

The ideas in this lesson — predict \\((\\mu, \\log \\sigma^2)\\), reparameterise to keep gradients flowing, regularise toward a tractable prior — outlived the standalone VAE. They show up in diffusion models (which reuse the reparameterisation form), in mixture density networks, in score-based generators, in every modern probabilistic head. A VAE is one of the simplest places to see all four moves in one place, on one objective, training in one loop.`,
          },
          {
            kind: 'prose',
            heading: 'Further reading',
            body: `- [Kingma & Welling — VAE paper](https://arxiv.org/abs/1312.6114) — "Auto-Encoding Variational Bayes"; the 2013 paper that introduced the ELBO and the reparameterisation trick.
- [Lilian Weng — "From Autoencoder to Beta-VAE"](https://lilianweng.github.io/posts/2018-08-12-vae/) — the survey that walks the whole family tree: vanilla, conditional, Beta-VAE, VQ-VAE, TD-VAE.
- [Kingma & Welling — "An Introduction to Variational Autoencoders"](https://arxiv.org/abs/1906.02691) — the 2019 monograph by the original authors; the deepest pedagogical treatment.`,
          },
        ],
      },
    ],
  },
  rl: {
    title: 'Reinforcement Learning',
    oneLiner: 'Bellman equations, policy gradients, Q-learning, PPO. From bandits to RLHF.',
    iconName: 'Zap',
    lessons: [
      {
        slug: 'markov-decision-processes',
        title: 'Markov Decision Processes',
        oneLiner: 'The mathematical frame every RL algorithm secretly lives inside.',
        difficulty: 'intermediate',
        readMinutes: 11,
        sections: [
          {
            kind: 'prose',
            heading: 'The frame underneath every RL algorithm',
            body: `Every reinforcement learning paper — DQN, AlphaGo, PPO, RLHF — opens with a sentence like "we model the problem as a Markov Decision Process" and then never explains what one is. The MDP is the mathematical object the whole field stands on, the way the vectors lesson was the object linear algebra stood on. Once you can sketch one on a napkin, every RL algorithm reduces to "a clever way to solve this specific MDP without enumerating it."

An MDP is a thought experiment about an agent that lives inside a world. At each tick of the clock the world is in some **state** \\(s\\). The agent picks an **action** \\(a\\). The world then does two things at once: it pays the agent a **reward** \\(r\\), and it transitions to a new state \\(s'\\). The agent's job is to pick actions, forever, in a way that maximises the *total* reward it collects over time. That is the whole setup. Robotics, games, dialogue, recommendation, ad bidding — all of them fit this template once you choose what \\(s\\), \\(a\\), and \\(r\\) mean.

The reason the frame is useful is that it is small. Only five things to specify: states, actions, transitions, rewards, discount. That is the entire alphabet RL has to work with.`,
          },
          {
            kind: 'prose',
            heading: 'The agent-environment loop',
            body: `Strip the diagrams away and reinforcement learning is one feedback loop running forever. The agent observes a state \\(s\\), picks an action \\(a\\), and the environment responds with two pieces of information: the new state \\(s'\\) the world is now in, and a scalar reward \\(r\\) saying how that decision worked out. The agent reads those, picks the next action, and the loop ticks again. Every algorithm — tabular, deep, on-policy, off-policy, model-based, model-free — sits inside that loop. The only thing that changes between algorithms is *how* the agent picks the next action and *how* it uses the \\((s, a, r, s')\\) it just observed to get better at picking.

The word **Markov** carries the whole assumption that makes the loop tractable. It means the next state \\(s'\\) depends only on the current state \\(s\\) and the current action \\(a\\) — not on the entire history of states and actions that came before. The present screens off the past. If the agent is at the same chessboard configuration as yesterday with the same piece to move, the distribution of next positions is identical regardless of which game brought it here. That is what lets the math close into a finite recursion instead of unrolling into an ever-growing history term.

The agent's strategy lives in the **policy** \\(\\pi(a \\mid s)\\): a probability distribution over actions, conditioned on the current state. A policy is a rule the agent commits to follow. Deterministic policies always pick the same action in a given state; stochastic policies roll dice. Either way, \\(\\pi\\) is the only knob the agent actually controls.

To rank policies, the agent needs a score. The **value function** \\(V^{\\pi}(s)\\) gives one: it is the expected discounted future reward, starting from state \\(s\\) and acting according to \\(\\pi\\) forever after. A high \\(V^{\\pi}(s)\\) says "starting here and following this policy works out well." The **Q-function** \\(Q^{\\pi}(s, a)\\) is the same idea, but it pins the first action: starting from \\(s\\), taking \\(a\\) once, and only then handing the wheel back to \\(\\pi\\). Q lets the agent compare actions at a state without re-running a thousand rollouts.

The whole game collapses to one sentence: find the policy \\(\\pi^{*}\\) that maximises \\(V^{\\pi}(s)\\) at every state. Everything else — Bellman backups, temporal-difference updates, policy gradients, replay buffers, target networks — is a tactic in service of that one objective.`,
          },
          {
            kind: 'prose',
            heading: 'Worked: tiny 4-state MDP',
            body: `Take the smallest MDP that still has a decision in it. Three states \\(A\\), \\(B\\), \\(C\\), with \\(C\\) terminal. Two actions, **left** and **right**. Rewards are 0 at \\(A\\) and \\(B\\); entering \\(C\\) pays \\(+10\\). Transitions are deterministic: from \\(A\\), **right** goes to \\(B\\) with probability 1; from \\(B\\), **right** goes to \\(C\\) with probability 1 and **left** goes back to \\(A\\) with probability 1. Discount \\(\\gamma = 0.9\\). Compute \\(V^{*}\\) by hand.

Start at the end. \\(V^{*}(C) = 0\\) because \\(C\\) is terminal — no future reward is collected from a state that has already ended.

Move to \\(B\\). Two actions to compare. The **right** action collects an immediate reward of \\(10\\) and lands in \\(C\\): value \\(= 10 + \\gamma \\cdot V^{*}(C) = 10 + 0.9 \\cdot 0 = 10\\). The **left** action collects 0 and lands in \\(A\\): value \\(= 0 + \\gamma \\cdot V^{*}(A) = 0.9 \\cdot V^{*}(A)\\). The Bellman optimality equation takes the max: \\(V^{*}(B) = \\max\\!\\big(10,\\; 0.9 \\cdot V^{*}(A)\\big)\\).

At \\(A\\) there is only one action available — **right**, landing in \\(B\\): \\(V^{*}(A) = 0 + \\gamma \\cdot V^{*}(B) = 0.9 \\cdot V^{*}(B)\\).

Two equations, two unknowns:

\\[
V^{*}(B) = \\max\\!\\big(10,\\; 0.9 \\cdot V^{*}(A)\\big), \\qquad V^{*}(A) = 0.9 \\cdot V^{*}(B).
\\]

Try the first branch of the max: assume \\(V^{*}(B) = 10\\). Then \\(V^{*}(A) = 0.9 \\cdot 10 = 9\\). Check consistency: \\(0.9 \\cdot V^{*}(A) = 0.9 \\cdot 9 = 8.1 < 10\\), so the max really does pick \\(10\\). The assumption holds. The fixed point is \\(V^{*}(A) = 9\\), \\(V^{*}(B) = 10\\), \\(V^{*}(C) = 0\\).

Read the optimal policy off by greedy lookahead. At \\(B\\), \\(\\arg\\max\\) picks **right** (value 10 beats 8.1). At \\(A\\), only **right** is legal. So \\(\\pi^{*}: A \\to \\text{right},\\; B \\to \\text{right}\\) — head straight for the reward. That is the smallest MDP, solved end to end, with the same recursion that value iteration uses on a million-state grid.`,
          },
          {
            kind: 'prose',
            heading: 'Bellman equation — the recursive promise',
            body: `Pull the recursion that just solved the toy MDP out into a single line and you have the Bellman optimality equation:

\\[
V^{*}(s) \\;=\\; \\max_{a} \\left[\\, R(s, a) \\;+\\; \\gamma \\sum_{s'} P(s' \\mid s, a)\\, V^{*}(s') \\,\\right].
\\]

Read it as a promise the value function makes to itself. The value of the best decision available right now equals the immediate reward of that decision plus the discounted value of being in whichever state you land in next. The right-hand side is built entirely from \\(V^{*}\\) at other states; the left-hand side returns \\(V^{*}\\) at the current state. The equation is satisfied at a fixed point — the function \\(V^{*}\\) that comes back unchanged when plugged into both sides.

This is **the** equation of reinforcement learning. Every algorithm in the field is a way of approximately solving it. Policy iteration evaluates a fixed policy with the linear version (no \\(\\max\\)) and then improves the policy with one greedy lookahead. Value iteration uses the Bellman equation as an assignment and sweeps it to convergence. Q-learning samples one \\((s, a, r, s')\\) at a time and nudges \\(Q(s, a)\\) toward \\(r + \\gamma \\max_{a'} Q(s', a')\\). DQN does the same but with a neural network standing in for the Q-table and a target network freezing the right-hand side. PPO and actor-critic methods do not solve Bellman directly — they push on the policy gradient — but they use a value estimate as the baseline that makes the gradient low-variance, and that estimate is trained against a Bellman-style target.

**Value iteration** is the cleanest realisation. Initialise \\(V_{0}(s) = 0\\) for every state. Apply the Bellman backup as an assignment:

\\[
V_{k+1}(s) \\;\\leftarrow\\; \\max_{a} \\left[ R(s, a) + \\gamma \\sum_{s'} P(s' \\mid s, a)\\, V_{k}(s') \\right].
\\]

Sweep every state, repeat. The Bellman operator is a contraction in the sup-norm with factor \\(\\gamma < 1\\), so the iterates converge geometrically to the unique fixed point \\(V^{*}\\). Every sweep shrinks the error by at least \\(\\gamma\\). The contraction-mapping theorem does all the heavy lifting — and it is the same theorem that, dressed in different clothes, underwrites convergence proofs for every Bellman-based algorithm downstream.`,
          },
          {
            kind: 'math',
            heading: 'The MDP tuple',
            body: `An MDP is a 5-tuple \\((S, A, P, R, \\gamma)\\):

\\[
\\text{MDP} = (S,\\; A,\\; P,\\; R,\\; \\gamma)
\\]

- \\(S\\) — the set of **states** the world can be in. Finite or continuous. Position-of-the-robot, board configuration, pixel buffer, conversation so far.
- \\(A\\) — the set of **actions** the agent can choose. Often state-dependent: \\(A(s)\\).
- \\(P(s' \\mid s, a)\\) — the **transition probability**. The chance that taking action \\(a\\) in state \\(s\\) lands you in state \\(s'\\). This is where the *stochastic* world lives — wind nudges the drone, dice roll, opponent moves.
- \\(R(s, a)\\) — the **reward** the agent collects for taking \\(a\\) in \\(s\\). A real number. Sometimes written \\(R(s, a, s')\\) if the reward depends on where you land.
- \\(\\gamma \\in [0, 1]\\) — the **discount factor**. How much you value reward one step in the future relative to right now.

The **Markov property** is the one constraint that makes the math tractable: \\(P(s' \\mid s, a)\\) depends only on the *current* state \\(s\\) and action \\(a\\) — not on how you got to \\(s\\). The present screens off the past. If your problem violates that, you fold the missing history into the state until it stops violating it.`,
          },
          {
            kind: 'viz',
            component: 'MDPGridworldViz',
            heading: 'A 4x4 grid world',
            caption: 'Sixteen cells, one wall, two pits, one goal. Drag gamma, run value iteration, watch V*(s) propagate from the goal and the policy arrows snap into place.',
          },
          {
            kind: 'prose',
            heading: 'Policy, value, and Q — the three things the agent computes',
            body: `Once the MDP is specified, three derived objects do all the work, and every RL algorithm is a way of computing one of them.

A **policy** \\(\\pi(a \\mid s)\\) is the agent's strategy: the probability of choosing action \\(a\\) in state \\(s\\). A *deterministic* policy collapses to \\(\\pi(s) = a\\) — one chosen action per state. The grid-world arrows above are a deterministic policy.

The **state-value function** \\(V^{\\pi}(s)\\) is what the agent actually cares about: the expected total discounted reward it will collect if it starts in state \\(s\\) and follows policy \\(\\pi\\) from then on. Formally,

\\[
V^{\\pi}(s) = \\mathbb{E}_{\\pi}\\!\\left[\\sum_{t=0}^{\\infty} \\gamma^{t}\\, r_{t} \\;\\Big|\\; s_{0} = s\\right]
\\]

The \\(\\gamma^{t}\\) is the discount doing its job: reward arriving \\(t\\) steps from now is worth \\(\\gamma^{t}\\) of the same reward right now.

The **action-value function** \\(Q^{\\pi}(s, a)\\) is the same idea but commits to one action first:

\\[
Q^{\\pi}(s, a) = \\mathbb{E}_{\\pi}\\!\\left[\\sum_{t=0}^{\\infty} \\gamma^{t}\\, r_{t} \\;\\Big|\\; s_{0} = s,\\; a_{0} = a\\right]
\\]

\\(Q\\) is what DQN learns. \\(V\\) is what value iteration computes. A policy can be read directly off either: \\(\\pi^{*}(s) = \\arg\\max_{a} Q^{*}(s, a)\\), or one step of lookahead through the transition model from \\(V\\). Three objects, one underlying truth.`,
          },
          {
            kind: 'math',
            heading: 'The Bellman equation',
            body: `The whole field rests on one recursion. The optimal value of a state equals the best immediate reward plus the discounted optimal value of where you land:

\\[
V^{*}(s) \\;=\\; \\max_{a \\in A} \\left[\\, R(s, a) \\;+\\; \\gamma \\sum_{s' \\in S} P(s' \\mid s, a)\\, V^{*}(s') \\,\\right]
\\]

Read it left to right. To know how good a state is, look at every action you could take. For each, sum the immediate reward with the discounted expected value of the next state. The best of those numbers *is* the value of the current state. That is the Bellman optimality equation.

The Q-form is the same statement, shifted by one action:

\\[
Q^{*}(s, a) \\;=\\; R(s, a) \\;+\\; \\gamma \\sum_{s' \\in S} P(s' \\mid s, a)\\, \\max_{a'} Q^{*}(s', a')
\\]

Two things to notice. First, this is a **fixed-point equation** — \\(V^{*}\\) is the function that, when fed into the right-hand side, comes back out unchanged. Second, the \\(\\max\\) is what makes RL hard. Without it, Bellman is just a linear system in \\(|S|\\) unknowns and you solve it with one matrix inverse. With the \\(\\max\\), you cannot — and every RL algorithm is a way of dodging that fact.`,
          },
          {
            kind: 'prose',
            heading: 'Value iteration — just iterate the Bellman backup',
            body: `Here is the cleanest algorithm in RL, and the one to keep in your head as the baseline every other method is trying to approximate. Initialise \\(V(s) = 0\\) for every state. Then repeatedly apply the Bellman equation *as an assignment*:

\\[
V_{k+1}(s) \\;\\leftarrow\\; \\max_{a} \\left[ R(s, a) + \\gamma \\sum_{s'} P(s' \\mid s, a)\\, V_{k}(s') \\right]
\\]

Sweep over every state, update its value, repeat. The mapping is a contraction with factor \\(\\gamma\\), so \\(V_{k}\\) converges to \\(V^{*}\\) geometrically — every iteration shrinks the error by at least \\(\\gamma\\). Once it converges, read off the optimal policy by one greedy lookahead per state. That is the whole algorithm.

**Policy iteration** is the close cousin. It alternates two steps. *Policy evaluation*: fix a policy \\(\\pi\\), solve the linear system for \\(V^{\\pi}\\) (no \\(\\max\\), so this is tractable). *Policy improvement*: replace \\(\\pi\\) at every state with the greedy action under \\(V^{\\pi}\\). Repeat. It often converges in fewer iterations than value iteration because each policy-evaluation step makes a big jump, but each step is more expensive.

The catch on both: they need the transition model \\(P\\) and the reward function \\(R\\) up front, and they need to enumerate \\(S\\). For a 4x4 grid that is fine. For Atari pixels or board positions in Go, \\(|S|\\) is astronomically large, you do not know \\(P\\), and you have to learn from sampled experience instead. That is *model-free* RL, and Q-learning, SARSA, DQN, policy gradient, actor-critic, PPO are all answers to "how do we approximate the Bellman backup when we cannot enumerate or transition-model the world?"`,
          },
          {
            kind: 'code',
            language: 'python',
            heading: 'Value iteration on the grid-world above',
            body: `import numpy as np

ROWS, COLS = 4, 4
WALLS = {(1, 1), (2, 1)}
GOAL  = (3, 3)
STEP_COST, GOAL_REWARD = -0.04, 1.0
GAMMA, THETA = 0.9, 1e-6
ACTIONS = {'^': (-1, 0), 'v': (1, 0), '<': (0, -1), '>': (0, 1)}

def step(s, a):
    if s == GOAL:
        return s, 0.0
    dr, dc = ACTIONS[a]
    nr, nc = s[0] + dr, s[1] + dc
    if not (0 <= nr < ROWS and 0 <= nc < COLS) or (nr, nc) in WALLS:
        nr, nc = s
    r = GOAL_REWARD if (nr, nc) == GOAL else STEP_COST
    return (nr, nc), r

states = [(r, c) for r in range(ROWS) for c in range(COLS) if (r, c) not in WALLS]
V = {s: 0.0 for s in states}

while True:
    delta = 0.0
    for s in states:
        if s == GOAL: continue
        v_old = V[s]
        V[s] = max(r + GAMMA * V[ns] for ns, r in (step(s, a) for a in ACTIONS))
        delta = max(delta, abs(v_old - V[s]))
    if delta < THETA: break

policy = {s: max(ACTIONS, key=lambda a: (lambda ns, r: r + GAMMA * V[ns])(*step(s, a)))
          for s in states if s != GOAL}
print(policy[(0, 0)])   # '>'  — head right toward the goal`,
          },
          {
            kind: 'callout',
            tone: 'tip',
            body: `**\\(\\gamma\\) is the agent's patience dial.** As \\(\\gamma \\to 1\\) the agent values a reward a hundred steps from now almost as much as one right now — it will accept long detours for a bigger payoff and you get long-horizon planning. As \\(\\gamma \\to 0\\) it becomes myopic — only the immediate reward matters and the policy collapses to "grab the closest treat." Most practical work sits at \\(\\gamma \\in [0.9, 0.99]\\): patient enough to plan, low enough to keep the Bellman backup a contraction and the math finite. \\(\\gamma = 1\\) is only safe in *episodic* tasks where every trajectory is guaranteed to end.`,
          },
          {
            kind: 'callout',
            tone: 'note',
            body: `**When the Markov property breaks: POMDPs.** If the agent cannot fully observe the state — a poker player does not see their opponent's cards, a robot has noisy sensors, a dialogue agent does not see the user's intent — you have a **Partially Observable MDP**. The agent receives an observation \\(o\\) drawn from \\(O(o \\mid s)\\) instead of \\(s\\) itself, and the Markov property no longer holds over observations. The classic fix is to act on a **belief state**: a probability distribution over the true \\(s\\), updated by Bayes' rule. The belief is Markov even when the observations are not. In modern deep RL the recurrent or transformer policy plays the role of the belief — it folds the observation history into a hidden state until the Markov property is restored over that hidden state.`,
          },
          {
            kind: 'prose',
            heading: 'Where the MDP shows up in real systems',
            body: `Every famous RL result is an MDP underneath, with a different choice of \\((S, A, P, R, \\gamma)\\).

**Atari and DQN.** State is the last four pixel frames stacked. Actions are the joystick buttons. Transitions are the emulator. Reward is the game score. \\(\\gamma = 0.99\\). DQN learns \\(Q(s, a)\\) with a convolutional network instead of a table, and the Bellman backup becomes the loss \\((r + \\gamma \\max_{a'} Q_{\\theta^{-}}(s', a') - Q_{\\theta}(s, a))^{2}\\) trained on replay-buffer samples. Same recursion, sampled instead of summed.

**Robotics and PPO.** State is joint angles, velocities, sensor readings. Actions are torques — continuous, so \\(\\arg\\max_{a}\\) is impractical. The agent learns a stochastic policy \\(\\pi_{\\theta}(a \\mid s)\\) directly and updates it via the policy-gradient theorem. PPO adds a clipped objective so each gradient step cannot shove the policy too far from the previous one — the same Bellman backup, but used as a baseline for the gradient rather than a fixed-point target.

**RLHF on language models.** State is the prompt plus tokens generated so far. Actions are the next token. The transition is deterministic (the chosen token is appended). The reward is whatever the reward model thinks a human would prefer, paid only at the end of the response. \\(\\gamma\\) is close to 1 because reward is sparse and arrives many tokens later. The policy is the LLM itself; PPO updates its parameters to raise expected reward while a KL penalty stops it from drifting away from the supervised-fine-tuned base. Same five-tuple, same Bellman equation under the hood — just at the scale of a 70-billion-parameter policy and a token vocabulary as the action space.

The trick to reading any RL paper fast is to skip to the third paragraph and ask: what is \\(S\\)? what is \\(A\\)? what is \\(R\\)? Once those are pinned, the rest of the algorithm is one of a small number of standard ways to chase \\(V^{*}\\) or \\(Q^{*}\\) without enumerating \\(S\\).`,
          },
          {
            kind: 'prose',
            heading: 'What to take away',
            body: `An MDP is the universal frame for sequential decision-making: a state space \\(S\\), an action space \\(A\\), stochastic transitions \\(P(s' \\mid s, a)\\), a reward \\(R(s, a)\\), and a discount \\(\\gamma\\). The Markov property — future depends only on the present state — is the constraint that makes the recursion finite. A policy \\(\\pi(a \\mid s)\\) picks actions; the value functions \\(V^{\\pi}\\) and \\(Q^{\\pi}\\) score how good a state or state-action pair is in expected discounted reward. The Bellman equation is the fixed-point relation those values satisfy, and value iteration and policy iteration are the two textbook ways to solve it when the model is known and the state space is small.

Every model-free RL algorithm in the next lessons is a way to chase the same Bellman fixed point when you cannot enumerate \\(S\\) and do not know \\(P\\) — by sampling trajectories, approximating \\(V\\) or \\(Q\\) with a neural network, or pushing on the policy gradient directly. The vectors lesson taught you that linear algebra is one shape repeated. RL is the same — one tuple, one recursion, dressed up at a million different scales.`,
          },
          {
            kind: 'prose',
            heading: 'Intuition: discount factor as a horizon dial',
            body: `Picture the agent as a tiny accountant standing at state \\(s_{0}\\), staring down an infinite ledger of future rewards \\(r_{0}, r_{1}, r_{2}, \\dots\\). The discount \\(\\gamma\\) is the interest rate it uses to convert tomorrow's reward into today's currency. The number it actually optimises is the present value \\(G = r_{0} + \\gamma r_{1} + \\gamma^{2} r_{2} + \\dots\\). Every choice of \\(\\gamma\\) draws a different *horizon* on that ledger — the moment past which the agent stops caring.

A clean way to feel \\(\\gamma\\) is the **effective horizon** \\(H \\approx 1 / (1 - \\gamma)\\). At \\(\\gamma = 0.9\\), \\(H \\approx 10\\) steps — the agent plans about a decade of ticks ahead. At \\(\\gamma = 0.99\\), \\(H \\approx 100\\); at \\(\\gamma = 0.999\\), it stretches to a thousand. The geometric series \\(\\sum \\gamma^{t} = 1 / (1 - \\gamma)\\) blows up as \\(\\gamma \\to 1\\), and so does the variance of any Monte Carlo return estimate built from sampled trajectories. That is why \\(\\gamma = 1\\) is only safe in episodic problems where the trajectory is guaranteed to terminate — otherwise the value function diverges and the learning signal drowns in noise.

Sweep \\(\\gamma\\) on the toy three-state chain from earlier and the policy *changes shape*. Recall \\(V^{*}(B) = \\max(10, \\gamma \\cdot V^{*}(A))\\) and \\(V^{*}(A) = \\gamma \\cdot V^{*}(B)\\). At \\(\\gamma = 0\\) the agent is purely greedy: \\(V^{*}(B) = 10\\), \\(V^{*}(A) = 0\\), and from \\(B\\) it always grabs the immediate reward — no surprise. At \\(\\gamma = 0.5\\), \\(V^{*}(A) = 5\\) and the *right* action from \\(B\\) wins by \\(10\\) versus \\(0.5 \\cdot 5 = 2.5\\) — still myopic. At \\(\\gamma = 0.99\\), \\(V^{*}(A)\\) climbs to about \\(9.9\\) and the alternative branch in the max — \\(0.99 \\cdot 9.9 = 9.8\\) — almost ties the immediate \\(10\\). The agent now sees the long loop \\(B \\to A \\to B \\to C\\) as nearly as valuable as the short path. Push \\(\\gamma\\) past the point where \\(\\gamma^{2} \\cdot 10 > 10\\) — which never happens for \\(\\gamma < 1\\) on this exact chain — and the cycle would dominate. That is the lesson: \\(\\gamma\\) does not merely scale values, it *reshapes* which policy is optimal. Dial it like the focal length on a camera — short for snapshots, long for landscape planning.`,
          },
          {
            kind: 'prose',
            heading: 'Worked: Q-learning convergence on a 4-state chain',
            body: `Run Q-learning on a four-state chain \\(s_{1} \\to s_{2} \\to s_{3} \\to s_{4}\\) where \\(s_{4}\\) is terminal, the only action is *right*, every step pays \\(0\\), and entering \\(s_{4}\\) pays \\(+1\\). Discount \\(\\gamma = 0.9\\), learning rate \\(\\alpha = 0.5\\). Initialise \\(Q(s, \\text{right}) = 0\\) for every non-terminal state. The Q-learning update is

\\[
Q(s, a) \\leftarrow Q(s, a) + \\alpha \\left[\\, r + \\gamma \\max_{a'} Q(s', a') - Q(s, a) \\,\\right].
\\]

The optimal Q-values are easy to read off the geometry: \\(Q^{*}(s_{3}) = 1\\), \\(Q^{*}(s_{2}) = 0.9\\), \\(Q^{*}(s_{1}) = 0.81\\). Watch how the algorithm crawls toward them.

**Episode 1.** Start at \\(s_{1}\\). Transition \\(s_{1} \\to s_{2}\\): \\(Q(s_{1}) \\leftarrow 0 + 0.5 (0 + 0.9 \\cdot 0 - 0) = 0\\). Transition \\(s_{2} \\to s_{3}\\): \\(Q(s_{2}) \\leftarrow 0\\) — still no reward signal because no downstream Q has been updated. Transition \\(s_{3} \\to s_{4}\\): now reward \\(+1\\) lands. \\(Q(s_{3}) \\leftarrow 0 + 0.5 (1 + 0 - 0) = 0.5\\). After one episode only \\(Q(s_{3})\\) is non-zero — the credit has not propagated yet.

**Episode 2.** \\(s_{1} \\to s_{2}\\): \\(Q(s_{1}) \\leftarrow 0\\). \\(s_{2} \\to s_{3}\\): bootstrap target is \\(0 + 0.9 \\cdot 0.5 = 0.45\\). \\(Q(s_{2}) \\leftarrow 0 + 0.5 (0.45 - 0) = 0.225\\). \\(s_{3} \\to s_{4}\\): \\(Q(s_{3}) \\leftarrow 0.5 + 0.5 (1 - 0.5) = 0.75\\). The signal is walking backward one state per episode — that is the temporal-difference structure made visible.

**Episode 3.** \\(s_{1} \\to s_{2}\\): target \\(= 0.9 \\cdot 0.225 = 0.2025\\). \\(Q(s_{1}) \\leftarrow 0 + 0.5 (0.2025 - 0) = 0.10125\\). \\(s_{2} \\to s_{3}\\): target \\(= 0.9 \\cdot 0.75 = 0.675\\). \\(Q(s_{2}) \\leftarrow 0.225 + 0.5 (0.675 - 0.225) = 0.45\\). \\(s_{3} \\to s_{4}\\): \\(Q(s_{3}) \\leftarrow 0.75 + 0.5 (1 - 0.75) = 0.875\\).

After ten episodes the values are roughly \\(Q(s_{3}) \\approx 0.999\\), \\(Q(s_{2}) \\approx 0.88\\), \\(Q(s_{1}) \\approx 0.78\\) — within a percent of \\(Q^{*}\\). The error from any state decays as \\((1 - \\alpha)^{k}\\) once the downstream estimate is correct, so doubling the episodes roughly halves the gap. This is what Q-learning convergence looks like in slow motion: reward planted at the goal, bootstrap targets carrying it one step backward each pass, contraction with factor \\(\\gamma\\) guaranteeing it eventually lands on \\(Q^{*}\\).`,
          },
          {
            kind: 'prose',
            heading: 'Further reading',
            body: `- [Sutton & Barto — "Reinforcement Learning: An Introduction" (2nd ed., free PDF)](http://incompleteideas.net/book/the-book-2nd.html) — the textbook; Chapter 3 is the cleanest treatment of MDPs and the Bellman equations.
- [David Silver — UCL RL Course, Lecture 2: MDPs (YouTube)](https://www.youtube.com/watch?v=lfHX2hHRMVQ) — Silver's lecture on the same material; the video to watch alongside reading the chapter.
- [OpenAI Spinning Up — "Key Concepts in RL"](https://spinningup.openai.com/en/latest/spinningup/rl_intro.html) — the practitioner-flavoured intro: states, actions, rewards, value functions, all with code-ready notation.`,
          },
        ],
      },
      {
        slug: 'rlhf',
        title: 'RLHF',
        oneLiner: 'How GPT learned to be helpful — train a reward model from preferences, then optimize the LM against it.',
        difficulty: 'intermediate',
        readMinutes: 12,
        sections: [
          {
            kind: 'prose',
            heading: 'Why a language model needs a teacher with taste',
            body: `Pretraining a language model on a few trillion tokens of internet text produces a system that is *fluent* and *coherent* but not necessarily *helpful*. Ask a base GPT-3 to summarise an email and it will happily continue the email with three more emails. Ask it for medical advice and it will give you whatever the most statistically likely continuation says, including the confident nonsense. The objective — predict the next token — never mentioned helpfulness, honesty, or harmlessness. Those words do not exist in the cross-entropy loss from the *Cross-entropy* lesson.

RLHF is the engineering answer to that gap. The full name — Reinforcement Learning from Human Feedback — describes the trick: hire humans to rank model outputs, fit a model that predicts those rankings, then treat that predicted ranking as a reward signal and optimise the language model to maximise it. Helpfulness was unmeasurable, so we built an instrument that measures it, and then we trained against the instrument. This is the technique that turned GPT-3 into ChatGPT, Claude's helpful-honest-harmless behaviour, and every modern assistant you have used.

The reason it slots so cleanly into the previous lesson is that the language model is already an MDP policy in disguise. State is the prompt plus tokens generated so far; action is the next token; transition is deterministic (append the token); reward is whatever the reward model says about the finished response. Same five-tuple, same Bellman intuition — only now the action space is a 50k-vocabulary softmax and the policy is a 70-billion-parameter transformer.`,
          },
          {
            kind: 'prose',
            heading: "Why pure pretraining isn't enough",
            body: `A pretrained large language model is a single objective wearing a billion-parameter costume: predict the next token, given the previous ones, on a few trillion tokens of internet text. Nothing in that loss function ever mentioned helpfulness, honesty, or harmlessness. The model becomes excellent at *continuing* whatever sequence it sees, in whatever style the surrounding text suggests. That is a remarkable capability, and it is not the same thing as being useful.

Ask a base model "How do I make my code faster?" and a perfectly plausible continuation is the rest of a Stack Overflow page — a tag line, three upvotes, a comment thread, an "Answered Apr 2019" timestamp, and only then maybe an answer. The model is not refusing to help. It is doing exactly what it was trained to do: matching the distribution of pages on the web where that question appears. The format of the response is wrong because the *objective* never specified a format.

Supervised fine-tuning (SFT) gets you most of the way out of this hole. Show the model a few hundred thousand (prompt, ideal response) pairs written by trained labellers and continue to minimise next-token cross-entropy on the response tokens. The model learns the *shape* of being helpful: respond directly, answer the question asked, structure the output, stop when the answer is complete. After SFT the same prompt returns an actual answer instead of a Stack Overflow page. That gets you maybe 80% of the way to the assistant you wanted.

The remaining 20% is the part SFT cannot reach. SFT teaches the model to imitate static demonstrations, one response at a time. It never sees a *comparison*. Given two completions that are both plausible continuations of an SFT-style prompt — both fluent, both on-topic, both safe — SFT has no mechanism for saying which one is *better*. Maybe one answer is more concise. Maybe one acknowledges uncertainty where the other bluffs. Maybe one refuses a borderline request gracefully where the other refuses it rudely. These are exactly the qualities humans care about most, and they are exactly the qualities the cross-entropy loss cannot see.

RLHF closes that gap by changing the question. Instead of "imitate this one response," ask "of these two responses, which did a human prefer?" Train a reward model on the answer, then RL-train the policy to pick the response humans would have picked. The result is a model that does not just produce plausible text — it produces the response a person would, given the choice, actually rather read.`,
          },
          {
            kind: 'prose',
            heading: 'Worked: Bradley-Terry preference',
            body: `Make the abstraction concrete. A single training example for the reward model is a triple: a prompt \\(x\\), and two responses \\(A\\) and \\(B\\). A human labeller looks at both and says "A is better." That is the entire raw signal — one bit per pair.

The Bradley-Terry model assumes that every response has a hidden scalar reward \\(r(A)\\), \\(r(B)\\) — a number you cannot observe directly — and that the probability the labeller prefers \\(A\\) over \\(B\\) is a sigmoid of the *difference* in those scores:

\\[
P(A \\succ B) \\;=\\; \\sigma\\!\\bigl(r(A) - r(B)\\bigr) \\;=\\; \\frac{1}{1 + e^{-(r(A) - r(B))}}
\\]

Run the arithmetic on a few cases to build a feel for the curve. Suppose \\(r(A) = 2\\) and \\(r(B) = 0\\); then \\(r(A) - r(B) = 2\\) and \\(P(A \\succ B) = \\sigma(2) \\approx 0.88\\). A 2-point reward gap means the labeller picks \\(A\\) about 88% of the time and \\(B\\) about 12%. Not a guarantee, just a strong lean.

Flip it: \\(r(A) = 0\\), \\(r(B) = 2\\). Now \\(P(A \\succ B) = \\sigma(-2) \\approx 0.12\\), and \\(B\\) wins 88% of the time. The symmetry is exact — the sigmoid only cares about the difference, not the absolute values.

And the tied case: \\(r(A) = r(B)\\). The difference is zero, \\(\\sigma(0) = 0.5\\), the labeller is a coin flip. That is the Bradley-Terry model telling you "I have no information that distinguishes these two."

The reward model is trained to maximise the log-likelihood of the observed preferences. For one labelled pair where \\(A\\) is the chosen response and \\(B\\) is the rejected one, the loss is:

\\[
\\mathcal{L} \\;=\\; -\\log \\sigma\\!\\bigl(r(\\text{chosen}) - r(\\text{rejected})\\bigr)
\\]

Gradient descent on this loss does exactly what you would hope. The gradient pushes \\(r(\\text{chosen})\\) up and \\(r(\\text{rejected})\\) down — just enough to make the predicted probability of the observed preference larger. It does not push the gap to infinity; the sigmoid saturates, and once \\(r(\\text{chosen}) - r(\\text{rejected})\\) is large enough to explain the preference, the gradient shrinks. The model fits the *minimum* reward gap needed to account for the data, which is exactly the regularisation you want against overconfidence.`,
          },
          {
            kind: 'prose',
            heading: 'PPO and the KL leash',
            body: `Once the reward model \\(r\\) exists, an obvious move suggests itself: just sample responses from the language model, score each one with \\(r\\), and run policy gradient to maximise \\(\\mathbb{E}[r(\\text{response})]\\). Push the policy toward whatever the reward model loves.

This fails immediately in a memorable way. The reward model is a finite neural network trained on a finite dataset; it has artifacts and blind spots. The policy is a vastly more powerful optimiser, and it will find those blind spots before it finds genuinely better responses. The output is gibberish that scores high — repeated phrases the RM happens to overweight, ritual sign-offs it has learned to associate with "good" examples, syntactic patterns that exploit its hidden features. The reward number on the dashboard climbs while the actual responses get worse. This is Goodhart's law writ in tokens.

The fix is a leash. PPO maximises a modified objective that penalises the policy for moving too far from the SFT reference:

\\[
\\mathcal{J}(\\theta) \\;=\\; \\mathbb{E}\\!\\left[\\, r(\\text{response}) \\;-\\; \\beta \\cdot \\mathrm{KL}\\!\\bigl(\\pi_{\\theta}\\,\\|\\,\\pi_{\\text{SFT}}\\bigr) \\,\\right]
\\]

The KL term measures, in nats, how different the current policy's token distribution is from the frozen SFT model. \\(\\beta\\) sets how tight the leash is. Small \\(\\beta\\) lets the policy roam far from SFT in search of higher reward — and into the RM's blind spots. Large \\(\\beta\\) keeps the policy nearly identical to SFT, capturing only the cleanest preference signal. Tuning \\(\\beta\\) is the central hyperparameter of the RL stage.

Constitutional AI and RLAIF swap the expensive human-rater step for another LLM critique loop guided by a written constitution. The reward model is still Bradley-Terry; only the source of the preferences changes.

The modern alternative is DPO. It derives the optimal policy from preferences in closed form, eliminating the RL loop, the reward model, and the on-policy sampling. The KL leash is folded into the loss by construction. PPO still wins on the hardest distribution-shift problems; DPO wins on engineering simplicity and is the default first pass for most open-source alignment work.`,
          },
          {
            kind: 'prose',
            heading: 'The three-stage pipeline',
            body: `Every RLHF system, from InstructGPT to Claude to Llama-Chat, runs the same three stages in order. Each stage produces a model that the next stage builds on, and skipping one degrades the next.

**Stage 1 — Supervised fine-tuning (SFT).** Start from the pretrained base. Collect a few thousand to a few hundred thousand prompt-response demonstrations written by trained labellers. Fine-tune on this dataset with the same next-token cross-entropy loss as pretraining. The result is a model that knows the *format* of being helpful: respond to the prompt, do not just continue it; produce structured answers; obey instructions. SFT alone gets you most of the way to a usable assistant, but it caps out at "as good as the average human labeller" and cannot capture preferences the labellers find hard to articulate.

**Stage 2 — Reward model (RM).** Take the SFT model and use it to generate multiple candidate responses for a held-out set of prompts. Show pairs of responses to human labellers and ask which one is better. Train a separate model — usually the SFT model with the final softmax replaced by a single scalar head — to predict, from a (prompt, response) pair, a number that ranks the response. This is the *reward model*. It is the instrument that measures helpfulness, and it is just a classifier dressed up as a regressor.

**Stage 3 — RL fine-tuning.** Treat the SFT model as a policy. Sample responses from it on a fresh batch of prompts, score each response with the reward model, and run PPO (or DPO, or rejection sampling) to push the policy toward higher reward. To keep the model from drifting into reward-hacked nonsense, add a KL penalty that punishes it for moving too far from the SFT model in token-distribution space. The policy improves; the SFT model stays as a leash.`,
          },
          {
            kind: 'viz',
            component: 'RLHFPipelineViz',
            heading: 'The three-stage pipeline',
          },
          {
            kind: 'math',
            heading: 'The Bradley-Terry preference model',
            body: `The reward model never sees absolute scores — humans cannot reliably say "this response is a 7.3 out of 10." They can reliably say "A is better than B." The Bradley-Terry model turns those pairwise judgements into a scalar reward function.

For two responses \\(y_{A}\\) and \\(y_{B}\\) to the same prompt \\(x\\), the probability a labeller prefers \\(A\\) is modelled as a sigmoid of the *difference* in scalar rewards:

\\[
P(y_{A} \\succ y_{B} \\mid x) \\;=\\; \\sigma\\!\\bigl(r_{\\phi}(x, y_{A}) - r_{\\phi}(x, y_{B})\\bigr) \\;=\\; \\frac{1}{1 + e^{-(r_{\\phi}(x, y_{A}) - r_{\\phi}(x, y_{B}))}}
\\]

Where \\(r_{\\phi}\\) is the reward model with parameters \\(\\phi\\). Train it by maximum likelihood — equivalently, minimise the binary cross-entropy from the *Cross-entropy* lesson over the dataset of human-labelled pairs:

\\[
\\mathcal{L}_{\\text{RM}}(\\phi) \\;=\\; -\\,\\mathbb{E}_{(x, y_{w}, y_{l}) \\sim \\mathcal{D}}\\!\\left[\\, \\log \\sigma\\!\\bigl(r_{\\phi}(x, y_{w}) - r_{\\phi}(x, y_{l})\\bigr) \\,\\right]
\\]

\\(y_{w}\\) is the *winner* (preferred response), \\(y_{l}\\) is the *loser*. Two consequences worth noticing. First, the reward is only identified *up to a constant* — shift every \\(r(x, y)\\) by the same amount and the differences are unchanged. The reward model has no absolute zero. Second, the loss only depends on the difference, so the model learns the *relative ordering* of responses, which is what we actually wanted.`,
          },
          {
            kind: 'math',
            heading: 'The PPO objective with KL penalty',
            body: `Once the reward model is trained, the RL stage maximises expected reward with a leash. Let \\(\\pi_{\\theta}\\) be the policy (initialised from the SFT model), \\(\\pi_{\\text{ref}}\\) the frozen SFT reference, and \\(r_{\\phi}\\) the frozen reward model. The objective is:

\\[
\\mathcal{J}(\\theta) \\;=\\; \\mathbb{E}_{x \\sim \\mathcal{D},\\, y \\sim \\pi_{\\theta}(\\cdot \\mid x)}\\!\\left[\\, r_{\\phi}(x, y) \\;-\\; \\beta \\, \\mathrm{KL}\\!\\bigl(\\pi_{\\theta}(\\cdot \\mid x)\\,\\|\\,\\pi_{\\text{ref}}(\\cdot \\mid x)\\bigr) \\,\\right]
\\]

Read it as two forces. The first term *pulls* the policy toward responses the reward model loves. The second term — the KL divergence between the current policy and the SFT reference, scaled by \\(\\beta\\) — *pushes back* whenever the policy moves too far from where it started. \\(\\beta\\) is the leash length; small \\(\\beta\\) lets the policy roam, large \\(\\beta\\) keeps it close to SFT.

PPO from the *MDP* lesson plays the role of the optimizer here. It samples a batch of (prompt, response) pairs from the current policy, computes the per-token advantage from the reward (paid at the end) minus a learned value baseline, and takes a clipped gradient step:

\\[
\\mathcal{L}_{\\text{PPO}}(\\theta) \\;=\\; \\mathbb{E}\\!\\left[\\, \\min\\!\\bigl(\\rho_{t}(\\theta) \\hat{A}_{t},\\; \\mathrm{clip}(\\rho_{t}(\\theta),\\, 1-\\epsilon,\\, 1+\\epsilon)\\, \\hat{A}_{t}\\bigr) \\,\\right]
\\]

with importance ratio \\(\\rho_{t}(\\theta) = \\pi_{\\theta}(a_{t} \\mid s_{t}) / \\pi_{\\theta_{\\text{old}}}(a_{t} \\mid s_{t})\\). The clip prevents catastrophic policy jumps — the same trust-region instinct that made PPO the default in robotics, repurposed for token-by-token generation.`,
          },
          {
            kind: 'code',
            language: 'python',
            heading: 'Pairwise reward model training in PyTorch',
            body: `import torch
import torch.nn as nn
import torch.nn.functional as F

class RewardModel(nn.Module):
    """SFT transformer backbone with the final softmax replaced by a scalar head."""
    def __init__(self, base_lm, hidden_size):
        super().__init__()
        self.backbone = base_lm                   # frozen or LoRA-fine-tuned
        self.value_head = nn.Linear(hidden_size, 1, bias=False)

    def forward(self, input_ids, attention_mask):
        out = self.backbone(input_ids=input_ids, attention_mask=attention_mask,
                            output_hidden_states=True)
        last_hidden = out.hidden_states[-1]       # (B, T, H)
        # score = scalar at the final non-pad token of each sequence
        eos_idx = attention_mask.sum(dim=1) - 1   # (B,)
        last_tok = last_hidden[torch.arange(last_hidden.size(0)), eos_idx]
        return self.value_head(last_tok).squeeze(-1)  # (B,)

def bradley_terry_loss(rm, batch):
    # batch holds tokenised (prompt + winner) and (prompt + loser) pairs
    r_w = rm(batch['winner_ids'], batch['winner_mask'])
    r_l = rm(batch['loser_ids'],  batch['loser_mask'])
    # -log sigmoid(r_w - r_l) is exactly binary cross-entropy with label 1
    return -F.logsigmoid(r_w - r_l).mean()

rm = RewardModel(base_lm=sft_model, hidden_size=4096)
opt = torch.optim.AdamW(rm.parameters(), lr=5e-6, weight_decay=0.01)

for batch in preference_loader:
    loss = bradley_terry_loss(rm, batch)
    opt.zero_grad(); loss.backward(); opt.step()

# At inference: r(x, y) is just rm(tokenize(x + y)).item()
# It is unitless - only differences are meaningful.`,
          },
          {
            kind: 'callout',
            tone: 'tip',
            body: `**Tune \\(\\beta\\) before you tune anything else.** The KL coefficient is the single most important hyperparameter in the RL stage and the one teams burn the most compute getting wrong. Too small and the policy reward-hacks: it learns to emit token patterns the reward model loves but humans hate ("Certainly! Here is a thoughtful, helpful, ethical answer..." prefixed to every response). Too large and the policy barely moves — the KL leash drags it back to SFT and you spent a million dollars of compute to gain half a point on the eval. A practical recipe: start with \\(\\beta\\) chosen so the KL between policy and SFT stabilises around 5-15 nats per response, log the KL every step, and if it spikes past 30 your reward model is being gamed and you should raise \\(\\beta\\) or refresh the preference data.`,
          },
          {
            kind: 'prose',
            heading: 'Constitutional AI and RLAIF',
            body: `Human preference labels are slow, expensive, and inconsistent. Anthropic's Constitutional AI paper proposed replacing them with an AI labeller guided by a written *constitution* — a short list of principles like "the response should not be harmful" or "the response should be honest about uncertainty." The pipeline becomes RLAIF: Reinforcement Learning from AI Feedback.

It works in two phases. First, *constitutional revision*: ask the SFT model to generate a response, then ask it to critique its own response against a constitutional principle, then ask it to rewrite the response to address the critique. Train a second SFT model on the *revised* responses. Second, *AI preference modelling*: instead of humans ranking response pairs, an LLM ranks them according to constitutional principles, and the reward model is fit to those AI-generated preferences via the same Bradley-Terry loss above.

The deal you are striking: you lose some of the irreducible signal that comes from actual human judgement, but you gain three orders of magnitude in label throughput, perfect consistency, and a constitution you can audit and edit on a Tuesday afternoon. Modern frontier models use a blend — humans label the hardest, most-disagreed-on cases; the AI handles the bulk. The same machinery underneath: Bradley-Terry preferences in, KL-regularised PPO out.`,
          },
          {
            kind: 'prose',
            heading: 'DPO — when the reward model collapses into the policy',
            body: `Direct Preference Optimization (Rafailov et al., 2023) noticed something startling about the RLHF objective. The KL-regularised reward-maximisation has a known closed-form optimal policy:

\\[
\\pi^{*}(y \\mid x) \\;\\propto\\; \\pi_{\\text{ref}}(y \\mid x) \\, \\exp\\!\\bigl(\\, r(x, y) / \\beta \\,\\bigr)
\\]

Solve that for \\(r\\) — the reward is the log-ratio of optimal policy to reference, scaled by \\(\\beta\\):

\\[
r(x, y) \\;=\\; \\beta \\log \\frac{\\pi^{*}(y \\mid x)}{\\pi_{\\text{ref}}(y \\mid x)} \\;+\\; \\beta \\log Z(x)
\\]

Substitute that expression back into the Bradley-Terry loss, and the partition function \\(Z(x)\\) cancels because it appears identically in winner and loser. You are left with a loss that depends only on the *policy itself* — no separate reward model, no PPO, no sampling, no KL penalty term to schedule, no value head, no advantage estimator:

\\[
\\mathcal{L}_{\\text{DPO}}(\\theta) \\;=\\; -\\,\\mathbb{E}_{(x, y_{w}, y_{l})}\\!\\left[\\, \\log \\sigma\\!\\Bigl(\\beta \\log \\tfrac{\\pi_{\\theta}(y_{w}\\mid x)}{\\pi_{\\text{ref}}(y_{w}\\mid x)} - \\beta \\log \\tfrac{\\pi_{\\theta}(y_{l}\\mid x)}{\\pi_{\\text{ref}}(y_{l}\\mid x)}\\Bigr) \\,\\right]
\\]

This is just supervised fine-tuning on preference pairs. No reinforcement learning, no on-policy sampling, no reward-model training run. The KL leash is folded into the objective by construction. DPO has become the default first-pass alignment method for most open-source releases — Llama-3-Instruct, Mistral, Zephyr — because the engineering complexity drops by an order of magnitude. PPO still wins on the hardest distribution-shift problems where on-policy sampling matters, but for the median project DPO is the right starting point.`,
          },
          {
            kind: 'callout',
            tone: 'note',
            body: `**DPO simplifies, but does not magic away, the alignment problem.** You still need preference data — DPO does not invent it. The reference policy \\(\\pi_{\\text{ref}}\\) still has to be a competent SFT model — DPO will not turn a base LM into an assistant. And DPO is *off-policy* by construction, which is why it sometimes underperforms PPO on long-horizon or reasoning tasks where the gradient really benefits from sampling fresh responses from the current policy. The rule of thumb: try DPO first for its 10x simpler stack; reach for PPO when you have the engineering bandwidth and a measurable gap DPO cannot close.`,
          },
          {
            kind: 'prose',
            heading: 'Failure modes — reward hacking, sycophancy, mode collapse',
            body: `RLHF is an optimisation against a *learned* reward, and Goodhart's law shows up every time you push hard enough. Three signatures to recognise.

**Reward hacking.** The reward model is a finite neural network trained on a finite preference dataset; it has blind spots. PPO will find them. The classic example: a reward model trained mostly on short Q&A starts to overweight superficial markers of helpfulness — bullet points, hedged language, "I hope this helps!" sign-offs. The policy learns to staple those markers to every response, the reward shoots up, and the human evaluators looking at the actual outputs say "why is it so smarmy?" The KL penalty is the first line of defence — it stops the policy from drifting into adversarial regions of token space — but the durable fix is to refresh the reward model with fresh preference data sampled from the *current* policy, not the SFT model.

**Sycophancy.** A specific reward-hack worth naming. If labellers slightly prefer responses that agree with the user, the reward model learns "agree more"; PPO optimises against it; the resulting model tells the user what they want to hear, even when wrong. This is a labelling problem, not an algorithmic one — the fix is to deliberately seed the preference dataset with cases where the better response *contradicts* the user, and to red-team the model with leading prompts.

**Mode collapse.** PPO with a soft KL leash can cause the policy distribution to sharpen — the entropy of \\(\\pi_{\\theta}(\\cdot \\mid x)\\) drops, the model starts producing nearly the same response to slight variations of the same prompt, and creative tasks like fiction-writing or brainstorming get noticeably worse. Watch the per-token entropy during training; if it falls below half its SFT value, raise \\(\\beta\\) or add an explicit entropy bonus. The *Attention* lesson covered how a transformer's softmax temperatures already concentrate probability — RLHF tends to concentrate it further, and you have to fight back.`,
          },
          {
            kind: 'prose',
            heading: 'Why this works at all',
            body: `Step back and look at what RLHF actually accomplishes. Pretraining gave you a model that knows the distribution of text. SFT gave you a model that knows the *format* of being helpful. The reward model converts an unmeasurable concept — helpfulness — into a real-valued differentiable function. The RL stage turns that function into gradient updates on a 70-billion-parameter policy. Each stage takes an instrument that did not exist and uses it to compress an unstructured concept into trainable signal.

The reason it generalises beyond the preference dataset is that the reward model is itself a deep network: it does not memorise pairs, it learns latent features of "what makes a good response." When the policy explores a new region of token space, the reward model has an opinion about it, and that opinion mostly transfers from the training distribution. The KL leash is what keeps the exploration inside the region where that opinion is trustworthy.

The connection to the *MDP* lesson is exact. RLHF *is* an MDP — sparse-reward, deterministic-transition, action-space-equals-vocabulary, policy-equals-LLM — solved by PPO with a learned reward function and a KL-regularised objective. The same Bellman intuition that values a state by its discounted future reward is doing the work, applied to a state space the size of every prompt prefix and an action space the size of a tokenizer. The fact that the same five-tuple frame fits a 4x4 grid world *and* aligning a 70-billion-parameter chatbot is exactly the kind of repetition the *Vectors* lesson promised.`,
          },
          {
            kind: 'prose',
            heading: 'What to take away',
            body: `RLHF is a three-stage pipeline that converts unstructured human preferences into trainable gradient signal. SFT teaches the model the format of helpfulness on demonstration data. A reward model trained on pairwise Bradley-Terry preferences turns "A is better than B" labels into a scalar function \\(r(x, y)\\) that ranks responses. PPO — or DPO when you want to skip the RM and on-policy sampling — pushes the policy toward higher reward while a KL penalty keeps it close to the SFT reference, preventing reward hacking.

Constitutional AI and RLAIF replace expensive human labelling with AI-generated preferences guided by a written constitution, trading some signal quality for label throughput and consistency. DPO collapses the reward model into the policy via the closed-form optimum of the KL-regularised objective, eliminating the separate reward training run and the on-policy sampling loop — the modern default for open-source alignment.

The known failure modes — reward hacking, sycophancy, mode collapse — all share a root cause: the reward model is a finite approximation, and any sufficiently strong optimiser will find its blind spots. The cure is engineering discipline: refresh preferences on-policy, tune \\(\\beta\\), monitor entropy, and red-team adversarially. Underneath the engineering, the whole system is the same MDP from the previous lesson with the same Bellman intuition — just at the scale of every assistant you talk to.`,
          },
          {
            kind: 'prose',
            heading: 'Further reading',
            body: `- [Ouyang et al. — InstructGPT paper](https://arxiv.org/abs/2203.02155) — "Training language models to follow instructions with human feedback"; the 2022 OpenAI paper that turned RLHF into the default alignment recipe.
- [Hugging Face — "Illustrating Reinforcement Learning from Human Feedback"](https://huggingface.co/blog/rlhf) — Lambert, Castricato, von Werra, Havrilla's diagram-led tour of the three RLHF stages, with library pointers.
- [Rafailov et al. — DPO paper](https://arxiv.org/abs/2305.18290) — "Direct Preference Optimization: Your Language Model is Secretly a Reward Model"; the closed-form move that eliminates the separate reward model and the PPO loop.`,
          },
        ],
      },
    ],
  },
  numerical: {
    title: 'Numerical Methods',
    oneLiner: 'Floating-point gotchas, root finding, ODE solvers, FFT — the "why is my loss NaN" toolkit.',
    iconName: 'Network',
    lessons: [
      {
        slug: 'floating-point',
        title: 'Floating point',
        oneLiner: 'Why 0.1 + 0.2 ≠ 0.3, and why your loss randomly becomes NaN.',
        difficulty: 'intermediate',
        readMinutes: 10,
        sections: [
          {
            kind: 'prose',
            heading: 'Computers do not store real numbers',
            body: `A real number has infinitely many digits. A computer has finitely many bits. Something has to give, and the thing that gives is exactness. Every floating-point number you have ever printed is an *approximation* of the value you wrote down in code — close enough that you usually do not notice, and exactly far enough off to ruin a training run when you do not pay attention.

The vectors lesson built up the picture of numbers as points in \\(\\mathbb{R}^n\\) — a clean, continuous space where addition is associative and \\(0.1 + 0.2\\) equals \\(0.3\\). Floating point is the *engineering compromise* that lets you do arithmetic on those numbers at GPU speed, and it breaks every one of those clean algebraic properties at the seams. Addition is no longer associative. Subtraction can wipe out every meaningful digit you had. The number line is no longer uniform. Two values you wrote as equal in source code might not be equal once they hit the FPU.

Everything in this lesson is one paid lesson: the rules of arithmetic you learned in school *do not hold* on a computer, and the gap between school rules and silicon rules is exactly where your NaN-shaped bugs live.`,
          },
          {
            kind: 'prose',
            heading: "What floats can't represent",
            body: `IEEE 754 single precision packs a real number into exactly 32 bits: 1 sign bit, 8 exponent bits, 23 mantissa bits. That gives you \\(2^{32}\\) — roughly 4.3 billion — distinct representable values. Sounds like a lot. It is not, once you understand how those values are *distributed* across the real line.

The representable floats are not evenly spaced. They are densest near zero and sparsest near \\(\\pm\\infty\\). Half of all fp32 values live in the interval \\([-2, 2]\\); the other half are spread across everything from \\(\\pm 2\\) out to \\(\\pm 3.4 \\times 10^{38}\\). Inside any binade \\([2^k, 2^{k+1})\\) there are exactly \\(2^{23}\\) representable numbers, regardless of \\(k\\). The interval gets wider, the count stays fixed, so the gap between neighbours doubles every time you cross a power of two.

Near \\(1.0\\), the gap between consecutive floats is \\(2^{-23} \\approx 1.19 \\times 10^{-7}\\). Comfortably finer than you need for almost anything.

Near \\(10^{6}\\), the gap is already about \\(0.06\\). You cannot represent every integer in that range as a float — the integer \\(16{,}777{,}217 = 2^{24} + 1\\) rounds to \\(2^{24}\\) in fp32. Counter goes up by one, the stored value does not change.

Near \\(10^{9}\\), the gap is about \\(64\\). Adding \\(1\\) to \\(10^{9}\\) in fp32 returns \\(10^{9}\\). The +1 falls into the gap between two representable values and is silently rounded away. No exception, no warning — the line of code ran successfully and accomplished nothing.

This is why gradient accumulation across thousands of steps in fp32 starts to lie when the running sum grows large. Why frame counters in long-running simulations stop incrementing. Why Adam's second-moment estimate stalls once it exceeds a few million. Why a learning-rate schedule that subtracts a tiny constant from a large weight has no effect after a certain point. The arithmetic looks correct; the precision is gone.`,
          },
          {
            kind: 'prose',
            heading: 'Worked: 0.1 + 0.2 != 0.3',
            body: `The most famous floating-point surprise has a precise mechanical explanation. Walk through it once and you will never forget it.

Start with \\(0.1\\) in binary. In base 2, the fraction \\(1/10\\) is \\(0.0001100110011001100\\ldots\\) — the pattern \`0011\` repeats forever, just like \\(1/3 = 0.333\\ldots\\) repeats forever in base 10. Neither fp32 nor fp64 can store an infinite repeating expansion, so the hardware truncates and rounds to the nearest representable value.

In fp32, the nearest float to \\(0.1\\) is approximately \\(0.10000000149011612\\). Already wrong, in the eighth decimal place.

In fp32, the nearest float to \\(0.2\\) is approximately \\(0.20000000298023224\\). Same kind of error, twice as large because \\(0.2\\) sits in the next binade up and the local gap is bigger.

Add them. The result is approximately \\(0.30000000447034836\\) — the two rounding errors compound, plus a final rounding to fit the sum back into fp32.

In fp32, the nearest float to \\(0.3\\) is approximately \\(0.30000001192092896\\). Different rounding direction, different magnitude of error, because \\(0.3\\) has its own incompatible binary expansion.

Compare the two bit patterns: \\(0.30000000447\\) versus \\(0.30000001192\\). They differ. The CPU's equality comparator returns \`False\`. Every floating-point implementation on every platform agrees that \`0.1 + 0.2 == 0.3\` is \`False\`, and they are all correct.

The right comparison is \`abs(a - b) < eps\` for some tolerance \\(\\varepsilon\\) — typically \\(10^{-6}\\) for fp32, \\(10^{-9}\\) for fp64, or use \`math.isclose\` which handles relative and absolute tolerance simultaneously. The wrong instinct is to "fix" the inputs by rounding; the inputs are not the problem, the *representation* is.`,
          },
          {
            kind: 'prose',
            heading: 'When precision actually matters in ML',
            body: `Most ML code tolerates fp32's rounding error without complaint. The trouble starts when you drop to lower precision for speed or when the algorithm itself amplifies small errors.

**Training in fp16 — gradient underflow.** The smallest positive fp16 value is about \\(6 \\times 10^{-8}\\). Many real gradients in late-stage training — softmax outputs near saturation, regularized weight updates, attention scores after softmax — produce values well below that threshold. They underflow to zero. The corresponding parameter stops learning, silently, while training appears healthy.

**Fix: loss scaling.** Multiply the loss by a large constant — typically \\(2^{16}\\) or higher — before \`backward()\`. By chain rule, every gradient is multiplied by the same constant, lifting them out of the fp16 underflow zone. After the backward pass, divide the gradients by the same constant before the optimizer step. The math is unchanged; the representable range is shifted up. PyTorch's \`GradScaler\` does this automatically and dynamically — it watches for overflows and adjusts the scale.

**BF16 (bfloat16) — the modern default.** Same 8 exponent bits as fp32, only 7 mantissa bits. Dynamic range \\(\\approx 10^{-38}\\) to \\(10^{38}\\), same as fp32. Precision is worse — roughly 2-3 decimal digits — but the range means gradients almost never underflow or overflow, so no loss scaling is needed. Modern GPUs (A100, H100, TPUs) train large models in bf16 by default. The lower precision is rarely the bottleneck; the easier engineering is decisive.

**Mixed-precision training.** Store the master weights in fp32 (for accurate accumulation of small updates), run the forward and backward passes in bf16 or fp16 (for speed), accumulate matmul outputs back into fp32 inside the GPU tensor cores. Best of both worlds: fp32 accuracy on the bookkeeping, low-precision speed on the bulk arithmetic.

**Inference quantization.** Once a model is trained, you can often quantize weights to int8 — a 4x memory reduction and a 2-4x speedup on inference hardware. Most production LLMs are served quantized to int8 or int4 with calibration. Training in low precision is hard; *inference* in low precision is increasingly the default.`,
          },
          {
            kind: 'math',
            heading: 'IEEE 754 single precision (fp32), bit by bit',
            body: `IEEE 754 single precision — what NumPy calls \`float32\` and PyTorch calls \`torch.float32\` — packs a real number into 32 bits, split into three fields:

\\[
\\underbrace{s}_{1\\text{ bit}} \\;\\;\\; \\underbrace{e_7 e_6 \\cdots e_0}_{8\\text{ bits (exponent)}} \\;\\;\\; \\underbrace{m_{22} m_{21} \\cdots m_0}_{23\\text{ bits (mantissa)}}
\\]

The value it represents is

\\[
x = (-1)^s \\;\\cdot\\; 1.m_{22} m_{21} \\cdots m_0 \\;\\cdot\\; 2^{e - 127}
\\]

Three pieces:

1. **Sign** \\(s\\) — one bit. \\(0\\) for positive, \\(1\\) for negative.
2. **Exponent** \\(e\\) — eight bits, stored *biased* by \\(127\\). The stored \\(e\\) ranges from \\(0\\) to \\(255\\); the actual exponent is \\(e - 127\\), so it ranges from \\(-126\\) to \\(+127\\) for normal numbers. Two reserved values: \\(e = 0\\) flags zero or *subnormals* (numbers smaller than \\(2^{-126}\\)), and \\(e = 255\\) flags \\(\\pm\\infty\\) and \\(\\text{NaN}\\).
3. **Mantissa** \\(m\\) — 23 bits encoding the fractional part of a number that always starts with an implicit leading \\(1\\) (for normals). So 23 stored bits give you 24 effective bits of precision.

The number of digits of decimal precision you actually get is roughly \\(\\log_{10}(2^{24}) \\approx 7.22\\). That is why fp32 is sometimes described as "seven decimal digits" — past the seventh digit you are reading noise.

The smallest gap between consecutive fp32 numbers *at \\(1.0\\)* is called the **machine epsilon**:

\\[
\\varepsilon_{\\text{fp32}} = 2^{-23} \\approx 1.1920929 \\times 10^{-7}
\\]

This is the smallest positive number such that \\(1.0 + \\varepsilon \\ne 1.0\\) in fp32. Add anything smaller than \\(\\varepsilon\\) to \\(1.0\\) and it disappears. The same idea, written differently for fp64: \\(\\varepsilon_{\\text{fp64}} = 2^{-52} \\approx 2.22 \\times 10^{-16}\\) — about nine orders of magnitude finer.`,
          },
          {
            kind: 'code',
            language: 'python',
            heading: 'The classic surprise',
            body: `# the example every numerical-methods course opens with
print(0.1 + 0.2)              # 0.30000000000000004
print(0.1 + 0.2 == 0.3)       # False

# neither 0.1 nor 0.2 nor 0.3 is exactly representable in binary
# they are all infinite repeating fractions in base 2, just like 1/3 is in base 10
# the rounding error after summing two of them does not match the rounding error of the third

from decimal import Decimal
print(Decimal(0.1))           # 0.1000000000000000055511151231257827021181583404541015625
print(Decimal(0.2))           # 0.200000000000000011102230246251565404236316680908203125
print(Decimal(0.3))           # 0.1499999999999999944488848768742172978818416595458984375 * 2

# moral: never use == on floats. always use a tolerance:
import math
print(math.isclose(0.1 + 0.2, 0.3))                                   # True
print(math.isclose(0.1 + 0.2, 0.3, rel_tol=1e-9, abs_tol=1e-12))      # True`,
          },
          {
            kind: 'viz',
            component: 'FloatSpacingViz',
            heading: 'Float spacing is not uniform — drag the cursor across the log axis',
            caption: 'fp32 representable values are dense near 0 and sparse at large magnitudes. The gap doubles with every binade — flip to fp64 to see the precision floor drop by ~2^29.',
          },
          {
            kind: 'prose',
            heading: 'Why density matters in ML',
            body: `Two consequences of the non-uniform spacing show up constantly in deep learning.

**Small numbers have plenty of room.** Gradients that come out at \\(10^{-6}\\) are still resolved at full fp32 precision — there are still about \\(2^{23}\\) representable values between \\(10^{-6}\\) and \\(10^{-5}\\). This is why "tiny" gradient updates can still nudge weights in a meaningful direction. The optimizer is not lying when it says it moved a weight by \\(3 \\times 10^{-7}\\); fp32 has the resolution to register that move at parameter magnitudes near zero.

**Large numbers lose resolution fast.** At magnitude \\(10^{6}\\), the gap between consecutive fp32 numbers is already about \\(0.12\\). At \\(10^{8}\\) it is about \\(15\\). Add 1 to a fp32 number near \\(10^{8}\\) and the result is the same number you started with — the +1 fell into the gap and was rounded away. This is the failure mode behind running counters or sums in fp32 instead of fp64: after enough increments the counter stops moving. It is also the failure mode that bites Adam's running-average state when \\(\\beta_2\\) is too close to 1 — the moving second moment grows large enough that small new gradients cannot perturb it.

The mental model: fp32 is **logarithmic**, not linear. Each binade (range \\([2^k, 2^{k+1})\\)) contains the same number of representable values, regardless of \\(k\\). You get the same *relative* precision everywhere — about 7 decimal digits — but the *absolute* precision varies by 70+ orders of magnitude across the representable range.`,
          },
          {
            kind: 'code',
            language: 'python',
            heading: 'fp16, fp32, fp64 — what each one costs you',
            body: `import numpy as np

# same value, three precisions
x16 = np.float16(0.1)
x32 = np.float32(0.1)
x64 = np.float64(0.1)

print(f"fp16: {x16:.20f}")    # 0.09997558593750000000
print(f"fp32: {x32:.20f}")    # 0.10000000149011611938
print(f"fp64: {x64:.20f}")    # 0.10000000000000000555

# machine epsilon: smallest e such that 1 + e != 1
print(np.finfo(np.float16).eps)   # 0.000977   (~9.77e-4)   -- only 3 decimal digits
print(np.finfo(np.float32).eps)   # 1.1920929e-07           -- ~7 decimal digits
print(np.finfo(np.float64).eps)   # 2.220446049250313e-16   -- ~15 decimal digits

# what the dynamic range looks like
print(np.finfo(np.float16).max)   # 65504               -- overflows trivially in attention scores
print(np.finfo(np.float32).max)   # 3.4028235e+38
print(np.finfo(np.float64).max)   # 1.7976931348623157e+308

# bfloat16 (bf16): same 8-bit exponent as fp32, only 7 mantissa bits
# huge dynamic range, terrible precision — but training-friendly because activations rarely overflow
# bf16 dynamic range matches fp32; precision is ~3 decimal digits.`,
          },
          {
            kind: 'prose',
            heading: 'Catastrophic cancellation — the silent killer',
            body: `Subtracting two nearly-equal floats does not just lose precision. It can **erase every meaningful digit you had**. This is *catastrophic cancellation*, and it is the single most common cause of "my numerical code returned garbage but did not crash."

The mechanism: suppose \\(a = 1.0000001\\) and \\(b = 1.0000000\\), both stored in fp32. Each has 7 decimal digits of precision, so the trailing \`1\` in \\(a\\) is right at the edge of resolution — possibly already a little wrong. When you compute \\(a - b\\), the leading six digits cancel exactly, leaving \\(10^{-7}\\) — but every digit in that result came from the noisy tail of \\(a\\). You wrote a subtraction expecting 7 digits of precision; you got back something with **zero** reliable digits. The number looks fine; it is wrong.

Real ML places where this bites: computing \\((x - \\bar{x})^2\\) for variance when \\(x \\approx \\bar{x}\\), computing \\(\\log(1 + p) - \\log(p)\\) for small \\(p\\) instead of using \\(\\log(1/p + 1)\\), computing differences of cosines or of nearby probabilities, computing finite-difference gradients with too small a step size. In every case the fix is to *rearrange the math* so the subtraction never happens — Welford's online variance, \\(\\text{log1p}\\), trigonometric identities, automatic differentiation instead of finite differences.`,
          },
          {
            kind: 'code',
            language: 'python',
            heading: 'Catastrophic cancellation — sum of cosines',
            body: `import numpy as np

# compute sum of cos(k * h) for many small angles, then subtract n
# analytically: sum_{k=1..n} cos(k*h) - n is small but well-defined
# numerically: the cosines are all ~1, so we are summing nearly-1s and subtracting n

n = 10_000_000
h = 1e-8

cosines_fp32 = np.cos(np.arange(1, n + 1, dtype=np.float32) * np.float32(h))
cosines_fp64 = np.cos(np.arange(1, n + 1, dtype=np.float64) * h)

# naive: sum then subtract n
naive_fp32 = cosines_fp32.sum() - np.float32(n)
naive_fp64 = cosines_fp64.sum() - n

# safer: use the identity  cos(x) - 1 = -2 * sin(x/2)^2
# now every term is small and accurate, no cancellation
safer_fp32 = (-2 * np.sin(np.arange(1, n + 1, dtype=np.float32) * np.float32(h) / 2) ** 2).sum()
safer_fp64 = (-2 * np.sin(np.arange(1, n + 1, dtype=np.float64) * h / 2) ** 2).sum()

print(f"naive  fp32: {naive_fp32:.6e}")    # garbage — most digits cancelled
print(f"naive  fp64: {naive_fp64:.6e}")    # acceptable
print(f"safer  fp32: {safer_fp32:.6e}")    # correct to ~6 sig figs
print(f"safer  fp64: {safer_fp64:.6e}")    # correct to ~14 sig figs

# moral: do not subtract nearly-equal numbers. rewrite the expression so the cancellation
# happens analytically (on paper), and let the computer evaluate the rearranged form.`,
          },
          {
            kind: 'prose',
            heading: 'Overflow, underflow, NaN — and how NaN spreads',
            body: `Three failure modes get their own bit patterns at the top of the IEEE 754 range.

**Overflow** happens when a result is larger than \\(\\text{max} \\approx 3.4 \\times 10^{38}\\) for fp32 (or \\(65504\\) for fp16). The result becomes \\(+\\infty\\). Subsequent arithmetic mostly respects infinity (\\(\\infty + 1 = \\infty\\), \\(\\infty \\cdot 2 = \\infty\\)) but \\(\\infty - \\infty = \\text{NaN}\\), \\(\\infty / \\infty = \\text{NaN}\\), and \\(0 \\cdot \\infty = \\text{NaN}\\). In practice: \`exp(x)\` for \`x > 88\` overflows in fp32; \`exp(x)\` for \`x > 11\` overflows in fp16. This is why softmax of unscaled attention scores blows up in fp16 — and why mixed-precision training keeps the softmax in fp32.

**Underflow** is the opposite. A result smaller than \\(\\text{min normal} \\approx 1.18 \\times 10^{-38}\\) for fp32 either drops into the subnormal range (still representable, lower precision) or rounds to zero. In ML this is mostly an issue for \`exp(-x)\` of large positive \`x\`, for products of many small probabilities, and for very small gradients in fp16 — they vanish silently and the affected weight stops updating.

**NaN** is "not a number" — the bit pattern returned by any operation that has no sensible answer: \\(0 / 0\\), \\(\\sqrt{-1}\\), \\(\\log(-1)\\), \\(\\infty - \\infty\\). NaN has one essential property: it **infects everything it touches**. \\(\\text{NaN} + 1 = \\text{NaN}\\), \\(\\text{NaN} \\cdot 0 = \\text{NaN}\\), \\(\\text{NaN} > 0\\) is \`False\` and \\(\\text{NaN} < 0\\) is also \`False\` (it is unordered with respect to every other value). One NaN gradient anywhere in your model contaminates the entire weight update, and the next forward pass returns NaN for every loss in the batch.

The propagation is why "my loss became NaN at step 47214" is so frustrating to debug: by the time you noticed, the weights have been NaN-poisoned for thousands of steps and the original triggering operation is long gone. The usual culprits: \`log(0)\` from an unclipped softmax output, \`0 / 0\` from an unmasked padding token in attention, \`sqrt\` of a slightly-negative variance estimate, \`exp\` of an oversized logit, or gradient explosion that exceeded fp16's range.`,
          },
          {
            kind: 'math',
            heading: 'The log-sum-exp trick',
            body: `Softmax of a vector \\(z = [z_1, \\ldots, z_n]\\) is

\\[
\\text{softmax}(z)_i = \\frac{e^{z_i}}{\\sum_j e^{z_j}}
\\]

In fp32, any \\(z_i > 88\\) overflows \\(e^{z_i}\\) to \\(\\infty\\). In fp16, any \\(z_i > 11\\) does. Modern attention layers routinely produce logits in the hundreds before scaling — this is not a theoretical worry.

The fix is the **log-sum-exp trick**: subtract the maximum logit before exponentiating.

\\[
\\text{softmax}(z)_i = \\frac{e^{z_i - m}}{\\sum_j e^{z_j - m}}, \\qquad m = \\max_j z_j
\\]

Algebraically the \\(e^{-m}\\) factor cancels top and bottom — same answer. Numerically the largest exponent is now exactly \\(0\\), so \\(e^{z_i - m} \\le 1\\) always. No overflow, ever. The smallest exponents may still underflow to \\(0\\), but that is fine — those terms contribute negligibly to the sum anyway.

The same identity underlies the **log-sum-exp** function

\\[
\\text{logsumexp}(z) = \\log \\sum_j e^{z_j} = m + \\log \\sum_j e^{z_j - m}
\\]

which is what cross-entropy losses use under the hood to avoid taking \\(\\log\\) of an underflowed softmax. Always use \`torch.nn.functional.log_softmax\` and \`torch.nn.CrossEntropyLoss\` together; never compute \`log(softmax(z))\` manually unless you enjoy debugging NaN.`,
          },
          {
            kind: 'callout',
            tone: 'tip',
            body: `**Always use log-sum-exp for softmax stability.** If you ever find yourself writing \`F.softmax(x); ... torch.log(p)\`, stop and rewrite as \`F.log_softmax(x)\`. The two-step version overflows on the exp and underflows on the log; the fused version handles both internally with the max-subtraction trick. Same algebra, completely different numerics. This single substitution prevents most "loss became inf then NaN" failures in language-model training.`,
          },
          {
            kind: 'prose',
            heading: 'fp16, bf16, fp8 — the mixed-precision tradeoffs',
            body: `Modern GPUs run much faster on 16-bit floats than on 32-bit. The catch is that the two common 16-bit formats trade different things away.

**fp16 (IEEE 754 half precision):** 1 sign + 5 exponent + 10 mantissa. Dynamic range \\([-65504, 65504]\\), about 3 decimal digits of precision. *Cheap to compute, easy to overflow.* Attention scores and exponentials routinely blow past 65504. Mixed-precision training (PyTorch \`autocast\`, NVIDIA Apex) keeps the matmuls in fp16 but the loss, softmax, and master weight copy in fp32, plus a *gradient scaler* that multiplies the loss by a large constant before backprop and divides it out before applying the update — keeping small gradients out of the underflow zone.

**bf16 (bfloat16):** 1 sign + 8 exponent + 7 mantissa. Same exponent range as fp32, far less precision. Dynamic range \\(\\approx [-3.4 \\times 10^{38}, 3.4 \\times 10^{38}]\\), about 2 decimal digits of precision. *Almost never overflows, never needs a gradient scaler.* This is why Google's TPUs and the H100 generation onward default to bf16 for training — the convergence behaviour is closer to fp32 in practice, and the engineering is dramatically simpler. The cost is that bf16 is a poor choice for *inference* on small models where the lower precision shows up as visible quality loss.

**fp8 (E4M3 and E5M2):** 1 sign + 4 or 5 exponent + 3 or 2 mantissa. Two formats because no single 8-bit layout handles both gradients (need range) and activations (need precision) well. *Cutting-edge as of H100/B200.* Used with per-tensor scaling factors and sometimes per-block scales. About 1 decimal digit of precision. Training stability requires careful loss scaling, careful tensor-by-tensor format choice, and accumulating matmul outputs back into fp32 for the addition step.

The rule of thumb: bf16 if your hardware supports it (it is the easiest), fp16 with a grad scaler if it does not, fp8 only if you are pushing for the very largest models and have a team that can debug numerical issues. Mixed-precision is almost always 2-3x faster than pure fp32 and uses half the memory; the engineering is worth it.`,
          },
          {
            kind: 'callout',
            tone: 'note',
            body: `**Kahan summation when you really cannot afford the error.** When you must sum a huge array in fp32 without falling back to fp64, *Kahan summation* (also called *compensated summation*) keeps a running correction term that absorbs the low-order bits lost at each addition. Cost: roughly 4x the arithmetic of a naive sum. Benefit: error grows like \\(O(\\varepsilon)\\) instead of \\(O(n \\varepsilon)\\). NumPy's \`np.sum\` uses *pairwise summation* (a divide-and-conquer variant with \\(O(\\varepsilon \\log n)\\) error) as a cheaper compromise — this is why \`arr.sum()\` is more accurate than a hand-written \`for\` loop. If you are writing custom reductions in CUDA, this is the trick the framework authors are doing for you.`,
          },
          {
            kind: 'prose',
            heading: 'Common ML bugs and their floating-point roots',
            body: `Almost every "training mysteriously diverged" or "loss is NaN" bug traces back to one of a small handful of patterns. Knowing the patterns lets you skip the bisection and go straight to the fix.

**\`log(0)\`** — taking the log of a probability that was zero or rounded to zero. Happens in cross-entropy when a class probability underflows, in policy-gradient RL when a deterministic policy produces an unexplored action, in NLL losses on padded tokens. *Fix:* clip probabilities to \`[eps, 1 - eps]\` before \`log\`, or use \`log_softmax\` + \`nll_loss\` instead of computing the log yourself.

**Divide-by-zero** — most often in normalization (dividing by a variance that came out exactly zero), in importance-sampling weights, in attention scores after a fully-masked row. *Fix:* add a small \`eps\` (typically \`1e-8\` for fp32, \`1e-5\` for fp16) to the denominator: \\(x / (\\sigma + \\varepsilon)\\). Every \`LayerNorm\` and \`BatchNorm\` implementation does this.

**\`exp(huge)\`** — softmax overflow as described above; also \`exp\` in Boltzmann distributions, in Gaussian likelihoods with tiny variance. *Fix:* log-sum-exp, or work in log-space throughout and never exponentiate.

**NaN propagation** — once a NaN is introduced, every downstream gradient is NaN, every weight update wipes a parameter. *Fix:* turn on \`torch.autograd.set_detect_anomaly(True)\` during development (slow but pinpoints the first NaN op), check gradient norms at each step in production, and *abort the batch* on NaN rather than applying the update.

**Gradient \\(\\to\\) NaN** — usually exploding gradients (norm growing without bound) or fp16 overflow. *Fix:* gradient clipping (\`torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)\`), a lower learning rate, a warmup schedule, or switching to bf16.`,
          },
          {
            kind: 'code',
            language: 'python',
            heading: 'Debugging numerics in PyTorch',
            body: `import torch

# print all sig figs so you can actually see what is happening
torch.set_printoptions(precision=10, sci_mode=False)

# during a suspect training step, check gradient norms
def grad_stats(model):
    total_sq = 0.0
    nan_params = []
    for name, p in model.named_parameters():
        if p.grad is None:
            continue
        g = p.grad.detach()
        if torch.isnan(g).any() or torch.isinf(g).any():
            nan_params.append(name)
        total_sq += g.float().pow(2).sum().item()
    return total_sq ** 0.5, nan_params

# call after backward(), before optimizer.step()
total_norm, nans = grad_stats(model)
if nans:
    print(f"NaN/Inf gradient in: {nans}")
    optimizer.zero_grad()                # abort the bad update
else:
    # clip before stepping — caps the global gradient norm at 1.0
    torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
    optimizer.step()

# during development, point-of-first-NaN detector (slow but precise)
with torch.autograd.set_detect_anomaly(True):
    loss = model(x).loss
    loss.backward()
    # if a NaN is produced, PyTorch raises with a stack trace pointing at the offending op

# always-on cheap sanity check at the top of the training loop
assert torch.isfinite(loss), f"loss is {loss.item()} at step {step}"`,
          },
          {
            kind: 'prose',
            heading: 'What to take away',
            body: `Floating point is the compromise that buys you GPU-speed arithmetic at the cost of every clean algebraic property you learned in school. fp32 packs a number into 1 + 8 + 23 bits and gives you about seven decimal digits of *relative* precision — non-uniformly distributed, denser near zero. Adding numbers across very different magnitudes drops the small one. Subtracting nearly-equal numbers wipes out your precision entirely. Exponentials overflow easily; logarithms of underflowed probabilities go to \\(-\\infty\\); a single NaN poisons every downstream computation.

The fixes are old and well-known: log-sum-exp for softmax, \\(\\text{log1p}\\) and \\(\\text{expm1}\\) for small arguments, Welford for streaming variance, Kahan summation for big reductions, gradient clipping for exploding norms, mixed precision with bf16 for the speedup without the headaches. None of this is glamorous, but every percentage point of accuracy you lose to NaN-induced reruns is worth more than a percentage point of speedup. Treat floating point as a leaky abstraction you can program *around* — never assume \`a + b == b + a\` survives in production code, and you will spend dramatically less time wondering why your loss curve has a vertical asymptote at step 47214.`,
          },
          {
            kind: 'prose',
            heading: 'Further reading',
            body: `- [David Goldberg — "What Every Computer Scientist Should Know About Floating-Point Arithmetic"](https://docs.oracle.com/cd/E19957-01/806-3568/ncg_goldberg.html) — the 1991 paper that still defines the canonical reading list; rounding, ulps, IEEE 754, NaN behaviour.
- [Bartosz Ciechanowski — "Exposing Floating Point"](https://ciechanow.ski/exposing-floating-point/) — interactive visualisations of every bit pattern; the fastest way to *see* what fp32 actually represents.
- [Float Exposed (float.exposed)](https://float.exposed/0x3f800000) — a live bit-by-bit IEEE 754 inspector you can paste numbers into; the debugging tool to keep open.`,
          },
        ],
      },
      {
        slug: 'numerical-stability',
        title: 'Numerical stability',
        oneLiner: 'Why a model that works on paper crashes at iteration 47. The fp32 traps that bite you in practice.',
        difficulty: 'intermediate',
        readMinutes: 9,
        sections: [
          {
            kind: 'prose',
            heading: 'A model that works on paper is not a model that works on GPUs',
            body: `The *Floating point* lesson laid out the leaky-abstraction view of fp32: 1 + 8 + 23 bits, about seven decimal digits of *relative* precision, non-uniform spacing, infinities and NaN at the top of the range. This lesson takes those same facts and follows them into the practical question every ML engineer eventually asks at 2 a.m.: *the math is right, the code looks right, why did the loss become NaN at step 47?*

The answer is almost never a bug in the algorithm. It is almost always a sequence of operations that is correct in real arithmetic but **catastrophically wrong in floating-point arithmetic**. Catastrophic cancellation removes every digit you had. \`exp\` of a perfectly reasonable logit overflows to \\(\\infty\\). \`log\` of a probability that rounded to zero returns \\(-\\infty\\). One gradient overflows in fp16 and infects every parameter on the next backward pass.

This lesson is the field manual for the most common patterns and the standard fixes — the log-sum-exp trick, \\(\\text{log1p}/\\text{expm1}\\), clipped exponentials, fused stable losses, the right mixed-precision format for your hardware, gradient scaling, and the NaN sentinel hook that catches the problem at the first frame instead of the thousandth.`,
          },
          {
            kind: 'prose',
            heading: 'Catastrophic cancellation — the silent killer',
            body: `Subtracting two nearly-equal numbers destroys precision. The arithmetic still completes, the result is finite, the answer looks reasonable — and every leading digit has been wiped out, leaving only the rounding tails of the inputs. This is the single most common source of "the math is right but the answer is wrong" bugs in numerical code.

The textbook example: \\((1 + 10^{-16}) - 1\\). In real arithmetic the answer is exactly \\(10^{-16}\\). In fp32 the answer is **\\(0\\)** — the addition \\(1 + 10^{-16}\\) already rounded back to \\(1\\) because \\(10^{-16}\\) is far below the fp32 machine epsilon \\(\\varepsilon \\approx 1.19 \\times 10^{-7}\\), so the \\(10^{-16}\\) was discarded before the subtraction ever ran. You did not lose precision in the subtract; you lost the entire input.

The general rule is sharper than people remember: **the precision of \\(a - b\\) drops to the precision of the smaller quantity**, not the precision of the inputs. If \\(a\\) and \\(b\\) each carry seven good digits, and they agree on the leading six, the result has *one* good digit — and that one digit is noise from the rounded tail. You wrote a subtraction expecting full precision; arithmetic noise is what came back.

The ML version of this trap is everywhere. Gradient descent with a small learning rate: the update rule is \\(w_{\\text{new}} = w_{\\text{old}} - \\alpha \\cdot g\\). When \\(\\alpha \\cdot g\\) is much smaller than \\(w_{\\text{old}}\\) — say \\(w_{\\text{old}} = 0.42\\) and \\(\\alpha \\cdot g = 10^{-8}\\) — the update rounds to zero in fp16, and \\(w_{\\text{new}} = w_{\\text{old}}\\). The optimizer ran, the loss went down a hair on paper, the weight did not move. The update was **silently lost** to underflow inside the subtraction.

The fix is structural. Accumulate updates in higher precision: keep a master copy of weights in fp32, apply the optimizer step there, and cast to fp16/bf16 only for the forward pass. Every modern mixed-precision recipe does this — Apex's \`MixedPrecision\`, PyTorch's \`amp.GradScaler\`, JAX's bf16 conventions — and the reason is exactly catastrophic cancellation inside the optimizer's subtract.`,
          },
          {
            kind: 'prose',
            heading: 'Log-sum-exp — worked example',
            body: `Consider computing \\(\\log\\!\\left(\\sum_i e^{z_i}\\right)\\) directly. If the \\(z_i\\) are large — say \\(z = [1000,\\, 1001]\\) — then \\(e^{1000}\\) is roughly \\(2 \\times 10^{434}\\), which overflows fp32 (max \\(\\approx 3.4 \\times 10^{38}\\)) and overflows fp16 (max \\(65504\\)) by a margin no clipping can rescue. The naive code path returns \\(\\infty\\), the log of infinity is infinity, and your loss is now a NaN factory.

The trick is to subtract the maximum first. Walk through the example carefully.

Start: \\(z = [1000,\\, 1001]\\). Take \\(m = \\max(z) = 1001\\). Form \\(z - m = [-1,\\, 0]\\). Now exponentiate the shifted values: \\(e^{-1} \\approx 0.368\\) and \\(e^{0} = 1\\). Both fit comfortably in any precision. Sum them: \\(0.368 + 1 = 1.368\\). Take the log: \\(\\log(1.368) \\approx 0.314\\). Add back the offset: \\(1001 + 0.314 = 1001.314\\).

That is the true answer. The identity that makes it work is

\\[
\\log\\!\\sum_i e^{z_i} \\;=\\; m + \\log\\!\\sum_i e^{z_i - m}, \\qquad m = \\max_i z_i,
\\]

which is exact algebra — the \\(e^{-m}\\) factor cancels — but completely different numerics. After the shift, the largest exponent is exactly \\(0\\), so every term \\(e^{z_i - m} \\in (0, 1]\\). No overflow is possible. The smallest exponents may underflow to \\(0\\), but those terms were going to round away in real arithmetic too: a term \\(e^{-30}\\) contributes \\(10^{-13}\\) of the sum and disappears below the precision of \\(1.0\\) anyway.

This pattern lives at the heart of every probabilistic loss in deep learning. Softmax uses it. Cross-entropy uses it. Log-likelihood maximization uses it. The forward-backward algorithm in CTC and HMMs uses it. Every numerical library — NumPy (\`np.logaddexp\`, \`scipy.special.logsumexp\`), PyTorch (\`torch.logsumexp\`), JAX (\`jax.nn.logsumexp\`), TensorFlow (\`tf.math.reduce_logsumexp\`) — ships a dedicated, max-subtracted, fused-kernel version. Reaching for the library function is not a stylistic preference; it is the difference between a model that trains and a model that NaNs at step 47.`,
          },
          {
            kind: 'prose',
            heading: 'Modern fp16 / bf16 mixed-precision training',
            body: `The two 16-bit formats that matter today are fp16 and bf16, and the difference between them is entirely in the exponent. fp16 spends its 16 bits as 1 sign + 5 exponent + 10 mantissa, giving a representable range of roughly \\([-65504,\\, +65504]\\). That is a *very limited* dynamic range — gradients of magnitude \\(10^{-8}\\) underflow to zero, and a single gradient spike above \\(65504\\) overflows to \\(\\infty\\). The 10-bit mantissa does give fp16 about three good decimal digits of precision, which is more than bf16 — but precision is rarely the binding constraint in deep learning.

bf16 spends the same 16 bits as 1 sign + 8 exponent + 7 mantissa. The 8-bit exponent matches fp32 exactly, so bf16's range is roughly \\([-3.4 \\times 10^{38},\\, +3.4 \\times 10^{38}]\\) — the same enormous \\(\\sim 10^{\\pm 38}\\) reach as fp32. The cost is a 7-bit mantissa, which gives only about three decimal digits of precision. For gradient arithmetic that constantly spans \\(10^{-8}\\) to \\(10^{6}\\), that tradeoff is overwhelmingly correct: range matters more than the last bit of precision.

Mixed precision is the standard recipe. The forward pass runs in fp16 or bf16 to use the fast tensor-core matmuls. Gradients are stored in fp16 or bf16 for the same reason. Master weights are kept in fp32, and the optimizer update — \\(w_{\\text{new}} = w_{\\text{old}} - \\alpha \\cdot g\\) — runs in fp32 to avoid the catastrophic-cancellation underflow from the previous section. The cast back to fp16/bf16 happens only when the next forward pass needs the weights.

Loss scaling is the fp16-specific workaround for the range problem. Multiply the loss by \\(2^{16}\\) before \`.backward()\`, so the gradients ride out of fp16's underflow zone, then divide the gradients by \\(2^{16}\\) before applying the optimizer step. PyTorch's \`torch.cuda.amp.GradScaler\` automates this with dynamic adjustment.

bf16 does not need loss scaling at all — its huge dynamic range matches fp32, so gradients never underflow and never overflow. That is why bf16 has become the default for modern training on A100 and H100 / B200 hardware: same speed as fp16, none of the loss-scaling headache, training curves that match fp32 within noise.`,
          },
          {
            kind: 'prose',
            heading: 'Catastrophic cancellation, in one paragraph',
            body: `The classic trap: subtract two numbers that agree to six digits, and your seven-digit float has *one digit* of meaningful result left — and that one digit is the noisy tail of the inputs. \\(1.0000001 - 1.0000000\\) in fp32 returns something near \\(10^{-7}\\), but the leading bit of that answer came from the rounded edge of the inputs, not from any real signal. You wrote a subtraction expecting full precision; you got back arithmetic noise that *looks fine* because the result is finite, small, and non-NaN.

The rule of thumb is brutal but reliable: **never subtract two numbers that are nearly equal.** Rearrange the expression on paper first. If your formula reduces to \\(a - b\\) with \\(a \\approx b\\), use a trig identity, a series expansion, or a library helper (\\(\\text{log1p}\\), \\(\\text{expm1}\\), \\(\\text{hypot}\\), Welford's variance) that absorbs the cancellation into a single fused operation. The fix lives at the level of *the math you write*, not at the level of *the float you store*.`,
          },
          {
            kind: 'math',
            heading: 'The log-sum-exp identity — why \\(\\log\\,\\text{softmax}\\) is safe',
            body: `Softmax of a vector \\(z = [z_1, \\ldots, z_n]\\) is the distribution

\\[
p_i = \\frac{e^{z_i}}{\\sum_j e^{z_j}}.
\\]

The cross-entropy loss with target index \\(t\\) is \\(\\mathcal{L} = -\\log p_t\\). Naively that means computing \\(p_t\\), then taking its log — two operations, two chances to overflow or underflow. The fused identity that every framework actually evaluates is

\\[
\\log p_i = z_i - \\log \\sum_j e^{z_j} = z_i - \\text{logsumexp}(z).
\\]

The right-hand side is *one* call to \`logsumexp\`, and \`logsumexp\` is implemented with the **max-subtraction trick**:

\\[
\\text{logsumexp}(z) = m + \\log \\sum_j e^{z_j - m}, \\qquad m = \\max_j z_j.
\\]

The factor \\(e^{-m}\\) cancels algebraically — same answer, different numerics. After subtraction, the largest exponent is exactly \\(0\\), so \\(e^{z_j - m} \\in (0, 1]\\). No overflow can happen, period. The smallest exponents may underflow to \\(0\\), but those terms were going to round away in real arithmetic too — they contribute nothing measurable to the sum.

This is why \`torch.nn.functional.log_softmax\` is safe on attention scores in the hundreds, and why \`F.softmax(z); torch.log(p)\` is not: the latter computes \\(e^{z_i}\\) (overflows in fp16 above \\(z_i = 11\\), in fp32 above \\(z_i = 88\\)) before it gets a chance to use the max-subtraction. Same algebra, completely different behaviour under finite precision.`,
          },
          {
            kind: 'code',
            language: 'python',
            heading: 'Stable softmax, log-sum-exp, and a NaN sentinel hook',
            body: `import torch
import torch.nn as nn
import torch.nn.functional as F


# ---------------------------------------------------------------
# 1. stable softmax — what PyTorch ships internally
# ---------------------------------------------------------------
def stable_softmax(z: torch.Tensor, dim: int = -1) -> torch.Tensor:
    # subtract max along the reduction axis first
    # detach() keeps the max out of the autograd graph (it is a constant offset)
    m = z.detach().amax(dim=dim, keepdim=True)
    e = torch.exp(z - m)
    return e / e.sum(dim=dim, keepdim=True)


# ---------------------------------------------------------------
# 2. log-sum-exp — the building block of log_softmax and CE
# ---------------------------------------------------------------
def stable_logsumexp(z: torch.Tensor, dim: int = -1) -> torch.Tensor:
    m = z.amax(dim=dim, keepdim=True)
    # log(sum(exp(z - m))) + m
    return (z - m).exp().sum(dim=dim, keepdim=True).log().squeeze(dim) + m.squeeze(dim)


def stable_log_softmax(z: torch.Tensor, dim: int = -1) -> torch.Tensor:
    # the fused form: log p_i = z_i - logsumexp(z)
    return z - stable_logsumexp(z, dim=dim).unsqueeze(dim)


# in real code: F.log_softmax(z, dim=-1) — same math, fused CUDA kernel
# and nn.CrossEntropyLoss(z, y) — log_softmax + nll_loss fused


# ---------------------------------------------------------------
# 3. NaN/Inf sentinel hook — catch the first poisoned tensor
# ---------------------------------------------------------------
def install_nan_sentinel(model: nn.Module) -> list:
    handles = []

    def make_hook(name):
        def hook(_module, _inp, out):
            t = out if isinstance(out, torch.Tensor) else out[0]
            if not torch.isfinite(t).all():
                raise RuntimeError(
                    f"non-finite activation in {name}: "
                    f"NaN={torch.isnan(t).any().item()} Inf={torch.isinf(t).any().item()}"
                )
        return hook

    for name, module in model.named_modules():
        if len(list(module.children())) == 0:                # leaf modules only
            handles.append(module.register_forward_hook(make_hook(name)))
    return handles


# usage in a training loop:
#   handles = install_nan_sentinel(model)
#   try:
#       loss = model(x).loss
#       loss.backward()
#   finally:
#       for h in handles: h.remove()
#
# the FIRST forward that produces NaN raises, with the exact submodule name.
# this is 100x faster to debug than "loss is nan at step 47k" with no provenance.`,
          },
          {
            kind: 'prose',
            heading: '\\(\\log(1+x)\\), \\(e^x - 1\\), and other "tiny argument" helpers',
            body: `The log-sum-exp trick handles big positive arguments. The *other* end of the range — arguments very close to zero — needs its own family of fixes. Consider \\(\\log(1 + x)\\) for \\(x = 10^{-9}\\). In real arithmetic the answer is \\(\\approx 10^{-9}\\). In fp32 the answer is *zero*: the addition \\(1 + 10^{-9}\\) rounds back to \\(1\\) because \\(10^{-9}\\) is well below \\(\\varepsilon_{\\text{fp32}} \\approx 1.19 \\times 10^{-7}\\), so the entire \\(x\\) input was discarded before \`log\` ever ran.

The fix is \`math.log1p(x)\` (or \`np.log1p\`, \`torch.log1p\`), which computes \\(\\log(1 + x)\\) **as one fused operation** that uses a Taylor series for small \\(x\\) and never goes through the lossy \\(1 + x\\) addition. Symmetric helpers: \`expm1(x)\` computes \\(e^x - 1\\) accurately for small \\(x\\) (the naive \`exp(x) - 1\` cancels catastrophically near zero), \`hypot(a, b)\` computes \\(\\sqrt{a^2 + b^2}\\) without overflowing \\(a^2\\), and \`logaddexp(a, b)\` computes \\(\\log(e^a + e^b)\\) with the same max-subtraction trick as logsumexp.

ML places where these matter: KL divergences between very close distributions, Bernoulli log-likelihoods near \\(p = 0\\) or \\(p = 1\\), score-function gradients with tiny weights, log-probabilities of long sequences (summed log-probs of correctly-predicted high-confidence tokens are all just-below-zero values). Whenever your formula contains \\(\\log(\\text{thing close to 1})\\) or \\(\\exp(\\text{thing close to 0}) - 1\\), reach for \\(\\text{log1p}\\) / \\(\\text{expm1}\\) and the bug never happens.`,
          },
          {
            kind: 'prose',
            heading: '\\(\\exp(x)\\) overflow — clip, scale, or use the stable variant',
            body: `\\(e^x\\) overflows in fp32 around \\(x = 88.7\\) and in fp16 around \\(x = 11.1\\). Attention logits scale linearly with the dot-product dimension before any \\(1/\\sqrt{d_k}\\) divisor; on a 4096-dim head an unscaled inner product easily lands in the hundreds. Boltzmann distributions with low temperature, importance weights, and Gaussian likelihoods with tight variance all produce arguments that look small on paper and overflow in float.

Three patterns to know:

1. **Use the fused stable kernel.** Most cases are softmax (or sigmoid, or cross-entropy), and the framework ships a stable version: \`F.log_softmax\`, \`F.softmax\` (internally max-subtracted), \`F.cross_entropy\`, \`F.binary_cross_entropy_with_logits\`. Reach for these *first* and the overflow never reaches your code.
2. **Clip the input to the safe range.** When you genuinely need a raw \`exp\`, clip with \`x.clamp(min=-50, max=50)\` (in fp32) or \`min=-9, max=9\` (in fp16) before the call. You will lose information in the tails — but the tails are dominated by saturation anyway, so the practical accuracy cost is tiny.
3. **Work in log-space throughout.** If your downstream consumer takes \`log(exp(x) + ...)\`, fuse it with \`torch.logaddexp\` or \`torch.logsumexp\` and never exponentiate. The classic example: NLL loss on per-token log-probabilities should *sum log-probs*, not *multiply probs then log*. Log-space addition is the log-sum-exp identity; log-space multiplication is just ordinary addition. Almost all probability arithmetic in deep learning lives in log-space for exactly this reason.

Watch especially for \`exp(-x)\` of *large positive* \\(x\\): this underflows to zero in fp16 above \\(x = 11\\) and contaminates anything you divide by it (Bahdanau attention's exponential decay, RBF kernels with small bandwidth, importance sampling with small probability ratios).`,
          },
          {
            kind: 'viz',
            heading: 'Mixed-precision tradeoffs at a glance',
            component: 'FloatFormatGridViz',
            props: {},
          },
          {
            kind: 'prose',
            heading: 'fp16 vs bf16 vs fp32 vs fp8 — the range-vs-precision tradeoff',
            body: `Every 16-bit format steals bits from somewhere. fp16 keeps 10 mantissa bits (good precision, only ~3 decimal digits) but uses just 5 exponent bits (tiny dynamic range — overflows at 65504). bf16 keeps the full fp32 exponent (8 bits, same range as fp32) and gives up the mantissa down to 7 bits (~2 decimal digits of precision). fp8 in either E4M3 or E5M2 layout barely reaches one digit of precision and only exists because the matmul tensor cores on H100+ are *fast* at it.

The training-stability picture is simple. Weights are typically small (norm \\(\\sim 10^{-2}\\)); activations stay in \\([-10, 10]\\) most of the time; gradients can be tiny (\\(10^{-7}\\)) or occasionally huge (\\(10^{6}\\) during a spike). fp16 cannot hold the huge end without a loss scaler, and it cannot hold the tiny end without rounding to zero. bf16 holds both because the exponent range is identical to fp32 — there is no overflow on the spike and no underflow on the small gradient. That is why bf16 almost always converges where fp16 does not, even though fp16 has more precision per number.

The H100 / B200 generation made bf16 universally cheap, and as of 2024 **bf16 is the default training format** for almost every new model. fp16 lives on for backward compatibility and for older GPUs (V100, RTX 30-series) that have fast fp16 but slow bf16. fp8 is leading-edge: it is what enables 405B-parameter models to train in a reasonable wall-clock time, but it requires per-tensor scaling factors, careful op-by-op format selection, and an engineering team that can debug numerical issues at 3 a.m. For 99% of work, the answer is bf16 if your hardware supports it and fp16 with a grad scaler if it does not. The *Floating point* lesson covers the bit-level details if you want to dig deeper.`,
          },
          {
            kind: 'callout',
            tone: 'note',
            body: `**bf16 has won the 2024 mixed-precision argument.** Every major training stack — PyTorch \`autocast(dtype=torch.bfloat16)\`, JAX on TPU, Megatron-LM, DeepSpeed — defaults to bf16 on modern hardware (A100 and newer, H100, B200, TPU v3+). The tradeoff is unambiguous: bf16 matches fp32's range so gradient scalers are unnecessary, training loss curves match fp32 within noise, and the engineering is dramatically simpler than fp16 + loss scaling. fp16 still wins on older cards (V100, T4, RTX 30-series) where bf16 matmuls are slower than fp16, but if you are buying compute today, you are buying bf16-friendly compute. The H100 paper and the LLaMA-3 training report both run bf16 throughout — that is the production benchmark to copy.`,
          },
          {
            kind: 'prose',
            heading: 'Gradient overflow and underflow during training',
            body: `In mixed-precision training, gradients live in the same low-precision format as the activations they came from. fp16's narrow exponent range (\\(\\sim 6 \\times 10^{-5}\\) to \\(\\sim 6.5 \\times 10^{4}\\)) is the bottleneck. A normal small gradient (\\(10^{-6}\\)) is *below* fp16's smallest normal number — it rounds to a subnormal with degraded precision, or rounds to zero entirely, and the parameter stops updating. A large gradient during a spike (\\(10^{5}\\)) overflows to \\(+\\infty\\), poisons the parameter, and turns the next forward pass to NaN.

bf16 sidesteps both — its exponent range is fp32's, so any gradient fp32 can hold, bf16 holds too. The precision loss (7 mantissa bits vs 23) shows up as slightly noisier updates, but stochastic gradient descent is already noisy by construction; in practice convergence is indistinguishable from fp32 on every benchmark Google or Meta has published.

When you cannot use bf16, the fp16 fix is **loss scaling**: multiply the loss by a large constant \\(s\\) before \`backward()\`, do the backward pass at the scaled magnitude (gradients are now \\(s\\) times what they would be), then divide by \\(s\\) before applying the optimizer step. Algebraically the update is identical to the fp32 case; numerically the gradients have been moved up into fp16's representable range. PyTorch's \`torch.cuda.amp.GradScaler\` automates the choice of \\(s\\) — it doubles \\(s\\) whenever no overflow is detected for a window of steps and halves it whenever an overflow is detected — converging on the largest scale that does not overflow.`,
          },
          {
            kind: 'code',
            language: 'python',
            heading: 'fp16 with a grad scaler — and bf16 without one',
            body: `import torch
from torch.cuda.amp import GradScaler, autocast

# ---------- the fp16 recipe: needs a grad scaler ----------
scaler = GradScaler()                                    # learns a per-step scale s
for x, y in loader:
    optimizer.zero_grad()
    with autocast(dtype=torch.float16):                  # matmuls + convs run in fp16
        loss = model(x, y).loss                          # loss returned in fp32
    scaler.scale(loss).backward()                        # backward at scaled magnitude
    scaler.unscale_(optimizer)                           # undo the scale on .grad in-place
    torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
    scaler.step(optimizer)                               # skips step + halves s if overflow
    scaler.update()                                      # bumps s up if a run of clean steps


# ---------- the bf16 recipe: no scaler needed ----------
for x, y in loader:
    optimizer.zero_grad()
    with autocast(dtype=torch.bfloat16):                 # bf16 has fp32's range
        loss = model(x, y).loss
    loss.backward()                                      # no scaling, no underflow concerns
    torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
    optimizer.step()


# always-on sanity check, regardless of precision:
assert torch.isfinite(loss), f"non-finite loss at step {step}: {loss.item()}"`,
          },
          {
            kind: 'prose',
            heading: 'Stable BCE and CE — never compute sigmoid+log yourself',
            body: `Binary cross-entropy in textbook form is \\(\\mathcal{L} = -y \\log p - (1-y) \\log(1 - p)\\) with \\(p = \\sigma(z)\\). Coding this naively means: pass logits through \`sigmoid\`, then take \`log\` of the result. Two ways to disaster:

1. **\\(\\log(0)\\) when \\(\\sigma(z)\\) underflows.** For \\(z < -16\\) in fp32 (or \\(z < -8\\) in fp16), \\(\\sigma(z)\\) rounds to zero. Then \\(y \\log p = y \\cdot (-\\infty)\\). If \\(y = 0\\) you get \\(0 \\cdot \\infty = \\text{NaN}\\); if \\(y = 1\\) you get \\(-\\infty\\). Either way the gradient is poisoned and the entire model is NaN by the next step.
2. **\\(\\log(1 - 1)\\) when \\(\\sigma(z)\\) rounds to one.** Symmetric failure for \\(z > 16\\). The \\((1-y)\\log(1-p)\\) term goes to NaN.

The fix is the **fused** loss \`nn.BCEWithLogitsLoss\`. It takes raw logits \\(z\\) and computes the loss in a single kernel using the identity

\\[
\\mathcal{L}(z, y) = \\max(z, 0) - z \\, y + \\log(1 + e^{-|z|}).
\\]

Every piece of that expression is bounded in fp32 and uses \\(\\text{log1p}\\) internally. There is no \`sigmoid\`, no \`log\`, no chance of \\(0 \\cdot \\infty\\). Same algebra as the textbook formula, completely different numerics.

Cross-entropy for multi-class classification has the same story. \`nn.CrossEntropyLoss(z, y)\` takes raw logits and fuses \`log_softmax + nll_loss\`. \`nn.NLLLoss(F.softmax(z).log(), y)\` is the unstable form that fails the same way as separate-sigmoid BCE — never write it. The fused loss is also faster (one CUDA kernel, one allocation, no intermediate tensors) and gives you the cleaner gradient \\(\\nabla_z \\mathcal{L} = p - y\\) for free.`,
          },
          {
            kind: 'callout',
            tone: 'tip',
            body: `**Always use \`nn.BCEWithLogitsLoss\`, never \`sigmoid + nn.BCELoss\`.** This is the single highest-leverage change you can make to a binary classifier's stability. The fused version uses the \\(\\max(z, 0) - z y + \\log 1p(\\exp(-|z|))\\) identity and is bulletproof across the entire fp32 range; the two-step version NaN-poisons your training the first time a logit goes past \\(\\pm 16\\). The same rule applies to multi-class: use \`nn.CrossEntropyLoss(z, y)\` on raw logits, never \`F.softmax(z).log()\` followed by \`nn.NLLLoss\`. If you see \`sigmoid\` or \`softmax\` *immediately before a loss* in any codebase, that is the bug — open a PR.`,
          },
          {
            kind: 'prose',
            heading: 'NaN / Inf detection — catch the first poisoned tensor',
            body: `Once a NaN enters the graph, every downstream tensor becomes NaN within microseconds. The training loop *keeps running* — the assert that checks \`loss.isfinite()\` may or may not fire depending on where exactly the NaN appeared in the computation — and by the time someone notices the loss has been NaN for thousands of steps, the original triggering operation is long gone. The debugging strategy is to **fail fast at the first NaN**, with the name of the producing module.

The three PyTorch tools to know:

1. **\`torch.autograd.set_detect_anomaly(True)\`** — the heavyweight option. Wrap your training step in this context and PyTorch records the forward graph; when a backward step produces a NaN, it raises with a stack trace pointing at the *forward* op that produced the offending tensor. Slow (2-3x), so use it during debugging, not in production.
2. **\`torch.isfinite(t).all()\`** — the cheap option. Add a per-batch assert: \`assert torch.isfinite(loss)\`. Costs essentially nothing and catches the loss-level NaN immediately. Pair with \`grad_stats\` to inspect gradients before the optimizer step.
3. **A forward hook on every leaf module** — the targeted option, shown in the code block above. The hook fires after every submodule's forward; the first one to produce a non-finite output raises with the module's qualified name. This is the fastest way to localise "which layer first went bad" without paying the \`detect_anomaly\` cost.

A production-grade training loop combines all three: \`set_detect_anomaly\` during development, the sentinel hook during the first few epochs of a new run, and the cheap \`isfinite\` assert always-on. The first NaN should never reach the optimizer.

The companion fix is **gradient clipping** with \`torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)\`. If the gradient norm spikes (often the cause of the first NaN — fp16 overflow during a bad batch), clipping the global norm caps the update at a sane magnitude and the training continues. Combined with bf16 (no scaler needed) and a fused stable loss, this is the recipe that lets a model train for weeks without intervention.`,
          },
          {
            kind: 'prose',
            heading: 'What to take away',
            body: `Numerical stability is the discipline of writing math that survives finite-precision arithmetic. The *Floating point* lesson explained the underlying bit representation; this lesson is the catalogue of standard tricks for working *within* that representation. Catastrophic cancellation is the silent killer — never subtract nearly-equal numbers, always rearrange the math first. The log-sum-exp identity makes \\(\\log\\,\\text{softmax}\\) safe at any logit magnitude. \\(\\text{log1p}\\) and \\(\\text{expm1}\\) handle the small-argument end where the textbook formula loses every digit. Clip or fuse \\(\\exp\\) calls so the FPU never reaches \\(+\\infty\\).

Pick the right precision for your hardware: bf16 if you have it (the default for any 2024+ training run), fp16 with a \`GradScaler\` if you do not, fp32 only when you cannot afford the risk. Use the fused stable losses — \`BCEWithLogitsLoss\` for binary, \`CrossEntropyLoss\` for multi-class — and never compose \`sigmoid + log\` or \`softmax + log\` by hand. Clip gradients globally, install a NaN sentinel hook during the first epochs of a new run, and assert finiteness on every loss.

None of this is glamorous. All of it is the difference between a training run that completes in 72 hours and a training run that diverges at step 47 and burns a week of GPU time finding out why.`,
          },
          {
            kind: 'prose',
            heading: 'Further reading',
            body: `- [David Goldberg — "What Every Computer Scientist Should Know About Floating-Point Arithmetic"](https://docs.oracle.com/cd/E19957-01/806-3568/ncg_goldberg.html) — the canonical reference; sections on catastrophic cancellation and IEEE 754 quirks are exactly the failure modes in this lesson.
- [Nicholas Higham — "Accuracy and Stability of Numerical Algorithms" (SIAM)](https://epubs.siam.org/doi/book/10.1137/1.9780898718027) — the textbook on the subject; condition numbers, backward error, and the analysis behind log-sum-exp and Kahan summation.
- [PyTorch Docs — Automatic Mixed Precision](https://pytorch.org/docs/stable/amp.html) — the practitioner's reference for \`GradScaler\`, fp16 vs bf16, and the loss-scaling pattern this lesson recommends.`,
          },
        ],
      },
    ],
  },
};

export function getPillar(slug) {
  return PILLARS[slug] || null;
}

export function getLesson(pillarSlug, lessonSlug) {
  const p = PILLARS[pillarSlug];
  if (!p) return null;
  return p.lessons.find(l => l.slug === lessonSlug) || null;
}

// Extra lessons authored as standalone modules, merged into their pillars.
PILLARS.optimization.lessons.push(...OPTIMIZATION_EXTRA);
PILLARS.regularization.lessons.push(...REGULARIZATION_EXTRA);
PILLARS.rl.lessons.push(...RL_EXTRA);
PILLARS.numerical.lessons.push(...NUMERICAL_EXTRA);
PILLARS.architectures.lessons.push(...ARCHITECTURES_EXTRA);
