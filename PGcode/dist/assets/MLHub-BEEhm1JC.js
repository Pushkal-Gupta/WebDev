const a={foundations:{title:"Linear Algebra & Calculus",oneLiner:"Vectors, matrices, dot products, norms, gradients — the math every ML formula stands on.",iconName:"Sigma",lessons:[{slug:"vectors",title:"Vectors",oneLiner:"A list of numbers with a direction and a length.",difficulty:"foundation",readMinutes:9,sections:[{kind:"prose",heading:"What a vector actually is",body:`A vector is just an ordered list of numbers — \\([3, -1, 4]\\) is a 3-dimensional vector, \\([0.2, 0.8]\\) is a 2-dimensional one. That is the entire definition. Everything else you will hear about vectors — magnitude, direction, dot products, projections — is a *consequence* of that definition once you decide how to interpret the numbers geometrically.

The standard interpretation in ML: a vector with \\(n\\) numbers is a point in \\(n\\)-dimensional space, with its tail glued to the origin. The numbers are the coordinates. \\([3, 4]\\) means "three steps east, four steps north." \\([3, -1, 4]\\) means the same idea, one dimension further in. The arrow from the origin to that point *is* the vector.

This matters because ML never deals with the actual world of cats, sentences, and emails. It deals with vectors that *represent* those things. A 768-dimensional sentence embedding from a transformer is a point in a 768-dimensional space. Two sentences with similar meaning land near each other in that space. The whole field is built on this one trick: turn the thing you care about into a vector, then do geometry.`},{kind:"viz",component:"VectorPlayground",props:{mode:"single"},heading:"Drag the vector — watch length and angle update live"},{kind:"ascii",heading:"Geometric picture",caption:"A 2D vector v = [3, 2]. Tail at origin, head at the point (3, 2). Length is sqrt(13).",body:`      y
      ^
    3 |
    2 |          *<-- head of v = [3, 2]
    1 |        /
    0 +------/----------> x
      |    /
      |  /
      |/
   tail at origin (0, 0)

   length |v| = sqrt(3^2 + 2^2) = sqrt(13) ≈ 3.61
   direction angle θ = atan2(2, 3) ≈ 33.7°`},{kind:"prose",heading:"Two operations, everything else falls out",body:`You only need two operations to do everything ML asks of vectors:

**Scalar multiplication** scales a vector. \\(2 \\cdot [3, -1, 4] = [6, -2, 8]\\). The arrow points the same way, but is now twice as long. Negative scalars flip the direction.

**Vector addition** is tip-to-tail. \\([3, 2] + [1, 4] = [4, 6]\\). Geometrically: walk along the first arrow, then start the second arrow where the first ended; the result is the arrow from your original starting point to where you ended up.

Together these two — *scale and add* — are called **linear combinations**, and they are the entire substance of linear algebra. A neural-net layer is a linear combination of its inputs (followed by a nonlinearity). Gradient descent is a linear combination of the current weights and the gradient. PCA is finding the directions along which linear combinations of features carry the most variance. Once you see "scale and add" you stop seeing anything else.`},{kind:"viz",component:"VectorPlayground",props:{mode:"add"},heading:"v + u is tip-to-tail. Drag either to see."},{kind:"math",heading:"Norms — how long is this vector?",body:`The length of a vector is called its **norm**, written \\(\\|v\\|\\). The default ("L2 norm" or "Euclidean norm") is just the Pythagorean theorem in \\(n\\) dimensions:

\\[
\\|v\\|_2 = \\sqrt{v_1^2 + v_2^2 + \\cdots + v_n^2}
\\]

For \\(v = [3, 2]\\): \\(\\|v\\|_2 = \\sqrt{9 + 4} = \\sqrt{13}\\).

Other norms exist, and you will meet them again in regularization:

- **L1 norm** \\(\\|v\\|_1 = |v_1| + |v_2| + \\cdots\\) — sum of absolute values. Used in Lasso regression because it encourages sparse vectors.
- **L\\(\\infty\\) norm** \\(\\|v\\|_\\infty = \\max_i |v_i|\\) — the largest single component. Used in adversarial robustness ("the attacker can change each pixel by at most ε").

A vector with norm 1 is called a **unit vector**. You make any non-zero vector into a unit vector by dividing it by its own norm: \\(\\hat{v} = v / \\|v\\|\\). This strips away the magnitude and keeps only the direction.`},{kind:"code",language:"python",heading:"Vectors in NumPy",body:`import numpy as np

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
print(np.linalg.norm(v_hat))        # 1.0`},{kind:"callout",tone:"note",body:"**Why `v @ v` equals `|v|^2`.** The dot product of a vector with itself is the sum of its squared components — exactly what is under the square root in the L2 norm. So `np.sqrt(v @ v)` and `np.linalg.norm(v)` compute the same number, and you will see both in ML code."},{kind:"prose",heading:"High dimensions break your intuition (this is the point)",body:`In 2D you can picture vectors as arrows on a page. In 3D, as arrows in a room. In 4D you cannot picture them at all, and that is fine — the algebra still works.

But the *geometry* of high-dimensional spaces is genuinely strange, and a few of these surprises matter in ML:

1. **Almost every pair of random vectors is nearly orthogonal.** In a 1000-dimensional space, two vectors drawn from independent Gaussian noise will have a cosine similarity tightly clustered near zero. This is why word embeddings can pack so many distinct meanings into a few hundred dimensions without them stepping on each other.

2. **Volume is concentrated in a thin shell.** Most of the volume of a high-dimensional ball is near its surface, not at its center. The opposite of what your 3D intuition tells you.

3. **Distances become uninformative.** Pick a query point and a million random points in a 1000-D space; the nearest and the furthest will have almost the same distance. This is why exact nearest-neighbour search dies in high dimensions and why ANN (approximate nearest neighbour) indices exist.

You do not need to fully internalize these yet. Just file them away — when something in an ML system feels mysterious ("why is cosine similarity such a popular metric?"), the answer is almost always *because of the geometry of high dimensions*.`},{kind:"prose",heading:"What to take away",body:`A vector is a list of numbers, interpreted as a point or arrow in \\(n\\)-dimensional space. The two operations that matter — scaling and adding — generate every linear-algebra construction you will need. Norms measure length; unit vectors strip length and keep direction.

The next lesson covers **dot products**: a single number that measures how aligned two vectors are. That number is the engine inside cosine similarity, projection, the entire output of a linear layer in a neural net, and — once you generalize it to a matrix-vector product — most of deep learning's compute budget.`}]},{slug:"dot-product",title:"Dot product",oneLiner:"One scalar that measures how aligned two vectors are. The engine of every linear layer.",difficulty:"foundation",readMinutes:8,sections:[{kind:"prose",heading:"Definition first, intuition next",body:`The dot product of two vectors \\(u\\) and \\(v\\) of the same length \\(n\\) is:

\\[
u \\cdot v = u_1 v_1 + u_2 v_2 + \\cdots + u_n v_n = \\sum_{i=1}^{n} u_i v_i
\\]

Multiply the matched components, add them up, you get a single number. That is the whole definition. It costs \\(n\\) multiplies and \\(n-1\\) adds — what GPUs are physically optimised to do millions of times per second.

A second, equivalent definition — the geometric one — explains *why this operation is useful*:

\\[
u \\cdot v = \\|u\\| \\, \\|v\\| \\, \\cos\\theta
\\]

where \\(\\theta\\) is the angle between the two vectors. The dot product is the product of their lengths times the cosine of the angle between them.

Stare at that for a second. The dot product is positive when the vectors point *roughly the same way* (\\(\\cos\\theta > 0\\)), negative when they point *roughly opposite* (\\(\\cos\\theta < 0\\)), and exactly zero when they are *orthogonal* (\\(\\cos\\theta = 0\\)). One number, three regimes — alignment, anti-alignment, perpendicular. That is the whole story.`},{kind:"ascii",heading:"Sign of the dot product",caption:"The dot product tells you which half-plane v lies in, relative to u.",body:`   u·v > 0                       u·v = 0                       u·v < 0
   (aligned)                  (orthogonal)                (anti-aligned)

      v
       \\                       v ----->                     <----- v
        \\                      |
         \\         u           |         u                          u
          v---->               +------->                      ----->
   angle < 90°                angle = 90°                angle > 90°`},{kind:"prose",heading:"Cosine similarity — the dot product, normalised",body:`Cosine similarity divides the dot product by both lengths:

\\[
\\text{cos\\_sim}(u, v) = \\frac{u \\cdot v}{\\|u\\| \\, \\|v\\|} = \\cos\\theta
\\]

This strips out magnitude and leaves only the angle. It is the metric used by virtually every embedding system in production — semantic search, retrieval-augmented generation, deduplication, clustering — because magnitude usually carries the wrong signal (a longer sentence is not a more *meaningful* sentence; an image with brighter pixels is not a more *cat-like* cat). Direction is what carries meaning in an embedding space.

When people say "the vector for *king* is close to the vector for *queen*," they mean cosine similarity, not Euclidean distance. The two metrics often agree, but cosine is robust to embeddings that happen to come out longer or shorter, which Euclidean is not.`},{kind:"viz",component:"VectorPlayground",props:{mode:"dot"},heading:"Rotate u relative to v — watch the sign of v · u flip"},{kind:"code",language:"python",heading:"Dot products and cosine similarity in NumPy",body:`import numpy as np

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
print(cos_sim(np.array([1, 0]), np.array([0, 1])))   # 0.0`},{kind:"prose",heading:"Every linear layer is a stack of dot products",body:`A fully-connected layer in a neural network computes \\(y = Wx + b\\), where \\(x\\) is the input vector, \\(W\\) is a matrix of weights, and \\(b\\) is a bias vector. The matrix-vector product \\(Wx\\) is *just dot products*: row \\(i\\) of \\(W\\) is dotted with \\(x\\) to produce component \\(i\\) of \\(y\\).

So the question "what does a neuron in this layer compute?" has a one-line answer: it dots a learned weight vector with the input. The neuron fires strongly when the input points in roughly the same direction as the weight vector, weakly otherwise. Training tilts the weight vectors until each neuron points in a direction the network finds useful — edges in the early layers of a CNN, faces or words in the later ones, attention patterns in a transformer.

Attention itself, the operation that ate NLP, is a softmax over dot products: each query vector is dotted with every key vector, and the resulting score determines how much each value vector contributes to the output. Same primitive, same hardware path, billions of times per forward pass.`},{kind:"callout",tone:"tip",body:'**Numerical gotcha.** When you dot two large vectors of small components, intermediate sums can lose precision. Most ML frameworks accumulate dot products in float32 even when inputs are float16, exactly to avoid this. If you write a custom CUDA kernel and skip that step, you will see your model "stop learning" mysteriously — that is why.'},{kind:"prose",heading:"What to take away",body:`The dot product turns geometry — angle and length — into a single scalar your computer can manipulate. Positive means aligned, negative means opposed, zero means perpendicular. Normalising by the two lengths gives you cosine similarity, the workhorse metric of every embedding-based ML system on Earth.

Next up: **matrices**, which are just stacks of vectors. Once you see a matrix as "a list of rows you can dot against any input," the matrix-vector product stops being a definition to memorise and becomes the only sensible thing it could be.`}]},{slug:"matrices",title:"Matrices",oneLiner:"A grid of numbers that bends one vector space into another.",difficulty:"foundation",readMinutes:10,sections:[{kind:"prose",heading:"A matrix is a function",body:`A matrix is a grid of numbers. A 2-by-3 matrix has 2 rows and 3 columns. That is the surface definition, and it is true, but it misses the point.

The point: a matrix is a **function**. Specifically, a *linear* function from one vector space to another. Feed an \\(n\\)-dimensional vector \\(x\\) into an \\(m \\times n\\) matrix \\(M\\), and you get out an \\(m\\)-dimensional vector \\(Mx\\). The matrix is the rule that turned \\(x\\) into \\(Mx\\). Same input always produces the same output. No state, no surprises — just a fixed bend of the input space.

"Linear" means two things, both inherited from the vector operations in the previous lessons: \\(M(\\alpha x) = \\alpha (Mx)\\) — scaling the input scales the output by the same amount — and \\(M(x + y) = Mx + My\\) — adding inputs adds outputs. Every other property of matrices is a downstream consequence of these two rules. Neural-net layers, PCA, rotations, projections, Markov-chain transitions — every one of them is a matrix because every one of them respects these two rules.`},{kind:"prose",heading:"The columns tell you where the basis lands",body:`Here is the single most useful fact about matrices, and the one most textbooks bury under notation: **each column of \\(M\\) is where one basis vector of the input space ends up.**

In 2D, the input basis vectors are \\(\\hat{\\imath} = [1, 0]\\) (one step east) and \\(\\hat{\\jmath} = [0, 1]\\) (one step north). If \\(M\\) is

\\[
M = \\begin{bmatrix} 2 & -1 \\\\ 0 & 3 \\end{bmatrix}
\\]

then column 1 is \\([2, 0]\\) — that is where \\(\\hat{\\imath}\\) lands. Column 2 is \\([-1, 3]\\) — that is where \\(\\hat{\\jmath}\\) lands. The whole transformation is encoded in those two destination vectors. Everything else follows by linearity: any input \\(x = a\\hat{\\imath} + b\\hat{\\jmath}\\) gets sent to \\(a \\cdot (\\text{col}_1) + b \\cdot (\\text{col}_2)\\).

So to read a matrix, do not stare at the grid. Stare at the columns and ask "where did the basis go?" That is the geometric heart of the thing.`},{kind:"viz",component:"MatrixTransform",props:{},heading:"Drag the matrix entries — watch the grid bend in real time"},{kind:"ascii",heading:"Reading a matrix by its columns",caption:"Each column of M is the destination of one input basis vector. The transformed grid is the linear combination of those destinations.",body:`   M = [ 2  -1 ]      column 1 = [2, 0]   (where i-hat lands)
       [ 0   3 ]      column 2 = [-1, 3]  (where j-hat lands)

   before                       after applying M

     y                              y
     ^                              ^
   2 | j                          3 |   j' = [-1, 3]
   1 |                            2 |    \\
   0 +-----i---> x                1 |     \\
       0   1  2                   0 +------\\-------> x
                                      -1    \\  i' = [2, 0]

   any input x = a*i + b*j  ->  Mx = a * col1 + b * col2`},{kind:"math",heading:"Matrix-vector product, written out",body:`Take an \\(m \\times n\\) matrix \\(M\\) with entries \\(M_{ij}\\) and an \\(n\\)-dimensional input \\(x\\). The output \\(y = Mx\\) is \\(m\\)-dimensional, with components:

\\[
y_i = \\sum_{j=1}^{n} M_{ij}\\, x_j
\\]

Two equivalent ways to read this single formula — both worth keeping in your head:

1. **Row view.** Row \\(i\\) of \\(M\\) is a vector; dot it with \\(x\\) to get \\(y_i\\). This is how the previous lesson framed neural-net layers: every output is one dot product.

2. **Column view.** \\(y\\) is a **linear combination of the columns of \\(M\\)**, with the components of \\(x\\) as the weights:

\\[
Mx = x_1 \\, \\text{col}_1(M) + x_2 \\, \\text{col}_2(M) + \\cdots + x_n \\, \\text{col}_n(M)
\\]

The row view is faster to compute by hand. The column view is what gives you geometric intuition — "this output is a recipe that mixes the column destinations, with \\(x\\) as the recipe."`},{kind:"prose",heading:"Identity, then composition",body:`The **identity matrix** \\(I\\) is the matrix that does nothing — it sends every vector to itself. In 2D:

\\[
I = \\begin{bmatrix} 1 & 0 \\\\ 0 & 1 \\end{bmatrix}
\\]

Its columns are \\(\\hat{\\imath}\\) and \\(\\hat{\\jmath}\\) — the basis vectors land exactly where they started, so nothing moves. \\(Ix = x\\) for every \\(x\\). It plays the same role for matrices that 1 plays for numbers: the no-op, the multiplicative anchor.

Now the second big move: **matrix multiplication is function composition.** If \\(A\\) and \\(B\\) are matrices and you write \\(AB\\), the product is the matrix that represents "apply \\(B\\), then apply \\(A\\)." That order trips everybody up the first time. The reason: \\((AB)x = A(Bx)\\). \\(B\\) touches \\(x\\) first because it sits closer to it.

This is why matrix multiplication is **not commutative**. \\(AB \\neq BA\\) in general, just like "put on socks, then shoes" is not the same as "put on shoes, then socks." Rotate-then-scale is genuinely different from scale-then-rotate when the scale is non-uniform. The algebra is non-commutative because the underlying geometry is.

The product \\(AB\\) is computed column-by-column: column \\(j\\) of \\(AB\\) is \\(A\\) applied to column \\(j\\) of \\(B\\). Same rule as before — columns are destinations. You are asking "where does \\(B\\) send each basis vector, and then where does \\(A\\) send *that*?"`},{kind:"math",heading:"Determinant — how much area gets stretched",body:`The **determinant** of a square matrix \\(M\\), written \\(\\det M\\), is a single number that answers one question: how much does \\(M\\) scale area (in 2D) or volume (in 3D and up)?

For the 2-by-2 matrix

\\[
M = \\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}, \\qquad \\det M = ad - bc
\\]

The geometric content: the unit square spanned by \\(\\hat{\\imath}\\) and \\(\\hat{\\jmath}\\) has area 1. After applying \\(M\\), it becomes the parallelogram spanned by the two columns of \\(M\\). The area of that parallelogram is \\(|\\det M|\\). Every other shape in the plane has its area multiplied by the same factor — that is why the determinant is one number, not a function of the shape.

The sign matters too. \\(\\det M > 0\\) means orientation is preserved (counter-clockwise stays counter-clockwise). \\(\\det M < 0\\) means orientation is flipped — the transformation includes a reflection.

And the punchline: **\\(\\det M = 0\\) means the matrix is singular.** It collapses the input space into something lower-dimensional — a 2D square gets squashed onto a line, a 3D cube gets squashed onto a plane. Information is lost; the transformation cannot be undone. There is no inverse. Singular matrices show up in ML when features are perfectly correlated, when a covariance estimate is rank-deficient, or when a layer's weights collapse during a degenerate training run — all symptoms of "your input had less independent information than you thought."`},{kind:"code",language:"python",heading:"Matrices in NumPy",body:`import numpy as np

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
print(np.linalg.det(S))         # 0.0`},{kind:"callout",tone:"tip",body:"**NumPy broadcasting saves you transpose-juggling.** When you compute M @ x for a single vector, NumPy treats x as a column. When x is a batch — shape (batch, n) — the conventional ML idiom is x @ M.T, which gives back (batch, m). That is why almost every PyTorch nn.Linear internally stores weights as (out_features, in_features) and applies x @ W.T + b: it lines up with the broadcasting rules so a single matmul handles any batch shape."},{kind:"callout",tone:"note",body:'**Row-major vs column-major.** NumPy and PyTorch store arrays in **row-major** order by default — consecutive elements of a row sit next to each other in memory. Fortran, MATLAB, and most BLAS routines underneath are **column-major**. That is why .T is free in NumPy (just a stride trick, no copy) but a real matmul on a transposed array can be slower than on a contiguous one. When a kernel is "mysteriously slow," check whether you are reading down a column of a row-major array — every access jumps a full row stride in RAM.'},{kind:"prose",heading:"What to take away",body:`A matrix is a linear function. Its columns are the destinations of the input basis vectors, so reading a matrix means reading its columns. Matrix-vector multiplication is a linear combination of those columns, weighted by the input. The identity matrix is the no-op; matrix multiplication is function composition, applied right-to-left, and is not commutative. The determinant is a single number that tells you how much the transformation scales area, with a sign for orientation — and a determinant of zero means the matrix collapses dimensions and cannot be inverted.

Every neural-net layer, every PCA decomposition, every rotation in a graphics pipeline, every step of a Markov chain — all of them are this same object, the matrix, dressed for different occasions. The next lessons stack more structure on top: eigenvalues (the directions a matrix only stretches), gradients (the matrix of partial derivatives), and the singular value decomposition (any matrix as rotation-stretch-rotation). The grid stays the same; the questions you ask it get sharper.`}]}]},optimization:{title:"Optimization",oneLiner:"Gradient descent and its zoo of variants — SGD, momentum, RMSprop, Adam.",iconName:"Workflow",lessons:[{slug:"gradient-descent",title:"Gradient descent",oneLiner:"Walk downhill, one step at a time. The optimizer behind 99% of trained models.",difficulty:"foundation",readMinutes:11,sections:[{kind:"prose",heading:"The loss landscape",body:`Training a model is a search problem. You have a function — the **loss** — that takes the model's parameters \\(\\theta\\) and returns a single number measuring how badly the model is doing on the data. The smaller the number, the better the model. The job of optimization is to find the \\(\\theta\\) that minimises it.

Picture the loss as a landscape. Each axis is one of the parameters, the height at every point is the loss. With two parameters you can actually draw it — a surface with peaks, valleys, ridges, plateaus. With a billion parameters (a modern LLM) you cannot draw it, but the geometry is still there. Somewhere in that landscape sits the lowest point you can reach, and that point is the trained model.

You cannot see the whole landscape. You only know two things at any given location: how high you are, and which way is *steepest*. Gradient descent is the strategy that uses just those two pieces of information to walk downhill — no map, no global view, just one step at a time in the direction that drops the loss fastest. That is the entire algorithm. Every optimizer in deep learning is a variation on that single idea.`},{kind:"math",heading:"The gradient is the direction of steepest ascent",body:`The **gradient** of a scalar function \\(f(\\theta)\\) is the vector of its partial derivatives:

\\[
\\nabla f(\\theta) = \\left[ \\frac{\\partial f}{\\partial \\theta_1}, \\frac{\\partial f}{\\partial \\theta_2}, \\ldots, \\frac{\\partial f}{\\partial \\theta_n} \\right]
\\]

Two facts about this vector are everything you need:

1. It **points in the direction of steepest ascent** of \\(f\\). If you take an infinitesimal step in the direction of \\(\\nabla f\\), the loss goes *up* faster than in any other direction of the same length.
2. Its **magnitude** is the slope of that steepest ascent.

So if you want to go *down* — which you do, because you are minimising — you step in the *negative* gradient direction. That is why every optimizer you have ever seen has a minus sign in it. The gradient tells you the worst direction; you negate it.`},{kind:"ascii",heading:"1D picture — rolling down a parabola",caption:"f(x) = 0.5 * x². The gradient at x is just x itself; we step left when x > 0, right when x < 0.",body:`      f(x)
        ^
        |  *                                       *
        |   \\                                     /
        |    \\                                   /
        |     \\          gradient ----->        /
        |      \\         step <-----           /
        |       *.                           .*
        |          *.                     .*
        |             *.    minimum    .*
        |                *. _______ .*
        +----------------------|------------------> x
                              x* = 0

   at x > 0:  grad f(x) = x > 0  →  step direction = -grad = LEFT  (toward 0)
   at x < 0:  grad f(x) = x < 0  →  step direction = -grad = RIGHT (toward 0)`},{kind:"math",heading:"The update rule",body:`Put the two pieces together and you get the update rule that all of deep learning runs on:

\\[
\\theta \\;\\leftarrow\\; \\theta \\;-\\; \\eta \\, \\nabla f(\\theta)
\\]

In words: new parameters equal old parameters minus a small fraction of the gradient. The fraction \\(\\eta\\) is called the **learning rate** (or step size). Typical values: \\(10^{-1}\\) for shallow models on clean data, \\(10^{-3}\\) for most deep networks with Adam, \\(10^{-5}\\) for fine-tuning a pretrained language model.

That is the entire algorithm. Compute the gradient, take a small step against it, repeat until the loss stops dropping. SGD, momentum, RMSprop, Adam, AdamW, Lion — every one of them is this same line with extra machinery bolted on to choose \\(\\eta\\) more cleverly or to remember where you were heading before.`},{kind:"viz",component:"GradientDescent",props:{},heading:"Drag the ball. Click Step. Watch it find the minimum."},{kind:"callout",tone:"tip",body:"**Learning rate too high and the loss explodes.** If \\(\\eta\\) is larger than the curvature of the landscape can tolerate, every step *overshoots* the bottom of the valley and lands higher up the opposite wall. The next step overshoots again, even worse. The loss diverges to infinity in a handful of iterations — you will see it as `NaN` in the logs. When a brand-new training run NaNs out within 50 steps, the learning rate is the first thing to halve."},{kind:"code",language:"python",heading:"Gradient descent on f(x) = 0.5 * x² in NumPy",body:`import numpy as np

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

# try lr = 2.1 to see divergence: each step overshoots further than the last.`},{kind:"prose",heading:"Convex vs non-convex — when the algorithm is honest",body:`A function is **convex** if every line segment between two points on its graph lies above the graph — informally, it has one bowl-shaped valley and no other dips. Linear regression with mean-squared error, logistic regression, SVMs with the hinge loss — all convex. On a convex loss, gradient descent with a sensible learning rate is *guaranteed* to converge to the global minimum. There is no other minimum to get stuck in.

Neural networks are not convex. The loss surface of a deep model has saddle points (flat in some directions, descending in others), local minima (small dips that are not the lowest point), and vast plateaus where the gradient is nearly zero. Strictly speaking, gradient descent on a non-convex loss has no guarantee of finding the global minimum at all.

In practice it works anyway, for two reasons. First, in very high dimensions, true local minima are rare — almost every critical point is a saddle, and saddles are escapable because at least one direction still slopes down. Second, the local minima that exist tend to be "good enough": empirically the network generalises about as well from any of them. You stopped caring about the global minimum the moment you decided "training to convergence" meant "stops improving on a validation set."`},{kind:"callout",tone:"note",body:"**Non-convex losses do not have one answer.** Two training runs of the same architecture on the same data with different random seeds will land in *different* minima with different weights. They will usually have similar validation loss, but they are not the same model — ensembling them often gives a measurable bump for exactly that reason."},{kind:"prose",heading:"Why everyone uses stochastic gradient descent",body:`The gradient \\(\\nabla f(\\theta)\\) is, properly, an average over the *entire training set* — every example contributes a term, and you sum them. For a dataset with millions of examples that is prohibitively expensive: one gradient evaluation costs one full pass through the data, and you need thousands of them.

**Stochastic gradient descent (SGD)** estimates the gradient using a small random subset — a **mini-batch** of, say, 32 to 1024 examples — and uses that estimate as if it were the true gradient. The estimate is noisy: any given mini-batch will pull you in a slightly different direction than the full dataset would. But it is *unbiased* (averaged over many mini-batches, it equals the true gradient), and it is *cheap* (one mini-batch step costs the same as evaluating the model on 32 examples, not 32 million).

The noise is not just tolerated; it is sometimes useful. A noisy step can knock you out of a shallow local minimum or off a saddle point that a clean full-batch step would have stalled on. Most modern optimizers — Adam, AdamW — are SGD variants with adaptive per-parameter learning rates layered on top. The "stochastic" part is non-negotiable; the rest is engineering on top.`},{kind:"prose",heading:"When gradient descent fails",body:`Three failure modes show up often enough that recognising them is half the battle:

1. **Vanishing gradients.** In a deep network with the wrong activation or initialisation, gradients shrink by a constant factor at every layer as they propagate backward. By the time they reach the first layer they are effectively zero, and that layer never updates. The model "trains" but the early features are random forever. The fix is ReLU-family activations, careful initialisation (He, Xavier), residual connections, normalisation.

2. **Exploding gradients.** The mirror image: gradients grow at every layer and the early-layer updates become huge, throwing the parameters somewhere absurd. Loss NaNs out within a few steps. The fix is gradient clipping — cap the global gradient norm at some threshold (commonly 1.0) before applying it. Recurrent networks need this almost always; transformers usually do.

3. **Plateaus.** The gradient is small for hundreds of steps and the loss barely changes, then suddenly drops. This is normal — the optimizer is crossing a flat region of the landscape — but it can look like training has died. Adaptive optimizers (Adam, RMSprop) handle plateaus better than vanilla SGD because their per-parameter step sizes grow when the recent gradients have been small.

If your training run is stuck, your first three diagnostics should be: check the gradient norm (vanishing or exploding?), halve the learning rate (overshooting?), and look at the loss curve scale on a log axis (it might be making progress invisible on a linear plot).`},{kind:"prose",heading:"What to take away",body:`Gradient descent is one line: subtract a small multiple of the gradient from the parameters, repeat. The gradient points uphill; you go the other way. The learning rate is the single most important hyperparameter — too small wastes wall-clock time, too large diverges. Convex losses give guarantees; non-convex losses do not, but the algorithm works anyway because high-dimensional landscapes are kinder to it than the textbook 2D picture suggests.

The next lessons in this pillar add memory and adaptivity to the basic loop: **momentum** remembers the recent direction so you can power through plateaus, **RMSprop** rescales per parameter so the learning rate stops being a single global number, and **Adam** combines both. Every one of them is still gradient descent underneath.`}]}]},regularization:{title:"Regularization & Generalization",oneLiner:"Overfitting is the default. L1, L2, dropout, batch norm — pick the right knob for the right symptom.",iconName:"Layers",lessons:[{slug:"dropout",title:"Dropout",oneLiner:"Randomly silence neurons during training. The lazy fix that works embarrassingly well.",difficulty:"intermediate",readMinutes:9,sections:[{kind:"prose",heading:"The problem dropout solves",body:`A wide neural network has many more parameters than your training set has examples. Left to its own devices it will memorise the training data — every quirk, every label-noise mistake, every accidental shortcut — and validation loss starts climbing while training loss keeps dropping. That is overfitting in its purest form.

The deeper failure mode underneath is **co-adaptation**. Neurons in the same layer learn to lean on each other. Neuron 7 only fires when neurons 3 and 12 fire in a specific pattern, because during training those three were always available together. The network ends up with brittle little cliques of features that work as a unit but fall apart the moment one of their members sees something unfamiliar. The representation is fragile, even though the training accuracy looks great.

Classical regularization — L2 penalties on the weights — pushes against this, but bluntly: it shrinks every weight a little, regardless of whether that weight is part of a useful feature or a memorisation hack. Dropout attacks the problem from a different angle. Instead of shrinking weights, it forces the *features themselves* to be redundant. If any neuron might be silenced on the next forward pass, no neuron can afford to rely on a specific partner being alive. Every feature has to carry its own weight.`},{kind:"prose",heading:"The trick, in one sentence",body:`During each training forward pass, independently set each neuron's activation to zero with probability \\(p\\). That is it.

The mask is fresh every minibatch. Neuron 3 might be alive on step 100 and dead on step 101. The same image processed twice produces two different forward paths through the network. Backprop only flows through the surviving neurons, so weights attached to silenced units do not get updated on that step.

At **inference** time you turn dropout off entirely. Every neuron is alive, every weight is used. The whole point of dropout is to make training pessimistic about which neurons it can count on; once the model is trained, you want the full ensemble of features available to make the prediction.

This single change — multiply activations by a random Bernoulli mask during training, do nothing at test time — turns out to be one of the strongest regularizers in deep learning. It costs a few extra multiplies per forward pass and roughly nothing in code.`},{kind:"math",heading:"The dropout mask and inverted scaling",body:`Let \\(h \\in \\mathbb{R}^n\\) be the activations of one hidden layer, and let \\(p \\in [0, 1)\\) be the **drop probability** — the fraction of units we want to silence. Draw an independent Bernoulli mask:

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

Now the training-time activations and the test-time activations agree in expectation, and at inference you simply pass \\(h\\) through unchanged — no scaling, no mask, nothing to remember. Every modern framework (PyTorch, JAX, TensorFlow) implements inverted dropout, which is why \\(p\\) in \`nn.Dropout(p)\` is the *drop* probability, and why your model evaluation code only needs to call \`.eval()\` to flip the behaviour.`},{kind:"ascii",heading:"One layer, three minibatches, three different masks",caption:"Five neurons, p = 0.4. Each minibatch silences a different subset; weights to dead units do not update on that step.",body:`   minibatch t              minibatch t+1            minibatch t+2

   h1  h2  h3  h4  h5      h1  h2  h3  h4  h5      h1  h2  h3  h4  h5
   o   o   o   o   o       o   o   o   o   o       o   o   o   o   o
   |   |   |   |   |       |   |   |   |   |       |   |   |   |   |
   X   |   |   X   |       |   X   |   |   X       X   |   X   |   |
   ^       ^   ^               ^       ^           ^       ^
   |                                                       |
   silenced                                          silenced
   (m_i = 0)                                         (m_i = 0)

   surviving units rescaled by 1 / (1 - p) so the layer downstream
   sees activations of the same expected size as at inference time

   inference:  every neuron alive, no mask, no scaling — the full ensemble fires.`},{kind:"prose",heading:"Why it works — implicit ensembling",body:`Each forward pass during training uses a different random subset of neurons. A network with \\(N\\) hidden units has \\(2^N\\) possible subnetworks, and over the course of training you sample from this enormous pool. Every gradient step trains a different subnetwork, but they all share the same underlying weights — so the weights end up doing well *on average* across the ensemble of subnetworks.

At inference, when every neuron is on, you are using the full network, which behaves like a geometric average of all those subnetworks at once. You get the variance reduction of a giant ensemble for the wall-clock price of a single model. That is the punchline of the original paper, and it is still the cleanest way to think about why dropout helps.

There is a second, more practical effect: any feature that the network learns has to be useful on its own, because its neighbours might be missing. The co-adaptation that drove overfitting can no longer exploit a fixed partnership between neurons. The features become more independent, more redundant, and more robust to perturbation — which is the same property you want at test time when the inputs do not exactly match the training distribution.

This is also why dropout pairs well with very wide networks. A 4096-unit hidden layer with \\(p = 0.5\\) effectively trains a 2048-unit network on average — you get the regularization of a smaller model and the representational capacity of the bigger one. On narrow networks the same \\(p\\) just throws away too much signal.`},{kind:"code",language:"python",heading:"Dropout from scratch — NumPy forward and backward",body:`import numpy as np

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
print(drop(x))                 # identity — every entry is 1.0`},{kind:"callout",tone:"tip",body:"**`.train()` vs `.eval()` is the single most common dropout bug.** Dropout (and batch norm) behave differently in training and inference mode, and the switch is global per module. Forgetting `model.eval()` before validation gives you noisy, wrong loss numbers that change every time you run the loop. Forgetting `model.train()` after validation freezes dropout off for the rest of the epoch and your training accuracy will look suspiciously high while generalization collapses. Wrap validation in `with torch.no_grad(): model.eval(); ...; model.train()` and the bug stops happening."},{kind:"prose",heading:"Variants and when to use them",body:`Vanilla dropout is the default. A handful of variants exist for specific situations:

- **Spatial dropout** (a.k.a. dropout2d). For convolutional layers, dropping individual pixels is barely a regularizer — neighbouring pixels are heavily correlated, so the network can just average over the missing one and ignore the mask. Spatial dropout drops an *entire channel* at a time instead, forcing the network to be robust to the loss of a whole feature map. Use this in CNNs rather than the plain version.
- **DropConnect.** Instead of zeroing activations, zero individual *weights* in the layer. Same Bernoulli idea, applied one level deeper. Usually a bit stronger than dropout, harder to implement efficiently on a GPU, and only worth the trouble on very small networks.
- **Scheduled / annealed dropout.** Start training with a high \\(p\\) and decay it over epochs, so the early training is aggressively regularised and the late training fine-tunes the full network. Helps when the model is much bigger than the dataset can naturally support.
- **DropPath / stochastic depth.** In very deep residual networks (ResNets, vision transformers), drop entire residual blocks at random during training. The residual connection still flows through, so the network shortens stochastically. This is the dropout idea applied at the *layer* level rather than the *neuron* level, and it is the standard regularizer in modern vision transformers.

When to use dropout at all: large fully-connected networks, classifier heads on top of pretrained backbones, transformer feed-forward blocks (almost every transformer puts dropout after the attention output and inside the FFN). When to skip it: small networks where you are already underfitting (dropout just makes it worse), the convolutional trunk of a modern CNN once batch normalization is doing the regularization for you, and inside the attention softmax — attention dropout is a separate, tunable thing and you usually want it lower than the post-attention dropout.`},{kind:"prose",heading:"The bugs you will actually hit",body:`Four failure modes show up repeatedly in real code:

1. **Forgetting \`.eval()\` at inference.** Discussed in the callout above. Symptom: noisy, irreproducible validation numbers; metrics that change between runs even with a fixed seed.
2. **Stacking dropout on top of batch norm.** The two regularizers fight. BN normalises using batch statistics that already include dropped units, so its running mean and variance drift away from the test-time distribution. The standard fix is to pick one — modern CNNs use BN and skip dropout in the conv trunk, while transformers use LayerNorm (which does not see batch statistics) and freely combine it with dropout. If you must use both, put dropout *after* the BN layer, not before.
3. **\\(p\\) too high.** \\(p = 0.5\\) was the original recommendation for fully-connected layers in 2014 and it is *aggressive*. With modern architectures and good initialization, \\(p\\) in the \\(0.1\\) to \\(0.3\\) range is usually a better default; \\(0.5\\) makes training unstable and slow on anything but very large MLPs. If your training loss is flatlining, your dropout is too high before your learning rate is too low.
4. **Applying dropout to the input or the logits.** Dropout on the input layer destroys signal indiscriminately — there is no redundancy to exploit yet. Dropout on the final logits or after the softmax silently destroys class probabilities. Place dropout *between* hidden layers, not at the boundaries of the network.`},{kind:"callout",tone:"note",body:'**Reproducibility.** Dropout is the most common reason a "deterministic" PyTorch run produces different numbers across two runs with the same seed. The mask is sampled from a CUDA RNG whose state advances differently depending on kernel launch order. If you need bitwise reproducibility — usually for unit tests or paper-quality ablations — seed `torch.manual_seed`, `torch.cuda.manual_seed_all`, set `torch.backends.cudnn.deterministic = True`, and run on a single GPU. Or just turn dropout off in the test by calling `model.eval()`.'},{kind:"prose",heading:"What to take away",body:`Dropout is a single line of code that randomly zeros activations during training and rescales the survivors by \\(1 / (1 - p)\\) so the expected output stays put. At inference it is a no-op. The mechanism breaks co-adaptation between neurons (every feature has to stand on its own) and approximates an ensemble over an exponential number of subnetworks (every weight ends up doing well on average across that ensemble). The two together explain why dropout often beats every other regularizer on overparameterised fully-connected models.

Real-world deployment is about the bookkeeping: train vs eval mode, where you put the dropout in the architecture, and what \\(p\\) you pick. Get those three right and dropout costs nothing and buys you a couple of points of validation accuracy almost for free. The next lessons in this pillar — L1 / L2 weight decay, batch normalization, and early stopping — give you a complete toolkit so you can pick the right regularizer for the symptom in front of you, the same way the *Vectors* lesson set up the algebra you are now applying one layer at a time.`}]}]},transformers:{title:"Attention & Transformers",oneLiner:"Scaled dot-product attention, multi-head, positional encodings — the architecture that ate the field.",iconName:"Brain",lessons:[{slug:"attention",title:"Attention",oneLiner:"Every token decides who to listen to. Then it averages their values.",difficulty:"intermediate",readMinutes:12,sections:[{kind:"prose",heading:"The problem attention solves",body:`Before transformers, the dominant way to process a sequence was a recurrent net — an RNN, LSTM, or GRU — that read tokens one at a time, carrying a hidden state forward. That state was a fixed-size vector trying to remember everything seen so far. By token 200, the influence of token 1 has been multiplied through 199 nonlinearities, and the gradient signal flowing back the other way has been multiplied through 199 derivatives. In practice this means RNNs are bad at long-range dependencies: the model forgets, the gradient vanishes, and the only fix is to make the hidden state larger and hope.

Attention throws that whole picture out. Instead of pushing information sequentially through a bottleneck, every token gets to look directly at every other token in the sequence and pull in whatever it needs. No fixed-size state. No sequential bottleneck. The cost is quadratic in sequence length — \\(O(n^2)\\) pairwise interactions — and the benefit is that *long-range* is no longer different from *short-range*. Token 1 and token 1000 are exactly one dot product apart.

The mechanism that makes this work is built entirely out of operations you already know: linear projections (matrix multiplies), dot products (the *Dot product* lesson), softmax (rescales scores to sum to 1), and a weighted average. Once you see those four pieces snap together, attention stops being mysterious.`},{kind:"prose",heading:"Q, K, V — three views of the same token",body:`Every input token starts as a single embedding vector \\(x \\in \\mathbb{R}^{d_{\\text{model}}}\\). Attention immediately projects it into three different vectors using three learned weight matrices:

- **Query** \\(q = W_Q x\\) — "what am I looking for?" The thing this token wants to find in the sequence.
- **Key** \\(k = W_K x\\) — "what do I advertise?" The thing this token offers to be matched against.
- **Value** \\(v = W_V x\\) — "what do I deliver if matched?" The actual content this token contributes.

Think of it like a library lookup. The query is your search query. The keys are the spines of every book on the shelf. You compare your query to every key (dot product), the closest matches get the highest scores (softmax), and you walk away with a weighted blend of the books' actual contents (the values).

Crucially, all three projections come from the *same* token \\(x\\). It is asking, advertising, and delivering simultaneously. The Q, K, V matrices are learned during training — the model figures out, for each layer, what aspects of each token should be exposed as a query, a key, or a value.`},{kind:"math",heading:"The scaled dot-product attention formula",body:`Stack all the queries into a matrix \\(Q \\in \\mathbb{R}^{n \\times d_k}\\) (one row per token), all the keys into \\(K \\in \\mathbb{R}^{n \\times d_k}\\), all the values into \\(V \\in \\mathbb{R}^{n \\times d_v}\\). The entire attention layer is one line:

\\[
\\text{Attention}(Q, K, V) = \\text{softmax}\\!\\left( \\frac{Q K^\\top}{\\sqrt{d_k}} \\right) V
\\]

Read it piece by piece:

1. \\(Q K^\\top\\) — an \\(n \\times n\\) matrix of raw similarity scores. Entry \\((i, j)\\) is \\(q_i \\cdot k_j\\), the dot product of token \\(i\\)'s query with token \\(j\\)'s key. High score means "token \\(i\\) wants what token \\(j\\) has." This is the *Dot product* lesson stacked into a matrix — same primitive, same hardware path.
2. \\(\\div \\sqrt{d_k}\\) — divide every score by the square root of the key dimension. This is the "scaled" in scaled dot-product attention. Skip it and the softmax saturates as \\(d_k\\) grows.
3. \\(\\text{softmax}(\\cdot)\\) — applied row-wise. Each row becomes a probability distribution over the \\(n\\) keys, summing to 1. These are the **attention weights**.
4. \\(\\cdot V\\) — multiply the weights by the value matrix. Each output row is a weighted average of the value vectors, where the weights come from how strongly that token's query matched each token's key.

That is the entire layer. One matrix product to compute scores, a softmax, one more matrix product to mix the values.`},{kind:"callout",tone:"tip",body:"**Why divide by \\(\\sqrt{d_k}\\)?** If \\(q\\) and \\(k\\) are independent vectors with components drawn from a unit-variance distribution, their dot product \\(q \\cdot k\\) has variance \\(d_k\\) — it grows with the dimension. For typical transformer sizes \\(d_k\\) is 64 or 128, which would make some pre-softmax scores enormous (10+ in magnitude). Softmax of a vector containing one large entry collapses to a one-hot distribution, killing the gradient for every other position. Dividing by \\(\\sqrt{d_k}\\) rescales the variance back to 1 so the softmax stays well-behaved at every depth."},{kind:"ascii",heading:"One token, one attention step",caption:"Token 2 queries the sequence. Scores then softmax then weighted blend of value vectors.",body:`   queries           keys                       scores
   q1  q2  q3        k1  k2  k3                   (q2 . k_j)

        |        ___________________            ___________
        |       /         |         \\          / 0.4 | ... \\
        v      v          v          v        /  2.7 | ... |   <- raw
   [ q2 ]  .  [ k1 ]   [ k2 ]   [ k3 ]   =   \\  1.1 | ... /
                                              \\___________/
                                                    |
                                              / sqrt(d_k)
                                                    |
                                              softmax row
                                                    |
                                       weights:  [0.1, 0.7, 0.2]
                                                    |
                                                    v
                              0.1 * v1  +  0.7 * v2  +  0.2 * v3
                                                    |
                                                    v
                                          output for token 2`},{kind:"viz",component:"AttentionHeatmap",props:{},heading:"Type a sentence. See which token attends to which."},{kind:"code",language:"python",heading:"Scaled dot-product attention in PyTorch",body:`import torch
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
    return weights @ V, weights`},{kind:"prose",heading:"Multi-head attention — same idea, in parallel",body:`A single attention layer pools information one way. But a sentence has many kinds of structure simultaneously — syntactic agreement, coreference, topic, sentiment, position — and forcing one set of Q, K, V projections to model all of them is a bottleneck.

**Multi-head attention** runs \\(h\\) attention operations in parallel, each with its own \\(W_Q, W_K, W_V\\) matrices projecting into a smaller dimension \\(d_k = d_{\\text{model}} / h\\). Each head learns a different attention pattern — one head might track subject-verb agreement, another might point each pronoun back to its antecedent, another might mark sentence boundaries. The outputs are concatenated along the feature dimension and run through one final projection \\(W_O\\) to mix the heads back together.

The total compute is roughly the same as single-head attention at the full \\(d_{\\text{model}}\\), because each head works in a smaller subspace. You get the diversity essentially for free, and empirically it is the single most important hyperparameter after model size.`},{kind:"prose",heading:"Causal masking — attention for decoders",body:`Encoders (like BERT) let every token attend to every other token — fully bidirectional. Decoders (like GPT) cannot: at training time you want to predict token \\(i+1\\) from tokens \\(1..i\\), so token \\(i\\) must not see anything to its right, or the model would cheat by reading the answer.

The fix is a **causal mask**: before the softmax, set every score \\(\\text{scores}[i, j]\\) where \\(j > i\\) to \\(-\\infty\\). Softmax of \\(-\\infty\\) is exactly 0, so those positions get zero attention weight. Mechanically it is a single \\(n \\times n\\) upper-triangular matrix of \\(-\\infty\\) added to the scores. The forward pass cost is identical; only the mask changes.

The same masking machinery handles padding (set scores for pad tokens to \\(-\\infty\\)) and sliding-window attention (set scores outside the window to \\(-\\infty\\)). One primitive, three jobs.`},{kind:"callout",tone:"note",body:"**Causal mask, in code.** Build it once per sequence length: `mask = torch.tril(torch.ones(n, n))`. Pass it to `scaled_dot_product_attention` above. Position \\((i, j)\\) is 1 if \\(j \\le i\\) (allowed) and 0 otherwise; `masked_fill` then drops the disallowed scores to \\(-\\infty\\) before softmax. Every autoregressive language model from GPT-2 onward is doing exactly this under the hood."},{kind:"prose",heading:"KV cache — why attention dominates inference cost",body:`At training time you process the whole sequence in one shot. At inference time, autoregressive generation produces one token, appends it, then runs the model again to produce the next. Naively, each new token would recompute \\(K\\) and \\(V\\) for the entire prefix — \\(O(n^2)\\) work per token, \\(O(n^3)\\) total to generate \\(n\\) tokens. That is unworkable.

The fix is the **KV cache**: store the key and value vectors for every past token, and at each generation step only compute \\(Q, K, V\\) for the *new* token. Append its \\(K\\) and \\(V\\) to the cache, and attention reduces to a single new query attending over the cached keys and values — \\(O(n)\\) per step, \\(O(n^2)\\) total.

This is also why long-context LLMs are memory-hungry. The KV cache scales linearly with sequence length, number of layers, and number of heads. For a 70B-parameter model at 100k context, the KV cache can be tens of gigabytes — larger than the model weights themselves. Most of the recent work on efficient LLM serving (paged attention, grouped-query attention, multi-query attention, sliding-window attention) is about shrinking or sharing this cache. Attention dominates inference because *the cache* dominates inference, and the cache exists because attention needs every past key and value to compute the next output.`},{kind:"prose",heading:"What to take away",body:`Attention is a softmax over scaled dot products, followed by a weighted average of value vectors. Every token splits itself into three roles — query, key, value — and queries get matched to keys to decide how much of each value to mix into the output. Scaling by \\(\\sqrt{d_k}\\) keeps the softmax in a workable regime. Multi-head attention runs the same machinery in parallel subspaces so each head can specialise. Causal masking turns the encoder version into the decoder version without changing a single matrix multiply.

Once you internalise this, the rest of the transformer stack is bookkeeping: residual connections to let gradients flow, layer norm to keep activations stable, a position-wise feed-forward block after attention to add depth, and positional encodings so the model can tell token 5 from token 50. Attention is the load-bearing idea. Every other piece is there to support it.`}]}]},rl:{title:"Reinforcement Learning",oneLiner:"Bellman equations, policy gradients, Q-learning, PPO. From bandits to RLHF.",iconName:"Zap",lessons:[{slug:"markov-decision-processes",title:"Markov Decision Processes",oneLiner:"The mathematical frame every RL algorithm secretly lives inside.",difficulty:"intermediate",readMinutes:11,sections:[{kind:"prose",heading:"The frame underneath every RL algorithm",body:`Every reinforcement learning paper — DQN, AlphaGo, PPO, RLHF — opens with a sentence like "we model the problem as a Markov Decision Process" and then never explains what one is. The MDP is the mathematical object the whole field stands on, the way the vectors lesson was the object linear algebra stood on. Once you can sketch one on a napkin, every RL algorithm reduces to "a clever way to solve this specific MDP without enumerating it."

An MDP is a thought experiment about an agent that lives inside a world. At each tick of the clock the world is in some **state** \\(s\\). The agent picks an **action** \\(a\\). The world then does two things at once: it pays the agent a **reward** \\(r\\), and it transitions to a new state \\(s'\\). The agent's job is to pick actions, forever, in a way that maximises the *total* reward it collects over time. That is the whole setup. Robotics, games, dialogue, recommendation, ad bidding — all of them fit this template once you choose what \\(s\\), \\(a\\), and \\(r\\) mean.

The reason the frame is useful is that it is small. Only five things to specify: states, actions, transitions, rewards, discount. That is the entire alphabet RL has to work with.`},{kind:"math",heading:"The MDP tuple",body:`An MDP is a 5-tuple \\((S, A, P, R, \\gamma)\\):

\\[
\\text{MDP} = (S,\\; A,\\; P,\\; R,\\; \\gamma)
\\]

- \\(S\\) — the set of **states** the world can be in. Finite or continuous. Position-of-the-robot, board configuration, pixel buffer, conversation so far.
- \\(A\\) — the set of **actions** the agent can choose. Often state-dependent: \\(A(s)\\).
- \\(P(s' \\mid s, a)\\) — the **transition probability**. The chance that taking action \\(a\\) in state \\(s\\) lands you in state \\(s'\\). This is where the *stochastic* world lives — wind nudges the drone, dice roll, opponent moves.
- \\(R(s, a)\\) — the **reward** the agent collects for taking \\(a\\) in \\(s\\). A real number. Sometimes written \\(R(s, a, s')\\) if the reward depends on where you land.
- \\(\\gamma \\in [0, 1]\\) — the **discount factor**. How much you value reward one step in the future relative to right now.

The **Markov property** is the one constraint that makes the math tractable: \\(P(s' \\mid s, a)\\) depends only on the *current* state \\(s\\) and action \\(a\\) — not on how you got to \\(s\\). The present screens off the past. If your problem violates that, you fold the missing history into the state until it stops violating it.`},{kind:"ascii",heading:"A 4x4 grid world",caption:"Start at S, reach G. Walls block movement. Arrows show the optimal action in each cell after value iteration converges.",body:`   col:    0       1       2       3
          +-------+-------+-------+-------+
   row 0  |  S    |  >    |  >    |  v    |
          |  >    |       |       |       |
          +-------+-------+-------+-------+
   row 1  |  ^    | #####|  >    |  v    |
          |       | WALL |       |       |
          +-------+-------+-------+-------+
   row 2  |  ^    | ##### |  ^    |  v    |
          |       | WALL |       |       |
          +-------+-------+-------+-------+
   row 3  |  ^    |  >    |  >    |  G    |
          |       |       |       | +1.0  |
          +-------+-------+-------+-------+

   states  S = 16 cells, two of them are walls (no entry)
   actions A = { up, down, left, right }
   reward  R = -0.04 per step, +1.0 on entering G
   gamma   = 0.9    -> agent is patient but not infinitely so

   arrows above = argmax_a Q(s, a) once value iteration converges`},{kind:"prose",heading:"Policy, value, and Q — the three things the agent computes",body:`Once the MDP is specified, three derived objects do all the work, and every RL algorithm is a way of computing one of them.

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

\\(Q\\) is what DQN learns. \\(V\\) is what value iteration computes. A policy can be read directly off either: \\(\\pi^{*}(s) = \\arg\\max_{a} Q^{*}(s, a)\\), or one step of lookahead through the transition model from \\(V\\). Three objects, one underlying truth.`},{kind:"math",heading:"The Bellman equation",body:`The whole field rests on one recursion. The optimal value of a state equals the best immediate reward plus the discounted optimal value of where you land:

\\[
V^{*}(s) \\;=\\; \\max_{a \\in A} \\left[\\, R(s, a) \\;+\\; \\gamma \\sum_{s' \\in S} P(s' \\mid s, a)\\, V^{*}(s') \\,\\right]
\\]

Read it left to right. To know how good a state is, look at every action you could take. For each, sum the immediate reward with the discounted expected value of the next state. The best of those numbers *is* the value of the current state. That is the Bellman optimality equation.

The Q-form is the same statement, shifted by one action:

\\[
Q^{*}(s, a) \\;=\\; R(s, a) \\;+\\; \\gamma \\sum_{s' \\in S} P(s' \\mid s, a)\\, \\max_{a'} Q^{*}(s', a')
\\]

Two things to notice. First, this is a **fixed-point equation** — \\(V^{*}\\) is the function that, when fed into the right-hand side, comes back out unchanged. Second, the \\(\\max\\) is what makes RL hard. Without it, Bellman is just a linear system in \\(|S|\\) unknowns and you solve it with one matrix inverse. With the \\(\\max\\), you cannot — and every RL algorithm is a way of dodging that fact.`},{kind:"prose",heading:"Value iteration — just iterate the Bellman backup",body:`Here is the cleanest algorithm in RL, and the one to keep in your head as the baseline every other method is trying to approximate. Initialise \\(V(s) = 0\\) for every state. Then repeatedly apply the Bellman equation *as an assignment*:

\\[
V_{k+1}(s) \\;\\leftarrow\\; \\max_{a} \\left[ R(s, a) + \\gamma \\sum_{s'} P(s' \\mid s, a)\\, V_{k}(s') \\right]
\\]

Sweep over every state, update its value, repeat. The mapping is a contraction with factor \\(\\gamma\\), so \\(V_{k}\\) converges to \\(V^{*}\\) geometrically — every iteration shrinks the error by at least \\(\\gamma\\). Once it converges, read off the optimal policy by one greedy lookahead per state. That is the whole algorithm.

**Policy iteration** is the close cousin. It alternates two steps. *Policy evaluation*: fix a policy \\(\\pi\\), solve the linear system for \\(V^{\\pi}\\) (no \\(\\max\\), so this is tractable). *Policy improvement*: replace \\(\\pi\\) at every state with the greedy action under \\(V^{\\pi}\\). Repeat. It often converges in fewer iterations than value iteration because each policy-evaluation step makes a big jump, but each step is more expensive.

The catch on both: they need the transition model \\(P\\) and the reward function \\(R\\) up front, and they need to enumerate \\(S\\). For a 4x4 grid that is fine. For Atari pixels or board positions in Go, \\(|S|\\) is astronomically large, you do not know \\(P\\), and you have to learn from sampled experience instead. That is *model-free* RL, and Q-learning, SARSA, DQN, policy gradient, actor-critic, PPO are all answers to "how do we approximate the Bellman backup when we cannot enumerate or transition-model the world?"`},{kind:"code",language:"python",heading:"Value iteration on the grid-world above",body:`import numpy as np

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
print(policy[(0, 0)])   # '>'  — head right toward the goal`},{kind:"callout",tone:"tip",body:`**\\(\\gamma\\) is the agent's patience dial.** As \\(\\gamma \\to 1\\) the agent values a reward a hundred steps from now almost as much as one right now — it will accept long detours for a bigger payoff and you get long-horizon planning. As \\(\\gamma \\to 0\\) it becomes myopic — only the immediate reward matters and the policy collapses to "grab the closest treat." Most practical work sits at \\(\\gamma \\in [0.9, 0.99]\\): patient enough to plan, low enough to keep the Bellman backup a contraction and the math finite. \\(\\gamma = 1\\) is only safe in *episodic* tasks where every trajectory is guaranteed to end.`},{kind:"callout",tone:"note",body:"**When the Markov property breaks: POMDPs.** If the agent cannot fully observe the state — a poker player does not see their opponent's cards, a robot has noisy sensors, a dialogue agent does not see the user's intent — you have a **Partially Observable MDP**. The agent receives an observation \\(o\\) drawn from \\(O(o \\mid s)\\) instead of \\(s\\) itself, and the Markov property no longer holds over observations. The classic fix is to act on a **belief state**: a probability distribution over the true \\(s\\), updated by Bayes' rule. The belief is Markov even when the observations are not. In modern deep RL the recurrent or transformer policy plays the role of the belief — it folds the observation history into a hidden state until the Markov property is restored over that hidden state."},{kind:"prose",heading:"Where the MDP shows up in real systems",body:`Every famous RL result is an MDP underneath, with a different choice of \\((S, A, P, R, \\gamma)\\).

**Atari and DQN.** State is the last four pixel frames stacked. Actions are the joystick buttons. Transitions are the emulator. Reward is the game score. \\(\\gamma = 0.99\\). DQN learns \\(Q(s, a)\\) with a convolutional network instead of a table, and the Bellman backup becomes the loss \\((r + \\gamma \\max_{a'} Q_{\\theta^{-}}(s', a') - Q_{\\theta}(s, a))^{2}\\) trained on replay-buffer samples. Same recursion, sampled instead of summed.

**Robotics and PPO.** State is joint angles, velocities, sensor readings. Actions are torques — continuous, so \\(\\arg\\max_{a}\\) is impractical. The agent learns a stochastic policy \\(\\pi_{\\theta}(a \\mid s)\\) directly and updates it via the policy-gradient theorem. PPO adds a clipped objective so each gradient step cannot shove the policy too far from the previous one — the same Bellman backup, but used as a baseline for the gradient rather than a fixed-point target.

**RLHF on language models.** State is the prompt plus tokens generated so far. Actions are the next token. The transition is deterministic (the chosen token is appended). The reward is whatever the reward model thinks a human would prefer, paid only at the end of the response. \\(\\gamma\\) is close to 1 because reward is sparse and arrives many tokens later. The policy is the LLM itself; PPO updates its parameters to raise expected reward while a KL penalty stops it from drifting away from the supervised-fine-tuned base. Same five-tuple, same Bellman equation under the hood — just at the scale of a 70-billion-parameter policy and a token vocabulary as the action space.

The trick to reading any RL paper fast is to skip to the third paragraph and ask: what is \\(S\\)? what is \\(A\\)? what is \\(R\\)? Once those are pinned, the rest of the algorithm is one of a small number of standard ways to chase \\(V^{*}\\) or \\(Q^{*}\\) without enumerating \\(S\\).`},{kind:"prose",heading:"What to take away",body:`An MDP is the universal frame for sequential decision-making: a state space \\(S\\), an action space \\(A\\), stochastic transitions \\(P(s' \\mid s, a)\\), a reward \\(R(s, a)\\), and a discount \\(\\gamma\\). The Markov property — future depends only on the present state — is the constraint that makes the recursion finite. A policy \\(\\pi(a \\mid s)\\) picks actions; the value functions \\(V^{\\pi}\\) and \\(Q^{\\pi}\\) score how good a state or state-action pair is in expected discounted reward. The Bellman equation is the fixed-point relation those values satisfy, and value iteration and policy iteration are the two textbook ways to solve it when the model is known and the state space is small.

Every model-free RL algorithm in the next lessons is a way to chase the same Bellman fixed point when you cannot enumerate \\(S\\) and do not know \\(P\\) — by sampling trajectories, approximating \\(V\\) or \\(Q\\) with a neural network, or pushing on the policy gradient directly. The vectors lesson taught you that linear algebra is one shape repeated. RL is the same — one tuple, one recursion, dressed up at a million different scales.`}]}]},numerical:{title:"Numerical Methods",oneLiner:'Floating-point gotchas, root finding, ODE solvers, FFT — the "why is my loss NaN" toolkit.',iconName:"Network",lessons:[{slug:"floating-point",title:"Floating point",oneLiner:"Why 0.1 + 0.2 ≠ 0.3, and why your loss randomly becomes NaN.",difficulty:"intermediate",readMinutes:10,sections:[{kind:"prose",heading:"Computers do not store real numbers",body:`A real number has infinitely many digits. A computer has finitely many bits. Something has to give, and the thing that gives is exactness. Every floating-point number you have ever printed is an *approximation* of the value you wrote down in code — close enough that you usually do not notice, and exactly far enough off to ruin a training run when you do not pay attention.

The vectors lesson built up the picture of numbers as points in \\(\\mathbb{R}^n\\) — a clean, continuous space where addition is associative and \\(0.1 + 0.2\\) equals \\(0.3\\). Floating point is the *engineering compromise* that lets you do arithmetic on those numbers at GPU speed, and it breaks every one of those clean algebraic properties at the seams. Addition is no longer associative. Subtraction can wipe out every meaningful digit you had. The number line is no longer uniform. Two values you wrote as equal in source code might not be equal once they hit the FPU.

Everything in this lesson is one paid lesson: the rules of arithmetic you learned in school *do not hold* on a computer, and the gap between school rules and silicon rules is exactly where your NaN-shaped bugs live.`},{kind:"math",heading:"IEEE 754 single precision (fp32), bit by bit",body:`IEEE 754 single precision — what NumPy calls \`float32\` and PyTorch calls \`torch.float32\` — packs a real number into 32 bits, split into three fields:

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

This is the smallest positive number such that \\(1.0 + \\varepsilon \\ne 1.0\\) in fp32. Add anything smaller than \\(\\varepsilon\\) to \\(1.0\\) and it disappears. The same idea, written differently for fp64: \\(\\varepsilon_{\\text{fp64}} = 2^{-52} \\approx 2.22 \\times 10^{-16}\\) — about nine orders of magnitude finer.`},{kind:"code",language:"python",heading:"The classic surprise",body:`# the example every numerical-methods course opens with
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
print(math.isclose(0.1 + 0.2, 0.3, rel_tol=1e-9, abs_tol=1e-12))      # True`},{kind:"ascii",heading:"Float spacing is not uniform",caption:"fp32 representable values are dense near 0 and sparse at large magnitudes. The gap doubles with every binade.",body:`   exponent:     2^-3           2^-2           2^-1            2^0             2^1             2^2

   gap size:    eps/8          eps/4          eps/2            eps             2*eps           4*eps

   values:    | | | | | | | |  |  |  |  |  |  |  |  |   |   |   |   |   |   |   |    |     |     |     |     |       |       |       |
              ^               ^               ^                ^                  ^                       ^
            0.125             0.25            0.5              1.0                2.0                     4.0

   there are exactly 2^23 representable fp32 numbers in [1, 2)
   exactly 2^23 in [2, 4) too — but spread over twice the range
   so the gap doubles every time you cross a power of two

   near 0:  gaps shrink to ~1.4e-45 (subnormals)
   near 1e38:  gaps swell to ~2e31 — bigger than most quantities ever measured`},{kind:"prose",heading:"Why density matters in ML",body:`Two consequences of the non-uniform spacing show up constantly in deep learning.

**Small numbers have plenty of room.** Gradients that come out at \\(10^{-6}\\) are still resolved at full fp32 precision — there are still about \\(2^{23}\\) representable values between \\(10^{-6}\\) and \\(10^{-5}\\). This is why "tiny" gradient updates can still nudge weights in a meaningful direction. The optimizer is not lying when it says it moved a weight by \\(3 \\times 10^{-7}\\); fp32 has the resolution to register that move at parameter magnitudes near zero.

**Large numbers lose resolution fast.** At magnitude \\(10^{6}\\), the gap between consecutive fp32 numbers is already about \\(0.12\\). At \\(10^{8}\\) it is about \\(15\\). Add 1 to a fp32 number near \\(10^{8}\\) and the result is the same number you started with — the +1 fell into the gap and was rounded away. This is the failure mode behind running counters or sums in fp32 instead of fp64: after enough increments the counter stops moving. It is also the failure mode that bites Adam's running-average state when \\(\\beta_2\\) is too close to 1 — the moving second moment grows large enough that small new gradients cannot perturb it.

The mental model: fp32 is **logarithmic**, not linear. Each binade (range \\([2^k, 2^{k+1})\\)) contains the same number of representable values, regardless of \\(k\\). You get the same *relative* precision everywhere — about 7 decimal digits — but the *absolute* precision varies by 70+ orders of magnitude across the representable range.`},{kind:"code",language:"python",heading:"fp16, fp32, fp64 — what each one costs you",body:`import numpy as np

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
# bf16 dynamic range matches fp32; precision is ~3 decimal digits.`},{kind:"prose",heading:"Catastrophic cancellation — the silent killer",body:`Subtracting two nearly-equal floats does not just lose precision. It can **erase every meaningful digit you had**. This is *catastrophic cancellation*, and it is the single most common cause of "my numerical code returned garbage but did not crash."

The mechanism: suppose \\(a = 1.0000001\\) and \\(b = 1.0000000\\), both stored in fp32. Each has 7 decimal digits of precision, so the trailing \`1\` in \\(a\\) is right at the edge of resolution — possibly already a little wrong. When you compute \\(a - b\\), the leading six digits cancel exactly, leaving \\(10^{-7}\\) — but every digit in that result came from the noisy tail of \\(a\\). You wrote a subtraction expecting 7 digits of precision; you got back something with **zero** reliable digits. The number looks fine; it is wrong.

Real ML places where this bites: computing \\((x - \\bar{x})^2\\) for variance when \\(x \\approx \\bar{x}\\), computing \\(\\log(1 + p) - \\log(p)\\) for small \\(p\\) instead of using \\(\\log(1/p + 1)\\), computing differences of cosines or of nearby probabilities, computing finite-difference gradients with too small a step size. In every case the fix is to *rearrange the math* so the subtraction never happens — Welford's online variance, \\(\\text{log1p}\\), trigonometric identities, automatic differentiation instead of finite differences.`},{kind:"code",language:"python",heading:"Catastrophic cancellation — sum of cosines",body:`import numpy as np

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
# happens analytically (on paper), and let the computer evaluate the rearranged form.`},{kind:"prose",heading:"Overflow, underflow, NaN — and how NaN spreads",body:'Three failure modes get their own bit patterns at the top of the IEEE 754 range.\n\n**Overflow** happens when a result is larger than \\(\\text{max} \\approx 3.4 \\times 10^{38}\\) for fp32 (or \\(65504\\) for fp16). The result becomes \\(+\\infty\\). Subsequent arithmetic mostly respects infinity (\\(\\infty + 1 = \\infty\\), \\(\\infty \\cdot 2 = \\infty\\)) but \\(\\infty - \\infty = \\text{NaN}\\), \\(\\infty / \\infty = \\text{NaN}\\), and \\(0 \\cdot \\infty = \\text{NaN}\\). In practice: `exp(x)` for `x > 88` overflows in fp32; `exp(x)` for `x > 11` overflows in fp16. This is why softmax of unscaled attention scores blows up in fp16 — and why mixed-precision training keeps the softmax in fp32.\n\n**Underflow** is the opposite. A result smaller than \\(\\text{min normal} \\approx 1.18 \\times 10^{-38}\\) for fp32 either drops into the subnormal range (still representable, lower precision) or rounds to zero. In ML this is mostly an issue for `exp(-x)` of large positive `x`, for products of many small probabilities, and for very small gradients in fp16 — they vanish silently and the affected weight stops updating.\n\n**NaN** is "not a number" — the bit pattern returned by any operation that has no sensible answer: \\(0 / 0\\), \\(\\sqrt{-1}\\), \\(\\log(-1)\\), \\(\\infty - \\infty\\). NaN has one essential property: it **infects everything it touches**. \\(\\text{NaN} + 1 = \\text{NaN}\\), \\(\\text{NaN} \\cdot 0 = \\text{NaN}\\), \\(\\text{NaN} > 0\\) is `False` and \\(\\text{NaN} < 0\\) is also `False` (it is unordered with respect to every other value). One NaN gradient anywhere in your model contaminates the entire weight update, and the next forward pass returns NaN for every loss in the batch.\n\nThe propagation is why "my loss became NaN at step 47214" is so frustrating to debug: by the time you noticed, the weights have been NaN-poisoned for thousands of steps and the original triggering operation is long gone. The usual culprits: `log(0)` from an unclipped softmax output, `0 / 0` from an unmasked padding token in attention, `sqrt` of a slightly-negative variance estimate, `exp` of an oversized logit, or gradient explosion that exceeded fp16\'s range.'},{kind:"math",heading:"The log-sum-exp trick",body:`Softmax of a vector \\(z = [z_1, \\ldots, z_n]\\) is

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

which is what cross-entropy losses use under the hood to avoid taking \\(\\log\\) of an underflowed softmax. Always use \`torch.nn.functional.log_softmax\` and \`torch.nn.CrossEntropyLoss\` together; never compute \`log(softmax(z))\` manually unless you enjoy debugging NaN.`},{kind:"callout",tone:"tip",body:'**Always use log-sum-exp for softmax stability.** If you ever find yourself writing `F.softmax(x); ... torch.log(p)`, stop and rewrite as `F.log_softmax(x)`. The two-step version overflows on the exp and underflows on the log; the fused version handles both internally with the max-subtraction trick. Same algebra, completely different numerics. This single substitution prevents most "loss became inf then NaN" failures in language-model training.'},{kind:"prose",heading:"fp16, bf16, fp8 — the mixed-precision tradeoffs",body:`Modern GPUs run much faster on 16-bit floats than on 32-bit. The catch is that the two common 16-bit formats trade different things away.

**fp16 (IEEE 754 half precision):** 1 sign + 5 exponent + 10 mantissa. Dynamic range \\([-65504, 65504]\\), about 3 decimal digits of precision. *Cheap to compute, easy to overflow.* Attention scores and exponentials routinely blow past 65504. Mixed-precision training (PyTorch \`autocast\`, NVIDIA Apex) keeps the matmuls in fp16 but the loss, softmax, and master weight copy in fp32, plus a *gradient scaler* that multiplies the loss by a large constant before backprop and divides it out before applying the update — keeping small gradients out of the underflow zone.

**bf16 (bfloat16):** 1 sign + 8 exponent + 7 mantissa. Same exponent range as fp32, far less precision. Dynamic range \\(\\approx [-3.4 \\times 10^{38}, 3.4 \\times 10^{38}]\\), about 2 decimal digits of precision. *Almost never overflows, never needs a gradient scaler.* This is why Google's TPUs and the H100 generation onward default to bf16 for training — the convergence behaviour is closer to fp32 in practice, and the engineering is dramatically simpler. The cost is that bf16 is a poor choice for *inference* on small models where the lower precision shows up as visible quality loss.

**fp8 (E4M3 and E5M2):** 1 sign + 4 or 5 exponent + 3 or 2 mantissa. Two formats because no single 8-bit layout handles both gradients (need range) and activations (need precision) well. *Cutting-edge as of H100/B200.* Used with per-tensor scaling factors and sometimes per-block scales. About 1 decimal digit of precision. Training stability requires careful loss scaling, careful tensor-by-tensor format choice, and accumulating matmul outputs back into fp32 for the addition step.

The rule of thumb: bf16 if your hardware supports it (it is the easiest), fp16 with a grad scaler if it does not, fp8 only if you are pushing for the very largest models and have a team that can debug numerical issues. Mixed-precision is almost always 2-3x faster than pure fp32 and uses half the memory; the engineering is worth it.`},{kind:"callout",tone:"note",body:"**Kahan summation when you really cannot afford the error.** When you must sum a huge array in fp32 without falling back to fp64, *Kahan summation* (also called *compensated summation*) keeps a running correction term that absorbs the low-order bits lost at each addition. Cost: roughly 4x the arithmetic of a naive sum. Benefit: error grows like \\(O(\\varepsilon)\\) instead of \\(O(n \\varepsilon)\\). NumPy's `np.sum` uses *pairwise summation* (a divide-and-conquer variant with \\(O(\\varepsilon \\log n)\\) error) as a cheaper compromise — this is why `arr.sum()` is more accurate than a hand-written `for` loop. If you are writing custom reductions in CUDA, this is the trick the framework authors are doing for you."},{kind:"prose",heading:"Common ML bugs and their floating-point roots",body:'Almost every "training mysteriously diverged" or "loss is NaN" bug traces back to one of a small handful of patterns. Knowing the patterns lets you skip the bisection and go straight to the fix.\n\n**`log(0)`** — taking the log of a probability that was zero or rounded to zero. Happens in cross-entropy when a class probability underflows, in policy-gradient RL when a deterministic policy produces an unexplored action, in NLL losses on padded tokens. *Fix:* clip probabilities to `[eps, 1 - eps]` before `log`, or use `log_softmax` + `nll_loss` instead of computing the log yourself.\n\n**Divide-by-zero** — most often in normalization (dividing by a variance that came out exactly zero), in importance-sampling weights, in attention scores after a fully-masked row. *Fix:* add a small `eps` (typically `1e-8` for fp32, `1e-5` for fp16) to the denominator: \\(x / (\\sigma + \\varepsilon)\\). Every `LayerNorm` and `BatchNorm` implementation does this.\n\n**`exp(huge)`** — softmax overflow as described above; also `exp` in Boltzmann distributions, in Gaussian likelihoods with tiny variance. *Fix:* log-sum-exp, or work in log-space throughout and never exponentiate.\n\n**NaN propagation** — once a NaN is introduced, every downstream gradient is NaN, every weight update wipes a parameter. *Fix:* turn on `torch.autograd.set_detect_anomaly(True)` during development (slow but pinpoints the first NaN op), check gradient norms at each step in production, and *abort the batch* on NaN rather than applying the update.\n\n**Gradient \\(\\to\\) NaN** — usually exploding gradients (norm growing without bound) or fp16 overflow. *Fix:* gradient clipping (`torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)`), a lower learning rate, a warmup schedule, or switching to bf16.'},{kind:"code",language:"python",heading:"Debugging numerics in PyTorch",body:`import torch

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
assert torch.isfinite(loss), f"loss is {loss.item()} at step {step}"`},{kind:"prose",heading:"What to take away",body:"Floating point is the compromise that buys you GPU-speed arithmetic at the cost of every clean algebraic property you learned in school. fp32 packs a number into 1 + 8 + 23 bits and gives you about seven decimal digits of *relative* precision — non-uniformly distributed, denser near zero. Adding numbers across very different magnitudes drops the small one. Subtracting nearly-equal numbers wipes out your precision entirely. Exponentials overflow easily; logarithms of underflowed probabilities go to \\(-\\infty\\); a single NaN poisons every downstream computation.\n\nThe fixes are old and well-known: log-sum-exp for softmax, \\(\\text{log1p}\\) and \\(\\text{expm1}\\) for small arguments, Welford for streaming variance, Kahan summation for big reductions, gradient clipping for exploding norms, mixed precision with bf16 for the speedup without the headaches. None of this is glamorous, but every percentage point of accuracy you lose to NaN-induced reruns is worth more than a percentage point of speedup. Treat floating point as a leaky abstraction you can program *around* — never assume `a + b == b + a` survives in production code, and you will spend dramatically less time wondering why your loss curve has a vertical asymptote at step 47214."}]}]}};function i(e){return a[e]||null}function s(e,n){const t=a[e];return t&&t.lessons.find(o=>o.slug===n)||null}export{a as P,s as a,i as g};
