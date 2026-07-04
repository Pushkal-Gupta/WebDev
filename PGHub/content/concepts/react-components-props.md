---
slug: react-components-props
module: react-frontend
title: Components, JSX & Props
subtitle: How React builds a UI from small reusable functions that return JSX, and how props pass read-only data one way down the tree from parent to child.
difficulty: Beginner
position: 1
estimatedReadMinutes: 12
prereqs: []
relatedProblems: []
references:
  - title: "React — Your First Component"
    url: "https://react.dev/learn/your-first-component"
    type: article
  - title: "React — Writing Markup with JSX"
    url: "https://react.dev/learn/writing-markup-with-jsx"
    type: article
  - title: "React — Passing Props to a Component"
    url: "https://react.dev/learn/passing-props-to-a-component"
    type: article
  - title: "React — Rendering Lists"
    url: "https://react.dev/learn/rendering-lists"
    type: article
  - title: "MDN — Web Components"
    url: "https://developer.mozilla.org/en-US/docs/Web/API/Web_components"
    type: article
status: published
---

## intro
A React interface is not one giant block of markup. It is a tree of small, self-contained pieces called **components**, each one a JavaScript function that returns a description of some UI. That description is written in **JSX** — markup-looking syntax that compiles down to plain function calls. Components accept inputs called **props**: read-only values handed down from a parent that let the same component render different content in different places. Learn these three ideas — component, JSX, props — and you have the entire skeleton of every React app.

## whyItMatters
Every non-trivial screen you will ever build is assembled from reusable parts: a button that appears forty times, a card that renders once per search result, a header shared across pages. Components are how React lets you define each part once and reuse it everywhere, and props are how you feed each copy the data it needs so it stays generic instead of hardcoded. Getting the mental model right — components as functions, props as arguments, data flowing one direction — is what makes a codebase predictable: you can look at any component in isolation and know exactly what it renders from the inputs it was given. Miss this model and you fight the framework on every feature; internalise it and everything from state to hooks to context clicks into place.

## intuition
Think of a component as a **rubber stamp**. You carve the stamp once — the shape of a product card, say: an image slot on top, a title, a price, a buy button. From then on you can press that stamp anywhere on the page and it prints the same structure every time. But a stamp that could only ever print the exact same words would be useless. So the stamp has **blanks** in it: the image, the title, the price are left empty, and you fill them in each time you press it. Those blanks are **props**. Press the stamp with `title="Headphones"` and `price=79` and it prints one card; press it again with `title="Keyboard"` and `price=45` and the same stamp prints a different card. One definition, endless variations, all driven by the values you pass in.

This is exactly how a plain function works, and that is not a coincidence — a component **is** a function. It takes one argument (an object of props) and returns a chunk of UI. `Card({ title: "Headphones", price: 79 })` is a function call; the JSX you write, `<Card title="Headphones" price={79} />`, is just a friendlier spelling of that same call. Arguments go in, markup comes out, and nothing about the returned markup can reach back and change the arguments.

The second half of the intuition is **direction**. Props only ever travel **one way: downward**, from a parent component to its children, like water flowing down a series of terraces. The top of the tree — often an `App` component — holds the source data and hands slices of it to the components directly beneath it. Those pass their own slices further down. A child never reaches up to grab from or rewrite its parent's data; it only receives what it is given and renders it. Because the flow is strictly one-directional, you can always answer "where did this value come from?" by walking straight up the tree, and "what will change if I edit this data?" by walking straight down. That single, traceable direction is what makes large React trees stay comprehensible instead of turning into a web of mutual dependencies.

## visualization
```
                     App               (owns the data)
       props flow     |
       downward -->    +-----------+-----------+
       parent to       |           |           |
       child          Header     Content     Footer
                       |           |            |
                  title="Shop"     |         year=2026
                                   |
                              +----+----+
                              |         |
                            Card      Card
                       title,price  title,price
                       (one stamp, different props each press)
```

## bruteForce
The naive way to build a UI is to write the markup out by hand every place it appears. Need a product card in ten spots? Copy the same twenty lines of HTML ten times and edit the text in each. It works for exactly one afternoon. The moment the design changes — the price needs a currency symbol, the button gets an icon — you are hunting down all ten copies and editing each identically, and you will miss one. There is no single source of truth for what a card *is*; the structure is duplicated, drift is inevitable, and the file balloons. Copy-paste markup does not scale past a trivial page.

## optimal
The React answer is to define the repeated structure **once** as a component and press that stamp wherever you need it, feeding differences in through props.

A **component** is a JavaScript function whose name is capitalised (React uses the capital letter to tell your components apart from built-in HTML tags) and which returns **JSX**. JSX looks like markup but is really syntactic sugar for function calls: `<Card title="Headphones" />` compiles to something like `React.createElement(Card, { title: "Headphones" })`. Because a component is just a function, everything you know about functions applies — it can hold local variables, call helpers, loop, and branch, as long as it ultimately returns a single JSX tree.

**Props** are the function's inputs: React collects every attribute you write on the tag into one object and passes it as the first argument. Inside the component you read them (`props.title`, or via destructuring `{ title, price }`) but you must treat them as **read-only**. A component may never reassign or mutate the props it receives — they belong to the parent that sent them. This immutability is not a nag; it is the guarantee that makes React predictable. If children could rewrite the data handed down to them, a value could change from two directions at once and you could no longer reason about the tree by reading it top-to-bottom. Keeping props read-only preserves strict **one-way data flow**: data originates above, flows down, and the only way to affect a parent is for the parent to pass down a callback that the child *calls* — the parent still owns the change.

**Composition** is how components combine. A parent nests children inside its JSX, and can hand a component arbitrary JSX through the special `children` prop — a `Card` can wrap whatever you place between its tags. You build big UIs not by writing big components but by composing small ones: `App` renders `Header`, `Content`, and `Footer`; `Content` renders a list of `Card`s; each `Card` renders an image and a button. Every piece stays small, testable, and reusable, and the whole tree is just functions calling functions with data flowing steadily downward.

## complexity
time: Rendering the tree is O(n) in the number of components — each component function runs once per render to produce its JSX, and React walks the resulting tree to update the DOM. Reuse does not add render cost per definition; ten `Card`s cost ten renders whether or not they share one definition, but sharing costs you O(1) code to maintain instead of O(copies).
space: O(n) for the tree of elements React holds in memory, one node per rendered component plus its props object. Props are shared references passed down, not deep-copied, so passing data to a child is cheap.
notes: The real win is maintenance cost, not runtime cost. Componentising turns "edit every copy" (O(copies) human work, error-prone) into "edit one definition" (O(1)). Deeply nested trees cost render passes; keep the tree shallow and reuse definitions to keep both machine and human cost down.

## pitfalls
- **Mutating props** — writing `props.title = "new"` or pushing into a prop array inside a child. Props belong to the parent and must stay read-only; mutating them breaks one-way flow and causes stale, unpredictable renders. Fix: never assign to props; if the value must change, lift it into the parent's state and pass the new value (or a setter callback) down.
- **Missing `key` when rendering a list** — mapping an array to components without a stable `key` prop makes React lose track of which item is which, causing wrong re-orders, lost input, and console warnings. Fix: give each list item a `key` that is a stable unique id (`key={item.id}`), never the array index if the list can reorder.
- **Trying to send data upward** — a child needing to update something a parent owns, and reaching "up" for it. Data never flows up. Fix: have the parent pass a callback prop (`onSelect`, `onChange`); the child calls it, and the parent performs the change so ownership stays at the top.
- **Lowercase component names** — writing `<card />` instead of `<Card />`. React treats lowercase tags as literal HTML elements, so your component silently never renders. Fix: always capitalise component names; reserve lowercase for built-in DOM tags.
- **Over-nesting into deep prop-drilling** — passing a prop through five intermediate components that do not use it just to reach a deep child. It bloats every signature and couples unrelated layers. Fix: keep the tree shallow, colocate state closer to where it is used, or reach for context when a value is truly global.

## interviewTips
- Be ready to state the one-line definition crisply: a component is a function that returns JSX, and props are the read-only arguments a parent passes to it. Interviewers use this to check you have the core model, not just syntax recall.
- Explain **why** props are immutable and data flows one way — predictability. If asked "how does a child update its parent?", answer with the callback-prop pattern: the parent owns the state and passes down a function the child invokes, keeping the single source of truth at the top.
- Know the `key` rule cold and why index-as-key is a bug when a list reorders or items are inserted, since it is one of the most common React interview and code-review catches.

## keyTakeaways
- A component is just a JavaScript function that returns JSX; JSX is sugar for `createElement` calls, so `<Card title="x" />` is a function call with a props object.
- Props are read-only inputs passed from parent to child; a component may render them but never mutate them, which is what preserves predictable one-way data flow.
- You build large UIs by composition — nesting and reusing small components and passing data strictly downward — and let parents own state, handing children callbacks to request changes.

## code.jsx
```jsx
// A reusable component defined once, pressed many times with different props.
// Data lives at the top (App) and flows one way down through props.

function Card({ title, price, children }) {
  // props are read-only inputs. We render them, never reassign them.
  return (
    <article className="card">
      <h3>{title}</h3>
      <p className="price">${price}</p>
      {children /* composition: whatever the parent nested inside <Card>...</Card> */}
    </article>
  );
}

function Content({ products, onBuy }) {
  return (
    <section>
      {products.map((p) => (
        // `key` gives React a stable identity for each list item.
        <Card key={p.id} title={p.title} price={p.price}>
          {/* the child calls the callback; the parent owns the actual change */}
          <button onClick={() => onBuy(p.id)}>Buy</button>
        </Card>
      ))}
    </section>
  );
}

function App() {
  const products = [
    { id: 'hp', title: 'Headphones', price: 79 },
    { id: 'kb', title: 'Keyboard', price: 45 },
  ];

  // App owns the data and the behaviour; children only receive and render.
  const handleBuy = (id) => console.log('buy', id);

  return (
    <main>
      <Content products={products} onBuy={handleBuy} />
    </main>
  );
}

export default App;
```

## code.javascript
```javascript
// A plain-JS model of the same idea: a component is a function that takes
// props and returns a UI description. Here the "UI" is a string tree so the
// one-way flow of props from parent to child is visible in the console.

// Leaf component: receives read-only props, returns markup text.
function Card(props) {
  const { title, price } = props; // read props; never reassign them
  return `[Card title="${title}" price=$${price}]`;
}

// Parent component: owns the data, hands slices down to each child.
function Content(props) {
  const rows = props.products.map(function (p) {
    return '  ' + Card({ title: p.title, price: p.price }); // props flow DOWN
  });
  return 'Content\n' + rows.join('\n');
}

// Root component: the single source of truth for the data.
function App() {
  const products = [
    { id: 'hp', title: 'Headphones', price: 79 },
    { id: 'kb', title: 'Keyboard', price: 45 },
  ];
  return 'App\n' + Content({ products: products });
}

// Proof props are read-only: a child cannot change what the parent owns.
function tryMutate(props) {
  const before = props.title;
  const copy = Object.freeze(props);   // React treats props as frozen inputs
  try {
    copy.title = 'HACKED';             // ignored (or throws in strict mode)
  } catch (e) {
    // swallow: the point is the value did not change
  }
  return before + ' -> ' + copy.title; // unchanged: one-way flow preserved
}

console.log(App());
// App
// Content
//   [Card title="Headphones" price=$79]
//   [Card title="Keyboard" price=$45]

console.log(tryMutate({ title: 'Headphones' }));
// Headphones -> Headphones
```
