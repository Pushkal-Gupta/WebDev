---
slug: design-pattern-template-method
module: foundations
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
Many workflows share the same outline but differ in details — parsing a report, processing a payment, rendering a page, training a model. Copy-pasting the skeleton across subclasses leads to drift when one variant changes the outline but others do not. Template Method enforces a single source of truth for the order and surfaces only the genuine variation points.

## intuition
Think of a recipe template for baked goods: gather ingredients, mix, bake, cool, frost. Every cake or bread follows that outline. What differs is which ingredients, what oven temperature, what frosting. The template is fixed; the substitutions are subclassed.

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
