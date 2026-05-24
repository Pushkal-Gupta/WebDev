---
slug: feature-flags
module: system-design
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
Think of a stage with the curtain down. The set is built (code deployed), but the audience sees nothing. The flag is the rope that raises the curtain — for the front row first, then the balcony, then everyone. If something is wrong, the curtain drops in one tug; no need to dismantle the set.

## visualization
Picture `if (flags.isEnabled("new-checkout", user)) renderNewCheckout() else renderOldCheckout()`. The flag service stores: `new-checkout = { default: false, rules: [{ if: country == "CA", on: true }, { rollout: { percent: 5, attribute: "user_id" } }] }`. A user from Toronto sees the new flow. A user in Texas falls into the 5% bucket via a stable hash of their user_id and either sees it or does not — deterministically across requests.

## bruteForce
`if (process.env.NEW_CHECKOUT === 'true') ...` baked at build time. Toggling requires a redeploy. There is no targeting, no gradual ramp, no per-user determinism, no audit trail. This is acceptable for a single dev's side project and harmful at any team scale because the kill switch takes minutes to land.

## optimal
Use a flag service (LaunchDarkly, Unleash, Flagsmith, ConfigCat, OpenFeature) with: an SDK that evaluates rules locally after streaming rule updates, deterministic bucketing via `hash(flag_key + attribute)` for stable user experience, segments (`country == "CA"`, `plan == "pro"`), and percentage rollouts. Eval must be sub-millisecond and never block the request path on a network call — cache and stream, do not poll-per-request. Pair every flag with an owner, an expiry, and a cleanup ticket so flags do not become permanent dead weight in the codebase.

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
