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
        kind: 'viz',
        component: 'BellmanUpdateViz',
        heading: 'Step one Bellman backup — watch the TD target assemble and value seep upstream',
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
        kind: 'viz',
        component: 'PolicyGradientTrajViz',
        heading: 'Sample trajectories, reweight by return, watch the policy shift',
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
        kind: 'viz',
        component: 'ActorCriticViz',
        heading: 'One shared TD error trains the critic and steers the actor',
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
        kind: 'viz',
        component: 'ExplorationExploitationViz',
        heading: 'Pull the arms: ε-greedy bleeds reward, UCB anneals toward the best',
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
  {
    slug: 'ppo-clipped-objective',
    title: 'PPO: the clipped surrogate',
    oneLiner: 'Take the biggest policy step you can without walking off the cliff — one clip term does all the safety work.',
    difficulty: 'core',
    readMinutes: 13,
    sections: [
      {
        kind: 'prose',
        heading: 'Why a plain policy gradient is dangerous',
        body: `Policy gradients tell you a *direction* to move the parameters, but not how far. Take too small a step and learning crawls; take too big a step and you can destroy a policy that took thousands of episodes to build. This is the central practical problem of policy optimisation: the gradient is computed on data sampled from the *current* policy, and the moment you move the parameters, that data becomes stale. A large update walks you into a region of parameter space where the trajectories you used to estimate the gradient no longer reflect how the policy actually behaves — and the estimate, confidently pointing "uphill," can send you off a cliff.

The natural idea is to reuse a batch of collected experience for several gradient steps to be sample-efficient. But each reuse drifts the policy further from the one that generated the data, and the further it drifts, the more wrong the gradient estimate becomes. **Proximal Policy Optimization (PPO)** is the answer that won: keep the new policy *proximal* — close — to the old one, so the sampled data stays roughly valid, while still squeezing multiple update steps out of each batch. The whole method is one cleverly shaped objective that lets you step boldly when it is safe and refuses to reward steps that wander too far.`,
      },
      {
        kind: 'prose',
        heading: 'The intuition — a leash on the policy, not a wall',
        body: `Picture the old policy standing at a spot, and every gradient update tugging it toward actions that earned positive advantage. Left unchecked, a single batch of lucky trajectories could yank the policy a huge distance in one direction, overcommitting to a pattern that happened to pay off in those particular rollouts. PPO ties a leash to the policy. Inside a small radius it moves freely, following the gradient as hard as it likes. The instant it reaches the end of the leash, the *reward* for going further drops to zero — not the ability to move, but the *incentive*. The gradient simply stops pushing once the policy has moved "enough."

The leash is measured by the **probability ratio**, \\(r_t(\\theta) = \\dfrac{\\pi_\\theta(a_t \\mid s_t)}{\\pi_{\\theta_{\\text{old}}}(a_t \\mid s_t)}\\). This is how much *more* (or less) likely the new policy is to take the action the old policy actually took. When \\(r = 1\\), nothing has changed. When \\(r = 1.3\\), the new policy is \\(30\\%\\) more likely to choose that action; when \\(r = 0.7\\), it is \\(30\\%\\) less likely. The ratio is the natural unit of "how far has the policy moved" — far cleaner than measuring distance in raw parameter space, because what matters is the change in *behaviour*, not the change in weights.

Here is the key move. For an action with a *good* advantage (\\(A > 0\\)), we want to raise its probability — push \\(r\\) above \\(1\\). But PPO refuses to keep rewarding that push once \\(r\\) exceeds \\(1 + \\varepsilon\\). Past that boundary, the objective flattens: the gradient goes to zero, and there is no incentive to make the action *even more* likely on this batch. Symmetrically, for a *bad* action (\\(A < 0\\)) we want to lower its probability — push \\(r\\) below \\(1\\) — but the reward for doing so flattens once \\(r\\) drops below \\(1 - \\varepsilon\\). The clip is one-sided in exactly the way that prevents over-correction. You get the full gradient where the step is small and trustworthy, and a dead-flat objective where the step has gone far enough that the old data can no longer vouch for it. The leash never *stops* the policy by force; it just removes the carrot once you have walked far enough, and gradient descent quietly settles.`,
      },
      {
        kind: 'viz',
        component: 'PPOClipViz',
        heading: 'Slide ε and flip the advantage sign — watch the objective flatten outside the band',
      },
      {
        kind: 'prose',
        heading: 'The clipped surrogate objective, written out',
        body: `Here is the whole thing. With \\(r_t(\\theta)\\) the probability ratio and \\(\\hat A_t\\) the estimated advantage, PPO maximises

\\[
L^{\\text{CLIP}}(\\theta) = \\mathbb{E}_t \\Big[ \\min\\big( r_t(\\theta)\\, \\hat A_t,\\; \\operatorname{clip}(r_t(\\theta),\\, 1-\\varepsilon,\\, 1+\\varepsilon)\\, \\hat A_t \\big) \\Big].
\\]

Read it term by term. The first argument of the \\(\\min\\), \\(r_t \\hat A_t\\), is the ordinary unclipped surrogate — the importance-weighted advantage that vanilla policy gradients would maximise. The second argument clamps the ratio into \\([1-\\varepsilon,\\, 1+\\varepsilon]\\) before multiplying by the advantage. Taking the **minimum** of the two is what makes the objective a *pessimistic* (lower) bound on the unclipped improvement, and it is what produces the one-sided flattening described above.

Work through the cases. For \\(\\hat A > 0\\): when \\(r < 1+\\varepsilon\\), the clip does nothing and the objective is \\(r\\hat A\\), rising with \\(r\\) — push the action up. When \\(r > 1+\\varepsilon\\), the clipped term \\((1+\\varepsilon)\\hat A\\) is smaller than \\(r\\hat A\\), so the \\(\\min\\) selects it; the objective is constant in \\(r\\) and its gradient is zero. For \\(\\hat A < 0\\): the logic mirrors. When \\(r > 1-\\varepsilon\\) the unclipped \\(r\\hat A\\) (a more negative number as \\(r\\) grows) is the smaller one and stays active, so reducing \\(r\\) keeps improving the objective. When \\(r < 1-\\varepsilon\\), the clipped term takes over and flattens it. In both signs, the objective rewards moving in the helpful direction only up to the band edge, and never penalises being already inside the band. \\(\\varepsilon\\) is typically \\(0.1\\)–\\(0.3\\); it directly sets the leash length.`,
      },
      {
        kind: 'prose',
        heading: 'Where the advantages come from — GAE in one breath',
        body: `The objective needs an advantage estimate \\(\\hat A_t\\) for every timestep, and the quality of that estimate decides how well PPO learns. The standard choice is **Generalised Advantage Estimation (GAE)**, the same variance-bias dial introduced with actor-critic. A critic \\(V_\\phi(s)\\) is trained alongside the policy; from it you form the one-step TD residual \\(\\delta_t = r_t + \\gamma V_\\phi(s_{t+1}) - V_\\phi(s_t)\\). GAE then blends these residuals across the whole trajectory with an exponential weight \\(\\lambda\\):

\\[
\\hat A_t^{\\text{GAE}} = \\sum_{l=0}^{\\infty} (\\gamma \\lambda)^l\\, \\delta_{t+l}.
\\]

The single knob \\(\\lambda \\in [0,1]\\) slides between pure one-step bootstrapping (\\(\\lambda = 0\\): low variance, high bias, leans hard on the critic) and the full Monte-Carlo advantage (\\(\\lambda = 1\\): unbiased, high variance). A common default is \\(\\lambda \\approx 0.95\\), which keeps most of the variance reduction while only lightly trusting the critic's bias. In practice you normalise the batch of advantages to zero mean and unit variance before plugging them into \\(L^{\\text{CLIP}}\\) — this keeps the effective step size stable across batches regardless of the reward scale. PPO + GAE is the workhorse pairing behind most modern on-policy results, from locomotion to RLHF fine-tuning of language models.`,
      },
      {
        kind: 'code',
        language: 'python',
        heading: 'The clipped surrogate loss (PyTorch sketch)',
        body: `import torch

def ppo_loss(logp_new, logp_old, advantages, eps=0.2):
    # logp_*: log pi(a|s) under new and (detached) old policy, shape [N]
    # advantages: GAE estimates, already normalized, shape [N]
    ratio = torch.exp(logp_new - logp_old)          # r_t(theta)

    unclipped = ratio * advantages
    clipped   = torch.clamp(ratio, 1 - eps, 1 + eps) * advantages

    # take the pessimistic (min) term, then NEGATE to minimize
    policy_loss = -torch.min(unclipped, clipped).mean()
    return policy_loss

# advantages: A>0 -> objective rewards pushing ratio up to 1+eps, then flat.
# advantages: A<0 -> objective rewards pushing ratio down to 1-eps, then flat.`,
      },
      {
        kind: 'callout',
        tone: 'warning',
        body: `**Common mistake: forgetting to detach the old log-probabilities.** The ratio is \\(r = \\exp(\\log\\pi_\\theta - \\log\\pi_{\\theta_{\\text{old}}})\\). The denominator \\(\\pi_{\\theta_{\\text{old}}}\\) is a *fixed snapshot* taken when the batch was collected — it must not carry gradients. If you compute \\(\\log\\pi_{\\theta_{\\text{old}}}\\) from the live network without \`.detach()\`, the ratio collapses toward \\(1\\) for the wrong reason and the clip never engages, silently turning PPO back into an unstable vanilla policy gradient. Store the old log-probs at rollout time and treat them as constants.`,
      },
      {
        kind: 'callout',
        tone: 'warning',
        body: `**Common mistake: too many epochs over one batch.** PPO reuses each batch for several gradient epochs — but every epoch drifts the policy further from \\(\\theta_{\\text{old}}\\), and once most ratios have hit the clip boundary, further epochs only overfit the critic and inflate the KL divergence. Symptoms: the approximate KL between old and new policy spikes, and return collapses. Fix: cap epochs (commonly \\(3\\)–\\(10\\)), and add an early-stop that breaks the epoch loop once the measured KL exceeds a target (e.g. \\(1.5\\times\\) a target KL).`,
      },
      {
        kind: 'callout',
        tone: 'warning',
        body: `**Common mistake: not normalising advantages.** Raw GAE advantages can have wildly varying scale across batches and reward regimes. Feeding un-normalised advantages into \\(L^{\\text{CLIP}}\\) makes the effective step size lurch — huge on high-reward batches, negligible on others — and \\(\\varepsilon\\) loses its meaning as a consistent leash. Fix: standardise advantages per batch to zero mean, unit standard deviation before the loss. Be careful to do this *after* GAE, not on raw rewards.`,
      },
      {
        kind: 'callout',
        tone: 'warning',
        body: `**Common mistake: a single optimiser for tightly-coupled actor and critic with no value-loss clipping.** When actor and critic share a backbone, a large value loss can dominate the gradient and wreck the policy. Fix: scale the value-loss term (e.g. \\(c_1 \\approx 0.5\\)), add an entropy bonus (\\(c_2 \\approx 0.01\\)) to keep exploration alive, and optionally clip the value function's change the same way the policy is clipped so one stale critic update cannot lurch the shared features.`,
      },
      {
        kind: 'prose',
        heading: 'Exercise',
        body: `Take \\(\\varepsilon = 0.2\\) and a single transition with advantage \\(\\hat A = +2\\).

(a) Plot (or tabulate) \\(L^{\\text{CLIP}}\\) as a function of \\(r\\) for \\(r \\in \\{0.5, 0.9, 1.0, 1.2, 1.5, 2.0\\}\\). At which \\(r\\) does the objective stop increasing, and what is its value there? (b) Repeat for \\(\\hat A = -2\\): for which range of \\(r\\) is the gradient nonzero, and which direction does it push \\(r\\)? (c) Argue from the \\(\\min\\) why, for \\(\\hat A > 0\\), the objective is *never* clipped on the downside — i.e. if an update accidentally pushes \\(r\\) below \\(1-\\varepsilon\\), PPO still gives the full (unclipped) signal to pull it back. Why is this asymmetry desirable? (d) Implement \`ppo_loss\` above and confirm numerically that increasing \\(\\varepsilon\\) from \\(0.1\\) to \\(0.3\\) raises the magnitude of the gradient that is still "live" at \\(r = 1.25\\).`,
      },
      {
        kind: 'prose',
        heading: 'Further reading',
        body: `- [Schulman et al. 2017 — Proximal Policy Optimization Algorithms](https://arxiv.org/abs/1707.06347) — the original PPO paper with the clipped objective.
- [Schulman et al. 2015 — High-Dimensional Continuous Control Using GAE](https://arxiv.org/abs/1506.02438) — generalised advantage estimation, the \\(\\lambda\\) dial PPO relies on.
- [OpenAI Spinning Up — Proximal Policy Optimization](https://spinningup.openai.com/en/latest/algorithms/ppo.html) — clean derivation plus runnable reference code.`,
      },
    ],
  },
  {
    slug: 'dqn-experience-replay',
    title: 'DQN: replay & target networks',
    oneLiner: 'Two stabilising tricks turn unstable Q-learning-with-a-network into the algorithm that learned Atari from pixels.',
    difficulty: 'core',
    readMinutes: 13,
    sections: [
      {
        kind: 'prose',
        heading: 'Why naive deep Q-learning falls apart',
        body: `Tabular Q-learning is provably stable: each \\(Q(s,a)\\) is its own table cell, and updating one cell does not touch any other. The moment you replace the table with a neural network \\(Q_\\theta(s,a)\\) — which you must, for image or continuous inputs — that isolation is gone. Now every parameter update changes \\(Q\\) for *many* states at once, including the very states that appear in your bootstrap target. Two pathologies follow immediately, and either one alone can make training diverge.

First, **correlated samples**. An agent collects experience by acting, so consecutive transitions are almost identical: the same room in a game, the same stretch of road. Feeding these to gradient descent in the order they arrive is like training an image classifier by showing it a thousand pictures of cats, then a thousand of dogs — the network forgets the first class while overfitting the second. Online RL data is the most correlated data there is. Second, a **moving target**. The Q-learning update fits \\(Q_\\theta(s,a)\\) toward the target \\(r + \\gamma \\max_{a'} Q_\\theta(s',a')\\) — but that target *also* depends on \\(\\theta\\). Each gradient step that adjusts the prediction simultaneously shifts the target it was chasing. The network ends up chasing its own tail, and the feedback loop can amplify small errors into divergence. **DQN** is exactly two engineering fixes — one per pathology — bolted onto Q-learning, and together they were enough to learn dozens of Atari games from raw pixels with one architecture.`,
      },
      {
        kind: 'prose',
        heading: 'The intuition — shuffle the past, and freeze the goalposts',
        body: `Both fixes are best understood as restoring something the table had for free. Take correlation first. Instead of learning from each transition the instant it happens and then throwing it away, DQN drops every transition \\((s, a, r, s')\\) into a large **replay buffer** — a ring of the last million or so experiences. To learn, it samples a *random minibatch* from this buffer. Random sampling shatters the temporal correlation: a single batch now mixes a corridor from ten minutes ago with a boss fight from last episode with a death from thirty seconds back. The gradient sees a roughly independent, identically-distributed slice of the agent's whole history, which is exactly the assumption stochastic gradient descent was built on. As a bonus, every experience gets reused many times before it ages out of the ring, so the agent squeezes far more learning out of each costly interaction with the world — replay is both a stabiliser and a sample-efficiency win.

Now the moving target. The instability came from the target \\(r + \\gamma \\max_{a'} Q_\\theta(s',a')\\) shifting every time \\(\\theta\\) changed. The fix is almost embarrassingly simple: keep a *second*, frozen copy of the network — the **target network** \\(Q_{\\theta^-}\\) — and compute the bootstrap term from it instead. The online network \\(Q_\\theta\\) is updated every step by gradient descent; the target network's weights \\(\\theta^-\\) are held fixed and only periodically overwritten with a snapshot of \\(\\theta\\) (every few thousand steps, or via a slow exponential blend \\(\\theta^- \\leftarrow \\tau\\theta + (1-\\tau)\\theta^-\\)). Picture aiming at a target on a wall: if the target slides every time you adjust your aim, you will never converge; bolt it down for a while and you can actually zero in. Freezing the goalposts turns a chaotic feedback loop into a sequence of stable, ordinary supervised-regression problems — fit toward a fixed target, then occasionally move the target and repeat. That is the entire conceptual content of DQN; everything else is the Q-learning you already know.`,
      },
      {
        kind: 'viz',
        component: 'ReplayBufferViz',
        heading: 'Sample random vs sequential minibatches — and toggle the frozen target net',
      },
      {
        kind: 'prose',
        heading: 'The Bellman TD target, written precisely',
        body: `The learning signal is the same temporal-difference target from tabular Q-learning, now with the target network supplying the bootstrap. For a sampled transition \\((s, a, r, s')\\) with terminal flag \\(d\\), the target is

\\[
y = r + \\gamma\\,(1 - d)\\,\\max_{a'} Q_{\\theta^-}(s', a'),
\\]

and the network minimises the squared TD error against it:

\\[
L(\\theta) = \\mathbb{E}_{(s,a,r,s') \\sim \\mathcal{D}} \\Big[ \\big( y - Q_\\theta(s, a) \\big)^2 \\Big].
\\]

Three details earn their keep. The \\((1-d)\\) factor zeroes the future term at terminal states — there is no "after" once the episode ends, so the target is just \\(r\\); forgetting this injects phantom value and the estimates blow past their ceiling. The \\(\\max_{a'}\\) is taken over the *target* network's values, not the online network's, which is the whole point of freezing. And the expectation is over \\(\\mathcal{D}\\), the replay buffer, not the live trajectory — the source of the decorrelation. Note this is **off-policy** by construction: the buffer holds transitions generated by *older* versions of the policy, yet the \\(\\max\\) target still teaches the *current* optimal values. That off-policy freedom is exactly why replay is even legal — an on-policy method like vanilla policy gradients could not reuse stale data this way.`,
      },
      {
        kind: 'code',
        language: 'python',
        heading: 'One DQN gradient step (PyTorch sketch)',
        body: `import torch

def dqn_step(q_net, target_net, optimizer, batch, gamma=0.99):
    s, a, r, s2, done = batch          # tensors, batch sampled from replay buffer

    # current estimate Q_theta(s, a) for the actions actually taken
    q_sa = q_net(s).gather(1, a.unsqueeze(1)).squeeze(1)

    with torch.no_grad():              # target net is frozen — no gradients
        max_next = target_net(s2).max(dim=1).values
        y = r + gamma * (1.0 - done) * max_next   # zero the future at terminals

    loss = torch.nn.functional.smooth_l1_loss(q_sa, y)   # Huber: robust to outliers
    optimizer.zero_grad(); loss.backward(); optimizer.step()
    return loss.item()

# every C steps:  target_net.load_state_dict(q_net.state_dict())  # refreeze goalposts`,
      },
      {
        kind: 'callout',
        tone: 'warning',
        body: `**Common mistake: computing the target from the online network.** If you write \\(y = r + \\gamma \\max_{a'} Q_\\theta(s',a')\\) using the *same* network you are training — instead of the frozen \\(Q_{\\theta^-}\\) — you reintroduce the moving-target feedback loop DQN exists to kill. Training looks fine for a few thousand steps, then Q-values explode toward \\(\\pm\\infty\\) and return collapses. Always evaluate the bootstrap term under \`target_net\` inside \`torch.no_grad()\`, and only sync \\(\\theta^- \\leftarrow \\theta\\) every \\(C\\) steps.`,
      },
      {
        kind: 'callout',
        tone: 'warning',
        body: `**Common mistake: a replay buffer that is too small or sampled too early.** A tiny buffer (say a few thousand) barely decorrelates — recent, similar transitions dominate, and the agent overfits the present. Worse, sampling before the buffer has filled with enough variety trains on a degenerate distribution. Fix: size the buffer large (often \\(10^5\\)–\\(10^6\\)), and add a *warm-up* phase that fills it with random-policy transitions before any gradient steps begin.`,
      },
      {
        kind: 'callout',
        tone: 'warning',
        body: `**Common mistake: syncing the target network too often (or never).** Sync every step and the target net is just the online net — no stabilisation, divergence returns. Sync once and never again and the target is hopelessly stale, so learning stalls. Fix: tune the sync interval \\(C\\) (commonly a few thousand steps) or use a soft Polyak update \\(\\theta^- \\leftarrow \\tau\\theta + (1-\\tau)\\theta^-\\) with small \\(\\tau \\approx 0.005\\), which gives a smooth, always-slightly-stale target.`,
      },
      {
        kind: 'callout',
        tone: 'warning',
        body: `**Common mistake: ignoring the \\(\\max\\)-operator's overestimation bias.** Using one network to both *select* and *evaluate* the best next action (\\(\\max_{a'} Q_{\\theta^-}\\)) systematically overestimates values, because the \\(\\max\\) latches onto noisy upward errors. This compounds and slows or destabilises learning. Fix: **Double DQN** — select the next action with the online net (\\(a^* = \\arg\\max_{a'} Q_\\theta(s',a')\\)) but evaluate it with the target net (\\(Q_{\\theta^-}(s', a^*)\\)), decoupling selection from evaluation.`,
      },
      {
        kind: 'prose',
        heading: 'Exercise',
        body: `Set up a tiny gridworld and a small \\(Q_\\theta\\) network (two hidden layers is plenty).

(a) Train *without* a replay buffer — learn from each transition as it arrives — and plot the loss. Then add a replay buffer of size \\(10{,}000\\) with random minibatches and overlay the loss curves. Which is smoother, and why? (b) Train *without* a target network (compute \\(y\\) from \\(Q_\\theta\\) directly) and watch the maximum Q-value over time; does it stay bounded? Add the target network with sync interval \\(C = 500\\) and compare. (c) Implement the terminal-state mask \\((1-d)\\); deliberately remove it and show that the Q-values at states adjacent to the goal climb past their true ceiling. (d) Swap in the Double-DQN target and measure whether the average estimated \\(Q\\) is closer to the true discounted return than vanilla DQN's.`,
      },
      {
        kind: 'prose',
        heading: 'Further reading',
        body: `- [Mnih et al. 2015 — Human-level control through deep reinforcement learning (DQN)](https://www.nature.com/articles/nature14236) — the paper that introduced replay + target networks at scale.
- [van Hasselt et al. 2016 — Deep Reinforcement Learning with Double Q-learning](https://arxiv.org/abs/1509.06461) — fixes the \\(\\max\\)-operator overestimation bias.
- [Schaul et al. 2016 — Prioritized Experience Replay](https://arxiv.org/abs/1511.05952) — sample high-TD-error transitions more often than uniform.`,
      },
    ],
  },
  {
    slug: 'trust-region-methods',
    title: 'Trust regions & natural gradients',
    oneLiner: 'Step as far as the surrogate can be trusted — no further. The principle PPO turned into one clip line.',
    difficulty: 'advanced',
    readMinutes: 14,
    sections: [
      {
        kind: 'prose',
        heading: 'The surrogate is a local lie',
        body: `Every policy-optimisation method maximises a *surrogate* objective: a model of how much better the new policy would be, built from data the old policy collected. The surrogate is accurate near the old policy and increasingly wrong as you move away, because the data was sampled under the old policy and stops describing the new one's behaviour. The surrogate, however, does not know this — extrapolated naively, it keeps promising more improvement the further you step, like a linear forecast that confidently predicts the stock will reach a million if you just hold long enough. Optimise the surrogate without restraint and you take an enormous step into a region where its promise is hollow, and the *true* objective — actual return in the environment — gets worse, not better.

This is the failure mode trust-region methods are built to prevent. The fix is a discipline: **only step as far as the surrogate can be trusted.** Define a region around the current policy within which the approximation is reliable, maximise the surrogate *inside* that region, and refuse to leave it. Get the region right and you can prove something remarkable — that every update *monotonically improves* the true objective, no backsliding, episode after episode. That guarantee, and the machinery to approximate it cheaply, is the subject of **Trust Region Policy Optimization (TRPO)**, the method PPO later distilled into a single clip.`,
      },
      {
        kind: 'prose',
        heading: 'The intuition — measure distance in behaviour, not in weights',
        body: `How big is "too far"? The naive answer is to bound the change in parameters: do not let \\(\\|\\theta_{\\text{new}} - \\theta_{\\text{old}}\\|\\) exceed some radius. This is exactly wrong, and seeing why is the heart of the subject. Neural-network parameters are a terrible ruler for behavioural change. In some directions, a tiny weight nudge flips the policy's action distribution completely; in others, a huge weight change barely moves it. A fixed ball in parameter space is a wildly distorted ball in the space of policies — a leash that is choking-tight in one direction and useless slack in another.

The right ruler measures distance between the *policies themselves* — between probability distributions over actions — and the natural measure for that is the **KL divergence** \\(D_{\\text{KL}}(\\pi_{\\theta_{\\text{old}}} \\,\\|\\, \\pi_\\theta)\\). It asks: how differently does the new policy *act*, averaged over the states the old policy visits? Constrain the KL, and you have bounded the thing that actually matters — the change in behaviour — regardless of how the network's weights happen to be wired. A small KL guarantees the sampled data is still roughly valid, which is precisely the condition under which the surrogate is trustworthy. So the trust region is not a sphere in weight space; it is an ellipse in weight space whose shape is dictated by how sensitive behaviour is in each direction — fat where the policy is insensitive, thin where it is twitchy. TRPO's whole job is to maximise the surrogate subject to staying inside that behaviour-shaped ellipse: \\(\\max_\\theta L(\\theta)\\) subject to \\(D_{\\text{KL}} \\le \\delta\\). The constraint, not the objective, is what keeps you safe.`,
      },
      {
        kind: 'viz',
        component: 'TrustRegionViz',
        heading: 'Constrained vs unconstrained: the KL ball keeps the step where the surrogate is valid',
      },
      {
        kind: 'prose',
        heading: 'Natural gradients — the constraint reshapes the step',
        body: `Solving "maximise \\(L\\) subject to \\(D_{\\text{KL}} \\le \\delta\\)" exactly is hard, but a second-order approximation makes it tractable and reveals the **natural gradient**. Approximate the surrogate to first order, \\(L(\\theta) \\approx g^\\top (\\theta - \\theta_{\\text{old}})\\) with \\(g\\) the policy gradient, and the KL constraint to second order, \\(D_{\\text{KL}} \\approx \\tfrac12 (\\theta - \\theta_{\\text{old}})^\\top F (\\theta - \\theta_{\\text{old}})\\), where \\(F\\) is the **Fisher information matrix** — the local curvature of the KL, i.e. how sharply behaviour changes per unit of weight change in each direction. Maximising a linear objective inside a quadratic ball has a closed-form solution: the step points along

\\[
\\Delta\\theta \\;\\propto\\; F^{-1} g.
\\]

This is the natural gradient. The ordinary gradient \\(g\\) is the steepest-ascent direction *in raw weight coordinates*; the natural gradient \\(F^{-1}g\\) is the steepest-ascent direction *in behaviour space*, rescaled by the Fisher matrix so that a unit step means a unit of KL no matter the direction. Where behaviour is hypersensitive (large Fisher curvature), \\(F^{-1}\\) shrinks the step; where it is insensitive, \\(F^{-1}\\) lengthens it. The result is an update that moves the policy a constant *behavioural* distance in every direction — exactly the leash the KL constraint demanded. TRPO never forms \\(F^{-1}\\) explicitly (it is enormous); it solves \\(F\\,x = g\\) with conjugate gradients using fast Fisher-vector products, then runs a backtracking line search to ensure the actual KL stays under \\(\\delta\\) and the true surrogate actually improved.`,
      },
      {
        kind: 'prose',
        heading: 'Why monotonic improvement matters — and how PPO approximates it',
        body: `The theoretical prize TRPO chases is a **monotonic improvement guarantee**: a bound proving that if you maximise the surrogate while keeping the KL penalty in check, the *true* expected return cannot decrease. Concretely, the true return of the new policy is at least the surrogate value minus a penalty proportional to the KL divergence. Keep the KL small and the penalty is small, so surrogate improvement transfers to real improvement. Why does this matter so much? Because RL training is long, expensive, and brittle — a single catastrophic update can erase hours of progress, and unlike supervised learning there is no held-out set to catch the regression before it poisons the next round of data collection. A method that *cannot* go backwards is worth a great deal of complexity.

But TRPO's machinery — Fisher-vector products, conjugate gradient, line search — is heavy and finicky to implement, and it interacts awkwardly with architectures that share parameters between policy and value or use techniques like dropout. **PPO is the pragmatic descendant.** It keeps the central insight — bound the change in behaviour — but replaces the hard KL constraint and the natural-gradient solve with the cheap clipped surrogate from the PPO lesson, which heuristically achieves the same "do not move too far" effect using only first-order gradients and a \\(\\min\\). PPO trades TRPO's clean theoretical guarantee for an objective you can optimise with plain Adam and a few lines of code, and in practice it matches or beats TRPO on most benchmarks. The lineage is the lesson: trust regions gave the *principle* — step only as far as your surrogate is valid — and PPO gave the *practice*. Understanding the constrained version is what makes the clip make sense.`,
      },
      {
        kind: 'code',
        language: 'python',
        heading: 'TRPO step in pseudocode (the constrained solve)',
        body: `# TRPO: maximize surrogate L(theta) subject to KL(old || new) <= delta

g = policy_gradient(surrogate_loss)            # ordinary gradient of L

# solve F x = g for the natural-gradient direction, WITHOUT forming F:
#   conjugate gradient only needs Fisher-vector products F @ v
x = conjugate_gradient(fisher_vector_product, g, n_iters=10)

# scale so the quadratic KL approx exactly equals the budget delta:
step_size = sqrt(2 * delta / (x @ fisher_vector_product(x) + 1e-8))
full_step = step_size * x

# backtracking line search: shrink the step until BOTH hold ----
for frac in [1.0, 0.5, 0.25, 0.125, ...]:
    theta_new = theta_old + frac * full_step
    if kl(theta_old, theta_new) <= delta and surrogate(theta_new) > surrogate(theta_old):
        break                                  # accept the largest safe step
# else: reject, keep theta_old (guarantees no backsliding)`,
      },
      {
        kind: 'callout',
        tone: 'warning',
        body: `**Common mistake: constraining the parameter norm instead of the KL.** Bounding \\(\\|\\Delta\\theta\\|\\) treats every weight direction as equally important, which they emphatically are not — the same step length can be a trivial behaviour change in one direction and a policy-destroying one in another. The whole point of the trust region is to measure distance in *policy* space via KL (equivalently, via the Fisher metric). Fix: use the KL constraint / natural gradient, not a raw \\(L_2\\) ball on parameters.`,
      },
      {
        kind: 'callout',
        tone: 'warning',
        body: `**Common mistake: skipping the line search after the natural-gradient step.** The step size \\(\\sqrt{2\\delta / (x^\\top F x)}\\) is derived from a *quadratic approximation* of the KL — and that approximation underestimates the true KL for larger steps. Taking the full computed step blind can overshoot the real KL budget and violate the very constraint you solved for. Fix: always run TRPO's backtracking line search, shrinking the step until the *measured* KL is within \\(\\delta\\) and the surrogate genuinely improved.`,
      },
      {
        kind: 'callout',
        tone: 'warning',
        body: `**Common mistake: a single fixed \\(\\delta\\) that is too large.** A generous KL budget lets each update move far, where the surrogate's monotonic-improvement bound no longer holds and the penalty term swamps the gain. Symptoms: jerky returns, occasional collapses. Fix: keep \\(\\delta\\) modest (commonly \\(0.01\\)), and for the penalty-form variants (or adaptive-KL PPO), *adapt* the KL coefficient up when measured KL exceeds target and down when it falls below.`,
      },
      {
        kind: 'callout',
        tone: 'warning',
        body: `**Common mistake: estimating the Fisher matrix from too few samples.** The Fisher / KL curvature is an expectation over states; estimated from a tiny batch it is noisy and often ill-conditioned, so the conjugate-gradient solve for \\(F^{-1}g\\) returns a garbage direction. Fix: estimate Fisher-vector products on a sufficiently large batch, add a small damping term \\(F + \\alpha I\\) to the solve for numerical stability, and cap conjugate-gradient iterations.`,
      },
      {
        kind: 'prose',
        heading: 'Exercise',
        body: `Work in a 2-D toy policy-parameter space so you can draw everything.

(a) Construct a surrogate that is linear in \\(\\theta\\) and a true objective that rises then falls (a concave bump) away from \\(\\theta_{\\text{old}}\\). Show that maximising the surrogate with no constraint sends \\(\\theta\\) past the bump's peak, *decreasing* the true objective. (b) Add an isotropic trust region (a circle) and find the constrained optimum; verify the true objective improved. (c) Now make the Fisher matrix anisotropic (stretch one axis) so the trust region is an ellipse, and show the natural-gradient step \\(F^{-1}g\\) points in a *different* direction than the raw gradient \\(g\\) — toward where behaviour changes least per unit improvement. (d) Relate this back to PPO: argue informally why clipping the probability ratio at \\(1 \\pm \\varepsilon\\) acts like a per-sample, first-order stand-in for the global KL constraint.`,
      },
      {
        kind: 'prose',
        heading: 'Further reading',
        body: `- [Schulman et al. 2015 — Trust Region Policy Optimization (TRPO)](https://arxiv.org/abs/1502.05477) — the constrained objective and monotonic-improvement bound.
- [Amari 1998 — Natural Gradient Works Efficiently in Learning](https://direct.mit.edu/neco/article/10/2/251/6143) — the Fisher-metric foundation of natural gradients.
- [Kakade & Langford 2002 — Approximately Optimal Approximate Reinforcement Learning](https://people.eecs.berkeley.edu/~pabbeel/cs287-fa09/readings/KakadeLangford-icml2002.pdf) — the conservative-policy-iteration result TRPO's bound builds on.`,
      },
    ],
  },
];
