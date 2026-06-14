export const RL_EXTRA = [
  {
    slug: 'q-learning',
    title: 'Q-learning',
    oneLiner: 'Learn the value of every action from raw experience — no model of the world required.',
    difficulty: 'core',
    readMinutes: 12,
    sections: [
      {
        kind: 'prose',
        heading: 'The problem Q-learning solves',
        body: `An agent lives in a world. At each step it sits in some **state** \\(s\\), picks an **action** \\(a\\), receives a scalar **reward** \\(r\\), and lands in a new state \\(s'\\). It repeats this forever, or until an episode ends. The goal is not to grab the biggest reward right now — it is to maximise the *total* reward collected over the whole future, with rewards further away discounted by a factor \\(\\gamma \\in [0, 1)\\). A reward of \\(1\\) received \\(k\\) steps from now is worth \\(\\gamma^k\\) today.

The hard part is that actions have delayed consequences. Moving toward a cliff edge feels fine on the step you take it; the punishment arrives later. To act well you need to know the *long-run* value of each action from each state, not its immediate payoff. That long-run value is exactly what Q-learning estimates.

Define \\(Q(s, a)\\) as the total discounted reward you expect to collect if you take action \\(a\\) in state \\(s\\) and then behave optimally forever after. If you knew this function exactly, acting optimally would be trivial: in every state, pick the action with the largest \\(Q\\). The whole difficulty is that you start out knowing nothing about \\(Q\\), and you have to learn it from experience — by trying actions, watching what happens, and folding each observation back into your estimate. Crucially, Q-learning does this *without* ever building a model of how the world transitions or where rewards come from. It learns the values directly. That property — **model-free** — is why it became the foundation of modern reinforcement learning.`,
      },
      {
        kind: 'prose',
        heading: 'The Bellman update — the one equation that matters',
        body: `Q-learning rests on a single self-consistency condition. The value of taking action \\(a\\) in state \\(s\\) is the immediate reward plus the discounted value of acting optimally from wherever you land:

\\[
Q(s, a) = r + \\gamma \\max_{a'} Q(s', a')
\\]

You don't know the true \\(Q\\), so you keep an estimate and nudge it toward the right-hand side every time you take a step. The right-hand side, computed from one observed transition \\((s, a, r, s')\\), is the **target**. The gap between target and current estimate is the **temporal-difference (TD) error**:

\\[
\\delta = \\underbrace{r + \\gamma \\max_{a'} Q(s', a')}_{\\text{target}} - Q(s, a)
\\]

The update moves the estimate a fraction \\(\\alpha\\) (the learning rate) of the way toward the target:

\\[
Q(s, a) \\leftarrow Q(s, a) + \\alpha \\, \\delta
\\]

Two things make this beautiful. First, the target uses \\(\\max_{a'}\\) over the *next* state — it assumes you will act optimally going forward, even if the action you actually took to reach \\(s'\\) was exploratory and random. This is what makes Q-learning **off-policy**: it learns the value of the optimal policy while following a different, more exploratory one. Second, the update bootstraps — it improves the estimate of \\(Q(s, a)\\) using another (also imperfect) estimate \\(Q(s', a')\\). You are pulling yourself up by your own bootstraps, and remarkably, under mild conditions, it provably converges.`,
      },
      {
        kind: 'prose',
        heading: 'Worked example — a 1×4 gridworld, by hand',
        body: `Take the smallest world that shows the mechanics. Four cells in a row, indexed \\(0, 1, 2, 3\\). The agent starts at cell \\(0\\). Cell \\(3\\) is the goal, worth \\(+10\\), and ends the episode. Every other step gives reward \\(0\\). Two actions: **left** and **right**. Discount \\(\\gamma = 0.9\\), learning rate \\(\\alpha = 0.5\\). The Q-table starts at all zeros — eight entries, one per (cell, action) pair.

Run one episode where the agent happens to walk right the whole way: \\(0 \\to 1 \\to 2 \\to 3\\).

- **Step \\(0 \\to 1\\):** reward \\(0\\), next state \\(1\\). Target \\(= 0 + 0.9 \\cdot \\max(Q(1,\\cdot)) = 0 + 0.9 \\cdot 0 = 0\\). Update \\(Q(0, \\text{right}) \\leftarrow 0 + 0.5 \\cdot (0 - 0) = 0\\). Nothing changes — the agent hasn't seen reward yet.
- **Step \\(1 \\to 2\\):** same story, target \\(0\\), \\(Q(1, \\text{right})\\) stays \\(0\\).
- **Step \\(2 \\to 3\\):** reward \\(+10\\), \\(3\\) is terminal so there is no future term. Target \\(= 10 + 0 = 10\\). Update \\(Q(2, \\text{right}) \\leftarrow 0 + 0.5 \\cdot (10 - 0) = 5\\).

After episode one, only \\(Q(2, \\text{right}) = 5\\); everything else is still zero. The reward signal has reached *one cell back*. Run the same rightward episode again:

- **Step \\(0 \\to 1\\):** target \\(0.9 \\cdot \\max(Q(1,\\cdot)) = 0\\), no change.
- **Step \\(1 \\to 2\\):** target \\(= 0 + 0.9 \\cdot \\max(Q(2,\\cdot)) = 0.9 \\cdot 5 = 4.5\\). Update \\(Q(1, \\text{right}) \\leftarrow 0 + 0.5 \\cdot 4.5 = 2.25\\).
- **Step \\(2 \\to 3\\):** target \\(10\\). Update \\(Q(2, \\text{right}) \\leftarrow 5 + 0.5 \\cdot (10 - 5) = 7.5\\).

The value has now propagated *two* cells back, and \\(Q(2, \\text{right})\\) is climbing toward its true value. Each episode pushes the reward one more cell upstream — this slow backward seepage of value from the goal is the signature of how Q-learning learns. Run it long enough and the table converges to \\(Q(2,\\text{right}) = 10\\), \\(Q(1,\\text{right}) = 9\\), \\(Q(0,\\text{right}) = 8.1\\), exactly \\(10 \\cdot \\gamma^{d}\\) for distance \\(d\\) to the goal.`,
      },
      {
        kind: 'ascii',
        heading: 'Q-table after each rightward episode',
        body: `cell:           0       1       2       3(goal)
                ------  ------  ------  --------
initial   R:    0.00    0.00    0.00     ---
ep 1      R:    0.00    0.00    5.00     ---
ep 2      R:    0.00    2.25    7.50     ---
ep 3      R:    1.01    4.16    8.75     ---
...
converged R:    8.10    9.00   10.00     ---

(value seeps one cell upstream from the goal per episode;
 the converged column is exactly 10 * gamma^distance.)`,
      },
      {
        kind: 'prose',
        heading: 'The algorithm in full',
        body: `Putting the pieces together, tabular Q-learning is a short loop:

1. Initialise \\(Q(s, a)\\) arbitrarily (usually all zeros, or optimistic high values to encourage exploration).
2. For each episode, start in some state \\(s\\).
3. While the episode is not over: choose an action \\(a\\) using a behaviour policy that mostly exploits \\(Q\\) but sometimes explores (commonly \\(\\varepsilon\\)-greedy — pick the best action with probability \\(1 - \\varepsilon\\), a random one with probability \\(\\varepsilon\\)).
4. Take \\(a\\), observe \\(r\\) and \\(s'\\).
5. Apply the update \\(Q(s, a) \\leftarrow Q(s, a) + \\alpha \\, [\\, r + \\gamma \\max_{a'} Q(s', a') - Q(s, a)\\,]\\).
6. Set \\(s \\leftarrow s'\\) and repeat.

The behaviour policy in step 3 can be anything that visits every state-action pair often enough — that is the off-policy freedom. The learning target in step 5 always assumes optimal future behaviour via the \\(\\max\\). This separation is the whole trick: explore wildly, learn the optimal values regardless.

When the state space is too large for a table — images, continuous coordinates — you replace the table with a function approximator, typically a neural network \\(Q_\\theta(s, a)\\). That is **Deep Q-Networks (DQN)**, the algorithm that learned to play Atari from pixels. The Bellman target is the same; you just fit a network to it with gradient descent instead of writing into a table cell. Two stabilising tricks make it work: a **replay buffer** that breaks correlation between consecutive samples, and a slowly-updated **target network** that keeps the \\(\\max_{a'} Q(s', a')\\) term from chasing its own tail.`,
      },
      {
        kind: 'code',
        language: 'python',
        heading: 'Tabular Q-learning on the 1×4 gridworld',
        body: `import numpy as np

N_STATES, GOAL = 4, 3
ACTIONS = {0: -1, 1: +1}        # 0 = left, 1 = right
gamma, alpha, eps = 0.9, 0.5, 0.2

Q = np.zeros((N_STATES, len(ACTIONS)))

def step(s, a):
    s2 = min(max(s + ACTIONS[a], 0), N_STATES - 1)
    r  = 10.0 if s2 == GOAL else 0.0
    done = (s2 == GOAL)
    return s2, r, done

for episode in range(500):
    s = 0
    while True:
        a = np.random.randint(2) if np.random.rand() < eps else int(np.argmax(Q[s]))
        s2, r, done = step(s, a)
        target = r + (0.0 if done else gamma * np.max(Q[s2]))
        Q[s, a] += alpha * (target - Q[s, a])   # the Bellman update
        s = s2
        if done:
            break

print(np.round(Q, 2))
# right-action column converges to [8.10, 9.00, 10.00, *] — 10 * gamma^distance.`,
      },
      {
        kind: 'callout',
        tone: 'warning',
        body: `**Common mistake: forgetting to zero the future term at terminal states.** The Bellman target is \\(r + \\gamma \\max_{a'} Q(s', a')\\) — but if \\(s'\\) is terminal, there *is* no future, so the target must be just \\(r\\). Leaving the \\(\\gamma \\max\\) term in for terminal transitions injects phantom future value at the goal, and the Q-values blow past their true ceiling and never settle. Always gate the bootstrap on a \`done\` flag, as the code above does.`,
      },
      {
        kind: 'prose',
        heading: 'Exercise',
        body: `Take the same 1×4 gridworld but add a **penalty**: stepping into cell \\(0\\) from cell \\(1\\) (moving left into the wall corner) costs \\(-2\\). Keep \\(\\gamma = 0.9\\), \\(\\alpha = 0.5\\), all-zero initialisation.

(a) By hand, run one episode that goes \\(0 \\to 1 \\to 0 \\to 1 \\to 2 \\to 3\\) and write down every Q-update in order. (b) Which entry first becomes negative, and on which step? (c) After convergence, is \\(Q(1, \\text{left})\\) ever the largest action for cell \\(1\\)? Argue from the discounted-reward definition why the optimal policy never moves left here. (d) Modify the code above to add the penalty and confirm your hand-computed first-episode updates match the program's, by printing \`Q\` after a single episode with exploration turned off (\`eps = 0\`) and the action sequence forced.`,
      },
      {
        kind: 'prose',
        heading: 'Further reading',
        body: `- [David Silver — RL Lecture 4: Model-Free Prediction](https://www.youtube.com/watch?v=PnHCvfgC_ZA) — TD learning and the Bellman backup, from the DeepMind course.
- [Sutton & Barto — Reinforcement Learning: An Introduction, Ch. 6 (free PDF)](http://incompleteideas.net/book/RLbook2020.pdf) — the canonical treatment of TD and Q-learning.
- [Mnih et al. — Human-level control through deep reinforcement learning (DQN)](https://www.nature.com/articles/nature14236) — the paper that scaled Q-learning to Atari from pixels.`,
      },
    ],
  },
  {
    slug: 'policy-gradients',
    title: 'Policy gradients',
    oneLiner: 'Skip the value table — directly nudge the probabilities of good actions up and bad ones down.',
    difficulty: 'core',
    readMinutes: 13,
    sections: [
      {
        kind: 'prose',
        heading: 'A different way to want',
        body: `Q-learning learns the *value* of actions, then acts greedily on those values. Policy-gradient methods skip the middleman. They parameterise the policy itself — a function \\(\\pi_\\theta(a \\mid s)\\) that maps a state directly to a probability distribution over actions — and adjust the parameters \\(\\theta\\) to make high-return behaviour more likely. There is no value table, no \\(\\max\\), no greedy step. The policy *is* the thing being trained.

Why bother, when Q-learning works? Three reasons. First, continuous action spaces: a robot arm chooses a torque from an infinite range, and you cannot take a \\(\\max\\) over infinitely many actions, but you can output the mean of a Gaussian and sample from it. Second, stochastic optimal policies: in games with bluffing or partial observability, the best policy is genuinely random (rock-paper-scissors optimal play is uniform), and a value-greedy method can only represent deterministic policies. Third, smoothness: a small change in \\(\\theta\\) makes a small change in the action probabilities, so the policy improves gradually rather than flipping discontinuously when one Q-value overtakes another.

The objective is exactly what you would write down: maximise the expected total return,

\\[
J(\\theta) = \\mathbb{E}_{\\tau \\sim \\pi_\\theta} \\left[ R(\\tau) \\right],
\\]

where \\(\\tau = (s_0, a_0, s_1, a_1, \\dots)\\) is a trajectory the policy generates and \\(R(\\tau)\\) is its total discounted reward. We want to climb this objective with gradient ascent: \\(\\theta \\leftarrow \\theta + \\alpha \\nabla_\\theta J\\). The only obstacle is that the thing we are averaging over — the distribution of trajectories — itself depends on \\(\\theta\\). Differentiating an expectation whose sampling distribution moves with the parameter is the technical heart of the method.`,
      },
      {
        kind: 'prose',
        heading: 'The log-derivative trick',
        body: `Here is the identity that unlocks everything. For any distribution \\(p_\\theta(x)\\),

\\[
\\nabla_\\theta \\, \\mathbb{E}_{x \\sim p_\\theta}[f(x)] = \\mathbb{E}_{x \\sim p_\\theta}\\!\\left[ f(x) \\, \\nabla_\\theta \\log p_\\theta(x) \\right].
\\]

The derivation is one line: \\(\\nabla_\\theta \\mathbb{E}[f] = \\int f(x) \\nabla_\\theta p_\\theta(x)\\,dx = \\int f(x) p_\\theta(x) \\frac{\\nabla_\\theta p_\\theta(x)}{p_\\theta(x)}\\,dx = \\mathbb{E}[f(x)\\nabla_\\theta \\log p_\\theta(x)]\\), using \\(\\nabla \\log p = \\nabla p / p\\). The point is that the gradient of an expectation becomes an expectation of a gradient — so we can estimate it by sampling.

Apply it to the RL objective. The probability of a whole trajectory factorises into the policy's action choices times the environment's transitions, and the transitions do not depend on \\(\\theta\\), so they vanish under \\(\\nabla_\\theta \\log\\). What survives is clean:

\\[
\\nabla_\\theta J(\\theta) = \\mathbb{E}_{\\tau \\sim \\pi_\\theta} \\left[ \\sum_{t} \\nabla_\\theta \\log \\pi_\\theta(a_t \\mid s_t) \\cdot R(\\tau) \\right].
\\]

Read this as an instruction. For every action you took, compute the gradient of its log-probability — the direction in parameter space that would make that exact action more likely — and scale it by the return of the trajectory it appeared in. Good trajectories (high \\(R\\)) push their actions' probabilities up; bad trajectories push theirs down. Average over a batch of sampled trajectories and you have an unbiased estimate of \\(\\nabla_\\theta J\\). This is the **REINFORCE** estimator, and it needs nothing but the ability to sample episodes and differentiate the policy's log-probability.`,
      },
      {
        kind: 'prose',
        heading: 'Worked example — one REINFORCE step on a two-action bandit',
        body: `Strip everything to the bone: one state, two actions, no transitions. The policy is a softmax over two logits \\(\\theta = (\\theta_L, \\theta_R)\\). Start at \\(\\theta = (0, 0)\\), so \\(\\pi(\\text{left}) = \\pi(\\text{right}) = 0.5\\). Action **right** pays reward \\(+1\\); action **left** pays \\(0\\). Learning rate \\(\\alpha = 0.2\\).

The softmax gradient of the log-probability has a tidy form: \\(\\nabla_{\\theta_a} \\log \\pi(a) = 1 - \\pi(a)\\) for the chosen action's own logit, and \\(\\nabla_{\\theta_{a'}} \\log \\pi(a) = -\\pi(a')\\) for the other logit.

Sample one episode and suppose we draw **right**, reward \\(R = +1\\). The REINFORCE update is \\(\\theta \\leftarrow \\theta + \\alpha R \\nabla_\\theta \\log \\pi(\\text{right})\\):

- \\(\\theta_R \\leftarrow 0 + 0.2 \\cdot 1 \\cdot (1 - 0.5) = 0 + 0.2 \\cdot 0.5 = 0.10\\).
- \\(\\theta_L \\leftarrow 0 + 0.2 \\cdot 1 \\cdot (-0.5) = -0.10\\).

New logits \\((-0.10, 0.10)\\). Recompute the softmax: \\(\\pi(\\text{right}) = e^{0.10} / (e^{0.10} + e^{-0.10}) = 1.105 / (1.105 + 0.905) = 0.550\\). The probability of the rewarded action rose from \\(0.500\\) to \\(0.550\\) in a single step. Exactly the intended effect — the action that earned reward got more likely.

Now suppose the *next* sample draws **left**, reward \\(R = 0\\). The update scales by \\(R = 0\\), so \\(\\nabla\\) is multiplied by zero and **nothing changes**. This exposes the method's central weakness: an action that earns zero reward produces zero learning signal even though, relatively, it was the *worse* choice and we would like to suppress it. The fix is a baseline (next section). With it, a below-average action gets pushed down even when its raw reward is non-negative. Run the unbaselined version for a few hundred samples and \\(\\pi(\\text{right})\\) still climbs steadily toward \\(1\\) — but noisily, because every update's magnitude depends on the raw, high-variance return.`,
      },
      {
        kind: 'prose',
        heading: 'Variance is the enemy — baselines and reward-to-go',
        body: `The REINFORCE estimator is unbiased but *high-variance*: returns vary wildly across trajectories, so the gradient estimate from any one batch is a noisy stab in roughly the right direction. Training is slow and twitchy. Two standard fixes cut the variance without adding bias.

**Baseline subtraction.** Subtract a state-dependent baseline \\(b(s)\\) from the return: scale each log-prob gradient by \\(R(\\tau) - b(s_t)\\) instead of \\(R(\\tau)\\). Because \\(\\mathbb{E}_a[\\nabla_\\theta \\log \\pi_\\theta(a\\mid s)] = 0\\) — the expected score is zero — subtracting any function of state alone leaves the gradient's expectation unchanged. It is provably unbiased. But it slashes variance: now an action is reinforced only to the extent its return *beat the baseline*. The natural baseline is the value function \\(V(s)\\), the average return from that state. An action better than average gets pushed up; worse than average, pushed down — even if its raw reward was positive. This turns the bandit example's "zero reward, zero learning" problem into "below-average action, suppressed."

**Reward-to-go.** Scaling an action at time \\(t\\) by the *whole* trajectory's return \\(R(\\tau)\\) is illogical — rewards collected *before* time \\(t\\) were not caused by the action at \\(t\\). Replace \\(R(\\tau)\\) with the **reward-to-go** \\(\\sum_{t' \\ge t} \\gamma^{t'-t} r_{t'}\\), the return from \\(t\\) onward. This is also unbiased (past rewards are independent of the current action's score) and drops variance further by removing irrelevant terms.

Put both together — reward-to-go minus a learned value baseline — and the scaling factor becomes an estimate of the **advantage** \\(A(s, a) = Q(s, a) - V(s)\\): how much better this action was than the state's default. That advantage-weighted policy gradient is the bridge to the next lesson.`,
      },
      {
        kind: 'code',
        language: 'python',
        heading: 'REINFORCE with a baseline (PyTorch sketch)',
        body: `import torch

def reinforce_step(policy, optimizer, episodes, gamma=0.99):
    # episodes: list of (log_probs, rewards), one per sampled trajectory
    loss = 0.0
    for log_probs, rewards in episodes:
        # reward-to-go: discounted return from each timestep onward
        G, returns = 0.0, []
        for r in reversed(rewards):
            G = r + gamma * G
            returns.insert(0, G)
        returns = torch.tensor(returns)

        # baseline = batch mean (cheap, unbiased variance reduction)
        advantages = returns - returns.mean()

        # ascend J  ==  descend -J : negate the log-prob * advantage sum
        for logp, adv in zip(log_probs, advantages):
            loss = loss - logp * adv

    optimizer.zero_grad()
    (loss / len(episodes)).backward()
    optimizer.step()
    # actions with above-average return get their log-prob pushed UP.`,
      },
      {
        kind: 'callout',
        tone: 'warning',
        body: `**Common mistake: optimising the gradient sign backward.** Autodiff frameworks *minimise* a loss, but the policy-gradient objective \\(J\\) is something you *maximise*. The loss you hand to the optimiser must be \\(-\\log \\pi_\\theta(a) \\cdot A\\), with the minus sign, so that descending it ascends \\(J\\). Drop the minus and your agent will reliably learn to do the *worst* possible thing — and it often looks like training "works" for a few steps before the return craters. If reward goes down monotonically from step one, check this sign first.`,
      },
      {
        kind: 'prose',
        heading: 'Exercise',
        body: `Return to the two-action softmax bandit (\\(\\theta = (\\theta_L, \\theta_R)\\), right pays \\(+1\\), left pays \\(0\\), \\(\\alpha = 0.2\\)).

(a) Add a baseline equal to the running mean reward, which after the first rewarded "right" sample is \\(b = 1\\). Recompute the update if the *second* sample draws **left** with reward \\(0\\): what is the advantage \\(R - b\\), and which direction does \\(\\theta_L\\) move now? Contrast with the unbaselined case where nothing moved. (b) Show algebraically that \\(\\nabla_{\\theta_L}\\log\\pi(\\text{left}) + \\nabla_{\\theta_R}\\log\\pi(\\text{left})\\) when summed against a constant baseline contributes zero net push, confirming baselines do not bias the update. (c) Implement the bandit in ~20 lines and plot \\(\\pi(\\text{right})\\) over 300 samples, once with the baseline and once without — confirm the baselined curve is smoother (lower variance) while both converge to \\(1\\).`,
      },
      {
        kind: 'prose',
        heading: 'Further reading',
        body: `- [Andrej Karpathy — Deep Reinforcement Learning: Pong from Pixels](https://karpathy.github.io/2016/05/31/rl/) — REINFORCE built from scratch with the clearest intuition for the log-derivative trick.
- [Sutton & Barto — RL: An Introduction, Ch. 13 (free PDF)](http://incompleteideas.net/book/RLbook2020.pdf) — the policy-gradient theorem and baselines, rigorously.
- [Williams 1992 — Simple statistical gradient-following algorithms (REINFORCE)](https://link.springer.com/article/10.1007/BF00992696) — the original paper.`,
      },
    ],
  },
  {
    slug: 'actor-critic',
    title: 'Actor-critic methods',
    oneLiner: 'One network acts, another judges. Together they cut the variance that cripples plain policy gradients.',
    difficulty: 'core',
    readMinutes: 12,
    sections: [
      {
        kind: 'prose',
        heading: 'Two roles, two networks',
        body: `Plain REINFORCE has a fatal flaw: to update the policy after a step, it needs the *return* from that step, which means waiting until the episode ends and then suffering the full variance of that random return. Actor-critic fixes both problems by splitting the job between two learners.

The **actor** is the policy \\(\\pi_\\theta(a \\mid s)\\) — it chooses actions, exactly as in policy gradients. The **critic** is a value estimate \\(V_\\phi(s)\\) — it predicts how good a state is, the expected return from there onward. The actor acts; the critic judges how the action turned out *relative to expectation*; the actor uses that judgement, not the raw return, as its learning signal. The critic, meanwhile, learns to predict returns by temporal-difference bootstrapping, just like the value function in Q-learning.

The judgement the critic provides is the **advantage** — how much better the action was than the critic's prior expectation of the state. We met it in the policy-gradient lesson as \\(A(s,a) = Q(s,a) - V(s)\\). The critic lets us estimate it cheaply from a single transition. Instead of waiting for the full return, the critic supplies \\(V_\\phi(s')\\) as a stand-in for "everything that happens after \\(s'\\)," so we can compute a one-step advantage immediately:

\\[
A(s, a) \\approx r + \\gamma V_\\phi(s') - V_\\phi(s).
\\]

That expression should look familiar — it is the **TD error** \\(\\delta\\) from Q-learning, now doing double duty. It is simultaneously the signal the critic uses to improve its own value estimate *and* the advantage the actor uses to update its policy. One number, two jobs. This sharing is the elegance of actor-critic.`,
      },
      {
        kind: 'prose',
        heading: 'The bias-variance trade the critic buys you',
        body: `Why is replacing the Monte-Carlo return with \\(r + \\gamma V_\\phi(s')\\) a good idea? It is a deliberate trade. The full return \\(\\sum_{t'} \\gamma^{t'-t} r_{t'}\\) is *unbiased* — its expectation is the true value — but enormously *high-variance*, because it sums many random rewards and depends on every future coin-flip of the policy and environment. The one-step bootstrap \\(r + \\gamma V_\\phi(s')\\) is *low-variance* — it depends on only one real reward and one prediction — but *biased*, because \\(V_\\phi\\) is only an estimate and carries whatever error the critic currently has.

Actor-critic trades a little bias for a large variance reduction, and that trade pays off: the policy gradient becomes stable enough to update *every step* instead of every episode. You learn online, continuously, without waiting for episodes to terminate.

You can dial the trade with **\\(n\\)-step returns** or **GAE** (generalised advantage estimation). An \\(n\\)-step advantage uses \\(n\\) real rewards before bootstrapping: \\(r_t + \\gamma r_{t+1} + \\dots + \\gamma^n V_\\phi(s_{t+n}) - V_\\phi(s_t)\\). Small \\(n\\) means low variance, high bias (lean hard on the critic); large \\(n\\) approaches the Monte-Carlo return, high variance, low bias. GAE smoothly interpolates across all \\(n\\) with a single knob \\(\\lambda\\). The whole design space of modern policy-gradient algorithms — A2C, A3C, PPO — lives on this dial, with the actor and critic structure underneath unchanged.`,
      },
      {
        kind: 'prose',
        heading: 'Worked example — one actor-critic update, by hand',
        body: `Concrete numbers. The agent is in state \\(s\\); the critic currently predicts \\(V_\\phi(s) = 5.0\\). The actor samples action \\(a\\) (say it had probability \\(\\pi_\\theta(a\\mid s) = 0.4\\)). The environment returns reward \\(r = 2.0\\) and next state \\(s'\\), where the critic predicts \\(V_\\phi(s') = 6.0\\). Use \\(\\gamma = 0.9\\), actor learning rate \\(\\alpha_\\theta = 0.1\\), critic learning rate \\(\\alpha_\\phi = 0.2\\).

**Step 1 — compute the TD error (the advantage):**
\\[
\\delta = r + \\gamma V_\\phi(s') - V_\\phi(s) = 2.0 + 0.9 \\cdot 6.0 - 5.0 = 2.0 + 5.4 - 5.0 = 2.4.
\\]
The advantage is \\(+2.4\\): this transition turned out \\(2.4\\) units better than the critic expected. Good news — the actor should make action \\(a\\) more likely.

**Step 2 — update the critic toward the target.** The critic's target is \\(r + \\gamma V_\\phi(s') = 7.4\\); its prediction was \\(5.0\\); the gradient of the squared TD error w.r.t. the prediction is just \\(-\\delta\\), so the value moves up by \\(\\alpha_\\phi \\delta\\):
\\[
V_\\phi(s) \\leftarrow 5.0 + 0.2 \\cdot 2.4 = 5.48.
\\]
The critic nudges its estimate of \\(s\\) from \\(5.0\\) toward the observed \\(7.4\\), landing at \\(5.48\\).

**Step 3 — update the actor.** Scale the policy-gradient by the advantage \\(\\delta = 2.4\\). The log-prob gradient \\(\\nabla_\\theta \\log \\pi_\\theta(a\\mid s)\\) points in the direction that raises \\(\\pi(a)\\); we step along it by \\(\\alpha_\\theta \\delta\\). Suppose for one logit \\(\\nabla_\\theta \\log\\pi(a) = 1 - 0.4 = 0.6\\). Then that parameter moves by \\(\\alpha_\\theta \\cdot \\delta \\cdot 0.6 = 0.1 \\cdot 2.4 \\cdot 0.6 = 0.144\\), raising the logit and hence \\(\\pi(a)\\) on the next visit.

Notice the single \\(\\delta = 2.4\\) drove *both* updates: it told the critic "you under-predicted, raise \\(V(s)\\)" and told the actor "that action beat expectations, do it more." Had \\(\\delta\\) been negative — say the critic had predicted \\(V(s) = 8\\), giving \\(\\delta = 7.4 - 8 = -0.6\\) — both updates would reverse: the critic lowers its estimate, and the actor *suppresses* the action. The sign of one shared number coordinates the whole system.`,
      },
      {
        kind: 'ascii',
        heading: 'The actor-critic loop',
        body: `        +-----------------------------+
   s -->|  ACTOR   pi_theta(a | s)    |--> sample action a
        +-----------------------------+
                     |                          ^
                     v                          | delta scales the
              take a, observe r, s'             | policy gradient
                     |                          |
                     v                          |
        +-----------------------------+         |
   s -->|  CRITIC  V_phi(s)           |         |
   s'-->|          V_phi(s')          |         |
        +-----------------------------+         |
                     |                          |
                     v                          |
     delta = r + gamma * V(s') - V(s) ----------+
                     |
                     +--> critic update: V(s) += alpha_phi * delta

  (one shared TD error delta trains both networks each step.)`,
      },
      {
        kind: 'code',
        language: 'python',
        heading: 'One-step actor-critic update (PyTorch sketch)',
        body: `import torch

def actor_critic_step(actor, critic, opt_a, opt_c, s, a_logp, r, s2, done, gamma=0.99):
    v_s  = critic(s)
    v_s2 = torch.tensor(0.0) if done else critic(s2).detach()  # no bootstrap past terminal

    target = r + gamma * v_s2
    delta  = (target - v_s).detach()        # the shared TD error / advantage

    # critic: regress V(s) toward the TD target
    critic_loss = (target.detach() - v_s).pow(2)
    opt_c.zero_grad(); critic_loss.backward(); opt_c.step()

    # actor: ascend log pi(a|s) * advantage  ->  minimise its negative
    actor_loss = -a_logp * delta
    opt_a.zero_grad(); actor_loss.backward(); opt_a.step()
    return delta.item()`,
      },
      {
        kind: 'callout',
        tone: 'warning',
        body: `**Common mistake: backpropagating through the critic into the advantage.** The advantage \\(\\delta\\) that scales the actor's gradient must be treated as a *constant* — \`.detach()\` it. If you leave \\(V_\\phi(s')\\) attached to the graph, the actor's loss starts pushing gradients into the critic's parameters (and vice versa), the two objectives entangle, and training becomes unstable or silently wrong. The TD target for the critic must also be detached from the prediction it is regressing toward, or you get a moving-target feedback loop. Detach the target, detach the advantage — only the quantity being directly optimised stays attached.`,
      },
      {
        kind: 'prose',
        heading: 'Exercise',
        body: `Use the worked-example setup but make the critic *wrong in the optimistic direction*: \\(V_\\phi(s) = 9.0\\), \\(V_\\phi(s') = 6.0\\), \\(r = 2.0\\), \\(\\gamma = 0.9\\), \\(\\alpha_\\theta = 0.1\\), \\(\\alpha_\\phi = 0.2\\).

(a) Compute \\(\\delta\\). Is the action reinforced or suppressed, and why does an over-optimistic critic cause the actor to *avoid* an action that actually earned positive reward? (b) Compute the new \\(V_\\phi(s)\\) after the critic update and confirm it moves toward the target \\(r + \\gamma V_\\phi(s')\\), reducing the over-estimate. (c) Argue informally: if the critic is badly mis-calibrated early in training, what happens to the actor's updates, and why does the critic eventually "catch up" and correct the actor's direction? (d) Extend the code's one-step bootstrap to a **two-step** return \\(r_t + \\gamma r_{t+1} + \\gamma^2 V_\\phi(s_{t+2})\\) and state whether this raises or lowers variance relative to the one-step version.`,
      },
      {
        kind: 'prose',
        heading: 'Further reading',
        body: `- [OpenAI Spinning Up — Vanilla Policy Gradient & Actor-Critic](https://spinningup.openai.com/en/latest/algorithms/vpg.html) — the cleanest from-scratch derivation with runnable code.
- [Mnih et al. 2016 — Asynchronous Methods for Deep RL (A3C)](https://arxiv.org/abs/1602.01783) — the paper that made actor-critic scale.
- [Schulman et al. 2015 — High-Dimensional Continuous Control Using GAE](https://arxiv.org/abs/1506.02438) — generalised advantage estimation, the variance-bias dial.`,
      },
    ],
  },
  {
    slug: 'exploration-vs-exploitation',
    title: 'Exploration vs exploitation',
    oneLiner: 'Take the reward you know, or gamble on finding a bigger one? Every learning agent must decide, forever.',
    difficulty: 'foundation',
    readMinutes: 11,
    sections: [
      {
        kind: 'prose',
        heading: 'The oldest dilemma in learning',
        body: `Every agent that learns from its own actions faces the same fork. **Exploit:** take the action that looks best given what you know, and collect the reward you are confident in. **Explore:** try something whose value is uncertain, accepting a likely worse outcome now in exchange for information that might reveal a better option later. You cannot do both at once, and you face the choice on every single step.

Pure exploitation is a trap. An agent that always takes its current-best action can lock onto a mediocre option forever, because it never gathers the evidence that would reveal a superior one. Imagine a slot machine that paid out the first time you pulled it; if you only ever pull the lever that has worked, you never discover the machine next to it that pays double. Pure exploration is equally useless: an agent that acts randomly forever learns a great deal but never *cashes in* on what it learned, so its actual collected reward stays low.

The tension is fundamental because of **opportunity cost**. Every exploratory pull is a pull you did not spend on the option you currently believe is best — that is reward forgone. Yet every exploitative pull is information forgone. The art is spending exploration where it is most likely to pay off and tapering it as your estimates sharpen. The cleanest setting to study this is the **multi-armed bandit**: \\(k\\) slot-machine arms, each with an unknown fixed reward distribution, and a budget of pulls. No states, no transitions — just the pure explore-exploit choice, repeated.`,
      },
      {
        kind: 'prose',
        heading: 'Regret — the quantity we actually minimise',
        body: `To compare strategies we need a number. That number is **regret**: the total reward you lost by not playing the best arm every time. If the best arm has true mean \\(\\mu^\\star\\) and on round \\(t\\) you pulled an arm with mean \\(\\mu_{a_t}\\), the cumulative regret after \\(T\\) rounds is

\\[
\\text{Regret}(T) = \\sum_{t=1}^{T} \\left( \\mu^\\star - \\mu_{a_t} \\right).
\\]

A strategy that always exploited the true best arm has zero regret — but you do not know which arm that is, which is the whole problem. Every exploratory pull of a sub-optimal arm adds its gap \\(\\mu^\\star - \\mu_a\\) to the regret. So regret directly measures the price of learning.

The goal is **sublinear** regret: \\(\\text{Regret}(T)\\) growing slower than \\(T\\), so the *average* regret per round \\(\\text{Regret}(T)/T \\to 0\\). Sublinear regret means that, in the long run, you play the best arm essentially all the time — you have learned. A strategy with *linear* regret (regret \\(\\propto T\\)) keeps making the same fractional mistake forever; it never fully commits to the best arm. This single distinction sorts the good strategies from the bad: the classic results show the best achievable regret grows like \\(\\log T\\), and any strategy that explores a fixed fraction of the time forever is stuck at linear regret.`,
      },
      {
        kind: 'prose',
        heading: 'Worked example — ε-greedy vs UCB on a 3-arm bandit',
        body: `Three arms with true means \\(\\mu = (0.3, 0.5, 0.9)\\) — arm 3 is best, but the agent does not know that. Reward is Bernoulli (0 or 1). Track each arm's empirical mean \\(\\hat\\mu_a\\) and pull count \\(n_a\\).

**\\(\\varepsilon\\)-greedy** with \\(\\varepsilon = 0.1\\): with probability \\(0.9\\) pull the arm with the highest \\(\\hat\\mu_a\\), with probability \\(0.1\\) pull a uniformly random arm. Suppose after some pulls the estimates are \\(\\hat\\mu = (0.30, 0.55, 0.85)\\) with counts \\(n = (10, 20, 30)\\). The greedy choice is arm 3. But \\(\\varepsilon\\)-greedy keeps spending \\(10\\%\\) of pulls *uniformly* — including on arm 1, the worst — forever. Its long-run regret per round floors out at roughly \\(\\varepsilon \\cdot (\\text{average gap})\\), which is linear in \\(T\\). It learns the right arm fast but bleeds reward on pointless random pulls indefinitely.

**UCB (upper confidence bound)** instead pulls the arm maximising an optimistic score:
\\[
\\text{UCB}_a = \\hat\\mu_a + \\sqrt{\\frac{2 \\ln t}{n_a}}.
\\]
The bonus term is large when an arm has been pulled rarely (\\(n_a\\) small) and shrinks as evidence accumulates. Plug in at total round \\(t = 60\\):

- Arm 1: \\(0.30 + \\sqrt{2 \\ln 60 / 10} = 0.30 + \\sqrt{0.819} = 0.30 + 0.905 = 1.205\\).
- Arm 2: \\(0.55 + \\sqrt{2 \\ln 60 / 20} = 0.55 + \\sqrt{0.409} = 0.55 + 0.640 = 1.190\\).
- Arm 3: \\(0.85 + \\sqrt{2 \\ln 60 / 30} = 0.85 + \\sqrt{0.273} = 0.85 + 0.522 = 1.372\\).

UCB picks arm 3 here — but notice arm 1, despite its dismal \\(\\hat\\mu = 0.30\\), scores \\(1.205\\) purely from its uncertainty bonus, *above* the better-known arm 2. UCB will revisit arm 1 not at random but *because it is under-explored*, and once \\(n_1\\) grows the bonus collapses and arm 1 is dropped for good. This is **directed** exploration: it spends pulls where uncertainty is highest, not uniformly. The payoff is \\(O(\\log T)\\) regret — sublinear — versus \\(\\varepsilon\\)-greedy's linear floor. Same problem, asymptotically better because exploration is aimed rather than scattered.`,
      },
      {
        kind: 'ascii',
        heading: 'Three strategies, side by side',
        body: `strategy        how it explores              regret growth
--------------  ---------------------------  -------------
greedy          never (always best estimate) linear  (gets stuck)
epsilon-greedy  eps fraction, uniformly      linear  (eps floor)
eps decaying    eps shrinks ~ 1/t            log     (if tuned)
UCB             optimism by uncertainty      log     (provable)
Thompson        sample from posterior belief log     (Bayesian)

(directed exploration -> sublinear regret;
 fixed-rate random exploration -> linear regret floor.)`,
      },
      {
        kind: 'prose',
        heading: 'Beyond bandits — exploration in deep RL',
        body: `In full reinforcement learning the dilemma is harder, because rewards are sparse and delayed: you may have to take a long, deliberate sequence of actions before *any* reward appears, so random exploration almost never stumbles onto it. \\(\\varepsilon\\)-greedy on Atari's Montezuma's Revenge — a game where the first reward is many precise actions away — gets essentially nowhere, because uniformly random jitter never executes the exact key-grab-then-door sequence.

The same ideas scale up, dressed differently. **Optimism** reappears as exploration bonuses added to the reward for visiting novel states — count-based bonuses \\(\\propto 1/\\sqrt{N(s)}\\), or for high-dimensional states, *pseudo-counts* and curiosity signals where a separate network's prediction error stands in for novelty (states it predicts badly are states it has not seen). **Posterior sampling** reappears as Thompson-style methods that maintain a distribution over value functions and act greedily w.r.t. a sample, which automatically explores where the agent is uncertain. **Entropy regularisation** — adding a bonus for keeping the policy's action distribution spread out — is the soft, continuous cousin of \\(\\varepsilon\\)-greedy and underlies algorithms like soft actor-critic.

The unifying principle across all of them: *explore in proportion to your uncertainty, and let that uncertainty shrink with evidence.* Strategies that explore a fixed amount forever waste reward; strategies that stop exploring too early get stuck; the winners are the ones whose exploration is both *directed* (aimed at what you don't know) and *self-annealing* (fading as you learn). That is the same lesson the three-arm bandit taught, scaled to a billion-state game.`,
      },
      {
        kind: 'callout',
        tone: 'warning',
        body: `**Common mistake: decaying \\(\\varepsilon\\) to zero too fast.** A popular schedule anneals the exploration rate from \\(1.0\\) down to a small value over training. Crush it to \\(0\\) (or near it) before the agent has actually found the good states and you *lock in* a premature, mediocre policy — the agent stops gathering the evidence that would have revealed a better strategy, and its estimates can never correct. Keep a non-trivial exploration floor (often \\(\\varepsilon \\approx 0.01\\text{–}0.05\\)) until you have clear evidence the value estimates have stabilised, and decay over the *whole* training budget, not the first few percent of it.`,
      },
      {
        kind: 'prose',
        heading: 'Exercise',
        body: `Use the 3-arm bandit with true means \\(\\mu = (0.3, 0.5, 0.9)\\).

(a) For \\(\\varepsilon\\)-greedy with fixed \\(\\varepsilon = 0.1\\), compute the expected per-round regret *once the agent has correctly identified arm 3 as best*. (Hint: with prob \\(0.9\\) it plays arm 3, regret \\(0\\); with prob \\(0.1\\) it plays a uniform random arm — average over the three gaps.) Show this is a positive constant, hence regret grows linearly. (b) Recompute the UCB scores from the worked example at total round \\(t = 600\\) instead of \\(60\\), with the same counts scaled up tenfold (\\(n = (100, 200, 300)\\)). Has arm 1's confidence bonus shrunk enough to drop it below arm 2? (c) Implement both strategies in ~30 lines, run \\(T = 5000\\) pulls, and plot cumulative regret — confirm \\(\\varepsilon\\)-greedy's curve is a rising straight line while UCB's bends sublinearly. (d) Add an \\(\\varepsilon\\)-decay schedule \\(\\varepsilon_t = 1/\\sqrt{t}\\) and check whether its regret curve now bends like UCB's.`,
      },
      {
        kind: 'prose',
        heading: 'Further reading',
        body: `- [Lattimore & Szepesvári — Bandit Algorithms (free PDF)](https://tor-lattimore.com/downloads/book/book.pdf) — the definitive modern text on regret, UCB, and Thompson sampling.
- [Sutton & Barto — RL: An Introduction, Ch. 2 (free PDF)](http://incompleteideas.net/book/RLbook2020.pdf) — the multi-armed bandit and \\(\\varepsilon\\)-greedy from first principles.
- [Pathak et al. 2017 — Curiosity-driven Exploration by Self-Supervised Prediction](https://arxiv.org/abs/1705.05363) — prediction-error curiosity for sparse-reward deep RL.`,
      },
    ],
  },
];
