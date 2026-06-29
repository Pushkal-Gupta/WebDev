---
slug: ps-linear-regression
module: prob-stats
title: Simple Linear Regression and Least Squares
subtitle: Fitting a straight line to a cloud of points by minimizing squared vertical distances — and reading off how much of the spread it explains.
difficulty: Intermediate
position: 7
estimatedReadMinutes: 15
prereqs: [ps-expectation-variance, ps-clt-sampling]
relatedProblems: []
references:
  - title: "Khan Academy — Exploring bivariate numerical data (least-squares regression)"
    url: "https://www.khanacademy.org/math/statistics-probability/describing-relationships-quantitative-data"
    type: course
  - title: "StatQuest — Linear Regression, Clearly Explained!!!"
    url: "https://www.youtube.com/watch?v=nk2CQITm_eo"
    type: video
  - title: "StatQuest — R-squared, Clearly Explained!!!"
    url: "https://www.youtube.com/watch?v=2AQKmw14mHM"
    type: video
  - title: "Seeing Theory — Regression Analysis (interactive)"
    url: "https://seeing-theory.brown.edu/regression-analysis/index.html"
    type: interactive
status: published
---

## intro
You have a scatter of points — square footage against price, study hours against exam score, temperature against ice-cream sales — and a hunch that a straight line summarizes the relationship. **Simple linear regression** turns that hunch into a precise answer: the single line \(\hat{y}=\beta_0+\beta_1 x\) that fits the cloud *best*, where "best" means the line that makes the total squared vertical miss as small as possible. The slope tells you how much \(y\) moves per unit of \(x\); the intercept anchors the line; and one extra number, \(R^2\), tells you how much of the scatter the line actually accounts for. It is the workhorse of applied statistics and the first model every data scientist reaches for.

## whyItMatters
Linear regression is the most-used statistical model on the planet, and for good reason: it is interpretable, cheap to fit, and the building block under almost everything heavier. A fitted slope is a *direct, quotable* answer — "each extra bedroom adds about \$24k" — that decision-makers can act on, unlike a black-box prediction. It is the foundation of forecasting, A/B-test analysis (a regression with a binary treatment is just a difference in means), feature-effect estimation, and the entire family of generalized linear models, ridge, lasso, and even a single neuron in a network. The closed-form least-squares solution connects straight back to covariance and variance, so understanding it deepens your grasp of those too. And the diagnostic \(R^2\), residual plots, and the correlation-versus-causation trap it forces you to confront are skills every analyst is expected to have.

## intuition
Picture the scatter of points and imagine laying a stick across them. Tilt and slide the stick until it threads the cloud as snugly as possible. To make "snugly" precise we need a way to score a candidate line. For each point \((x_i,y_i)\) the line predicts \(\hat{y}_i=\beta_0+\beta_1 x_i\), and the **residual** \(e_i=y_i-\hat{y}_i\) is the vertical gap between the actual point and the line — how badly the line missed *that* point. We measure miss *vertically*, not perpendicularly, because we are predicting \(y\) from \(x\): the error we care about is in the thing we are guessing.

Why square the residuals instead of taking absolute values? Two reasons. Squaring punishes a big miss far more than a small one, so the fit refuses to leave any point wildly off; and squared loss is smooth, giving a clean closed-form solution where absolute loss does not. So the objective is the **sum of squared residuals**, \(\mathrm{SS}_{\text{res}}=\sum_i (y_i-\beta_0-\beta_1 x_i)^2\), and the best line is the one that minimizes it — hence "least squares."

Here is the satisfying part: that minimization has a clean answer. Set the derivatives with respect to \(\beta_0\) and \(\beta_1\) to zero and the slope falls out as a ratio you already know:
\[
\beta_1=\frac{\sum_i (x_i-\bar{x})(y_i-\bar{y})}{\sum_i (x_i-\bar{x})^2}=\frac{\operatorname{cov}(x,y)}{\operatorname{var}(x)}.
\]
The slope is literally covariance over variance — how much \(x\) and \(y\) move together, divided by how much \(x\) moves on its own. The intercept then forces the line through the mean point \((\bar{x},\bar{y})\):
\[
\beta_0=\bar{y}-\beta_1\,\bar{x}.
\]
That the best line always passes through the centroid of the data is a small geometric gift worth remembering.

Once the line is fit, you want to know *how good* it is. Compare two worlds. If you had no \(x\) at all, your best guess for every point would be the overall average \(\bar{y}\), and the total scatter around that flat line is \(\mathrm{SS}_{\text{tot}}=\sum_i(y_i-\bar{y})^2\). The regression line does better, leaving only \(\mathrm{SS}_{\text{res}}\) unexplained. The fraction of the original scatter the line *removed* is the **coefficient of determination**:
\[
R^2=1-\frac{\mathrm{SS}_{\text{res}}}{\mathrm{SS}_{\text{tot}}}.
\]
\(R^2=1\) means the line passes through every point; \(R^2=0\) means the line is no better than guessing the mean. For simple regression \(R^2\) is exactly the square of the Pearson correlation \(r\) — which is why correlation and regression are two views of the same relationship: \(r\) measures the tightness of the linear association, \(\beta_1\) measures its rate, and \(R^2=r^2\) measures the share of variance explained.

## visualization
```
y
^                                        . actual point
|                  o                     | residual (vertical miss to line)
|              o   |                     fitted line  y_hat = b0 + b1 x
|           .--|---o---._                 ____
|       o.-'   |       o '-.  o
|    .-'   o   |             '-.
|  o'      |   |  o             o
| /        |   |                          R^2 = 1 - SS_res / SS_tot
|/  o      |   o      o
+----------------------------------------> x
   the line is tilted/slid until the SUM of the squared
   vertical gaps (residuals) is as small as possible.
   it always passes through the mean point (xbar, ybar).
```

## bruteForce
The honest, model-free way to find the best line is **search**: pick a slope and intercept, compute the sum of squared residuals, nudge the parameters in whatever direction lowers it, and repeat. A grid search over a plausible box of \((\beta_0,\beta_1)\) values, or — far better — **gradient descent**, which uses the slope of the loss surface to step downhill, both arrive at the minimum without ever writing the closed-form formula. Because squared loss is a smooth convex bowl in the parameters, there is a single global minimum and gradient descent reliably rolls to it. This iterative route is genuinely useful: it is exactly how you fit regressions with millions of features, with regularization, or with a non-linear link where no clean formula exists. The catch is cost and fuss — many passes over the data, a learning rate to tune, and a stopping rule — all of which the closed form sidesteps for the simple one-variable case.

## optimal
For simple (one-predictor) linear regression, skip the iteration entirely: the least-squares line has a **closed form computable in a single pass** over the data. Accumulate five running sums — \(n\), \(\sum x\), \(\sum y\), \(\sum xy\), \(\sum x^2\) (and \(\sum y^2\) if you also want \(R^2\)) — and the slope and intercept fall straight out:
\[
\beta_1=\frac{n\sum xy-\sum x\sum y}{n\sum x^2-(\sum x)^2},\qquad \beta_0=\bar{y}-\beta_1\bar{x}.
\]
This is the same \(\operatorname{cov}(x,y)/\operatorname{var}(x)\) from the intuition, rearranged so you never have to compute the means before looping. From the same sums you get \(\mathrm{SS}_{\text{tot}}=\sum y^2-n\bar{y}^2\) and the residual sum \(\mathrm{SS}_{\text{res}}=\mathrm{SS}_{\text{tot}}-\beta_1^2\,(\sum x^2-n\bar{x}^2)\), giving \(R^2=1-\mathrm{SS}_{\text{res}}/\mathrm{SS}_{\text{tot}}\) for free. The whole fit is \(O(n)\) time and \(O(1)\) extra space, exact to floating-point, with no learning rate, no iterations, and no convergence to babysit. The general matrix version, \(\hat{\beta}=(X^\top X)^{-1}X^\top y\), extends this to many predictors; for one predictor it collapses to exactly the two formulas above. When the predictor's variance is zero (all \(x\) equal) the denominator vanishes and no line is defined — the one degenerate case to guard.

## complexity
time: O(n) single pass to accumulate the five sums and compute slope, intercept, and R^2 in closed form. Gradient descent / grid search is O(iters * n) -- many passes -- and grid search is exponential in the number of parameters.
space: O(1) extra beyond the data for the closed form (just the running sums). Gradient descent is also O(1) extra but pays in iteration count.
notes: The matrix form (X^T X)^{-1} X^T y is O(n p^2 + p^3) for p predictors; for p=1 it collapses to the two scalar formulas. Closed form fails only when var(x)=0 (all x identical) -- the slope denominator is zero and no line exists.

## pitfalls
- Reading the slope as **causation**. A nonzero \(\beta_1\) only says \(x\) and \(y\) move together in the data; it says nothing about whether changing \(x\) *causes* \(y\) to change. Confounders, reverse causation, and selection can all produce a clean slope with no causal link. Regression describes association, not mechanism.
- **Extrapolating** beyond the range of the data. The line is only trustworthy where you have points. Predicting \(y\) far outside the observed \(x\) range assumes the linear pattern continues — an assumption the data cannot support and that often fails badly.
- **Outliers dominate squared loss.** Because residuals are squared, one far-off point can yank the whole line toward itself, distorting both slope and intercept. Always plot the residuals; consider robust regression or investigating the outlier rather than letting it set the fit.
- **A high \(R^2\) does not mean a good model.** Anscombe's quartet is four datasets with nearly identical slope, intercept, and \(R^2\) yet wildly different shapes — one is curved, one is driven by a single outlier. \(R^2\) summarizes variance explained, not whether a line is the *right* shape; only a residual plot reveals that.
- **Assuming linearity (and ignoring the residual assumptions).** Least squares fits the best *straight* line even when the true relationship curves; the slope is then meaningless. The standard inference also assumes residuals are independent, homoscedastic (constant variance), and roughly normal — check these before trusting any p-value or confidence interval on the slope.

## interviewTips
- Derive the slope as \(\beta_1=\operatorname{cov}(x,y)/\operatorname{var}(x)\) and state that the line always passes through \((\bar{x},\bar{y})\), so \(\beta_0=\bar{y}-\beta_1\bar{x}\). Being able to connect least squares to covariance and variance signals real understanding, not memorization.
- Explain \(R^2=1-\mathrm{SS}_{\text{res}}/\mathrm{SS}_{\text{tot}}\) as the fraction of variance explained, note that for simple regression \(R^2=r^2\), and immediately flag that a high \(R^2\) does not validate the model — cite Anscombe's quartet and residual plots.
- Distinguish correlation from regression and from causation: \(r\) is a symmetric, unitless measure of linear tightness; \(\beta_1\) is a directional rate with units; and neither implies that \(x\) causes \(y\). Mention extrapolation and outlier sensitivity as the practical traps.

## keyTakeaways
- Least squares fits \(\hat{y}=\beta_0+\beta_1 x\) by minimizing the sum of squared vertical residuals; the closed-form solution is \(\beta_1=\operatorname{cov}(x,y)/\operatorname{var}(x)\) and \(\beta_0=\bar{y}-\beta_1\bar{x}\), so the line always passes through the mean point.
- \(R^2=1-\mathrm{SS}_{\text{res}}/\mathrm{SS}_{\text{tot}}\) is the share of the data's variance the line explains; it equals \(r^2\) for simple regression, but a high value never on its own proves the model is appropriate.
- The fit is exact in one \(O(n)\) pass over five running sums; gradient descent is the iterative alternative needed for many predictors or non-linear extensions — and correlation/slope describe association, never causation, with extrapolation and outliers the standing traps.

## code.python
```python
def least_squares(points):
    n = len(points)
    sx = sy = sxy = sxx = syy = 0.0
    for x, y in points:
        sx += x; sy += y; sxy += x * y; sxx += x * x; syy += y * y
    slope = (n * sxy - sx * sy) / (n * sxx - sx * sx)
    intercept = (sy - slope * sx) / n
    ss_tot = syy - sy * sy / n
    ss_res = ss_tot - slope * (sxy - sx * sy / n)
    r2 = 1 - ss_res / ss_tot
    return slope, intercept, r2

data = [(1, 2.1), (2, 3.9), (3, 6.2), (4, 7.8), (5, 10.1), (6, 11.9)]
slope, intercept, r2 = least_squares(data)
print(f"slope={slope:.4f} intercept={intercept:.4f} R2={r2:.4f}")
# slope=1.9714 intercept=0.1133 R2=0.9994
```

## code.javascript
```javascript
function leastSquares(points) {
  const n = points.length;
  let sx = 0, sy = 0, sxy = 0, sxx = 0, syy = 0;
  for (const [x, y] of points) {
    sx += x; sy += y; sxy += x * y; sxx += x * x; syy += y * y;
  }
  const slope = (n * sxy - sx * sy) / (n * sxx - sx * sx);
  const intercept = (sy - slope * sx) / n;
  const ssTot = syy - (sy * sy) / n;
  const ssRes = ssTot - slope * (sxy - (sx * sy) / n);
  const r2 = 1 - ssRes / ssTot;
  return { slope, intercept, r2 };
}

const data = [[1, 2.1], [2, 3.9], [3, 6.2], [4, 7.8], [5, 10.1], [6, 11.9]];
const { slope, intercept, r2 } = leastSquares(data);
console.log(`slope=${slope.toFixed(4)} intercept=${intercept.toFixed(4)} R2=${r2.toFixed(4)}`);
// slope=1.9714 intercept=0.1133 R2=0.9994
```

## code.java
```java
public class LeastSquares {
    public static void main(String[] args) {
        double[][] data = {{1, 2.1}, {2, 3.9}, {3, 6.2}, {4, 7.8}, {5, 10.1}, {6, 11.9}};
        int n = data.length;
        double sx = 0, sy = 0, sxy = 0, sxx = 0, syy = 0;
        for (double[] p : data) {
            sx += p[0]; sy += p[1]; sxy += p[0] * p[1];
            sxx += p[0] * p[0]; syy += p[1] * p[1];
        }
        double slope = (n * sxy - sx * sy) / (n * sxx - sx * sx);
        double intercept = (sy - slope * sx) / n;
        double ssTot = syy - sy * sy / n;
        double ssRes = ssTot - slope * (sxy - sx * sy / n);
        double r2 = 1 - ssRes / ssTot;
        System.out.printf("slope=%.4f intercept=%.4f R2=%.4f%n", slope, intercept, r2);
        // slope=1.9714 intercept=0.1133 R2=0.9994
    }
}
```

## code.cpp
```cpp
#include <cstdio>
#include <vector>
#include <utility>

int main() {
    std::vector<std::pair<double, double>> data = {
        {1, 2.1}, {2, 3.9}, {3, 6.2}, {4, 7.8}, {5, 10.1}, {6, 11.9}
    };
    int n = data.size();
    double sx = 0, sy = 0, sxy = 0, sxx = 0, syy = 0;
    for (auto& p : data) {
        sx += p.first; sy += p.second; sxy += p.first * p.second;
        sxx += p.first * p.first; syy += p.second * p.second;
    }
    double slope = (n * sxy - sx * sy) / (n * sxx - sx * sx);
    double intercept = (sy - slope * sx) / n;
    double ssTot = syy - sy * sy / n;
    double ssRes = ssTot - slope * (sxy - sx * sy / n);
    double r2 = 1 - ssRes / ssTot;
    std::printf("slope=%.4f intercept=%.4f R2=%.4f\n", slope, intercept, r2);
    // slope=1.9714 intercept=0.1133 R2=0.9994
    return 0;
}
```
