---
slug: design-pattern-template-method
module: foundations-patterns
title: Template Method Pattern
subtitle: Algorithm skeleton with overridable steps
difficulty: Beginner
position: 404
estimatedReadMinutes: 13
prereqs: []
relatedProblems: []
references:
  - https://refactoring.guru/design-patterns/template-method
  - https://martinfowler.com/bliki/TemplateMethod.html
  - https://github.com/DovAmir/awesome-design-patterns
status: published
---

## intro
Template Method defines the skeleton of an algorithm in a base class while letting subclasses override specific steps without changing the overall structure. The base method orchestrates the order; subclasses fill in the variable parts. It is the Hollywood principle in code: do not call us, we will call you.

## whyItMatters
- **JUnit / pytest test runners**: the base class enforces `setUp → run → tearDown` order; your test class overrides only the hooks. Without the pattern, every test author would re-implement teardown ordering and forget to release resources.
- **Servlet API (`HttpServlet.service`)**: dispatches by method to `doGet`, `doPost`, `doPut`; your servlet overrides only the relevant verbs. The order — auth check, dispatch, response flush — is fixed by the container.
- **React class-component lifecycle**: `componentDidMount`, `componentDidUpdate`, `componentWillUnmount` are template hooks the framework guarantees to call in a specific order.
- **Spring Batch jobs**: `AbstractStep.doExecute` orchestrates open-reader → process-chunk → write-chunk → commit, with hooks for read, process, write that you supply.
- **AWS Lambda runtime**: invokes your `handler` inside a fixed init → invoke → shutdown loop; you only override the invoke step.
- **Compiler passes (LLVM `FunctionPass`, GCC plugins)**: pass infrastructure runs the schedule; you implement `runOnFunction` and inherit ordering, dominance analysis, and pass dependencies for free.

The economic argument: a 5-step workflow used by 12 variants without the pattern costs 60 callsites to maintain; with Template Method it's one skeleton plus 12 small overrides — a 5× reduction in surface area when the workflow itself evolves.

## intuition
The pattern exists to solve one specific problem: you have multiple workflows that *almost* share an algorithm, but each diverges at a handful of well-defined points. Naively, you write each variant top-to-bottom and live with the duplication. The first time you need to add a step — say, a logging hook between two phases — you discover the duplication has metastasised: the new step must be inserted in *every* variant, in *exactly* the same place, with *exactly* the same arguments, and any drift is silent.

Template Method's move is to invert the locus of control. Instead of subclasses *containing* the workflow and *calling out* to shared helpers, the base class *owns* the workflow and *calls in* to subclass-supplied steps. This is the Hollywood Principle ("don't call us, we'll call you"). The skeleton lives in exactly one place and is therefore impossible to drift. New steps are inserted once, in the base class, and propagate to every subclass automatically. Hooks let subclasses optionally extend the workflow without rewriting it.

The mental model that helps most is a recipe with blanks. The base class is a printed recipe card: "preheat to ___°F, mix ___ for ___ minutes, bake for ___ minutes, cool, top with ___". The order of operations and the structure are typeset in ink. The blanks are the abstract methods subclasses must fill. Hooks are optional steps the recipe mentions parenthetically — "(optionally brush with egg wash)" — that default to no-op. Subclasses cannot reorder the steps, cannot delete the bake step, cannot skip cooling. They can only fill blanks and opt into hooks.

This rigidity is the point. Template Method is the right pattern when the *order* of operations is invariant and the *content* of operations varies. If both the order and the content vary, you want Strategy instead. The choice is determined by where you draw the stable / unstable boundary in your domain.

## optimal
The base class declares one `final` (or otherwise non-overridable) public method — the template — that orchestrates the workflow. Each varying step is a protected method, marked abstract when subclasses must provide it, given a default body when optional. Hooks are no-op virtuals subclasses may override.

```python
from abc import ABC, abstractmethod

class DataPipeline(ABC):
    def run(self):                          # the template; do not override
        raw = self.extract()
        validated = self.validate(raw)
        self.before_transform(validated)    # optional hook, no-op by default
        out = self.transform(validated)
        self.load(out)
        self.after_load(out)
        return out

    @abstractmethod
    def extract(self): ...                  # required

    def validate(self, rows):               # default = pass-through; override to add checks
        return rows

    @abstractmethod
    def transform(self, rows): ...          # required

    @abstractmethod
    def load(self, rows): ...               # required

    def before_transform(self, rows): pass  # hook
    def after_load(self, rows): pass        # hook

class CsvToPostgres(DataPipeline):
    def __init__(self, path, conn): self.path, self.conn = path, conn
    def extract(self):    return list(csv.DictReader(open(self.path)))
    def transform(self, rows):
        return [{**r, "ingested_at": datetime.utcnow()} for r in rows]
    def load(self, rows):
        execute_values(self.conn.cursor(), "INSERT INTO events VALUES %s", rows)
    def after_load(self, rows):
        log.info("loaded %d rows", len(rows))
```

Why this is the right shape: the *workflow* is asserted exactly once and cannot be subverted; the *variation points* are explicit in the type signature (abstract = must override, default = may override, hook = no-op extension); and the *execution order* is encoded as straight-line code in `run`, which is the easiest possible form to audit.

Implementation discipline that distinguishes good template methods from sprawling ones: (1) mark the template `final` in Java/C#, or document the contract in Python — letting subclasses override the skeleton itself destroys the pattern; (2) keep abstract steps minimal — every required override is friction for new subclass authors, so prefer optional defaults plus hooks; (3) name hooks with `before_` / `after_` prefixes so override intent is obvious at the call site; (4) when variation explodes past five or six concrete subclasses, the workflow probably has multiple axes of variation and you should switch to Strategy + composition before the inheritance tree calcifies. The pattern has zero asymptotic cost — one virtual dispatch per step — so it's almost always free in production.

## visualization
Picture a numbered list with some lines blank. The base class fills in the numbered structure and marks blanks as hooks. Subclasses fill the blanks. At runtime the base method walks the list in order, calling into the subclass at each hook.

## bruteForce
Each subclass implements the entire workflow itself. Adding a new step (a logging hook, a validation pass) means editing every subclass. Bug fixes to the orchestration must be applied N times. Refactors are risky because no one place owns the algorithm.

## optimal
Write the skeleton as a non-overridable method in the base class. Extract each varying step into a protected method, abstract if always required, with a default implementation if optional. Mark the template method final in languages that support it so the order cannot be subverted. Hooks (no-op virtuals) allow optional extension points.

## complexity
The pattern adds no asymptotic cost. Each call dispatches through one virtual method per step, which is constant overhead. Where it pays back is in maintenance: a single skeleton serves an unbounded number of variants.

## pitfalls
Over-deep inheritance hierarchies become rigid; favor composition or Strategy if the variation explodes. Letting subclasses override the template itself defeats the pattern. Hooks that depend on call order create hidden coupling. Documentation should make the contract — which methods are abstract, which are hooks — explicit.

## interviewTips
Compare with Strategy: Template Method uses inheritance to swap steps; Strategy composes objects to swap whole algorithms. Mention frameworks like JUnit's setUp/tearDown, servlet doGet/doPost, and React component lifecycle methods as in-the-wild examples.

## code.python
```python
from abc import ABC, abstractmethod

class ReportGenerator(ABC):
    def generate(self):
        data = self.fetch()
        cleaned = self.clean(data)
        return self.render(cleaned)

    @abstractmethod
    def fetch(self): ...

    def clean(self, data):
        return data

    @abstractmethod
    def render(self, data): ...

class CsvReport(ReportGenerator):
    def fetch(self): return [{"a": 1}, {"a": 2}]
    def render(self, data): return "\n".join(",".join(map(str, row.values())) for row in data)
```

## code.javascript
```javascript
class ReportGenerator {
  generate() {
    const data = this.fetch();
    const cleaned = this.clean(data);
    return this.render(cleaned);
  }
  fetch() { throw new Error("override"); }
  clean(data) { return data; }
  render() { throw new Error("override"); }
}

class CsvReport extends ReportGenerator {
  fetch() { return [{ a: 1 }, { a: 2 }]; }
  render(data) { return data.map(r => Object.values(r).join(",")).join("\n"); }
}
```

## code.java
```java
abstract class ReportGenerator {
    public final String generate() {
        var data = fetch();
        var cleaned = clean(data);
        return render(cleaned);
    }
    protected abstract Object[] fetch();
    protected Object[] clean(Object[] data) { return data; }
    protected abstract String render(Object[] data);
}

class CsvReport extends ReportGenerator {
    protected Object[] fetch() { return new Object[]{"1", "2"}; }
    protected String render(Object[] data) { return String.join(",", java.util.Arrays.stream(data).map(Object::toString).toArray(String[]::new)); }
}
```

## code.cpp
```cpp
#include <string>
#include <vector>
#include <sstream>

class ReportGenerator {
public:
    std::string generate() {
        auto data = fetch();
        auto cleaned = clean(data);
        return render(cleaned);
    }
    virtual ~ReportGenerator() = default;
protected:
    virtual std::vector<int> fetch() = 0;
    virtual std::vector<int> clean(std::vector<int> data) { return data; }
    virtual std::string render(const std::vector<int>& data) = 0;
};

class CsvReport : public ReportGenerator {
protected:
    std::vector<int> fetch() override { return {1, 2, 3}; }
    std::string render(const std::vector<int>& data) override {
        std::ostringstream out;
        for (size_t i = 0; i < data.size(); ++i) { if (i) out << ','; out << data[i]; }
        return out.str();
    }
};
```
