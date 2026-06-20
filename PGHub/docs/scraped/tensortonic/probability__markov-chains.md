---
source_url: https://tensortonic.com/ml-math/probability/markov-chains
title: Markov Chains: The Math of What Happens Next | TensorTonic
scraped_at: 2026-06-18
---

[Modules](https://www.tensortonic.com/ml-math)

10/10

Probability

### Contents

Memoryless SystemsThe Markov PropertyInteractive SimulatorTransition MatrixStationary DistributionCase Study: Bulb InventoryAbsorbing StatesHidden Markov ModelsML Applications

## Memoryless Systems

Imagine a drunk person walking on a number line. Their next step (left or right) depends only on where they are _right now_, not on how they got there. They do not remember their path. This is a [Random Walk](https://www.tensortonic.com/ml-math/graph-theory/random-walks), and it is a special case of a **Markov Chain**.

Markov Chains model systems that transition from one state to another probabilistically, where the future depends only on the present, not the past. This "memoryless" property makes them mathematically tractable and surprisingly powerful.

## The Markov Property

P(Xt+1∣Xt,Xt−1,...,X0)=P(Xt+1∣Xt)P(X\_{t+1} \| X\_t, X\_{t-1}, ..., X\_0) = P(X\_{t+1} \| X\_t)P(Xt+1​∣Xt​,Xt−1​,...,X0​)=P(Xt+1​∣Xt​)

"The future is independent of the past, given the present."

A Markov Chain is fully defined by:

- **State Space:** The set of all possible states (e.g., {Sunny, Rainy} or {0, 1, 2, ..., N}).
- **Transition Probabilities:** The probability of moving from state iii to state jjj, denoted PijP\_{ij}Pij​.
- **Initial Distribution:** The probability of starting in each state.

## Interactive Simulator

A simple weather model. If it's Sunny today, there's an 80% chance it's Sunny tomorrow. Adjust the transition probabilities and run the simulation to see long-term behavior.

#### Transition Matrix T

To Sunny

To Rainy

From Sunny

0.80

0.20

From Rainy

0.40

0.60

#### Simulation

Day: 0

Run Chain

Specific TrajectorySunny ☀️

0.800.600.200.40SUNNYRAINY

Visualizing 2-State Markov Chain

#### Long-Run Convergence

Actual

Theory (π)

Sunny Days100.0%

From SimulationTarget: 66.7%

Rainy Days0.0%

## Transition Matrix

We can represent all transition probabilities in a **Stochastic Matrix** TTT. Each row must sum to 111 (you have to go somewhere).

T=\[P(S→S)P(S→R)P(R→S)P(R→R)\]=\[0.80.20.40.6\]T = \\begin{bmatrix} P(S \\to S) & P(S \\to R) \\\ P(R \\to S) & P(R \\to R) \\end{bmatrix} = \\begin{bmatrix} 0.8 & 0.2 \\\ 0.4 & 0.6 \\end{bmatrix}T=\[P(S→S)P(R→S)​P(S→R)P(R→R)​\]=\[0.80.4​0.20.6​\]

### Computing Future States

If π0\\pi\_0π0​ is the initial state distribution (row vector), then after kkk steps:

πk=π0Tk\\pi\_k = \\pi\_0 T^kπk​=π0​Tk

[Matrix](https://www.tensortonic.com/ml-math/linear-algebra/matrix-multiplication) exponentiation lets us "fast-forward" into the future without simulating each step.

## Stationary Distribution

If you run the simulation long enough, the probability of being in each state settles down to a constant value π\\piπ. This is the **Stationary Distribution** (or Equilibrium Distribution).

πT=π\\pi T = \\piπT=π

with the constraint ∑πi=1\\sum \\pi\_i = 1∑πi​=1

This equation says π\\piπ is a **Left [Eigenvector](https://www.tensortonic.com/ml-math/linear-algebra/eigenvalue-eigenvector)** of the transition matrix with eigenvalue 111. Finding π\\piπ is an eigenvalue problem!

### Weather Example

Solving πT=π\\pi T = \\piπT=π for our weather chain gives π=\[2/3,1/3\]\\pi = \[2/3, 1/3\]π=\[2/3,1/3\]. In the long run, it is Sunny 67% of the time, Rainy 33%, regardless of whether we started on a Sunny or Rainy day.

## Case Study: Bulb Inventory Management

#### The Scenario

A warehouse stocks light bulbs. Each week, demand is random: 0, 1, 2, or 3 units with probabilities 0.1, 0.4, 0.3, 0.2. If inventory hits 0, an order of 5 units arrives the next week. State = inventory level (0-5).

#### The Model

This is a Markov Chain! The state is the current inventory level, and transitions depend only on the current level and the random demand.

We can build a 6x6 transition matrix and compute the stationary distribution to answer: "What's the long-run probability of being out of stock?"

#### The Answer

Solving for π\\piπ, we find P(Inventory = 0) = 12%. This means the warehouse runs out of bulbs 12% of the time. If that's too high, we can adjust the reorder point or order quantity and re-run the Markov analysis.

## Absorbing States

Some states are like black holes: once you enter, you can never leave. P(i→i)=1P(i \\to i) = 1P(i→i)=1. These are **Absorbing States**.

### Gambler's Ruin

You start with $50. Each round, you bet $1 on a fair coin flip. Win = +$1, Lose = -$1. You stop when you reach $100 (Win) or $0 (Bust).

Both $0 and $100 are absorbing states. Markov Chain analysis shows: P(eventually going broke) = 50%. The expected number of rounds until the game ends is 2,500.

**Key Questions for Absorbing Chains:**

- What's the probability of being absorbed by state A vs state B?
- What's the expected number of steps before absorption?

## Hidden Markov Models (HMMs)

What if you cannot observe the Markov chain directly? You only see noisy outputs that depend on the hidden state.

#### Standard Markov Chain

States are directly observable. Weather = {Sunny, Rainy}. You see the weather.

#### Hidden Markov Model

States are hidden. You observe emissions. You see people carrying umbrellas and infer the weather.

### Bulb Quality Example

A bulb factory machine has hidden states: {Good Calibration, Drifted Calibration}. We cannot directly see the calibration state. But we observe the output: defect rate. High defect rate suggests "Drifted." The Viterbi algorithm finds the most likely sequence of hidden states.

## ML Applications

### Language Models (N-Grams)

"The cat sat on the..." → Next word depends on previous words. A bigram is a Markov chain where state = previous word. GPT and modern LLMs go beyond Markov (they have memory via attention), but the intuition starts here.

### Reinforcement Learning (MDPs)

Modeled as Markov Decision Processes. The agent's next state depends only on current state + action (Markov property). Q-Learning, Policy Gradient, and all RL algorithms build on this.

### PageRank (Google Search)

The web is a Markov chain. States = web pages. Transitions = hyperlinks. PageRank is the stationary distribution of this chain (with some damping). High PageRank = important page.

### [MCMC](https://www.tensortonic.com/ml-math/probability/monte-carlo) (Markov Chain Monte Carlo)

Used for [Bayesian inference](https://www.tensortonic.com/ml-math/probability/bayes-theorm) when we cannot compute posteriors analytically. Construct a Markov chain whose stationary distribution IS the posterior. Sample from the chain = sample from the posterior.

We use cookies to understand how you use TensorTonic and to improve the product. [Learn more](https://www.tensortonic.com/terms)

RejectAccept