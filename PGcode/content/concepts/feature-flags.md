---
slug: feature-flags
module: sd-reliability
title: Feature Flags
subtitle: Decouple deploy from release with targeting rules, gradual rollouts, and instant kill switches.
difficulty: Intermediate
position: 4
estimatedReadMinutes: 8
prereqs: []
relatedProblems: []
references:
  - title: "Martin Fowler — Feature Toggles"
    url: "https://martinfowler.com/articles/feature-toggles.html"
    type: blog
  - title: "Microservices.io — Externalized configuration"
    url: "https://microservices.io/patterns/externalized-configuration.html"
    type: book
  - title: "donnemartin/system-design-primer — Deployment"
    url: "https://github.com/donnemartin/system-design-primer"
    type: repo
status: published
---

## intro
A feature flag is a runtime conditional that gates new code paths behind a configuration value. Instead of "deploy = release," teams ship dark code to production, then decide later — and per cohort — who sees it. Categories include release toggles (short-lived rollout gates), experiment toggles (A/B tests), ops toggles (kill switches), and permission toggles (entitlements).

## whyItMatters
Coupling deploy to release means every launch is a high-stakes event: roll forward succeeds for everyone or fails for everyone. With flags, you separate the act of putting code in production from the act of exposing it to users. You can deploy at 9 AM on a Tuesday, ramp to 1% of traffic, watch metrics, ramp to 10%, then 100% — or kill it in seconds without a code rollback. This is how mature teams achieve dozens of deploys per day without scaring anyone.

## intuition
Traditional deploys couple "code reaches production" with "users see the change" — every release is a high-stakes, all-or-nothing event. A bug deployed at noon is a customer-impacting incident from noon onward, and rolling back means a code revert + redeploy cycle measured in minutes. Worse, you cannot incrementally validate new behavior against real traffic; you either ship to 100% of users or none.

Feature flags break that coupling. A flag is a runtime conditional — `if (flags.isEnabled("new-checkout", user))` — that gates a code path behind a configuration value fetched from a flag service (LaunchDarkly, Unleash, OpenFeature, ConfigCat, or homegrown). The code reaches production as soon as the deploy lands; users only see the new path when the flag's targeting rules say so. Now "deploy" and "release" are independent verbs. You deploy at 9 AM on a Tuesday with the flag off (dark deploy), enable it at 1% of traffic during business hours, watch metrics, ramp to 10%, then 50%, then 100% — or kill it in seconds when an alert fires, without a code rollback.

The flag service stores a tree of **targeting rules** per flag: `{ default: false, rules: [{ if: country == "CA", on: true }, { rollout: { percent: 5, attribute: "user_id" } }] }`. At eval time, the SDK applies rules in order — a Toronto user matches the first rule and sees the new flow; a Texas user falls into the percentage bucket via a stable `hash(flag_key + user_id) % 100` and either sees it or does not, **deterministically across requests** so they never flip between old and new mid-session.

Four flag categories, each with different lifecycle expectations:
- **Release toggles** (short-lived rollout gates, expire after 100% ramp).
- **Experiment toggles** (A/B tests, expire after readout).
- **Ops toggles / kill switches** (long-lived, fire during incidents to disable expensive features).
- **Permission toggles / entitlements** (long-lived, gate by plan or role).

The stage-curtain analogy: the set is built (code deployed), the audience sees nothing, and the flag is the rope that raises the curtain — front row first, then balcony, then everyone. If something is wrong, the curtain drops in one tug; no need to dismantle the set.

## visualization
Picture `if (flags.isEnabled("new-checkout", user)) renderNewCheckout() else renderOldCheckout()`. The flag service stores: `new-checkout = { default: false, rules: [{ if: country == "CA", on: true }, { rollout: { percent: 5, attribute: "user_id" } }] }`. A user from Toronto sees the new flow. A user in Texas falls into the 5% bucket via a stable hash of their user_id and either sees it or does not — deterministically across requests.

## bruteForce
`if (process.env.NEW_CHECKOUT === 'true') ...` baked at build time. Toggling requires a redeploy. There is no targeting, no gradual ramp, no per-user determinism, no audit trail. This is acceptable for a single dev's side project and harmful at any team scale because the kill switch takes minutes to land.

## optimal
The right architecture is **a dedicated flag service (LaunchDarkly, Unleash, OpenFeature, ConfigCat, Flagsmith) with an SDK that evaluates rules locally after streaming rule updates from the control plane**. Eval must be sub-millisecond and never block the request path on a network call — cache and stream, do not poll-per-request. Every flag must have an owner, an expiry, and a cleanup ticket; otherwise stale toggles entangle the codebase and produce surprising matrix bugs.

```python
import hashlib

class FlagClient:
    def __init__(self, rules: dict):
        self.rules = rules                    # streamed in from control plane

    def is_enabled(self, key: str, user: dict) -> bool:
        flag = self.rules.get(key, {"default": False, "rules": []})
        for rule in flag.get("rules", []):
            # Conditional rule: match by user attribute.
            if "if" in rule and self._match(rule["if"], user):
                return rule["on"]
            # Percentage rollout: deterministic via stable hash.
            if "rollout" in rule:
                attr = user.get(rule["rollout"]["attribute"], "")
                # MD5 is fine here — we want fast and stable, not cryptographic.
                bucket = int(hashlib.md5(f"{key}:{attr}".encode()).hexdigest(), 16) % 100
                if bucket < rule["rollout"]["percent"]:
                    return True
        return flag.get("default", False)

    def _match(self, expr: dict, user: dict) -> bool:
        attr, op, val = expr["attr"], expr["op"], expr["value"]
        if op == "==": return user.get(attr) == val
        if op == "in": return user.get(attr) in val
        return False

# Sample rule tree (streamed from the flag service):
rules = {
    "new-checkout": {
        "default": False,
        "rules": [
            {"if": {"attr": "plan", "op": "==", "value": "internal"}, "on": True},
            {"if": {"attr": "country", "op": "==", "value": "CA"}, "on": True},
            {"rollout": {"attribute": "user_id", "percent": 5}},
        ],
    }
}
client = FlagClient(rules)
```

Why this is right: **rules stream from the control plane in real time** (LaunchDarkly's SDK opens a persistent SSE connection, Unleash polls every 15s, OpenFeature defines a vendor-neutral provider interface), so a kill-switch toggled in the UI takes effect within seconds across every server. **Local evaluation** keeps the per-request cost sub-millisecond — no network call on the hot path. **Deterministic bucketing** via `hash(flag_key + stable_user_id) % 100` ensures the same user always sees the same variant for the duration of a rollout (otherwise a user flipping between "saw new UI" and "saw old UI" mid-session produces confused state and broken sessions).

**Critical production disciplines**:
- **Stable bucket attribute** (`user_id`, `device_id`) — never bucket by mutable attributes (email, IP) because the bucket flips when the attribute changes.
- **Re-evaluate per request** — evaluating a flag once at startup defeats the kill-switch purpose; cache the rule tree, but call `is_enabled` on every request.
- **Audit log every flag flip** — who turned it on/off, when, what was the rule before. LaunchDarkly and Unleash ship this by default.
- **Sunset policy**: every release toggle gets a default 30-day expiry; if it is still around at expiry, the system pages the owner. Without this, flag debt compounds — a 5-year-old codebase with 800 live flags has 2^800 possible code-path combinations no test suite can cover.
- **Targeting by segment, not by individual user** for anything beyond the first 1% — easier to reason about, easier to revoke.

**Anti-patterns**: Hardcoded env-var flags (`process.env.NEW_CHECKOUT === 'true'`) require a redeploy to toggle — useless as a kill switch. Application-side dedupe of percentage rollouts using random sampling — non-deterministic, users flip between variants. Treating flags as a substitute for tests — every flag-gated code path still needs both-branch coverage. Mixing experiment toggles (A/B tests) with release toggles (rollout gates) in one flag — the experiment readout becomes invalid when the rollout completes.

**OpenFeature** (CNCF Sandbox project, 2022) is the vendor-neutral SDK API; pick OpenFeature + a provider (LaunchDarkly, Flagsmith, GrowthBook) to avoid vendor lock-in. **Martin Fowler's "Feature Toggles" article** (2017) and **Pete Hodgson's pattern catalog** distinguish release / experiment / ops / permission toggles and assign each a lifecycle expectation.

## complexity
time: O(R) per eval for R rules (R is small, usually 1–5)
space: O(F) flag definitions cached per process
notes: The dangerous complexity is organizational — flag debt. A 5-year-old codebase with 800 live flags has more combinatorial test states than tests can cover. Set a default sunset (e.g., 30 days post-100%) and enforce it.

## pitfalls
- Evaluating a flag once at startup — defeats the kill-switch purpose. Re-evaluate per request.
- Non-deterministic bucketing — same user sees new UI, then old UI, then new UI, depending on which pod served them.
- No flag cleanup discipline — stale toggles entangle the codebase and produce surprising matrix bugs.
- Targeting by mutable attributes (e.g., email) without a stable user id — bucket flips when the attribute changes.
- Treating flags as a substitute for tests — your code paths still need real test coverage on both branches.

## interviewTips
- Distinguish release / experiment / ops / permission toggles — interviewers love the taxonomy.
- Bring up "deploy != release" explicitly; it is the canonical one-liner.
- Mention kill switches and circuit-breaker-style usage during incidents.
- Mention flag debt and the importance of a sunset process.

## code.python
```python
import hashlib

class FlagClient:
    def __init__(self, rules):
        self.rules = rules

    def is_enabled(self, key, user):
        flag = self.rules.get(key, {"default": False, "rules": []})
        for rule in flag.get("rules", []):
            if "if" in rule and self._match(rule["if"], user):
                return rule["on"]
            if "rollout" in rule:
                attr = user.get(rule["rollout"]["attribute"], "")
                bucket = int(hashlib.md5(f"{key}:{attr}".encode()).hexdigest(), 16) % 100
                if bucket < rule["rollout"]["percent"]:
                    return True
        return flag.get("default", False)

    def _match(self, expr, user):
        attr, op, val = expr["attr"], expr["op"], expr["value"]
        return user.get(attr) == val if op == "==" else False
```

## code.javascript
```javascript
import crypto from 'crypto';

class FlagClient {
  constructor(rules) { this.rules = rules; }

  isEnabled(key, user) {
    const flag = this.rules[key] || { default: false, rules: [] };
    for (const rule of flag.rules) {
      if (rule.if && this._match(rule.if, user)) return rule.on;
      if (rule.rollout) {
        const attr = user[rule.rollout.attribute] || '';
        const hex = crypto.createHash('md5').update(`${key}:${attr}`).digest('hex');
        const bucket = parseInt(hex.slice(0, 8), 16) % 100;
        if (bucket < rule.rollout.percent) return true;
      }
    }
    return flag.default;
  }

  _match({ attr, op, value }, user) {
    return op === '==' ? user[attr] === value : false;
  }
}
```

## code.java
```java
public class FlagClient {
    private final Map<String, Flag> rules;

    public FlagClient(Map<String, Flag> rules) { this.rules = rules; }

    public boolean isEnabled(String key, Map<String, String> user) {
        Flag flag = rules.getOrDefault(key, new Flag(false, List.of()));
        for (Rule rule : flag.rules) {
            if (rule.condition != null && rule.condition.matches(user)) return rule.on;
            if (rule.rollout != null) {
                String attr = user.getOrDefault(rule.rollout.attribute, "");
                int bucket = (key + ":" + attr).hashCode() & 0x7fffffff;
                if (bucket % 100 < rule.rollout.percent) return true;
            }
        }
        return flag.defaultValue;
    }
}
```

## code.cpp
```cpp
struct Rollout { std::string attribute; int percent; };
struct Condition { std::string attr, op, value; };
struct Rule { std::optional<Condition> cond; bool on; std::optional<Rollout> rollout; };
struct Flag { bool def; std::vector<Rule> rules; };

class FlagClient {
    std::unordered_map<std::string, Flag> rules;
public:
    explicit FlagClient(std::unordered_map<std::string, Flag> r) : rules(std::move(r)) {}

    bool is_enabled(const std::string& key, const std::unordered_map<std::string, std::string>& user) {
        auto it = rules.find(key);
        if (it == rules.end()) return false;
        for (const auto& r : it->second.rules) {
            if (r.cond && user.count(r.cond->attr) && user.at(r.cond->attr) == r.cond->value) return r.on;
            if (r.rollout) {
                auto a = user.count(r.rollout->attribute) ? user.at(r.rollout->attribute) : "";
                std::size_t h = std::hash<std::string>{}(key + ":" + a);
                if ((int)(h % 100) < r.rollout->percent) return true;
            }
        }
        return it->second.def;
    }
};
```
