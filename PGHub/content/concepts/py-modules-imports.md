---
slug: py-modules-imports
module: python-language
title: Modules & Imports
subtitle: How a Python file becomes a reusable module, the difference between import and from-import, and the search path and cache that decide what actually loads.
difficulty: Intermediate
position: 6
estimatedReadMinutes: 13
prereqs: [py-functions-scope]
relatedProblems: []
references:
  - title: "The Python Tutorial — Modules"
    url: "https://docs.python.org/3/tutorial/modules.html"
    type: docs
  - title: "Python docs — The import system"
    url: "https://docs.python.org/3/reference/import.html"
    type: docs
  - title: "Real Python — Python Modules and Packages: An Introduction"
    url: "https://realpython.com/python-modules-packages/"
    type: article
  - title: "Real Python — Absolute vs Relative Imports in Python"
    url: "https://realpython.com/absolute-vs-relative-python-imports/"
    type: article
status: published
---

## intro
A **module** is just a `.py` file — a container of functions, classes, and values that other files can pull from. **`import`** is how you reach those names: `import math` binds the single name `math`, and you reach inside it with `math.sqrt`. **`from math import sqrt`** copies a specific name straight into your file. A **package** is a folder of modules tied together by an `__init__.py`. Behind every import sits a **search path** that decides which file loads and a **cache** that guarantees each module runs only once.

## whyItMatters
Past about a hundred lines, a single file stops being readable and starts being a liability — every change risks breaking something unrelated, and nothing can be reused elsewhere. Modules are how Python programs grow without collapsing: split related code into files, import what you need, and each piece stays small, testable, and shareable. The entire **standard library** — `math`, `json`, `os`, `collections`, `datetime` — reaches you through the exact same import machinery, so understanding it once unlocks thousands of batteries-included tools. Imports are also a top source of confusing bugs: a file named `random.py` that shadows the stdlib, a circular import that half-loads, a `from x import *` that quietly overwrites your own names. Knowing how the search path and cache actually work turns those from mysteries into one-line fixes.

## intuition
Picture every Python file as a **drawer of labeled tools**. Inside `math.py` are tools labeled `pi`, `sqrt`, `floor`. Inside your own file you have your own labels. An **import is the act of reaching into another drawer and either grabbing the whole drawer or copying out a few specific tools** — and the labels (names) are everything.

`import math` is "put the *whole drawer* on my desk under one label, `math`." Your namespace now has exactly one new name — `math` — and every tool inside is reached through the dotted path: `math.sqrt`, `math.pi`. Nothing else leaks into your file, so there's no risk of a name collision; the cost is typing the `math.` prefix each time.

`from math import sqrt, pi` is "reach in and *copy these two specific tools* onto my desk by their own names." Now `sqrt` and `pi` are bound directly in your namespace — you call `sqrt(9)` with no prefix. Convenient, but the name `math` itself is *not* bound, and if you already had something called `sqrt`, one silently overwrites the other.

`import numpy as np` is "grab the whole drawer but **relabel it** to something shorter," which is why the data-science world types `np.array` instead of `numpy.array`.

The crucial part most people miss: **the drawer is opened exactly once.** The first time you import a module, Python runs the whole file top to bottom and files the result in a cache called `sys.modules`. Every later import of that same name doesn't re-run the file — it just hands you the already-built drawer from the cache. That's why module-level print statements fire only once no matter how many files import them, and it's the key to understanding both performance and circular imports.

## visualization
```
IMPORT pulls names from a module file into YOUR namespace
========================================================

  module file:  math.py   ->  defines  [ pi, sqrt, floor ]

  import math               from math import sqrt, pi      import math as m
  ------------              ----------------------         ----------------
  namespace gets: math      namespace gets: sqrt, pi       namespace gets: m
  use as: math.sqrt(9)      use as: sqrt(9)                use as: m.sqrt(9)
  (whole drawer, 1 label)   (two tools copied in)          (whole drawer, renamed)

THE CACHE — a module runs ONCE, then re-imports are cache hits
==============================================================

  import math   (1st time)  ->  run math.py  ->  store in sys.modules["math"]
  import math   (again)     ->  found in sys.modules  ->  NOT re-run, just rebind
```

## bruteForce
The "no modules" approach is one enormous file, or worse, the same helper copy-pasted into ten files. It feels fast at first — everything is right there. But it scales terribly: the file becomes thousands of lines no one can hold in their head, two functions with the same name collide, and a fix to a copy-pasted helper has to be repeated everywhere it was duplicated (and you'll miss one). Nothing is reusable across projects, nothing is independently testable, and merge conflicts explode because everyone edits the same file. The structure that postpones thinking is the structure that eventually stops you cold.

## optimal
Split related code into modules and import precisely what each file needs. The three import forms each have a clear job. **`import module`** is the safe default: it adds one name and keeps every borrowed tool behind a `module.` prefix, so collisions are impossible and the reader always sees where a name came from. **`from module import name`** is for the handful of names you use constantly (`from collections import Counter`); it trades a little namespace safety for cleaner call sites. **`import module as alias`** renames on the way in — essential for community conventions (`numpy as np`) and for avoiding clashes between two long names.

**Packages** scale this further: a folder with an `__init__.py` becomes an importable package, so `from mypkg.utils import helper` reaches a module nested inside it. The `__init__.py` runs when the package is first imported and can re-export the package's public surface.

**The `if __name__ == "__main__":` guard** is the idiom that lets one file be *both* a runnable script and an importable module. When you run a file directly, Python sets its `__name__` to the string `"__main__"`; when the file is imported instead, `__name__` is the module's own name. Putting your script's "do the work" code under that guard means the work runs when you execute the file, but stays dormant (only the function/class *definitions* load) when another file imports it.

Finally, **the search path.** When you `import x`, Python walks `sys.path` — the current directory first, then installed packages and the standard library — and loads the first `x` it finds, caching it in `sys.modules`. Two consequences follow directly: a local file named `json.py` will be found *before* the real standard-library `json` and shadow it, and once a module is cached, editing its source won't take effect until you restart (or explicitly `importlib.reload`).

## complexity
time: An import's first run is O(size of the module) — Python executes the whole file once. Every subsequent import of the same module is O(1): a dictionary lookup in `sys.modules` that returns the cached object without re-running anything. Attribute access like `math.sqrt` is a fast dict lookup on the module object.
space: A module is loaded into memory once and shared by every importer — O(1) extra per additional import, not a fresh copy. The standard library only consumes memory for the modules you actually import.
notes: The "runs once" guarantee is what makes module-level setup (building a lookup table, opening a config) cheap to depend on from many files, and it's exactly why circular imports are dangerous — a half-finished module can be handed out of the cache mid-load.

## pitfalls
- **`from module import *` pollutes your namespace.** It dumps every public name from the module into yours, silently overwriting anything with the same name and making it impossible to tell where a name came from. Import the specific names you need, or import the module and use the prefix. Reserve `*` for the REPL.
- **Shadowing a standard-library module.** Name your own file `random.py`, `json.py`, `email.py`, or `string.py` and `import random` will find *your* file first (current directory is early on `sys.path`) — breaking the real module with a baffling `AttributeError`. Never name a file after a stdlib module.
- **Circular imports.** If `a.py` imports `b` and `b.py` imports `a` at the top level, one of them runs while the other is only half-built, so a name may not exist yet — `ImportError` or `AttributeError`. Fix by moving the import inside the function that needs it, merging the modules, or extracting the shared piece into a third module.
- **Expecting a re-import to re-run the file.** Because of the `sys.modules` cache, importing a module a second time does *not* execute it again — you get the cached object. Edits to a module's source won't appear in a running session until you restart the interpreter or call `importlib.reload(module)`.
- **Forgetting the `__name__` guard.** Top-level code with no `if __name__ == "__main__":` guard runs *on import*, so importing a script to reuse one function accidentally fires its whole "run" routine. Put executable code under the guard; keep definitions at module level.

## interviewTips
- Explain the difference crisply: "`import math` binds one name and you use `math.sqrt`; `from math import sqrt` copies `sqrt` directly into my namespace, at the risk of shadowing." Interviewers want to hear that you understand *names*, not just syntax.
- Be ready to explain `if __name__ == "__main__":` — that `__name__` is `"__main__"` when the file is run directly and the module's own name when it's imported, so the guard separates "run as a script" from "imported as a library."
- Know the cache story: a module's top-level code runs exactly once because the result is stored in `sys.modules`; later imports are cache hits. This is the standard answer for "why didn't my edited module change?" and the root cause of circular-import bugs.

## keyTakeaways
- A module is a `.py` file of names; `import x` binds the module (use `x.name`), `from x import name` copies a name in directly, `import x as y` renames it — pick based on how many names you need and whether collisions are a risk.
- Python finds a module by walking `sys.path` (current directory first — so don't shadow stdlib names) and runs it exactly once, caching the result in `sys.modules`; every later import is a cache hit, not a re-run.
- `if __name__ == "__main__":` lets one file be both a script and an importable module — executable code under the guard runs only when the file is executed directly, not when it's imported.

## code.python
```python
# IMPORT a whole module: the name `math` is bound; reach inside it with math.<name>.
import math
print("pi:", round(math.pi, 4))             # pi: 3.1416
print("sqrt(144):", math.sqrt(144))         # sqrt(144): 12.0

# FROM ... IMPORT copies specific names straight into THIS namespace (no prefix).
from collections import Counter
counts = Counter("mississippi")
print("s and i:", counts["s"], counts["i"]) # s and i: 4 4
print("top:", counts.most_common(1))        # top: [('i', 4)]

# IMPORT ... AS renames on the way in (handy for long or clashing names).
import math as m
print("floor(3.7):", m.floor(3.7))          # floor(3.7): 3

# THE sys.modules CACHE: a module runs ONCE, later imports are cache hits.
import sys
print("math cached?", "math" in sys.modules)        # math cached? True
import math                                  # already imported -> NOT re-run, only rebound
print("same object?", math is sys.modules["math"])  # same object? True

# __name__ is "__main__" when this file is run directly (its module name on import).
print("name:", __name__)                     # name: __main__
if __name__ == "__main__":
    print("running as a script")             # running as a script
```

## code.javascript
```javascript
// require pulls a module object; reach inside with module.<name> (~ Python's "import x").
const path = require("path");
console.log("ext:", path.extname("notes.txt"));        // ext: .txt

// Destructuring from a module ~ Python's "from x import y".
const { randomUUID } = require("crypto");
console.log("uuid length:", randomUUID().length);      // uuid length: 36

// Bind to a new name ~ "import x as y".
const os = require("os");
const platform = os.platform;
console.log("platform type:", typeof platform());      // platform type: string

// Modules are CACHED: require runs the file once, later requires hit the cache.
const path2 = require("path");
console.log("same module?", path === path2);           // same module? true

// require.main === module is Node's "__name__ == '__main__'" guard.
console.log("run directly?", require.main === module); // run directly? true
```

## code.java
```java
import java.util.*;                       // import a package's classes (~ Python import)
import static java.lang.Math.sqrt;        // static import ~ "from math import sqrt"

public class Modules {
    public static void main(String[] args) {
        // Qualified use after a normal import (~ math.pi).
        System.out.println("PI: " + Math.round(Math.PI * 10000) / 10000.0); // PI: 3.1416
        // The static import lets you call sqrt with no prefix (~ from math import sqrt).
        System.out.println("sqrt(144): " + sqrt(144));                      // sqrt(144): 12.0

        // Classes from java.util, pulled in by the wildcard import above.
        Map<Character, Integer> counts = new HashMap<>();
        for (char c : "mississippi".toCharArray()) counts.merge(c, 1, Integer::sum);
        System.out.println("s=" + counts.get('s') + " i=" + counts.get('i')); // s=4 i=4
    }
}
```

## code.cpp
```cpp
#include <iostream>   // #include pastes a header's declarations (~ Python import)
#include <cmath>      // the math library: sqrt, floor, and friends
#include <string>
#include <map>
using namespace std;  // pulls std names into scope (~ "from std import *" — use sparingly)

int main() {
    cout << "sqrt(144): " << sqrt(144.0) << "\n";   // sqrt(144): 12
    cout << "floor(3.7): " << floor(3.7) << "\n";   // floor(3.7): 3

    map<char, int> counts;                          // from <map>
    for (char c : string("mississippi")) counts[c]++;
    cout << "s=" << counts['s'] << " i=" << counts['i'] << "\n"; // s=4 i=4
    return 0;
}
```
