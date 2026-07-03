---
slug: web-html-dom-tree
module: web-fundamentals
title: HTML & the DOM Tree
subtitle: How the browser turns a stream of HTML text into a living tree of nodes that scripts read, walk, and rewrite.
difficulty: Beginner
position: 1
estimatedReadMinutes: 13
prereqs: []
relatedProblems: []
references:
  - title: "MDN — Introduction to the DOM"
    url: "https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Introduction"
    type: article
  - title: "MDN — HTML elements reference"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element"
    type: article
  - title: "WHATWG HTML — Parsing HTML documents (tokenization + tree construction)"
    url: "https://html.spec.whatwg.org/multipage/parsing.html"
    type: spec
  - title: "MDN — Node.nodeType"
    url: "https://developer.mozilla.org/en-US/docs/Web/API/Node/nodeType"
    type: article
  - title: "web.dev — How the browser renders CSS (critical rendering path context)"
    url: "https://web.dev/articles/critical-rendering-path/constructing-the-object-model"
    type: article
status: published
---

## intro
An HTML file is just text: a flat stream of angle brackets, tag names, and words. A browser cannot render text directly — it needs a structured, navigable model of what that text *means*. That model is the **Document Object Model**, or DOM: a tree of objects where every tag becomes an **element node**, every run of text becomes a **text node**, and the whole page hangs off a single root. This lesson traces how the browser parses raw HTML characters into that tree, what kinds of nodes live in it, how they relate as parents, children, and siblings, and how JavaScript reaches in to read and rewrite the page.

## whyItMatters
Everything you do on the web front end runs through the DOM. When JavaScript changes a button's label, hides a menu, or inserts a row into a table, it is mutating DOM nodes — not the original HTML text, which is long gone by then. CSS selectors match against the DOM tree; layout and paint are computed from it; accessibility tools read it. Understanding the DOM as a *tree* rather than a *string* is the difference between fighting the platform and working with it. It explains why `innerHTML +=` re-parses everything, why a misplaced closing tag silently reshapes your structure, why event bubbling walks upward through ancestors, and why frameworks like React keep a virtual copy of it. Nearly every front-end bug and every front-end interview question eventually reduces to "what does the tree actually look like right now?"

## intuition
Picture a family tree, or the folder structure on your computer. There is one thing at the very top — the root — and everything else nests underneath it in a strict hierarchy. A folder can contain files and other folders; each of those folders can contain more; but every item has exactly one parent, and there are no loops. The DOM is exactly this shape. At the top sits the `document`. Under it sits the `<html>` element. Under `<html>` sit `<head>` and `<body>`, side by side as siblings. Under `<body>` sit your headings, paragraphs, lists, and divs, each of which may nest its own children, all the way down.

Now here is the part that trips people up: the *text* inside an element is not part of the element — it is a separate child node of type **text**. So `<p>Hello</p>` is not one node; it is a `<p>` element node with a single text-node child whose content is `"Hello"`. If you write `<p>Hello <b>world</b></p>`, the `<p>` has *three* children in order: the text node `"Hello "`, the `<b>` element node, and — inside that `<b>` — its own text node `"world"`. Whitespace and line breaks between tags also become text nodes, which is why the DOM often has more nodes than the visible tags suggest.

The relationships are all relative to a node. Walk up and you reach a **parent**, then that node's parent, and so on to the root — those are **ancestors**. Walk down and you reach **children**, then their children — **descendants**. Nodes sharing the same parent, laid out left to right in document order, are **siblings**. Once you hold this tree in your head, DOM code stops being a list of magic method names and becomes plain navigation: go up to the parent, over to the next sibling, down to the first child. Attributes hang off elements as key-value pairs describing that node, not as children in the tree.

## visualization
```
document
└── <html lang="en">
    ├── <head>
    │   └── <title>
    │       └── #text  "Recipes"
    └── <body>
        ├── <h1 id="main">
        │   └── #text  "Fresh Bread"
        └── <ul class="steps">
            ├── <li>
            │   └── #text  "Mix flour and water"
            ├── <li>
            │   └── #text  "Knead the dough"
            └── <li>
                └── #text  "Bake at 220C"

element node = a tag   |   #text = a text node   |   id/class/lang = attributes on the element
```

## bruteForce
The naive mental model treats an HTML page as a **string** you scrape with pattern matching: to find a heading you search for the characters `<h1`, to change text you do a find-and-replace on the raw markup. This is how people reason before they learn the DOM, and it is how brittle scrapers are written. It breaks the moment structure matters. Regular expressions cannot reliably match nested tags, attribute order varies, self-closing rules differ, and malformed markup that the browser silently repairs will defeat any naive scan. Worse, a string has no notion of parent, child, or sibling — the exact relationships you need to style, position, or update content. Treating the page as flat text throws away the hierarchy that is the whole point.

## optimal
The real model is the **DOM tree**, and the browser builds it in a defined pipeline. First the **tokenizer** (lexer) reads the incoming byte stream character by character and emits a sequence of **tokens**: start tags, end tags, text, comments, and the doctype. It knows the HTML grammar — that `<li>` opens an element, that `</li>` closes one, that the characters between are text. Then **tree construction** consumes those tokens and assembles nodes, maintaining a stack of open elements so it knows the current parent. A start-tag token creates an element node and pushes it as the new current parent; text tokens become text-node children of whatever is on top of the stack; an end tag pops back up. Crucially the parser is **fault-tolerant** — per the HTML spec it inserts implied tags, closes elements you forgot to close, and never throws, so almost any input yields *some* tree.

The tree is made of **nodes**, and the type matters. **Element nodes** (`nodeType` 1) are your tags — they can have children and carry **attributes** (`id`, `class`, `href`), which are not child nodes but properties describing the element. **Text nodes** (`nodeType` 3) hold character data and are always leaves. **Comment nodes** (`nodeType` 8) hold `<!-- ... -->`. The single **document node** (`nodeType` 9) is the root you reach as `document`. Every node exposes navigation links: `parentNode`, `childNodes`, `firstChild`, `lastChild`, `previousSibling`, `nextSibling`. Element-only variants (`children`, `firstElementChild`, `nextElementSibling`) skip the text nodes when you only care about tags.

The decisive property is that the DOM is **live**. It is not a one-time snapshot of the source — it is a mutable object graph. JavaScript reads it with `getElementById`, `querySelector`, and `querySelectorAll`; it builds new nodes with `createElement` and `createTextNode`; it splices them in with `appendChild`, `insertBefore`, `append`, and `remove`. Every such call changes the same tree the renderer paints from, which is why a script can reshape a page that shipped as static HTML, and why the source you `view-source` on can look nothing like what the inspector shows.

## complexity
time: Parsing HTML into the DOM is O(n) in the length of the source — the tokenizer makes a single pass and each token does O(1) tree work. Lookups by id are effectively O(1) (hash-backed); `querySelectorAll` is roughly O(n) over candidate nodes; a manual traversal visits each of n nodes once.
space: The tree itself is O(n) in the number of nodes — every element, text run, and comment is a heap object with parent/child/sibling pointers, so total memory scales with the source plus per-node object overhead.
notes: Practical cost is dominated not by parsing but by **reflow/repaint**: mutating layout-affecting nodes in a loop can force repeated recalculation. Batch DOM writes (or use a `DocumentFragment`) so the browser lays out once instead of once per insertion.

## pitfalls
- **Assuming text lives *in* an element rather than *under* it.** `element.firstChild` is often a text node, not the child element you wanted. Fix: use `firstElementChild` / `children` when you mean elements, and read `textContent` when you mean the text.
- **Forgetting whitespace becomes text nodes.** Line breaks and indentation between tags create `#text` nodes, so `childNodes.length` is usually larger than the number of visible tags. Fix: iterate `children` (elements only) or filter by `nodeType === 1`.
- **Confusing attributes with properties.** The HTML attribute `class` is reflected as the DOM property `className`, and `checked`/`value` can drift from their initial attribute after user interaction. Fix: use `getAttribute`/`setAttribute` for the markup value and the property (`el.value`) for the live state.
- **Rebuilding the tree with `innerHTML +=`.** Appending to `innerHTML` re-serializes and re-parses the entire subtree, destroying existing nodes (and their event listeners and focus). Fix: create nodes with `createElement`/`append` and insert only what changed.
- **Reading the DOM before it exists.** A script in `<head>` that queries `<body>` elements runs before they are parsed and gets `null`. Fix: defer the script, place it at the end of `<body>`, or wait for `DOMContentLoaded`.

## interviewTips
- Be able to draw the tree for a small HTML snippet, including the text nodes and the whitespace text nodes — interviewers use this to check you see structure, not string.
- Explain the parse pipeline in two words each: tokenizer produces tokens, tree construction assembles nodes on a stack of open elements, and the parser is fault-tolerant so bad markup still yields a tree.
- Contrast `childNodes` vs `children` and `nodeType` 1 vs 3 on the spot; knowing that text nodes are separate leaf nodes is the single most common thing juniors get wrong.

## keyTakeaways
- The DOM is a **tree of nodes**, not the HTML string — one document root, element nodes for tags, and separate text nodes for the characters inside them.
- The browser builds it in a pipeline: a **tokenizer** turns characters into tokens, **tree construction** assembles nodes on a stack of open elements, and the process is fault-tolerant so almost any input parses.
- The tree is **live and navigable**: JavaScript walks it with parent/child/sibling links and mutates it with `createElement`/`appendChild`, and every change updates the same tree the browser renders.

## code.html
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Recipes</title>
  </head>
  <body>
    <h1 id="main">Fresh Bread</h1>
    <ul class="steps">
      <li>Mix flour and water</li>
      <li>Knead the dough</li>
      <li>Bake at 220C</li>
    </ul>
  </body>
</html>
```

## code.css
```css
/* Selectors match against the DOM tree built from the HTML above. */
#main {
  font-size: 1.6rem;      /* id selector -> the <h1 id="main"> node */
}

.steps > li {
  list-style: decimal;    /* direct children <li> of .steps */
  padding-block: 0.25rem;
}

.steps li:first-child {
  font-weight: 700;       /* first sibling <li> under .steps */
}

.steps li + li {
  border-top: 1px solid #ccc; /* each <li> that follows a sibling <li> */
}
```

## code.javascript
```javascript
// Walk and rewrite the DOM tree built from the HTML document above.

// 1. Read a node by id (hash-backed lookup, effectively O(1)).
const heading = document.getElementById("main");
console.log(heading.tagName);            // "H1"
console.log(heading.textContent);        // "Fresh Bread"

// 2. childNodes includes text nodes; children is elements only.
const list = document.querySelector(".steps");
console.log(list.childNodes.length);     // larger: whitespace #text nodes count
console.log(list.children.length);       // 3: the three <li> element nodes

// 3. Navigate parent / child / sibling relationships.
const first = list.firstElementChild;    // <li>Mix flour and water</li>
console.log(first.parentNode === list);          // true
console.log(first.nextElementSibling.textContent); // "Knead the dough"

// 4. Inspect node types (1 = element, 3 = text).
list.childNodes.forEach((n) => {
  const kind = n.nodeType === 1 ? "element" : n.nodeType === 3 ? "text" : "other";
  console.log(kind, JSON.stringify(n.textContent.trim()));
});

// 5. Build a new node and splice it into the tree.
const step = document.createElement("li");
step.append(document.createTextNode("Cool on a rack"));
list.appendChild(step);
console.log(list.children.length);       // 4: the tree now holds the new node
```
