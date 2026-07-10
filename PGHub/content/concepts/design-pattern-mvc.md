---
slug: design-pattern-mvc
module: foundations-patterns
title: Model-View-Controller (MVC)
subtitle: Separate state, presentation, and input handling into three roles so each can evolve independently — the dominant UI architecture for fifty years.
difficulty: Intermediate
position: 98
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "GUI Architectures — Martin Fowler"
    url: "https://martinfowler.com/eaaDev/uiArchs.html"
    type: blog
  - title: "Refactoring Guru — Design Patterns Catalog"
    url: "https://refactoring.guru/design-patterns/catalog"
    type: book
  - title: "DovAmir/awesome-design-patterns — Architectural Patterns"
    url: "https://github.com/DovAmir/awesome-design-patterns"
    type: repo
status: published
---

## intro
Model-View-Controller (MVC) is an architectural pattern that splits a user-facing application into three cooperating parts. The **Model** owns data and business rules, the **View** renders state, and the **Controller** translates user input into model updates. The motivating insight is simple: rendering changes for reasons unrelated to business rules, business rules change for reasons unrelated to input handling, and input handling changes for reasons unrelated to rendering. Keep them apart and each can evolve on its own clock.

## whyItMatters
Without MVC, UI code accumulates: a button handler reads the database, formats the output, and re-renders the screen all in one method. Six months later the file is unreadable and impossible to test without a browser or a database. MVC isolates each concern: the Model is pure logic you can unit-test headlessly, the View is a thin renderer, and the Controller is a small orchestrator. The web (Rails, Django, ASP.NET MVC, Spring MVC), desktop (Cocoa, Qt), and game UI frameworks all adopted variants of this split.

## intuition
Picture a restaurant kitchen. The **Model** is the kitchen — recipes, ingredients, prep state. The **View** is the dining room — plated dishes presented to customers. The **Controller** is the waiter — takes orders from the diner, relays them to the kitchen, and signals the dining room when food is ready. Each role has one job; replace the dining room (new decor) without retraining the chefs; hire a new chef (new model) without rebuilding the dining room.

The reframe that makes MVC click is that these three roles change for *different reasons on different schedules*. Marketing wants a redesign — that touches only the View. A tax law changes how totals are computed — that touches only the Model. You add keyboard shortcuts — that touches only the Controller. When the three are tangled in one file, every one of those unrelated pressures forces you to reread and risk breaking the other two.

Walk a concrete micro-example: a shopping cart. The user clicks "Add to cart" on product `42`. That click is a *View event* — the View knows nothing except that a button was pressed, so it forwards `onAddToCart(42)` to the Controller. The Controller is the decision-maker: it validates that `42` is in stock, then calls `model.addItem(42)`. The **Model** is where the truth lives — it appends the line item, recomputes `subtotal = 84.00`, applies a `10%` coupon to reach `total = 75.60`, and then broadcasts "I changed" to its listeners. The View is one of those listeners; it re-reads the model's current state and repaints the cart badge to `1` and the total to `$75.60`. Notice what each part did *not* do: the View never computed the discount, the Model never touched HTML, and the Controller never formatted a price.

What's actually happening is a strict one-directional data flow — input goes View → Controller → Model, and change notification flows Model → View. The Model is the single source of truth; everything else is either an input adapter or an output projection of that truth. Hold that flow in your head and the code writes itself: any line that computes a business number belongs in the Model, any line that produces markup belongs in the View, and the thin glue that maps a gesture to a method call belongs in the Controller.

## visualization
A request/response trace of a shopping cart. Each row is one user gesture flowing View to Controller to Model, then the Model notifying the View to re-render. Watch how state lives only in the Model column and rendered output only in the View column:

```
STEP  USER EVENT (View)      CONTROLLER ACTION            MODEL STATE                    VIEW RENDER
----  ---------------------  ---------------------------  -----------------------------  -----------------------
1     load page              index()  -> model.load()     cart=[]           total=0.00   "Cart (0)   $0.00"
2     click Add #42          onAdd(42)-> model.add(42)    cart=[42]         total=12.00   "Cart (1)   $12.00"
3     click Add #42          onAdd(42)-> model.add(42)    cart=[42,42]      total=24.00   "Cart (2)   $24.00"
4     click Add #7           onAdd(7) -> model.add(7)     cart=[42,42,7]    total=39.00   "Cart (3)   $39.00"
5     apply "SAVE10"         onCoupon -> model.coupon()   cart=[...] disc=10%  total=35.10 "Cart (3)   $35.10"
6     click Remove #7        onDel(7) -> model.remove(7)  cart=[42,42] disc=10% total=21.60 "Cart (2)  $21.60"
7     click Checkout         checkout()-> model.submit()  order#1001 cart=[] total=0.00   "Order #1001 placed"
----  ---------------------  ---------------------------  -----------------------------  -----------------------
      View forwards gestures  Controller only routes       Model owns all numbers         View only reads+paints
```

## bruteForce
The non-MVC baseline is "code in the view" — a JSP, PHP page, or React component that opens the database, formats the result, handles the button click, and writes back, all in one file. It works for a prototype; it collapses by the second feature. Every behavior change risks layout regressions, every layout change risks data corruption, and the file becomes the union of every concern in the app.

## optimal
- **Model**: pure domain objects and a repository for persistence. No knowledge of HTTP, HTML, or the view.
- **View**: receives model data through a well-defined interface and emits user events. No business logic.
- **Controller**: handles requests/events, calls the model, picks a view, hands it the data. Thin by design.

The correctness argument rests on a single invariant: **the Model is the only source of truth, and dependencies point inward toward it.** The View depends on the Model's read interface; the Controller depends on the Model's write interface; the Model depends on *neither*. If you ever find the Model importing a view class or reaching for the request object, the arrow has reversed and the whole benefit collapses. Enforce it mechanically — the Model package should not compile against any UI or transport type.

Step by step, a well-formed interaction is: (1) the View captures a raw gesture and forwards it untranslated; (2) the Controller validates and maps that gesture to exactly one domain call, deciding *which* view renders next but never *what the numbers are*; (3) the Model executes the business rule, mutates state atomically, and emits a change notification; (4) the View re-reads current state and repaints. Keeping the Controller thin is the discipline that pays off — the moment a controller computes a total or formats currency, that logic is now untestable without a fake request and undiscoverable by the rest of the app.

**When to reach for it:** any application with non-trivial state and more than one way to present or trigger it — web apps, desktop GUIs, anything you expect to grow past a couple of features. **When to avoid it:** a throwaway script, a 100-line CLI, or a purely static page. The three-role ceremony is pure overhead when there is no state worth protecting and no second presentation to support.

Variants tailor the split to context. **MVP** (Model-View-Presenter) lets the presenter render the view explicitly — common in desktop. **MVVM** (Model-View-ViewModel) adds a view-model that exposes observable state, leveraged by data-binding (WPF, SwiftUI, Vue). **Flux/Redux** invert ownership so a single store dispatches actions back to views. Pick the variant that matches your toolchain; the underlying separation is the same.

## complexity
time: not applicable (architectural)
space: not applicable
notes: MVC's cost is structural — more files, more interfaces. The payoff is feature velocity and testability over the long run. Measure in "how many files do I change to add a feature?" not in LoC.

## pitfalls
- Fat Controllers: when controllers grow business logic, the Model is being bypassed. Push behavior into the Model.
- Smart Views: a view that calls the database or runs business rules creates the very tangle MVC prevents.
- Two-way coupling Model ↔ View: should be one-way. Models notify; views react.
- Confusing classic MVC with web MVC. In Rails-style MVC the controller often returns a fully rendered view; in classic GUI MVC the view subscribes to the model directly. Both are valid; know which you mean.
- Over-engineering tiny apps: MVC adds friction. For a 100-line CLI tool a single file is fine.

## interviewTips
- Be able to draw the three boxes and arrows from memory.
- Contrast MVC, MVP, and MVVM in one sentence each — interviewers ask.
- Connect to real frameworks: Rails (Model = ActiveRecord, View = ERB, Controller = ActionController); React+Redux as a Flux variant.
- Mention how MVC enables Test-Driven Development — Models are pure functions you can test without a browser.

## code.python
```python
class TodoModel:
    def __init__(self):
        self.items = []
        self._listeners = []
    def on_change(self, fn): self._listeners.append(fn)
    def add(self, text):
        self.items.append({"text": text, "done": False})
        self._notify()
    def toggle(self, idx):
        self.items[idx]["done"] = not self.items[idx]["done"]
        self._notify()
    def _notify(self):
        for fn in self._listeners: fn(self.items)

class ConsoleView:
    def render(self, items):
        for i, it in enumerate(items):
            mark = "x" if it["done"] else " "
            print(f"[{mark}] {i}: {it['text']}")

class TodoController:
    def __init__(self, model: TodoModel, view: ConsoleView):
        self.model = model
        model.on_change(view.render)
    def handle(self, cmd: str, *args):
        if cmd == "add": self.model.add(args[0])
        elif cmd == "toggle": self.model.toggle(int(args[0]))

m, v = TodoModel(), ConsoleView()
c = TodoController(m, v)
c.handle("add", "Write concept"); c.handle("toggle", "0")
```

## code.javascript
```javascript
class TodoModel {
  constructor() { this.items = []; this.listeners = []; }
  onChange(fn) { this.listeners.push(fn); }
  notify() { this.listeners.forEach(fn => fn(this.items)); }
  add(text) { this.items.push({ text, done: false }); this.notify(); }
  toggle(i) { this.items[i].done = !this.items[i].done; this.notify(); }
}

class ConsoleView {
  render(items) {
    items.forEach((it, i) => console.log(`[${it.done ? "x" : " "}] ${i}: ${it.text}`));
  }
}

class TodoController {
  constructor(model, view) { this.model = model; model.onChange(items => view.render(items)); }
  handle(cmd, arg) {
    if (cmd === "add") this.model.add(arg);
    else if (cmd === "toggle") this.model.toggle(Number(arg));
  }
}

const m = new TodoModel(), v = new ConsoleView();
const c = new TodoController(m, v);
c.handle("add", "Write concept"); c.handle("toggle", "0");
```

## code.java
```java
import java.util.*;
import java.util.function.Consumer;

class TodoModel {
    static class Item { String text; boolean done; Item(String t){this.text=t;} }
    private final List<Item> items = new ArrayList<>();
    private final List<Consumer<List<Item>>> listeners = new ArrayList<>();
    public void onChange(Consumer<List<Item>> l) { listeners.add(l); }
    public void add(String text) { items.add(new Item(text)); notifyAll0(); }
    public void toggle(int i) { items.get(i).done = !items.get(i).done; notifyAll0(); }
    private void notifyAll0() { for (var l : listeners) l.accept(items); }
}

class ConsoleView {
    public void render(List<TodoModel.Item> items) {
        for (int i = 0; i < items.size(); i++) {
            var it = items.get(i);
            System.out.println("[" + (it.done ? "x" : " ") + "] " + i + ": " + it.text);
        }
    }
}

class TodoController {
    private final TodoModel model;
    public TodoController(TodoModel m, ConsoleView v) { this.model = m; m.onChange(v::render); }
    public void handle(String cmd, String arg) {
        if (cmd.equals("add")) model.add(arg);
        else if (cmd.equals("toggle")) model.toggle(Integer.parseInt(arg));
    }
}
```

## code.cpp
```cpp
#include <functional>
#include <iostream>
#include <string>
#include <vector>

struct Item { std::string text; bool done = false; };

class TodoModel {
    std::vector<Item> items_;
    std::vector<std::function<void(const std::vector<Item>&)>> listeners_;
    void notify_() { for (auto& l : listeners_) l(items_); }
public:
    void onChange(std::function<void(const std::vector<Item>&)> l) { listeners_.push_back(std::move(l)); }
    void add(std::string t) { items_.push_back({std::move(t), false}); notify_(); }
    void toggle(size_t i) { items_[i].done = !items_[i].done; notify_(); }
};

class ConsoleView {
public:
    void render(const std::vector<Item>& items) {
        for (size_t i = 0; i < items.size(); ++i)
            std::cout << "[" << (items[i].done ? 'x' : ' ') << "] " << i << ": " << items[i].text << "\n";
    }
};
```
