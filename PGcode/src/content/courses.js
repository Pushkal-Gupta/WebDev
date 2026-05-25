// Course registry. Each course has lessons; each lesson can have a runnable
// code sample + an optional exercise with an expected stdout for auto-grading.
//
// Course shape:
//   { id, title, language, color, blurb, icon, lessons: [{ id, title, intro,
//     code, runnable, exercise: { prompt, starter, expected } }] }
//
// `language` is one of: 'python' | 'javascript' | 'java' | 'cpp' | 'sql'.
// For SQL the course renders inside SqlPlayground course-mode (separate flow);
// for other languages we render in CoursePage and call Judge0 via codeRunner.

// ── React Basics ─────────────────────────────────────────────────
// Outline mirrors industry conventions and the Edufect Edufact "JS + React"
// curriculum (modules 06-08): components/JSX, props, state, events, forms.
// Lessons render in CoursePage with language='javascript' for syntax
// highlighting and code execution where applicable.
const REACT_LESSONS = [
  {
    id: 'r1', title: '1. Components & JSX',
    intro: 'A React component is a function returning JSX — XML-like syntax that compiles to `React.createElement` calls. Each component is a self-contained UI building block. The root render mounts the tree.',
    code: '// In a real app this lives in App.jsx and uses ReactDOM.render.\nfunction Greeting({ name }) {\n  return `Hello, ${name}!`;\n}\nconsole.log(Greeting({ name: "PGcode" }));',
    exercise: {
      prompt: 'Write a `Hello(props)` function returning the string `Hi, <props.name>!`. Log Hello({ name: "Asha" }). Expected: Hi, Asha!',
      starter: '// function Hello(props) { ... }\n// console.log(Hello({ name: "Asha" }));\n',
      expected: 'Hi, Asha!',
    },
    takeaways: [
      'A component is a function returning JSX (or null).',
      'JSX compiles to React.createElement calls.',
      'Components compose like functions — pass them in props, return them from helpers.',
      'Capitalize component names; lowercase names are treated as DOM tags.',
    ],
    mistakes: [
      'Returning multiple top-level elements without a Fragment <>...</>.',
      'Forgetting that `class` becomes `className` in JSX.',
      'Treating components like templates — they are functions, called per render.',
    ],
    next: { label: 'Props vs state', href: '#/courses/react-basics/r2' },
  },
  {
    id: 'r2', title: '2. Props vs state',
    intro: 'Props are inputs — set by the parent, read-only inside the component. State is internal mutable data managed with `useState`. Re-renders are triggered by state changes (or new props).',
    code: '// Conceptual — useState lives inside a component.\n// const [count, setCount] = React.useState(0);\n// <button onClick={() => setCount(count + 1)}>{count}</button>\nfunction sumProps({ a, b }) { return a + b; }\nconsole.log(sumProps({ a: 3, b: 4 }));',
    exercise: {
      prompt: 'Write `multiplyProps({ a, b })` returning a * b. Log it for {a:6, b:7}. Expected: 42.',
      starter: '// function multiplyProps({ a, b }) { ... }\n// console.log(multiplyProps({ a: 6, b: 7 }));\n',
      expected: '42',
    },
    takeaways: [
      'Props flow downward — set by parent, read-only inside the child.',
      'State (useState) is mutable, local, triggers re-render on change.',
      'Lift state up to the closest common ancestor when siblings need it.',
      'Treat state immutably — return new objects from setters.',
    ],
    mistakes: [
      'Mutating state directly: arr.push(x) does not re-render. Use [...arr, x].',
      'Setting state inside render — infinite loop.',
      'Trying to mutate props — they are read-only by contract.',
    ],
    next: { label: 'Event handlers', href: '#/courses/react-basics/r3' },
  },
  {
    id: 'r3', title: '3. Event handlers',
    intro: 'In JSX, attach handlers via camelCase props: `onClick`, `onChange`, `onSubmit`. The handler receives a React SyntheticEvent. Inline arrow functions are common but watch perf if a child re-renders on every render.',
    code: '// Pseudocode for an onClick handler:\nfunction handleClick(e) {\n  console.log("clicked at", e.target?.tagName || "(no element)");\n}\nhandleClick({ target: { tagName: "BUTTON" } });',
    exercise: {
      prompt: 'Define `summarize(e)` that returns "type=" + e.type. Log summarize({type:"click"}). Expected: type=click.',
      starter: '// function summarize(e) { ... }\n// console.log(summarize({ type: "click" }));\n',
      expected: 'type=click',
    },
    takeaways: [
      'Attach handlers via camelCase props: onClick, onChange, onSubmit.',
      'The event is a React SyntheticEvent wrapping the native event.',
      'e.preventDefault() stops form submission / link navigation.',
      'Use useCallback when a child memoizes against the handler reference.',
    ],
    mistakes: [
      'Calling the handler immediately: onClick={handle()} — fires on render.',
      'Mutating state inside the handler — return new objects to setState.',
      'Inline arrow over big trees of memoized children — busts React.memo.',
    ],
    next: { label: 'Controlled inputs & forms', href: '#/courses/react-basics/r4' },
  },
  {
    id: 'r4', title: '4. Controlled inputs & forms',
    intro: 'A controlled input has its `value` bound to state and an `onChange` to update state. Validation runs on each change or on submit. Show error messages near the input field. `e.preventDefault()` in the form\'s onSubmit stops the page reload.',
    code: 'function validateEmail(s) {\n  return /^[^@]+@[^@]+\\.[^@]+$/.test(s);\n}\nconsole.log(validateEmail("a@b.co"), validateEmail("nope"));',
    exercise: {
      prompt: 'Write `isLongEnough(s, n)` returning true iff s.length >= n. Log isLongEnough("hello", 5). Expected: true.',
      starter: '// function isLongEnough(s, n) { ... }\n',
      expected: 'true',
    },
    takeaways: [
      'Controlled inputs bind value to state and update on onChange.',
      'Uncontrolled inputs use refs and DOM defaults — simpler for one-shot reads.',
      'e.preventDefault() in form onSubmit prevents the page reload.',
      'Validate on change for live feedback; on submit for final gating.',
    ],
    mistakes: [
      'Forgetting onChange on a controlled input — read-only field that swallows keys.',
      'Using defaultValue + onChange — picks one model, not both.',
      'Mutating the input value through DOM APIs — React overwrites it on re-render.',
    ],
    next: { label: 'Lists & keys', href: '#/courses/react-basics/r5' },
  },
  {
    id: 'r5', title: '5. Lists & keys',
    intro: 'Render arrays with `arr.map(item => <Item key={item.id} {...item} />)`. The `key` prop tells React which element is which between re-renders — crucial for correctness and performance. Never use array index as key if the list reorders.',
    code: 'const items = [\n  { id: 1, name: "alpha" },\n  { id: 2, name: "beta" },\n  { id: 3, name: "gamma" },\n];\nconsole.log(items.map(i => i.name).join(", "));',
    exercise: {
      prompt: 'Given `[{id:1,v:10},{id:2,v:20},{id:3,v:30}]`, log the sum of v. Expected: 60.',
      starter: 'const arr = [{id:1,v:10},{id:2,v:20},{id:3,v:30}];\n// log sum of v\n',
      expected: '60',
    },
    takeaways: [
      'Render arrays with .map and a stable `key` prop.',
      'Keys should be stable IDs, not array indices (when order can change).',
      'Mapping inline keeps the JSX declarative.',
      'Avoid expensive transforms inside map — precompute in a useMemo.',
    ],
    mistakes: [
      'Using array index as key for a reorderable list — produces UI bugs.',
      'Missing key prop — warning, plus suboptimal reconciliation.',
      'Generating new IDs on each render — defeats memoization.',
    ],
    next: { label: 'useEffect', href: '#/courses/react-basics/r6' },
  },
  {
    id: 'r6', title: '6. useEffect',
    intro: '`useEffect(fn, deps)` runs `fn` after render, and again any time a dep changes. Return a cleanup function to unwind subscriptions/timers — it runs before the next effect and on unmount. `deps = []` runs once on mount; `deps = undefined` runs on every render (almost always a bug). Use it for side effects that touch the outside world: fetch data, subscribe to events, set timeouts.',
    code: 'function Clock() {\n  const [t, setT] = React.useState(0);\n  React.useEffect(() => {\n    const id = setInterval(() => setT(x => x + 1), 1000);\n    return () => clearInterval(id);  // cleanup on unmount\n  }, []);\n  return <div>{t}s</div>;\n}\n// Pure logic outside React:\nconsole.log(typeof setInterval === "function");',
    exercise: {
      prompt: 'Without React, log how many ms `setTimeout` schedules for when called with `1000`. Expected: 1000.',
      starter: 'const ms = 1000;\n// log ms\n',
      expected: '1000',
    },
    takeaways: [
      'useEffect(fn, deps) runs fn after commit, again when deps change.',
      'Return a cleanup fn — runs before next effect and on unmount.',
      'deps = [] runs once; omitting deps re-runs every render (almost always a bug).',
      'Effects are for side effects: fetch, subscribe, time, log.',
    ],
    mistakes: [
      'Missing a dep — stale closure reads old state.',
      'Setting state unconditionally in an effect — infinite loop.',
      'Doing pure derivations in an effect — compute during render or in useMemo.',
    ],
    next: { label: 'useMemo & useCallback', href: '#/courses/react-basics/r7' },
  },
  {
    id: 'r7', title: '7. useMemo & useCallback',
    intro: '`useMemo(() => compute(), [deps])` caches an expensive computed value across renders. `useCallback(fn, [deps])` caches a function reference (so it stays stable when passed to `React.memo` children). Don\'t reach for them by default — they cost memory and a deps comparison; profile first. Use when an effect depends on an object/function reference, or when a child is doing expensive work.',
    code: 'function Sum({ nums }) {\n  const total = React.useMemo(() => nums.reduce((a, b) => a + b, 0), [nums]);\n  return <div>{total}</div>;\n}\n// Pure logic:\nconst nums = [1, 2, 3, 4, 5];\nconsole.log(nums.reduce((a, b) => a + b, 0));',
    exercise: {
      prompt: 'Compute and log the sum of squares of `[2, 3, 4]`. Expected: 29.',
      starter: 'const nums = [2, 3, 4];\n// log sum of squares\n',
      expected: '29',
    },
    takeaways: [
      'useMemo caches a computed value across renders when deps are equal.',
      'useCallback caches a function reference — useful for memoized children.',
      'Neither is free; both cost a deps comparison and memory.',
      'Profile first — assume the runtime can usually handle work.',
    ],
    mistakes: [
      'Wrapping everything in useMemo / useCallback — premature optimization.',
      'Forgetting a dep — stale closure or stale value.',
      'Using useMemo for side-effects (it is not guaranteed to run).',
    ],
    next: { label: 'Custom hooks', href: '#/courses/react-basics/r8' },
  },
  {
    id: 'r8', title: '8. Custom hooks',
    intro: 'A custom hook is just a function whose name starts with `use` that calls other hooks. They encapsulate reusable stateful logic without component nesting (Higher-Order Component / render-props problems). Examples: `useLocalStorage`, `useDebouncedValue`, `useFetch`. The "rules of hooks" still apply inside — same order every render, no conditionals around hook calls.',
    code: '// function useCounter(init = 0) {\n//   const [n, setN] = React.useState(init);\n//   const inc = () => setN(x => x + 1);\n//   return { n, inc };\n// }\n// Pure logic of what useCounter does:\nlet n = 5;\nn = n + 1;\nconsole.log(n);',
    exercise: {
      prompt: 'Simulate a counter starting at 10, incremented 3 times. Log the final value. Expected: 13.',
      starter: 'let n = 10;\n// increment n three times\nconsole.log(n);\n',
      expected: '13',
    },
    takeaways: [
      'A custom hook is just a function starting with `use` that calls other hooks.',
      'Encapsulates reusable logic without the wrapper-hell of HOCs.',
      'Same rules-of-hooks apply inside — never conditional, same order each render.',
      'Return a tuple, object, or single value — whatever feels natural to consume.',
    ],
    mistakes: [
      'Naming without the `use` prefix — lint rule cannot enforce hook usage.',
      'Calling hooks conditionally inside the custom hook.',
      'Putting state in a hook used in many components and expecting it to be shared.',
    ],
    next: { label: 'Context', href: '#/courses/react-basics/r9' },
  },
  {
    id: 'r9', title: '9. Context',
    intro: '`React.createContext(default)` creates a context. Wrap a tree in `<Ctx.Provider value={...}>` so any descendant can read it via `useContext(Ctx)` — no prop-drilling. Best for cross-cutting data that rarely changes: theme, locale, current user. For frequently-changing state, prefer state managers (Zustand, Redux, TanStack Query) since every Context value change re-renders every consumer.',
    code: '// const ThemeCtx = React.createContext("light");\n// const useTheme = () => React.useContext(ThemeCtx);\nconst theme = "dark";\nconsole.log("theme is " + theme);',
    exercise: {
      prompt: 'Pretend the context value is "premium". Log `tier: premium`. Expected: `tier: premium`.',
      starter: 'const tier = "premium";\n// log "tier: <tier>"\n',
      expected: 'tier: premium',
    },
    takeaways: [
      'createContext + Provider lets any descendant read shared values without prop-drilling.',
      'useContext(Ctx) reads the nearest Provider; falls back to the default value.',
      'Every context change re-renders every consumer — split contexts by update frequency.',
      'Great for theme, locale, current user, feature flags.',
    ],
    mistakes: [
      'Putting frequently changing state in one big context — re-renders everything.',
      'Using Context as a global mutable store — reach for a state manager instead.',
      'Forgetting a Provider — consumers get the default and silently misbehave.',
    ],
    next: { label: 'Suspense & lazy', href: '#/courses/react-basics/r10' },
  },
  {
    id: 'r10', title: '10. Suspense & lazy',
    intro: '`React.lazy(() => import("./HeavyThing"))` creates a code-split component that loads on demand. Wrap it in `<Suspense fallback={<Skeleton />}>` so React knows what to render while the chunk is fetching. Same mechanism handles async data when you opt into React 19 server data, streaming SSR, and waterfalls. Splits big bundles without rearchitecting.',
    code: '// const HeavyChart = React.lazy(() => import("./HeavyChart"));\n// <Suspense fallback={<div>Loading…</div>}><HeavyChart /></Suspense>\nconst loaded = false;\nconsole.log(loaded ? "ready" : "Loading…");',
    exercise: {
      prompt: 'Log `Loading…` when `loaded = false`, else `ready`. Set `loaded = true`. Expected: `ready`.',
      starter: 'const loaded = true;\n// log appropriate string\n',
      expected: 'ready',
    },
    takeaways: [
      'React.lazy splits a component into its own chunk loaded on demand.',
      'Wrap lazy components in <Suspense fallback={...}> for the loading UI.',
      'Same machinery powers React 19 server data and streaming SSR.',
      'Best for routes, modals, heavy editors — anything not needed on first paint.',
    ],
    mistakes: [
      'Wrapping every component in lazy — too many round-trips, slow UX.',
      'Forgetting the Suspense boundary — React throws.',
      'Lazy-loading code used on initial render — defeats the purpose.',
    ],
    next: { label: 'TypeScript: types & inference', href: '#/courses/typescript-basics/ts1' },
  },
];

// ── TypeScript Basics ────────────────────────────────────────────
const TS_LESSONS = [
  {
    id: 'ts1', title: '1. Types & inference',
    intro: 'TypeScript adds static types to JavaScript. Most of the time the compiler infers types — you only annotate when it can\'t guess (function parameters, hard cases). Core types: `string`, `number`, `boolean`, `string[]`, `{ x: number }`, plus literal types and unions.',
    code: 'let name: string = "PGcode";\nlet score = 42; // inferred as number\nlet flags: boolean[] = [true, false];\nconsole.log(name, score, flags);',
    exercise: {
      prompt: 'Declare `subject` as the string "Math" and `score` as number 95. Log "<subject>: <score>". Expected: Math: 95.',
      starter: '// your code here\n',
      expected: 'Math: 95',
    },
    takeaways: [
      'TypeScript layers static types over JS — inferred most of the time.',
      'Core types: string, number, boolean, plus arrays and object shapes.',
      'Literal types ("on" | "off") plus unions model finite states.',
      'Annotate function params; let inference handle return types.',
    ],
    mistakes: [
      'Over-annotating — clutters code; trust inference.',
      'Using `any` to silence errors — defeats the whole point.',
      'Assuming runtime checks are added — they are not; TS is a compile-time tool.',
    ],
    next: { label: 'Functions with typed params', href: '#/courses/typescript-basics/ts2' },
  },
  {
    id: 'ts2', title: '2. Functions with typed params',
    intro: 'Annotate parameters explicitly. Return types are usually inferred; annotate when you want the compiler to enforce a specific contract. Use `?` for optional params and `=` for defaults.',
    code: 'function greet(name: string, greeting: string = "Hi"): string {\n  return `${greeting}, ${name}!`;\n}\nconsole.log(greet("Asha"));',
    exercise: {
      prompt: 'Write `add(a: number, b: number): number` returning a+b. Log add(2, 3). Expected: 5.',
      starter: '// define add\n// console.log(add(2, 3));\n',
      expected: '5',
    },
    takeaways: [
      'Annotate parameters explicitly; return types are usually inferred.',
      'Optional params: param?: T. Default: param: T = value.',
      'Rest params: ...args: T[] for variadic functions.',
      'Function types: (a: number, b: number) => number.',
    ],
    mistakes: [
      'Forgetting that optional and default are mutually exclusive sugar.',
      'Mixing required params after optional ones — compile error.',
      'Using `any` as parameter type — disables checks for the whole function.',
    ],
    next: { label: 'Interfaces & type aliases', href: '#/courses/typescript-basics/ts3' },
  },
  {
    id: 'ts3', title: '3. Interfaces & type aliases',
    intro: '`interface User { name: string; age: number; }` describes the shape of an object. `type` does the same plus supports unions and intersections. Use interfaces when you want extensibility, types when you need composition.',
    code: 'interface User { name: string; age: number; admin?: boolean }\nconst u: User = { name: "Asha", age: 28 };\nconsole.log(u.name, u.age);',
    exercise: {
      prompt: 'Define an interface `Point { x: number; y: number }`. Create p = {x: 3, y: 4}. Log p.x + p.y. Expected: 7.',
      starter: '// define Point and p\n',
      expected: '7',
    },
    takeaways: [
      'interface describes object shape and is extensible (declaration merging).',
      'type aliases support unions, intersections, and primitives.',
      'Use interface for public API objects, type for unions and utility shapes.',
      'Both compile to the same structural type-check.',
    ],
    mistakes: [
      'Using interface for unions — does not work, use type.',
      'Forgetting extends vs intersection — interface uses extends, type uses &.',
      'Treating TypeScript types like classes — they vanish at runtime.',
    ],
    next: { label: 'Union types & narrowing', href: '#/courses/typescript-basics/ts4' },
  },
  {
    id: 'ts4', title: '4. Union types & narrowing',
    intro: 'A param can be a union like `string | number`. Use `typeof` to narrow before operating: TS understands the narrowed branch.',
    code: 'function len(x: string | number): number {\n  if (typeof x === "string") return x.length;\n  return String(x).length;\n}\nconsole.log(len("hello"), len(12345));',
    exercise: {
      prompt: 'Write `area(s: number | { w: number; h: number })` that returns s*s for a number or w*h for a rectangle. Log area(5) + area({w:3,h:4}). Expected: 37.',
      starter: '// define area\n',
      expected: '37',
    },
    takeaways: [
      'Union types model alternatives; narrow them with typeof / instanceof / in.',
      'After narrowing, TS knows the exact branch and allows safe access.',
      'never is the type of impossible branches — useful for exhaustive checks.',
      'Use discriminated unions when shapes share a common literal field.',
    ],
    mistakes: [
      'Operating on a union before narrowing — type error on shared methods.',
      'Forgetting that `typeof null` is "object" — null needs an explicit check.',
      'Mixing union narrowing with `as` casts that lie about the type.',
    ],
    next: { label: 'Generics', href: '#/courses/typescript-basics/ts5' },
  },
  {
    id: 'ts5', title: '5. Generics',
    intro: 'A generic lets a function or type work over many types while preserving the relationship. `function first<T>(arr: T[]): T | undefined { return arr[0]; }` — the return type matches the input element type.',
    code: 'function first<T>(arr: T[]): T | undefined { return arr[0]; }\nconst n = first([1, 2, 3]);\nconst s = first(["a", "b"]);\nconsole.log(n, s);',
    exercise: {
      prompt: 'Write `last<T>(arr: T[]): T | undefined`. Log last([10, 20, 30]). Expected: 30.',
      starter: 'function last(arr) { return arr[0]; } // fix me\n// console.log(last([10, 20, 30]));\n',
      expected: '30',
    },
    takeaways: [
      'Generics parameterize types — function first<T>(arr: T[]): T.',
      'Constraints: <T extends Comparable<T>> restricts the type set.',
      'TypeScript infers most type arguments from usage.',
      'Generic interfaces / types: interface Box<T> { value: T }.',
    ],
    mistakes: [
      'Using `any` where a generic would do — loses type info downstream.',
      'Over-constraining: <T extends string | number> when you only need one.',
      'Confusing type parameters with values — they exist only at the type level.',
    ],
    next: { label: 'Discriminated unions', href: '#/courses/typescript-basics/ts6' },
  },
  {
    id: 'ts6', title: '6. Discriminated unions',
    intro: 'A discriminated union shares a common literal field that lets TypeScript narrow safely in each branch. Pattern: every variant has `kind: "circle" | "square"` (or similar). TS knows which fields are valid inside each `if`.',
    code: 'type Shape = { kind: "circle"; r: number } | { kind: "square"; side: number };\nfunction area(s: Shape): number {\n  if (s.kind === "circle") return Math.PI * s.r * s.r;\n  return s.side * s.side;\n}\nconsole.log(area({ kind: "square", side: 4 }));',
    exercise: {
      prompt: 'Add a third variant `{ kind: "rect"; w: number; h: number }` and handle it. Log area({kind:"rect",w:3,h:4}). Expected: 12.',
      starter: '// extend Shape and area\n',
      expected: '12',
    },
    takeaways: [
      'A common literal field (`kind`) lets TS narrow each branch safely.',
      'Exhaustive switch on the discriminant + `never` default catches missing cases.',
      'Avoids the type-cast / property-check ladder of plain unions.',
      'Pairs naturally with React reducers and state machines.',
    ],
    mistakes: [
      'Choosing a non-literal discriminator (e.g. string) — TS cannot narrow.',
      'Forgetting the never assertion in the default branch — bugs slip in silently.',
      'Two variants with the same discriminator value — TS cannot tell them apart.',
    ],
    next: { label: 'Type guards', href: '#/courses/typescript-basics/ts7' },
  },
  {
    id: 'ts7', title: '7. Type guards (user-defined)',
    intro: 'A guard like `function isString(x: unknown): x is string { return typeof x === "string"; }` lets TS narrow inside `if (isString(x))`. The `x is string` return type is the magic — it teaches the compiler about your runtime check.',
    code: 'function isUser(x: unknown): x is { name: string } {\n  return typeof x === "object" && x !== null && "name" in x;\n}\nconst u: unknown = { name: "Asha" };\nif (isUser(u)) console.log(u.name.toUpperCase());',
    exercise: {
      prompt: 'Write isNumberArray(x: unknown): x is number[] and use it to safely sum the array. For [1,2,3] log 6.',
      starter: '// guard + sum\n',
      expected: '6',
    },
    takeaways: [
      'A type predicate (x: unknown): x is Foo teaches TS about a runtime check.',
      'After the guard, TS narrows the type inside the if-branch.',
      'Combine with `unknown` for safe input parsing at API boundaries.',
      'Use type predicates instead of `as` casts whenever possible.',
    ],
    mistakes: [
      'Returning a truthy value from a guard without the `is` annotation — TS does not narrow.',
      'Writing guards that lie about the type — runtime crashes later.',
      'Re-implementing typeof / instanceof — TS already narrows on those.',
    ],
    next: { label: 'Conditional types', href: '#/courses/typescript-basics/ts8' },
  },
  {
    id: 'ts8', title: '8. Conditional types',
    intro: '`T extends U ? X : Y` returns one of two types based on whether T is assignable to U. Combine with `infer` to extract pieces — like the return type of a function: `type R<F> = F extends (...a: any[]) => infer R ? R : never;`.',
    code: 'type NonNullableX<T> = T extends null | undefined ? never : T;\ntype A = NonNullableX<string | null>; // string\nconst x: A = "ok";\nconsole.log(x);',
    exercise: {
      prompt: 'Define `ArrayElement<T>` = element type of T when T extends any[], else never. Show typeof ArrayElement<number[]> works by logging "number".',
      starter: '// type ArrayElement<T> = ...\nconsole.log("number");\n',
      expected: 'number',
    },
    takeaways: [
      'T extends U ? X : Y returns one of two types based on assignability.',
      '`infer R` extracts a type position (e.g. function return type).',
      'Distributes over unions: T extends ... gets evaluated per member.',
      'Powers ReturnType, Parameters, Awaited, NonNullable, and more.',
    ],
    mistakes: [
      'Unintentional union distribution — wrap T in [T] to opt out.',
      'Deeply recursive conditional types — TS bails with "type too deep".',
      'Treating conditional types like runtime branches — they vanish at compile time.',
    ],
    next: { label: 'Mapped types', href: '#/courses/typescript-basics/ts9' },
  },
  {
    id: 'ts9', title: '9. Mapped types',
    intro: 'Iterate over keys with `{ [K in keyof T]: ... }` to transform shapes. The standard library uses this: `Partial<T> = { [K in keyof T]?: T[K] }`. `Readonly<T>`, `Pick<T,K>`, `Omit<T,K>` all use the same mechanism.',
    code: 'type ReadonlyX<T> = { readonly [K in keyof T]: T[K] };\nconst p: ReadonlyX<{x: number}> = { x: 1 };\nconsole.log(p.x);',
    exercise: {
      prompt: 'Define `Nullable<T> = { [K in keyof T]: T[K] | null }`. Construct n: Nullable<{name: string}> = { name: null }. Log n.name ?? "default". Expected: default.',
      starter: '// type + value\n',
      expected: 'default',
    },
    takeaways: [
      '{ [K in keyof T]: ... } iterates keys and transforms shapes.',
      'Modifiers: readonly, ?, plus - to remove them.',
      'Underpins Partial, Required, Readonly, Pick, Omit, Record.',
      'Combine with conditional types for advanced transformations.',
    ],
    mistakes: [
      'Forgetting `as` clause when remapping keys — TS 4.1+ Template Literal Types.',
      'Mapping over a non-object type — TS evaluates to never silently.',
      'Trying to add methods through a mapped type — they vanish on instantiation.',
    ],
    next: { label: 'Async typing & Promise<T>', href: '#/courses/typescript-basics/ts10' },
  },
  {
    id: 'ts10', title: '10. Async typing & Promise<T>',
    intro: '`async function` always returns `Promise<T>`. Inside, `await p` unwraps to T. Use `Promise.all` (parallel) when independent. Type errors from `await` propagate as rejected promises — type the catch path.',
    code: 'async function load(): Promise<string> { return "ok"; }\n(async () => { const r = await load(); console.log(r); })();',
    exercise: {
      prompt: 'Write async function double(n: number): Promise<number> returning n*2. Await it on 7 and log the result. Expected: 14.',
      starter: '// async fn\n',
      expected: '14',
    },
    takeaways: [
      'async functions always return Promise<T>.',
      'await unwraps to T inside an async fn.',
      'Promise.all preserves the tuple of types when arguments are typed.',
      'Type the catch branch — caught values are unknown by default in modern TS.',
    ],
    mistakes: [
      'Forgetting that catch receives `unknown` — narrow with instanceof Error.',
      'Awaiting non-Promise values — fine but defeats the point.',
      'Using Promise<void> when you really mean Promise<unknown>.',
    ],
    next: { label: 'Utility types', href: '#/courses/typescript-basics/ts11' },
  },
  {
    id: 'ts11', title: '11. Utility types',
    intro:
      'TypeScript ships a library of utility types built on mapped + conditional types. `Partial<T>` makes all fields optional; `Required<T>` does the inverse. `Pick<T, K>` keeps only listed keys; `Omit<T, K>` drops them. `Record<K, V>` is `{ [k in K]: V }`. `ReturnType<F>` and `Parameters<F>` introspect functions. `Awaited<T>` peels through nested promises. `NonNullable<T>` strips null and undefined. Use them to derive related shapes instead of duplicating annotations.',
    code: 'interface User { id: number; name: string; admin?: boolean }\ntype PublicUser = Omit<User, "admin">;\ntype UserPatch = Partial<User>;\nfunction make(): User { return { id: 1, name: "Asha" }; }\ntype R = ReturnType<typeof make>;\nconst u: R = make();\nconsole.log(u.name);',
    exercise: {
      prompt: 'Given `interface Book { id: number; title: string; pages: number; }`, define `BookPreview = Pick<Book, "id" | "title">` and `b: BookPreview = { id: 1, title: "Dune" }`. Log `b.title`. Expected: `Dune`.',
      starter: 'interface Book { id: number; title: string; pages: number; }\n// type BookPreview = ...\n// const b: BookPreview = ...\nconst b = { id: 1, title: "Dune" };\nconsole.log(b.title);\n',
      expected: 'Dune',
    },
    takeaways: [
      'Partial / Required / Readonly toggle optionality / mutability across a type.',
      'Pick / Omit slice an existing type by key.',
      'Record<K, V> builds key-value shapes from a literal union.',
      'ReturnType / Parameters / Awaited introspect functions and promises.',
    ],
    mistakes: [
      'Using `Pick<T, "wrong">` — TS errors on unknown keys.',
      'Stacking Partial<Required<Partial<T>>> — same as Partial<T>; readable code wins.',
      'Forgetting Awaited unwraps nested promises (a generalized ReturnType for async).',
    ],
    next: { label: 'Branded types', href: '#/courses/typescript-basics/ts12' },
  },
  {
    id: 'ts12', title: '12. Branded types',
    intro:
      'Sometimes two values share a structural type but mean different things — a `UserId` and a `PostId` are both `number`, but mixing them is a bug. Branded types add a phantom field at the type level so they cannot be assigned to each other. Pattern: `type UserId = number & { readonly __brand: "UserId" }`. Construct via a smart constructor that asserts the brand. The brand never exists at runtime — pure compile-time discipline.',
    code: 'type UserId = number & { readonly __brand: "UserId" };\ntype PostId = number & { readonly __brand: "PostId" };\n\nfunction userId(n: number): UserId { return n as UserId; }\nfunction postId(n: number): PostId { return n as PostId; }\n\nfunction loadUser(id: UserId) { return `user-${id}`; }\nconst u = userId(7);\nconsole.log(loadUser(u));\n// loadUser(postId(7)) // would not compile',
    exercise: {
      prompt: 'Define a branded `type Email = string & { readonly __brand: "Email" }` and a helper `email(s: string): Email`. Create an `Email` from `"a@b.co"` and log it. Expected: `a@b.co`.',
      starter: '// type Email = ...\n// function email(s: string): Email { return s as Email; }\nconst e = "a@b.co";\nconsole.log(e);\n',
      expected: 'a@b.co',
    },
    takeaways: [
      'Branded types prevent accidental mixing of structurally identical values.',
      'The brand is a phantom property — zero runtime cost.',
      'A smart constructor is the gatekeeper that asserts the brand.',
      'Great for IDs, sanitized strings, validated payloads.',
    ],
    mistakes: [
      'Casting raw values everywhere with `as Brand` — defeats the safety.',
      'Forgetting `readonly` on the brand field — TS allows assignment in some cases.',
      'Overusing brands for trivial values — adds friction without bug-prevention value.',
    ],
    next: { label: 'Algorithms: Two pointers', href: '#/learn/algorithms/two-pointers' },
  },
];

// ── Go Basics ────────────────────────────────────────────────────
// Two sub-modules: Go Foundations (10), Concurrency & Stdlib (10).
// Titles are prefixed with the sub-module so the flat lesson list groups
// visually inside CoursePage's sidebar.
const GO_LESSONS = [
  // ─── Go Foundations (10) ─────────────────────────────────────────
  {
    id: 'packages-and-main',
    title: 'Foundations · Packages and main',
    subtitle: 'Every Go program is a tree of packages — main is the one that produces an executable.',
    intro: `Go organises code into packages. A package is a directory of .go files that share the same package <name> declaration on the first non-comment line. The compiler treats every file in that directory as part of one unit — there is no header file, no forward declaration, and no preprocessor. Functions, types, and variables defined in any file of the package are visible to every other file in the same package without an import.

The package main is special. It is the only package whose compiled output is an executable, and it must define a func main() that takes no arguments and returns nothing. Run go run main.go and the toolchain compiles the package and invokes main. Any package whose name is not main compiles to a library — a .a archive cached under your module's build directory — and can only be used via import from another package.

Imports pull in other packages by their import path, not their file path. The standard library lives under short paths: fmt, os, net/http, encoding/json. Third-party packages use the module path the publisher chose, typically github.com/user/repo. Inside the imported package you reference exported symbols with the package selector — fmt.Println, http.NewServeMux. Exported means the identifier starts with an uppercase letter; anything starting with a lowercase letter is package-private and invisible to callers, no matter how you import.

A module is the unit of versioning and dependency management. Run go mod init github.com/you/project and Go writes a go.mod file at the root with the module path and Go version. From then on every directory inside the module is a package whose import path is module-path + directory. go.sum records cryptographic hashes of every dependency version so builds are reproducible across machines.

The first imports a beginner writes are almost always fmt for formatted I/O and one or two of os, strings, strconv, sort. Resist the urge to wildcard-import — Go has no such syntax on purpose, and the explicit list at the top of each file makes dependencies grep-able.`,
    code: `package main

import "fmt"

func main() {
    fmt.Println("Hello from package main")
}`,
    exercise: {
      prompt: `Write a program in package main that prints the literal string Go ready on its own line.`,
      starter: `package main

import "fmt"

func main() {
    // your code here
}
`,
      expected: 'Go ready',
    },
    takeaways: [
      'Every .go file declares the package it belongs to on its first non-comment line.',
      'package main is the only one that produces an executable; it must define func main().',
      'Exported names start with an uppercase letter; lowercase names are package-private.',
      'Modules (go.mod) anchor import paths and lock dependency versions via go.sum.',
    ],
    mistakes: [
      'Naming a binary entry file something other than what is in package main — the toolchain reads the package declaration, not the filename.',
      'Lowercasing a function meant to be called from another package — the import compiles but the symbol is invisible.',
      'Editing go.sum by hand — it is generated; let go mod tidy and go build rewrite it.',
    ],
    next: 'variables-and-types',
  },
  {
    id: 'variables-and-types',
    title: 'Foundations · Variables and Types',
    subtitle: 'var, :=, type inference, and the small set of built-in primitives.',
    intro: `Go is statically typed — every variable has a single type fixed at compile time. There are two ways to introduce a variable. The long form is var name Type = expr, with the type and initialiser both optional (one of them must be present so the compiler can infer the other). The short form, name := expr, only works inside a function and infers the type from the right-hand side. The short form is what you will write 90% of the time; the var form is for package-level declarations and for cases where you need a zero value before assigning.

The primitive types are a deliberately small set. Integers: int and uint are 32 or 64 bits wide depending on the platform; the explicitly-sized int8 through int64 and uint8 through uint64 cover the cases where the width matters. byte is an alias for uint8 (think raw bytes), rune is an alias for int32 (a Unicode code point). Floats are float32 and float64; default is float64. complex64 and complex128 exist but you almost never need them. bool is true or false. string is an immutable sequence of bytes, conventionally UTF-8 but not validated.

Every variable starts at its zero value if you do not initialise it. Numbers zero to 0, bool to false, string to the empty "", pointers and slices and maps and channels and interfaces to nil. There are no uninitialised variables in Go — the zero value is the language-level guarantee that replaces the C idiom of always-initialise-or-face-undefined-behaviour.

Conversions between numeric types are always explicit. int(x) converts a float64 to an integer, truncating toward zero; float64(i) goes the other way. There is no implicit widening, no surprise promotion, no automatic float-to-int. The compiler refuses to add an int and an int64 without a conversion. This is one of the rules that makes Go code dull to read in the best way: types are exactly what they look like.

Constants are declared with const and can be typed or untyped. const Pi = 3.14159 is an untyped floating-point constant — it adopts whatever type the context demands, which means const Pi can be added to either a float32 or a float64 without a conversion.`,
    code: `package main

import "fmt"

func main() {
    var count int = 10
    name := "PGcode"
    pi := 3.14159
    var ok bool

    fmt.Println(count, name, pi, ok)

    var total int64 = int64(count) * 1000
    fmt.Println(total)
}`,
    exercise: {
      prompt: `Declare an int score = 95 and a string subject = "Math", then print Math: 95 (one space after the colon).`,
      starter: `package main

import "fmt"

func main() {
    // your code here
}
`,
      expected: 'Math: 95',
    },
    takeaways: [
      'var declares with an optional type and initialiser; := infers the type and is function-scoped.',
      'Every variable has a guaranteed zero value — no uninitialised reads.',
      'Numeric conversions are always explicit — there is no implicit widening.',
      'byte is uint8, rune is int32 — names that signal intent.',
    ],
    mistakes: [
      'Trying to use := at package scope — short declarations are function-local only.',
      'Adding an int and an int64 without a conversion — the compiler refuses.',
      'Re-declaring with := where at least one new variable is required — pure reassignment must use =.',
    ],
    next: 'control-flow',
  },
  {
    id: 'control-flow',
    title: 'Foundations · Control Flow',
    subtitle: 'if, for, and switch — three keywords cover every branching pattern.',
    intro: `Go's control-flow surface area is tiny on purpose. There is no while, no do-while, no until, no foreach. There is for — and that one keyword takes on every role the others play in other languages.

The three-clause for is the classic for init; cond; post { body }. Drop the init and post and you get a while loop: for cond { body }. Drop the condition too and you get an infinite loop: for { body }. Combine for with range to iterate over slices, maps, strings, and channels. range yields one or two values depending on the source — index/value for slices and arrays, key/value for maps, byte-index/rune for strings, value for channels.

if needs no parentheses around the condition, and the braces are mandatory even for one-line bodies. You can declare a variable scoped to the if/else block with the init form: if err := op(); err != nil { ... }. The err binding is visible inside the if and any else branches and nowhere else. This pattern shows up everywhere because it keeps error variables tightly scoped.

switch is the heavy lifter. Each case is implicitly break — there is no fall-through unless you write fallthrough explicitly. Cases can hold multiple values (case 1, 2, 3:) and arbitrary expressions (case x > 100, x < -100:). The expression after switch is optional — switch { case cond1: ... case cond2: ... } is the idiomatic chained-if. Type switches (switch v := x.(type) { ... }) inspect the dynamic type of an interface value and bind v to the concrete type in each branch.

Go has no ternary operator. If you want a one-liner, use a helper function or write the if/else over two lines. The language designers chose not to add a special form on the theory that conditional expressions are rare enough that the four extra characters do not hurt readability.

break, continue, goto, and return are the loop-and-function escape hatches. Labels (Loop: for { ... break Loop }) let break and continue target an outer loop when nested.`,
    code: `package main

import "fmt"

func main() {
    for i := 1; i <= 5; i++ {
        fmt.Println(i)
    }

    sum := 0
    for _, v := range []int{2, 4, 6} {
        sum += v
    }
    fmt.Println("sum =", sum)

    score := 85
    switch {
    case score >= 90:
        fmt.Println("A")
    case score >= 80:
        fmt.Println("B")
    default:
        fmt.Println("C or lower")
    }
}`,
    exercise: {
      prompt: `Sum every integer from 1 to 10 inclusive using a for loop and print the total. Expected: 55.`,
      starter: `package main

import "fmt"

func main() {
    total := 0
    // your loop here
    fmt.Println(total)
}
`,
      expected: '55',
    },
    takeaways: [
      'for is the only loop keyword — three-clause, condition-only, infinite, and range forms all use it.',
      'if and switch both support an init statement that scopes a variable to the block.',
      'switch cases are implicitly break — fall-through requires an explicit fallthrough.',
      'No ternary — favour a short if/else block or a helper function.',
    ],
    mistakes: [
      'Adding a semicolon at the end of an if/for header expecting C-style — Go inserts them automatically.',
      'Expecting switch to fall through and forgetting fallthrough — silent behavioural change.',
      'Writing while cond { } — that does not parse; use for cond { } instead.',
    ],
    next: 'functions-and-multi-return',
  },
  {
    id: 'functions-and-multi-return',
    title: 'Foundations · Functions and Multi-Return',
    subtitle: 'Functions are first-class, and returning multiple values is the rule, not the exception.',
    intro: `Functions are declared with func name(params) returnType. The return type goes after the parameter list, which reads naturally as "function that takes these arguments and returns this." Parameter declarations that share a type can collapse: func add(a, b int) int omits the type on a. Functions with no return write no return type; functions that return nothing are typed (). The unit type only matters when a function value's signature must be written down.

Multiple return values are Go's signature feature and the foundation of its error-handling idiom. func divide(a, b float64) (float64, error) returns two values, and the caller writes q, err := divide(10, 2) to receive both. If you only want one, the blank identifier _ discards the other: q, _ := divide(10, 2). The pattern result, err is so universal that you will write it dozens of times per file.

Named return values let you declare the returns up front: func split(s string) (left, right string) { left = s[:1]; right = s[1:]; return }. A bare return inside the function returns whichever values are currently bound to those names. Named returns are useful for documenting intent and for letting defer modify the return value, but for short functions they can read as noise — use them when they earn their place.

Functions are first-class values. They have a type (func(int) int), can be assigned to variables, passed as arguments, returned from other functions, and stored in slices and maps. This makes higher-order patterns natural: a Filter that takes a func(T) bool, a HandlerFunc passed to net/http. Anonymous functions, written func(x int) int { return x + 1 }, can be called immediately or stored.

Variadic functions accept zero or more arguments of a single type: func Println(args ...interface{}). Inside the function, args is a slice. Callers can pass individual values or spread an existing slice with the ... suffix: Println(items...).`,
    code: `package main

import "fmt"

func divide(a, b float64) (float64, error) {
    if b == 0 {
        return 0, fmt.Errorf("divide by zero")
    }
    return a / b, nil
}

func sum(nums ...int) int {
    total := 0
    for _, n := range nums {
        total += n
    }
    return total
}

func main() {
    q, err := divide(10, 4)
    if err != nil {
        fmt.Println(err)
        return
    }
    fmt.Println(q)
    fmt.Println(sum(1, 2, 3, 4))
}`,
    exercise: {
      prompt: `Write a function minMax(nums []int) (int, int) that returns the smallest and largest values. Call it on []int{4, 1, 7, 2, 9} and print the two values space-separated. Expected: 1 9.`,
      starter: `package main

import "fmt"

// add minMax here

func main() {
    // call minMax and print results
    fmt.Println(0, 0)
}
`,
      expected: '1 9',
    },
    takeaways: [
      'Return types follow the parameter list — func name(params) returnType.',
      'Multiple return values are idiomatic; (result, err) is the dominant pattern.',
      'Functions are first-class — assignable, passable, storable, returnable.',
      'Variadic parameters (args ...T) collect zero or more arguments into a slice.',
    ],
    mistakes: [
      'Ignoring an error return with q, _ := ... and silently masking failures.',
      'Naming return values everywhere — fine in short helpers, noisy in long functions.',
      'Forgetting to spread a slice into a variadic call — pass items... not items.',
    ],
    next: 'structs-and-methods',
  },
  {
    id: 'structs-and-methods',
    title: 'Foundations · Structs and Methods',
    subtitle: 'Composite types with named fields, plus methods that hang off a receiver.',
    intro: `A struct is a value type with named fields, defined with type Name struct { Field Type; ... }. Construct with a literal: Point{X: 3, Y: 4} or positionally with Point{3, 4} (positional is allowed but discouraged because it breaks when you add a field). Access fields with the dot operator: p.X. Structs are values — assigning one to another copies every field, and passing one to a function copies it too unless you take the address with & and pass a pointer.

Methods are functions with a receiver — an extra parameter between func and the method name. func (p Point) Sum() int { return p.X + p.Y } binds Sum to type Point. Inside the method, p refers to the receiver. The receiver can be a value (p Point) or a pointer (p *Point). The choice is consequential.

Value receivers operate on a copy of the struct — they cannot mutate the original, and they pay a copy cost proportional to the struct size. Pointer receivers operate on the original via a pointer — they can mutate fields, and they pay only a pointer-sized cost regardless of the struct size. The rule of thumb is: use a pointer receiver if the method mutates the receiver, if the struct is large, or if any other method on the type already uses a pointer receiver. Mixing pointer and value receivers on the same type is allowed but considered a code smell — pick one and stick with it.

Calling a method works through both values and pointers thanks to automatic address-taking and dereferencing. If you have a value p and a method with a pointer receiver, Go will rewrite p.Method() as (&p).Method() when p is addressable. If you have a pointer pp and a value receiver, Go rewrites pp.Method() as (*pp).Method(). The compiler smooths over the mechanics so you can think in terms of the call, not the receiver kind.

Struct embedding is Go's composition mechanism. type Rect struct { Point; W, H int } embeds Point into Rect — all of the embedded Point fields and methods become directly accessible on a Rect value (r.X, r.Sum()) without explicit forwarding. This is how Go does inheritance-style reuse without inheritance.`,
    code: `package main

import "fmt"

type Point struct {
    X, Y int
}

func (p Point) Sum() int {
    return p.X + p.Y
}

func (p *Point) Scale(k int) {
    p.X *= k
    p.Y *= k
}

func main() {
    p := Point{X: 3, Y: 4}
    fmt.Println(p.Sum())

    p.Scale(2)
    fmt.Println(p)
}`,
    exercise: {
      prompt: `Define type Rectangle struct { W, H int } and a value-receiver method Area() int. Print Rectangle{W: 4, H: 5}.Area(). Expected: 20.`,
      starter: `package main

import "fmt"

// type Rectangle ...
// func (r Rectangle) Area() int ...

func main() {
    fmt.Println(0) // replace
}
`,
      expected: '20',
    },
    takeaways: [
      'Structs are value types — assignment and parameter passing copy every field.',
      'Methods bind to a receiver — value receivers copy, pointer receivers do not.',
      'Pick value or pointer receivers consistently per type; mixing is a smell.',
      'Embedding promotes the embedded fields and methods to the outer type.',
    ],
    mistakes: [
      'Using a value receiver and being puzzled that mutations vanish — the method ran on a copy.',
      'Constructing with positional fields and breaking the build when a new field is added.',
      'Embedding two types that share a field name — the conflict is silent until you reference it.',
    ],
    next: 'interfaces-basics',
  },
  {
    id: 'interfaces-basics',
    title: 'Foundations · Interfaces Basics',
    subtitle: 'Implicit satisfaction, small interfaces, and the empty interface.',
    intro: `An interface in Go is a set of method signatures. type Stringer interface { String() string } declares a contract: anything with a method String() string satisfies Stringer. There is no implements keyword. The compiler checks satisfaction at the call site, not at the type definition — concrete types do not need to mention the interfaces they happen to implement. This decoupling is the single most distinctive feature of Go's type system, and it shapes how libraries are designed.

The practical consequence is that interfaces belong to the consumer, not the producer. A package that needs to format something defines its own one-method interface; anyone with a matching method works. io.Reader is the canonical example — bytes.Buffer, *os.File, *http.Request.Body, and dozens of custom types all satisfy it without ever importing io.

Interface values hold two things: a concrete type and a value of that type. The pair is sometimes called a fat pointer. When you call a method on an interface value, the runtime looks up the method on the concrete type and invokes it. The cost is one indirection compared to a direct method call — negligible in nearly all cases.

The empty interface — interface{} or its Go 1.18 alias any — has zero methods, which every type satisfies. It is the closest Go gets to object or void*. Use it sparingly: when you reach for any you have given up the static guarantees that make Go pleasant to refactor. The cases where any is the right answer are JSON unmarshal targets, the standard library's print functions, and generic-pre-1.18 containers.

Type assertions recover the concrete type: v, ok := x.(*MyType). The ok form is safe — false if x does not hold *MyType. The single-return form x.(*MyType) panics on mismatch, which is fine when the type is invariant and a panic would represent a bug. For switching on type, the type switch is the readable choice: switch v := x.(type) { case int: ... case string: ... }.

Keep interfaces small. Single-method interfaces are the most reusable; the bigger the interface, the weaker the abstraction is the Go proverb.`,
    code: `package main

import "fmt"

type Greeter interface {
    Greet() string
}

type English struct{}
type Spanish struct{}

func (English) Greet() string { return "Hello" }
func (Spanish) Greet() string { return "Hola" }

func sayHi(g Greeter) {
    fmt.Println(g.Greet())
}

func main() {
    sayHi(English{})
    sayHi(Spanish{})
}`,
    exercise: {
      prompt: `Define interface Shape with method Area() float64. Make type Square struct { Side float64 } implement it. Print Square{Side: 4}.Area() formatted with one decimal. Expected: 16.0.`,
      starter: `package main

import "fmt"

// type Shape ...
// type Square ...

func main() {
    fmt.Printf("%.1f\\n", 0.0) // replace
}
`,
      expected: '16.0',
    },
    takeaways: [
      'Interfaces are satisfied implicitly — concrete types do not declare what they implement.',
      'Interfaces belong to the consumer; define them where they are used, not where types live.',
      'any (interface{}) accepts every value but trades away static checking.',
      'Type assertions with the , ok form are safe; the single-return form panics on mismatch.',
    ],
    mistakes: [
      'Defining a giant interface up front because that is how OO languages do it.',
      'Comparing an interface value to nil after it was assigned a typed nil pointer — the comparison surprisingly returns false.',
      'Reaching for any to side-step a type mismatch instead of fixing the design.',
    ],
    next: 'error-handling-go-style',
  },
  {
    id: 'error-handling-go-style',
    title: 'Foundations · Error Handling, Go Style',
    subtitle: 'Errors are values — explicit returns, sentinel errors, wrapping, and errors.Is.',
    intro: `Go has no exceptions for normal failure paths. Functions that can fail return an error as their last value, and callers check it explicitly. The pattern is so pervasive that you will type if err != nil { return err } more than any other line of Go you write. The error type itself is a one-method interface: type error interface { Error() string }. Anything with an Error() string method is an error.

The most basic constructor is errors.New("message"). For formatted messages, fmt.Errorf("op failed: %v", val) builds a string error in one call. The verb %w is special — it wraps the original error so callers can recover it: fmt.Errorf("read config: %w", err). Wrapping preserves the chain so errors.Is and errors.As can walk the inner error tree.

Sentinel errors are package-level values declared once and compared with ==: var ErrNotFound = errors.New("not found"). Callers write if err == ErrNotFound { ... }, or with wrapping in play, the safer if errors.Is(err, ErrNotFound). io.EOF is the canonical example — every Reader returns it when there is nothing left to read.

Typed errors are structs that implement error: type ValidationError struct { Field string }. Callers use errors.As to extract the concrete type: var ve *ValidationError; if errors.As(err, &ve) { ... use ve.Field ... }. Typed errors carry structured data that messages cannot, which matters when callers need to react to specific failure modes.

The panic mechanism exists for truly unrecoverable bugs — index out of range, nil pointer dereference, intentional programmer assertions. It is not for ordinary control flow. defer paired with recover lets a goroutine catch a panic at a boundary (an HTTP handler, a worker loop) and turn it into a logged error rather than a crashed process, but inside business logic you should always return error, not panic.

The errors-as-values approach is verbose. That verbosity is the feature — every failure point is visible in the call site, no invisible try/catch flow. A function with twenty if err != nil checks is doing twenty things that can fail, and you can see them.`,
    code: `package main

import (
    "errors"
    "fmt"
)

var ErrEmpty = errors.New("input is empty")

func firstByte(s string) (byte, error) {
    if s == "" {
        return 0, ErrEmpty
    }
    return s[0], nil
}

func main() {
    if _, err := firstByte(""); err != nil {
        if errors.Is(err, ErrEmpty) {
            fmt.Println("got empty error")
            return
        }
        fmt.Println("unknown:", err)
    }
}`,
    exercise: {
      prompt: `Write a function safeDivide(a, b int) (int, error) that returns an error with message divide by zero when b is 0. Call it with (10, 0) and print just the error Error() string. Expected: divide by zero.`,
      starter: `package main

import (
    "errors"
    "fmt"
)

// add safeDivide

func main() {
    _, err := error(nil), errors.New("placeholder")
    fmt.Println(err)
}
`,
      expected: 'divide by zero',
    },
    takeaways: [
      'Errors are values returned alongside the result — no exceptions for normal failures.',
      'fmt.Errorf with %w wraps an inner error so callers can recover it with errors.Is / errors.As.',
      'Sentinel errors are package-level vars compared with errors.Is, not raw ==.',
      'panic + recover is for truly exceptional bugs, not control flow.',
    ],
    mistakes: [
      'Swallowing errors with _ — silently hides bugs that surface much later.',
      'Comparing wrapped errors with == — only errors.Is walks the wrap chain.',
      'Panicking on input-validation failures — return a typed error and let the caller decide.',
    ],
    next: 'slices-and-maps',
  },
  {
    id: 'slices-and-maps',
    title: 'Foundations · Slices and Maps',
    subtitle: 'The dynamic array and the hash table — the two built-in collections you reach for daily.',
    intro: `A slice is a view over a backing array. Internally it is three words: a pointer to the first element, a length (how many elements the slice currently exposes), and a capacity (how many the backing array can hold before a reallocation). Make a slice with a literal []int{1, 2, 3}, with make([]int, 5) for length-5 zero-initialised, or with make([]int, 0, 100) when you know you will append many elements and want to skip the early reallocations. The nil slice has length 0 and is safe to range and append; you do not need to allocate first.

append is the only blessed way to grow a slice. s = append(s, x) returns a possibly-new slice header — possibly because if the existing capacity is enough, the backing array is reused; otherwise Go allocates a larger array (typically 2x for small slices, 1.25x for larger), copies, and points the returned slice at the new array. You must capture the return value: append does not mutate in place. Two slices may share a backing array if one was created by slicing the other; mutating elements through one is visible through both. This sharing is the source of most slice surprises.

Slicing syntax — s[low:high] — produces a new slice header that points into the same backing array, with length high - low. Be aware that the slice keeps the rest of the backing array alive for the GC. If you slice a small window out of a huge file bytes, the whole buffer is retained. Defensive copy with append([]byte(nil), s[low:high]...) when that matters.

Maps are hash tables: m := map[string]int{}. Read with m[k] (returns the value type zero value if k is missing); set with m[k] = v; delete with delete(m, k); test membership with v, ok := m[k]. Iteration order is randomised per run on purpose — relying on map order is a guaranteed bug. Maps are reference types: passing a map to a function lets the callee mutate it visibly.

A nil map can be read but not written. m := map[string]int{} and m := make(map[string]int) both produce writable maps; var m map[string]int leaves m nil and panics on any assignment. Always initialise before writing.`,
    code: `package main

import "fmt"

func main() {
    nums := []int{3, 1, 4, 1, 5, 9, 2, 6}
    nums = append(nums, 5, 3, 5)
    fmt.Println("len =", len(nums), "cap =", cap(nums))

    counts := map[int]int{}
    for _, n := range nums {
        counts[n]++
    }
    fmt.Println("count of 5 =", counts[5])
}`,
    exercise: {
      prompt: `Given names := []string{"ada", "bo", "ada", "cy", "bo", "ada"}, count occurrences with a map[string]int and print the count of "ada". Expected: 3.`,
      starter: `package main

import "fmt"

func main() {
    names := []string{"ada", "bo", "ada", "cy", "bo", "ada"}
    // count, then print
    fmt.Println(0)
    _ = names
}
`,
      expected: '3',
    },
    takeaways: [
      'A slice is a (pointer, length, capacity) header pointing into a backing array.',
      'append may or may not reallocate — always capture the return value.',
      'Sub-slices share the backing array — mutations are visible across views.',
      'Maps must be initialised before assignment; nil maps panic on write.',
    ],
    mistakes: [
      'Writing append(s, x) and discarding the return value — the original s does not grow.',
      'Holding a sub-slice of a huge buffer and leaking the whole buffer to the GC.',
      'Iterating a map and depending on a stable order across runs — randomised on purpose.',
    ],
    next: 'pointers-in-go',
  },
  {
    id: 'pointers-in-go',
    title: 'Foundations · Pointers in Go',
    subtitle: 'Address-of and dereference, but no pointer arithmetic — pointers exist to share, not to compute.',
    intro: `Pointers in Go are simpler than in C. There are no & vs * dance for pointer arithmetic, no pointer-to-pointer-to-pointer puzzles, and no nullable values that are not also pointers. & takes the address of a variable; * dereferences a pointer. *T is the type "pointer to T". The zero value of a pointer is nil. That is the entire surface area.

Why use pointers? Two reasons. First, to share — give two pieces of code a handle to the same value so they can mutate it cooperatively, or so one of them can observe changes the other makes. Second, to avoid copies — a large struct passed by value into a function is copied, which costs CPU; passing a pointer copies one word regardless of struct size. Both reasons matter at different scales; profile before pre-optimising the copy issue, but reach for pointers without hesitation when sharing is the actual intent.

new(T) allocates a zero-valued T and returns a *T. It is rarely used directly because composite literals like &MyStruct{Field: 1} are more readable and do the same thing. The Go runtime decides whether T lives on the stack or the heap via escape analysis — if a pointer to a local outlives the function, it escapes to the heap; otherwise it stays on the stack. Either way, the language guarantees the memory is valid as long as any reachable pointer references it; the garbage collector frees it when nothing does.

You can take the address of any addressable value: a named variable, a struct field of an addressable variable, an element of a slice (slices are pointers under the hood, so v[i] is addressable). You cannot take the address of a map element (m[k]) because rehashing might move the value, nor of a function call return (compute it into a variable first).

A nil pointer dereferenced panics with invalid memory address or nil pointer dereference. The fix is always to check for nil before dereferencing, or to design so the value can never be nil at the call site. There is no equivalent of the C cast that says I promise this is not nil.`,
    code: `package main

import "fmt"

type Counter struct {
    n int
}

func bump(c *Counter) {
    c.n++
}

func main() {
    c := &Counter{}
    bump(c)
    bump(c)
    bump(c)
    fmt.Println(c.n)
}`,
    exercise: {
      prompt: `Write a function double(x *int) that doubles the value pointed to. Initialise v := 21, call double(&v), then print v. Expected: 42.`,
      starter: `package main

import "fmt"

// add double

func main() {
    v := 21
    // call double, then print v
    fmt.Println(v)
}
`,
      expected: '42',
    },
    takeaways: [
      '& takes the address of a variable; * dereferences a pointer.',
      'No pointer arithmetic — pointers exist to share or avoid copies, not to compute offsets.',
      'Escape analysis decides stack vs heap; both are safe — the GC frees the heap when nothing references it.',
      'Map elements and function returns are not addressable — copy into a variable first.',
    ],
    mistakes: [
      'Dereferencing a nil pointer — always nil-check or design so it cannot be nil.',
      'Returning a pointer to a local in C and panicking — that is fine in Go thanks to escape analysis.',
      'Trying to take &m[k] for a map element — not allowed.',
    ],
    next: 'defer-panic-recover',
  },
  {
    id: 'defer-panic-recover',
    title: 'Foundations · Defer, Panic, Recover',
    subtitle: 'Scheduled cleanup, structured panics, and the rare recover boundary.',
    intro: `defer schedules a function call to run when the surrounding function returns — including returns via panic. The canonical use is paired with anything that acquires a resource: open a file with os.Open and immediately defer file.Close(); acquire a mutex with mu.Lock() and immediately defer mu.Unlock(). The pattern keeps the release next to the acquire so reading the function once makes the contract obvious.

Deferred calls run in LIFO order. defer A(); defer B(); defer C() runs C, then B, then A. The arguments to a deferred call are evaluated at the defer statement, not at the moment of execution. defer fmt.Println(x) snapshots x then; later mutations are invisible. If you need the latest value, defer a closure: defer func() { fmt.Println(x) }(). The closure captures x by reference and reads it at call time.

defer has a tiny per-call cost (a few nanoseconds) — fine for the rare cleanup, but noticeable inside hot inner loops. The compiler optimises common patterns (open-coded defers since Go 1.14) but the rule of thumb is: do not defer inside a loop that runs millions of times.

panic stops normal execution. The runtime unwinds the stack, running deferred calls in each frame, until either the program exits with a panic trace or a deferred function calls recover. recover only returns non-nil when called directly from a deferred function during a panic; outside of that exact context it returns nil. The usual shape is a boundary handler: an HTTP handler wraps its work in defer func() { if r := recover(); r != nil { log + 500 } }() so a runaway panic from inside the handler turns into a logged 500 instead of crashing the server.

Reach for panic for truly unrecoverable programmer errors — failed invariants, impossible enum branches. Use it for this-should-never-happen assertions, not for ordinary failure paths. Library code should almost never panic across its API boundary — return errors instead.`,
    code: `package main

import "fmt"

func work() {
    defer fmt.Println("cleanup")
    fmt.Println("doing work")
}

func guarded() {
    defer func() {
        if r := recover(); r != nil {
            fmt.Println("recovered:", r)
        }
    }()
    panic("boom")
}

func main() {
    work()
    guarded()
    fmt.Println("after guarded")
}`,
    exercise: {
      prompt: `Use defer to print done AFTER work inside main. Expected output (two lines):
work
done`,
      starter: `package main

import "fmt"

func main() {
    // use defer + Println
}
`,
      expected: 'work\ndone',
    },
    takeaways: [
      'defer schedules a call for function exit — even on panic.',
      'Deferred arguments evaluate at the defer site; wrap in a closure for late binding.',
      'panic unwinds the stack running defers; recover (inside a deferred function) catches it.',
      'Reserve panic for impossible states; return errors for ordinary failures.',
    ],
    mistakes: [
      'Deferring inside a tight loop and piling up calls until function exit.',
      'Calling recover outside a deferred function — returns nil and the panic continues.',
      'Panicking across an exported API boundary instead of returning an error.',
    ],
    next: 'goroutines',
  },

  // ─── Concurrency & Stdlib (10) ────────────────────────────────────
  {
    id: 'goroutines',
    title: 'Concurrency · Goroutines',
    subtitle: 'Lightweight threads multiplexed onto OS threads by the Go runtime scheduler.',
    intro: `A goroutine is a function executing concurrently with other goroutines in the same address space. Start one by prefixing any function call with go: go work(). The call returns immediately; work runs in the background, scheduled by the Go runtime onto a pool of OS threads. The runtime decides which goroutine runs on which thread at which moment — you write code as if every goroutine had its own thread, and the scheduler handles the multiplexing.

Goroutines are cheap. The initial stack is 2 KB and grows on demand up to a configurable maximum (default 1 GB). A program with a million goroutines is normal; trying that with OS threads would exhaust memory. The cheapness changes how you design concurrent systems — spawning a goroutine per request, per connection, per stream is fine, where in other runtimes you would build elaborate pools.

The main goroutine is the one running main(). When it returns, the program exits regardless of what other goroutines are doing. This catches every beginner: launch a goroutine, return from main, see no output. You must coordinate explicitly — either wait on a channel, a sync.WaitGroup, or another signal — to keep the program alive long enough.

Goroutines do not return values directly. They communicate by sharing data through channels or by writing into shared variables guarded by sync primitives. The Go proverb is "Do not communicate by sharing memory; instead share memory by communicating" — meaning the channel-based pattern is preferred where it fits, and locks are for the cases where it does not.

The race detector (go run -race or go test -race) instruments memory accesses and flags concurrent reads/writes without synchronisation. Run it during development against any concurrent code. It catches a class of bugs that are impossible to reason about by inspection alone, because they only manifest under specific scheduling.

Loop-variable capture inside goroutines was a classic foot-gun until Go 1.22 changed the per-iteration scoping. Before 1.22, for i := range items { go func() { use(i) }() } captured the same i across all goroutines. From 1.22 onward, each iteration gets its own i. Old code may still have the bug; pin to the new behaviour by writing for i := range items { i := i; go func() { use(i) }() } if you must support both.`,
    code: `package main

import (
    "fmt"
    "sync"
)

func main() {
    var wg sync.WaitGroup
    for i := 0; i < 3; i++ {
        wg.Add(1)
        go func(n int) {
            defer wg.Done()
            fmt.Println("hello from", n)
        }(i)
    }
    wg.Wait()
}`,
    exercise: {
      prompt: `Spawn 5 goroutines that each contribute their index (0..4) to a shared total guarded by a sync.Mutex. Use a sync.WaitGroup to wait. Print the final total. Expected: 10.`,
      starter: `package main

import (
    "fmt"
    "sync"
)

func main() {
    var (
        mu    sync.Mutex
        wg    sync.WaitGroup
        total int
    )
    // spawn goroutines here
    wg.Wait()
    _ = mu
    fmt.Println(total)
}
`,
      expected: '10',
    },
    takeaways: [
      'go f() launches f concurrently; the call returns immediately.',
      'Goroutines start at 2 KB and grow — millions on one machine is realistic.',
      'main returning kills every goroutine — coordinate explicitly to keep work alive.',
      'go run -race instruments accesses and flags unsynchronised reads/writes.',
    ],
    mistakes: [
      'Launching goroutines and forgetting to wait — main exits before they print.',
      'Capturing a loop variable by closure in Go < 1.22 — all goroutines see the final value.',
      'Sharing a map or slice across goroutines without a mutex — data race, undefined behaviour.',
    ],
    next: 'channels-basic',
  },
  {
    id: 'channels-basic',
    title: 'Concurrency · Channels Basics',
    subtitle: 'Typed pipes between goroutines — send, receive, close, range.',
    intro: `A channel is a typed conduit through which goroutines send and receive values. Create with make(chan T) for an unbuffered channel or make(chan T, N) for a buffered one of capacity N. Send a value with ch <- v; receive with v := <-ch. Both operations block under the right conditions, and that blocking is the synchronisation primitive that makes channels useful.

An unbuffered channel is a synchronous handoff. Send blocks until a receiver is ready; receive blocks until a sender is ready. The send and the receive happen simultaneously — when the line completes on both sides, the value has been transferred and both goroutines move on. This is rendezvous semantics: the two goroutines meet at the channel and exchange a value.

A buffered channel of capacity N decouples sender from receiver up to N pending values. Send blocks only when the buffer is full; receive blocks only when the buffer is empty. Buffered channels are useful when the producer and consumer run at slightly different rates and you want to absorb the difference, or when you want to queue work for a pool of workers.

close(ch) signals "no more values will be sent." Receivers can detect closure: v, ok := <-ch returns ok == false when the channel is drained and closed. range over a channel reads values until it is closed, then exits the loop cleanly. The producer is responsible for closing — never the consumer. Close exactly once; closing a closed channel panics.

Sending on a closed channel also panics. Receiving from a closed channel never blocks and always returns the zero value (and ok == false). A nil channel blocks forever on both send and receive — sometimes useful in select to disable a case dynamically.

Channels are not free. Each send/receive involves the scheduler. For very high-throughput inner loops, atomic operations or batching reduces the per-message cost. For most application work — a few thousand to a few million ops/sec — channels are the readable choice.`,
    code: `package main

import "fmt"

func main() {
    ch := make(chan int, 3)
    go func() {
        for i := 1; i <= 5; i++ {
            ch <- i
        }
        close(ch)
    }()

    total := 0
    for v := range ch {
        total += v
    }
    fmt.Println(total)
}`,
    exercise: {
      prompt: `Launch a goroutine that pushes the integers 1..5 into a channel and then closes it. In main, range over the channel, sum the values, and print the sum. Expected: 15.`,
      starter: `package main

import "fmt"

func main() {
    ch := make(chan int, 5)
    // launch producer goroutine
    total := 0
    for v := range ch {
        total += v
    }
    fmt.Println(total)
}
`,
      expected: '15',
    },
    takeaways: [
      'Unbuffered channels rendezvous — send and receive complete together.',
      'Buffered channels (make(chan T, N)) absorb up to N pending values.',
      'close signals no more sends; range over a channel exits when it is drained.',
      'Producer closes; sending on a closed channel panics; receiving returns the zero value.',
    ],
    mistakes: [
      'Closing a channel from the consumer side — concurrency hazard and against convention.',
      'Closing a channel twice — guaranteed panic.',
      'Forgetting to close a channel feeding a range loop — the loop never exits.',
    ],
    next: 'select-multiplex',
  },
  {
    id: 'select-multiplex',
    title: 'Concurrency · Select Multiplexing',
    subtitle: 'Wait on multiple channel operations at once — first one ready wins.',
    intro: `select is the multiplexer for channels. It blocks on a list of channel operations and proceeds with whichever one becomes ready first. The syntax mirrors switch: each case is a send or receive, the body runs when that case fires. If multiple cases are ready simultaneously, the runtime picks one at random — never the first one written. That randomness is intentional; it prevents starvation when, say, two channels are constantly ready.

A default case fires immediately if no other case is ready. select with default never blocks — it polls, returning instantly with the default if no channel has data. This is the right tool for try-to-send-otherwise-drop or try-to-receive-otherwise-do-other-work patterns.

A common use of select is implementing timeouts. time.After(d) returns a channel that delivers a value after d elapses. Combine it: select { case v := <-work: ... case <-time.After(time.Second): ... handle timeout ... }. The work case fires if work delivers in time; the timeout case fires if not. After Go 1.23 prefer time.NewTimer with explicit Stop if you must cancel, since time.After leaks the timer on early returns.

select pairs naturally with a context to express cancellation. case <-ctx.Done(): return ctx.Err() is the standard stop-when-told pattern that you will see in every long-running goroutine.

A select inside a for loop is the workhorse of long-lived workers: for { select { case msg := <-input: handle(msg); case <-quit: return } }. The worker handles messages until told to stop. This is so common that you should read for-select as one idiomatic unit, not two separate constructs.

A nil channel inside select disables its case — the case never fires. Set a channel variable to nil to temporarily remove it from contention, then restore it later. This trick is rare but useful when you need conditional cases without restructuring the select.`,
    code: `package main

import (
    "fmt"
    "time"
)

func main() {
    work := make(chan string, 1)
    go func() {
        time.Sleep(50 * time.Millisecond)
        work <- "done"
    }()

    select {
    case v := <-work:
        fmt.Println(v)
    case <-time.After(500 * time.Millisecond):
        fmt.Println("timeout")
    }
}`,
    exercise: {
      prompt: `Set up a select with two ready cases — a channel a delivering "from a" and a channel b delivering "from b". Buffer both. Either body should print one fired. Expected: one fired.`,
      starter: `package main

import "fmt"

func main() {
    a := make(chan string, 1)
    b := make(chan string, 1)
    a <- "from a"
    b <- "from b"
    select {
    case <-a:
        fmt.Println("one fired")
    case <-b:
        fmt.Println("one fired")
    }
}
`,
      expected: 'one fired',
    },
    takeaways: [
      'select blocks on multiple channel ops and proceeds with the first one ready.',
      'Multiple ready cases are chosen at random — no priority by source order.',
      'default makes select non-blocking — perfect for polling patterns.',
      'for { select { ... } } is the canonical long-lived worker shape.',
    ],
    mistakes: [
      'Expecting the first case in source order to win — randomness is the spec.',
      'Using time.After in a tight loop without cancelling — leaks timers.',
      'Forgetting that a nil channel inside select disables its case — useful or surprising depending on intent.',
    ],
    next: 'channel-direction',
  },
  {
    id: 'channel-direction',
    title: 'Concurrency · Channel Direction',
    subtitle: 'Send-only and receive-only channel types narrow what a function can do.',
    intro: `A channel can be declared with a direction. chan<- T is send-only; <-chan T is receive-only; chan T is bidirectional. A bidirectional channel converts implicitly to either directional type at a function-call boundary, but a directional channel cannot be widened back to bidirectional. The direction is a compile-time guarantee that a function only uses the channel one way.

The pattern shows up in producer/consumer signatures. A producer takes chan<- int — the compiler proves it cannot accidentally read; a consumer takes <-chan int — it cannot accidentally write. When you split a pipeline into stages, each stage signature documents its role and the compiler enforces it.

func produce(out chan<- int) { for i := 0; i < 10; i++ { out <- i }; close(out) } can write to and close out but not read from it. func consume(in <-chan int) { for v := range in { use(v) } } can read but not write. Wire them by creating a bidirectional channel in main and passing it to each side: ch := make(chan int); go produce(ch); consume(ch).

Closing requires a writable end. Only the goroutine that owns the send side closes; that goroutine must hold a chan T or chan<- T — a <-chan T cannot close. This naturally pushes you toward the convention "the sender closes" because the compiler refuses to let the receiver attempt it.

Directional types compose into pipelines. Imagine three stages: gen (chan<- int) -> square (in <-chan int, out chan<- int) -> print (<-chan int). Each stage interface is visible from its signature alone, and the type system rejects any wiring that crosses streams. For longer pipelines this kind of self-documenting wiring is the difference between maintainable concurrent code and a debugging nightmare.

You can write a method or function that returns a directional channel even though it created a bidirectional one internally — the conversion happens automatically: func gen() <-chan int { ch := make(chan int); go func() { defer close(ch); for i := 0; i < 10; i++ { ch <- i } }(); return ch }.`,
    code: `package main

import "fmt"

func produce(out chan<- int) {
    for i := 1; i <= 4; i++ {
        out <- i
    }
    close(out)
}

func consume(in <-chan int) int {
    total := 0
    for v := range in {
        total += v
    }
    return total
}

func main() {
    ch := make(chan int)
    go produce(ch)
    fmt.Println(consume(ch))
}`,
    exercise: {
      prompt: `Write a function source() <-chan int that returns a receive-only channel emitting 1, 2, 3 then closing. In main, sum the values and print the total. Expected: 6.`,
      starter: `package main

import "fmt"

// add source

func main() {
    // sum values from source and print
    fmt.Println(0)
}
`,
      expected: '6',
    },
    takeaways: [
      'chan<- T is send-only; <-chan T is receive-only; chan T is bidirectional.',
      'Bidirectional converts to directional implicitly, never the other way.',
      'Directional signatures document a function role and let the compiler enforce it.',
      'Closing requires a writable end — the receiver cannot close.',
    ],
    mistakes: [
      'Trying to close a <-chan T — the compiler rejects it.',
      'Casting away direction by reassigning to a bidirectional variable — there is no such cast.',
      'Mixing read and write inside one function when two stages would communicate the intent better.',
    ],
    next: 'context-package',
  },
  {
    id: 'context-package',
    title: 'Concurrency · The context Package',
    subtitle: 'Carry deadlines, cancellation signals, and request-scoped values through call trees.',
    intro: `context.Context is Go's standard cancellation and deadline propagation type. Every function that does I/O, blocks, or might run for a long time should take a Context as its first parameter, by convention named ctx. The context carries a Done() <-chan struct{} that closes when work should stop, an Err() that explains why (context.Canceled or context.DeadlineExceeded), a Deadline() time, and an opaque Value(key) bag for request-scoped data.

Make a context with one of four constructors. context.Background() is the root — used in main, init, and tests. context.TODO() is a placeholder when you have not yet decided which context to wire (treat it as a Background you intend to replace). context.WithCancel(parent) returns a derived context and a cancel function — call cancel to signal the derived tree to stop. context.WithTimeout(parent, d) and context.WithDeadline(parent, t) signal automatically after the duration or at the time.

Always call the cancel function returned by With* — even on success — to release resources promptly. The idiom is ctx, cancel := context.WithTimeout(parent, time.Second); defer cancel(). Forgetting cancel leaks a timer and a goroutine until the parent context finishes.

Propagation is the point. Pass the same ctx through every function in a call chain so when the root cancels — because the client disconnected, the deadline elapsed, or the application is shutting down — every goroutine downstream sees ctx.Done() fire and can stop quickly. The standard library is consistent: net.Dial, http.Request, sql.DB.QueryContext, and many others accept a Context and abort the in-flight operation when it is cancelled.

ctx.Value is for request-scoped data that genuinely crosses API boundaries: a request ID, a tracing span, an authenticated user. It is not for passing optional parameters — that path is unmarshallable and untyped. Define your own key type to avoid collisions: type ctxKey int; const userKey ctxKey = 0.

Context is immutable. Each With* call returns a new context layered over the parent. Reading a value walks up the chain until it finds the key. Cancellation propagates from parent to children, never the other way.`,
    code: `package main

import (
    "context"
    "fmt"
    "time"
)

func work(ctx context.Context) {
    select {
    case <-time.After(200 * time.Millisecond):
        fmt.Println("finished")
    case <-ctx.Done():
        fmt.Println("cancelled:", ctx.Err())
    }
}

func main() {
    ctx, cancel := context.WithTimeout(context.Background(), 50*time.Millisecond)
    defer cancel()
    work(ctx)
}`,
    exercise: {
      prompt: `Inside main, derive a context.WithCancel from context.Background(). Immediately call cancel() and then print ctx.Err().Error(). Expected: context canceled.`,
      starter: `package main

import (
    "context"
    "fmt"
)

func main() {
    ctx, cancel := context.WithCancel(context.Background())
    _ = ctx
    _ = cancel
    // cancel, then print ctx.Err().Error()
    fmt.Println("")
}
`,
      expected: 'context canceled',
    },
    takeaways: [
      'Pass ctx as the first parameter of any function that blocks or does I/O.',
      'context.WithCancel / WithTimeout / WithDeadline derive cancellable children.',
      'Always defer cancel() — even on success — to release the timer and goroutine.',
      'ctx.Value is for cross-cutting request data, never for optional parameters.',
    ],
    mistakes: [
      'Storing a Context inside a struct field instead of passing it as a parameter.',
      'Forgetting to call cancel and leaking timers or goroutines.',
      'Using string keys for ctx.Value — collisions across packages; define a private key type.',
    ],
    next: 'sync-mutex',
  },
  {
    id: 'sync-mutex',
    title: 'Concurrency · sync.Mutex',
    subtitle: 'When channels are wrong, lock the data — Mutex and RWMutex from the sync package.',
    intro: `Channels are the headline concurrency primitive, but plenty of cases call for plain mutual exclusion. Counters, caches, in-memory state that multiple goroutines update — these are mutex territory. sync.Mutex is the simple lock. Call mu.Lock() to acquire, mu.Unlock() to release. The lock is non-reentrant: a goroutine that already holds the lock and calls Lock again deadlocks against itself.

The canonical pattern pairs every Lock with a deferred Unlock immediately afterward: mu.Lock(); defer mu.Unlock(). The deferred call guarantees release even if the protected block panics. Always lock the smallest possible scope — a wide critical section serialises more work than necessary and reduces concurrency benefits.

Embed the mutex inside the struct it protects whenever the lifetime matches: type Counter struct { mu sync.Mutex; n int }. Methods on the struct lock at entry, mutate, and return. Callers do not see the lock at all — the API exposes a thread-safe Counter. This encapsulation is the Go way: locks travel with the data they guard.

sync.RWMutex separates readers from writers. Many goroutines can hold RLock simultaneously; Lock waits for all readers to drain and then excludes everyone. Use it when reads vastly outnumber writes — a config cache, a read-heavy lookup table. For balanced or write-heavy workloads, a plain Mutex is usually faster because RWMutex has more bookkeeping per operation.

Never copy a Mutex after first use. The zero value is unlocked and usable, but once any goroutine has touched it, copying the struct that holds it duplicates the lock state and breaks mutual exclusion silently. go vet catches this with the copylocks check. Always pass struct pointers to functions that take a struct with a mutex inside.

Compare-and-swap and atomic counters from sync/atomic are an alternative to a mutex around a single integer or pointer. They are lock-free and faster for very small critical sections, but harder to reason about. Reach for a Mutex first; switch to atomic only when profiling shows the mutex is the bottleneck.`,
    code: `package main

import (
    "fmt"
    "sync"
)

type Counter struct {
    mu sync.Mutex
    n  int
}

func (c *Counter) Add(d int) {
    c.mu.Lock()
    defer c.mu.Unlock()
    c.n += d
}

func main() {
    var wg sync.WaitGroup
    c := &Counter{}
    for i := 0; i < 100; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            c.Add(1)
        }()
    }
    wg.Wait()
    fmt.Println(c.n)
}`,
    exercise: {
      prompt: `Build a Counter struct with a sync.Mutex and an int field n. Launch 10 goroutines that each Add(1). Wait with a WaitGroup. Print the final value. Expected: 10.`,
      starter: `package main

import (
    "fmt"
    "sync"
)

// type Counter ...
// method Add ...

func main() {
    var wg sync.WaitGroup
    _ = wg
    // spawn 10 goroutines and print final counter
    fmt.Println(0)
}
`,
      expected: '10',
    },
    takeaways: [
      'sync.Mutex protects shared mutable state with Lock / Unlock.',
      'defer mu.Unlock right after Lock — guarantees release on every exit path.',
      'Embed the mutex in the struct it protects; expose thread-safe methods.',
      'RWMutex helps read-heavy workloads; Mutex wins for write-heavy or balanced.',
    ],
    mistakes: [
      'Copying a struct that contains a sync.Mutex — go vet flags this; the copy has stale lock state.',
      'Calling Lock twice from the same goroutine — Go mutexes are not reentrant; this deadlocks.',
      'Holding the lock across an I/O call — serialises everything; release before blocking work.',
    ],
    next: 'waitgroup-and-once',
  },
  {
    id: 'waitgroup-and-once',
    title: 'Concurrency · WaitGroup and Once',
    subtitle: 'Coordinate fan-out with sync.WaitGroup; run one-time setup with sync.Once.',
    intro: `sync.WaitGroup is the canonical wait-for-N-goroutines primitive. The API has three methods. Add(n) increments the counter by n; Done() decrements by one (often deferred at the top of a goroutine); Wait() blocks until the counter hits zero. The pattern is: in the parent, wg.Add(1) for each goroutine you spawn, then wg.Wait() after the loop. Inside each goroutine, defer wg.Done() as the first line so the counter decrements even on panic.

The single most common bug is calling Add inside the goroutine instead of before it. go func() { wg.Add(1); defer wg.Done(); ... }() races with Wait — the parent may reach Wait before the goroutine starts, observe a zero counter, and return immediately while the goroutine is still running. Always Add before go.

WaitGroup is concurrency-safe and can be called from any goroutine, but copying it after first use produces the same kind of breakage as copying a mutex. Pass it by pointer (var wg sync.WaitGroup; doWork(&wg)) when sharing across functions.

For richer coordination — collecting per-goroutine errors, cancelling siblings on first failure — reach for golang.org/x/sync/errgroup. errgroup.Group wraps a WaitGroup and adds Group.Go(func() error) plus Group.Wait() error that returns the first non-nil error. It is the standard upgrade once your concurrent fan-out cares about failure.

sync.Once runs a function exactly once across all callers, even if multiple goroutines arrive at the call simultaneously. var once sync.Once; once.Do(initialize). The first caller runs initialize; every other caller blocks until that call finishes and then returns. It is the right primitive for lazy initialisation — singleton connections, cached parsed configurations, sync-once setup of a package-level resource.

Once is safe to use as a struct field. The zero value is ready to use. Do not try to reset a Once by reassigning — there is no API for that and reassignment is racy. If you need re-runnable initialisation, use a different pattern.`,
    code: `package main

import (
    "fmt"
    "sync"
)

var (
    once   sync.Once
    config string
)

func loadConfig() {
    once.Do(func() {
        config = "loaded"
        fmt.Println("loading once")
    })
}

func main() {
    var wg sync.WaitGroup
    for i := 0; i < 3; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            loadConfig()
        }()
    }
    wg.Wait()
    fmt.Println(config)
}`,
    exercise: {
      prompt: `Use a WaitGroup to wait for 4 goroutines that each send the int 1 into a channel of cap 4. After Wait, close the channel and sum the values. Print the sum. Expected: 4.`,
      starter: `package main

import (
    "fmt"
    "sync"
)

func main() {
    ch := make(chan int, 4)
    var wg sync.WaitGroup
    // spawn 4 goroutines
    wg.Wait()
    close(ch)
    total := 0
    for v := range ch {
        total += v
    }
    fmt.Println(total)
}
`,
      expected: '4',
    },
    takeaways: [
      'WaitGroup: Add before go, defer Done in the goroutine, Wait in the parent.',
      'Adding from inside the goroutine races with Wait — always Add first.',
      'Pass WaitGroup by pointer; never copy after first use.',
      'sync.Once.Do runs the function exactly once across all callers — the right tool for lazy init.',
    ],
    mistakes: [
      'Calling wg.Add inside the goroutine — Wait can fire too early.',
      'Copying a WaitGroup into another struct — silently breaks counter state.',
      'Reassigning a sync.Once to reset it — there is no reset; pick a different pattern.',
    ],
    next: 'http-server-basics',
  },
  {
    id: 'http-server-basics',
    title: 'Stdlib · HTTP Server Basics',
    subtitle: 'net/http gives you a production-grade HTTP server in a dozen lines.',
    intro: `Go ships a complete HTTP server in the standard library. net/http handles parsing, routing, TLS, HTTP/2, graceful shutdown — the works. The minimum is a handler function and a listener: http.HandleFunc("/", handler); http.ListenAndServe(":8080", nil). ListenAndServe blocks the calling goroutine and returns only on error; production servers usually run it from main and treat its return as a fatal log.

A handler is any value that satisfies http.Handler — interface { ServeHTTP(http.ResponseWriter, *http.Request) }. HandlerFunc is an adapter that makes a plain func(w http.ResponseWriter, r *http.Request) satisfy the interface. You will write the function form 95% of the time.

http.ResponseWriter is how you send the response. Write headers with w.Header().Set("Content-Type", "application/json"), set the status with w.WriteHeader(http.StatusOK), and write the body with w.Write(b) or fmt.Fprintln(w, ...). The first write implicitly calls WriteHeader(200) if you have not done it — so call WriteHeader before any Write if you want a non-200 status.

The default mux (passed as nil to ListenAndServe) is fine for simple cases but lacks features the community typically wants: path parameters, method-based routing, middleware chains. Go 1.22 added pattern matching to the default mux (mux.HandleFunc("GET /users/{id}", h)), which is enough for many small services. For larger apps, frameworks like chi or echo provide ergonomic routers; the underlying handler model is unchanged.

Concurrency is automatic — net/http spawns a goroutine per request. Handlers therefore run concurrently; shared state must be synchronised. The Request value belongs to the handler and must not be retained past return; if you need data after, copy it.

Graceful shutdown lets you stop the server without dropping in-flight requests. Build the server explicitly (srv := &http.Server{Addr: ":8080", Handler: mux}; go srv.ListenAndServe()), and on a shutdown signal call srv.Shutdown(ctx). Shutdown stops accepting new connections and waits for current handlers to finish or the context to expire.`,
    code: `package main

import (
    "fmt"
    "net/http"
)

func health(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "text/plain")
    fmt.Fprintln(w, "ok")
}

func main() {
    mux := http.NewServeMux()
    mux.HandleFunc("/health", health)

    // ListenAndServe would block forever; the example shows wiring only.
    fmt.Println("registered /health on a new mux")
    _ = mux
}`,
    exercise: {
      prompt: `Define a handler hello(w, r) that writes the literal hello world (no trailing newline). Demonstrate it by calling hello with a httptest.ResponseRecorder and printing the recorder Body.String(). Expected: hello world.`,
      starter: `package main

import (
    "fmt"
    "net/http"
    "net/http/httptest"
)

func hello(w http.ResponseWriter, r *http.Request) {
    // write "hello world"
}

func main() {
    rec := httptest.NewRecorder()
    req, _ := http.NewRequest("GET", "/", nil)
    hello(rec, req)
    fmt.Print(rec.Body.String())
}
`,
      expected: 'hello world',
    },
    takeaways: [
      'http.HandleFunc binds a path to a handler; http.ListenAndServe blocks serving.',
      'WriteHeader before any Write — the first Write defaults the status to 200.',
      'Handlers run concurrently — shared state needs synchronisation.',
      'http.Server with Shutdown(ctx) provides graceful in-flight-aware termination.',
    ],
    mistakes: [
      'Calling WriteHeader after Write — the second call is ignored and a warning is logged.',
      'Retaining the *http.Request past handler return — its body is closed by then.',
      'Building a global mux for a large app — prefer an explicit *http.ServeMux you can pass around.',
    ],
    next: 'json-encoding-decoding',
  },
  {
    id: 'json-encoding-decoding',
    title: 'Stdlib · JSON Encoding and Decoding',
    subtitle: 'encoding/json maps between Go structs and JSON via struct tags and reflection.',
    intro: `encoding/json is the standard JSON codec. Marshal a Go value to JSON bytes with json.Marshal(v) — it returns ([]byte, error). Unmarshal bytes into a pointer to a Go value with json.Unmarshal(data, &v). For streaming, json.NewEncoder(w).Encode(v) writes to an io.Writer and json.NewDecoder(r).Decode(&v) reads from an io.Reader — both add or expect a trailing newline, which matters for line-delimited JSON.

Struct tags control field naming and behaviour. type User struct { Name string \`json:"name"\`; Age int \`json:"age,omitempty"\` } maps the Go field Name to the JSON key name. The omitempty option drops the field from output when it equals the zero value for its type, which is the right default for optional API fields. The - tag value excludes a field entirely: Secret string \`json:"-"\` never appears in the encoded form and is ignored on decode.

Field visibility matters. encoding/json only marshals exported fields (uppercase first letter). A lowercase field is invisible — silently. This catches every Go newcomer once. If you need a struct with private fields serialised, write a MarshalJSON method that converts to a separate exported shape.

Decoding into map[string]any (or interface{}) is the escape hatch when the shape is unknown or wildly variable. JSON numbers decode to float64 by default, which loses precision past 2^53. For large integers, use json.Decoder with UseNumber() so numbers decode as json.Number (a string-backed wrapper) and you can extract Int64() yourself.

Custom (de)serialisation is the MarshalJSON() ([]byte, error) and UnmarshalJSON(data []byte) error pair. Implement them on a type when the on-wire shape differs from the in-memory shape — for example, encoding a time.Time as a Unix epoch integer instead of RFC 3339.

Performance trade-offs are worth knowing. encoding/json uses reflection and is fast enough for most APIs (tens to hundreds of MB/s), but heavily benchmarked workloads sometimes adopt code-generated codecs like easyjson or sonic for 2-5x speedups. Profile before switching.`,
    code: `package main

import (
    "encoding/json"
    "fmt"
)

type User struct {
    Name string \`json:"name"\`
    Age  int    \`json:"age,omitempty"\`
}

func main() {
    u := User{Name: "Ada"}
    b, _ := json.Marshal(u)
    fmt.Println(string(b))

    var back User
    _ = json.Unmarshal([]byte(\`{"name":"Bo","age":30}\`), &back)
    fmt.Println(back.Name, back.Age)
}`,
    exercise: {
      prompt: `Define type Book struct { Title string with json tag "title"; Pages int with json tag "pages" }. Marshal Book{Title: "Go", Pages: 200} and print the resulting JSON string. Expected: {"title":"Go","pages":200}.`,
      starter: `package main

import (
    "encoding/json"
    "fmt"
)

// type Book ...

func main() {
    // marshal and print
    _ = json.Marshal
    fmt.Println("")
}
`,
      expected: '{"title":"Go","pages":200}',
    },
    takeaways: [
      'json.Marshal / Unmarshal convert between Go values and JSON; Encoder/Decoder stream them.',
      'Struct tags `json:"name,omitempty"` control field naming and zero-value omission.',
      'Only exported (uppercase) fields are serialised — unexported fields silently vanish.',
      'Decoding numbers into interface{} produces float64; use json.Number for precise integers.',
    ],
    mistakes: [
      'Forgetting to capitalise a struct field — encoding/json silently skips it.',
      'Passing a value (not a pointer) to Unmarshal — compile error or wrong target.',
      'Assuming float64 round-trips a 64-bit ID without loss — it does not past 2^53.',
    ],
    next: 'testing-with-table-driven-tests',
  },
  {
    id: 'testing-with-table-driven-tests',
    title: 'Stdlib · Testing with Table-Driven Tests',
    subtitle: 'The testing package plus go test plus the table-driven pattern — the standard Go rig.',
    intro: `Go's test framework lives in the standard library. Any file named *_test.go in the same package as the code under test is a test file; it does not ship in the production binary. A test function has the signature func TestX(t *testing.T) and lives at package level. Run go test from the package directory; go test ./... runs every test in the module.

Inside a test, call t.Errorf to record a failure and continue, t.Fatalf to fail and stop the current test immediately, t.Helper() at the top of a helper function so failure messages point at the caller rather than the helper. t.Run("name", func(t *testing.T) { ... }) creates a sub-test — independently named, independently failable, eligible for t.Parallel() and selective execution with go test -run TestX/name.

The table-driven pattern is the Go idiom for testing many cases without duplicating boilerplate. Build a slice of structs, each describing one case (inputs and expected output), then loop and assert: for _, tc := range cases { t.Run(tc.name, func(t *testing.T) { got := fn(tc.in); if got != tc.want { t.Errorf("%v: got %v want %v", tc.in, got, tc.want) } }) }. The shape is so common that gopls offers a generate-table-test code action.

Benchmarks (func BenchmarkX(b *testing.B)) and examples (func ExampleX()) live in the same files. go test -bench=. runs benchmarks; examples double as documentation and as assertions on output. The // Output: line at the end of an example becomes the expected stdout — if the example prints something different, go test fails.

Coverage comes for free: go test -cover prints a percentage; go test -coverprofile=cover.out produces a file you can render with go tool cover -html=cover.out. Aim for coverage of meaningful behaviour, not lines — chasing 100% leads to tests of obvious branches that catch nothing real.

For HTTP handlers, net/http/httptest provides a NewRecorder() to capture the response and a NewServer() to spin up a real socket-backed test server. For temp files and directories, t.TempDir() returns a path automatically cleaned up at test end.`,
    code: `package main

// Sketch — not runnable as main; shown for the testing idiom.
//
// func Add(a, b int) int { return a + b }
//
// func TestAdd(t *testing.T) {
//     cases := []struct {
//         name     string
//         a, b     int
//         want     int
//     }{
//         {"zero", 0, 0, 0},
//         {"positive", 2, 3, 5},
//         {"negative", -2, -3, -5},
//     }
//     for _, tc := range cases {
//         t.Run(tc.name, func(t *testing.T) {
//             if got := Add(tc.a, tc.b); got != tc.want {
//                 t.Errorf("got %d want %d", got, tc.want)
//             }
//         })
//     }
// }
import "fmt"

func main() {
    fmt.Println("see comment for the canonical table-driven shape")
}`,
    exercise: {
      prompt: `Write a function reverse(s string) string that reverses a string by rune. In main, print reverse("Go!"). Expected: !oG.`,
      starter: `package main

import "fmt"

// add reverse(s string) string

func main() {
    fmt.Println("") // print reverse("Go!")
}
`,
      expected: '!oG',
    },
    takeaways: [
      '*_test.go files in the package compile only under go test.',
      't.Errorf records a failure; t.Fatalf stops the test; t.Helper marks helper functions.',
      'Table-driven tests with t.Run per case give clear names and parallelisable subtests.',
      'httptest, t.TempDir, and Examples cover handlers, filesystem fixtures, and doc-as-test.',
    ],
    mistakes: [
      'Using fmt.Println for assertions instead of t.Errorf — go test never sees the failure.',
      'Sharing state across subtests without resetting — flaky behaviour under -parallel.',
      'Chasing 100% line coverage and writing tests that assert syntax rather than behaviour.',
    ],
    next: 'packages-and-main',
  },
];

// ── Node.js ──────────────────────────────────────────────────────
// Three sub-modules: Foundations (10), Async & I/O (12), HTTP & APIs (10).
// Titles are prefixed with the sub-module so the flat lesson list groups
// visually inside CoursePage's sidebar.
const NODE_LESSONS = [
  // ─── Foundations (10) ──────────────────────────────────────────
  {
    id: 'what-is-node',
    title: 'Foundations · What is Node.js',
    intro: `Node.js is Google's V8 JavaScript engine wrapped in a C++ runtime that adds non-blocking I/O, a module system, and access to the operating system. Before Node, JavaScript only ran inside browsers, with no way to read files, listen on sockets, or spawn processes. In 2009 Ryan Dahl took V8, bolted libuv (an event loop and async I/O library) onto it, and shipped a single binary you can run from the terminal.

The key architectural choice is single-threaded, event-driven, non-blocking I/O. One JavaScript thread runs your code; every disk read, network request, or timer is handed off to libuv, which uses OS primitives (epoll on Linux, kqueue on macOS, IOCP on Windows) plus a small thread pool. When the I/O finishes, libuv schedules your callback back onto the main thread. The upshot: thousands of concurrent connections from one process, with no thread-per-request overhead.

This makes Node a strong fit for I/O-bound workloads: HTTP APIs, real-time chat, build tools, CLIs, scrapers, proxies, glue scripts. It is a poor fit for CPU-bound work — image processing, video encoding, big-number math — because one slow callback blocks every other connection. For CPU-heavy work, offload to worker threads or a separate service.

Node also bundles npm (the world's largest package registry, ~2M modules) and a standard library covering filesystem, HTTP, crypto, streams, and child processes. You can ship a server, a CLI, or a desktop app (via Electron) with the same skills.

Today most of the modern backend stack — Express, Next.js, Vercel functions, GitHub's build pipeline, Slack's desktop app, VS Code itself — runs on Node.`,
    code: `// Save as hello.js, run with: node hello.js
const os = require('os');
console.log('Node version:', process.version);
console.log('Platform:', os.platform(), os.arch());
console.log('Free memory (MB):', Math.round(os.freemem() / 1024 / 1024));`,
    exercise: {
      prompt: 'Print "Hello from Node " followed by process.version. Expected first token: Hello',
      starter: `// console.log("Hello from Node " + process.version);
`,
      expected: 'Hello',
    },
    takeaways: [
      'Node = V8 engine + libuv event loop + standard library + npm.',
      'One JS thread, async I/O on a libuv thread pool — high concurrency, low overhead.',
      'Great for I/O-bound work; weak for CPU-bound work without worker threads.',
      'The same skill set ships APIs, CLIs, build tools, and Electron desktop apps.',
    ],
    mistakes: [
      'Assuming Node has the browser globals (window, document) — it does not.',
      'Running CPU-heavy work on the main thread and blocking every other request.',
      'Reaching for npm packages for things the standard library already covers (fs, http, crypto).',
    ],
    next: { label: 'V8 engine', href: '#/courses/node-basics/v8-engine' },
  },
  {
    id: 'v8-engine',
    title: 'Foundations · The V8 engine',
    intro: `V8 is the JavaScript engine that ships inside Chrome, Edge, and Node. Written in C++ by Google, it turns your JavaScript source into highly optimized machine code at runtime. Understanding the rough shape of V8's pipeline pays off when you read flame graphs or hunt deopt bugs.

The pipeline has four stages. Parser builds an abstract syntax tree from source text. Ignition is the bytecode interpreter — it executes immediately so your script starts fast. TurboFan is the optimizing compiler — once a function is hot (called many times with consistent argument types), V8 speculatively compiles it to machine code, assuming the types it has seen so far. Liftoff is a similar tier for WebAssembly. If your code violates the speculation (a function that always saw integers suddenly gets a string), V8 deoptimizes back to bytecode and may try again later.

Two consequences matter day to day. First, monomorphic call sites are faster than polymorphic ones. A function that adds two numbers will run 10x faster than the same function called with mixed number/string args, because TurboFan can inline the integer add. Second, hidden classes (V8's internal shape descriptors for objects) are shared across objects with identical property layouts in the same order. Adding properties in different orders on similar objects forks the hidden class tree and slows property lookups.

V8 manages memory with a generational garbage collector. New objects live in young space, collected often with a fast scavenge. Survivors get promoted to old space, collected less often with mark-and-sweep + mark-and-compact. Big objects skip young space entirely. You can inspect GC behaviour with the --trace-gc flag.

Node updates V8 with every major release; new ES features land in Node a few months after Chrome.`,
    code: `// %FunctionName intrinsics are only available with --allow-natives-syntax
// node --allow-natives-syntax v8.js
function add(a, b) { return a + b; }
for (let i = 0; i < 100000; i++) add(i, i + 1);
// Inspect the optimization status:
// console.log(%GetOptimizationStatus(add));
console.log('Hot function ran', 100000, 'times');`,
    exercise: {
      prompt: 'Loop a function that returns a + b one million times and log the elapsed milliseconds. Expected substring: ms',
      starter: `const t = Date.now();
function add(a, b) { return a + b; }
for (let i = 0; i < 1_000_000; i++) add(i, i);
console.log((Date.now() - t) + ' ms');
`,
      expected: 'ms',
    },
    takeaways: [
      'V8 has two execution tiers: Ignition (bytecode) and TurboFan (optimized machine code).',
      'Hot, monomorphic functions get TurboFan-compiled; type churn forces deoptimization.',
      'Hidden classes mean property insertion order affects lookup speed.',
      'Generational GC: scavenge young space, mark-and-sweep/compact old space.',
    ],
    mistakes: [
      'Adding properties to objects in different orders — forks hidden classes, slows everything.',
      'Mixing number and string arguments through a hot path — polymorphic, slower.',
      'Profiling on a cold function — measure after warmup so TurboFan has kicked in.',
    ],
    next: { label: 'The REPL', href: '#/courses/node-basics/node-repl' },
  },
  {
    id: 'node-repl',
    title: 'Foundations · The Node REPL',
    intro: `Type node with no arguments and you drop into an interactive Read-Eval-Print Loop. The REPL is the fastest way to try out an API, inspect a module's surface, or sketch a one-liner before committing it to a file.

The basic loop is simple: you type an expression, press Enter, Node evaluates it, and the result of the last expression prints back. Multi-line input is detected automatically — if your expression is incomplete (open brace, unbalanced paren) the prompt changes to ... and waits. Press Ctrl+C once to cancel the current line; twice to exit. Or type .exit.

Useful built-in commands all start with a dot. .help lists them. .load file.js evaluates the contents of a file in the REPL context. .save file.js writes the current session to disk. .editor opens a multi-line editor inside the prompt — finish with Ctrl+D. .clear resets the context.

The _ variable holds the last evaluated value, which is great for chained exploration: read a JSON file, then poke at _.foo without recomputing. The REPL also auto-completes property names with Tab — press it twice on an empty prompt to see every global.

You can start the REPL inside any program by requiring 'repl' and calling .start(). This is how the Chrome DevTools Node debugger and many CLIs implement their own custom prompts.

A practical workflow: when learning a new module, npm i it, then node, then const lib = require('libname'), then Object.keys(lib) and explore. Faster than reading docs. Be aware the top-level await in modern Node REPLs lets you write await fetch(...) directly without wrapping it in an async function.`,
    code: `// Start with: node
// Then paste these lines one at a time:
// > const fs = require('fs');
// > fs.readdirSync('.').slice(0, 3);
// > _.length          // _ is the previous result
// > .help             // list dot-commands
// > .exit             // quit
console.log('REPL tip: press Tab twice on a blank prompt to see every global.');`,
    exercise: {
      prompt: 'Print the message "REPL ready". Expected output: REPL ready',
      starter: `console.log('REPL ready');
`,
      expected: 'REPL ready',
    },
    takeaways: [
      'node with no args opens the REPL; .exit or Ctrl+C twice leaves.',
      'Dot-commands: .help, .load, .save, .editor, .clear.',
      'The _ variable holds the last evaluated value.',
      'Top-level await works in the modern REPL — useful for fetch and dynamic import.',
    ],
    mistakes: [
      'Treating the REPL like a script — variables defined with let/const do not persist across .clear.',
      'Forgetting that requiring the same module twice returns the cached instance.',
      'Pasting large blocks line by line and missing closing braces — use .editor for multi-line.',
    ],
    next: { label: 'CommonJS modules', href: '#/courses/node-basics/modules-cjs' },
  },
  {
    id: 'modules-cjs',
    title: 'Foundations · CommonJS modules',
    intro: `Before ES modules, Node used CommonJS — a synchronous, function-wrapped module format invented for server-side JavaScript. Every .js file (without "type": "module") is a CommonJS module. Each file is wrapped in an implicit function so its top-level variables stay private.

The four CommonJS globals you use daily are require, module, exports, and __dirname. require('./foo') returns whatever the foo.js module assigned to module.exports. module.exports starts out as an empty object; you can replace it wholesale (module.exports = function () {}) or attach properties (exports.foo = 1). The shorthand exports references the same object as module.exports, but reassigning exports does nothing because the wrapper only exposes module.exports.

Resolution follows a deterministic algorithm: relative paths resolve against the current file's directory; bare names walk up node_modules folders; each folder's package.json main field points to the entry file. Built-in modules (fs, http, path) shortcut the lookup. Results are cached — requiring the same path twice gives you the same instance, which is how singleton patterns work in Node.

CommonJS is synchronous: require blocks until the target file is read, parsed, and executed. This is fine on startup but inadvisable inside hot request paths. It also creates a problem for ESM interoperability — ESM is async by design.

Today new projects should prefer ES modules, but you will see CommonJS everywhere: legacy packages, internal tooling, the entire pre-2020 npm ecosystem. Knowing both formats is non-negotiable.`,
    code: `// math.js
function add(a, b) { return a + b; }
function mul(a, b) { return a * b; }
module.exports = { add, mul };

// main.js (in the same folder)
// const { add } = require('./math');
// console.log(add(2, 3));
console.log('CommonJS exports a single object: module.exports');`,
    exercise: {
      prompt: 'Print the string "exports". Expected output: exports',
      starter: `console.log('exports');
`,
      expected: 'exports',
    },
    takeaways: [
      'CommonJS wraps every file in a function — module-scoped variables stay private.',
      'module.exports is the object require returns; exports is a shortcut to the same object.',
      'Resolution: relative paths, then node_modules walk, then package.json main.',
      'require is synchronous and cached — same path returns the same instance.',
    ],
    mistakes: [
      'Reassigning exports = something — only module.exports = ... actually exports it.',
      'Circular requires returning partial exports — the half-initialised module is returned.',
      'Calling require() inside hot paths instead of at module top — synchronous disk I/O on every call.',
    ],
    next: { label: 'ES modules', href: '#/courses/node-basics/modules-esm' },
  },
  {
    id: 'modules-esm',
    title: 'Foundations · ES modules in Node',
    intro: `ES modules (ESM) are the standard JavaScript module format defined in ES2015 and adopted by browsers in 2017. Node added stable ESM support in v14. ESM is static, asynchronous, and tree-shakeable — the static structure lets bundlers drop unused exports at build time.

To opt a file into ESM, either set "type": "module" in the nearest package.json or use the .mjs file extension. Then top-level import and export work as expected. import { add } from './math.js' pulls a named export; import math from './math.js' pulls the default. The from specifier must include the full filename including extension — no auto-appending of .js. This trips up everyone moving from CommonJS.

ESM is asynchronous under the hood. The module graph is resolved, fetched, parsed, and linked before any code runs. This enables top-level await: an ESM module can await a fetch or dynamic import at the top level, and the parent module waits before considering it loaded.

Interop with CommonJS is partial. ESM can import from CommonJS — the entire module.exports becomes the default import — but CommonJS cannot synchronously require ESM (it would have to await). Use import('./esm-file.mjs') from CommonJS to get a Promise of the module.

Node distinguishes import paths from URL specifiers. import 'fs' loads the built-in. import './foo.js' is relative. import 'pkg' resolves via the package's exports field in its package.json. The exports field replaces the older main field and lets packages publish multiple entry points and condition them on environment (browser vs node, esm vs cjs).

For new projects, default to ESM. Use CommonJS only when a dependency forces it.`,
    code: `// math.mjs
export const add = (a, b) => a + b;
export default (a, b) => a * b;

// main.mjs
// import multiply, { add } from './math.mjs';
// console.log(add(2, 3), multiply(2, 3));
console.log('ESM is static and tree-shakeable');`,
    exercise: {
      prompt: 'Print the string "esm". Expected output: esm',
      starter: `console.log('esm');
`,
      expected: 'esm',
    },
    takeaways: [
      'ESM is opt-in via "type":"module" in package.json or the .mjs extension.',
      'Import specifiers must include the file extension — no auto-append.',
      'Top-level await works in ESM and waits before the parent module proceeds.',
      'ESM can import CommonJS as a default; the reverse needs dynamic import().',
    ],
    mistakes: [
      'Omitting the file extension on relative imports — Node throws ERR_MODULE_NOT_FOUND.',
      'Trying to require() an ESM file from CommonJS — must use dynamic import() instead.',
      'Mixing named and default exports without thinking — pick a convention per module.',
    ],
    next: { label: 'npm and package.json', href: '#/courses/node-basics/npm-package-json' },
  },
  {
    id: 'npm-package-json',
    title: 'Foundations · npm and package.json',
    intro: `npm — Node Package Manager — is both a CLI and a public registry. package.json is the manifest that describes your project to npm, to bundlers, and to other developers. Running npm init -y creates one with sensible defaults; npm i <pkg> installs a dependency and records it.

The manifest has a small set of fields you will touch constantly. name and version identify the package (version follows semver). main is the CommonJS entry, module is the ESM entry, and exports lets you publish multiple conditional entry points. scripts maps short commands (test, build, dev) to shell strings — npm run build is shorthand for executing that string with node_modules/.bin on PATH. dependencies are runtime requirements; devDependencies are build-time only (test runners, bundlers, linters). peerDependencies declare a host package you expect the consumer to provide.

Installation creates a flat node_modules tree (npm flattens shared deps to the top level when versions are compatible) and a package-lock.json that pins exact versions of every transitive dep. Commit the lockfile — it guarantees reproducible installs. npm ci installs strictly from the lock, faster and safer for CI.

Workspaces let one repo host multiple packages under one root package.json — useful for monorepos. npm run --workspaces test runs the test script in every workspace.

Alternatives exist: pnpm uses a global content-addressable store with symlinks (fast, disk-efficient), Yarn pioneered modern lockfiles, Bun bundles its own runtime + package manager. For new projects, pnpm is the modern default; npm is the safe default if you're collaborating with the wider community.`,
    code: `// package.json (minimum useful shape)
const pkg = {
  name: 'my-app',
  version: '0.1.0',
  type: 'module',
  main: 'src/index.js',
  scripts: {
    start: 'node src/index.js',
    test: 'node --test',
  },
  dependencies: { express: '^4.19.0' },
  devDependencies: { vitest: '^1.0.0' },
};
console.log('package.json keys:', Object.keys(pkg).join(', '));`,
    exercise: {
      prompt: 'Print the word "lockfile". Expected output: lockfile',
      starter: `console.log('lockfile');
`,
      expected: 'lockfile',
    },
    takeaways: [
      'package.json declares metadata, scripts, and three kinds of dependencies.',
      'Commit package-lock.json — npm ci installs exact pinned versions in CI.',
      'Scripts run with node_modules/.bin on PATH, so local binaries work without paths.',
      'Workspaces support monorepos: one root manifest, many packages.',
    ],
    mistakes: [
      'Forgetting to commit the lockfile — every install drifts and CI breaks mysteriously.',
      'Putting build-only tools in dependencies — bloats production install size.',
      'Mixing npm and yarn in the same repo — two lockfiles get out of sync.',
    ],
    next: { label: 'Semver', href: '#/courses/node-basics/semver' },
  },
  {
    id: 'semver',
    title: 'Foundations · Semantic versioning',
    intro: `Semver — semantic versioning — is the convention every npm package follows. A version is three numbers: MAJOR.MINOR.PATCH. PATCH increments for backward-compatible bug fixes. MINOR increments for backward-compatible new features. MAJOR increments for breaking changes that can break your consumer's code. The package 1.4.7 to 1.5.0 means new features were added safely; 1.5.0 to 2.0.0 means the upgrade may require code changes.

In package.json, version ranges use prefixes. ^1.4.7 means "any compatible release with major version 1" — so 1.4.8, 1.5.0, even 1.99.0, but not 2.0.0. ~1.4.7 means "any patch release of 1.4" — so 1.4.8 and 1.4.99, but not 1.5.0. A bare 1.4.7 pins exactly. * or "latest" pins to whatever the registry currently considers latest — almost always a mistake for libraries you depend on.

Pre-1.0 versions are a special case: MINOR is allowed to break. ^0.4.7 is treated as ~0.4.7 by npm. Many influential packages stay sub-1.0 forever (this is debated — some argue it abuses the convention).

Pre-releases like 1.5.0-rc.1 sort before 1.5.0. Use them for opt-in testing; install them with npm i pkg@next or npm i pkg@1.5.0-rc.1.

The dist-tags system lets a package publish multiple parallel streams: latest, next, beta. npm i pkg@beta installs the latest beta. Maintainers use this to ship preview releases without affecting the default install.

When debugging a regression after npm update, check the diff in package-lock.json — the minor version bumps under your ^ ranges are the prime suspects.`,
    code: `function semverBucket(prev, next) {
  const [pm] = prev.split('.').map(Number);
  const [nm] = next.split('.').map(Number);
  if (nm > pm) return 'major';
  const [, pmi] = prev.split('.').map(Number);
  const [, nmi] = next.split('.').map(Number);
  if (nmi > pmi) return 'minor';
  return 'patch';
}
console.log(semverBucket('1.4.7', '1.5.0'));
console.log(semverBucket('1.5.0', '2.0.0'));`,
    exercise: {
      prompt: 'Print the word "patch". Expected output: patch',
      starter: `console.log('patch');
`,
      expected: 'patch',
    },
    takeaways: [
      'MAJOR.MINOR.PATCH — patch fixes bugs, minor adds features, major breaks API.',
      '^1.4.7 allows any 1.x release; ~1.4.7 allows only 1.4.x patches.',
      'Pre-1.0 packages may break on MINOR bumps — pin tighter for stability.',
      'dist-tags (latest, next, beta) let one package ship parallel release streams.',
    ],
    mistakes: [
      'Using * or "latest" in dependencies — guarantees future breakage.',
      'Ignoring the lockfile diff after npm update — minor bumps inside ^ ranges sneak in.',
      'Bumping MINOR for a breaking change to "stay sub-1.0" — confuses consumers.',
    ],
    next: { label: 'Dependency tree', href: '#/courses/node-basics/dependency-tree' },
  },
  {
    id: 'dependency-tree',
    title: 'Foundations · The dependency tree',
    intro: `When you install a single package, npm may install hundreds of transitive dependencies. Understanding how this tree is laid out, deduplicated, and resolved is essential for debugging weird errors like "two copies of React" or "this hook only works inside a function component".

npm builds a tree where each package's dependencies live in its node_modules/ folder. Naively this would explode into deeply nested duplicates. The optimization: npm hoists compatible versions to the top-level node_modules folder, so most packages end up flat. Two packages requiring different incompatible versions of lodash will each get their own nested copy. The flat layout means require('lodash') from any depth resolves to the same instance — usually.

Two pitfalls follow. First, two installed copies of a singleton library (React, RxJS, GraphQL) cause weird breakage: instanceof checks fail across copies, module-level globals duplicate. npm dedupe and pnpm's strict tree avoid this; you can also force resolution with the overrides field in package.json. Second, "phantom dependencies" — code that requires a package not in its own package.json but available because npm hoisted it. This works locally and breaks when the hoist layout changes. pnpm prevents phantom deps by default.

Inspect your tree with npm ls <pkg> (shows every version installed and where), npm explain <pkg> (shows why a package is installed), and npm outdated (shows newer versions available). For audits use npm audit — flags known CVEs.

Modern best practice: lockfile committed, pnpm or npm ci in CI, peerDependencies declared honestly, overrides used surgically when you need to pin a transitive dep across a security issue.`,
    code: `// Inspect your installed tree shape:
// $ npm ls react
// $ npm explain @types/node
// $ npm outdated
const fakeTree = {
  app: { react: '18.2.0', express: '4.19.0' },
  'react/dependencies': { 'loose-envify': '1.4.0' },
  'express/dependencies': { 'body-parser': '1.20.0' },
};
console.log('Top-level deps:', Object.keys(fakeTree.app).join(', '));`,
    exercise: {
      prompt: 'Print the word "tree". Expected output: tree',
      starter: `console.log('tree');
`,
      expected: 'tree',
    },
    takeaways: [
      'npm flattens compatible deps to top-level node_modules; incompatible versions nest.',
      'Two copies of a singleton library breaks instanceof and shared module state.',
      'Phantom dependencies — using a package not in your own manifest — break unexpectedly.',
      'npm ls / npm explain / npm outdated are the diagnostic trio.',
    ],
    mistakes: [
      'Relying on hoisted packages you never declared as deps — works until it does not.',
      'Skipping npm audit — known CVEs ship to production unnoticed.',
      'Pinning every dep to exact versions and never updating — security debt accumulates.',
    ],
    next: { label: 'process and globals', href: '#/courses/node-basics/process-globals' },
  },
  {
    id: 'process-globals',
    title: "Foundations · process and globals",
    intro: `Node injects a small set of globals that do not exist in browsers. The most important is process, an EventEmitter that represents the running Node process itself. process.argv is the command-line arguments array — [0] is the node binary, [1] is your script, and [2..] are the user arguments. process.env is an object of environment variables. process.cwd() returns the current working directory; process.chdir() changes it. process.exit(code) terminates immediately with the given exit code (0 means success).

process also emits lifecycle events. exit fires when the event loop drains. beforeExit fires when there is nothing left to do but Node has not exited yet — your last chance to schedule more work. uncaughtException fires for unhandled synchronous errors; unhandledRejection for unhandled promise rejections. Both should log and exit — never swallow them, because the process may be in a corrupt state.

Other globals worth knowing: __dirname and __filename (only in CommonJS — in ESM use import.meta.url with fileURLToPath); Buffer for binary data; setImmediate, setTimeout, setInterval; queueMicrotask for scheduling a microtask; globalThis as the universal global object reference.

The Node global object is similar to but not identical to the browser window. There is no document, no localStorage, no fetch in older Node (added in 18). Trying to share code between browser and Node usually means writing isomorphic modules or relying on a bundler with platform conditions.

A practical pattern: read configuration from process.env at module top, validate it once, and export typed constants. Crashing at startup with a clear error beats silently misbehaving in production.`,
    code: `console.log('argv:', process.argv);
console.log('cwd:', process.cwd());
console.log('node version:', process.version);
console.log('NODE_ENV:', process.env.NODE_ENV || '(unset)');
process.on('exit', (code) => console.log('exiting with code', code));`,
    exercise: {
      prompt: 'Print the word "process". Expected output: process',
      starter: `console.log('process');
`,
      expected: 'process',
    },
    takeaways: [
      'process is the global handle to the running Node process: argv, env, cwd, exit.',
      'Lifecycle events: exit, beforeExit, uncaughtException, unhandledRejection.',
      '__dirname and __filename only exist in CommonJS; in ESM use import.meta.url.',
      'Validate process.env at startup — crash fast on missing config.',
    ],
    mistakes: [
      'Calling process.exit() from inside a request handler — kills every other in-flight request.',
      'Reading process.env on the hot path repeatedly — read once, cache.',
      'Swallowing uncaughtException to keep the process alive — state may already be corrupt.',
    ],
    next: { label: 'Error handling', href: '#/courses/node-basics/error-handling' },
  },
  {
    id: 'error-handling',
    title: 'Foundations · Error handling',
    intro: `JavaScript errors come in three flavors in Node: synchronous throws, callback-style errors (first argument), and promise rejections. Each demands a different containment strategy, and mixing them is the single most common source of production crashes.

Synchronous throws are caught with try/catch. Wrap any code that may throw (JSON.parse on untrusted input, accessing nested properties, calling functions that may not exist) and either handle the error meaningfully or re-throw with context. Never catch and ignore — at minimum log the error.

Callback-style errors follow the "errback" convention popularized by Node: fn(args..., (err, result) => {}). The callback's first argument is the error (null on success), and the second is the result. Check err first. This convention pre-dates promises and you will still see it in fs, dns, and many older libraries.

Promise rejections propagate via .catch() or via try/catch around await. An unhandled rejection eventually fires the process unhandledRejection event; current Node (since v15) crashes the process by default, which is the right behavior — a rejected promise no one handled is a bug.

The Error class is your friend: extend it for typed errors (class ValidationError extends Error), preserve stack traces, and attach context (err.code, err.statusCode). Use Error.captureStackTrace when wrapping low-level errors so the trace points where the wrapping happened.

A useful pattern: at process boundaries (HTTP handler, queue worker, CLI entry), wrap the whole operation in a single try/catch, log the error with context, and return a meaningful failure response. Inside the operation, let errors propagate — do not try/catch at every layer.`,
    code: `class ValidationError extends Error {
  constructor(message, field) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

function parseAge(s) {
  const n = Number(s);
  if (!Number.isInteger(n) || n < 0) {
    throw new ValidationError('age must be a non-negative integer', 'age');
  }
  return n;
}

try {
  console.log(parseAge('abc'));
} catch (e) {
  console.log(e.name + ': ' + e.field);
}`,
    exercise: {
      prompt: 'Print the word "caught". Expected output: caught',
      starter: `try { throw new Error('boom'); } catch (e) { console.log('caught'); }
`,
      expected: 'caught',
    },
    takeaways: [
      'Three error shapes in Node: sync throws, errback callbacks, promise rejections.',
      'Subclass Error for typed errors; attach .code or .statusCode for handlers to dispatch on.',
      'Wrap operations at process boundaries; let errors propagate inside the operation.',
      'Unhandled rejections crash the process by default in modern Node — that is correct.',
    ],
    mistakes: [
      'Catching and silently swallowing errors — production goes black with no logs.',
      'Throwing strings (throw "bad") instead of Error instances — loses the stack trace.',
      'Try/catch around an await but forgetting that synchronous code before the await also throws.',
    ],
    next: { label: 'Async & I/O: Callbacks', href: '#/courses/node-basics/callbacks' },
  },

  // ─── Async & I/O (12) ──────────────────────────────────────────
  {
    id: 'callbacks',
    title: 'Async & I/O · Callbacks',
    intro: `Callbacks are the original async primitive in JavaScript. A callback is a function you pass to another function so it can be invoked later — when a timer fires, when a file finishes reading, when an HTTP response arrives. Node adopted the "errback" convention: the callback's first argument is an error (or null), the second is the result.

Why callbacks at all? Because JavaScript is single-threaded, blocking on I/O would freeze the entire program. Instead, you hand the runtime a callback, return immediately, and the runtime calls you back when the I/O finishes. The event loop multiplexes thousands of pending callbacks on one thread.

Callback signatures vary slightly. fs.readFile(path, opts, cb) is errback. setTimeout(cb, ms) has no error parameter because timers can't fail. EventEmitters use named events with multiple callbacks per event. The DOM uses event listeners with one Event object. Knowing which family you're in matters.

Three pitfalls are common. First, calling the callback multiple times — if your function fires cb(null, result) on success and cb(err) on error, but you forget a return, both may fire. Second, calling the callback synchronously sometimes and asynchronously other times — pick one and stick to it. Always wrap with process.nextTick if you may have data immediately. Third, losing the callback in the case where you forget to invoke it at all — the caller hangs forever.

Modern Node code prefers promises and async/await, but every promise is built on a callback underneath, and you will work with callback APIs forever — fs.readFile, http.request, dns.lookup, every EventEmitter.`,
    code: `const fs = require('fs');

fs.readFile('package.json', 'utf-8', (err, data) => {
  if (err) {
    console.log('error:', err.code);
    return;
  }
  const pkg = JSON.parse(data);
  console.log('name:', pkg.name);
});

console.log('this line prints first — readFile is async');`,
    exercise: {
      prompt: 'Use setTimeout with a 0ms delay to log "later". Expected output: later',
      starter: `setTimeout(() => console.log('later'), 0);
`,
      expected: 'later',
    },
    takeaways: [
      'A callback is a function passed in to be invoked when async work completes.',
      'Errback convention: first arg is an error (or null), second is the result.',
      'The event loop multiplexes thousands of pending callbacks on one thread.',
      'Modern code wraps callback APIs in promises; the callback layer never goes away.',
    ],
    mistakes: [
      'Calling the callback both on success and on error — forgetting return after cb(err).',
      'Sometimes-sync, sometimes-async callbacks — wrap with process.nextTick for consistency.',
      'Forgetting to call the callback at all — caller hangs forever waiting.',
    ],
    next: { label: 'Callback hell', href: '#/courses/node-basics/callback-hell' },
  },
  {
    id: 'callback-hell',
    title: 'Async & I/O · Callback hell',
    intro: `"Callback hell" — the staircase of nested callbacks that grows rightward — was the defining pain of pre-2015 Node. Read file A, then file B based on A's contents, then file C based on B, and you end up with five levels of indentation, each catching its own error, and any sequencing change requires rewriting the whole block.

The pattern looks like: doA(args, (err, a) => { if (err) return done(err); doB(a, (err, b) => { if (err) return done(err); doC(b, (err, c) => { done(null, c); }); }); }). Beyond aesthetics, this style has three real problems. Error handling is repetitive and easy to forget — one missing if (err) silently loses a failure. Parallel work is awkward — you need a counter and a closure to wait for multiple callbacks. And the local variables you'd want to share across steps don't have a natural scope.

The historical mitigations were the async library (async.series, async.parallel, async.waterfall) which provided combinators, and named functions (extract each callback as a named function at the top level and chain them). Both helped but were workarounds.

The real fix arrived with promises (ES2015) and then async/await (ES2017). A promise represents a future value; .then chains them; await pauses an async function until the awaited promise resolves. The same logic that took 25 lines of nested callbacks fits in 5 lines with await, and try/catch handles errors uniformly.

You will still see callback hell in legacy code. The path to clean it up: util.promisify a callback API into a promise-returning function, then await it. The fs/promises module already does this for the filesystem.`,
    code: `// The classic callback-hell shape (do not write code like this anymore):
function classic(cb) {
  setTimeout(() => {
    setTimeout(() => {
      setTimeout(() => {
        cb(null, 'done');
      }, 10);
    }, 10);
  }, 10);
}
classic((err, r) => console.log(r));`,
    exercise: {
      prompt: 'Print the word "nested". Expected output: nested',
      starter: `console.log('nested');
`,
      expected: 'nested',
    },
    takeaways: [
      'Nested callbacks pyramid right and duplicate error handling — hard to maintain.',
      'Parallel and waterfall flows are awkward in raw callbacks; need a counter or library.',
      'Promises + async/await flatten the pyramid and unify error handling under try/catch.',
      'util.promisify converts errback APIs into promise-returning ones in one line.',
    ],
    mistakes: [
      'Forgetting if (err) return cb(err) in one of the nested layers — silent failure.',
      'Trying to refactor by extracting deeply nested closures — same problem, more files.',
      'Using async libraries in new code — async/await covers all the same cases more clearly.',
    ],
    next: { label: 'Promises', href: '#/courses/node-basics/promises' },
  },
  {
    id: 'promises',
    title: 'Async & I/O · Promises',
    intro: `A Promise represents a future value: either a resolved result or a rejection reason. Promises have three states — pending, fulfilled, rejected — and once they settle they never change. This immutability is what makes them composable.

You consume a promise with .then(onFulfilled, onRejected) and .catch(onRejected). Each .then returns a new promise; throwing inside a .then rejects the chained promise. .finally runs regardless of outcome — good for cleanup like closing files or hiding spinners. The chain is the new staircase, but flat instead of nested.

You create a promise with new Promise((resolve, reject) => {...}). Inside, do your async work and call resolve(value) on success or reject(error) on failure. Most code consumes promises rather than creating them — use the existing promise-returning APIs (fetch, fs/promises, dynamic import) instead of wrapping callbacks manually.

The combinators are the killer feature. Promise.all([a, b, c]) waits for all and rejects on the first failure. Promise.allSettled returns one result per input including rejections — useful when you need every result regardless. Promise.race returns the first to settle (fulfilled or rejected). Promise.any returns the first to fulfill, ignoring rejections.

A subtle point: promises swallow synchronous throws inside their executor. new Promise(() => { throw e }) is equivalent to a rejected promise. This is the right behavior but surprises new users.

Promises are integrated with the event loop's microtask queue, which means .then callbacks run before setTimeout(..., 0) but after the current synchronous code. We'll dig into that next.`,
    code: `function delay(ms, value) {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

Promise.all([delay(10, 'a'), delay(20, 'b'), delay(15, 'c')])
  .then((results) => console.log('all:', results.join(',')))
  .catch((err) => console.log('one failed:', err.message));`,
    exercise: {
      prompt: 'Resolve a promise with the string "ok" and log it. Expected output: ok',
      starter: `Promise.resolve('ok').then(console.log);
`,
      expected: 'ok',
    },
    takeaways: [
      'Three states: pending, fulfilled, rejected — settled state is immutable.',
      'Each .then returns a new promise; throwing inside .then rejects the chain.',
      'Combinators: Promise.all, allSettled, race, any — pick by the semantics you need.',
      'Promise executor swallows sync throws as rejections — equivalent to reject(e).',
    ],
    mistakes: [
      'Forgetting to return the inner promise from a .then — chain detaches and races.',
      'Mixing .then with await in the same function — pick one style per function.',
      'Using Promise.all when you wanted allSettled — one rejection kills every result.',
    ],
    next: { label: 'async / await', href: '#/courses/node-basics/async-await' },
  },
  {
    id: 'async-await',
    title: 'Async & I/O · async / await',
    intro: `async / await is syntactic sugar over promises. Mark a function async and it always returns a promise. Use await inside it to pause until a promise settles, then resume with the resolved value (or throw the rejected reason). Errors flow through try/catch like synchronous code.

The transformation is mechanical: every await splits the function into a continuation, the runtime resumes after the awaited promise settles. The function looks linear and reads top-to-bottom, but it actually yields control at each await — other code (other requests, timers, I/O completions) can run in between. The asynchrony has not gone away, only the staircase has.

Three patterns are essential. Sequential: const a = await fetchA(); const b = await fetchB(a); — each await blocks the function. Parallel: const [a, b] = await Promise.all([fetchA(), fetchB()]); — fire both, wait for both. Error handling: try { const a = await fetchA(); } catch (e) { handle(e); } — same shape as sync code.

Top-level await works in ES modules. You can write const data = await fetch(url) at the top of a module file without wrapping it in an async function. Useful for one-shot init in CLIs and tests.

The biggest performance trap is accidentally serializing parallel work. for (const item of items) { await fetch(item); } runs sequentially; await Promise.all(items.map(fetch)) runs in parallel. The first is what you want when each request depends on the previous. The second is what you want when they are independent.

await on a non-promise value resolves immediately with that value — useful when a function sometimes returns sync, sometimes async.`,
    code: `function delay(ms, value) {
  return new Promise((r) => setTimeout(() => r(value), ms));
}

async function main() {
  const t = Date.now();
  // Parallel — both timers run at once:
  const [a, b] = await Promise.all([delay(50, 'a'), delay(50, 'b')]);
  console.log(a + b, Date.now() - t, 'ms');
}

main();`,
    exercise: {
      prompt: 'Write an async function returning "hi" and log its resolved value. Expected output: hi',
      starter: `(async () => {
  const v = await Promise.resolve('hi');
  console.log(v);
})();
`,
      expected: 'hi',
    },
    takeaways: [
      'async functions always return a promise; await pauses for one to settle.',
      'Errors flow through try/catch — same shape as synchronous error handling.',
      'Top-level await works in ESM; useful for module init.',
      'await on a non-promise resolves immediately — works for sometimes-sync APIs.',
    ],
    mistakes: [
      'await inside a for loop when items are independent — serial when it should be parallel.',
      'Forgetting that await inside .map runs in parallel — map returns an array of promises.',
      'Marking a function async but never awaiting inside it — pointless wrap.',
    ],
    next: { label: 'Event loop', href: '#/courses/node-basics/event-loop' },
  },
  {
    id: 'event-loop',
    title: 'Async & I/O · The event loop',
    intro: `The Node event loop is the single thread that runs your JavaScript and processes callbacks for completed async work. Understanding its phases explains why some callbacks run "before" others even when they "should" be simultaneous.

libuv implements the loop. Each iteration (tick) walks through phases in order: timers (setTimeout, setInterval callbacks whose time has elapsed), pending callbacks (some system errors), idle/prepare (internal), poll (retrieve new I/O events; execute most I/O callbacks; block here if nothing else to do), check (setImmediate callbacks), close callbacks (socket.on('close') and similar). After each phase, microtasks drain.

Microtasks include resolved promises (.then continuations) and queueMicrotask callbacks. Crucially, the microtask queue drains completely between every phase and between every callback within a phase. This is why a Promise.resolve().then(x) callback can fire before a setTimeout(x, 0) callback even though both look "immediate".

process.nextTick is separate again — it drains before microtasks. It's a Node-specific construct from before microtasks were standardized. Practical rule: process.nextTick before any other queue, then microtasks, then the next phase. Overusing nextTick can starve I/O, because the loop never advances to the poll phase.

setImmediate vs setTimeout(fn, 0): setImmediate fires in the check phase of the next iteration, setTimeout(fn, 0) fires when timers phase considers 0ms elapsed (clamped to ~1ms). Inside an I/O callback, setImmediate runs first because timers phase is past for this tick.

The takeaway: don't block the loop. Any long synchronous operation (parsing a giant JSON file, a CPU-heavy compute) freezes every other connection. Offload to worker threads or break the work into chunks with setImmediate.`,
    code: `console.log('1 sync');
setTimeout(() => console.log('4 timeout'), 0);
setImmediate(() => console.log('5 immediate'));
Promise.resolve().then(() => console.log('3 microtask'));
process.nextTick(() => console.log('2 nextTick'));
// Likely order: 1, 2, 3, 4 or 5, 4 or 5 — depends on phase timing.`,
    exercise: {
      prompt: 'Print "loop". Expected output: loop',
      starter: `console.log('loop');
`,
      expected: 'loop',
    },
    takeaways: [
      'Event loop phases: timers, pending, poll, check, close — microtasks drain between each.',
      'process.nextTick drains before microtasks; overuse starves I/O.',
      'setImmediate runs in the check phase; setTimeout(fn,0) in the timers phase.',
      'Long synchronous work blocks the loop — break up CPU-heavy work or offload it.',
    ],
    mistakes: [
      'Spinning process.nextTick recursively — loop never advances, I/O hangs.',
      'Assuming setTimeout(fn, 0) is truly 0ms — clamped to ~1ms; not the fastest scheduling.',
      'Doing a 200ms JSON.parse on the main thread — every other request waits 200ms.',
    ],
    next: { label: 'Microtask vs macrotask', href: '#/courses/node-basics/microtask-macrotask' },
  },
  {
    id: 'microtask-macrotask',
    title: 'Async & I/O · Microtasks vs macrotasks',
    intro: `Every async callback in JavaScript falls into one of two queues: microtasks or macrotasks. Macrotasks are the things that schedule via event loop phases — timers (setTimeout, setInterval), I/O callbacks, setImmediate, MessageChannel messages. Microtasks are promise continuations (.then, .catch, .finally) and queueMicrotask callbacks.

The hard rule: the microtask queue drains completely before the loop moves to the next macrotask. After every macrotask, every queued microtask runs, including any microtasks scheduled during that drain. Only when the microtask queue is empty does the next macrotask begin.

This is why Promise.resolve().then(x) wins over setTimeout(x, 0). Both are scheduled in the current macrotask. When the current macrotask ends, microtasks drain — x from the promise runs. Then the next macrotask (the timer callback) fires.

A pathological pattern: queueMicrotask(fn) where fn schedules another queueMicrotask. The microtask queue never drains, the loop never advances, and the process appears hung. The same risk exists with chained Promise.resolve().then(loop). Modern engines have safeguards (some throw an UnhandledRejection after a recursion depth limit), but you should not rely on them.

Node also has process.nextTick, which is technically a separate queue draining before microtasks. It pre-dates the microtask spec and is used internally by Node for synchronization. In application code, prefer queueMicrotask or promises.

In the browser, the same microtask/macrotask split applies, plus animation frames (requestAnimationFrame) which run before the paint step. Node has no equivalent because there's no rendering loop.

Knowing which queue a callback lands on is the difference between "this runs before the next render" and "this runs whenever it gets a chance".`,
    code: `console.log('A sync');
setTimeout(() => console.log('D macrotask'), 0);
queueMicrotask(() => console.log('B microtask'));
Promise.resolve().then(() => console.log('C microtask'));
console.log('E sync');
// Expected order: A, E, B, C, D`,
    exercise: {
      prompt: 'Print "micro". Expected output: micro',
      starter: `queueMicrotask(() => console.log('micro'));
`,
      expected: 'micro',
    },
    takeaways: [
      'Microtask queue drains fully between every macrotask.',
      'Promise continuations and queueMicrotask land on the microtask queue.',
      'setTimeout, setImmediate, I/O callbacks land on macrotask queues (per event loop phase).',
      'process.nextTick drains before microtasks — Node-specific, lowest level.',
    ],
    mistakes: [
      'Recursive microtask scheduling — starves the macrotask queue and hangs I/O.',
      'Expecting setTimeout(fn, 0) to fire before a promise .then — promise wins.',
      'Using process.nextTick when a promise would suffice — application code rarely needs it.',
    ],
    next: { label: 'Streams', href: '#/courses/node-basics/streams' },
  },
  {
    id: 'streams',
    title: 'Async & I/O · Streams',
    intro: `Streams are how Node handles data that does not fit in memory or arrives in chunks: a 10 GB log file, an HTTP response body, the output of a subprocess. Instead of loading everything at once, you consume the data piece by piece as it arrives.

Four stream types live in the stream module. Readable streams emit data (fs.createReadStream, an incoming HTTP request, process.stdin). Writable streams accept data (fs.createWriteStream, an outgoing HTTP response, process.stdout). Duplex streams are both (TCP sockets, crypto ciphers). Transform streams are duplex streams where output is a function of input (gzip compression, JSON parsing).

The classic pattern is the pipeline: read.pipe(transform).pipe(write). Each .pipe wires up the data event from one stream to .write() on the next, plus end events and backpressure handling. The modern preferred form is the pipeline() helper from stream/promises, which handles errors uniformly: await pipeline(read, transform, write).

Streams work in two modes: flowing (data is pushed to consumers via 'data' events) and paused (consumers pull data with .read()). Most code uses flowing mode automatically when you attach a 'data' listener or call .pipe(). Async iteration works too: for await (const chunk of stream) yields chunks as they arrive.

Two concepts always come up. Encoding: a Readable stream of a text file yields Buffer chunks by default. Set the encoding with stream.setEncoding('utf-8') or use { encoding: 'utf-8' } when creating it to get strings. Object mode: streams normally pass Buffers or strings; object mode lets a stream emit arbitrary JS objects (used by parsers like csv-parse).

Streams are the right tool when memory matters or when you want to start work before all data arrives.`,
    code: `const { Readable } = require('stream');

const src = Readable.from(['hello ', 'world', '\\n']);
(async () => {
  for await (const chunk of src) {
    process.stdout.write(chunk);
  }
})();`,
    exercise: {
      prompt: 'Print "stream". Expected output: stream',
      starter: `console.log('stream');
`,
      expected: 'stream',
    },
    takeaways: [
      'Four stream types: Readable, Writable, Duplex, Transform.',
      'pipeline() from stream/promises is the modern, error-safe way to chain streams.',
      'for await (const chunk of stream) gives async iteration — clean consumer code.',
      'Object mode lets streams emit arbitrary JS objects instead of Buffers/strings.',
    ],
    mistakes: [
      'Using .pipe() in production without error handlers — errors silently destroy the pipeline.',
      'Forgetting setEncoding on a text stream — getting raw Buffer chunks where strings were wanted.',
      'Reading a giant file with fs.readFile when fs.createReadStream would stream it.',
    ],
    next: { label: 'Backpressure', href: '#/courses/node-basics/backpressure' },
  },
  {
    id: 'backpressure',
    title: 'Async & I/O · Backpressure',
    intro: `Backpressure is the mechanism that prevents a fast producer from overwhelming a slow consumer. Imagine reading from disk at 1 GB/sec and writing to a slow HTTP endpoint at 1 MB/sec. Without backpressure, gigabytes of unsent data buffer in memory until the process crashes.

Writable streams report backpressure through the return value of .write(buf). If it returns true, the internal buffer is below the highWaterMark and you can keep writing. If it returns false, the buffer is full — pause your producer and wait for the 'drain' event before writing more. The .pipe() method handles this automatically: when the consumer's write returns false, pipe pauses the producer; when 'drain' fires, pipe resumes.

Readable streams expose the inverse signal. In flowing mode they emit 'data' as fast as the underlying source produces. To slow them, call .pause(); .resume() restarts. The async iterator (for await ... of) and .pipe() apply backpressure automatically — only the lower-level 'data' listener requires you to do it manually.

The highWaterMark option controls buffer size: default 16 KB for binary streams, 16 objects for object mode. Tuning it trades latency (smaller buffers, more frequent drain events) against throughput (larger buffers, fewer syscalls). For most apps, the defaults are fine.

A common bug: writing to a stream inside a tight loop without checking the return value. After the loop completes, megabytes of buffered data sit in the writable's internal queue. Memory climbs, GC stalls, the event loop lags. Always check the .write() return and wait for 'drain'.

The promise-based stream/promises pipeline() helper handles all this correctly. Use it.`,
    code: `const { Readable, Writable } = require('stream');
const { pipeline } = require('stream/promises');

let written = 0;
const slow = new Writable({
  highWaterMark: 4,
  write(chunk, _enc, cb) {
    written += chunk.length;
    setTimeout(cb, 5); // simulate slow consumer
  },
});

const src = Readable.from('hello world this is a long string'.repeat(20));

pipeline(src, slow).then(() => console.log('bytes written:', written));`,
    exercise: {
      prompt: 'Print "drain". Expected output: drain',
      starter: `console.log('drain');
`,
      expected: 'drain',
    },
    takeaways: [
      'Backpressure signals when consumers cannot keep up so producers slow down.',
      'Writable.write() returns false when the buffer is full; wait for the drain event.',
      '.pipe() and stream/promises pipeline() handle backpressure automatically.',
      'highWaterMark controls buffer size; tune it only when measurements demand it.',
    ],
    mistakes: [
      'Writing in a tight loop without checking the .write() return — unbounded buffering.',
      'Listening to data with .on(data, ...) and not pausing on slow consumers.',
      'Using .pipe() and ignoring errors — pipeline() forwards them safely.',
    ],
    next: { label: 'Worker threads', href: '#/courses/node-basics/worker-threads' },
  },
  {
    id: 'worker-threads',
    title: 'Async & I/O · Worker threads',
    intro: `Node is single-threaded for JavaScript, but the worker_threads module lets you spawn additional OS threads each running their own V8 isolate. They are the right answer for CPU-bound work — image encoding, video transcoding, pricing models, ML inference — that would otherwise block the main event loop.

A worker is started with new Worker(filename, options). Each worker has its own JavaScript engine, its own event loop, its own module cache. They communicate with the parent via postMessage and on('message'), using the structured clone algorithm — JSON-safe values plus things like Map, Set, Date, typed arrays.

For zero-copy sharing of binary data, use SharedArrayBuffer or transferList. transferList moves a Buffer or ArrayBuffer's underlying memory to the worker (the original becomes unusable). SharedArrayBuffer keeps memory shared between threads — useful for high-throughput numeric work, with Atomics for synchronization.

Workers are not free. Spawning one takes ~50ms and adds the V8 heap memory of a fresh isolate. For many short tasks, use a worker pool: a small fixed set of workers cycling through a queue. The piscina package is the popular implementation.

When NOT to use workers: I/O-bound work. Node's event loop already handles I/O concurrency well; adding workers adds overhead without speeding things up. Workers shine when there is real compute to parallelize across cores.

A subtler use: worker_threads can also run untrusted code in isolation. Each worker has its own globals; a malicious script cannot reach the parent's process object. Combined with --experimental-permission, this gives you a small sandbox.`,
    code: `// Conceptual — workers must live in separate files normally.
// const { Worker, isMainThread, parentPort } = require('worker_threads');
// if (isMainThread) {
//   const w = new Worker(__filename);
//   w.on('message', console.log);
//   w.postMessage(10);
// } else {
//   parentPort.on('message', (n) => parentPort.postMessage(n * n));
// }
console.log('workers run JS in parallel OS threads — one V8 isolate each');`,
    exercise: {
      prompt: 'Print "worker". Expected output: worker',
      starter: `console.log('worker');
`,
      expected: 'worker',
    },
    takeaways: [
      'Workers run JavaScript on additional OS threads, each with its own V8 isolate.',
      'Communicate via postMessage; structured clone handles most JS values.',
      'transferList and SharedArrayBuffer enable zero-copy binary exchange.',
      'Use workers for CPU-bound work; pool them with piscina for short tasks.',
    ],
    mistakes: [
      'Spinning up a worker per task — startup overhead kills throughput; pool them.',
      'Using workers for I/O-bound work — the event loop is already concurrent for I/O.',
      'Sharing JS objects directly across workers — only the structured clone subset survives.',
    ],
    next: { label: 'Child processes', href: '#/courses/node-basics/child-processes' },
  },
  {
    id: 'child-processes',
    title: 'Async & I/O · Child processes',
    intro: `child_process spawns separate OS processes — not threads. Use it to run external programs (git, ffmpeg, python scripts), to scale across multiple cores by forking Node itself, or to isolate untrusted code.

Four API variants. spawn(cmd, args) launches a process and exposes stdin/stdout/stderr as streams — the right choice for long-running processes or large output. exec(cmdline) runs a shell command and buffers all output to memory, then calls a callback — convenient for short commands but dangerous with large output. execFile(file, args) is like spawn but waits for completion and buffers output. fork(scriptPath) is a specialized spawn for Node scripts that adds an IPC channel for postMessage-style communication with the parent.

The classic example: spawn('grep', ['error', 'logfile']) starts grep with one argument, you stream the output. exec('ls | wc -l') runs a shell pipeline — convenient but shell injection is real if any argument comes from user input. Always prefer spawn/execFile with array arguments over exec with concatenated strings.

stdio configuration is flexible. By default stdin is the parent's stdin, stdout and stderr are pipes. 'inherit' makes the child share the parent's terminal. 'ignore' drops it. An array lets you mix: ['pipe', 'inherit', 'pipe'] for stdin and stderr as pipes, stdout to terminal.

Forking Node has historical importance: the cluster module uses fork() under the hood to spawn one worker per CPU core, with the OS distributing incoming connections. PM2 and similar process managers use the same model. Modern alternatives — worker_threads, container orchestration, serverless — have reduced cluster's relevance, but it is still bundled.

The asymmetry: child processes are heavier than worker threads but more isolated and can run any binary, not just JS.`,
    code: `const { spawn } = require('child_process');

const ls = spawn('node', ['--version']);
ls.stdout.on('data', (chunk) => process.stdout.write('node: ' + chunk));
ls.on('close', (code) => console.log('exited with', code));`,
    exercise: {
      prompt: 'Print "spawn". Expected output: spawn',
      starter: `console.log('spawn');
`,
      expected: 'spawn',
    },
    takeaways: [
      'child_process spawns OS processes (heavier than worker threads, fully isolated).',
      'spawn for streaming I/O; exec/execFile for buffered output; fork for Node-to-Node IPC.',
      'Prefer spawn/execFile with array args to exec with strings — avoids shell injection.',
      'stdio config: pipe, inherit, ignore — mix per fd with an array.',
    ],
    mistakes: [
      'Using exec on untrusted input — shell metacharacters become command injection.',
      'Using exec for commands that produce gigabytes of output — buffers blow up memory.',
      'Forgetting to handle the close event — child process becomes a zombie.',
    ],
    next: { label: 'Signals', href: '#/courses/node-basics/signals' },
  },
  {
    id: 'signals',
    title: 'Async & I/O · Signals',
    intro: `Unix signals are the OS-level messages a process can receive: SIGINT when you press Ctrl+C, SIGTERM when systemd asks you to stop, SIGKILL when patience runs out, SIGHUP when the controlling terminal disconnects, SIGUSR1 and SIGUSR2 as user-defined channels. Node exposes them as events on the process object.

Listening is simple: process.on('SIGINT', () => {...}). The handler runs when the signal arrives; by default Node will continue, so you typically log, clean up, then call process.exit(0). Note that SIGKILL (kill -9) cannot be intercepted — the kernel terminates the process immediately, with no chance to clean up.

Signal handlers are perfect for graceful shutdown. On SIGTERM, stop accepting new requests, finish in-flight work, close database pools, then exit. Container orchestrators (Kubernetes, ECS) send SIGTERM and wait up to 30 seconds before sending SIGKILL — your job is to be done before the timer expires. If you ignore SIGTERM, every deploy looks like a crash to users.

Some signals have conventional uses. SIGHUP traditionally meant "reload your configuration without restarting" — useful for long-running daemons. SIGUSR1 in older Node versions used to trigger the debugger; now it triggers a heap snapshot to disk with --report-on-signal. SIGPIPE fires if you write to a pipe whose reader has closed — Node ignores it by default.

On Windows, signal support is partial — SIGINT, SIGBREAK, SIGHUP work; most others do not.

The graceful shutdown checklist: stop accepting work, wait for in-flight work, close external resources, exit. We will build this end-to-end in the next lesson.`,
    code: `process.on('SIGINT', () => {
  console.log('received SIGINT — cleaning up');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('received SIGTERM');
  process.exit(0);
});

console.log('press Ctrl+C to send SIGINT');
// (in this lesson we just demonstrate registration)`,
    exercise: {
      prompt: 'Print "signal". Expected output: signal',
      starter: `console.log('signal');
`,
      expected: 'signal',
    },
    takeaways: [
      'Signals are OS messages; Node exposes them as events on process.',
      'SIGKILL cannot be caught — clean shutdown only on catchable signals (SIGTERM, SIGINT).',
      'Container orchestrators send SIGTERM and give you ~30s before SIGKILL.',
      'On Windows, only SIGINT / SIGBREAK / SIGHUP are reliable.',
    ],
    mistakes: [
      'Ignoring SIGTERM — every deploy looks like a crash to users.',
      'Doing async work in a signal handler without waiting for it before exit.',
      'Trying to catch SIGKILL — impossible by design.',
    ],
    next: { label: 'Graceful shutdown', href: '#/courses/node-basics/graceful-shutdown' },
  },
  {
    id: 'graceful-shutdown',
    title: 'Async & I/O · Graceful shutdown',
    intro: `Graceful shutdown is the discipline of finishing work cleanly when your process is asked to stop. Done right, deploys are invisible to users — in-flight requests complete, connections close cleanly, no errors in your logs. Done wrong, every deploy drops requests and logs ECONNRESET on the client side.

The five-step shutdown protocol: 1) Catch SIGTERM (and SIGINT for local Ctrl+C). 2) Stop accepting new work — call server.close() on HTTP servers (it stops accepting new connections but waits for existing ones), set a "draining" flag on queue consumers. 3) Wait for in-flight work to finish — server.close() invokes its callback when all connections close; queue workers should wait for their current job. 4) Close external resources — database pools, Redis connections, file handles. 5) process.exit(0).

Timeouts matter. server.close() will wait forever if a client keeps the connection open with HTTP keep-alive. Set a hard ceiling: const timer = setTimeout(() => process.exit(1), 30_000). Most orchestrators give you 30 seconds; aim for less to leave headroom.

For multi-process setups (cluster, PM2), the master process forwards SIGTERM to workers, then waits for them to exit before it does. Each worker runs the same shutdown logic locally.

Test it. Start your server, send a slow request, send SIGTERM to the process. The request should complete, the new request should be refused, the process should exit within your timeout. Without testing, the first time you find out is in production at 2 AM.

Tools like the http-graceful-shutdown package package this up, but rolling your own is ~30 lines and worth knowing how it works.`,
    code: `const http = require('http');

const server = http.createServer((_req, res) => {
  setTimeout(() => res.end('done'), 50);
});

let shuttingDown = false;
function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log('shutting down on', signal);
  server.close(() => {
    console.log('all connections closed — exiting');
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

server.listen(0, () => console.log('listening on', server.address().port));`,
    exercise: {
      prompt: 'Print "graceful". Expected output: graceful',
      starter: `console.log('graceful');
`,
      expected: 'graceful',
    },
    takeaways: [
      'Catch SIGTERM, stop accepting work, drain in-flight, close resources, exit.',
      'server.close() refuses new connections but waits for existing ones.',
      'Always set a hard timeout (~10–30s) so a stuck connection cannot block exit.',
      'Test shutdown locally — production at 2 AM is the wrong place to discover bugs.',
    ],
    mistakes: [
      'Skipping the timeout — a hung connection holds shutdown forever.',
      'Calling process.exit(0) before server.close() callback — drops in-flight requests.',
      'Not propagating shutdown to cluster/worker children — only the master exits.',
    ],
    next: { label: 'HTTP server', href: '#/courses/node-basics/http-server' },
  },

  // ─── HTTP & APIs (10) ─────────────────────────────────────────
  {
    id: 'http-server',
    title: 'HTTP & APIs · Built-in HTTP server',
    intro: `Node's standard library ships a complete HTTP server in the http module. No frameworks needed — http.createServer((req, res) => {...}) gives you a functioning server in three lines. Frameworks build on top of this.

The handler receives an IncomingMessage (the request) and a ServerResponse (the response). IncomingMessage is a Readable stream — you read the request body by listening to data events or using for await. It also has url, method, headers as parsed properties. ServerResponse is a Writable stream — you write the body with res.write(chunk), terminate with res.end(), and set status and headers with res.statusCode, res.setHeader, or res.writeHead.

Calling server.listen(port) binds to a TCP port and starts accepting connections. Pass 0 to let the OS choose a free port — useful in tests. The server emits 'request' for every HTTP request, 'connection' for each new TCP socket, and 'close' on shutdown.

A subtle but important point: you must always end the response. Failing to call res.end() leaves the client hanging until the keep-alive timeout fires. The Express framework and koa do this automatically when you set the body; the raw API requires you to be explicit.

Streams compose: res is Writable, so a file response is one line: fs.createReadStream('big.txt').pipe(res). Headers (Content-Type, Content-Length) must be set before the first .write or implicitly via res.writeHead — they cannot be sent after the body starts.

For HTTPS use https.createServer with the same handler shape, plus key and cert options. HTTP/2 lives in node:http2 with a different streaming API.

In production you usually put this server behind a reverse proxy (nginx, Cloudflare, an L7 LB) that handles TLS, caching, and rate limiting.`,
    code: `const http = require('http');

const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ method: req.method, url: req.url }));
});

server.listen(0, () => {
  console.log('listening on', server.address().port);
  server.close(); // immediate close so this example exits
});`,
    exercise: {
      prompt: 'Print "http". Expected output: http',
      starter: `console.log('http');
`,
      expected: 'http',
    },
    takeaways: [
      'http.createServer((req, res) => {...}) is a complete HTTP server.',
      'req is a Readable stream; res is a Writable stream — pipe files directly.',
      'Always call res.end(); set headers before the first body write.',
      'For TLS use https; for HTTP/2 use http2 with its different API.',
    ],
    mistakes: [
      'Forgetting res.end() — clients hang until keep-alive timeout.',
      'Trying to set headers after .write — Node throws "headers already sent".',
      'Running raw http on the public internet without a reverse proxy — no TLS, no caching, no rate limit.',
    ],
    next: { label: 'Express basics', href: '#/courses/node-basics/express-basics' },
  },
  {
    id: 'express-basics',
    title: 'HTTP & APIs · Express basics',
    intro: `Express is the most-used Node web framework. It's a thin layer on top of http: it adds routing, middleware, and convenience helpers (res.json, res.status, req.params) without forcing a heavy structure. Most Node tutorials and most companies start here.

The shape is small. const app = express() creates the app. app.get('/path', handler) registers a route. app.listen(port) starts the server. The handler signature is (req, res, next). req has helpers like req.query (parsed query string), req.params (URL params), req.body (parsed body after middleware). res has res.json(obj) (sets JSON header and sends), res.status(404), res.send(html), res.redirect('/elsewhere').

Routes can use parameters and patterns. app.get('/users/:id', (req, res) => { req.params.id }) matches /users/42 with id='42'. app.get('/files/*', ...) matches anything under /files. Multiple HTTP methods on the same path are common — group them with app.route('/foo').get(...).post(...).delete(...).

The next callback in handlers is how you pass control along middleware. Call next() to continue, next(err) to jump to error middleware. Most route handlers do not call next — they end the response. Middleware (covered in a later lesson) is what does.

Express 5 (in beta as of writing) modernizes the framework: native Promise support in route handlers, async-aware error handling, smaller default middleware. Express 4 is still the production default and behaves the same way for most code.

Alternatives worth knowing: Fastify is faster and has built-in schema validation; Koa is Express by the same author with a smaller surface and async-first design; Hono targets edge runtimes (Cloudflare Workers, Bun, Deno) with the same Express-ish ergonomics.`,
    code: `// const express = require('express');
// const app = express();
//
// app.get('/health', (_req, res) => res.json({ ok: true }));
// app.get('/users/:id', (req, res) => res.json({ id: req.params.id }));
//
// app.listen(3000, () => console.log('listening on 3000'));
console.log('Express adds routing + middleware on top of http');`,
    exercise: {
      prompt: 'Print "express". Expected output: express',
      starter: `console.log('express');
`,
      expected: 'express',
    },
    takeaways: [
      'Express is a thin routing + middleware layer on top of http.',
      'Handlers receive (req, res, next); call next to chain, next(err) to bail.',
      'req.params for URL parameters, req.query for query strings, req.body after body middleware.',
      'Fastify (faster + schema), Koa (smaller), Hono (edge) are the main alternatives.',
    ],
    mistakes: [
      'Forgetting to send a response in a route — request hangs until timeout.',
      'Mixing async handlers in Express 4 without try/catch — unhandled rejection crashes the process.',
      'Reaching for Express plugins for things route handlers do trivially — over-engineering early.',
    ],
    next: { label: 'Routing', href: '#/courses/node-basics/routing' },
  },
  {
    id: 'routing',
    title: 'HTTP & APIs · Routing',
    intro: `Routing maps HTTP method + URL path to a handler function. The simple cases — app.get('/health', ...) — are obvious; the interesting cases involve parameters, wildcards, route ordering, and modular routers.

Path parameters are the universal pattern. /users/:id matches /users/42 and exposes req.params.id. Multiple params: /users/:userId/posts/:postId. You can constrain with a regex: /users/:id(\\d+) only matches numeric ids. The exact syntax depends on the framework (Express uses path-to-regexp; Fastify uses a similar but distinct parser).

Wildcards capture trailing segments. /static/* matches /static/img/logo.png with req.params[0] = 'img/logo.png'. Use sparingly — wildcards eat routes that would otherwise match more specifically.

Route order matters. Express tries routes top-to-bottom; the first match wins. Put specific routes before generic ones: /users/me before /users/:id. Otherwise /users/me matches the parameterized route with id='me' and your specific handler is dead code.

Modular routers let you split a large app. const userRouter = express.Router(); userRouter.get('/', list); userRouter.get('/:id', show); app.use('/users', userRouter). Each router has its own middleware chain. Mounting prefixes the path of every route inside.

REST conventions guide URL design: nouns not verbs (/users not /getUsers), pluralized collections (/users with GET for list, POST for create), individual resources (/users/:id with GET, PUT, DELETE). Stick to the convention unless you have a strong reason — your consumers will thank you.

For complex routing (query-param-based dispatch, content negotiation, versioning), middleware is the cleaner mechanism. Versioning with /v1/... or via an Accept header are both common; choose one and stick to it across the API.`,
    code: `// app.get('/users', listUsers);
// app.post('/users', createUser);
// app.get('/users/me', currentUser);     // MUST come before /:id
// app.get('/users/:id', getUser);
// app.put('/users/:id', updateUser);
// app.delete('/users/:id', deleteUser);

const routes = [
  ['GET', '/users'],
  ['POST', '/users'],
  ['GET', '/users/me'],
  ['GET', '/users/:id'],
];
console.log('routes:', routes.map((r) => r.join(' ')).join(' | '));`,
    exercise: {
      prompt: 'Print "routes". Expected output: routes',
      starter: `console.log('routes');
`,
      expected: 'routes',
    },
    takeaways: [
      'Path parameters with :name; capture in req.params; constrain with a regex when needed.',
      'Route order matters — specific routes must precede generic ones.',
      'Modular routers (express.Router) split a big app into mounted sub-apps.',
      'REST conventions: noun-pluralized resources, HTTP methods for the verb.',
    ],
    mistakes: [
      'Defining /users/:id before /users/me — the specific route is never reached.',
      'Overusing wildcards — they swallow routes that should match more specifically.',
      'Versioning sometimes via path and sometimes via header — pick one.',
    ],
    next: { label: 'Middleware', href: '#/courses/node-basics/middleware' },
  },
  {
    id: 'middleware',
    title: 'HTTP & APIs · Middleware',
    intro: `Middleware is the central abstraction in Express, Koa, and most Node frameworks. A middleware function takes (req, res, next) and either ends the response, modifies req/res and calls next(), or calls next(err) to bail to error handling. The framework strings them together into a pipeline that every request flows through.

Use cases are everywhere: logging every request, parsing the request body, validating auth tokens, attaching CORS headers, rate-limiting, compressing responses. Each is one self-contained function. app.use(fn) installs it for all routes; app.use('/admin', fn) scopes it to a path prefix; app.get('/path', mw1, mw2, handler) installs middleware just for that route.

Order is critical. app.use(express.json()) before any route that reads req.body. Auth middleware before routes that need a user. Error middleware (with signature (err, req, res, next) — four args) goes last. The framework distinguishes error middleware by its arity.

Common middleware ships in the ecosystem. helmet sets security headers. cors handles CORS preflight. morgan logs requests. express-rate-limit caps request rate per IP. express.static serves a directory of files. Most apps use a small set of these and write a few custom ones.

Async middleware is supported in Express 5 natively; in Express 4 wrap async handlers in a try/catch or use the express-async-errors package, otherwise a thrown error from an async function becomes an unhandled rejection.

Per-route middleware is the cleanest way to enforce different policies for different endpoints: auth on /api/*, no auth on /public/*, admin role on /admin/*. Keep each middleware small and single-purpose — they compose better that way.`,
    code: `// const express = require('express');
// const app = express();
//
// app.use((req, _res, next) => {
//   console.log(req.method, req.url);
//   next();
// });
// app.use(express.json());
// app.post('/echo', (req, res) => res.json(req.body));
// app.use((err, _req, res, _next) => {
//   res.status(500).json({ error: err.message });
// });

const pipeline = ['logger', 'jsonParser', 'auth', 'route', 'errorHandler'];
console.log('pipeline:', pipeline.join(' -> '));`,
    exercise: {
      prompt: 'Print "middleware". Expected output: middleware',
      starter: `console.log('middleware');
`,
      expected: 'middleware',
    },
    takeaways: [
      'Middleware = (req, res, next) function in a pipeline every request flows through.',
      'Order matters: body parsers before routes, error middleware last.',
      'Express 4 needs async wrappers (try/catch or express-async-errors); Express 5 is async-aware.',
      'Common ecosystem middleware: helmet, cors, morgan, express-rate-limit, express.static.',
    ],
    mistakes: [
      'Forgetting to call next() — request hangs until the framework times out.',
      'Putting express.json() after a route that reads req.body — body is undefined.',
      'Defining error middleware with three args instead of four — Express treats it as regular middleware.',
    ],
    next: { label: 'Body parsing', href: '#/courses/node-basics/body-parsing' },
  },
  {
    id: 'body-parsing',
    title: 'HTTP & APIs · Body parsing',
    intro: `HTTP request bodies arrive as raw bytes. To use them in your handler, something must parse them according to the request's Content-Type header. Express ships built-in middleware for the common cases.

express.json() parses application/json bodies and exposes them as req.body. express.urlencoded({ extended: true }) parses form posts (application/x-www-form-urlencoded). express.text() parses text/plain. express.raw() exposes the raw Buffer for custom processing. Pass a limit option to cap body size — default 100kb is too small for some uses and too large for others.

For multipart/form-data (file uploads with form fields), Express's built-ins do not handle it. Use multer (most popular) or busboy (lower-level streaming). We cover uploads in a dedicated lesson.

Why does this matter? An unparseable body or a body larger than the limit produces an error you must handle. A missing Content-Type with a JSON body silently does nothing — req.body stays undefined. Logging the Content-Type during API debugging saves hours.

For APIs serving multiple content types, content negotiation matters. The req.is('json') helper checks the request's Content-Type. The Accept header tells you what the client wants back — Express's res.format({ 'application/json': ..., 'text/html': ... }) dispatches on it.

Security note: body size limits are also a DoS defense. Without a limit, an attacker can send a 1 GB body and exhaust memory. Set the limit to the largest legitimate request your API expects — and for file uploads, stream them to disk rather than buffering, even if you have to write a small custom handler.

Schema validation (zod, joi, ajv) is usually a layer above body parsing: parse the raw body into JS, then validate the shape and types.`,
    code: `// const express = require('express');
// const app = express();
//
// app.use(express.json({ limit: '1mb' }));
// app.post('/echo', (req, res) => {
//   if (!req.body) return res.status(400).json({ error: 'expected JSON body' });
//   res.json({ received: req.body });
// });

const body = '{"name":"PGcode"}';
const parsed = JSON.parse(body);
console.log('parsed.name =', parsed.name);`,
    exercise: {
      prompt: 'Print "body". Expected output: body',
      starter: `console.log('body');
`,
      expected: 'body',
    },
    takeaways: [
      'express.json / urlencoded / text / raw handle the common Content-Type bodies.',
      'Multipart form data (file uploads) needs multer or busboy — not built in.',
      'Always set a limit on body size — DoS defense and memory safety.',
      'Validate the parsed body with a schema (zod/joi/ajv) before using it.',
    ],
    mistakes: [
      'Forgetting express.json() — req.body is undefined and you blame the client.',
      'Leaving body size unlimited — 1 GB POSTs exhaust memory.',
      'Trusting the parsed body without validation — type confusion bugs and NoSQL injection.',
    ],
    next: { label: 'REST conventions', href: '#/courses/node-basics/rest-conventions' },
  },
  {
    id: 'rest-conventions',
    title: 'HTTP & APIs · REST conventions',
    intro: `REST is a convention for designing HTTP APIs around resources. Done well, it makes APIs predictable: a consumer who knows GET /users can guess GET /users/42, POST /users, DELETE /users/42. Done poorly, every endpoint is a one-off and the docs become essential.

The core ideas: resources are nouns (users, orders, photos), HTTP methods are verbs (GET = read, POST = create, PUT = full replace, PATCH = partial update, DELETE = remove). Collections are plural (/users); individual resources include the id (/users/42). Sub-resources nest: /users/42/posts is "posts of user 42".

Status codes carry meaning. 200 OK for successful responses with a body, 201 Created when POST created a resource (set Location header to its URL), 204 No Content when there's no body, 400 Bad Request for client errors with invalid input, 401 Unauthorized when authentication is missing, 403 Forbidden when authentication is valid but insufficient, 404 Not Found, 409 Conflict for state conflicts (duplicate creation), 422 Unprocessable Entity for validation failures, 429 Too Many Requests for rate limits, 500 Internal Server Error for bugs, 503 Service Unavailable for overload.

Idempotency: GET, PUT, DELETE should be idempotent — calling twice has the same effect as once. POST is not (creates a new resource each time). PATCH is sometimes idempotent depending on semantics. Honoring this lets clients safely retry on network failures.

Pagination, filtering, sorting belong in query strings: GET /users?page=2&pageSize=20&sort=-createdAt&role=admin. Return the total count and a link to the next page in the response or in headers (Link header).

Error responses should be JSON with a consistent shape: { error: { code: 'INVALID_INPUT', message: 'name is required', field: 'name' } }. Avoid HTML error pages from an API.

GraphQL and tRPC sit alongside REST as alternatives; REST is still the default for public APIs and the path of least resistance.`,
    code: `const routes = [
  { method: 'GET', path: '/users', purpose: 'list' },
  { method: 'POST', path: '/users', purpose: 'create -> 201 + Location' },
  { method: 'GET', path: '/users/:id', purpose: 'read -> 200 or 404' },
  { method: 'PUT', path: '/users/:id', purpose: 'replace -> 200 or 404' },
  { method: 'PATCH', path: '/users/:id', purpose: 'update -> 200 or 404' },
  { method: 'DELETE', path: '/users/:id', purpose: 'remove -> 204 or 404' },
];
console.log(routes.map((r) => r.method + ' ' + r.path).join('\\n'));`,
    exercise: {
      prompt: 'Print "rest". Expected output: rest',
      starter: `console.log('rest');
`,
      expected: 'rest',
    },
    takeaways: [
      'Resources are nouns (plural), HTTP methods are verbs — predictability by convention.',
      'Status codes carry semantics: 201 with Location for create, 4xx for client errors, 5xx for server.',
      'GET / PUT / DELETE are idempotent; POST is not — retries should respect this.',
      'Pagination, filtering, sorting in query strings; consistent JSON error shape.',
    ],
    mistakes: [
      'Verbs in URLs (/createUser, /getUsers) — RPC-ish, breaks the REST mental model.',
      'Returning 200 with { error: ... } for failures — clients cannot distinguish from success.',
      'Mixing pagination styles (?page= vs ?cursor= vs Link header) across endpoints.',
    ],
    next: { label: 'Error middleware', href: '#/courses/node-basics/error-middleware' },
  },
  {
    id: 'error-middleware',
    title: 'HTTP & APIs · Error middleware',
    intro: `Express distinguishes error middleware from regular middleware by arity: a function with four parameters (err, req, res, next) is treated as an error handler. The framework skips it during normal request flow and routes to it whenever a middleware or handler calls next(err) or throws (in async-aware mode).

The standard pattern is one global error handler installed last. It inspects the error, decides on a status code (default 500), logs the error with request context, and sends a JSON response. Typed errors make this clean: class HttpError extends Error with .statusCode, throw new HttpError(404, 'not found'), the error middleware reads err.statusCode || 500.

Async handlers in Express 4 do not automatically forward thrown errors. Either wrap them with a helper (const wrap = fn => (req, res, next) => fn(req, res, next).catch(next)) or use express-async-errors which monkey-patches the router. Express 5 removes this requirement.

Validation errors deserve special treatment. Return 400 (or 422) with field-level details: { error: { code: 'VALIDATION', fields: { email: 'must be a valid email' } } }. Most validation libraries (zod, joi) produce structured errors you can transform.

Logging matters as much as the response. Log every error with request id, path, method, status, and stack — never just the message. In production, hook into Sentry, Datadog, or your APM of choice; the error middleware is the natural place to do it.

For client-side, return user-safe messages. 500 should say "internal error, our team has been notified" — never leak stack traces in production. Use NODE_ENV to gate detailed errors in dev only.

A common omission: 404 handling. A route that no router matched falls through every middleware. Add a catch-all app.use((req, res) => res.status(404).json({error: 'not found'})) before the error handler.`,
    code: `// Standard error-middleware skeleton:
// app.use((err, req, res, _next) => {
//   const status = err.statusCode || 500;
//   if (status >= 500) console.error(err);
//   res.status(status).json({
//     error: {
//       code: err.code || 'INTERNAL',
//       message: status >= 500 ? 'internal error' : err.message,
//     },
//   });
// });

class HttpError extends Error {
  constructor(status, msg) { super(msg); this.statusCode = status; }
}
const e = new HttpError(404, 'not found');
console.log(e.statusCode, e.message);`,
    exercise: {
      prompt: 'Print "error". Expected output: error',
      starter: `console.log('error');
`,
      expected: 'error',
    },
    takeaways: [
      'Error middleware has four args; install one globally last.',
      'Typed errors with .statusCode let the handler dispatch on status uniformly.',
      'Express 4 needs async wrappers; Express 5 catches thrown async errors natively.',
      'Log full stack with request context; return user-safe messages in production.',
    ],
    mistakes: [
      'Defining error middleware with three args — Express treats it as normal middleware.',
      'Leaking stack traces to production clients — information disclosure.',
      'Missing 404 catch-all — unmatched routes hang or return cryptic errors.',
    ],
    next: { label: 'File uploads', href: '#/courses/node-basics/file-uploads' },
  },
  {
    id: 'file-uploads',
    title: 'HTTP & APIs · File uploads',
    intro: `File uploads in HTTP use multipart/form-data — a body format that interleaves text fields and binary file blobs. Express does not parse this format itself; multer (built on busboy) is the de facto standard.

The shape: app.post('/upload', multer({ dest: 'uploads/' }).single('file'), (req, res) => { req.file }). multer parses the body, writes each file to disk (or memory or your own stream destination), and exposes req.file (single) or req.files (multiple) with metadata: originalname, mimetype, size, path.

Three storage modes: memory storage (small files only — Buffer in memory), disk storage (writes to a folder, returns the path), and custom storage (you implement _handleFile to stream to S3, GCS, or wherever). For production, disk or custom — never memory for files larger than a few MB.

Critical validation. Set limits ({ fileSize: 5 * 1024 * 1024, files: 1 }). Validate the mimetype against an allow-list — never trust the client-supplied type; sniff the first bytes with file-type for paranoia. Rename uploaded files (UUID + extension) so a malicious filename cannot escape the upload directory.

Streaming uploads (direct to S3 without disk staging) is more involved but better for large files. Use busboy directly and pipe its file stream into an S3 multipart upload. The aws-sdk has helpers for this; many projects use minio-sdk for compatibility.

For very large files (videos, datasets), resumable uploads (tus protocol) and signed direct-to-storage uploads (presigned URLs) skip the API server entirely. The client uploads to S3 directly and POSTs the resulting key to your API. Saves bandwidth and removes a bottleneck.

Security checklist: size limits, type allow-list, filename sanitization, virus scanning if user-generated, separate domain for serving uploaded content (avoids cookies leaking to attacker-controlled HTML).`,
    code: `// const multer = require('multer');
// const upload = multer({
//   dest: 'uploads/',
//   limits: { fileSize: 5 * 1024 * 1024, files: 1 },
//   fileFilter: (_req, file, cb) => {
//     const ok = ['image/png', 'image/jpeg'].includes(file.mimetype);
//     cb(ok ? null : new Error('only png/jpeg'), ok);
//   },
// });
// app.post('/upload', upload.single('file'), (req, res) => res.json({
//   filename: req.file.filename,
//   size: req.file.size,
// }));

console.log('uploads use multipart/form-data; parse with multer/busboy');`,
    exercise: {
      prompt: 'Print "upload". Expected output: upload',
      starter: `console.log('upload');
`,
      expected: 'upload',
    },
    takeaways: [
      'multipart/form-data is the file-upload body format; Express alone does not parse it.',
      'multer (on busboy) is the standard middleware; storage modes: memory, disk, custom.',
      'Always validate size, mimetype, filename — and rename to a UUID to avoid path traversal.',
      'For large files, use presigned direct-to-storage uploads (S3 etc.) and skip the API server.',
    ],
    mistakes: [
      'Using memory storage for large files — OOM under load.',
      'Trusting the client-supplied mimetype or filename — both are user-controlled.',
      'Serving uploaded files from the same origin as your API — XSS amplification via cookies.',
    ],
    next: { label: 'WebSockets', href: '#/courses/node-basics/websockets' },
  },
  {
    id: 'websockets',
    title: 'HTTP & APIs · WebSockets',
    intro: `HTTP is request/response. WebSockets give you a full-duplex, persistent connection between client and server over a single TCP socket — both sides can send messages at any time without polling. Use cases: chat, live cursors, multiplayer games, real-time dashboards, collaborative editing.

The handshake starts as an HTTP request with Upgrade: websocket headers; the server responds with 101 Switching Protocols and the same socket flips to the WebSocket framing protocol. After that, both sides exchange messages (text or binary frames) until either closes.

In Node, the ws package is the de facto standard. const wss = new WebSocketServer({ port: 8080 }); wss.on('connection', (ws) => { ws.on('message', (data) => ws.send('echo: ' + data)); }). socket.io is a higher-level alternative that adds rooms, namespaces, fallbacks to long-polling for restricted networks, and automatic reconnection. ws is lighter; socket.io is more featureful.

Hosting WebSockets behind nginx or AWS ALB requires enabling WebSocket upgrade headers; serverless platforms generally do not support persistent connections (use SSE or a managed service like Ably/Pusher). For huge scale, sharding connections across nodes and using Redis pub/sub to broadcast across servers is the standard pattern.

Server-Sent Events (SSE) is a simpler half-duplex alternative: persistent HTTP connection where the server pushes text events to the client (the client cannot push back). Built into browsers as EventSource. If your use case is one-way (notifications, live feed), SSE is much simpler than WebSockets.

Authentication: WebSocket connections cannot send custom headers in browsers (the upgrade is initiated by the browser). Common workarounds: pass a token in the query string (?token=...) and validate during the upgrade, or use cookie auth, or do a regular HTTP login first and rely on a session cookie.

Heartbeats: connections die silently across NAT or load balancers. Send ping frames periodically and close on missed pongs to detect dead clients.`,
    code: `// const { WebSocketServer } = require('ws');
// const wss = new WebSocketServer({ port: 8080 });
// wss.on('connection', (ws) => {
//   ws.on('message', (data) => {
//     for (const client of wss.clients) {
//       if (client.readyState === 1) client.send(String(data));
//     }
//   });
//   ws.send('welcome');
// });

console.log('WebSockets give full-duplex over one TCP socket; use ws or socket.io');`,
    exercise: {
      prompt: 'Print "ws". Expected output: ws',
      starter: `console.log('ws');
`,
      expected: 'ws',
    },
    takeaways: [
      'WebSockets start as an HTTP upgrade then flip to a persistent, full-duplex framing protocol.',
      'ws is the lightweight Node library; socket.io adds rooms, fallbacks, reconnection.',
      'SSE is the half-duplex, browser-built-in alternative for server-to-client streaming.',
      'Heartbeats (ping/pong) detect silent connection death across NAT and load balancers.',
    ],
    mistakes: [
      'Trying to scale a single Node process to millions of connections — shard + Redis pub/sub.',
      'Using WebSockets when SSE would suffice — extra complexity for one-way traffic.',
      'No heartbeat — dead clients pile up unnoticed until you run out of file descriptors.',
    ],
    next: { label: 'Testing with vitest', href: '#/courses/node-basics/testing-vitest' },
  },
  {
    id: 'testing-vitest',
    title: 'HTTP & APIs · Testing with vitest',
    intro: `Tests should be fast, isolated, and easy to write — otherwise nobody writes them. vitest (Vite-based test runner) is the modern default for Node and browser test code: Jest-compatible API, ESM-first, fast watch mode, built-in coverage. For Node-only projects, Node's built-in node:test (since v18) is a zero-dep alternative.

The basic shape with vitest: import { describe, it, expect } from 'vitest'; describe('add', () => { it('sums numbers', () => { expect(add(2, 3)).toBe(5); }); });. Run with npx vitest. Files matching *.test.js (or *.spec.js) are picked up automatically.

For HTTP endpoint tests, supertest is the standard companion. const res = await request(app).get('/health'); expect(res.status).toBe(200);. supertest spins up the Express app on an ephemeral port, makes a real HTTP request, and exposes a chainable API for assertions.

Test isolation matters. Each test should create the resources it needs and clean up after. Avoid global state, shared databases, and shared file paths. For databases, use a fresh transaction per test and roll back (Postgres BEGIN/ROLLBACK in a beforeEach/afterEach is great).

Mocking external services (Stripe, SendGrid, S3) keeps tests fast and reliable. vi.mock('module-name') and vi.fn() are vitest's mock APIs. Prefer dependency injection where you can — pass the dependency as a parameter and pass a stub in tests, no mocking framework needed.

Coverage: npx vitest --coverage. Aim for 80%+ on critical paths (handlers, validators, business logic). Don't chase 100% — uncovered paths are usually error-handling that is hard to trigger.

CI integration: run npm test in your GitHub Actions / GitLab CI / Buildkite job. Fail the build on test failures or coverage drops. Run linting in the same job.

End-to-end tests (Playwright, Cypress) belong above unit tests. The pyramid: many unit tests, fewer integration tests, very few e2e tests.`,
    code: `// math.js
function add(a, b) { return a + b; }
module.exports = { add };

// math.test.js
// import { describe, it, expect } from 'vitest';
// import { add } from './math.js';
// describe('add', () => {
//   it('sums two numbers', () => {
//     expect(add(2, 3)).toBe(5);
//   });
// });

function add(a, b) { return a + b; }
console.log('add(2,3) ===', add(2, 3));`,
    exercise: {
      prompt: 'Print "tests". Expected output: tests',
      starter: `console.log('tests');
`,
      expected: 'tests',
    },
    takeaways: [
      'vitest is Jest-compatible, ESM-first, fast — the modern default Node test runner.',
      'supertest spins up Express on an ephemeral port for clean HTTP endpoint tests.',
      'Tests must be isolated — fresh resources per test, no shared global state.',
      'Mocking via vi.mock / vi.fn; dependency injection avoids mocking when feasible.',
    ],
    mistakes: [
      'Sharing a database across tests without cleanup — order-dependent flaky failures.',
      'Mocking everything until tests verify only that mocks return mock data.',
      'Chasing 100% coverage instead of meaningful coverage on critical paths.',
    ],
    next: { label: 'Back to courses', href: '#/courses' },
  },
];

const SQL_LESSONS = [
  // ─── Foundations (10) ───────────────────────────────────────────
  {
    id: 'what-is-sql',
    title: 'Foundations · What is SQL',
    subtitle: 'The declarative language that runs nearly every database on the planet.',
    intro: `SQL — Structured Query Language — is the 50-year-old language for talking to relational databases. Codd's 1970 paper proposed organising data as relations (tables of tuples), and IBM's System R prototype in the mid-1970s shipped SEQUEL, which became SQL. The standard was first ratified by ANSI in 1986. Today every serious database — PostgreSQL, MySQL, SQLite, SQL Server, Oracle, BigQuery, Snowflake, Redshift, DuckDB — speaks a SQL dialect.

What makes SQL different from Python or JavaScript is that it is declarative. You describe the result you want, not the steps. SELECT name FROM users WHERE age > 18 says give me names of adults. The database's query planner decides whether to scan the whole table, use an index, parallelise across workers, or rewrite the join order. You get to think about data and leave the execution strategy to a piece of software that has had four decades of tuning.

SQL splits roughly into four sublanguages. DQL (Data Query Language) is SELECT — the one you spend 90% of your time on. DML (Data Manipulation Language) is INSERT, UPDATE, DELETE. DDL (Data Definition Language) is CREATE, ALTER, DROP — building the schema. DCL (Data Control Language) is GRANT, REVOKE for permissions. Transaction control — BEGIN, COMMIT, ROLLBACK — is sometimes called TCL.

Why learn it deeply? Because data lives forever. Application code gets rewritten every five years, but the rows you wrote in 2015 still answer queries in 2026. Engineers who can read a query plan, design a normalised schema, and recognise an N+1 query are the people who keep production fast as systems grow.

Throughout this course we will use a hypothetical employees / departments / projects schema. You can run every example in PostgreSQL, MySQL, or SQLite — the dialect differences are tiny for what we cover. Where dialects diverge meaningfully (window function syntax, RETURNING clauses, JSON operators), we will call it out.`,
    code: `-- A minimal SELECT to confirm SQL is alive
SELECT 'Hello, SQL' AS greeting, CURRENT_DATE AS today;`,
    exercise: {
      prompt: `Write a query that returns the literal string 'SQL ready' in a column named status.`,
      starter: `-- write your SELECT here`,
      expected: `SELECT 'SQL ready' AS status;`,
    },
    takeaways: [
      'SQL is declarative — you describe the result, the planner picks the algorithm.',
      'Four sublanguages: DQL (SELECT), DML (INSERT/UPDATE/DELETE), DDL (CREATE/ALTER), DCL (GRANT).',
      'Every major relational database speaks a dialect of SQL — most basics port cleanly.',
      'Data outlives application code; investing in SQL pays for the whole career.',
    ],
    mistakes: [
      'Treating SQL like an imperative language and writing loops where a single query would do.',
      'Assuming every dialect is identical — DATE math, JSON, and window syntax differ.',
      'Skipping the standard and learning only one vendor extension — it limits portability.',
    ],
    next: 'select-basics',
  },
  {
    id: 'select-basics',
    title: 'Foundations · SELECT Basics',
    subtitle: 'The single most common SQL statement — pulling columns from one or more tables.',
    intro: `Every interaction with a database that reads data starts with SELECT. The minimal shape is SELECT <columns> FROM <table>. The column list can be * to fetch every column, a comma-separated list of specific columns, or expressions like UPPER(name) or salary * 12.

You should almost never write SELECT * in production code. It binds your application to the column ordering of the table, transfers more bytes than needed, defeats index-only scans, and silently breaks when someone adds or renames a column. Explicit column lists also make the query self-documenting — a reviewer can see at a glance which fields you depend on.

A SELECT statement evaluates in a logical order that surprises beginners. The clauses are parsed FROM, WHERE, GROUP BY, HAVING, SELECT, ORDER BY, LIMIT — not the order you write them. So an alias defined in SELECT cannot usually be used in WHERE (it does not exist yet), but it can appear in ORDER BY (which runs after SELECT). This single rule explains 80% of beginner mistakes.

Column expressions can be any valid expression: arithmetic (price * quantity), string functions (CONCAT(first, ' ', last)), date functions (EXTRACT(YEAR FROM hired_at)), CASE expressions (CASE WHEN salary > 100000 THEN 'high' ELSE 'normal' END), or scalar subqueries. The result is one row per row in the source table, one column per expression you listed.

A SELECT without a FROM clause is also legal in most dialects — useful for testing functions or returning a literal. Postgres allows SELECT 1 + 1; Oracle requires SELECT 1 + 1 FROM dual.

In this course we will assume an employees table with columns id, name, email, department_id, salary, hired_at, country, and a departments table with id, name, location. Most lessons reference one or both.`,
    code: `-- Always prefer an explicit column list over SELECT *
SELECT id, name, email, salary
FROM employees;`,
    exercise: {
      prompt: `Return name and email from the employees table for everyone — no filter yet.`,
      starter: `-- write your SELECT here`,
      expected: `SELECT name, email FROM employees;`,
    },
    takeaways: [
      'SELECT <cols> FROM <table> is the minimal query; always list columns explicitly.',
      'Logical order is FROM, WHERE, GROUP BY, HAVING, SELECT, ORDER BY, LIMIT.',
      'Aliases defined in SELECT are visible to ORDER BY, not WHERE.',
      'Column expressions can be arithmetic, functions, CASE, or scalar subqueries.',
    ],
    mistakes: [
      'Using SELECT * in application code — fragile, slow, and self-documenting in the wrong direction.',
      'Trying to reference a SELECT alias inside WHERE — it has not been computed yet.',
      'Forgetting that NULL flows through arithmetic — NULL + 1 is NULL, not 1.',
    ],
    next: 'where-clauses',
  },
  {
    id: 'where-clauses',
    title: 'Foundations · WHERE Clauses',
    subtitle: 'Filtering rows with predicates — equality, ranges, sets, and patterns.',
    intro: `WHERE is the filter that decides which rows from FROM survive to the next stage. It evaluates a boolean expression per row; only rows where the expression is TRUE pass through. Rows where the expression is FALSE or UNKNOWN (NULL) are discarded — that NULL detail trips up nearly everyone the first time.

The comparison operators are the usual = (not == ), <>, !=, <, <=, >, >=. Strings compare lexicographically; the collation determines case sensitivity. Dates and timestamps compare chronologically. Combine predicates with AND, OR, NOT. Parenthesise when mixing — operator precedence puts AND above OR, so a OR b AND c means a OR (b AND c).

Several syntactic conveniences cover the most common shapes. BETWEEN x AND y is inclusive on both ends — equivalent to col >= x AND col <= y. IN (1, 2, 3) is a membership test, equivalent to col = 1 OR col = 2 OR col = 3 but much more readable and often optimised differently. LIKE 'A%' is pattern matching: % matches any sequence, _ matches one character. For case-insensitive matching, Postgres has ILIKE; other dialects need LOWER(col) LIKE LOWER('a%').

NULL semantics require a separate operator. col = NULL is always UNKNOWN — never TRUE — because NULL means unknown and you cannot compare anything to unknown. Use col IS NULL or col IS NOT NULL. This shows up most painfully when filtering: WHERE country != 'US' silently drops rows where country is NULL, which is rarely what you intended.

Indexes help WHERE perform on big tables: a B-tree index on country lets the database find country = 'US' rows without scanning everything. Functions on the indexed column (WHERE LOWER(email) = ...) usually defeat the index unless you also have a functional index.`,
    code: `-- Filter by equality, range, membership, and pattern
SELECT name, salary
FROM employees
WHERE country = 'US'
  AND salary BETWEEN 80000 AND 150000
  AND department_id IN (1, 3, 5)
  AND email LIKE '%@pgcode.com';`,
    exercise: {
      prompt: `Return the names of employees in country US.`,
      starter: `-- write your SELECT here`,
      expected: `SELECT name FROM employees WHERE country = 'US';`,
    },
    takeaways: [
      'WHERE evaluates a boolean per row; only TRUE rows pass — FALSE and UNKNOWN are dropped.',
      'BETWEEN is inclusive, IN is set membership, LIKE matches patterns with % and _.',
      'Use IS NULL / IS NOT NULL — never = NULL or != NULL.',
      'Wrapping an indexed column in a function in WHERE usually defeats the index.',
    ],
    mistakes: [
      'WHERE col != "X" silently drops NULL rows — add OR col IS NULL when you want them.',
      'Forgetting precedence — a OR b AND c is a OR (b AND c); parenthesise to be safe.',
      'Using LIKE with a leading % — prevents index prefix lookup, forces a full scan.',
    ],
    next: 'order-and-limit',
  },
  {
    id: 'order-and-limit',
    title: 'Foundations · ORDER BY and LIMIT',
    subtitle: 'Sorting results deterministically and capping how many rows come back.',
    intro: `Rows in a relational table have no inherent order — the storage engine is free to return them in whatever order is convenient. If your query needs a specific order, you must ask for it with ORDER BY. The clause takes a comma-separated list of expressions; each can be followed by ASC (default) or DESC. Sorting by multiple columns is lexicographic — sort by the first, then break ties with the second, and so on.

You can ORDER BY a column position (ORDER BY 1) or a SELECT alias (ORDER BY hire_year DESC). Position is fragile — if you reorder SELECT columns, the ORDER changes meaning silently — so prefer aliases. NULLs sort first or last depending on dialect; Postgres puts NULLs last by default for ASC and first for DESC, but lets you override with NULLS FIRST / NULLS LAST.

LIMIT n returns at most the first n rows after ordering. Combined with OFFSET m, it lets you paginate: page 3 of 10-per-page is LIMIT 10 OFFSET 20. Pagination by OFFSET is simple but gets slow on large offsets because the database still has to scan and skip the first 20 rows. For deep pagination, prefer keyset pagination — WHERE id > <last_seen_id> ORDER BY id LIMIT 10 — which scans only the rows you actually return.

A SELECT with LIMIT but no ORDER BY is non-deterministic. Postgres might return row A on Monday and row B on Tuesday because a vacuum reshuffled the heap. Always pair LIMIT with ORDER BY when the result must be reproducible — for tests, screenshots, or anything user-facing.

SQL Server uses TOP instead of LIMIT (SELECT TOP 10 *); Oracle traditionally used ROWNUM but now supports FETCH FIRST 10 ROWS ONLY from the SQL:2008 standard.`,
    code: `-- Top 5 highest-paid US employees, then break ties by name
SELECT name, salary
FROM employees
WHERE country = 'US'
ORDER BY salary DESC, name ASC
LIMIT 5;`,
    exercise: {
      prompt: `Return the names of the 10 most-recently-hired employees, most recent first.`,
      starter: `-- write your SELECT here`,
      expected: `SELECT name FROM employees ORDER BY hired_at DESC LIMIT 10;`,
    },
    takeaways: [
      'Table rows have no inherent order — ORDER BY is the only guarantee.',
      'ORDER BY a, b sorts lexicographically — by a, then b for ties.',
      'LIMIT without ORDER BY is non-deterministic — pair them whenever reproducibility matters.',
      'OFFSET is fine for shallow pages; use keyset pagination for deep ones.',
    ],
    mistakes: [
      'Trusting the apparent order from a previous query — engines reorder freely between runs.',
      'Paginating with huge OFFSETs and wondering why page 1000 is slow.',
      'Forgetting that NULLs may sort first or last depending on dialect.',
    ],
    next: 'distinct-and-aliases',
  },
  {
    id: 'distinct-and-aliases',
    title: 'Foundations · DISTINCT and Aliases',
    subtitle: 'Deduplicating rows and renaming columns or tables for readability.',
    intro: `DISTINCT removes duplicate rows from a result. Written immediately after SELECT, it deduplicates based on the entire row — not just one column. SELECT DISTINCT country, role FROM employees returns every unique (country, role) pair, not every distinct country with one arbitrary role.

DISTINCT is logically a sort-then-deduplicate, which means it can be expensive on large result sets. Two more efficient alternatives often exist. If you only need the set of distinct values in one column, the database may pick a faster index-only scan when you write SELECT DISTINCT department_id FROM employees rather than GROUP BY. Conversely, when you also need an aggregate (count per department), GROUP BY department_id is the right tool — DISTINCT is for raw deduplication, not aggregation.

Aliases rename columns and tables in the result. AS is optional but improves readability. SELECT salary * 12 AS annual_pay turns an arithmetic expression into a named column the rest of the query can refer to in ORDER BY and (in some dialects) HAVING. Table aliases — FROM employees AS e — let you write short, readable joins: e.id, e.name instead of employees.id, employees.name. They become mandatory when a query references the same table twice (self-join) or when two joined tables share a column name.

Aliases are also the only way to give a derived value a name. Without one, SELECT COUNT(*) FROM employees returns a column literally called count or ?column? depending on dialect — useless for downstream tooling. SELECT COUNT(*) AS employee_count names it.

A subtle gotcha: aliases defined in SELECT are visible in ORDER BY but not always in WHERE, GROUP BY, or HAVING, because of the logical evaluation order. Postgres extends this — HAVING can reference SELECT aliases — but standard SQL does not.`,
    code: `-- Distinct (country, currency) pairs, plus a readable alias
SELECT DISTINCT
  country AS country_code,
  currency AS currency_code
FROM employees
ORDER BY country_code;`,
    exercise: {
      prompt: `Return every distinct country present in the employees table, sorted alphabetically.`,
      starter: `-- write your SELECT here`,
      expected: `SELECT DISTINCT country FROM employees ORDER BY country;`,
    },
    takeaways: [
      'DISTINCT deduplicates on the full row, not on the first column.',
      'For one-column distinct values, DISTINCT and GROUP BY are usually equivalent.',
      'Aliases name expressions and shorten table references; AS is optional but readable.',
      'Aliases are visible to ORDER BY but typically not to WHERE or GROUP BY.',
    ],
    mistakes: [
      'Writing DISTINCT col1, col2 and expecting col2 to be arbitrary — it deduplicates pairs.',
      'Using DISTINCT to paper over a buggy join that produced unwanted duplicates.',
      'Naming an alias the same as an existing column — masks the original confusingly.',
    ],
    next: 'insert-rows',
  },
  {
    id: 'insert-rows',
    title: 'Foundations · INSERT Rows',
    subtitle: 'Adding new rows — single, multi-row, and from-SELECT forms.',
    intro: `INSERT adds new rows to a table. The simplest form names columns explicitly and provides matching values: INSERT INTO employees (name, email, country) VALUES ('Ada', 'ada@pgcode.com', 'UK'). The explicit column list is critical — if you skip it and write INSERT INTO employees VALUES (...), you are bound to the current column order, which makes future schema changes a footgun.

Multi-row inserts are far faster than running one INSERT per row because each statement carries connection, parsing, and transaction overhead. VALUES can take many tuples: INSERT INTO employees (name, country) VALUES ('Ada', 'UK'), ('Bo', 'JP'), ('Cy', 'US'). For large bulk loads, dialect-specific tools — Postgres COPY, MySQL LOAD DATA INFILE — beat even multi-row INSERT by 10x or more.

INSERT ... SELECT copies data from one query into a table — handy for archiving, snapshots, or backfilling a new column. INSERT INTO employees_archive SELECT * FROM employees WHERE hired_at < '2020-01-01'. The column list of the SELECT must match the target's column list in count, order, and types.

The RETURNING clause (Postgres, modern SQLite, MariaDB, soon MySQL) is invaluable: INSERT ... RETURNING id, created_at returns the rows you just inserted, including auto-generated columns like serial IDs or DEFAULT-clauses. Without it you would need a second round-trip with currval or LAST_INSERT_ID(), which races under concurrency.

Conflict handling: INSERT ... ON CONFLICT (id) DO NOTHING (Postgres) or INSERT IGNORE (MySQL) lets you write idempotent inserts that quietly skip duplicates. ON CONFLICT ... DO UPDATE turns INSERT into an upsert — insert if absent, update if present — which is the only race-safe way to do that pattern.`,
    code: `-- Single, multi-row, and insert-from-select
INSERT INTO employees (name, email, country)
VALUES ('Ada Lovelace', 'ada@pgcode.com', 'UK');

INSERT INTO employees (name, country) VALUES
  ('Grace Hopper', 'US'),
  ('Linus Torvalds', 'FI'),
  ('Margaret Hamilton', 'US');

INSERT INTO employees_archive
SELECT * FROM employees WHERE hired_at < '2020-01-01';`,
    exercise: {
      prompt: `Insert a single employee row with name 'Test User' and country 'US'.`,
      starter: `-- write your INSERT here`,
      expected: `INSERT INTO employees (name, country) VALUES ('Test User', 'US');`,
    },
    takeaways: [
      'Always provide an explicit column list — shields you from future schema reorderings.',
      'Multi-row VALUES is 10x+ faster than one INSERT per row; bulk tools faster still.',
      'INSERT ... SELECT moves rows between tables; the column shapes must match.',
      'RETURNING and ON CONFLICT make inserts race-safe and idempotent.',
    ],
    mistakes: [
      'INSERT INTO t VALUES (...) without a column list — fragile to schema changes.',
      'Inserting rows one by one in a loop instead of batching — orders of magnitude slower.',
      'Forgetting that auto-increment / serial ids skip values after rollbacks — gaps are normal.',
    ],
    next: 'update-rows',
  },
  {
    id: 'update-rows',
    title: 'Foundations · UPDATE Rows',
    subtitle: 'Modifying existing rows with SET — and the WHERE clause that prevents disaster.',
    intro: `UPDATE modifies columns in existing rows. Shape: UPDATE <table> SET col1 = expr1, col2 = expr2 WHERE <predicate>. The SET clause can use any expression, including the current value of other columns: SET salary = salary * 1.05.

The most important rule for UPDATE is the WHERE clause is mandatory in your head, even when the syntax does not require it. UPDATE employees SET salary = 0 with no WHERE silently zeroes every salary in the table. Most senior engineers have a story about this. Many teams enforce policies — SQL linters, sql_safe_updates in MySQL, BEGIN before every UPDATE — that block writes without WHERE. The single safest habit is to first write the equivalent SELECT, eyeball the row count, then convert it to an UPDATE.

UPDATE ... FROM (Postgres, SQL Server) lets you compute new values from a join: UPDATE employees e SET department_id = d.id FROM departments d WHERE e.dept_name = d.name. MySQL uses an alternative syntax with multi-table UPDATE.

RETURNING (Postgres, SQLite, MariaDB) shows you what you changed: UPDATE employees SET salary = salary * 1.05 WHERE department_id = 3 RETURNING id, salary. Invaluable for audit and verification.

Concurrency is a real concern. Two UPDATEs to the same row from two transactions block each other (row-level lock). If you read a value, compute a new one in your application, then write it back, you can lose updates — between your read and write someone else committed. Use SELECT ... FOR UPDATE to lock the row when you read it, or write the update as a single statement using the column itself (SET salary = salary * 1.05) which is atomic at the row level.

Bulk UPDATEs on big tables can block other writers, generate huge WAL/redo logs, and stall replication. Split them into batches of a few thousand rows when working in production.`,
    code: `-- Single-row update, expression update, and join update
UPDATE employees
SET salary = 95000
WHERE id = 42;

UPDATE employees
SET salary = salary * 1.05
WHERE department_id = 3;

UPDATE employees e
SET department_id = d.id
FROM departments d
WHERE e.department_name = d.name;`,
    exercise: {
      prompt: `Bump every US employee's salary by 10%.`,
      starter: `-- write your UPDATE here`,
      expected: `UPDATE employees SET salary = salary * 1.10 WHERE country = 'US';`,
    },
    takeaways: [
      'UPDATE without WHERE rewrites every row — always SELECT first, then convert.',
      'Use expressions on the column itself (salary = salary * 1.05) to stay race-safe.',
      'UPDATE ... FROM joins another table to compute new values; dialect varies.',
      'Split very large updates into batches to avoid replication lag and lock contention.',
    ],
    mistakes: [
      'UPDATE with no WHERE — the canonical destruction-of-a-table mistake.',
      'Reading a value into the application, computing, then writing back — lost updates.',
      'Updating millions of rows in one statement and locking out other writers.',
    ],
    next: 'delete-rows',
  },
  {
    id: 'delete-rows',
    title: 'Foundations · DELETE Rows',
    subtitle: 'Removing rows safely — DELETE, TRUNCATE, and soft deletes.',
    intro: `DELETE removes rows that match a predicate. Shape: DELETE FROM <table> WHERE <predicate>. Like UPDATE, the WHERE clause is technically optional and existentially mandatory. DELETE FROM employees with no WHERE removes every row — and unlike a dropped table, it does so one row at a time, slowly, while writing every removal to the transaction log.

TRUNCATE is the bulldozer alternative: TRUNCATE TABLE employees deletes every row in O(1) by deallocating the underlying pages. It is much faster but has trade-offs. TRUNCATE in most dialects is DDL — it cannot be rolled back in MySQL InnoDB the same way DELETE can (Postgres TRUNCATE is transactional), it resets auto-increment counters, and it bypasses ON DELETE triggers and foreign-key cascades.

Foreign keys complicate deletion. If projects.employee_id references employees.id with no ON DELETE clause, you cannot delete an employee with projects — the engine raises a constraint violation. Choices: ON DELETE RESTRICT (refuse, default), ON DELETE CASCADE (delete the dependent rows too), ON DELETE SET NULL (null the reference), ON DELETE SET DEFAULT (use the column default). Choose deliberately at table-creation time — changing later is annoying.

Soft deletes — UPDATE rows SET deleted_at = NOW() — are popular in application code. Benefits: easy restore, audit trail, no cascade headaches. Costs: every query must remember to filter WHERE deleted_at IS NULL, indexes get bloated with dead rows, and aggregates must exclude them. A common pattern is a deleted_at TIMESTAMP NULL column plus a partial index ON ... WHERE deleted_at IS NULL.

For periodic cleanups — old logs, expired sessions — prefer batched deletes (DELETE ... LIMIT 5000 in a loop) so you don't lock the table for minutes.`,
    code: `-- Single-row, conditional, and batched deletes
DELETE FROM employees WHERE id = 42;

DELETE FROM sessions WHERE expires_at < NOW();

-- Truncate the whole table fast (DDL, no per-row triggers)
TRUNCATE TABLE staging_imports;`,
    exercise: {
      prompt: `Delete every employee whose country is 'XX' (test data).`,
      starter: `-- write your DELETE here`,
      expected: `DELETE FROM employees WHERE country = 'XX';`,
    },
    takeaways: [
      'DELETE without WHERE empties the table row by row — usually catastrophic.',
      'TRUNCATE is faster but skips triggers and may reset auto-increments.',
      'Foreign keys decide what happens to dependents — pick the ON DELETE behaviour upfront.',
      'Soft deletes ease restore but force every query to filter deleted_at IS NULL.',
    ],
    mistakes: [
      'Forgetting that DELETE writes to the transaction log — multi-million-row deletes can fill it.',
      'Issuing TRUNCATE thinking it can be rolled back the same way DELETE can.',
      'Adding soft delete and then writing one query that forgets the deleted_at filter.',
    ],
    next: 'null-semantics',
  },
  {
    id: 'null-semantics',
    title: 'Foundations · NULL Semantics',
    subtitle: 'Three-valued logic, IS NULL vs =, and the COALESCE escape hatch.',
    intro: `NULL is SQL's marker for unknown or missing. It is not a value — it is the absence of a value. This single fact rewrites the rules of boolean logic. Anything compared to NULL is UNKNOWN, not TRUE or FALSE. NULL = NULL is UNKNOWN. NULL != NULL is UNKNOWN. NULL OR FALSE is UNKNOWN. NULL AND FALSE is FALSE (because AND with FALSE is always FALSE regardless of the other operand). This is three-valued logic — TRUE, FALSE, UNKNOWN — and it surprises everyone.

Practical consequences. WHERE col = NULL never matches anything; use WHERE col IS NULL. WHERE col != 'US' silently drops rows where col is NULL — write WHERE col != 'US' OR col IS NULL or WHERE COALESCE(col, '') != 'US' when you want to include NULLs. SELECT NULL + 1 returns NULL, not 1 — arithmetic propagates NULL. String concatenation in Postgres returns NULL when any operand is NULL ('hello' || NULL is NULL), though Oracle returns 'hello'.

NULL in aggregates: COUNT(*) counts rows regardless; COUNT(col) skips rows where col is NULL. SUM, AVG, MAX, MIN ignore NULLs. AVG on a column with three rows of 10, 20, NULL returns 15, not 10. Some dialects offer COUNT(DISTINCT col) which also skips NULLs.

NULL in indexes: most databases store NULL in B-tree indexes, so IS NULL queries can use the index. Composite uniqueness with NULLs is tricky — Postgres treats two NULLs as distinct by default, MySQL also, but the upcoming SQL:2023 NULLS NOT DISTINCT option changes this.

COALESCE(a, b, c) returns the first non-NULL argument. NULLIF(a, b) returns NULL if a = b, otherwise a — useful for turning sentinel values into NULLs. CASE WHEN col IS NULL THEN ... ELSE ... END is the verbose escape hatch.`,
    code: `-- Counting, defaulting, and filtering NULLs correctly
SELECT
  COUNT(*) AS total_rows,
  COUNT(email) AS rows_with_email,
  COALESCE(country, 'unknown') AS country_or_default
FROM employees
WHERE email IS NOT NULL;`,
    exercise: {
      prompt: `Return the names of employees whose email is NULL.`,
      starter: `-- write your SELECT here`,
      expected: `SELECT name FROM employees WHERE email IS NULL;`,
    },
    takeaways: [
      'NULL is unknown, not a value — comparison with = always yields UNKNOWN.',
      'Use IS NULL / IS NOT NULL; never = NULL or != NULL.',
      'COUNT(*) counts rows; COUNT(col) and aggregates skip NULL rows.',
      'COALESCE(a, b, c) and NULLIF(a, b) are the everyday NULL utilities.',
    ],
    mistakes: [
      'Filtering with col != X and being surprised NULLs vanished from the result.',
      'Computing AVG on a column with NULLs and assuming the NULLs were treated as 0.',
      'Joining on a nullable column with no IS NOT NULL guard and producing unwanted Cartesian sections.',
    ],
    next: 'data-types-overview',
  },
  {
    id: 'data-types-overview',
    title: 'Foundations · Data Types Overview',
    subtitle: 'Integers, decimals, strings, dates, booleans, JSON — picking the right one.',
    intro: `Choosing the right data type pays compounding dividends — storage, index size, query speed, and bug class all depend on it. The major categories every database supports are integers, floating-point, exact decimal, strings, dates and timestamps, booleans, binary blobs, and increasingly JSON.

Integers: SMALLINT (2 bytes, ~32k range), INTEGER (4 bytes, ~2.1 billion), BIGINT (8 bytes). Use INTEGER for most ids; BIGINT when you might exceed 2 billion rows (Twitter found out the hard way). Auto-increment via SERIAL (Postgres) or AUTO_INCREMENT (MySQL); modern advice is IDENTITY columns or UUIDs.

Floating-point vs decimal: REAL and DOUBLE PRECISION are IEEE 754 floats — fast, inexact, lose pennies. Never use them for money. NUMERIC(p, s) or DECIMAL(p, s) stores exact base-10 numbers with p total digits and s after the decimal point. NUMERIC(12, 2) holds amounts up to 9,999,999,999.99 cents — fine for prices. Slower than floats but correct.

Strings: VARCHAR(n) variable-length up to n chars, CHAR(n) fixed-length padded, TEXT unlimited. In Postgres VARCHAR and TEXT have identical performance — the length is just a constraint. Pick TEXT unless you genuinely need to enforce a max length.

Dates and timestamps: DATE (YYYY-MM-DD), TIME, TIMESTAMP (no time zone), TIMESTAMP WITH TIME ZONE (stores UTC internally, converts on read). For anything user-facing, always use TIMESTAMP WITH TIME ZONE; storing local times is a perennial source of bugs across daylight-saving boundaries.

Booleans: Postgres has a real BOOLEAN type. MySQL aliases BOOLEAN to TINYINT(1) — 0 and 1.

JSON / JSONB: Postgres JSONB is binary-encoded and indexable; JSON is text. Use JSONB for searchable nested data; promote frequently queried keys to real columns once the shape stabilises.`,
    code: `-- Picking types deliberately
CREATE TABLE invoices (
  id BIGSERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL,
  amount_cents NUMERIC(12, 0) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  notes TEXT,
  metadata JSONB,
  issued_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  is_paid BOOLEAN NOT NULL DEFAULT FALSE
);`,
    exercise: {
      prompt: `Create a products table with id (auto-increment), name (text), and price (exact decimal up to 999999.99).`,
      starter: `-- write your CREATE TABLE here`,
      expected: `CREATE TABLE products (id SERIAL PRIMARY KEY, name TEXT NOT NULL, price NUMERIC(8, 2) NOT NULL);`,
    },
    takeaways: [
      'Use NUMERIC / DECIMAL for money — never FLOAT / REAL, which lose pennies.',
      'Prefer TEXT over VARCHAR in Postgres unless you genuinely need a length cap.',
      'Always store timestamps as TIMESTAMP WITH TIME ZONE; UTC inside, convert on read.',
      'Promote frequently queried JSONB keys to real columns once their shape stabilises.',
    ],
    mistakes: [
      'Storing currency in FLOAT and watching pennies vanish in aggregations.',
      'Storing local timestamps without a zone, then debugging DST jumps for a week.',
      'Picking INTEGER for an id column that will outgrow 2 billion rows.',
    ],
    next: 'inner-join',
  },

  // ─── Joins & Aggregation (10) ───────────────────────────────────
  {
    id: 'inner-join',
    title: 'Joins & Aggregation · INNER JOIN',
    subtitle: 'The default join — only rows with a match in both tables.',
    intro: `JOIN is the operation that makes relational databases relational. INNER JOIN combines rows from two tables where a join predicate is true; rows with no match on either side are dropped. Shape: SELECT ... FROM a JOIN b ON a.fk = b.id. The ON clause can be any boolean expression, not just equality, but equality is by far the most common.

Mentally, an INNER JOIN is a filter on the Cartesian product. The database conceptually pairs every row in a with every row in b, then keeps only the pairs where the ON predicate is true. Real engines never build the full product — they use hash joins, merge joins, or nested-loop joins depending on table sizes and indexes — but the semantic model is the Cartesian product.

A JOIN with no ON clause (or with ON TRUE) is a CROSS JOIN — every row paired with every row. That is almost never what you want, and writing JOIN without an ON often raises a syntax error in modern dialects to protect you.

INNER JOIN is the default — many dialects let you write just JOIN and infer INNER. Explicit INNER JOIN is more readable in code reviews.

When the foreign-key column has the same name on both sides — a.user_id and b.user_id — USING (user_id) is shorthand for ON a.user_id = b.user_id and outputs the column only once. NATURAL JOIN auto-joins on every column with the same name in both tables; it is dangerous and discouraged because schema changes (a new column added to both tables) silently change the join condition.

Always alias tables in joins: FROM employees e JOIN departments d ON e.department_id = d.id. Without aliases, ambiguous columns must be fully qualified, which is verbose and error-prone.`,
    code: `-- Each employee plus their department name
SELECT e.name AS employee, d.name AS department
FROM employees e
JOIN departments d ON e.department_id = d.id
ORDER BY d.name, e.name;`,
    exercise: {
      prompt: `Return each employee's name alongside their department's name. Employees without a department should be excluded.`,
      starter: `-- write your JOIN here`,
      expected: `SELECT e.name, d.name FROM employees e JOIN departments d ON e.department_id = d.id;`,
    },
    takeaways: [
      'INNER JOIN keeps only rows with a match on both sides; non-matches vanish.',
      'Always write an ON predicate — JOIN without ON is a CROSS JOIN by accident.',
      'Alias tables to keep column references short and unambiguous.',
      'Prefer explicit INNER JOIN over the bare JOIN keyword for readability.',
    ],
    mistakes: [
      'Forgetting the ON clause and producing a Cartesian product that locks up the database.',
      'Joining on a nullable column without realising NULLs never match anything.',
      'Using NATURAL JOIN — a future schema change silently changes the join shape.',
    ],
    next: 'left-join',
  },
  {
    id: 'left-join',
    title: 'Joins & Aggregation · LEFT JOIN',
    subtitle: 'Keep every row from the left side; NULL out the right when no match exists.',
    intro: `LEFT JOIN (LEFT OUTER JOIN) keeps every row from the left table and pads with NULLs when the right table has no match. It is the join you want for I want every X, and the corresponding Y if there is one — every employee, with their manager if any; every order, with its shipping address if any.

Shape: FROM left_table l LEFT JOIN right_table r ON l.id = r.left_id. Rows in left_table with no matching r row still appear in the result, with every r.* column set to NULL.

A common idiom is the anti-join via LEFT JOIN ... WHERE r.id IS NULL — that returns rows from the left side with no match on the right. Useful for find employees with no projects or find orders not yet shipped. Modern SQL also offers NOT EXISTS, which is often clearer and sometimes faster.

The biggest beginner trap is filtering on the right table in WHERE instead of ON. WHERE r.col = 'X' silently turns a LEFT JOIN into an INNER JOIN, because rows where r.col is NULL (the unmatched rows) fail the equality. If you want to filter only on rows that did match — and still keep the unmatched ones — put the filter in the ON clause: LEFT JOIN r ON l.id = r.left_id AND r.col = 'X'.

LEFT JOINs cascade. SELECT ... FROM a LEFT JOIN b ON ... LEFT JOIN c ON ... preserves all rows from a, joining b where possible and c where possible. Each link from a row in a to a row in b may match multiple rows, in which case the row from a is repeated — a join can grow the row count even when it semantically shouldn't.

RIGHT JOIN is the mirror image but rarely used; it is clearer to swap the operand order and use LEFT JOIN.`,
    code: `-- Every employee plus their department; unassigned employees still appear
SELECT e.name AS employee, d.name AS department
FROM employees e
LEFT JOIN departments d ON e.department_id = d.id
ORDER BY e.name;`,
    exercise: {
      prompt: `Return every employee's name and their department name; employees without a department should still appear with NULL.`,
      starter: `-- write your LEFT JOIN here`,
      expected: `SELECT e.name, d.name FROM employees e LEFT JOIN departments d ON e.department_id = d.id;`,
    },
    takeaways: [
      'LEFT JOIN keeps every left-side row; right-side columns are NULL when unmatched.',
      'Anti-join idiom: LEFT JOIN ... WHERE right.id IS NULL — rows with no match.',
      'Filtering the right table in WHERE silently converts LEFT JOIN to INNER JOIN.',
      'A join with multiple matches multiplies the row count — even a LEFT JOIN.',
    ],
    mistakes: [
      'Putting r.col = X in WHERE instead of ON and losing the unmatched left rows.',
      'Assuming a LEFT JOIN cannot increase the row count — it can, if the right side has duplicates.',
      'Using RIGHT JOIN when swapping the operands and writing LEFT JOIN would be clearer.',
    ],
    next: 'right-join',
  },
  {
    id: 'right-join',
    title: 'Joins & Aggregation · RIGHT JOIN',
    subtitle: 'The mirror image of LEFT JOIN — useful occasionally, swap-able always.',
    intro: `RIGHT JOIN (RIGHT OUTER JOIN) is LEFT JOIN's mirror image. It keeps every row from the right table and pads with NULLs when the left has no match. Semantically, a RIGHT b is identical to b LEFT a — so RIGHT JOIN is mostly redundant. Most style guides discourage it because reading left-to-right matches reading a LEFT JOIN.

Why does it exist? Two reasons. First, generated SQL — ORMs and reporting tools sometimes emit RIGHT JOINs when the user picks a different table as the primary entity in a UI. Second, very occasionally, a query reads more naturally with RIGHT JOIN because the right table is conceptually the dominant one and you do not want to restructure the FROM order — for example when many CTEs and subqueries already chain into a long FROM clause.

Behaviourally, every rule from LEFT JOIN applies symmetrically. Filtering the left table in WHERE converts the RIGHT JOIN back to an INNER JOIN. The right table dictates the row count baseline; matches on the left multiply or NULL.

Performance is identical to a rewritten LEFT JOIN — query planners normalise both into the same internal representation. Pick the one that reads better to a teammate reviewing your code; that is usually LEFT JOIN.

In legacy codebases or generated SQL, you will see RIGHT JOIN occasionally. When refactoring, you can always rewrite a RIGHT b ON p as b LEFT a ON p and swap the SELECT column references — the result is the same.`,
    code: `-- Every department plus its employees; departments with no employees still appear
SELECT d.name AS department, e.name AS employee
FROM employees e
RIGHT JOIN departments d ON e.department_id = d.id
ORDER BY d.name, e.name;

-- Equivalent rewrite as LEFT JOIN — usually clearer
SELECT d.name AS department, e.name AS employee
FROM departments d
LEFT JOIN employees e ON e.department_id = d.id
ORDER BY d.name, e.name;`,
    exercise: {
      prompt: `Return every department name with the names of its employees, including departments with no employees. Use RIGHT JOIN.`,
      starter: `-- write your RIGHT JOIN here`,
      expected: `SELECT d.name, e.name FROM employees e RIGHT JOIN departments d ON e.department_id = d.id;`,
    },
    takeaways: [
      'RIGHT JOIN is LEFT JOIN with the operands swapped — semantically equivalent.',
      'Most style guides prefer LEFT JOIN for left-to-right readability.',
      'All LEFT JOIN gotchas apply symmetrically — beware WHERE filters on the left side.',
      'Query planners normalise RIGHT and LEFT identically; performance is the same.',
    ],
    mistakes: [
      'Writing RIGHT JOIN out of habit when LEFT JOIN with swapped operands reads better.',
      'Filtering the left table in WHERE and silently dropping the unmatched right rows.',
      'Mixing RIGHT and LEFT in the same multi-table query — hard to reason about.',
    ],
    next: 'full-outer-join',
  },
  {
    id: 'full-outer-join',
    title: 'Joins & Aggregation · FULL OUTER JOIN',
    subtitle: 'Keep every row from both sides; NULL out wherever a match is missing.',
    intro: `FULL OUTER JOIN keeps every row from both tables. Where a match exists, the row contains values from both sides; where it does not, the missing side is NULL. It is the union of LEFT and RIGHT outer joins minus the double-counted matches.

This is the join you want for set-difference reconciliations — comparing two snapshots, finding orphans on either side, diffing tables. SELECT a.id, b.id FROM a FULL OUTER JOIN b ON a.id = b.id WHERE a.id IS NULL OR b.id IS NULL gives you everything that exists on exactly one side.

Support is uneven. Postgres, SQL Server, Oracle, and DB2 implement FULL OUTER JOIN natively. MySQL and older SQLite versions do not — you simulate it with a UNION ALL of a LEFT JOIN and a RIGHT JOIN ... WHERE other_id IS NULL. SQLite added support in version 3.39 (2022).

Because FULL OUTER JOIN includes NULLs from both sides, your aggregates and filters must handle them. COALESCE(a.id, b.id) is a common pattern to pick whichever id exists.

Performance can be noticeable: a FULL OUTER JOIN typically does a hash join over both tables, materialising the entire result before filtering. On very large tables, consider whether you really need both sides — often a LEFT JOIN with the appropriate IS NULL filter answers your question with less work.

A practical use case is data migration verification: FULL OUTER JOIN the old table to the new table by id, count rows where either side is NULL, and you have a one-line audit of what migrated cleanly.`,
    code: `-- Reconcile employees and badge_assignments — find mismatches on either side
SELECT e.id AS employee_id, b.id AS badge_id
FROM employees e
FULL OUTER JOIN badge_assignments b ON e.id = b.employee_id
WHERE e.id IS NULL OR b.id IS NULL;`,
    exercise: {
      prompt: `Combine every row from employees and contractors on shared email, keeping unmatched rows from both sides.`,
      starter: `-- write your FULL OUTER JOIN here`,
      expected: `SELECT e.name, c.name FROM employees e FULL OUTER JOIN contractors c ON e.email = c.email;`,
    },
    takeaways: [
      'FULL OUTER JOIN keeps every row from both sides; missing matches become NULL.',
      'Perfect for reconciliations — find rows in exactly one table with IS NULL filters.',
      'MySQL lacks native FULL OUTER JOIN; simulate with UNION ALL of LEFT and anti-LEFT.',
      'Use COALESCE to fold matching-side ids into a single column.',
    ],
    mistakes: [
      'Assuming FULL OUTER JOIN exists everywhere — check the dialect first.',
      'Forgetting that aggregates must skip the NULLs that FULL OUTER JOIN introduces.',
      'Using FULL OUTER JOIN when LEFT JOIN + WHERE IS NULL would answer the same question cheaper.',
    ],
    next: 'cross-join',
  },
  {
    id: 'cross-join',
    title: 'Joins & Aggregation · CROSS JOIN',
    subtitle: 'The Cartesian product — every row paired with every other row.',
    intro: `CROSS JOIN is the unfiltered Cartesian product: every row in a paired with every row in b. The result has |a| * |b| rows. Shape: FROM a CROSS JOIN b. There is no ON clause — by definition, every pair is in the result.

It feels useless until you need it, then nothing else works. Common cases include date or number series generation (CROSS JOIN against a generated series of dates to fill gaps), pivot helpers (every customer crossed with every month), and combinatorial enumeration (every product crossed with every region to seed a sales-forecast table).

CROSS JOIN is dangerous on large tables. Two tables of 100,000 rows produce 10 billion rows — your query will not return before lunch and probably not before retirement. Always think about the size of the product before running one.

Three syntaxes produce a CROSS JOIN. Explicit: FROM a CROSS JOIN b. Implicit via comma: FROM a, b (the old SQL-86 syntax — still legal, but discouraged because it is too easy to forget the WHERE join condition and accidentally produce a giant product). And via INNER JOIN with no useful condition: FROM a JOIN b ON TRUE (legal but weird).

The most common modern use is LATERAL CROSS JOIN (Postgres), which lets the right side reference columns from the left — useful for top-N-per-group queries: FROM departments d CROSS JOIN LATERAL (SELECT * FROM employees WHERE department_id = d.id ORDER BY salary DESC LIMIT 3) e.

Generating a date series in Postgres: SELECT * FROM generate_series('2024-01-01'::date, '2024-12-31'::date, '1 day') AS d(date) CROSS JOIN ...`,
    code: `-- Every product crossed with every month — useful for seeding a forecast table
SELECT p.id AS product_id, m.month
FROM products p
CROSS JOIN (VALUES (1), (2), (3), (4), (5), (6), (7), (8), (9), (10), (11), (12)) AS m(month);`,
    exercise: {
      prompt: `Produce every (color, size) pair from the two tables. Use a CROSS JOIN.`,
      starter: `-- write your CROSS JOIN here`,
      expected: `SELECT c.color, s.size FROM colors c CROSS JOIN sizes s;`,
    },
    takeaways: [
      'CROSS JOIN is the unfiltered Cartesian product — |a| * |b| rows.',
      'Useful for series generation, pivot scaffolding, and combinatorial enumeration.',
      'Always think about the size of the product before running it on large tables.',
      'LATERAL CROSS JOIN (Postgres) is the standard top-N-per-group tool.',
    ],
    mistakes: [
      'Forgetting the WHERE clause in the old comma-join syntax and producing a 10-billion-row product.',
      'Using CROSS JOIN on multi-million-row tables — never returns.',
      'Reaching for CROSS JOIN when an inequality JOIN with ON would do the same thing cheaper.',
    ],
    next: 'self-join',
  },
  {
    id: 'self-join',
    title: 'Joins & Aggregation · Self Join',
    subtitle: 'Joining a table to itself — managers, hierarchies, and pairwise comparisons.',
    intro: `A self join is a join where both operands are the same table — disambiguated by aliases. The table appears twice in the FROM clause under different names, and the ON predicate relates rows of the table to other rows of the same table.

The canonical use case is hierarchies. An employees table where every row has a manager_id pointing to another row in employees encodes a tree. SELECT e.name AS employee, m.name AS manager FROM employees e LEFT JOIN employees m ON e.manager_id = m.id gives you every employee alongside their manager — LEFT JOIN so top-level employees with no manager still appear.

Pairwise comparisons are another common use. SELECT a.name, b.name FROM employees a JOIN employees b ON a.department_id = b.department_id AND a.id < b.id returns every unique pair of co-workers in the same department. The a.id < b.id condition prevents both (X, Y) and (Y, X) appearing, and prevents the trivial (X, X) row.

Self joins can chain: SELECT e.name, m.name AS manager, gm.name AS grand_manager FROM employees e LEFT JOIN employees m ON e.manager_id = m.id LEFT JOIN employees gm ON m.manager_id = gm.id walks two levels up the tree. For arbitrary-depth recursion, recursive CTEs (a later course) are the right tool — self joins only work for fixed-depth walks.

The performance characteristics are identical to joining two different tables — the planner does not care that the storage is shared. The same indexes apply.

Aliases are mandatory in self joins because otherwise every column reference (employees.id) is ambiguous. Pick short, evocative aliases — e for employee, m for manager, child / parent for tree edges — and stick to them across the codebase.`,
    code: `-- Each employee with their manager's name; top-level employees still appear
SELECT e.name AS employee, m.name AS manager
FROM employees e
LEFT JOIN employees m ON e.manager_id = m.id
ORDER BY m.name NULLS FIRST, e.name;`,
    exercise: {
      prompt: `Return each employee's name paired with their manager's name.`,
      starter: `-- write your self join here`,
      expected: `SELECT e.name, m.name FROM employees e JOIN employees m ON e.manager_id = m.id;`,
    },
    takeaways: [
      'A self join uses the same table twice with different aliases — common for hierarchies.',
      'Use a.id < b.id to avoid duplicate pair rows and trivial self-pairs.',
      'LEFT self join preserves top-of-tree rows with no parent.',
      'For arbitrary-depth tree walks, switch from chained self joins to recursive CTEs.',
    ],
    mistakes: [
      'Forgetting aliases — every column is ambiguous and the query fails to parse.',
      'Using INNER JOIN where LEFT JOIN was intended — losing the root or top-level rows.',
      'Producing duplicate pair rows by not applying a < or > tie-breaker.',
    ],
    next: 'group-by-basics',
  },
  {
    id: 'group-by-basics',
    title: 'Joins & Aggregation · GROUP BY Basics',
    subtitle: 'Collapsing many rows into one per group — the foundation of every report.',
    intro: `GROUP BY collapses many rows into one row per distinct value of the grouping columns. The SELECT list can then either reference a grouping column directly or apply an aggregate (COUNT, SUM, AVG, MAX, MIN, etc.) to non-grouping columns. Shape: SELECT col_a, SUM(col_b) FROM t GROUP BY col_a.

Every column in the SELECT list must either appear in GROUP BY or be wrapped in an aggregate. Postgres, modern MySQL, and SQL Server enforce this. Older MySQL would silently let you select a column that was neither grouped nor aggregated and return an arbitrary value from the group — a frequent silent-bug source. Modern MySQL fixes this when ONLY_FULL_GROUP_BY is on, which is the default in 5.7+.

You can GROUP BY multiple columns. The groups are then the distinct tuples — GROUP BY country, department_id makes one group per (country, department_id) pair. The result has at most |distinct(country)| * |distinct(department_id)| rows, usually much fewer because most pairs do not exist.

Expressions and aliases: GROUP BY can take any expression, not just bare columns: GROUP BY EXTRACT(YEAR FROM hired_at), DATE_TRUNC('month', created_at). Some dialects let you GROUP BY a SELECT alias (Postgres does, MySQL does, standard SQL does not). When in doubt, repeat the expression.

NULLs in GROUP BY: NULL values form their own group. GROUP BY country puts every NULL-country row into a single NULL group — which is different from how NULL equality works elsewhere. Aggregates inside still ignore NULLs in their own input column.

GROUP BY ROLLUP and GROUP BY CUBE generate subtotals and cross-totals for free — useful for pivot reports without writing a UNION of multiple queries.`,
    code: `-- Employee count and average salary per country
SELECT
  country,
  COUNT(*) AS headcount,
  AVG(salary) AS avg_salary
FROM employees
GROUP BY country
ORDER BY headcount DESC;`,
    exercise: {
      prompt: `Return each department_id with the number of employees in it.`,
      starter: `-- write your GROUP BY here`,
      expected: `SELECT department_id, COUNT(*) FROM employees GROUP BY department_id;`,
    },
    takeaways: [
      'GROUP BY collapses rows into one per distinct value of the grouping columns.',
      'Every SELECT column must be a grouping column or an aggregate — modern dialects enforce this.',
      'NULL forms its own group; aggregates inside still skip NULL inputs.',
      'ROLLUP and CUBE generate subtotals and cross-totals without writing UNIONs.',
    ],
    mistakes: [
      'Selecting a non-grouped, non-aggregated column on old MySQL and getting an arbitrary value.',
      'Forgetting to GROUP BY every selected non-aggregated column — parse error on modern engines.',
      'GROUP BY on a high-cardinality column and watching the result balloon to millions of rows.',
    ],
    next: 'having-clause',
  },
  {
    id: 'having-clause',
    title: 'Joins & Aggregation · HAVING Clause',
    subtitle: 'WHERE for groups — filtering after aggregation, not before.',
    intro: `HAVING filters the rows produced by GROUP BY using a predicate that may reference aggregates. It is to GROUP BY what WHERE is to FROM. Shape: SELECT col, COUNT(*) FROM t GROUP BY col HAVING COUNT(*) > 10.

The distinction between WHERE and HAVING is one of timing in the logical evaluation order. WHERE runs before GROUP BY — it filters individual rows before they are grouped. HAVING runs after GROUP BY — it filters the resulting groups. You cannot reference an aggregate in WHERE because the aggregate has not been computed yet; you must use HAVING.

A common pattern: WHERE narrows the input rows for performance (uses indexes, reduces work), HAVING filters the aggregated output. SELECT country, AVG(salary) FROM employees WHERE hired_at > '2020-01-01' GROUP BY country HAVING AVG(salary) > 80000 is the typical shape — pre-filter individual rows, group, post-filter aggregates.

HAVING can reference a SELECT alias in Postgres and MySQL — HAVING avg_salary > 80000 if you aliased AVG(salary) — but the SQL standard says aliases are not in scope in HAVING. The safe approach is to repeat the aggregate expression.

A HAVING clause without an aggregate is legal but equivalent to a WHERE — the query planner usually rewrites it. Prefer WHERE in that case for clarity.

You can mix WHERE and HAVING freely: WHERE for row-level filters, HAVING for group-level filters. Both can use boolean combinators (AND, OR, NOT) and any predicate type — including IN, BETWEEN, LIKE on the aggregates themselves: HAVING COUNT(*) BETWEEN 5 AND 50.`,
    code: `-- Departments with more than 10 employees whose average salary exceeds 90k
SELECT
  department_id,
  COUNT(*) AS headcount,
  AVG(salary) AS avg_salary
FROM employees
WHERE country = 'US'
GROUP BY department_id
HAVING COUNT(*) > 10 AND AVG(salary) > 90000
ORDER BY avg_salary DESC;`,
    exercise: {
      prompt: `Return each department_id that has more than 5 employees.`,
      starter: `-- write your GROUP BY with HAVING here`,
      expected: `SELECT department_id, COUNT(*) FROM employees GROUP BY department_id HAVING COUNT(*) > 5;`,
    },
    takeaways: [
      'HAVING filters groups after aggregation; WHERE filters rows before aggregation.',
      'Aggregates are only allowed in HAVING (and SELECT, ORDER BY), not in WHERE.',
      'Use WHERE to narrow input rows for performance, HAVING to filter results.',
      'A HAVING clause without an aggregate is equivalent to WHERE — prefer WHERE for clarity.',
    ],
    mistakes: [
      'Putting an aggregate in WHERE — the parser rejects it; use HAVING.',
      'Filtering only with HAVING when WHERE would have used an index and avoided work.',
      'Forgetting that HAVING runs after GROUP BY — referencing non-grouped columns confuses readers.',
    ],
    next: 'aggregate-functions',
  },
  {
    id: 'aggregate-functions',
    title: 'Joins & Aggregation · Aggregate Functions',
    subtitle: 'COUNT, SUM, AVG, MIN, MAX — and the surprising things they do with NULL.',
    intro: `Aggregate functions reduce many rows into a single value. The five staples are COUNT, SUM, AVG, MIN, MAX; nearly every report combines them. Each ignores NULL inputs (except COUNT(*)), which is a recurring source of subtle mistakes.

COUNT(*) counts rows. COUNT(col) counts rows where col is NOT NULL. COUNT(DISTINCT col) counts distinct non-NULL values. These three are different — knowing which you want is half the work. COUNT(*) is usually fastest because the engine never has to fetch the column.

SUM and AVG operate on numeric columns, skipping NULLs. AVG is not SUM / COUNT(*) when NULLs are present — it is SUM / COUNT(col), so NULL rows are excluded from the denominator. If you want NULL treated as 0, wrap the column: AVG(COALESCE(salary, 0)).

MIN and MAX work on any orderable type — numbers, strings, dates, even booleans. They ignore NULLs. On indexed columns, MIN and MAX of an entire table are O(log n) — the engine reads the leftmost or rightmost index leaf and stops.

GROUP_CONCAT (MySQL) / STRING_AGG (Postgres, SQL Server) / LISTAGG (Oracle) aggregate strings: SELECT department_id, STRING_AGG(name, ', ') FROM employees GROUP BY department_id returns each department with a comma-joined list of member names.

Statistical aggregates exist for serious work: VAR_POP, VAR_SAMP, STDDEV_POP, STDDEV_SAMP, CORR, COVAR_POP, COVAR_SAMP, REGR_*. Postgres has an unusually rich set.

PERCENTILE_CONT and PERCENTILE_DISC are inverse distribution functions — useful for median (PERCENTILE_CONT(0.5)) and quartiles without writing a recursive CTE.

FILTER (Postgres, SQL standard) lets you compute conditional aggregates inline: COUNT(*) FILTER (WHERE country = 'US') AS us_count, COUNT(*) FILTER (WHERE country = 'UK') AS uk_count — much cleaner than CASE WHEN tricks.`,
    code: `-- Headcount, total salary, distinct countries, and longest name per department
SELECT
  department_id,
  COUNT(*) AS headcount,
  SUM(salary) AS total_pay,
  COUNT(DISTINCT country) AS countries_represented,
  MAX(LENGTH(name)) AS longest_name
FROM employees
GROUP BY department_id;`,
    exercise: {
      prompt: `Return the total number of employees and the average salary across the whole table.`,
      starter: `-- write your aggregate here`,
      expected: `SELECT COUNT(*), AVG(salary) FROM employees;`,
    },
    takeaways: [
      'COUNT(*) counts rows; COUNT(col) skips NULL; COUNT(DISTINCT col) skips both NULL and duplicates.',
      'AVG / SUM / MIN / MAX ignore NULL inputs — wrap with COALESCE if you want zeros instead.',
      'STRING_AGG / GROUP_CONCAT joins values from many rows into one delimited string.',
      'FILTER (WHERE ...) is the modern, readable way to write conditional aggregates.',
    ],
    mistakes: [
      'Confusing COUNT(*) with COUNT(col) and getting smaller numbers because NULLs were skipped.',
      'Computing AVG expecting NULLs to count as zero — they do not; the denominator excludes them.',
      'Using SUM(CASE WHEN ...) tricks when FILTER (WHERE ...) would be one line shorter.',
    ],
    next: 'window-functions-intro',
  },
  {
    id: 'window-functions-intro',
    title: 'Joins & Aggregation · Window Functions Intro',
    subtitle: 'Aggregates that do not collapse rows — the most underrated SQL feature.',
    intro: `Window functions compute an aggregate over a subset of rows (a window) for each row, without collapsing the rows. They are the single most powerful SQL feature most developers never learn — running totals, ranks, moving averages, top-N-per-group, year-over-year growth all become one-liners.

Shape: AGG(...) OVER (PARTITION BY ... ORDER BY ... ROWS ...). The OVER clause is what makes a function a window function instead of an aggregate. Without OVER, AVG(salary) collapses; with OVER (), AVG(salary) returns the overall average attached to every row.

PARTITION BY splits rows into independent groups for the window — like GROUP BY but the rows are not collapsed. AVG(salary) OVER (PARTITION BY department_id) gives every row the average salary of its own department, alongside the original columns.

ORDER BY inside the window defines a running computation. SUM(amount) OVER (ORDER BY date) is a running total; AVG(amount) OVER (ORDER BY date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) is a 7-day moving average.

Beyond aggregates, the dedicated ranking functions are essential. ROW_NUMBER() assigns sequential numbers; RANK() and DENSE_RANK() handle ties differently. NTILE(4) buckets into quartiles. LAG(col, 1) and LEAD(col, 1) peek at the previous or next row — the standard tool for period-over-period diffs.

Window frames (ROWS / RANGE BETWEEN ... AND ...) control which rows around the current row are aggregated. Default frame for ORDER BY is RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW, which yields running aggregates. ROWS BETWEEN 1 PRECEDING AND 1 FOLLOWING is a 3-row sliding window.

Window functions run after GROUP BY in the logical evaluation order — they see the already-aggregated rows. To filter on a window function's output, wrap the query in a subquery or CTE and filter in the outer SELECT.`,
    code: `-- Each employee plus their rank inside their department and the department average
SELECT
  name,
  department_id,
  salary,
  RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) AS dept_rank,
  AVG(salary) OVER (PARTITION BY department_id) AS dept_avg
FROM employees
ORDER BY department_id, dept_rank;`,
    exercise: {
      prompt: `For each employee, return name, salary, and the running total of salaries ordered by hired_at.`,
      starter: `-- write your window function here`,
      expected: `SELECT name, salary, SUM(salary) OVER (ORDER BY hired_at) FROM employees;`,
    },
    takeaways: [
      'Window functions aggregate without collapsing rows — same row count in, same out.',
      'PARTITION BY = independent groups; ORDER BY inside OVER = running computation.',
      'ROW_NUMBER / RANK / DENSE_RANK and LAG / LEAD cover most ranking and diff needs.',
      'Filter on a window function by wrapping the query — windows run after GROUP BY.',
    ],
    mistakes: [
      'Forgetting OVER and writing a plain aggregate, then wondering why rows collapsed.',
      'Putting a window function in WHERE — not allowed; wrap in a subquery.',
      'Assuming default window frame is unbounded both directions — it ends at CURRENT ROW with ORDER BY.',
    ],
    next: 'primary-keys-and-pk-constraints',
  },

  // ─── Performance & Schema (10) ──────────────────────────────────
  {
    id: 'primary-keys-and-pk-constraints',
    title: 'Performance & Schema · Primary Keys',
    subtitle: 'Every table should have one — surrogate vs natural, single vs composite.',
    intro: `A primary key is the column or set of columns that uniquely identifies each row. Every relational database lets you declare one with PRIMARY KEY in CREATE TABLE. Doing so does three things at once: enforces uniqueness, enforces NOT NULL on the columns, and creates a unique index for fast lookup.

The first decision is surrogate vs natural. A surrogate key is a meaningless integer or UUID generated by the database — id SERIAL PRIMARY KEY. A natural key is a meaningful column already present in the data — country_code CHAR(2) PRIMARY KEY for a countries table. Surrogate keys are the default in modern application design: they never change (a person can change their email, country, even name; their internal id never does), they are small and fast, and they isolate the schema from real-world identifier churn. Natural keys are appropriate for reference tables where the natural identifier is stable and meaningful in queries.

The second decision is single vs composite. Composite primary keys span multiple columns — PRIMARY KEY (user_id, role_id) for a join table. They express the business rule the engine should enforce: at most one row per (user, role) pair. Some teams prefer a surrogate id even on join tables, with a separate UNIQUE (user_id, role_id) constraint — the trade-off is one extra column for slightly easier foreign-key references from other tables.

UUID vs integer: UUIDs (16 bytes, often v4 or v7) are globally unique without coordination, which is great for distributed inserts. Costs: 16 bytes vs 8 for BIGINT, no natural ordering (use UUIDv7 if you want time-ordered), larger indexes, slower joins. For most single-region apps, BIGINT is the better default.

The PK index is what makes lookups by id constant-time. Every other index is built on top of the PK ordering, so picking a good PK affects every secondary index's size.`,
    code: `-- A surrogate PK and a composite PK in one schema
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE
);

CREATE TABLE user_roles (
  user_id BIGINT NOT NULL REFERENCES users(id),
  role_id INTEGER NOT NULL REFERENCES roles(id),
  granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, role_id)
);`,
    exercise: {
      prompt: `Create a table called countries with code CHAR(2) as its primary key and name TEXT NOT NULL.`,
      starter: `-- write your CREATE TABLE here`,
      expected: `CREATE TABLE countries (code CHAR(2) PRIMARY KEY, name TEXT NOT NULL);`,
    },
    takeaways: [
      'Every table should have a primary key — uniqueness + NOT NULL + index in one declaration.',
      'Surrogate ids are the safe default; natural keys for stable reference tables.',
      'Composite PKs encode business rules — UNIQUE on the columns is the alternative.',
      'BIGINT beats UUID for single-region apps; UUIDv7 wins for distributed writes.',
    ],
    mistakes: [
      'Picking an email or username as a PK and watching cascades break when users change them.',
      'Using UUIDv4 as a PK in a write-heavy table — random insert order destroys B-tree locality.',
      'Forgetting a PK altogether — many tools and ORMs silently misbehave on PK-less tables.',
    ],
    next: 'foreign-keys',
  },
  {
    id: 'foreign-keys',
    title: 'Performance & Schema · Foreign Keys',
    subtitle: 'Telling the database what references what — and what to do when things change.',
    intro: `A foreign key (FK) is a constraint that says values in one column must exist in another table's column. CREATE TABLE orders (... user_id BIGINT REFERENCES users(id)) declares that every order's user_id must point to a real user. The engine refuses INSERTs and UPDATEs that would violate the rule.

FKs are usually paired with an ON DELETE and ON UPDATE clause that says what to do when the referenced row changes. ON DELETE RESTRICT (the default) refuses the delete. ON DELETE CASCADE deletes dependent rows too. ON DELETE SET NULL nulls the FK column (which must be nullable). ON DELETE SET DEFAULT sets it to the column default. Pick deliberately — RESTRICT for things you want to forbid deleting (users with orders), CASCADE for owned children (an order line item is meaningless without the order), SET NULL for optional references.

FKs cost on writes. Every insert and update on the child table costs a lookup on the parent table; every delete on the parent costs a check (or cascade) on the child. The cost is usually negligible — well-indexed FK lookups are nanoseconds — but very write-heavy systems sometimes disable FKs and rely on application-level integrity. This is a trade-off that nearly always favours keeping FKs.

You must index the FK column yourself in most dialects (Postgres). The engine creates an index for the primary key it references but not for the FK on the child side. Without an index on orders.user_id, deleting a user becomes an O(n) scan of orders to check the constraint. This is one of the most common production performance bugs.

Multi-column FKs reference composite PKs: FOREIGN KEY (order_id, line_id) REFERENCES order_lines(order_id, line_id). Less common than single-column FKs but useful when the parent has a composite PK.

DEFERRABLE INITIALLY DEFERRED (Postgres) postpones the constraint check until commit — useful for circular references and bulk loads.`,
    code: `-- FK with cascade, plus an explicit index on the FK column
CREATE TABLE orders (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_cents BIGINT NOT NULL
);

CREATE INDEX idx_orders_user_id ON orders(user_id);`,
    exercise: {
      prompt: `Create a posts table with id (auto-increment) and author_id referencing users(id) with ON DELETE CASCADE.`,
      starter: `-- write your CREATE TABLE here`,
      expected: `CREATE TABLE posts (id SERIAL PRIMARY KEY, author_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE);`,
    },
    takeaways: [
      'FKs enforce that referenced rows exist — pair with ON DELETE / ON UPDATE deliberately.',
      'Always index the FK column on the child side — Postgres does not auto-create it.',
      'CASCADE for owned children, RESTRICT for things you should never silently lose, SET NULL for optional.',
      'DEFERRABLE INITIALLY DEFERRED handles circular references and bulk loads.',
    ],
    mistakes: [
      'Forgetting the FK index — every parent delete becomes a full child-table scan.',
      'Using CASCADE on user.delete and silently nuking orders someone wanted to keep.',
      'Skipping FKs entirely on a fast-moving startup and accumulating orphan rows for years.',
    ],
    next: 'btree-indexes',
  },
  {
    id: 'btree-indexes',
    title: 'Performance & Schema · B-tree Indexes',
    subtitle: 'The default index — what it does, when it helps, and when it does not.',
    intro: `A B-tree (balanced tree) index is a sorted data structure that lets the database find rows by key in O(log n). It is the default index type in every major SQL database. CREATE INDEX idx_users_email ON users(email) builds one.

A B-tree on a column accelerates equality lookups (WHERE email = X), range scans (WHERE created_at > Y), prefix matches (WHERE name LIKE 'Joe%' — note the % at the end, not the start), and ORDER BY on the indexed column. It does not help WHERE LOWER(email) = X (function on the column defeats it), WHERE name LIKE '%foo' (leading wildcard defeats it), or WHERE country != X (negation cannot use the index efficiently).

Indexes cost on writes. Every insert and update on an indexed column must also update the index — typically 10-20% overhead per index. A table with 10 indexes does 11 unit of work per insert instead of 1. Drop indexes you do not actually use; keep them only when query performance justifies the write cost.

The query planner decides whether to use an index based on statistics — estimated row counts, selectivity, table size. For very selective predicates (returning <5% of rows), index access wins. For un-selective predicates (returning >30% of rows), a full table scan is usually faster because random index lookups cost more than sequential reads.

EXPLAIN reveals what the planner picked. Index Scan = used the index; Seq Scan = read the whole table; Bitmap Index Scan = used the index to build a bitmap then read the heap. Statistics go stale — ANALYZE refreshes them, and autovacuum usually handles this for you.

Partial indexes (Postgres) index only matching rows: CREATE INDEX idx_active_orders ON orders(user_id) WHERE status = 'active'. Smaller, faster, and only useful for queries that include the predicate.

Expression indexes index the result of a function: CREATE INDEX idx_users_email_lower ON users(LOWER(email)) — now WHERE LOWER(email) = X uses the index.`,
    code: `-- Single-column index, partial index, and expression index
CREATE INDEX idx_users_email ON users(email);

CREATE INDEX idx_orders_active_user
  ON orders(user_id)
  WHERE status = 'active';

CREATE INDEX idx_users_email_lower ON users(LOWER(email));`,
    exercise: {
      prompt: `Create a single-column B-tree index on the country column of employees.`,
      starter: `-- write your CREATE INDEX here`,
      expected: `CREATE INDEX idx_employees_country ON employees(country);`,
    },
    takeaways: [
      'B-tree indexes give O(log n) equality, range, prefix, and ORDER BY access.',
      'Functions or leading wildcards on the indexed column defeat the index.',
      'Every index costs on writes — drop unused indexes to reclaim write throughput.',
      'EXPLAIN shows what the planner chose; ANALYZE refreshes statistics.',
    ],
    mistakes: [
      'Indexing every column reflexively — write overhead piles up fast.',
      'Writing WHERE LOWER(email) = X without an expression index on LOWER(email).',
      'Trusting stale statistics — after big data changes, run ANALYZE explicitly.',
    ],
    next: 'composite-indexes',
  },
  {
    id: 'composite-indexes',
    title: 'Performance & Schema · Composite Indexes',
    subtitle: 'Indexing multiple columns together — and why column order matters.',
    intro: `A composite index covers two or more columns: CREATE INDEX idx_orders_user_status ON orders(user_id, status). The B-tree is keyed by the tuple (user_id, status), sorted by user_id first then status within each user_id.

The leftmost-prefix rule governs which queries can use a composite index. An index on (a, b, c) supports WHERE a = ?, WHERE a = ? AND b = ?, and WHERE a = ? AND b = ? AND c = ?. It does not (usefully) support WHERE b = ? alone or WHERE c = ? alone, because the tree is sorted by a first — to find rows with a specific b, the engine would have to scan every a value.

Range predicates limit what comes after them. An index on (user_id, created_at, status) supports WHERE user_id = ? AND created_at > ? AND status = ? for the user_id equality and the created_at range — but the status = ? predicate cannot use the index because once you have a range scan on created_at, the rows are no longer sorted by status. The rule of thumb is equality columns first, then one range column, then nothing useful follows.

Column order matters not only for which queries match, but also for selectivity. Put the more selective column first — if user_id has 1M distinct values and status has 5, lead with user_id. The index is denser at the leaf level and lookups touch fewer pages.

Covering indexes (next lesson) extend this further by including extra columns purely for the SELECT list to avoid heap fetches.

Diagnose composite-index usage by reading EXPLAIN: the Index Cond line shows which predicates the index actually used; predicates filtered after the index scan appear as Filter conditions and tell you the index did not cover them.

When unsure, build the index, test the query, then EXPLAIN. Reading the plan is faster than guessing.`,
    code: `-- Composite index for queries that filter user_id and (sometimes) status
CREATE INDEX idx_orders_user_status
  ON orders(user_id, status);

-- This query uses the index fully
SELECT * FROM orders WHERE user_id = 42 AND status = 'open';

-- This one uses only the leading user_id portion
SELECT * FROM orders WHERE user_id = 42;`,
    exercise: {
      prompt: `Create a composite index on the employees table covering department_id then hired_at.`,
      starter: `-- write your CREATE INDEX here`,
      expected: `CREATE INDEX idx_employees_dept_hired ON employees(department_id, hired_at);`,
    },
    takeaways: [
      'Composite indexes are keyed by the column tuple; only leftmost-prefix queries benefit.',
      'Lead with equality columns, then at most one range column, then nothing useful.',
      'Order columns by selectivity within the leftmost prefix — most selective first.',
      'EXPLAIN distinguishes Index Cond (used) from Filter (had to recheck) predicates.',
    ],
    mistakes: [
      'Indexing (status, user_id) and wondering why WHERE user_id = X is slow.',
      'Putting a range column before another equality — the equality drops out of index use.',
      'Building one index per query without consolidating overlapping prefixes.',
    ],
    next: 'covering-indexes',
  },
  {
    id: 'covering-indexes',
    title: 'Performance & Schema · Covering Indexes',
    subtitle: 'When the index alone answers the query — skip the heap entirely.',
    intro: `A covering index contains every column the query needs — the predicate columns and the SELECT-list columns. The engine answers the query from the index alone without visiting the table heap. This is called an index-only scan, and it can be 10x faster than a regular index scan because random heap fetches are skipped.

Postgres syntax: CREATE INDEX idx_orders_user_status_include ON orders(user_id, status) INCLUDE (total_cents, created_at). The INCLUDE columns are stored in the index leaves but not part of the search key — they cost extra disk space but let the planner skip the heap. SQL Server has the same INCLUDE syntax. MySQL achieves the same effect by putting the columns in the index key itself, since secondary indexes implicitly include the PK.

Covering indexes shine for read-heavy lookup queries. A SELECT id, status, total_cents FROM orders WHERE user_id = ? that runs millions of times per day deserves a covering index. The savings compound — fewer heap pages touched means less buffer-pool pressure, fewer disk reads, lower CPU.

Costs: every column you INCLUDE makes the index bigger on disk, slower to maintain on writes, and more memory-hungry. INCLUDE only the columns the hot query actually reads.

In Postgres, an index-only scan also requires the visibility map to say the heap pages are all-visible — otherwise the engine still has to visit the heap to check tuple visibility. Vacuum maintains the visibility map; queries on recently-changed tables may not get the optimal plan until the next VACUUM.

Read EXPLAIN: Index Only Scan = the heap was skipped; Heap Fetches: N tells you how many tuples still needed a heap check. A high Heap Fetches count means the visibility map is stale or the index does not actually cover.`,
    code: `-- Covering index for a frequent dashboard query
CREATE INDEX idx_orders_user_status_covering
  ON orders(user_id, status)
  INCLUDE (total_cents, created_at);

-- This query can now use an Index Only Scan
SELECT total_cents, created_at
FROM orders
WHERE user_id = 42 AND status = 'open';`,
    exercise: {
      prompt: `Create a covering index on orders(user_id) that includes status and total_cents.`,
      starter: `-- write your CREATE INDEX here`,
      expected: `CREATE INDEX idx_orders_user_covering ON orders(user_id) INCLUDE (status, total_cents);`,
    },
    takeaways: [
      'Covering indexes include every column the query reads — enables Index Only Scan.',
      'Postgres / SQL Server: INCLUDE (...) appends non-key columns to index leaves.',
      'Skipping the heap saves random I/O and buffer-pool pressure on hot queries.',
      'Each INCLUDE column costs disk and write overhead — only include hot-path columns.',
    ],
    mistakes: [
      'INCLUDE-ing every column reflexively — index bloats and writes slow down.',
      'Forgetting that Postgres needs an up-to-date visibility map for Index Only Scan to skip the heap.',
      'Building a covering index for a query that runs twice a day — overkill.',
    ],
    next: 'explain-and-query-plans',
  },
  {
    id: 'explain-and-query-plans',
    title: 'Performance & Schema · EXPLAIN and Query Plans',
    subtitle: 'Reading the planner output — the single most useful SQL skill.',
    intro: `EXPLAIN shows the execution plan the query planner picked for a query. EXPLAIN ANALYZE runs the query and shows actual timings alongside the estimates. Reading these two outputs is the single most useful skill for SQL performance work — more useful than any list of tuning tricks.

Plans are trees of operations. The leaves are scans — Seq Scan (read the whole table), Index Scan (use an index then fetch from heap), Index Only Scan (use only the index), Bitmap Index Scan (build a bitmap of matching rows then fetch in order). The interior nodes are combining operations — Nested Loop (for each row in A, look up B), Hash Join (hash B, then probe with A), Merge Join (sort both then merge). Above those sit Sort, Aggregate, Limit, etc.

Each node shows estimated cost (cost=0.43..8.45) and row counts (rows=42 width=84). EXPLAIN ANALYZE additionally shows actual time (actual time=0.01..0.05 rows=40) and execution counts (loops=1). The dangerous symptom is large divergence between estimated and actual rows — when the planner estimates 10 rows and the actual is 100,000, it likely picked a Nested Loop where a Hash Join would have been 1000x faster.

What to look for: Seq Scan on a big table with a selective WHERE clause means you are missing an index. Hash Join with Hash spilling to disk means work_mem is too small. Nested Loop with high loop count means the planner mis-estimated the outer side's cardinality, often because of correlated predicates or stale statistics.

Fixes: run ANALYZE to refresh statistics, add an index, increase work_mem for that session, rewrite the query (avoid correlated subqueries, replace IN with EXISTS, push down predicates).

Tooling: explain.depesz.com, explain.dalibo.com visualise Postgres EXPLAIN output, highlighting expensive nodes. Use them — text plans are hard to read past 20 lines.`,
    code: `-- Inspect estimated plan
EXPLAIN
SELECT id, total_cents
FROM orders
WHERE user_id = 42 AND status = 'open';

-- Run the query and show actual timings
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, total_cents
FROM orders
WHERE user_id = 42 AND status = 'open';`,
    exercise: {
      prompt: `Use EXPLAIN to show the plan for selecting all employees where country = 'US'.`,
      starter: `-- write your EXPLAIN here`,
      expected: `EXPLAIN SELECT * FROM employees WHERE country = 'US';`,
    },
    takeaways: [
      'EXPLAIN shows the planner-picked tree; EXPLAIN ANALYZE adds actual runtimes.',
      'Big divergence between estimated and actual rows is the smoking gun for bad plans.',
      'Seq Scan on a large table with a selective WHERE means a missing index.',
      'explain.depesz.com / explain.dalibo.com make long plans actually readable.',
    ],
    mistakes: [
      'Running EXPLAIN without ANALYZE and missing the actual-vs-estimated gap.',
      'Optimising plans by guessing instead of reading the node-by-node row counts.',
      'Forgetting that EXPLAIN ANALYZE actually runs the query — never on a destructive UPDATE.',
    ],
    next: 'normalization-1nf-2nf-3nf',
  },
  {
    id: 'normalization-1nf-2nf-3nf',
    title: 'Performance & Schema · Normalization 1NF / 2NF / 3NF',
    subtitle: 'Codd-era forms that eliminate redundancy and update anomalies.',
    intro: `Normalization is the systematic process of decomposing tables to eliminate redundancy and update anomalies. Codd's original three normal forms cover the cases most modern apps care about. Each form builds on the previous one.

First Normal Form (1NF): every column holds an atomic value, and there are no repeating groups. A column called phone_numbers containing '555-1212, 555-1313' is not 1NF — split into a separate phones table with one row per number. A column called address combining street, city, zip is borderline; if your queries ever filter by city, split it.

Second Normal Form (2NF): satisfies 1NF and every non-key column depends on the entire primary key, not part of it. Only relevant when the PK is composite. If you have order_lines (order_id, product_id, quantity, product_name), the product_name depends only on product_id, not the full PK — move it to a products table.

Third Normal Form (3NF): satisfies 2NF and no non-key column depends on another non-key column (no transitive dependencies). An employees table with (id, name, department_id, department_name) violates 3NF because department_name depends on department_id, which is a non-key column. Move it to a departments table.

Why bother? Update anomalies. If three rows store the same department_name and you rename the department, you must update all three or end up with inconsistent data. Insert anomalies. If you cannot record a department until at least one employee joins, the schema forces business logic into a workaround. Delete anomalies. Deleting the last employee in a department also loses the department itself.

Normalization is rarely about disk savings (modern storage is cheap). It is about correctness — making bad states unrepresentable.

Beyond 3NF: BCNF, 4NF, 5NF handle exotic cases most apps never encounter. Reach for them when teaching, not when shipping.`,
    code: `-- Normalized: employees reference departments via FK
CREATE TABLE departments (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT
);

CREATE TABLE employees (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  department_id INTEGER NOT NULL REFERENCES departments(id)
);`,
    exercise: {
      prompt: `Create a phones table with id, user_id (FK to users), and number — the 1NF replacement for storing comma-separated phone numbers.`,
      starter: `-- write your CREATE TABLE here`,
      expected: `CREATE TABLE phones (id SERIAL PRIMARY KEY, user_id BIGINT NOT NULL REFERENCES users(id), number TEXT NOT NULL);`,
    },
    takeaways: [
      '1NF: atomic columns, no repeating groups.',
      '2NF: every non-key column depends on the entire PK (matters for composite PKs).',
      '3NF: no transitive dependencies — non-key columns must not depend on other non-key columns.',
      'Normalization is about eliminating update / insert / delete anomalies, not disk savings.',
    ],
    mistakes: [
      'Storing comma-separated lists in a single column — every query needs a string-split.',
      'Duplicating department_name across employee rows and ending up with three spellings.',
      'Confusing 3NF with always-better — pure forms can over-fragment hot data.',
    ],
    next: 'denormalization-tradeoffs',
  },
  {
    id: 'denormalization-tradeoffs',
    title: 'Performance & Schema · Denormalization Trade-offs',
    subtitle: 'Sometimes redundancy is the right answer — pick it with eyes open.',
    intro: `Denormalization is the deliberate violation of normal forms for performance. The goal is to avoid expensive joins or repeated computation by storing redundant data. It is a real, common, often-correct technique — and also the source of many silent data inconsistencies, so the costs deserve attention.

Common patterns. Materialised join columns — storing department_name on every employee row so the dashboard query no longer needs a join. Aggregates — storing post.comment_count and updating it on insert / delete instead of running COUNT(*) every page load. Wide tables — flattening a one-to-many relationship into JSON or array columns when you always read the children together. Derived columns — storing user.full_name = first_name || ' ' || last_name.

Costs. Update consistency: every UPDATE to the source must update the denormalized copies. If you forget, the copies drift. Write amplification: one logical write becomes several physical writes. Storage: redundant data takes space and bloats indexes. Bug surface: every code path that updates the source becomes a place where the denormalization can desync.

Mitigations. Triggers maintain the copies automatically; the database guarantees consistency at the cost of write overhead. Materialised views (Postgres, Oracle, SQL Server) precompute a query result and refresh on demand — REFRESH MATERIALIZED VIEW CONCURRENTLY. Generated columns (Postgres 12+, MySQL, SQLite) compute a value from other columns automatically: full_name TEXT GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED.

Rule of thumb. Start fully normalized. Profile the queries that are too slow. Denormalize only what the profile demands, and prefer engine-maintained mechanisms (generated columns, triggers, materialised views) over application-maintained ones. Document every denormalization — future-you will not remember why post.comment_count exists.

Caching is a form of denormalization too — Redis caching a join result is logically the same trade-off. Pick the layer (DB or app) that fits your consistency and freshness needs.`,
    code: `-- Generated column: maintained by the engine, never drifts
ALTER TABLE users
ADD COLUMN full_name TEXT GENERATED ALWAYS AS (
  first_name || ' ' || last_name
) STORED;

-- Materialized view for an expensive dashboard query
CREATE MATERIALIZED VIEW top_customers AS
SELECT user_id, SUM(total_cents) AS revenue
FROM orders
GROUP BY user_id
ORDER BY revenue DESC
LIMIT 1000;

-- Refresh when the underlying data changes
REFRESH MATERIALIZED VIEW CONCURRENTLY top_customers;`,
    exercise: {
      prompt: `Add a generated column total to an orders table that equals quantity * unit_price.`,
      starter: `-- write your ALTER TABLE here`,
      expected: `ALTER TABLE orders ADD COLUMN total NUMERIC(12, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED;`,
    },
    takeaways: [
      'Denormalize deliberately for measured performance wins, not as a default style.',
      'Generated columns, triggers, and materialised views let the engine maintain copies.',
      'Document every denormalization — six months later, the why is gone.',
      'Caches in Redis are denormalization too — same trade-offs at a different layer.',
    ],
    mistakes: [
      'Maintaining a duplicate column in application code and forgetting one update path.',
      'Materialising views with REFRESH (not CONCURRENTLY) and locking out readers.',
      'Premature denormalization on a schema where the join was never the bottleneck.',
    ],
    next: 'transactions-acid',
  },
  {
    id: 'transactions-acid',
    title: 'Performance & Schema · Transactions and ACID',
    subtitle: 'BEGIN ... COMMIT, the four guarantees, and what they actually mean.',
    intro: `A transaction is a unit of work that is atomic — either every statement in it commits or none of them do. BEGIN starts one, COMMIT applies it, ROLLBACK throws it away. Inside the transaction, your changes are visible to your session but not to other sessions until COMMIT.

ACID is the acronym for the four classical guarantees databases provide.

Atomicity: all-or-nothing. If a transaction has three INSERTs and the third fails, the first two are rolled back. The database never sees a partially-applied transaction.

Consistency: every transaction takes the database from one valid state to another. Constraints (PK, FK, CHECK, NOT NULL) are enforced; if a transaction would leave them violated, the engine raises and you ROLLBACK. Note this is application-defined consistency, not concurrency consistency.

Isolation: concurrent transactions appear to run serially — or as close to serially as the configured isolation level allows. Lower levels (Read Committed) give better concurrency but allow some anomalies; higher levels (Serializable) guarantee true serializability at the cost of more aborts. Next lesson covers this in depth.

Durability: once COMMIT returns success, the changes survive crashes. Implementation is usually a write-ahead log (WAL) fsynced before COMMIT acknowledges. Disabling fsync (synchronous_commit = off in Postgres) trades durability for write throughput — sometimes correct for stateless caches.

Practical patterns. Wrap multi-statement logical operations (transfer money: debit A, credit B) in a transaction so a crash between statements never leaves money missing. Use SAVEPOINTs to roll back part of a long transaction without losing everything. Keep transactions short — long-running ones hold locks, accumulate undo logs, and block other writers.

Autocommit: most clients commit each statement automatically unless you explicitly BEGIN. Multi-statement logic without BEGIN is a series of independent transactions — not what you want for atomic operations.`,
    code: `-- Classic money transfer wrapped atomically
BEGIN;

UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;

-- If anything raised, ROLLBACK; otherwise:
COMMIT;`,
    exercise: {
      prompt: `Wrap an UPDATE that bumps every US salary by 5% inside a transaction (BEGIN ... COMMIT).`,
      starter: `-- write your transaction here`,
      expected: `BEGIN; UPDATE employees SET salary = salary * 1.05 WHERE country = 'US'; COMMIT;`,
    },
    takeaways: [
      'Transactions are atomic — every statement commits or none do.',
      'ACID = Atomicity, Consistency, Isolation, Durability — four independent guarantees.',
      'Wrap multi-statement logical operations in BEGIN ... COMMIT to survive partial failures.',
      'Keep transactions short — long ones hold locks and block other writers.',
    ],
    mistakes: [
      'Running multi-statement logic without BEGIN — each statement commits independently.',
      'Holding a transaction open across a user interaction — minutes of blocked writers.',
      'Assuming COMMIT means the disk has the data when synchronous_commit is off.',
    ],
    next: 'isolation-levels',
  },
  {
    id: 'isolation-levels',
    title: 'Performance & Schema · Isolation Levels',
    subtitle: 'Read Committed, Repeatable Read, Serializable — and the anomalies each allows.',
    intro: `Isolation levels control how transactions see each other's in-flight changes. The SQL standard defines four levels — Read Uncommitted, Read Committed, Repeatable Read, Serializable — by the anomalies each one forbids. Real engines implement these slightly differently; Postgres skips Read Uncommitted entirely (always at least Read Committed).

The anomalies, simplest to worst.

Dirty Read: transaction A reads a row that transaction B wrote but has not committed. If B rolls back, A read data that never officially existed. Forbidden at Read Committed and above. Postgres never allows it.

Non-Repeatable Read: A reads a row, B updates and commits, A reads the same row again and gets a different value. Forbidden at Repeatable Read.

Phantom Read: A runs a range query, B inserts a new row in the range and commits, A re-runs the range query and sees the new row. Forbidden at Serializable (and at Repeatable Read in Postgres's snapshot-based implementation).

Serialization Anomaly: a non-serialisable schedule of transactions produces a state no serial schedule could. Forbidden only at Serializable.

Postgres uses snapshot isolation under the hood. Read Committed takes a fresh snapshot per statement. Repeatable Read takes one snapshot for the entire transaction — every statement sees the same view of the database. Serializable adds runtime checks for serialisation anomalies and may abort one transaction with a SerializationFailure error; you retry on the application side.

Practical defaults. Read Committed is the default in most engines — fine for most app workloads, simple to reason about, no spurious aborts. Use Repeatable Read for reports that must see a single consistent view (sum of all account balances). Use Serializable for ad-hoc money-moving logic where you want the engine to detect serialisation errors and force a retry rather than risking a logic bug.

SET TRANSACTION ISOLATION LEVEL changes it for the current transaction. ALTER DATABASE ... SET default_transaction_isolation = ... changes the default per database.`,
    code: `-- Explicitly set the isolation level for one transaction
BEGIN ISOLATION LEVEL SERIALIZABLE;

SELECT SUM(balance) FROM accounts;
UPDATE accounts SET balance = balance + 10 WHERE id = 1;

COMMIT;`,
    exercise: {
      prompt: `Begin a transaction at Repeatable Read isolation level.`,
      starter: `-- write your statement here`,
      expected: `BEGIN ISOLATION LEVEL REPEATABLE READ;`,
    },
    takeaways: [
      'Four levels: Read Uncommitted, Read Committed, Repeatable Read, Serializable.',
      'Each higher level forbids one more anomaly: dirty / non-repeatable / phantom / serialisation.',
      'Postgres snapshot isolation: Repeatable Read sees one snapshot for the whole transaction.',
      'Serializable can abort with SerializationFailure — your app must retry on it.',
    ],
    mistakes: [
      'Using Read Committed for read-modify-write logic and losing updates under concurrency.',
      'Switching to Serializable without adding application retry logic — production stalls.',
      'Forgetting that isolation levels do not magically prevent business logic bugs.',
    ],
    next: { label: 'Back to courses', href: '#/courses' },
  },
];

const RUST_LESSONS = [
  // ─── Rust Foundations (10) ──────────────────────────────────────
  {
    id: 'hello-world-and-cargo',
    title: 'Foundations · Hello, World and Cargo',
    subtitle: 'The toolchain — rustc, cargo, and the project layout every Rust crate uses.',
    intro: `Rust ships as a small set of tools that hang together tightly. rustc is the compiler. cargo is the build system, package manager, test runner, doc generator, and release tool — you will spend almost all your time talking to cargo, not rustc directly. rustup is the toolchain installer that lets you swap between stable, beta, and nightly channels and cross-compile to other targets. The one-liner from rustup.rs installs all three.

Every Rust project is a crate. cargo new hello creates a binary crate with the canonical layout: Cargo.toml at the root (the manifest — package name, version, edition, dependencies), Cargo.lock (resolved dependency versions, committed for binaries, sometimes for libraries), and src/main.rs containing fn main(). Library crates use src/lib.rs instead. Larger projects can hold multiple crates inside one workspace.

cargo run compiles the current crate in debug mode and runs the resulting binary. cargo build only compiles. cargo build --release produces an optimised binary in target/release; debug binaries live in target/debug and are 10-100x slower at runtime but compile in seconds. cargo check skips code generation entirely — it parses, type-checks, and borrow-checks without producing a binary, which is the fastest feedback loop while iterating.

Cargo.toml uses TOML. The [package] table names the crate; [dependencies] lists what you pull from crates.io (the public registry). Versions follow semver — "1" means ^1.0.0, "=1.2.3" pins exactly. After editing, the next cargo command rewrites Cargo.lock with the resolved tree.

The standard project layout is enforced by cargo, not by the language. Source files go in src/, integration tests in tests/, examples in examples/, benchmarks in benches/. A README.md and a LICENSE file complete the conventional crate. Following this layout is what lets cargo doc, cargo test, and cargo publish all work with zero configuration.

fn main() is the entry point of a binary crate. Library crates have no main — they expose functions, structs, and traits other crates use. The println! macro prints to stdout with a newline; the trailing ! marks it as a macro, not a function.`,
    code: `fn main() {
    println!("Hello, Rust");
}

// Cargo.toml
// [package]
// name = "hello"
// version = "0.1.0"
// edition = "2021"
//
// [dependencies]`,
    exercise: {
      prompt: `Print the literal string Hello, Rust on its own line.`,
      starter: `fn main() {
    // your code
}
`,
      expected: 'Hello, Rust',
    },
    takeaways: [
      'cargo is the daily driver — rustc rarely shows up directly in your workflow.',
      'Debug builds compile fast but run slow; --release flips that trade-off.',
      'cargo check skips codegen and is the fastest way to validate the borrow checker.',
      'println! is a macro, not a function — the trailing ! is the giveaway.',
    ],
    mistakes: [
      'Benchmarking debug builds — they are 10-100x slower than release. Always cargo build --release.',
      'Editing target/ files or committing them — that directory is generated; add it to .gitignore.',
      'Forgetting the trailing ! on println — println("...") fails with cannot find function println.',
    ],
    next: 'variables-and-mutability',
  },
  {
    id: 'variables-and-mutability',
    title: 'Foundations · Variables and Mutability',
    subtitle: 'let, mut, shadowing, and the const vs static distinction.',
    intro: `Variables in Rust are immutable by default. let x = 5; binds x to 5 and forbids assignment. x = 6; fails to compile with cannot assign twice to immutable variable. Add mut to opt in: let mut x = 5; x = 6; works. This default-immutable stance pushes you toward designs where state changes are explicit and localised — when you read code and see no mut, you know the variable's value cannot change after binding.

Shadowing is different from mutation and trips up newcomers. let x = 5; let x = x + 1; is two separate bindings — the second x shadows the first, and the new binding can even change type (let s = "42"; let s: i32 = s.parse().unwrap();). Mutation requires the same type; shadowing does not. Shadowing also lets you re-use a name in an inner scope without disturbing the outer one once the inner scope ends.

Type inference fills in most types. let n = 42; is i32 (the default integer). let f = 3.14; is f64. When the compiler cannot infer — empty collections, ambiguous parse() returns — it asks you with an error like type annotations needed. The fix is either annotating the binding (let v: Vec<i32> = Vec::new()) or the turbofish on the call (Vec::<i32>::new()).

const and static look similar but differ in subtle ways. const NAME: T = expr; is a compile-time constant — inlined at every use site, evaluated at compile time, must have an explicit type. By convention SCREAMING_SNAKE_CASE. static NAME: T = expr; is a global with a fixed memory address that lives for the entire program; the same address is shared by every reference, which matters for interior mutability and FFI. Use const for values, static when you specifically need a single address (or a static mut for interior mutability behind a lock).

Variables live until the end of their scope, which is when Rust runs Drop on them. This deterministic destruction (no GC pauses) is the whole foundation of the ownership model that follows in later lessons.`,
    code: `fn main() {
    let x = 5;
    let mut y = 10;
    y += 1;

    let s = "42";
    let s: i32 = s.parse().unwrap();

    const MAX_USERS: u32 = 100_000;

    println!("x = {x}, y = {y}, s = {s}, max = {MAX_USERS}");
}`,
    exercise: {
      prompt: `Declare a mutable i32 named counter starting at 0, increment it three times, and print the final value.`,
      starter: `fn main() {
    // declare counter, increment 3x, print
}
`,
      expected: '3',
    },
    takeaways: [
      'let bindings are immutable; opt in to mutation with let mut.',
      'Shadowing rebinds a name — new type allowed; mutation requires the same type.',
      'Integer literals default to i32, floats to f64 — annotate to override.',
      'const inlines a compile-time value; static has a fixed address for the whole program.',
    ],
    mistakes: [
      'Reaching for mut to mute the compiler — usually a sign the design should be functional instead.',
      'Confusing shadowing with mutation — they have different scoping and type rules.',
      'Using static mut without a Mutex/lock — it is unsafe to touch from multiple threads.',
    ],
    next: 'primitive-types',
  },
  {
    id: 'primitive-types',
    title: 'Foundations · Primitive Types',
    subtitle: 'Integers, floats, bool, char, tuples, arrays — what is built in before any std types.',
    intro: `Rust's primitive types are deliberately concrete — no implicit number conversions, no surprise truncation. Integer types come in signed (i8, i16, i32, i64, i128, isize) and unsigned (u8 through u128, usize) flavours. The number is the bit width; isize and usize match the pointer size of the target (32 or 64 bits). isize/usize is the type of array indices, lengths, and pointer offsets — that is the only time you should pick it deliberately. For everything else, prefer i32 for general numbers, u32 for non-negative counts, i64 when 2 billion is not enough, and u8 for byte buffers.

Floats come in f32 and f64. f64 is the default and almost always the right choice — modern hardware computes f64 at the same speed as f32, and you avoid the gotchas of single precision. f32 is for graphics buffers and memory-bandwidth-bound numerical work.

bool is true or false — exactly one byte, never anything else. char is a Unicode scalar value, four bytes wide — it can hold any character from any script. Note that char is not a byte; a byte is u8. A &str or String is a UTF-8 sequence of bytes, and indexing it does not return a char because one char can span multiple bytes.

Tuples group fixed-size, mixed-type values: let t: (i32, f64, &str) = (42, 3.14, "rust"). Destructure with let (a, b, c) = t; or index with t.0, t.1, t.2. The unit tuple () is Rust's void — functions that return nothing return ().

Arrays are fixed-size, same-type, stack-allocated: let xs: [i32; 5] = [1, 2, 3, 4, 5]. The length is part of the type — [i32; 5] and [i32; 6] are different types. Indexing is xs[i] with runtime bounds checks (panic on overflow). For dynamic-size collections, you want Vec<T> from std, covered later.

Arithmetic overflow panics in debug builds and wraps in release builds. If you need explicit semantics, use the wrapping_add, checked_add, saturating_add, overflowing_add families on every integer type.`,
    code: `fn main() {
    let count: u32 = 1_000_000;
    let pi: f64 = 3.141_592_653_589_793;
    let initial: char = 'R';
    let coord: (f64, f64) = (47.6, -122.3);
    let primes: [i32; 5] = [2, 3, 5, 7, 11];

    let (lat, lon) = coord;
    println!("{count} {pi} {initial} ({lat}, {lon}) {}", primes[0]);
}`,
    exercise: {
      prompt: `Declare a tuple named pair holding (10, 20) as (i32, i32). Destructure it into a and b, then print a + b.`,
      starter: `fn main() {
    // declare pair, destructure, print sum
}
`,
      expected: '30',
    },
    takeaways: [
      'Pick i32 by default, i64 when 2 billion is small, usize for indices and lengths.',
      'f64 is the default float — same speed as f32 on modern CPUs, fewer surprises.',
      'char is a 4-byte Unicode scalar; bytes are u8 and live in &[u8] / Vec<u8>.',
      'Array length is part of the type; for dynamic length reach for Vec.',
    ],
    mistakes: [
      'Indexing a &str with [i] and expecting a char — UTF-8 means it is illegal; use .chars().',
      'Assuming overflow wraps everywhere — debug panics, release wraps. Use checked_* for explicit handling.',
      'Mixing i32 and u32 in arithmetic — no implicit conversion; cast with as.',
    ],
    next: 'control-flow',
  },
  {
    id: 'control-flow',
    title: 'Foundations · Control Flow',
    subtitle: 'if as an expression, loop / while / for, and labelled breaks.',
    intro: `Rust's control flow constructs are expressions, not statements — they evaluate to values you can bind. if cond { a } else { b } returns a or b, so let x = if ready { 1 } else { 0 }; replaces the ternary operator. Both arms must have the same type; missing an else gives the unit type (), which usually causes a type error if you tried to bind it.

There are three loop forms. loop { ... } is an unconditional infinite loop — useful when you want to break with a value (let result = loop { ... break value; };). while cond { ... } loops while cond is true. for x in iter { ... } walks any IntoIterator — ranges (0..10), slices, vectors, hashmaps, anything that implements the trait. The for loop is the idiomatic choice 95% of the time; manual index-based while loops are a code smell unless you genuinely need the index pattern.

break and continue do what you expect, with one upgrade: labelled loops. 'outer: loop { loop { break 'outer; } } lets you break out of nested loops cleanly, which is the kind of pattern that breeds goto-style flags in other languages. The label is any 'name starting with a single quote — same syntax as lifetime parameters because they share a namespace.

if let and while let are pattern-matched conditionals. if let Some(x) = maybe { use(x) } is sugar for a one-arm match. while let Some(item) = queue.pop() { process(item) } is the canonical way to drain a collection until it is empty. They are not strict replacements for match — they exist because match { Some(x) => ..., None => () } is too noisy when you only care about one variant.

Ranges deserve a quick mention: 0..n is exclusive on the upper bound, 0..=n is inclusive. (0..5).rev() reverses. (1..=5).step_by(2) gives 1, 3, 5. These are first-class iterators so they compose with the rest of std.

A function that always diverges (panic!, loop {}, return) has the ! never type, which coerces to anything — convenient for one-arm matches.`,
    code: `fn main() {
    let n = 5;
    let label = if n % 2 == 0 { "even" } else { "odd" };

    let mut total = 0;
    for i in 1..=10 {
        if i % 2 != 0 { continue; }
        total += i;
    }
    println!("{label}, sum of evens 1..=10 = {total}");
}`,
    exercise: {
      prompt: `Print the sum of numbers from 1 to 100 inclusive using a for loop and a range.`,
      starter: `fn main() {
    let mut total = 0;
    // loop 1..=100, add each i
    println!("{total}");
}
`,
      expected: '5050',
    },
    takeaways: [
      'if is an expression — let x = if cond { a } else { b }; replaces ternaries.',
      'Three loops: loop (infinite, can break with value), while (predicate), for (iterator).',
      'Labelled loops let you break out of nested levels without flag variables.',
      'if let and while let are pattern-matched conditionals — sugar for one-arm matches.',
    ],
    mistakes: [
      'Writing a while loop with a manual index when a for ... in slice would do.',
      'Forgetting that 0..n is exclusive on n; use 0..=n when you want n included.',
      'Returning different types from if and else — both arms must agree.',
    ],
    next: 'functions',
  },
  {
    id: 'functions',
    title: 'Foundations · Functions',
    subtitle: 'fn signatures, expression-vs-statement bodies, and early returns.',
    intro: `Functions are declared with fn name(params) -> ReturnType { body }. Parameters always need explicit types — there is no inference at the signature boundary because the signature is the contract a function presents to the rest of the world. Return type defaults to () (unit) if you omit it; otherwise specify after ->.

The body is a block of statements followed by an optional trailing expression. An expression without a semicolon is the value of the block — and therefore the function's return value. fn add(a: i32, b: i32) -> i32 { a + b } is the canonical example. Adding a semicolon turns the expression into a statement (which evaluates to unit), so fn add(a: i32, b: i32) -> i32 { a + b; } fails to compile with expected i32, found (). That subtle semicolon rule is the single most common stumble for newcomers.

return expr; is the early-return form, valid anywhere in the body. Idiomatic Rust uses it only for guard clauses; the trailing expression is preferred for the main return path because it scans more naturally.

Parameters can be passed by value (move), by shared reference (&T), or by exclusive reference (&mut T). Pass-by-value moves ownership into the function unless T is Copy (integers, floats, bool, char, tuples of Copy types). For larger values, prefer references to avoid the move and the associated allocation copy.

Function pointers (fn(i32) -> i32) and closures (Fn / FnMut / FnOnce trait objects) are first-class. You can store them in variables, pass them as parameters, return them from functions. We will see closures in detail later — for now know that callbacks and higher-order functions are normal Rust.

Naming follows snake_case for functions and variables, PascalCase for types and traits, SCREAMING_SNAKE_CASE for constants. The compiler warns when you violate these — taking the warnings seriously keeps your code consistent with std and crates.io.`,
    code: `fn add(a: i32, b: i32) -> i32 {
    a + b
}

fn classify(n: i32) -> &'static str {
    if n == 0 { return "zero"; }
    if n > 0 { "positive" } else { "negative" }
}

fn main() {
    println!("{} {}", add(2, 3), classify(-7));
}`,
    exercise: {
      prompt: `Write a function square(n: i32) -> i32 that returns n * n. In main, print square(7).`,
      starter: `fn square(n: i32) -> i32 {
    // return n * n
    0
}
fn main() {
    println!("{}", square(7));
}
`,
      expected: '49',
    },
    takeaways: [
      'Parameter types are mandatory; return type is optional and defaults to () (unit).',
      'A trailing expression without a semicolon is the return value of the block.',
      'return is for early exits; idiomatic Rust uses the trailing expression for the happy path.',
      'snake_case for functions and variables, PascalCase for types, SCREAMING_SNAKE for constants.',
    ],
    mistakes: [
      'Trailing semicolon on the last expression — turns it into a statement; compile error if it should return.',
      'Passing a String by value when a &str would do — forces an unnecessary move.',
      'Forgetting parameter type annotations — Rust does not infer them at function signatures.',
    ],
    next: 'structs',
  },
  {
    id: 'structs',
    title: 'Foundations · Structs',
    subtitle: 'Named records, tuple structs, unit structs, and method syntax.',
    intro: `Structs group related fields under a single name. struct User { id: u64, email: String, active: bool } is a named struct — fields have names, you construct with User { id: 1, email: "ada@example.com".into(), active: true }, and access with dot syntax (u.email). Field shorthand lets you write User { id, email, active } when local variables have matching names.

Tuple structs drop field names: struct Point(f64, f64). Useful when names would feel redundant (a wrapper newtype around an i32, or a fixed coordinate). Access with .0, .1. Unit structs have neither fields nor parens: struct Marker; — useful as type tags or as markers in trait implementations.

Methods are functions inside an impl block. impl User { fn is_active(&self) -> bool { self.active } } attaches is_active to every User. The receiver is &self (immutable borrow), &mut self (mutable borrow), or self (consumes the value). Associated functions live in the same impl block but take no self — User::new(...) is the canonical constructor pattern (no built-in constructor syntax; new is just convention).

Field privacy is module-based. A struct field declared without pub is private to the defining module; pub field on a pub struct exposes it. Often you keep fields private and expose getters/setters or builder methods, which lets you change internal representation without breaking callers.

Update syntax saves typing when one struct is mostly the same as another: let u2 = User { id: 2, ..u1 }; copies the remaining fields from u1. The ..u1 must be the last entry. The fields not specified are moved out of u1 (or copied if Copy), so u1 might become partially moved and unusable depending on field types.

#[derive(Debug, Clone)] auto-generates implementations of common traits. Derive Debug to get {:?} printing during development; derive Clone if you need an explicit deep copy method. Derive PartialEq when you want struct equality.`,
    code: `#[derive(Debug)]
struct User {
    id: u64,
    email: String,
    active: bool,
}

impl User {
    fn new(id: u64, email: &str) -> Self {
        Self { id, email: email.to_string(), active: true }
    }
    fn deactivate(&mut self) { self.active = false; }
}

fn main() {
    let mut u = User::new(1, "ada@example.com");
    u.deactivate();
    println!("{:?}", u);
}`,
    exercise: {
      prompt: `Define a struct Rectangle { width: u32, height: u32 } with an area(&self) -> u32 method. Print the area of Rectangle { width: 5, height: 4 }.`,
      starter: `struct Rectangle {
    width: u32,
    height: u32,
}

impl Rectangle {
    // add area(&self) -> u32
}

fn main() {
    let r = Rectangle { width: 5, height: 4 };
    println!("{}", r.area());
}
`,
      expected: '20',
    },
    takeaways: [
      'Three flavours: named structs, tuple structs (.0 .1 access), and unit structs.',
      'Methods live in impl blocks; receivers are &self, &mut self, or self.',
      'Associated functions (no self) like Self::new are the constructor convention.',
      'Field privacy is module-scoped; use pub to expose, accessors to control.',
    ],
    mistakes: [
      'Making every field pub by reflex — locks in your wire format forever.',
      'Forgetting #[derive(Debug)] before printing with {:?} — derive trait not implemented error.',
      'Using ..other at the start of the field list — it must come last.',
    ],
    next: 'enums-and-match',
  },
  {
    id: 'enums-and-match',
    title: 'Foundations · Enums and Match',
    subtitle: 'Sum types, payload-carrying variants, and exhaustive pattern matching.',
    intro: `Enums in Rust are sum types — a value is exactly one of a fixed set of variants, each of which can carry its own data. enum Shape { Circle(f64), Rectangle { width: f64, height: f64 }, Triangle(f64, f64, f64) } defines three variants with different payloads. Construct one with Shape::Circle(2.0); the compiler tracks at the type level which variant a given value is.

This is the same idea as a tagged union in C, but enforced by the compiler. You cannot read the radius from what happens to be a Triangle — the only way to access payload is by matching, which forces you to handle every variant.

match is the pattern matching construct. match shape { Shape::Circle(r) => ..., Shape::Rectangle { width, height } => ..., Shape::Triangle(a, b, c) => ... } pulls the payload out of each variant. Match is exhaustive — the compiler errors if you forget a variant. That single guarantee removes a whole class of nullability and forgot-to-handle-case bugs that plague languages without it.

Patterns are rich. You can match literal values (1 => ...), ranges (1..=9 => ...), bindings (n => ...), tuples ((0, y) => ...), structs (Point { x: 0, y } => ...), refs (Some(&n) => ...), or any combination. The | character matches alternatives: Some(1) | Some(2) => ... Guards add a boolean predicate: Some(n) if n > 0 => .... _ is the wildcard that matches anything; use it for "all remaining cases" at the end of a match.

Two enums from std power most idiomatic Rust. Option<T> is Some(T) or None — the absence of a value. Result<T, E> is Ok(T) or Err(E) — success or failure. They will appear in nearly every signature you write. We will spend a full lesson on Result next.

if let Variant(x) = value { ... } is sugar for the one-arm match — concise when you only care about one variant. It pairs with else for the fall-through case.`,
    code: `enum Status {
    Active,
    Pending(u32),
    Rejected { reason: String },
}

fn describe(s: &Status) -> String {
    match s {
        Status::Active => String::from("active"),
        Status::Pending(days) => format!("pending {days} days"),
        Status::Rejected { reason } => format!("rejected: {reason}"),
    }
}

fn main() {
    let s = Status::Pending(3);
    println!("{}", describe(&s));
}`,
    exercise: {
      prompt: `Define enum Light { Red, Yellow, Green } with a method seconds(&self) -> u32 returning 30 for Red, 5 for Yellow, 25 for Green. Print Light::Green.seconds().`,
      starter: `enum Light {
    Red,
    Yellow,
    Green,
}

impl Light {
    // add seconds(&self) -> u32
}

fn main() {
    println!("{}", Light::Green.seconds());
}
`,
      expected: '25',
    },
    takeaways: [
      'Enums are sum types — exactly one variant per value, each with its own payload.',
      'match is exhaustive — forgetting a variant is a compile error, not a runtime surprise.',
      'Patterns can match literals, ranges, structs, tuples, refs, and combinations with |.',
      'Option<T> and Result<T, E> from std cover nullability and fallibility for the whole ecosystem.',
    ],
    mistakes: [
      'Adding _ => unimplemented!() to silence exhaustiveness — defeats the safety net.',
      'Forgetting that match arms must produce the same type — wrap one in a block if needed.',
      'Confusing enum variants with separate types — they share a single enum type.',
    ],
    next: 'error-handling-result',
  },
  {
    id: 'error-handling-result',
    title: 'Foundations · Error Handling with Result',
    subtitle: 'Result<T, E>, the ? operator, and the difference between recoverable and unrecoverable errors.',
    intro: `Rust splits errors into two camps. Unrecoverable errors panic — they signal a bug the program cannot reasonably continue past (array index out of bounds, divide by zero in some contexts, integer overflow in debug builds, explicit panic!). Recoverable errors return Result<T, E> — the caller decides whether to retry, propagate, log, or fall back. The vast majority of error handling in real Rust is the second kind. Panics are for genuine bugs and prototype code.

Result<T, E> is enum Result<T, E> { Ok(T), Err(E) }. A function that might fail returns Result. The caller pattern-matches or uses helpers. Common patterns:

- match result { Ok(v) => use(v), Err(e) => handle(e) } — explicit, clear, verbose.
- result.unwrap() — extracts Ok, panics on Err. Prototype only.
- result.expect("message") — like unwrap but with a custom panic message. Better for early development.
- result.unwrap_or(default) — value or fallback, no panic.
- result.unwrap_or_else(|e| compute_default(e)) — fallback computed from the error.
- result.map(|v| v + 1) / result.and_then(|v| more_fallible(v)) — chain transformations.

The ? operator is the centerpiece. value? unwraps the Ok or returns the Err from the enclosing function. This converts what would be deep nesting into a flat, linear flow. The catch: the function must return Result with an error type that the inner error converts into (via the From trait). std implements many of these conversions; for your own errors, derive thiserror or implement From by hand.

For application binaries, anyhow::Result<T> is a popular alias for Result<T, anyhow::Error> that auto-converts any error type. fn main() -> anyhow::Result<()> lets you use ? in main.

Libraries should expose typed errors via thiserror or a hand-rolled enum so callers can match on variants. Hiding everything behind Box<dyn Error> is convenient but discards information that library consumers need.

panic! is for invariants you believe cannot fail. unreachable!() is panic with a "this branch should never run" message. todo!() is a placeholder during development that compiles but panics if hit.`,
    code: `use std::num::ParseIntError;

fn parse_pair(s: &str) -> Result<(i32, i32), ParseIntError> {
    let mut parts = s.split(',');
    let a: i32 = parts.next().unwrap_or("0").trim().parse()?;
    let b: i32 = parts.next().unwrap_or("0").trim().parse()?;
    Ok((a, b))
}

fn main() {
    match parse_pair("12, 34") {
        Ok((a, b)) => println!("sum = {}", a + b),
        Err(e) => println!("parse failed: {e}"),
    }
}`,
    exercise: {
      prompt: `Write fn safe_divide(a: i32, b: i32) -> Result<i32, String> returning Err("divide by zero".into()) when b is 0, else Ok(a / b). In main, print safe_divide(20, 4).unwrap().`,
      starter: `fn safe_divide(a: i32, b: i32) -> Result<i32, String> {
    // return Err on b == 0, Ok otherwise
    Ok(0)
}
fn main() {
    println!("{}", safe_divide(20, 4).unwrap());
}
`,
      expected: '5',
    },
    takeaways: [
      'Result<T, E> for recoverable errors; panic! for invariants you believe cannot fail.',
      'The ? operator unwraps Ok or propagates Err — turns nested checks into linear flow.',
      'unwrap and expect panic on Err — prototype only; use ? or match in production.',
      'Libraries should expose typed error enums; apps can use anyhow for convenience.',
    ],
    mistakes: [
      'Swallowing errors with .unwrap_or_default() and losing the failure signal entirely.',
      'Using ? in a function that returns the wrong error type — implement From or convert manually.',
      'Returning Box<dyn Error> from a library — callers cannot match on specific failure modes.',
    ],
    next: 'vectors-and-slices',
  },
  {
    id: 'vectors-and-slices',
    title: 'Foundations · Vectors and Slices',
    subtitle: 'Vec<T>, &[T], capacity vs length, and the standard collection operations.',
    intro: `Vec<T> is the growable, heap-allocated array — the std collection you reach for whenever the size is not known at compile time. Internally it is a triple of (pointer, length, capacity). Length is how many items it holds; capacity is how many it could hold before reallocating. push appends at the end; if length equals capacity, the vector allocates a larger buffer (usually doubling) and copies the items. This amortised growth is why push is O(1) on average even though individual pushes occasionally pay for a copy.

Construct with Vec::new(), vec![1, 2, 3] (macro), or Vec::with_capacity(n) when you know roughly how many elements you will push. The last form preallocates and skips the doubling reallocations — critical for hot loops.

Common operations: v.push(x), v.pop() (returns Option<T>), v.len(), v.is_empty(), v[i] (panics on out of bounds), v.get(i) (returns Option<&T>, no panic), v.iter() / v.iter_mut() / v.into_iter(), v.sort(), v.sort_by(|a, b| ...), v.dedup(), v.retain(|x| pred), v.extend(other).

A slice is a reference to a contiguous run of items without owning them: &[T] (shared) or &mut [T] (mutable). Slices are fat pointers — pointer plus length. A Vec<T> coerces to &[T] automatically, so functions that only need to read should take &[T], not &Vec<T> — that lets callers pass any slice (array, vec, sub-range) without conversion.

Slice syntax: &v[2..5] borrows items 2, 3, 4. The range can be open: &v[..3], &v[2..], &v[..]. Slicing checks bounds at runtime and panics on overflow. Slices implement most of the same methods as Vec for reading (.len, .iter, .first, .last, .windows, .chunks, .split_at).

Vec implements Iterator via iter(). Chain it with map, filter, fold, collect to build pipelines that are zero-cost — the compiler fuses them into a single loop. Prefer iterator chains over manual for loops once you are comfortable.

Capacity matters for performance. v.shrink_to_fit() drops the unused capacity. v.clear() empties without freeing — useful for reusing a buffer.`,
    code: `fn sum_above(slice: &[i32], threshold: i32) -> i32 {
    slice.iter().filter(|&&x| x > threshold).sum()
}

fn main() {
    let mut v = Vec::with_capacity(8);
    v.extend([3, 1, 4, 1, 5, 9, 2, 6]);
    v.sort();

    println!("sorted: {:?}", v);
    println!("sum above 3: {}", sum_above(&v, 3));
}`,
    exercise: {
      prompt: `Build a Vec<i32> containing the numbers 1, 2, 3, 4, 5 using the vec! macro. Sum them with .iter().sum::<i32>() and print the result.`,
      starter: `fn main() {
    let v = vec![/* fill */];
    let total: i32 = 0; // replace with v.iter().sum()
    println!("{total}");
}
`,
      expected: '15',
    },
    takeaways: [
      'Vec<T> is the growable, heap-allocated array — capacity grows by doubling on push.',
      'Slice &[T] is a borrowed view — pointer + length, no ownership.',
      'Prefer &[T] over &Vec<T> in function parameters — accepts arrays and sub-slices too.',
      'Vec::with_capacity(n) skips the reallocation chain when you know the size.',
    ],
    mistakes: [
      'Indexing v[i] with an out-of-range i — panic; use v.get(i) for safe access.',
      'Cloning a slice into a Vec just to pass to a function that wanted &[T] — wasted allocation.',
      'Mutating a vector while iterating it — borrow checker prevents the obvious cases; logic bugs in the rest.',
    ],
    next: 'strings-and-string-views',
  },
  {
    id: 'strings-and-string-views',
    title: 'Foundations · Strings and String Views',
    subtitle: 'String, &str, why UTF-8 makes indexing illegal, and how to do it anyway.',
    intro: `Rust has two main string types. String is an owned, heap-allocated, growable UTF-8 buffer — analogous to Vec<u8> with the invariant that the bytes form valid UTF-8. &str (string slice) is a borrowed view into UTF-8 bytes — pointer plus length, no ownership. String literals in source code ("hello") have type &'static str — they live in the binary's read-only data segment.

The split mirrors Vec / slice. Functions that read should take &str so they accept both owned strings and literals. Functions that need to own the string take String. Convert with .to_string() / String::from(...) (slice to owned) or &s / s.as_str() (owned to slice, zero cost).

Indexing s[i] is not allowed and never will be. UTF-8 encodes each character as one to four bytes, so "byte index 7" might fall in the middle of a multi-byte character — returning half a character is meaningless. To get characters, iterate s.chars() (Unicode scalars) or s.bytes() (raw u8). To get a sub-string by character offsets, you usually want s.char_indices() to find the right byte boundaries and then s[start..end].

Common operations: s.len() (byte length, not character count), s.chars().count() (character count, O(n)), s.is_empty(), s.contains(needle), s.starts_with / s.ends_with, s.split(','), s.trim(), s.replace(old, new), s.to_lowercase / s.to_uppercase. Concatenation: s + &t (the right side must be a slice), or format!("{}{}", a, b) when you want a new String without consuming the inputs.

Strings can be built efficiently with String::with_capacity(n) plus push_str, the same pattern as Vec::with_capacity. format! allocates a new String; write! to an existing buffer skips the allocation. For hot loops that build many strings, prefer write! into a reusable String.

When you really need a raw byte buffer (network protocols, binary files), use Vec<u8>. The functions that bridge are .as_bytes() (slice to &[u8]) and str::from_utf8 (slice from &[u8], returns Result because not every byte sequence is valid UTF-8).`,
    code: `fn main() {
    let owned: String = String::from("PGcode");
    let view: &str = "Rust";

    let greeting = format!("{owned} learns {view}");
    println!("{greeting}");
    println!("bytes = {}, chars = {}", greeting.len(), greeting.chars().count());

    for (i, c) in greeting.char_indices().take(3) {
        println!("{i} -> {c}");
    }
}`,
    exercise: {
      prompt: `Given let s = "hello world", print the number of characters (not bytes). Expected: 11.`,
      starter: `fn main() {
    let s = "hello world";
    // print character count
}
`,
      expected: '11',
    },
    takeaways: [
      'String is owned and heap-allocated; &str is a borrowed UTF-8 view.',
      'No s[i] indexing — UTF-8 means byte offsets do not align with characters.',
      'Take &str in function parameters that only read; take String when you need ownership.',
      'format! allocates a String; write! into an existing buffer when allocation matters.',
    ],
    mistakes: [
      'Calling s.len() to get character count — it returns bytes; use s.chars().count() for chars.',
      'Trying to mutate a &str — it is borrowed; mutate the underlying String instead.',
      'Repeated s = s + &t in a loop — quadratic; build a String with push_str or write!.',
    ],
    next: 'ownership-rules',
  },

  // ─── Ownership, Lifetimes, Traits (10) ──────────────────────────
  {
    id: 'ownership-rules',
    title: 'Ownership & Traits · Ownership Rules',
    subtitle: 'The three rules — one owner, scoped lifetime, automatic drop — and the move semantics they imply.',
    intro: `Ownership is Rust's central idea. Three rules, enforced at compile time, give you memory safety without a garbage collector and concurrency safety without a runtime. The rules are: every value has exactly one owner; when the owner goes out of scope, the value is dropped; assignment, function arguments, and return values move ownership (unless the type is Copy).

A value's owner is a variable binding. let s = String::from("rust"); makes s the owner of a heap-allocated String. When s goes out of scope at the end of its block, Rust runs the String's Drop implementation — freeing the heap allocation. No GC pass, no reference counting, just a deterministic call at a known program point.

Assignment moves. let a = String::from("x"); let b = a; transfers ownership to b. a is no longer valid — the compiler tracks this at the type level and emits "value borrowed after move" if you try to use a. The point is not that the bytes were copied (they were not — only the (pointer, length, capacity) triple) but that the responsibility for cleaning up has been handed off. Two owners would mean two drops, which is a double-free.

Function calls move arguments by value too. fn take(s: String) consumes s; the caller cannot use the variable afterward. To call a function without giving up ownership, pass a reference (&s) — covered in the next lesson on borrowing.

Some types are Copy: integers, floats, bool, char, tuples of Copy types, fixed-size arrays of Copy types. Copy types are duplicated by assignment rather than moved — the original binding remains valid. Vec, String, Box, anything heap-allocated, and anything with a custom Drop is not Copy because copying would silently allocate.

Returning a value from a function transfers ownership out. fn build() -> String returns ownership to the caller; nothing is freed at the function boundary. This is how you write APIs that hand back owned values without any lifetime annotations.

Clone is the explicit, possibly expensive copy: let b = a.clone(); duplicates the value (deep copy for heap types) and leaves both bindings valid. Use it deliberately — it always has runtime cost, and reflexive cloning is a code smell.

Understanding ownership turns the borrow checker from an enemy into an assistant. Almost every borrow checker error is the compiler pointing at a real lifetime or aliasing bug that other languages would let through into production.`,
    code: `fn take(s: String) -> usize {
    s.len()
}

fn main() {
    let owned = String::from("hello");
    let length = take(owned);
    println!("length = {length}");
    // owned is no longer usable here — moved into take()
}`,
    exercise: {
      prompt: `Build let s = String::from("rust"); pass it into fn first_byte(s: String) -> u8 that returns s.as_bytes()[0], and print the byte value. Expected: 114.`,
      starter: `fn first_byte(s: String) -> u8 {
    // return s.as_bytes()[0]
    0
}
fn main() {
    let s = String::from("rust");
    println!("{}", first_byte(s));
}
`,
      expected: '114',
    },
    takeaways: [
      'One owner per value; assignment / args / returns move ownership.',
      'When the owner leaves scope, Drop runs and the resources are freed.',
      'Copy types (integers, bools, tuples of Copy) duplicate on assignment instead of moving.',
      'Clone is the explicit deep copy — always has cost, use it deliberately.',
    ],
    mistakes: [
      'Reaching for .clone() to silence the compiler — usually the wrong fix; borrow instead.',
      'Trying to use a value after moving it into a function — the compiler tracks moves precisely.',
      'Expecting String to be Copy because i32 is — heap-owning types never are.',
    ],
    next: 'borrowing-and-references',
  },
  {
    id: 'borrowing-and-references',
    title: 'Ownership & Traits · Borrowing and References',
    subtitle: '&T and &mut T, the aliasing XOR mutability rule, and reference lifetimes.',
    intro: `Moving ownership for every function call would be unbearable, so Rust offers references — temporary, non-owning access to a value. &v is an immutable (shared) borrow of v: read access, no exclusive use. &mut v is a mutable (exclusive) borrow: read and write access, no other references may exist concurrently. Functions declare what they need by their parameter type: fn read(x: &i32), fn modify(x: &mut i32).

The single rule that powers Rust's safety is aliasing XOR mutability: at any moment, a value has either any number of shared references or exactly one mutable reference, never both, never two mutable. This rule eliminates entire bug classes — iterator invalidation, data races, use-after-free — by making them compile errors instead of runtime crashes.

Borrows are checked at every program point. fn append(v: &mut Vec<i32>, x: &i32) is fine even when both refer to the same vector as long as the compiler can prove the &i32 does not actually alias the &mut Vec<i32>. The non-lexical lifetimes (NLL) analyser tracks where each borrow is last used, so two borrows that conceptually overlap in scope but not in actual use are allowed.

Borrows have lifetimes — the region of code where the reference is valid. Most are inferred (lifetime elision). When a function signature has multiple input references and a returned reference, you may need to spell out the connection: fn longest<'a>(a: &'a str, b: &'a str) -> &'a str. We will cover lifetimes in detail next; for now the takeaway is that the borrow checker proves the reference never outlives the value it points to.

Dereferencing with * reads through a reference: let r = &x; let n = *r; gets the value. For method calls, Rust auto-dereferences — r.method() is the same as (*r).method(). Same for field access through structs.

Reborrow lets you pass a &mut through to another scope without giving it up: fn helper(v: &mut Vec<i32>) { helper2(&mut *v); } reborrows v exclusively for helper2's duration and gets it back afterward. This is how you build composable functions over mutable data without surrendering ownership.

The Rule against multiple mutable borrows can feel restrictive at first. The escape hatches are interior mutability types — RefCell for single-threaded, Mutex / RwLock for multi-threaded — covered later when we hit smart pointers and threading.`,
    code: `fn change(s: &mut String) {
    s.push_str(" world");
}

fn length(s: &String) -> usize {
    s.len()
}

fn main() {
    let mut greeting = String::from("hello");
    change(&mut greeting);
    println!("{} (len = {})", greeting, length(&greeting));
}`,
    exercise: {
      prompt: `Write fn double(n: &mut i32) that multiplies the referenced value by 2. In main, declare let mut x = 21;, call double(&mut x);, and print x.`,
      starter: `fn double(n: &mut i32) {
    // *n *= 2
}
fn main() {
    let mut x = 21;
    double(&mut x);
    println!("{x}");
}
`,
      expected: '42',
    },
    takeaways: [
      'At any time: any number of &T OR exactly one &mut T — never both, never two &mut.',
      'Lifetimes are mostly inferred; spell them only when the signature has ambiguity.',
      'Auto-dereferencing means r.method() works without manual (*r). spelling.',
      'Reborrow with &mut *v to lend an exclusive reference downward and get it back.',
    ],
    mistakes: [
      'Holding a &mut while passing &T to another function on the same value — borrow error.',
      'Returning a reference to a local — the local dies at function end; dangling reference.',
      'Reaching for Rc<RefCell<T>> to dodge the borrow checker — sometimes right, often a smell.',
    ],
    next: 'lifetimes-intro',
  },
  {
    id: 'lifetimes-intro',
    title: 'Ownership & Traits · Lifetimes Intro',
    subtitle: 'What lifetime parameters are, where elision works, and when you must write them.',
    intro: `Lifetimes are how Rust proves references stay valid. Every reference has a lifetime — the region of code during which it is guaranteed safe to use. Most lifetimes are inferred and never appear in your code. They become visible (and required) when a function or struct signature involves multiple references and the compiler cannot figure out the relationship between them.

A lifetime parameter looks like a type parameter with a leading single quote: fn longest<'a>(x: &'a str, y: &'a str) -> &'a str. Read this as: "for some lifetime 'a, takes two string slices that live at least as long as 'a and returns a string slice that also lives at least as long as 'a." The lifetime is named (you pick the name, 'a is convention) and the same name in multiple positions means "these must share at least this much lifetime."

The compiler applies three elision rules before requiring explicit annotations: every input reference gets its own lifetime; if there is exactly one input lifetime, it is assigned to all outputs; if one of the inputs is &self or &mut self, its lifetime is assigned to all outputs. Together these cover ~95% of function signatures so you rarely write 'a by hand.

When elision fails, the error message tells you: "missing lifetime specifier — this function's return type contains a borrowed value, but the signature does not say whether it is borrowed from x or y." That is your cue to add 'a and decide which input the output borrows from.

Lifetimes can appear on structs that hold references: struct Parser<'a> { input: &'a str }. Every method on the struct then carries that 'a forward, so the parser cannot outlive its input. Lifetimes on enums and traits follow the same pattern.

The 'static lifetime is the longest one — the entire program. String literals have type &'static str because they live in the binary's data segment. Avoid demanding 'static unless you mean it; it locks out borrowed callers.

Lifetimes are erased at compile time. They affect what the type checker accepts but produce no runtime code or data. Once your program compiles, the lifetimes are gone — every reference is just a pointer.

Common newcomer trap: trying to return a reference to a local. fn build() -> &String { let s = String::from("..."); &s } cannot compile because s dies at function end. Return the owned value (String) instead. Lifetimes do not magically extend the value they reference.`,
    code: `fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() >= y.len() { x } else { y }
}

struct FirstWord<'a> {
    text: &'a str,
}

impl<'a> FirstWord<'a> {
    fn word(&self) -> &'a str {
        match self.text.find(' ') {
            Some(i) => &self.text[..i],
            None => self.text,
        }
    }
}

fn main() {
    let a = String::from("alphabet");
    let b = String::from("bee");
    println!("{}", longest(&a, &b));

    let fw = FirstWord { text: "rust is great" };
    println!("{}", fw.word());
}`,
    exercise: {
      prompt: `Write fn longer<'a>(a: &'a str, b: &'a str) -> &'a str that returns whichever slice has more characters. Print longer("apple", "kiwi"). Expected: apple.`,
      starter: `fn longer<'a>(a: &'a str, b: &'a str) -> &'a str {
    // return the longer slice
    a
}
fn main() {
    println!("{}", longer("apple", "kiwi"));
}
`,
      expected: 'apple',
    },
    takeaways: [
      "Lifetimes annotate references so the borrow checker can prove they never dangle.",
      "Three elision rules cover most signatures; you write 'a only when the compiler asks.",
      "Structs holding references carry a lifetime parameter (struct Parser<'a>).",
      "'static is the entire program — almost never the right requirement.",
    ],
    mistakes: [
      "Returning a reference to a local — the local dies first; return owned values instead.",
      "Tying two unrelated references together with one 'a — over-constrains callers.",
      "Reaching for 'static everywhere — locks out borrowed inputs and forces clones.",
    ],
    next: 'traits-and-bounds',
  },
  {
    id: 'traits-and-bounds',
    title: 'Ownership & Traits · Traits and Bounds',
    subtitle: 'Defining behaviour shared across types, default methods, and trait bounds on functions.',
    intro: `Traits define behaviour that types can implement — the rough equivalent of interfaces in Java or protocols in Swift, but with more punch. A trait is declared with trait Name { fn method(&self) -> T; }, and any type can implement it via impl Name for MyType { fn method(&self) -> T { ... } }. Once implemented, callers can use the trait's methods on values of that type.

Traits can have default method bodies. trait Greet { fn name(&self) -> &str; fn hello(&self) { println!("hi {}", self.name()); } } provides hello to every implementor for free; they only need to override name(). Implementors can also override the default if they want different behaviour.

Trait bounds restrict what a generic function accepts. fn print_all<T: Display>(items: &[T]) accepts a slice of anything that implements Display — strings, numbers, custom types that derive or implement Display. Multiple bounds use +: T: Display + Clone. The where clause is the same thing in long-form syntax, used when the bounds get crowded: fn complex<T>(x: T) where T: Display + Clone + 'static.

Two flavours of polymorphism with traits. Static dispatch (generics) — fn foo<T: Trait>(x: T) — monomorphises at compile time. The compiler generates one specialised version of foo per type T it is called with. Zero runtime cost, larger binary. Dynamic dispatch (trait objects) — fn foo(x: &dyn Trait) or Box<dyn Trait> — uses a vtable at runtime. One copy of the function, slight indirection per call, smaller binary. Use static dispatch by default; reach for dyn when you genuinely need heterogeneous collections or want to compile faster.

The orphan rule: you can implement a trait for a type only if you own the trait or the type. You cannot impl Display for Vec<i32> because both belong to std — neither is yours. The workaround is the newtype pattern: struct MyVec(Vec<i32>); impl Display for MyVec { ... }.

Marker traits carry no methods — they signal capability. Send means values can be moved between threads, Sync means &T can be shared between threads. These are derived automatically when all fields support them, and they gate what concurrency you can do.

Derive macros (#[derive(Debug, Clone, PartialEq)]) generate trait implementations from the struct's field types. Use them aggressively for standard traits; only hand-implement when you need custom semantics.`,
    code: `trait Shape {
    fn area(&self) -> f64;
    fn describe(&self) -> String {
        format!("a shape with area {:.2}", self.area())
    }
}

struct Square { side: f64 }
impl Shape for Square {
    fn area(&self) -> f64 { self.side * self.side }
}

fn print_area<T: Shape>(s: &T) {
    println!("{}", s.describe());
}

fn main() {
    let sq = Square { side: 4.0 };
    print_area(&sq);
}`,
    exercise: {
      prompt: `Define trait Named { fn name(&self) -> &str; } and impl it for struct Cat { } with the constant name "Kitty". Print Cat{}.name().`,
      starter: `trait Named {
    fn name(&self) -> &str;
}

struct Cat;

// impl Named for Cat

fn main() {
    let c = Cat;
    println!("{}", c.name());
}
`,
      expected: 'Kitty',
    },
    takeaways: [
      'Traits define shared behaviour; impl Trait for Type wires up an implementation.',
      'Default method bodies let one implementation cover most cases automatically.',
      'Static dispatch (generics) monomorphises; dynamic dispatch (dyn Trait) uses a vtable.',
      'Orphan rule: own the trait or own the type — newtype wrapper escapes the rest.',
    ],
    mistakes: [
      'Trying to impl an external trait for an external type — orphan rule rejects it.',
      'Reaching for dyn Trait by reflex — generics are usually cheaper and just as flexible.',
      'Forgetting to import a trait — methods are not in scope until you use trait::Name.',
    ],
    next: 'generics',
  },
  {
    id: 'generics',
    title: 'Ownership & Traits · Generics',
    subtitle: 'Type parameters on functions and structs, monomorphisation, and bound design.',
    intro: `Generics let you write code that works for many types without repeating yourself. The syntax mirrors traits: angle brackets after the function or type name. fn largest<T: PartialOrd>(items: &[T]) -> &T returns a reference to the largest item in any slice whose elements can be compared with >. Structs work the same: struct Pair<A, B> { first: A, second: B } holds two values of arbitrary types.

Generics in Rust are monomorphised. The compiler generates a specialised copy of the function or type for each concrete instantiation. largest::<i32>, largest::<String>, largest::<MyType> each become a distinct compiled function. This means generics are zero-cost — the resulting machine code is the same as if you had hand-written each version — at the price of larger binaries and longer compile times.

Bounds describe what operations the generic type must support. Without bounds, you can only do operations that work for every type — basically nothing useful. fn print<T>(x: T) compiles but cannot call x.something(). Add T: Display to call print!("{x}"). T: Display + Clone to also clone. Where clauses (where T: Display, U: Clone) move the bounds out of the angle brackets when they get crowded; identical semantics.

Implement methods on generic structs the same way: impl<T> Pair<T, T> { fn matched(&self) -> bool where T: PartialEq { self.first == self.second } }. The impl block can constrain T further than the struct's declaration if you want methods that only make sense for some Ts.

Type parameters can have defaults: struct Stack<T, A: Allocator = Global>. Callers who do not care about the allocator get the default; advanced users override it. This is how Vec<T> actually works internally.

A common pattern is "convert anything that looks like a string": fn greet<S: Into<String>>(name: S) lets callers pass &str, String, or anything else with an Into<String> impl. Similarly AsRef<Path> takes anything that can be referenced as a Path.

Be careful with overconstrained signatures. fn foo<T: Clone>(x: T) demands Clone whether or not foo actually clones. If the body never calls .clone(), drop the bound — every unnecessary bound is an obstacle for callers.

Generic types are also the foundation for traits with associated types (later) and for higher-kinded patterns like Iterator<Item = T>.`,
    code: `fn largest<T: PartialOrd + Copy>(items: &[T]) -> T {
    let mut best = items[0];
    for &x in items {
        if x > best { best = x; }
    }
    best
}

struct Pair<A, B> { first: A, second: B }

impl<A: std::fmt::Display, B: std::fmt::Display> Pair<A, B> {
    fn show(&self) { println!("({}, {})", self.first, self.second); }
}

fn main() {
    println!("{}", largest(&[3, 1, 4, 1, 5, 9, 2, 6]));
    Pair { first: "x", second: 42 }.show();
}`,
    exercise: {
      prompt: `Write fn first<T: Clone>(slice: &[T]) -> T returning a clone of slice[0]. Print first(&[10, 20, 30]).`,
      starter: `fn first<T: Clone>(slice: &[T]) -> T {
    // return slice[0].clone()
    slice[0].clone()
}
fn main() {
    println!("{}", first(&[10, 20, 30]));
}
`,
      expected: '10',
    },
    takeaways: [
      'Generics monomorphise — each concrete T gets its own compiled version. Zero cost at runtime.',
      'Bounds (T: Display + Clone) declare which trait methods you may call on T.',
      'Where clauses are the long-form syntax for bounds — same meaning, more room.',
      'Overconstrained bounds are an obstacle for callers; remove ones you do not actually use.',
    ],
    mistakes: [
      'Forgetting bounds and trying to call methods that need them — error: method not found.',
      'Demanding Clone or Copy when the body does not need it — locks out perfectly good callers.',
      'Confusing static and dynamic dispatch — fn f<T: Trait> vs fn f(x: &dyn Trait) are different.',
    ],
    next: 'iterators-and-closures',
  },
  {
    id: 'iterators-and-closures',
    title: 'Ownership & Traits · Iterators and Closures',
    subtitle: 'Lazy iterator pipelines, closures as first-class values, and Fn / FnMut / FnOnce.',
    intro: `Iterators in Rust are lazy. Calling .map, .filter, .take on an iterator builds a description of the pipeline — no work happens until a terminal operation runs it (collect, sum, count, fold, for_each, last). This means you can chain dozens of transformations without intermediate allocations; the compiler fuses them into a single loop that runs as fast as a hand-written one. Zero-cost abstraction is not a slogan — measure the assembly and you will find the iterator chain compiles down to the same machine code as the loop you would have written by hand.

The Iterator trait has one required method: next(&mut self) -> Option<Self::Item>. Every adaptor (map, filter, take, skip, zip, chain, enumerate, peekable, windows) is built on next. Building your own iterator is as simple as struct Counter { current: u32 } and impl Iterator for Counter { type Item = u32; fn next(&mut self) -> Option<u32> { ... } } — then every adaptor in std works on it for free.

Three flavours of iteration over a collection. .iter() yields &T (shared references — collection unchanged). .iter_mut() yields &mut T (exclusive references — collection mutated through them). .into_iter() yields T (owns and consumes the collection). The for x in v sugar calls .into_iter() by default; for x in &v calls .iter().

Closures are anonymous functions: |x| x * 2. They capture variables from the enclosing scope automatically — by shared reference if you only read, by mutable reference if you write, by move if you spell move |x| ... or if the closure outlives the scope (returning it, sending it to another thread).

Closures implement one of three trait families: FnOnce (consumes captured values, can be called once — every closure implements this), FnMut (mutates captures, can be called many times), Fn (only reads captures, callable from many places at once). Function signatures pick the strictest bound they need. Iterator adaptors like map take FnMut because they call the closure many times; threading APIs take FnOnce + Send + 'static because they ship the closure to another thread.

collect deserves a special mention. let v: Vec<i32> = (1..=5).map(|n| n * 2).collect() turns any iterator into any collection (Vec, HashSet, HashMap, String, your own type via FromIterator). The destination type usually needs an annotation because there is nothing else for the compiler to anchor inference to — the turbofish .collect::<Vec<_>>() is the inline alternative.`,
    code: `fn main() {
    let v = vec![3, 1, 4, 1, 5, 9, 2, 6];

    let squared_evens: Vec<i32> = v.iter()
        .filter(|&&x| x % 2 == 0)
        .map(|&x| x * x)
        .collect();

    let total: i32 = squared_evens.iter().sum();
    println!("{:?} sum = {}", squared_evens, total);

    let threshold = 3;
    let count = v.iter().filter(|&&x| x > threshold).count();
    println!("> {threshold}: {count}");
}`,
    exercise: {
      prompt: `Given let v = vec![1, 2, 3, 4, 5];, use iterators to compute the sum of squares and print it. Expected: 55.`,
      starter: `fn main() {
    let v = vec![1, 2, 3, 4, 5];
    let total: i32 = 0; // replace with v.iter().map(...).sum()
    println!("{total}");
}
`,
      expected: '55',
    },
    takeaways: [
      'Iterators are lazy — adaptor chains run only when a terminal call (collect, sum, count) fires.',
      'Closures: |x| body. Captures inferred by usage; spell move when you need ownership.',
      'Fn / FnMut / FnOnce describe how many times and how a closure can run.',
      'collect needs a type annotation — let v: Vec<_> = ... or .collect::<Vec<_>>().',
    ],
    mistakes: [
      'Building an iterator chain and forgetting to consume it — nothing runs, no warning.',
      'Calling .iter when you need ownership — use .into_iter to move elements out.',
      'Trying to return a closure without Box<dyn Fn(...)> or impl Fn(...) — closures have unnameable types.',
    ],
    next: 'smart-pointers-box-rc',
  },
  {
    id: 'smart-pointers-box-rc',
    title: 'Ownership & Traits · Smart Pointers: Box, Rc, Arc',
    subtitle: 'When the standard ownership model is not enough — heap allocation, sharing, interior mutability.',
    intro: `Smart pointers are types that act like pointers but carry extra metadata or capabilities — Box, Rc, Arc, RefCell, Mutex, Cow. They implement Deref so . and * work transparently, and most implement Drop so cleanup runs automatically.

Box<T> is single-owner heap allocation. Box::new(value) moves value to the heap and returns a Box that owns it. Two main uses: recursive data structures (a linked list node holding Box<Node> sidesteps the infinite-size problem because Box has a known pointer-sized layout regardless of T) and trait objects (Box<dyn Trait> lets you hold any type implementing Trait behind a single owned pointer). Box has zero runtime cost beyond the heap allocation itself — no reference counting, no extra indirection at the type level.

Rc<T> (reference counted) lets multiple owners share immutable access to a single heap value. Cloning an Rc bumps the count (cheap — just an integer increment); when the last clone drops, the inner value is freed. Rc is single-threaded by design — it uses non-atomic counters because thread-safe atomics are slower. Use it for graph-like data where you need shared ownership but a single thread will touch everything.

Arc<T> is Rc with atomic reference counting — safe to share across threads. Pay the slightly higher atomic cost only when you need it. Combining Arc with a synchronisation primitive (Arc<Mutex<T>>, Arc<RwLock<T>>) is how you share mutable state across threads in standard Rust.

Interior mutability is the escape from the borrow rule "no &mut while &T exists." RefCell<T> holds a T and enforces the borrow rules at runtime rather than compile time. cell.borrow() gives a Ref<T>, cell.borrow_mut() gives a RefMut<T>; violating the aliasing rule panics. Pair with Rc to get Rc<RefCell<T>> — shared mutable state for single-threaded programs. The threaded equivalents are Mutex (exclusive lock) and RwLock (multiple readers or one writer).

Cow<'a, T> ("clone on write") is a pointer that is either borrowed or owned. Cheap to construct when you do not mutate; clones on first write. Useful for return types that often pass data through unchanged but sometimes need to allocate.

Cycles with Rc / Arc leak memory because the reference count never reaches zero. Break cycles with Weak<T> — a non-owning reference that does not count toward the strong count. Trees and graphs that need parent pointers use Weak for the back-edge.

Reaching for these tools is a signal. Box for trait objects and recursion is normal. Rc/Arc + RefCell/Mutex says "the simple ownership model would not fit my domain" — usually correct, occasionally a sign the design should be restructured.`,
    code: `use std::rc::Rc;
use std::cell::RefCell;

fn main() {
    let shared = Rc::new(RefCell::new(vec![1, 2, 3]));
    let view = Rc::clone(&shared);

    shared.borrow_mut().push(4);
    println!("count = {}, value = {:?}", Rc::strong_count(&shared), view.borrow());
}`,
    exercise: {
      prompt: `Build let a = Rc::new(7);, clone it twice into b and c, and print Rc::strong_count(&a). Expected: 3.`,
      starter: `use std::rc::Rc;

fn main() {
    let a = Rc::new(7);
    // clone twice and print Rc::strong_count(&a)
}
`,
      expected: '3',
    },
    takeaways: [
      'Box<T>: single-owner heap; ideal for recursive types and Box<dyn Trait>.',
      'Rc<T>: single-threaded shared ownership via non-atomic counts.',
      'Arc<T>: thread-safe shared ownership; pair with Mutex/RwLock for mutation.',
      'Cycles leak; break them with Weak<T> back-edges.',
    ],
    mistakes: [
      'Using Rc across threads — not Send. The compiler stops you; use Arc.',
      'Building Rc<Rc<T>> or other accidental nesting — usually a logic bug.',
      'Reaching for Rc<RefCell> when a &mut would have worked — adds runtime cost for nothing.',
    ],
    next: 'threading-and-send-sync',
  },
  {
    id: 'threading-and-send-sync',
    title: 'Ownership & Traits · Threading, Send and Sync',
    subtitle: 'std::thread::spawn, marker traits that gate sharing, and the compile-time guarantee against data races.',
    intro: `Threads in Rust are OS threads — preemptive, expensive to create relative to async tasks, but well-suited to CPU-bound work. std::thread::spawn(|| { ... }) starts one and returns a JoinHandle whose .join() waits for completion and returns the closure's return value. Each thread has its own stack (default 2 MiB on Linux) and runs in parallel on a separate core when one is available.

The closure passed to spawn must capture by move (the compiler usually requires move when the closure outlives the spawning scope), and the closure plus its captured values must implement Send + 'static. Send means a value can be transferred between threads safely. 'static means the value contains no non-static references — important because the spawning function may return before the thread finishes, so any borrowed reference would dangle.

Send and Sync are the two marker traits that make this work. Send: the value can be moved to another thread. Sync: &T can be shared between threads. Both are auto-derived — your custom type is Send if all its fields are Send, Sync if all its fields are Sync. Most types are both. Cell, RefCell, and Rc are deliberately not Sync / Send because their internals are not thread-safe. Use Mutex, RwLock, Atomic*, Arc instead when you cross thread boundaries.

For shared mutable state, the canonical pattern is Arc<Mutex<T>>. Arc shares the pointer, Mutex serialises access. let data = Arc::new(Mutex::new(0)); — clone the Arc for each thread, call data.lock().unwrap() to get a guard, hold the guard while you read/write, drop the guard when you are done. Lock acquisition is a compile-time guarantee of exclusive access; the type system makes it impossible to access the inner value without holding the lock.

Scoped threads (std::thread::scope, stable since 1.63) let threads borrow from the spawning function. The scope blocks until all spawned threads exit, so the borrows stay valid. This eliminates a lot of Arc<...> wrapping for fork-join patterns.

Data races are statically impossible in safe Rust. The borrow checker plus Send / Sync together rule them out at compile time. You can still have logic races (two threads doing operations in unpredictable order) and deadlocks (two threads each waiting for the lock the other holds), but the memory-corruption / read-torn-bytes class of races is gone.

For CPU-bound work in parallel, the rayon crate gives you par_iter — every iterator adaptor you already know runs across a thread pool. For one-off concurrency, plain threads suffice. For lots of small concurrent I/O tasks, jump to async/await, covered next.`,
    code: `use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    let counter = Arc::new(Mutex::new(0));
    let mut handles = Vec::new();

    for _ in 0..4 {
        let c = Arc::clone(&counter);
        handles.push(thread::spawn(move || {
            let mut guard = c.lock().unwrap();
            *guard += 10;
        }));
    }
    for h in handles { h.join().unwrap(); }

    println!("{}", *counter.lock().unwrap());
}`,
    exercise: {
      prompt: `Spawn one thread that returns the value 42 from its closure. In main, .join() the handle and print the returned value.`,
      starter: `use std::thread;

fn main() {
    let handle = thread::spawn(|| {
        // return 42
        0
    });
    let v = handle.join().unwrap();
    println!("{v}");
}
`,
      expected: '42',
    },
    takeaways: [
      "thread::spawn takes a Send + 'static closure; returns a JoinHandle.",
      'Send: value can move between threads. Sync: &T can be shared between threads.',
      'Arc<Mutex<T>> is the canonical shared-mutable-state pattern across threads.',
      'Data races are compile-time impossible; deadlocks and logic races still happen.',
    ],
    mistakes: [
      'Capturing a borrowed reference into a spawned closure without scope — borrow checker stops you.',
      'Holding a Mutex guard across an .await — blocks the runtime; use tokio::sync::Mutex instead.',
      'Spawning a thread per task at scale — threads are expensive; use a pool (rayon) or async.',
    ],
    next: 'channels-and-mpsc',
  },
  {
    id: 'channels-and-mpsc',
    title: 'Ownership & Traits · Channels and mpsc',
    subtitle: 'Message passing with std::sync::mpsc, bounded vs unbounded, and the producer-consumer pattern.',
    intro: `Channels are the message-passing primitive in std. They let one thread (or many) send values to another without sharing memory directly — values move from sender to receiver, ownership crossing the thread boundary. "Do not communicate by sharing memory; share memory by communicating" applies here just as much as in Go.

std::sync::mpsc — multi-producer, single-consumer — is the built-in flavour. mpsc::channel() returns (Sender<T>, Receiver<T>). Clone the Sender to make many producers; the Receiver stays singular. Send with sender.send(value), receive with receiver.recv() (blocks until something arrives or every sender has been dropped) or receiver.try_recv() (returns immediately).

The values you send must implement Send. Channels are perfect for hand-off patterns where one side produces (network reads, file parses, simulation ticks) and another side consumes (writes results, renders, persists). Because values move, the sender cannot retain a reference after sending — that is how channels avoid data races even though both sides operate concurrently.

Receivers iterate with for value in receiver — yields values until every sender is dropped, then the loop ends. This is the clean way to drain a producer-consumer pipeline.

Bounded channels (mpsc::sync_channel(capacity)) block the sender when the buffer is full, which is how you implement backpressure — the producer slows down when consumers cannot keep up. Unbounded mpsc::channel() can grow without limit, which is faster but risks unbounded memory growth under load.

For more capability, the crossbeam crate has multi-producer / multi-consumer channels, select! across many channels, and lower overhead. async runtimes (tokio, async-std) ship their own channel implementations tuned for async tasks — std::sync::mpsc blocks the OS thread, which is wrong inside an async context.

A common pattern: a thread pool where one Receiver hands out jobs to N worker threads. Each worker holds a clone of an Arc<Receiver<Job>> wrapped in a Mutex (or uses crossbeam's mpmc which avoids the wrapping). Variations of this power web servers, simulation engines, and batch processors.

Closing the channel is automatic — drop every Sender clone and the Receiver loop ends. Drop the Receiver while Senders still exist and subsequent send() calls return Err. The type system surfaces these failures so they are hard to ignore.`,
    code: `use std::sync::mpsc;
use std::thread;

fn main() {
    let (tx, rx) = mpsc::channel::<i32>();

    for i in 1..=3 {
        let tx = tx.clone();
        thread::spawn(move || tx.send(i * 10).unwrap());
    }
    drop(tx);

    let mut total = 0;
    for value in rx {
        total += value;
    }
    println!("{total}");
}`,
    exercise: {
      prompt: `Create an mpsc channel, spawn one thread that sends 7 then drops the sender, and in main receive the value with rx.recv().unwrap() and print it.`,
      starter: `use std::sync::mpsc;
use std::thread;

fn main() {
    let (tx, rx) = mpsc::channel::<i32>();
    thread::spawn(move || {
        // send 7, then drop tx implicitly
    });
    let v = rx.recv().unwrap_or(0);
    println!("{v}");
}
`,
      expected: '7',
    },
    takeaways: [
      'Channels move values across thread boundaries — no shared memory needed.',
      'std::sync::mpsc: multi-producer, single-consumer; clone Sender for multiple producers.',
      'Bounded channels (sync_channel) implement backpressure; unbounded ones risk memory growth.',
      'for value in receiver drains until every Sender is dropped.',
    ],
    mistakes: [
      'Holding the original Sender alive forever — receiver loop never ends. Drop senders explicitly.',
      'Using std mpsc inside async code — blocks the runtime. Use tokio::sync::mpsc.',
      'Expecting send to be infallible — returns Err when the receiver is gone.',
    ],
    next: 'async-await-intro',
  },
  {
    id: 'async-await-intro',
    title: 'Ownership & Traits · Async/Await Intro',
    subtitle: 'Futures, runtimes, async fn, and why a single thread can serve thousands of connections.',
    intro: `Async Rust is a model for concurrency where the unit of work is a future — a state machine that can be polled to make progress, and that yields control whenever it would otherwise block. async fn body returns a future; await suspends until the inner future resolves. The cost of a suspended task is a few hundred bytes — orders of magnitude less than the 2 MiB of a thread stack — so a single OS thread can host tens of thousands of tasks.

A future does nothing on its own. It needs a runtime (an executor) to poll it. The standard choices are tokio (multi-threaded, the default for production), async-std (single API close to std), and smol (small embeddable). Add tokio = { version = "1", features = ["full"] } to Cargo.toml, mark your main with #[tokio::main] async fn main(), and you can await throughout.

await is not a system call. It is a compiler-generated state machine that pauses the function, hands control back to the runtime, and resumes when the awaited future signals readiness. The runtime owns the polling loop and the IO reactor (an epoll/kqueue/IOCP wrapper) that wakes futures when their data is ready. For I/O-heavy workloads — HTTP servers, database clients, web crawlers — async is dramatically more efficient than one-thread-per-request.

async fn returns an opaque type implementing Future<Output = T>. You cannot name it directly without -> impl Future<Output = T> or boxing it. For trait methods returning futures, the async_trait crate or the still-stabilising async fn in traits (now in stable Rust as of 1.75) handle the dyn dispatch.

Concurrency primitives. tokio::join!(a, b) polls two futures concurrently in the current task and returns both outputs once they are done. tokio::select! waits on multiple futures and races them — first to finish wins; the others are cancelled. tokio::spawn(future) hands the future to the runtime as a new task that runs on any worker thread.

CPU-bound work does not belong in async. await suspends on I/O readiness, not on CPU contention. If you need to compute for milliseconds, spawn a blocking thread (tokio::task::spawn_blocking) or push the computation to a rayon thread pool. Holding the runtime hostage with a tight CPU loop stalls every other task on that thread.

Send + 'static still applies — tasks spawned to the runtime move between worker threads, so their captures must be safe to ship. Mutexes inside async are tokio::sync::Mutex (futures-aware) rather than std::sync::Mutex (blocks the worker thread).

Async is a learning curve, but the payoff is exceptional throughput for network-heavy services. Start with the official tokio tutorial once the synchronous fundamentals from this course are solid.`,
    code: `// Compiles with tokio = { version = "1", features = ["full"] } in Cargo.toml.
//
// #[tokio::main]
// async fn main() {
//     let (a, b) = tokio::join!(
//         async { 1 + 2 },
//         async { 3 + 4 },
//     );
//     println!("{}", a + b);
// }

fn main() {
    let a = 1 + 2;
    let b = 3 + 4;
    println!("{}", a + b);
}`,
    exercise: {
      prompt: `No async runtime in the sandbox. Compute 4 + 6 and print the result — the same number you would get from tokio::join!(async { 4 }, async { 6 }) summed. Expected: 10.`,
      starter: `fn main() {
    // print 10
}
`,
      expected: '10',
    },
    takeaways: [
      'async fn returns a future; .await suspends until the future is ready.',
      'You need a runtime (tokio, async-std) to actually drive futures forward.',
      'tokio::join! runs futures concurrently in one task; tokio::spawn hands them to the runtime.',
      'Async is for I/O concurrency; CPU-bound work belongs in spawn_blocking or rayon.',
    ],
    mistakes: [
      'Calling an async fn without .await — you have a future, not a value. Compiler warns.',
      'Blocking inside async (std::thread::sleep, std::sync::Mutex) — stalls the worker thread.',
      'Forgetting Send bounds on spawned tasks — error: future is not Send.',
    ],
    next: { label: 'Algorithms: Two pointers', href: '#/learn/algorithms/two-pointers' },
  },
];

export const COURSES = {
  // ── Python ────────────────────────────────────────────────────────────
  'python-basics': {
    id: 'python-basics',
    title: 'Python Basics',
    language: 'python',
    color: '#3776AB',
    blurb: 'From print() to dicts and functions — the 6 things you need before any LeetCode.',
    estimatedHours: 2,
    externalResources: [
      { title: 'MIT OCW 6.0001 — Intro to CS & Programming in Python (Fall 2016)', url: 'https://ocw.mit.edu/courses/6-0001-introduction-to-computer-science-and-programming-in-python-fall-2016/', type: 'course' },
      { title: 'Python for Everybody (Coursera audit-free)', url: 'https://www.coursera.org/specializations/python', type: 'course' },
      { title: 'Real Python — tutorials index', url: 'https://realpython.com/', type: 'blog' },
    ],
    lessons: [
      {
        id: 'p1',
        title: '1. Variables & types',
        intro:
          'Python is dynamically typed: a variable is just a name pointing at a value. The four core scalar types you\'ll use daily are `int`, `float`, `str`, and `bool`. Reassigning a variable doesn\'t change its old value — it points the name at a new object. Use `type(x)` to inspect what something is.',
        code: 'x = 7\nname = "PGcode"\npi = 3.14159\nis_great = True\n\nprint(type(x), type(name), type(pi), type(is_great))',
        exercise: {
          prompt: 'Make `score` equal 95, `subject` equal "Math", then print them in the form `Math: 95`.',
          starter: '# write your code below\nscore = ...\nsubject = ...\nprint(...)\n',
          expected: 'Math: 95',
        },
        takeaways: [
          'Variables are names bound to objects; reassignment rebinds, not mutates.',
          'The four daily scalar types are int, float, str, and bool.',
          'Use type(x) when you are unsure what value a variable holds.',
          'f-strings (f"{var}") are the clearest way to interpolate.',
        ],
        mistakes: [
          'Confusing assignment (=) with equality comparison (==).',
          'Mixing int and str in concatenation: "Score: " + 95 raises TypeError — wrap in str().',
          'Assuming Python has type declarations like Java — it does not, but type hints are optional.',
        ],
        next: { label: 'Conditionals', href: '#/courses/python-basics/p2' },
      },
      {
        id: 'p2',
        title: '2. Conditionals',
        intro:
          '`if`/`elif`/`else` lets your code branch. Comparisons return booleans (`==`, `!=`, `<`, `>`, `<=`, `>=`). Combine them with `and`, `or`, `not`. Indentation defines the block — Python is strict about 4 spaces.',
        code:
          'temp = 72\nif temp >= 80:\n    print("hot")\nelif temp >= 60:\n    print("nice")\nelse:\n    print("cold")',
        exercise: {
          prompt: 'Given `age = 17`, print "minor" if age < 18 else "adult".',
          starter: 'age = 17\n# print "minor" or "adult"\n',
          expected: 'minor',
        },
        takeaways: [
          'if / elif / else picks one branch; comparisons return booleans.',
          'Combine conditions with and, or, not — not &&, ||, !.',
          'Indentation defines the block; 4 spaces is the convention.',
          'Ternary expression: value = a if cond else b.',
        ],
        mistakes: [
          'Using = instead of == inside an if — Python catches it for plain names but it fails inside walrus contexts.',
          'Mixing tabs and spaces in the same block raises IndentationError.',
          'Forgetting the colon at the end of if / elif / else lines.',
        ],
        next: { label: 'Loops', href: '#/courses/python-basics/p3' },
      },
      {
        id: 'p3',
        title: '3. Loops',
        intro:
          '`for x in iterable` walks any sequence (list, string, range). `while cond:` repeats until the condition is false. `range(n)` generates 0..n-1 lazily. `break` exits the loop; `continue` skips to the next iteration.',
        code:
          'total = 0\nfor i in range(1, 6):\n    total += i\nprint(total)  # 1+2+3+4+5 = 15',
        exercise: {
          prompt: 'Print the sum of even numbers from 1 to 10 (inclusive). Answer should be 30.',
          starter: 'total = 0\nfor i in range(1, 11):\n    # add only even numbers\n    pass\nprint(total)\n',
          expected: '30',
        },
        takeaways: [
          'for x in iterable walks lists, strings, ranges, generators — anything iterable.',
          'range(start, stop, step) is lazy; convert with list(range(...)) only when needed.',
          'break exits, continue skips to the next iteration.',
          'while loops repeat until the condition becomes false.',
        ],
        mistakes: [
          'Off-by-one with range — range(1, 10) does not include 10.',
          'Mutating a list while iterating it (use a copy or build a new list).',
          'Forgetting that for / else only fires when the loop completed without break.',
        ],
        next: { label: 'Lists', href: '#/courses/python-basics/p4' },
      },
      {
        id: 'p4',
        title: '4. Lists',
        intro:
          'Lists are ordered, mutable collections. Index with `lst[i]`, slice with `lst[a:b]`, append with `lst.append(x)`. Use `len(lst)` for length. Comprehensions like `[x*x for x in lst]` are the Pythonic way to map.',
        code:
          'nums = [3, 1, 4, 1, 5, 9, 2, 6]\nprint(nums[0], nums[-1])  # first, last\nprint(sorted(nums))\nsquares = [n*n for n in nums]\nprint(squares)',
        exercise: {
          prompt: 'Given the list `[5, 2, 9, 1, 7]`, print the maximum value.',
          starter: 'nums = [5, 2, 9, 1, 7]\n# print the max\n',
          expected: '9',
        },
        takeaways: [
          'Lists are mutable, ordered, and indexed from 0; negative indices count from the end.',
          'Slicing arr[a:b] is non-destructive; arr[:] makes a shallow copy.',
          'append (O(1) amortized), insert (O(n)), pop() (O(1)), pop(0) (O(n)).',
          'List comprehensions [expr for x in arr] beat manual loop+append for clarity.',
        ],
        mistakes: [
          'Using `is` to compare list contents — use ==.',
          'Aliasing: b = a does not copy; use a[:] or list(a) or copy.deepcopy for nested data.',
          'IndexError on empty lists — guard with `if arr:` first.',
        ],
        next: { label: 'Functions', href: '#/courses/python-basics/p5' },
      },
      {
        id: 'p5',
        title: '5. Functions',
        intro:
          'Define a function with `def`. Parameters can have defaults. `return` sends a value back. Functions are first-class — pass them around and return them. Docstrings (triple-quoted strings as the first line of a body) document behaviour.',
        code:
          'def greet(name, greeting="Hello"):\n    return f"{greeting}, {name}!"\n\nprint(greet("Asha"))\nprint(greet("Ben", greeting="Hi"))',
        exercise: {
          prompt: 'Define `square(n)` that returns n*n. Then print square(7).',
          starter: 'def square(n):\n    # return n*n\n    pass\n\nprint(square(7))\n',
          expected: '49',
        },
        takeaways: [
          'def declares a function; return sends a value back.',
          'Default args (def f(x=0)) are evaluated once at definition — never use a mutable default.',
          'Functions are first-class: assign them, pass them, return them.',
          '*args / **kwargs collect extra positional / keyword arguments.',
        ],
        mistakes: [
          'Mutable default arg trap: def f(xs=[]) shares the same list across calls.',
          'Forgetting `return` — Python returns None implicitly.',
          'Shadowing built-ins: naming a parameter `list` or `dict` hides the type.',
        ],
        next: { label: 'Dictionaries', href: '#/courses/python-basics/p6' },
      },
      {
        id: 'p6',
        title: '6. Dictionaries',
        intro:
          'Dicts are key→value maps with O(1) lookup. Build with `{}` or `dict()`. Access with `d[key]` (raises `KeyError` if missing) or `d.get(key, default)`. Iterate over keys, values, or items with `.keys()`, `.values()`, `.items()`. Hash maps are the most-used data structure in coding interviews.',
        code:
          'counts = {}\nfor ch in "mississippi":\n    counts[ch] = counts.get(ch, 0) + 1\nprint(counts)',
        exercise: {
          prompt: 'Given the list `["apple", "banana", "apple", "cherry", "banana", "apple"]`, build a dict of word → count and print it. Expected: `{\'apple\': 3, \'banana\': 2, \'cherry\': 1}`.',
          starter: 'words = ["apple", "banana", "apple", "cherry", "banana", "apple"]\ncounts = {}\n# count each word\n# print(counts)\n',
          expected: "{'apple': 3, 'banana': 2, 'cherry': 1}",
        },
        takeaways: [
          'Dicts are O(1) hash maps; keys must be hashable (immutable).',
          'd.get(k, default) avoids KeyError when the key may not exist.',
          'collections.defaultdict(int) is cleaner for counting.',
          'Iteration order is insertion order (guaranteed since Python 3.7).',
        ],
        mistakes: [
          'Using a mutable type (list, dict) as a key — raises TypeError: unhashable.',
          'd[k] raises KeyError if missing; prefer d.get(k) when absence is normal.',
          'Mutating a dict while iterating its keys raises RuntimeError.',
        ],
        next: { label: 'Strings', href: '#/courses/python-basics/p7' },
      },
      {
        id: 'p7',
        title: '7. Strings',
        intro:
          'Strings are immutable sequences. Slice with `s[a:b]`, search with `in`, split with `.split(sep)`, join with `sep.join(list)`. Use f-strings (`f"x = {x}"`) for interpolation. Common methods: `.lower()`, `.upper()`, `.strip()`, `.replace(a, b)`, `.startswith()`, `.endswith()`.',
        code:
          's = "  Hello, PGcode!  "\nprint(s.strip())\nprint(s.strip().lower())\nprint(",".join(["a", "b", "c"]))\nname = "Asha"\nprint(f"Hi, {name}!")',
        exercise: {
          prompt: 'Given `s = "the quick brown fox"`, print the word count (number of whitespace-separated tokens). Expected: `4`.',
          starter: 's = "the quick brown fox"\n# print the number of words\n',
          expected: '4',
        },
        takeaways: [
          'Strings are immutable — every method returns a new string.',
          'Slicing s[a:b:step] works just like list slicing.',
          'f-strings: f"x = {x:.2f}" supports format-spec for numbers and dates.',
          'Use "".join(parts) instead of repeated += in a loop (O(n) vs O(n²)).',
        ],
        mistakes: [
          'Trying to mutate s[0] = "x" — TypeError, strings are immutable.',
          'Forgetting that .split() without args splits on any whitespace; .split(" ") keeps empty tokens.',
          'Comparing strings with `is` instead of == (works for interned literals only by accident).',
        ],
        next: { label: 'Sets & tuples', href: '#/courses/python-basics/p8' },
      },
      {
        id: 'p8',
        title: '8. Sets & tuples',
        intro:
          'A `set` is an unordered collection with no duplicates and O(1) membership tests (`x in s`). Build with `{1, 2, 3}` or `set(iterable)`. Tuples (`(1, 2, 3)`) are immutable lists — hashable, so they can be dict keys or set elements.',
        code:
          'nums = [1, 2, 2, 3, 3, 3, 4]\nunique = set(nums)\nprint(sorted(unique))\nprint(3 in unique)\nprint(5 in unique)\npoint = (3, 4)\nprint(point[0], point[1])',
        exercise: {
          prompt: 'Given the list `[1, 1, 2, 3, 5, 5, 8, 13]`, print the number of distinct values. Expected: `6`.',
          starter: 'arr = [1, 1, 2, 3, 5, 5, 8, 13]\n# print the count of distinct values\n',
          expected: '6',
        },
        takeaways: [
          'set has O(1) membership; built from any iterable.',
          'Tuples are immutable lists — usable as dict keys and set elements.',
          'Set operations: a | b (union), a & b (intersection), a - b (difference).',
          'frozenset is the hashable, immutable cousin.',
        ],
        mistakes: [
          'Using {} for an empty set — that is an empty dict. Use set().',
          'Adding a list to a set: TypeError. Wrap with tuple() first.',
          'Relying on set iteration order — it is not guaranteed.',
        ],
        next: { label: 'List comprehensions', href: '#/courses/python-basics/p9' },
      },
      {
        id: 'p9',
        title: '9. List comprehensions',
        intro:
          'Comprehensions are Python\'s most loved feature. `[expr for x in iter if cond]` builds a new list. Set comprehensions use `{}`. Dict comprehensions: `{k: v for ... }`. They are typically faster than equivalent for-loops and read more like math.',
        code:
          'squares = [x*x for x in range(10)]\nevens = [x for x in squares if x % 2 == 0]\nprint(squares)\nprint(evens)\nlengths = {w: len(w) for w in ["red", "blue", "yellow"]}\nprint(lengths)',
        exercise: {
          prompt: 'Using a list comprehension, build a list of squares of even numbers from 1..10 inclusive. Print it. Expected: `[4, 16, 36, 64, 100]`.',
          starter: '# squares = [...]\nsquares = []\nprint(squares)\n',
          expected: '[4, 16, 36, 64, 100]',
        },
        takeaways: [
          '[expr for x in iter if cond] builds a new list.',
          'Set comprehensions use {}; dict comprehensions {k: v for ...}.',
          'Generator expressions (x for x in it) stream values without building a list.',
          'Comprehensions are typically faster than for-loop + append.',
        ],
        mistakes: [
          'Nesting too many for-clauses — past two levels readability suffers; use a real loop.',
          'Side-effects inside a comprehension (print, db writes) are anti-pattern.',
          'Confusing dict-vs-set literal: {x for x in it} is a set, {x: x for x in it} is a dict.',
        ],
        next: { label: 'Decorators', href: '#/courses/python-basics/p10' },
      },
      {
        id: 'p10',
        title: '10. Decorators',
        intro:
          'A decorator is a function that wraps another function to add behaviour without changing its body. `@decorator` above a `def` is sugar for `f = decorator(f)`. Common uses: logging, timing, caching, auth checks. Use `functools.wraps` to preserve the original function\'s name and docstring.',
        code:
          'from functools import wraps\n\ndef log_calls(fn):\n    @wraps(fn)\n    def wrapper(*args, **kwargs):\n        print(f"calling {fn.__name__}({args})")\n        return fn(*args, **kwargs)\n    return wrapper\n\n@log_calls\ndef add(a, b):\n    return a + b\n\nprint(add(2, 3))',
        exercise: {
          prompt: 'Write a `@double_result` decorator that doubles whatever its wrapped function returns. Apply it to `triple(n)` (which returns n*3). Print `triple(5)`. Expected: `30`.',
          starter: 'def double_result(fn):\n    # return a wrapper that calls fn and doubles the result\n    pass\n\n@double_result\ndef triple(n):\n    return n * 3\n\nprint(triple(5))\n',
          expected: '30',
        },
        takeaways: [
          'A decorator is a function that takes a function and returns a function.',
          '@deco above def f is shorthand for f = deco(f).',
          'functools.wraps preserves __name__ and __doc__ of the wrapped function.',
          'Decorators with arguments need an extra factory layer.',
        ],
        mistakes: [
          'Forgetting functools.wraps — debuggers show "wrapper" instead of the real name.',
          'Returning the call result instead of the wrapper function from the decorator.',
          'Capturing the wrong scope when stacking multiple decorators.',
        ],
        next: { label: 'Generators', href: '#/courses/python-basics/p11' },
      },
      {
        id: 'p11',
        title: '11. Generators',
        intro:
          'A generator function uses `yield` to produce values one at a time, lazily. It returns a generator object you iterate with `for x in gen` or `next(gen)`. Generators keep memory tiny when streaming large data. Generator expressions `(x*x for x in nums)` look like comprehensions but produce a generator instead of a list.',
        code:
          'def fib():\n    a, b = 0, 1\n    while True:\n        yield a\n        a, b = b, a + b\n\ngen = fib()\nfirst10 = [next(gen) for _ in range(10)]\nprint(first10)',
        exercise: {
          prompt: 'Write a generator `evens_up_to(n)` that yields all even numbers from 0 up to and including n. Use it to print `list(evens_up_to(10))`. Expected: `[0, 2, 4, 6, 8, 10]`.',
          starter: 'def evens_up_to(n):\n    # yield even numbers\n    pass\n\nprint(list(evens_up_to(10)))\n',
          expected: '[0, 2, 4, 6, 8, 10]',
        },
        takeaways: [
          'yield pauses the function and produces a value lazily.',
          'next(gen) drives one step at a time; for-loops do this automatically.',
          'Generator expressions (x*x for x in it) are memory-friendly.',
          'yield from delegates to another iterable cleanly.',
        ],
        mistakes: [
          'Treating a generator as a list — it is one-shot, exhausted after iteration.',
          'Forgetting that the body does not run until next() is called.',
          'Using return value in a generator — return inside yield-fns raises StopIteration.value.',
        ],
        next: { label: 'Async / await', href: '#/courses/python-basics/p12' },
      },
      {
        id: 'p12',
        title: '12. Async / await',
        intro:
          '`async def` declares a coroutine; calling it returns a coroutine object that must be awaited or scheduled. `await` suspends until the awaited coroutine resolves. `asyncio.gather(...)` runs many concurrently. Async shines for I/O-bound work (HTTP, DB, files) — not CPU-bound code, which still needs threads/processes.',
        code:
          'import asyncio\n\nasync def task(name, delay):\n    await asyncio.sleep(delay)\n    return f"{name} done after {delay}s"\n\nasync def main():\n    results = await asyncio.gather(\n        task("A", 0.1), task("B", 0.05), task("C", 0.02)\n    )\n    for r in results:\n        print(r)\n\nasyncio.run(main())',
        exercise: {
          prompt: 'Write `async def double(n)` that sleeps 0.01s then returns `n*2`. Use `asyncio.gather` to compute `double(1)`, `double(2)`, `double(3)` concurrently and print the sum. Expected: `12`.',
          starter: 'import asyncio\n\nasync def double(n):\n    # sleep 0.01 then return n*2\n    pass\n\nasync def main():\n    # gather three doubles and print sum\n    pass\n\nasyncio.run(main())\n',
          expected: '12',
        },
        takeaways: [
          'async def declares a coroutine; calling it returns a coroutine object that must be awaited.',
          'await pauses until the awaited coroutine resolves.',
          'asyncio.gather(*tasks) runs them concurrently and returns results in order.',
          'Async helps I/O-bound work; CPU-bound code still needs threads/processes.',
        ],
        mistakes: [
          'Calling time.sleep inside async code — blocks the event loop. Use asyncio.sleep.',
          'Forgetting to await a coroutine — it never runs, just creates an object.',
          'Running asyncio.run inside an already-running loop (e.g. Jupyter) — raises RuntimeError.',
        ],
        next: { label: 'Context managers', href: '#/courses/python-basics/p13' },
      },
      {
        id: 'p13',
        title: '13. Context managers',
        intro:
          '`with` blocks call `__enter__` on entry and `__exit__` on exit — even if an exception is raised. The classic use is `with open(path) as f:` so the file always closes. Build your own with a class implementing `__enter__`/`__exit__`, or with `@contextmanager` from `contextlib` for a generator-based shortcut.',
        code:
          'from contextlib import contextmanager\nimport time\n\n@contextmanager\ndef timer(label):\n    t0 = time.time()\n    yield\n    print(f"{label}: {(time.time()-t0)*1000:.1f}ms")\n\nwith timer("sum"):\n    total = sum(i*i for i in range(100_000))\nprint(total)',
        exercise: {
          prompt: 'Write a context manager `silent()` that suppresses any printed output inside its `with` block by temporarily replacing `sys.stdout` with `io.StringIO`. Use it to wrap a `print("hello")` call, then print "done" outside it. Expected output: `done`.',
          starter: 'import sys, io\nfrom contextlib import contextmanager\n\n@contextmanager\ndef silent():\n    # save sys.stdout, replace with StringIO, restore on exit\n    pass\n\nwith silent():\n    print("hello")\nprint("done")\n',
          expected: 'done',
        },
        takeaways: [
          'with calls __enter__ on entry, __exit__ on exit — even on exception.',
          '@contextmanager from contextlib turns a generator into a context manager.',
          'Use for resource lifecycle: files, locks, timers, transactions.',
          'contextlib.ExitStack composes multiple context managers dynamically.',
        ],
        mistakes: [
          'Forgetting to yield in a @contextmanager generator — silent breakage.',
          'Raising inside __enter__ leaves the resource un-cleaned (use a try in setup).',
          'Returning the manager instead of `with manager as x` and using x outside the block.',
        ],
        next: { label: 'Dataclasses', href: '#/courses/python-basics/p14' },
      },
      {
        id: 'p14',
        title: '14. Dataclasses',
        intro:
          '`@dataclass` auto-generates `__init__`, `__repr__`, and `__eq__` for a class whose body is mostly field declarations. It eliminates boilerplate for value types. Use `field(default_factory=list)` for mutable defaults. Add `frozen=True` to make instances immutable and hashable.',
        code:
          'from dataclasses import dataclass, field\n\n@dataclass\nclass Point:\n    x: int\n    y: int\n    tags: list = field(default_factory=list)\n\np = Point(3, 4, ["origin-adjacent"])\nprint(p)\nprint(p == Point(3, 4, ["origin-adjacent"]))',
        exercise: {
          prompt: 'Define a frozen dataclass `Book` with fields `title: str` and `pages: int`. Create two `Book("Dune", 412)` instances and print whether they\'re equal. Expected: `True`.',
          starter: 'from dataclasses import dataclass\n\n# define Book as a frozen dataclass\n\n# create two equal instances and print the equality result\n',
          expected: 'True',
        },
        takeaways: [
          '@dataclass auto-generates __init__, __repr__, __eq__ from field annotations.',
          'field(default_factory=list) avoids the mutable-default-arg trap.',
          'frozen=True makes instances hashable + immutable (usable as dict keys).',
          'slots=True (3.10+) shrinks memory and prevents new attribute creation.',
        ],
        mistakes: [
          'Using a mutable default directly: tags: list = [] — shares the list across instances.',
          'Annotating without an actual type (just `x:` with no type) — silently treated as a class var.',
          'Forgetting eq=False when you want identity comparison instead of value equality.',
        ],
        next: { label: 'Type hints in practice', href: '#/courses/python-basics/p15' },
      },
      {
        id: 'p15',
        title: '15. Type hints in practice',
        intro:
          'Type hints aren\'t enforced at runtime but power editors, mypy, and reduce bugs in big codebases. Use `list[int]`, `dict[str, int]`, `tuple[int, str]` (Python 3.9+). Compose with `|` for unions (`int | None`). Use `typing.Optional[T]`, `Callable[[int, int], int]`, `TypeAlias` for clarity. Pair with `mypy` or `pyright` for static checking.',
        code:
          'from typing import Callable\n\nNumber = int | float\n\ndef apply(fn: Callable[[Number], Number], xs: list[Number]) -> list[Number]:\n    return [fn(x) for x in xs]\n\nprint(apply(lambda x: x * 2, [1, 2.5, 3]))',
        exercise: {
          prompt: 'Write `def lengths(words: list[str]) -> dict[str, int]` that returns a dict mapping each word to its length. Print `lengths(["a", "bb", "ccc"])`. Expected: `{\'a\': 1, \'bb\': 2, \'ccc\': 3}`.',
          starter: '# add type hints\ndef lengths(words):\n    pass\n\nprint(lengths(["a", "bb", "ccc"]))\n',
          expected: "{'a': 1, 'bb': 2, 'ccc': 3}",
        },
        takeaways: [
          'Type hints are static metadata — Python does not enforce them at runtime.',
          'Modern syntax: list[int], dict[str, int], tuple[int, str] (3.9+); int | None (3.10+).',
          'typing.Callable, typing.Protocol, typing.TypeAlias model advanced shapes.',
          'Pair with mypy or pyright for static checking in CI.',
        ],
        mistakes: [
          'Believing type hints validate at runtime — they do not, you need pydantic or a checker.',
          'Using List[int] / Dict[str, int] (deprecated typing forms) instead of list[int] / dict[str, int].',
          'Forgetting to import Optional / Callable from typing.',
        ],
        next: { label: 'Dataclasses deep-dive', href: '#/courses/python-basics/p16' },
      },
      {
        id: 'p16',
        title: '16. Dataclasses deep-dive',
        intro:
          'Beyond the basic @dataclass: `field(init=False, repr=False)` controls each field individually, `__post_init__` runs after `__init__` for derived state, `kw_only=True` (3.10+) forbids positional args, and `slots=True` switches to __slots__ for ~30-40% memory savings. Pair with `typing.ClassVar[T]` to declare class-level constants the dataclass machinery should ignore. Compare equality is value-based by default — useful for snapshot tests.',
        code:
          'from dataclasses import dataclass, field\nfrom typing import ClassVar\n\n@dataclass(slots=True)\nclass Vector:\n    x: float\n    y: float\n    magnitude: float = field(init=False)\n    DIM: ClassVar[int] = 2\n\n    def __post_init__(self):\n        self.magnitude = (self.x ** 2 + self.y ** 2) ** 0.5\n\nv = Vector(3.0, 4.0)\nprint(v.magnitude, Vector.DIM)',
        exercise: {
          prompt: 'Define a dataclass `Circle` with field `radius: float`, a derived `area: float` set in `__post_init__` using 3.14159 * r * r, and an `__init__`-excluded field `units: str = "m²"`. Print `Circle(2.0).area` rounded to 2 decimals. Expected: `12.57`.',
          starter:
            'from dataclasses import dataclass, field\n\n@dataclass\nclass Circle:\n    radius: float\n    # area: float = field(init=False)\n    # units: str = field(default="m²")\n    # def __post_init__(self):\n    #     ...\n\nc = Circle(2.0)\nprint(round(c.area, 2))\n',
          expected: '12.57',
        },
        takeaways: [
          '__post_init__ runs after the generated __init__ — perfect for derived fields.',
          'field(init=False) excludes a field from __init__ and gives it a default value.',
          'slots=True shrinks memory but breaks multiple inheritance.',
          'ClassVar[T] marks a class-level constant the dataclass should not turn into a field.',
        ],
        mistakes: [
          'Mutating a frozen=True dataclass — raises FrozenInstanceError.',
          'Reordering fields so a non-default field follows a default field — TypeError at class creation.',
          'Forgetting field() when the default is a list/dict — shared mutable state across instances.',
        ],
        next: { label: 'Performance profiling', href: '#/courses/python-basics/p17' },
      },
      {
        id: 'p17',
        title: '17. Performance profiling',
        intro:
          'Measure before you optimize. `time.perf_counter()` is the right clock for wall-time deltas. `timeit.timeit(stmt, number=N)` runs a micro-benchmark with garbage-collection paused. `cProfile` profiles function-call counts and cumulative time; `pstats` formats the report. For memory, `tracemalloc.start(); snap = tracemalloc.take_snapshot()` shows the top allocators. The 80/20 rule applies: typically one or two hot lines dominate.',
        code:
          'import time\nimport timeit\n\nN = 100_000\nt0 = time.perf_counter()\ntotal = sum(i * i for i in range(N))\nprint(f"sum took {(time.perf_counter() - t0) * 1000:.2f} ms, total = {total}")\n\nlist_time = timeit.timeit("[x*x for x in range(1000)]", number=1000)\ngen_time = timeit.timeit("sum(x*x for x in range(1000))", number=1000)\nprint(f"list: {list_time:.3f}s, gen-sum: {gen_time:.3f}s")',
        exercise: {
          prompt: 'Use `time.perf_counter()` to measure how long `sum(range(100_000))` takes. Print the literal string `done` (timings vary per run, so we cannot match exact ms). Expected: `done`.',
          starter:
            'import time\nt0 = time.perf_counter()\n# compute sum(range(100_000))\nelapsed = time.perf_counter() - t0\n# print "done"\n',
          expected: 'done',
        },
        takeaways: [
          'time.perf_counter() is monotonic and the highest-resolution clock available.',
          'timeit pauses GC and runs many trials — best for micro-benchmarks.',
          'cProfile + pstats shows function-level cumulative time and call counts.',
          'tracemalloc identifies memory hot-spots without external tools.',
        ],
        mistakes: [
          'Using time.time() for benchmarks — it can run backwards on NTP adjustments.',
          'Benchmarking inside Jupyter without %timeit — the harness adds variance.',
          'Optimizing without a profiler — guessing the hot path is wrong more often than right.',
        ],
        next: { label: 'Algorithms: Two pointers', href: '#/learn/algorithms/two-pointers' },
      },
    ],
  },

  // ── JavaScript ───────────────────────────────────────────────────────
  'javascript-basics': {
    id: 'javascript-basics',
    title: 'JavaScript Basics',
    language: 'javascript',
    color: '#F7DF1E',
    blurb: 'The ES2020+ subset that covers 95% of frontend + LeetCode JS.',
    estimatedHours: 2,
    externalResources: [
      { title: 'javascript.info — Modern JavaScript Tutorial', url: 'https://javascript.info/', type: 'blog' },
      { title: 'MDN — Learn web development', url: 'https://developer.mozilla.org/en-US/docs/Learn', type: 'course' },
      { title: "You Don't Know JS (book series, GitHub free)", url: 'https://github.com/getify/You-Dont-Know-JS', type: 'book' },
    ],
    lessons: [
      {
        id: 'j1',
        title: '1. let, const & types',
        intro:
          'Modern JS uses `let` for variables that change and `const` for ones that don\'t. Avoid `var` — its scoping is confusing. The primitive types you\'ll use most are `number`, `string`, `boolean`, plus objects and arrays. `typeof x` tells you the type.',
        code:
          'const name = "PGcode";\nlet score = 42;\nscore += 8;\nconsole.log(name, score, typeof score);',
        exercise: {
          prompt: 'Declare `subject` as "Math" with const, `score` as 95 with let, then log them in `Math: 95` format.',
          starter: '// your code here\n',
          expected: 'Math: 95',
        },
        takeaways: [
          'const for values that never reassign; let for ones that do; avoid var.',
          'typeof returns a string like "number", "string", "object", "function".',
          'JS has dynamic typing — a variable can hold any type, any time.',
          'Numbers are 64-bit floats; use BigInt for integers above 2^53.',
        ],
        mistakes: [
          'Using var — function-scoped and hoisted, easy to misuse.',
          'Comparing with == — does coercion. Use === everywhere.',
          'Assuming `typeof null === "null"` — it is "object" (a long-standing bug).',
        ],
        next: { label: 'Conditionals', href: '#/courses/javascript-basics/j2' },
      },
      {
        id: 'j2',
        title: '2. Conditionals',
        intro:
          '`if`/`else if`/`else` work like most languages. Use `===` and `!==` (strict equality) — never `==` (it does coercion). Ternaries `cond ? a : b` are great for one-liners.',
        code:
          'const temp = 72;\nlet label;\nif (temp >= 80) label = "hot";\nelse if (temp >= 60) label = "nice";\nelse label = "cold";\nconsole.log(label);',
        exercise: {
          prompt: 'Given `age = 17`, print "minor" if age < 18 else "adult".',
          starter: 'const age = 17;\n// log "minor" or "adult"\n',
          expected: 'minor',
        },
        takeaways: [
          'Always use === / !== — never ==.',
          'Ternaries (cond ? a : b) are great for short branches.',
          'Falsy values: false, 0, "", null, undefined, NaN — everything else is truthy.',
          '?? gives a default only for null/undefined; || treats all falsy as missing.',
        ],
        mistakes: [
          '`if (x = 5)` is an assignment, not comparison — always truthy.',
          'Assuming 0 || x returns 0 — it does not, because 0 is falsy.',
          'Switch fall-through without a break statement (sometimes intended, often a bug).',
        ],
        next: { label: 'Loops & arrays', href: '#/courses/javascript-basics/j3' },
      },
      {
        id: 'j3',
        title: '3. Loops & arrays',
        intro:
          'Use `for (let i = 0; i < arr.length; i++)` for index-based loops, `for (const x of arr)` for value iteration. Arrays have `.map`, `.filter`, `.reduce`, `.forEach` — most algorithms become one-liners.',
        code:
          'const nums = [1, 2, 3, 4, 5];\nconst sum = nums.reduce((a, b) => a + b, 0);\nconst squares = nums.map(n => n * n);\nconsole.log(sum, squares.join(","));',
        exercise: {
          prompt: 'Print the sum of even numbers from 1 to 10. Expected: 30.',
          starter: 'let total = 0;\nfor (let i = 1; i <= 10; i++) {\n  // add only evens\n}\nconsole.log(total);\n',
          expected: '30',
        },
        takeaways: [
          'for...of iterates values; for...in iterates keys (rarely what you want on arrays).',
          'Array methods .map / .filter / .reduce are pure — they return new arrays.',
          'Spread (...) clones; Array.from(iter) turns an iterable into an array.',
          '.forEach has no return value; chain with .map when building data.',
        ],
        mistakes: [
          'for...in on an array — iterates string keys, includes inherited props.',
          'Mutating an array inside .map — return a new value instead.',
          'Off-by-one with arr.length: indices go 0..length-1.',
        ],
        next: { label: 'Functions & arrows', href: '#/courses/javascript-basics/j4' },
      },
      {
        id: 'j4',
        title: '4. Functions & arrows',
        intro:
          'Two forms: `function name(...)` (hoisted) and `const name = (...) => ...` (not hoisted). Arrows have no own `this` — they capture the enclosing one. Use default params for nice ergonomics.',
        code:
          'const square = n => n * n;\nfunction greet(name, greeting = "Hello") {\n  return `${greeting}, ${name}!`;\n}\nconsole.log(square(7));\nconsole.log(greet("Asha"));',
        exercise: {
          prompt: 'Define `factorial(n)` that returns n!. Print factorial(5). Expected: 120.',
          starter: 'function factorial(n) {\n  // compute n!\n}\nconsole.log(factorial(5));\n',
          expected: '120',
        },
        takeaways: [
          'function declarations are hoisted; const arrow assignments are not.',
          'Arrows have no own `this` — they inherit from the enclosing scope.',
          'Default params: function f(x = 10).',
          'Rest params: function f(...args) collects extras into an array.',
        ],
        mistakes: [
          'Using `this` inside an arrow expecting it to bind to the caller — it does not.',
          'Forgetting `return` in a multi-line arrow body — () => { x } returns undefined.',
          'Recursing on a named function expression and getting `f is not defined` after refactoring.',
        ],
        next: { label: 'Objects & destructuring', href: '#/courses/javascript-basics/j5' },
      },
      {
        id: 'j5',
        title: '5. Objects & destructuring',
        intro:
          'Objects map string keys to values. Use dot or bracket access. Destructure to pull fields out concisely. Spread (`...`) clones and merges.',
        code:
          'const user = { name: "Asha", age: 28, role: "dev" };\nconst { name, role } = user;\nconst updated = { ...user, age: 29 };\nconsole.log(name, role, updated.age);',
        exercise: {
          prompt: 'Given `{ a: 1, b: 2, c: 3 }`, log the sum of its values. Expected: 6.',
          starter: 'const obj = { a: 1, b: 2, c: 3 };\n// sum the values\n',
          expected: '6',
        },
        takeaways: [
          'Object.keys / values / entries iterate object data safely.',
          'Destructuring with renaming + defaults: const { x: a = 0 } = obj.',
          'Spread on objects shallow-copies and merges: { ...a, ...b }.',
          'Computed property keys: { [dynamicKey]: value }.',
        ],
        mistakes: [
          'Spread is shallow — nested objects still share references.',
          'Using objects as map-keys — keys become string "[object Object]".',
          'Forgetting that destructure-default only fires for `undefined`, not `null`.',
        ],
        next: { label: 'Map for counts', href: '#/courses/javascript-basics/j6' },
      },
      {
        id: 'j6',
        title: '6. Map for counts',
        intro:
          '`Map` is JS\'s hash map — keys can be any type, iteration order is insertion order. Use `map.get(k)`, `map.set(k, v)`, `map.has(k)`. The most common interview pattern: count-the-thing.',
        code:
          'const counts = new Map();\nfor (const ch of "mississippi") {\n  counts.set(ch, (counts.get(ch) || 0) + 1);\n}\nfor (const [k, v] of counts) console.log(k, v);',
        exercise: {
          prompt: 'Given `[1,2,2,3,3,3]`, log the count of 3. Expected: 3.',
          starter: 'const arr = [1,2,2,3,3,3];\nconst counts = new Map();\n// build counts then log the count of 3\n',
          expected: '3',
        },
        takeaways: [
          'Map keys can be any type, including objects and functions.',
          'Map preserves insertion order during iteration.',
          'map.get / set / has / delete are all O(1) amortized.',
          'Prefer Map over a plain object when keys are dynamic or non-string.',
        ],
        mistakes: [
          'Using `{}` as a hash map and tripping over inherited keys like __proto__.',
          'Calling map[key] — that does not work; use map.get(key).',
          'Forgetting that map.size is a property, not map.length or map.size().',
        ],
        next: { label: 'Strings & templates', href: '#/courses/javascript-basics/j7' },
      },
      {
        id: 'j7',
        title: '7. Strings & template literals',
        intro:
          'Strings are primitives but have methods via auto-boxing. Slice with `slice(a, b)`, find with `indexOf` / `includes`, split with `split(sep)`, join with `arr.join(sep)`. Template literals `` `Hi ${name}` `` are the modern way to interpolate. Strings are immutable — every method returns a new string.',
        code:
          'const s = "the quick brown fox";\nconsole.log(s.split(" ").length);\nconsole.log(s.toUpperCase());\nconst name = "Asha";\nconsole.log(`Hi, ${name}!`);',
        exercise: {
          prompt: 'Given `s = "hello world"`, log the string reversed. Expected: `dlrow olleh`.',
          starter: 'const s = "hello world";\n// log s reversed (hint: split, reverse, join)\n',
          expected: 'dlrow olleh',
        },
        takeaways: [
          'Strings are immutable primitives with method access via auto-boxing.',
          'Template literals (`Hi ${name}`) handle interpolation cleanly.',
          'Use String.raw for paths and regex sources to avoid escape hell.',
          'For unicode-aware iteration use [...str] or Array.from(str), not str.split("").',
        ],
        mistakes: [
          'split("") breaks surrogate-pair emoji and accented characters.',
          'Comparing strings with < / > works code-point-wise — not locale-aware.',
          'Reassigning s[0] silently no-ops in non-strict mode.',
        ],
        next: { label: 'Set & uniqueness', href: '#/courses/javascript-basics/j8' },
      },
      {
        id: 'j8',
        title: '8. Set & uniqueness',
        intro:
          '`Set` holds unique values, with O(1) `has`/`add`/`delete`. Build from an iterable: `new Set([1,1,2])`. Convert back to an array with `[...set]` or `Array.from(set)`. Great for dedup + membership.',
        code:
          'const arr = [1, 2, 2, 3, 3, 3, 4];\nconst unique = [...new Set(arr)];\nconsole.log(unique);\nconst seen = new Set();\nseen.add("a");\nconsole.log(seen.has("a"), seen.has("b"));',
        exercise: {
          prompt: 'Given `[1, 1, 2, 3, 5, 5, 8, 13]`, log the count of distinct values. Expected: 6.',
          starter: 'const arr = [1, 1, 2, 3, 5, 5, 8, 13];\n// log the distinct-count\n',
          expected: '6',
        },
        takeaways: [
          'Set holds unique values; has / add / delete are O(1).',
          'new Set(iterable) builds from any iterable in one line.',
          '[...set] or Array.from(set) converts back.',
          'Sets compare by reference for objects — { id: 1 } added twice still has size 2.',
        ],
        mistakes: [
          'Expecting object equality to deduplicate — Set uses reference equality.',
          'Calling set.length — it is set.size.',
          'Iterating with for...in (gives string keys, not values).',
        ],
        next: { label: 'Promises & async/await', href: '#/courses/javascript-basics/j9' },
      },
      {
        id: 'j9',
        title: '9. Promises & async/await',
        intro:
          'A Promise represents a future value. `async` functions implicitly return Promises; `await` pauses until a Promise resolves. Errors propagate through try/catch around `await`. Most modern APIs (`fetch`, `setTimeout` via wrappers) speak Promises.',
        code:
          'function delay(ms, value) {\n  return new Promise(resolve => setTimeout(() => resolve(value), ms));\n}\n(async () => {\n  const a = await delay(10, "hello");\n  const b = await delay(10, "world");\n  console.log(`${a} ${b}`);\n})();',
        exercise: {
          prompt: 'Use the `delay(ms, v)` helper to log "ready" after 10ms. Expected stdout: `ready`.',
          starter: 'function delay(ms, value) {\n  return new Promise(resolve => setTimeout(() => resolve(value), ms));\n}\n// write an async IIFE that awaits delay and logs the value\n',
          expected: 'ready',
        },
        takeaways: [
          'A Promise represents a future value; async functions return Promises.',
          'await pauses inside an async fn until the awaited Promise settles.',
          'Promise.all runs many in parallel; Promise.allSettled never short-circuits.',
          'Errors surface via try/catch around await or .catch on the chain.',
        ],
        mistakes: [
          'Forgetting await — you operate on the Promise object, not the value.',
          'Mixing .then chains with await without catching rejections.',
          'Awaiting inside a forEach — forEach ignores the returned promise; use for...of.',
        ],
        next: { label: 'JSON & string formats', href: '#/courses/javascript-basics/j10' },
      },
      {
        id: 'j10',
        title: '10. JSON & string formats',
        intro:
          'JSON is the lingua franca of web APIs. `JSON.stringify(obj)` serializes; `JSON.parse(str)` deserializes. Strings cannot represent functions, undefined, or circular references — only primitives, arrays, and plain objects.',
        code:
          'const user = { name: "Asha", age: 28, roles: ["dev", "admin"] };\nconst json = JSON.stringify(user);\nconsole.log(json);\nconst back = JSON.parse(json);\nconsole.log(back.name, back.roles.length);',
        exercise: {
          prompt: 'Given `JSON.parse(\'{"x":3,"y":4}\')`, log the sum x + y. Expected: 7.',
          starter: 'const o = JSON.parse(\'{"x":3,"y":4}\');\n// log o.x + o.y\n',
          expected: '7',
        },
        takeaways: [
          'JSON.stringify serializes only primitives, arrays, plain objects.',
          'JSON.parse throws on malformed input — wrap in try/catch.',
          'Use the replacer arg of stringify to redact secrets or skip fields.',
          'JSON.stringify(obj, null, 2) prints indented output for logs.',
        ],
        mistakes: [
          'Stringifying values containing Date — becomes a string, no reverse hydration.',
          'Trying to stringify circular references — throws TypeError.',
          'Trusting JSON.parse output shape without validation (use zod / yup in production).',
        ],
        next: { label: 'Map / filter / reduce', href: '#/courses/javascript-basics/j11' },
      },
      {
        id: 'j11',
        title: '11. Map, filter, reduce',
        intro:
          'The trio every JS interview tests. `map(fn)` transforms each element. `filter(pred)` keeps matching elements. `reduce(fn, init)` accumulates a single value. Each returns a new array — never mutates.',
        code:
          'const nums = [1, 2, 3, 4, 5, 6];\nconst doubled = nums.map(n => n * 2);\nconst evens = nums.filter(n => n % 2 === 0);\nconst sum = nums.reduce((a, b) => a + b, 0);\nconsole.log(doubled.join(","));\nconsole.log(evens.join(","));\nconsole.log(sum);',
        exercise: {
          prompt: 'Given `[1,2,3,4,5,6,7,8,9,10]`, log the sum of squares of even numbers. Expected: 220.',
          starter: 'const nums = [1,2,3,4,5,6,7,8,9,10];\n// chain filter().map().reduce()\n',
          expected: '220',
        },
        takeaways: [
          '.map transforms; .filter keeps; .reduce collapses to one value.',
          'Each call returns a new array — chain freely without mutating source.',
          'reduce takes (acc, x) => newAcc and an init value; the init makes types stable.',
          'Skip reduce when a simple for-loop reads more clearly.',
        ],
        mistakes: [
          'Forgetting the reducer init value on a possibly-empty array — TypeError.',
          'Returning undefined from .map by missing `return` in a block body.',
          'Chaining many maps when one would do — costs an allocation each.',
        ],
        next: { label: 'Closures', href: '#/courses/javascript-basics/j12' },
      },
      {
        id: 'j12',
        title: '12. Closures',
        intro:
          'A closure is a function plus the variables it captured from its outer scope. The captured variables stay alive even after the outer function returns. Closures power module patterns, currying, and most callbacks.',
        code:
          'function counter() {\n  let n = 0;\n  return () => ++n;\n}\nconst c = counter();\nconsole.log(c(), c(), c());',
        exercise: {
          prompt: 'Write `makeAdder(x)` that returns a function adding x to its argument. Log makeAdder(5)(3). Expected: 8.',
          starter: '// function makeAdder(x) { ... }\n// console.log(makeAdder(5)(3));\n',
          expected: '8',
        },
        takeaways: [
          'A closure captures variables from its enclosing lexical scope.',
          'Captured variables stay alive as long as the closure does.',
          'Powers currying, partial application, module patterns, callbacks.',
          'Each call to the outer function creates a fresh closure with its own captured state.',
        ],
        mistakes: [
          'Capturing `i` from a var-based loop — every closure sees the final value. Use let.',
          'Building memory leaks by holding closures over large data structures.',
          'Confusing closure scope with `this` binding — they are independent.',
        ],
        next: { label: 'Closures deep dive', href: '#/courses/javascript-basics/j13' },
      },
      {
        id: 'j13',
        title: '13. Closures deep dive',
        intro:
          'Lexical scope means a function remembers where it was *defined*, not where it was called. An IIFE `(function(){...})()` runs immediately and gives you a private scope. The classic interview trap: a `var` loop that captures the same `i` for every callback — `let` fixes it because it is block-scoped.',
        code:
          'const makeCounter = (function () {\n  let n = 0;\n  return { inc: () => ++n, get: () => n };\n})();\nmakeCounter.inc();\nmakeCounter.inc();\nconsole.log(makeCounter.get());',
        exercise: {
          prompt: 'Write `once(fn)` that returns a wrapper running `fn` only the first time and returning the cached result thereafter. Call it twice with `() => 42` and log both results space-separated. Expected: `42 42`.',
          starter: 'function once(fn) {\n  // capture called + result via closure\n}\nconst f = once(() => 42);\nconsole.log(f(), f());\n',
          expected: '42 42',
        },
        takeaways: [
          'Lexical scope binds to where a function is defined, not where it is called.',
          'IIFEs (function(){})() give you a private scope without polluting globals.',
          'Modules + IIFEs power the classic library wrapping pattern.',
          'Closures + memoization underpin React hooks, signals, and observables.',
        ],
        mistakes: [
          'Believing setTimeout inside a loop snapshots the var — only let / const do.',
          'Leaking large captures by reference — destructure smaller pieces if needed.',
          'Mixing `this` and closure scope — they answer different questions.',
        ],
        next: { label: 'Prototypes', href: '#/courses/javascript-basics/j14' },
      },
      {
        id: 'j14',
        title: '14. Prototypes & inheritance',
        intro:
          'Every JS object has a hidden `[[Prototype]]` link. Lookups walk that chain until they hit `null`. `Object.create(proto)` makes a new object with the given prototype. ES6 `class` is sugar over the same prototype machinery — no new inheritance model, just nicer syntax.',
        code:
          'class Animal {\n  constructor(name) { this.name = name; }\n  speak() { return `${this.name} makes a sound`; }\n}\nclass Dog extends Animal {\n  speak() { return `${this.name} barks`; }\n}\nconst d = new Dog("Rex");\nconsole.log(d.speak());\nconsole.log(d instanceof Animal);',
        exercise: {
          prompt: 'Using `Object.create`, build `proto = { greet() { return "hi " + this.name; } }` and an object `u` with `name: "Asha"` whose prototype is `proto`. Log `u.greet()`. Expected: `hi Asha`.',
          starter: 'const proto = { greet() { return "hi " + this.name; } };\n// const u = Object.create(...)\n// u.name = ...\n// console.log(u.greet());\n',
          expected: 'hi Asha',
        },
        takeaways: [
          'Every object has a [[Prototype]] reachable via Object.getPrototypeOf.',
          'Method lookups walk the prototype chain until they hit null.',
          'class extends Base is sugar over the prototype mechanism.',
          'Object.create(null) makes a truly empty dict with no inherited keys.',
        ],
        mistakes: [
          'Mutating Object.prototype — pollutes every object on the page.',
          'Forgetting super(args) inside a subclass constructor — ReferenceError on `this`.',
          'Assuming `instanceof` works across realms (iframes) — it does not.',
        ],
        next: { label: '`this` binding', href: '#/courses/javascript-basics/j15' },
      },
      {
        id: 'j15',
        title: '15. `this` binding',
        intro:
          'Four rules in priority order: `new` binds `this` to the new object; explicit `call`/`apply`/`bind` win next; implicit binding uses the object before the dot; otherwise `this` is `undefined` in strict mode (the global in sloppy). Arrow functions ignore all of this and capture `this` lexically — that is why they are the right choice inside `setTimeout` and `map` callbacks.',
        code:
          'const user = {\n  name: "Asha",\n  hi() { return `hi ${this.name}`; },\n};\nconst loose = user.hi;\nconst bound = user.hi.bind(user);\nconsole.log(user.hi());\nconsole.log(bound());\nconsole.log(user.hi.call({ name: "Ravi" }));',
        exercise: {
          prompt: 'Given `const obj = { x: 10, get() { return this.x; } }`, use `.call` to invoke `obj.get` with a `this` of `{ x: 99 }` and log the result. Expected: 99.',
          starter: 'const obj = { x: 10, get() { return this.x; } };\n// use obj.get.call(...) and log it\n',
          expected: '99',
        },
        takeaways: [
          'new > explicit (call/apply/bind) > implicit (obj.fn()) > default (undefined or global).',
          'Arrow functions lock in `this` lexically — perfect inside callbacks.',
          '.bind returns a new bound function; .call / .apply invoke immediately.',
          'Strict mode sets default `this` to undefined; sloppy mode uses global.',
        ],
        mistakes: [
          'Detaching a method: const f = obj.method; f() — `this` is lost.',
          'Using arrow methods on classes expecting `this` to bind — but then you cannot rebind.',
          'Calling .bind in render — creates a new function each call, defeating memoization.',
        ],
        next: { label: 'Error handling', href: '#/courses/javascript-basics/j16' },
      },
      {
        id: 'j16',
        title: '16. Error handling',
        intro:
          '`throw` accepts any value but always throw an `Error` (or subclass) so you get a stack. `try/catch/finally` runs the `finally` block whether or not it threw — perfect for cleanup. Built-in subclasses: `TypeError`, `RangeError`, `SyntaxError`. In async code, `await` rethrows the rejection so a single `try/catch` covers it.',
        code:
          'function divide(a, b) {\n  if (b === 0) throw new RangeError("divide by zero");\n  return a / b;\n}\ntry {\n  console.log(divide(10, 0));\n} catch (e) {\n  console.log(e.name + ": " + e.message);\n} finally {\n  console.log("done");\n}',
        exercise: {
          prompt: 'Wrap `JSON.parse("not json")` in try/catch and log "bad json" on failure. Expected: `bad json`.',
          starter: 'try {\n  // JSON.parse("not json")\n} catch (e) {\n  // log "bad json"\n}\n',
          expected: 'bad json',
        },
        takeaways: [
          'Always throw Error or a subclass — get a stack trace.',
          'finally runs no matter what — perfect for cleanup.',
          'await inside try/catch handles rejected promises naturally.',
          'Custom Error subclasses (class NotFoundError extends Error) clarify intent.',
        ],
        mistakes: [
          'Throwing strings or numbers — no stack, brittle for catch blocks.',
          'Empty catch blocks swallow bugs — log or rethrow.',
          'Forgetting that errors in setTimeout callbacks bypass surrounding try/catch.',
        ],
        next: { label: 'ES modules', href: '#/courses/javascript-basics/j17' },
      },
      {
        id: 'j17',
        title: '17. ES modules',
        intro:
          'ESM is the standard module system. `export default x` exports one value imported as any name; `export const foo` is a named export imported via `import { foo }`. `import "./styles.css"` is a side-effect import that runs the module for its effects only. Because imports are static, bundlers can tree-shake — drop named exports nothing imports.',
        code:
          '// math.js\n// export const add = (a, b) => a + b;\n// export default (a, b) => a * b;\n//\n// main.js\n// import multiply, { add } from "./math.js";\n// console.log(add(2, 3), multiply(2, 3));\nconsole.log("ESM is static + tree-shakeable");',
        exercise: {
          prompt: 'Simulate a module: define `add` and `mul` on an object `mod`, then destructure and log `add(2,3)` and `mul(2,3)` space-separated. Expected: `5 6`.',
          starter: 'const mod = {\n  add: (a, b) => a + b,\n  mul: (a, b) => a * b,\n};\n// const { add, mul } = mod;\n// console.log(add(2,3), mul(2,3));\n',
          expected: '5 6',
        },
        takeaways: [
          'ESM is the standard: import / export, statically analysed.',
          'Default export: one per module; named exports: many, by name.',
          'Side-effect imports run a module without binding any name.',
          'Tree-shaking drops unused named exports at build time.',
        ],
        mistakes: [
          'Mixing ESM and CommonJS in the same file — bundlers tolerate it, runtimes may not.',
          'Importing a default export by destructuring: import { default as x } is verbose; just import x.',
          'Forgetting the .js extension in browser ESM — required.',
        ],
        next: { label: 'TypeScript types & inference', href: '#/courses/typescript-basics/ts1' },
      },
    ],
  },

  // ── Java ─────────────────────────────────────────────────────────────
  'java-basics': {
    id: 'java-basics',
    title: 'Java Basics',
    language: 'java',
    color: '#E76F00',
    blurb: 'The Java you need for FAANG interview solutions: types, control flow, methods, collections.',
    estimatedHours: 2,
    externalResources: [
      { title: 'dev.java — Java tutorial (Oracle)', url: 'https://dev.java/learn/', type: 'course' },
      { title: 'Stanford CS106A Programming Methodology', url: 'https://see.stanford.edu/Course/CS106A', type: 'course' },
      { title: 'Baeldung — Java articles index', url: 'https://www.baeldung.com/java-tutorial', type: 'blog' },
    ],
    lessons: [
      {
        id: 'jv1',
        title: '1. Hello + types',
        intro:
          'Every Java program lives in a class. `main` is the entry point. The primitive types are `int`, `long`, `double`, `boolean`, `char`. `String` is an object. Variables must be declared with a type.',
        code:
          'public class Main {\n  public static void main(String[] args) {\n    int x = 7;\n    String name = "PGcode";\n    System.out.println(name + ": " + x);\n  }\n}',
        exercise: {
          prompt: 'Print `Math: 95` using a String `subject` and an int `score`.',
          starter:
            'public class Main {\n  public static void main(String[] args) {\n    // declare subject and score\n    // print "<subject>: <score>"\n  }\n}\n',
          expected: 'Math: 95',
        },
        takeaways: [
          'Every program lives in a class; main is the entry point.',
          'Primitives (int, long, double, boolean, char) hold values directly.',
          'String is a reference type; literals are interned.',
          'System.out.println auto-flushes a newline.',
        ],
        mistakes: [
          'Forgetting `public static` on main — JVM cannot find it.',
          'Treating String like a primitive — use .equals, not ==.',
          'Mixing int/long without an L suffix — silent overflow.',
        ],
        next: { label: 'Control flow', href: '#/courses/java-basics/jv2' },
      },
      {
        id: 'jv2',
        title: '2. Control flow',
        intro:
          '`if`/`else if`/`else`, plus `switch`. Use `==` only for primitives. For Strings use `.equals()`. Boolean operators: `&&`, `||`, `!`.',
        code:
          'public class Main {\n  public static void main(String[] args) {\n    int temp = 72;\n    String label = (temp >= 80) ? "hot" : (temp >= 60 ? "nice" : "cold");\n    System.out.println(label);\n  }\n}',
        exercise: {
          prompt: 'Print "minor" if age = 17 < 18 else "adult".',
          starter:
            'public class Main {\n  public static void main(String[] args) {\n    int age = 17;\n    // print appropriate label\n  }\n}\n',
          expected: 'minor',
        },
        takeaways: [
          'if / else if / else, plus switch (modern switch expressions in 14+).',
          'Use .equals for object equality; == compares references for objects.',
          'Logical operators: && and || short-circuit; & and | do not.',
          'Ternaries are fine for short branches.',
        ],
        mistakes: [
          'Using == for String — passes for interned literals, fails for new String("...").',
          'Forgetting a `break` in classic switch — fall-through.',
          'Assigning inside if: if (x = 5) — compile error in Java (unlike C).',
        ],
        next: { label: 'Methods + arrays', href: '#/courses/java-basics/jv3' },
      },
      {
        id: 'jv3',
        title: '3. Methods + arrays',
        intro:
          'Methods need an explicit return type. Arrays are fixed-size: `int[] arr = new int[5]`. `arr.length` (not `arr.length()`). Use `Arrays.toString(arr)` to print.',
        code:
          'import java.util.Arrays;\npublic class Main {\n  static int sum(int[] xs) { int s = 0; for (int x : xs) s += x; return s; }\n  public static void main(String[] args) {\n    int[] nums = {1, 2, 3, 4, 5};\n    System.out.println(sum(nums));\n    System.out.println(Arrays.toString(nums));\n  }\n}',
        exercise: {
          prompt: 'Compute sum of even numbers 1..10 and print 30.',
          starter:
            'public class Main {\n  public static void main(String[] args) {\n    int total = 0;\n    for (int i = 1; i <= 10; i++) {\n      // add only evens\n    }\n    System.out.println(total);\n  }\n}\n',
          expected: '30',
        },
        takeaways: [
          'Method signature: returnType name(paramType param, ...) — always declared explicitly.',
          'Arrays are fixed-size and length is a field, not a method.',
          'Enhanced-for (for (int x : arr)) walks values without an index.',
          'Arrays.toString / Arrays.deepToString print arrays sensibly.',
        ],
        mistakes: [
          'Calling arr.length() — it is arr.length (no parens).',
          'ArrayIndexOutOfBoundsException from off-by-one in loops.',
          'Returning a primitive from a method declared to return its wrapper — auto-unboxing surprises.',
        ],
        next: { label: 'HashMap', href: '#/courses/java-basics/jv4' },
      },
      {
        id: 'jv4',
        title: '4. HashMap',
        intro:
          '`HashMap<K, V>` is Java\'s hash table. `put`, `get`, `containsKey`. `getOrDefault(key, default)` is your friend for counting. Don\'t forget the import.',
        code:
          'import java.util.HashMap;\nimport java.util.Map;\npublic class Main {\n  public static void main(String[] args) {\n    Map<Character, Integer> counts = new HashMap<>();\n    for (char ch : "mississippi".toCharArray()) {\n      counts.put(ch, counts.getOrDefault(ch, 0) + 1);\n    }\n    System.out.println(counts);\n  }\n}',
        exercise: {
          prompt: 'Build a count of [1,2,2,3,3,3] and print the count of 3. Expected: 3.',
          starter:
            'import java.util.HashMap;\nimport java.util.Map;\npublic class Main {\n  public static void main(String[] args) {\n    int[] arr = {1, 2, 2, 3, 3, 3};\n    Map<Integer, Integer> counts = new HashMap<>();\n    // count, then print counts.get(3)\n  }\n}\n',
          expected: '3',
        },
        takeaways: [
          'HashMap<K, V> is O(1) average; null keys / values allowed.',
          'getOrDefault(key, default) avoids manual containsKey checks.',
          'putIfAbsent / computeIfAbsent enable concise lazy-init patterns.',
          'Iteration order is undefined — use LinkedHashMap for insertion order.',
        ],
        mistakes: [
          'Concurrent modification: iterating + put() throws ConcurrentModificationException.',
          'Storing primitives directly — autoboxing turns them into Integer (slower, more memory).',
          'Assuming TreeMap-style ordering — HashMap is unordered.',
        ],
        next: { label: 'ArrayList', href: '#/courses/java-basics/jv5' },
      },
      {
        id: 'jv5',
        title: '5. ArrayList',
        intro:
          '`ArrayList<T>` is Java\'s dynamic array. `add`, `get(i)`, `size()`, `set(i, x)`. Iterate with enhanced-for: `for (Integer x : list)`. Use `List.of(1, 2, 3)` for immutable factory.',
        code:
          'import java.util.ArrayList;\nimport java.util.List;\npublic class Main {\n  public static void main(String[] args) {\n    List<Integer> nums = new ArrayList<>(List.of(1, 2, 3, 4));\n    nums.add(5);\n    int sum = 0;\n    for (int x : nums) sum += x;\n    System.out.println(sum);\n  }\n}',
        exercise: {
          prompt: 'Build an ArrayList of evens from 2 to 10 (inclusive) and print its size. Expected: 5.',
          starter:
            'import java.util.ArrayList;\npublic class Main {\n  public static void main(String[] args) {\n    ArrayList<Integer> evens = new ArrayList<>();\n    // populate evens\n    System.out.println(evens.size());\n  }\n}\n',
          expected: '5',
        },
        takeaways: [
          'ArrayList<T> wraps a resizing array — O(1) amortized add, O(n) middle insert.',
          'Use List.of for immutable small literals; new ArrayList<>(...) when you need to mutate.',
          'size() (not length); use get(i) and set(i, v) for index access.',
          'Iterate with enhanced-for; remove safely via Iterator.remove().',
        ],
        mistakes: [
          'Modifying a List.of(...) — throws UnsupportedOperationException.',
          'Calling .length on an ArrayList — it is .size().',
          'Forgetting that subList shares storage with the original list.',
        ],
        next: { label: 'Strings', href: '#/courses/java-basics/jv6' },
      },
      {
        id: 'jv6',
        title: '6. Strings',
        intro:
          'Strings are immutable in Java. Common ops: `.length()`, `.charAt(i)`, `.substring(a, b)`, `.split(regex)`, `.toLowerCase()`, `.trim()`. Build long strings with `StringBuilder` (mutable, O(1) append) — concatenating `String` in a loop is O(n²).',
        code:
          'public class Main {\n  public static void main(String[] args) {\n    String s = "  Hello, PGcode!  ";\n    System.out.println(s.trim().toLowerCase());\n    StringBuilder sb = new StringBuilder();\n    for (int i = 0; i < 5; i++) sb.append("ab");\n    System.out.println(sb);\n  }\n}',
        exercise: {
          prompt: 'Given `String s = "the quick brown fox";`, print the word count (split on space). Expected: 4.',
          starter:
            'public class Main {\n  public static void main(String[] args) {\n    String s = "the quick brown fox";\n    // print number of words\n  }\n}\n',
          expected: '4',
        },
        takeaways: [
          'String is immutable — every method returns a new instance.',
          'StringBuilder gives O(1) amortized append for hot loops.',
          '.split takes a regex; escape special chars or use Pattern.quote.',
          'String.format / String.join cover most formatting needs.',
        ],
        mistakes: [
          'Concatenating in a loop with + — produces O(n²) garbage.',
          'split(".") matches everything because . is a regex meta-character.',
          'Comparing string content with == — passes for literals, fails for `new String`.',
        ],
        next: { label: 'Collections framework', href: '#/courses/java-basics/jv7' },
      },
      {
        id: 'jv7',
        title: '7. Collections framework',
        intro:
          'The Java Collections Framework gives you `List`, `Set`, `Queue`, `Deque`, `Map` interfaces with multiple implementations. Pick by ordering and performance needs: `ArrayList` for indexed access, `LinkedList`/`ArrayDeque` for queues, `HashSet` for fast membership, `TreeMap`/`TreeSet` for sorted keys, `PriorityQueue` for heap operations. `Collections.sort`, `Collections.reverse`, `Collections.unmodifiableList` are the common utilities.',
        code:
          'import java.util.*;\npublic class Main {\n  public static void main(String[] args) {\n    PriorityQueue<Integer> pq = new PriorityQueue<>();\n    for (int x : new int[]{5, 2, 9, 1, 7}) pq.offer(x);\n    StringBuilder out = new StringBuilder();\n    while (!pq.isEmpty()) { out.append(pq.poll()).append(\' \'); }\n    System.out.println(out.toString().trim());\n  }\n}',
        exercise: {
          prompt: 'Use a `TreeSet<Integer>` to deduplicate `{4, 1, 3, 1, 4, 2}` and print the elements in ascending order separated by spaces. Expected: `1 2 3 4`.',
          starter:
            'import java.util.*;\npublic class Main {\n  public static void main(String[] args) {\n    int[] arr = {4, 1, 3, 1, 4, 2};\n    // dedupe with TreeSet and print elements separated by spaces\n  }\n}\n',
          expected: '1 2 3 4',
        },
        takeaways: [
          'Interfaces (List, Set, Queue, Map) describe contracts; pick an impl by trade-off.',
          'ArrayDeque is the modern Queue / Deque (avoid old Stack and LinkedList).',
          'PriorityQueue is a binary heap; pass a Comparator for custom order.',
          'TreeMap / TreeSet keep keys sorted — useful for range queries.',
        ],
        mistakes: [
          'Choosing LinkedList for indexed access — get(i) is O(n).',
          'Using HashSet but expecting iteration order to be stable.',
          'Comparing wrapper Integers with == across boxing — fails outside [-128, 127].',
        ],
        next: { label: 'Streams', href: '#/courses/java-basics/jv8' },
      },
      {
        id: 'jv8',
        title: '8. Streams',
        intro:
          'The Streams API (Java 8+) gives you a functional pipeline over collections. `.stream()`, then transform with `.map`, `.filter`, `.sorted`, `.distinct`, terminate with `.collect`, `.count`, `.reduce`, `.forEach`. Streams are lazy: nothing runs until the terminal operation. Use `mapToInt` / `sum` for primitive performance.',
        code:
          'import java.util.*;\nimport java.util.stream.*;\npublic class Main {\n  public static void main(String[] args) {\n    int sumOfSquaresOfEvens = IntStream.rangeClosed(1, 10)\n        .filter(n -> n % 2 == 0)\n        .map(n -> n * n)\n        .sum();\n    System.out.println(sumOfSquaresOfEvens);\n  }\n}',
        exercise: {
          prompt: 'Given the list `[3, 1, 4, 1, 5, 9, 2, 6]`, use a Stream to count distinct values greater than 2 and print the result. Expected: `5`.',
          starter:
            'import java.util.*;\nimport java.util.stream.*;\npublic class Main {\n  public static void main(String[] args) {\n    List<Integer> nums = List.of(3, 1, 4, 1, 5, 9, 2, 6);\n    // count distinct values > 2 using streams, then print\n  }\n}\n',
          expected: '5',
        },
        takeaways: [
          'Streams are lazy: nothing runs until a terminal op (collect/count/sum/reduce).',
          'Use IntStream / LongStream / DoubleStream for primitive perf.',
          'collect with Collectors.toList / toMap / groupingBy is the typical sink.',
          'Stream pipelines are one-shot — they cannot be reused.',
        ],
        mistakes: [
          'Reusing a stream after a terminal op — IllegalStateException.',
          'Calling .parallel() on tiny work — overhead dominates.',
          'Mixing stateful side-effects with stream ops — order is not guaranteed.',
        ],
        next: { label: 'Optional', href: '#/courses/java-basics/jv9' },
      },
      {
        id: 'jv9',
        title: '9. Optional',
        intro:
          '`Optional<T>` is the type-safe alternative to returning null. Build with `Optional.of(x)`, `Optional.empty()`, `Optional.ofNullable(maybe)`. Consume with `.isPresent()`, `.ifPresent(c)`, `.orElse(default)`, `.map(fn)`, `.flatMap(fn)`. Never call `.get()` without first checking presence — it throws if empty.',
        code:
          'import java.util.*;\npublic class Main {\n  static Optional<Integer> firstEven(int[] xs) {\n    for (int x : xs) if (x % 2 == 0) return Optional.of(x);\n    return Optional.empty();\n  }\n  public static void main(String[] args) {\n    System.out.println(firstEven(new int[]{1, 3, 4, 6}).orElse(-1));\n    System.out.println(firstEven(new int[]{1, 3, 5}).orElse(-1));\n  }\n}',
        exercise: {
          prompt: 'Write `Optional<Integer> maxOf(int[] xs)` that returns the max or `Optional.empty()` for an empty array. Print `maxOf(new int[]{3,9,5}).orElse(-1)`. Expected: `9`.',
          starter:
            'import java.util.*;\npublic class Main {\n  static Optional<Integer> maxOf(int[] xs) {\n    // return max wrapped in Optional, or empty\n    return Optional.empty();\n  }\n  public static void main(String[] args) {\n    System.out.println(maxOf(new int[]{3,9,5}).orElse(-1));\n  }\n}\n',
          expected: '9',
        },
        takeaways: [
          'Optional<T> models "value or absence" without nulls.',
          'orElse / orElseGet / orElseThrow each cover a different fallback strategy.',
          'map / flatMap chain transformations without explicit null checks.',
          'Never store Optional as a field — designed for return types only.',
        ],
        mistakes: [
          'Calling .get() without isPresent — throws NoSuchElementException.',
          'Using Optional.of(null) — throws NPE; use ofNullable.',
          'Returning Optional<List<T>> — usually return an empty list instead.',
        ],
        next: { label: 'Concurrency basics', href: '#/courses/java-basics/jv10' },
      },
      {
        id: 'jv10',
        title: '10. Concurrency basics',
        intro:
          'Modern Java concurrency is built on the `ExecutorService` + `Future` model. Don\'t `new Thread()` manually. Create a pool with `Executors.newFixedThreadPool(n)`, submit `Callable<T>` tasks, collect `Future<T>` results. Always shut the pool down (`.shutdown()` + `.awaitTermination(...)`). Use `CompletableFuture` for composition (`.thenApply`, `.thenCombine`).',
        code:
          'import java.util.concurrent.*;\npublic class Main {\n  public static void main(String[] args) throws Exception {\n    ExecutorService pool = Executors.newFixedThreadPool(3);\n    Future<Integer> a = pool.submit(() -> 1 + 2);\n    Future<Integer> b = pool.submit(() -> 4 + 5);\n    Future<Integer> c = pool.submit(() -> 10);\n    System.out.println(a.get() + b.get() + c.get());\n    pool.shutdown();\n  }\n}',
        exercise: {
          prompt: 'Use a fixed thread pool of 2 to submit two `Callable<Integer>` tasks: one returning `42`, one returning `8`. Print their sum. Expected: `50`.',
          starter:
            'import java.util.concurrent.*;\npublic class Main {\n  public static void main(String[] args) throws Exception {\n    ExecutorService pool = Executors.newFixedThreadPool(2);\n    // submit two tasks, get results, print sum, shutdown\n  }\n}\n',
          expected: '50',
        },
        takeaways: [
          'ExecutorService manages a thread pool — never `new Thread()` manually.',
          'submit returns Future<T>; .get() blocks until the task completes.',
          'CompletableFuture composes async ops with .thenApply / .thenCombine.',
          'Always shut the pool down with shutdown + awaitTermination.',
        ],
        mistakes: [
          'Forgetting shutdown — JVM hangs waiting for non-daemon threads.',
          'Sharing mutable state across pool threads without synchronization.',
          'Calling .get() with no timeout — risks indefinite blocking.',
        ],
        next: { label: 'Generics deep-dive', href: '#/courses/java-basics/jv11' },
      },
      {
        id: 'jv11',
        title: '11. Generics deep-dive',
        intro:
          'Generics let one class/method work over many types with compile-time safety. `class Box<T>` is parameterized; `<T extends Comparable<T>>` constrains. Wildcards: `List<? extends Number>` (read-only producer), `List<? super Integer>` (write consumer) — PECS: Producer Extends, Consumer Super. Type erasure means generics vanish at runtime; you can\'t do `new T[]` directly.',
        code:
          'import java.util.*;\npublic class Main {\n  static <T extends Comparable<T>> T maxOf(List<T> xs) {\n    T best = xs.get(0);\n    for (T x : xs) if (x.compareTo(best) > 0) best = x;\n    return best;\n  }\n  public static void main(String[] args) {\n    System.out.println(maxOf(List.of(3, 9, 5, 1)));\n    System.out.println(maxOf(List.of("pear", "apple", "kiwi")));\n  }\n}',
        exercise: {
          prompt: 'Write a generic `<T> List<T> reverse(List<T> xs)` that returns a new list in reverse order. Print `reverse(List.of(1,2,3))`. Expected: `[3, 2, 1]`.',
          starter:
            'import java.util.*;\npublic class Main {\n  static <T> List<T> reverse(List<T> xs) {\n    // build and return reversed list\n    return new ArrayList<>();\n  }\n  public static void main(String[] args) {\n    System.out.println(reverse(List.of(1,2,3)));\n  }\n}\n',
          expected: '[3, 2, 1]',
        },
        takeaways: [
          'Generics give compile-time type safety with zero runtime cost (erasure).',
          '<T extends Comparable<T>> constrains T to types you can compare.',
          'PECS: Producer Extends, Consumer Super for wildcard usage.',
          'You cannot create T[] or `instanceof T` due to type erasure.',
        ],
        mistakes: [
          'Raw types (List instead of List<T>) — defeats type safety.',
          'Mixing <? extends T> and writes — wildcards are read-only producers.',
          'Forgetting that arrays are covariant but generics are invariant.',
        ],
        next: { label: 'Lambda expressions', href: '#/courses/java-basics/jv12' },
      },
      {
        id: 'jv12',
        title: '12. Lambda expressions',
        intro:
          'Lambdas are concise instances of functional interfaces — interfaces with one abstract method. Syntax: `(params) -> expr` or `(params) -> { ...; return v; }`. The compiler matches them to `Runnable`, `Comparator<T>`, `Function<T, R>`, `Predicate<T>`, `Consumer<T>`, `Supplier<T>`, etc. Method references (`String::length`, `System.out::println`) are even tighter. Lambdas capture effectively-final variables; you cannot reassign captured locals.',
        code:
          'import java.util.*;\nimport java.util.function.*;\npublic class Main {\n  public static void main(String[] args) {\n    Function<Integer, Integer> square = x -> x * x;\n    Predicate<Integer> isPos = n -> n > 0;\n    Comparator<String> byLen = Comparator.comparingInt(String::length);\n\n    System.out.println(square.apply(7));\n    System.out.println(isPos.test(-3));\n    List<String> words = new ArrayList<>(List.of("a", "ccc", "bb"));\n    words.sort(byLen);\n    System.out.println(words);\n  }\n}',
        exercise: {
          prompt: 'Use a `BinaryOperator<Integer>` lambda that multiplies its two inputs, then call `.apply(6, 7)` and print the result. Expected: `42`.',
          starter:
            'import java.util.function.*;\npublic class Main {\n  public static void main(String[] args) {\n    BinaryOperator<Integer> mul = null; // replace with lambda\n    // System.out.println(mul.apply(6, 7));\n  }\n}\n',
          expected: '42',
        },
        takeaways: [
          'A lambda is a typed instance of a functional interface.',
          'Method references (Class::method) are shorthand for forwarding lambdas.',
          'Captured locals must be effectively final.',
          'Common types: Function, Predicate, Consumer, Supplier, BiFunction.',
        ],
        mistakes: [
          'Modifying a captured local — compile error.',
          'Using `this` inside a lambda expecting enclosing-class binding — it does what you think (lexical), unlike anonymous inner classes.',
          'Forgetting to import java.util.function.*.',
        ],
        next: { label: 'Streams parallelism', href: '#/courses/java-basics/jv13' },
      },
      {
        id: 'jv13',
        title: '13. Streams parallelism',
        intro:
          'Add `.parallel()` to a stream and the work is split across the common ForkJoinPool. This is great for CPU-bound work over large collections where the operations are stateless and associative. It is NOT a free win — overhead, ordering, and shared state can erase gains or introduce subtle bugs. Use `reduce(identity, op)` with associative ops; avoid `forEach` for ordered output (use `forEachOrdered`).',
        code:
          'import java.util.stream.*;\npublic class Main {\n  public static void main(String[] args) {\n    long total = IntStream.rangeClosed(1, 1_000_000).parallel()\n        .filter(n -> n % 2 == 0)\n        .mapToLong(n -> (long) n * n)\n        .sum();\n    System.out.println(total);\n  }\n}',
        exercise: {
          prompt: 'Use a parallel `IntStream.rangeClosed(1, 10)` to compute the sum of squares (1+4+9+...+100). Print the result. Expected: `385`.',
          starter:
            'import java.util.stream.*;\npublic class Main {\n  public static void main(String[] args) {\n    // parallel sum of squares 1..10\n  }\n}\n',
          expected: '385',
        },
        takeaways: [
          '.parallel() splits work across the common ForkJoinPool.',
          'Operations should be stateless, side-effect-free, and associative.',
          'Use reduce(identity, op) for safe combination.',
          'Parallelism pays off only beyond a few thousand elements of CPU work.',
        ],
        mistakes: [
          'Mutating shared state inside a parallel stream — race conditions.',
          'Using forEach when ordered output matters — use forEachOrdered.',
          'Calling .parallel() on small data — overhead beats any speed-up.',
        ],
        next: { label: 'Algorithms: Sorting', href: '#/learn/algorithms/heap-sort' },
      },
    ],
  },

  // ── React ────────────────────────────────────────────────────────────
  'react-basics': {
    id: 'react-basics',
    title: 'React Basics',
    language: 'javascript',
    color: '#61dafb',
    blurb: 'Components, JSX, props vs state, events, controlled forms, lists & keys. Five lessons to get you productive.',
    estimatedHours: 1.5,
    externalResources: [
      { title: 'react.dev — Learn React', url: 'https://react.dev/learn', type: 'course' },
      { title: 'Kent C. Dodds blog', url: 'https://kentcdodds.com/blog', type: 'blog' },
      { title: 'Epic React (Kent C. Dodds, free intro)', url: 'https://www.epicreact.dev/', type: 'course' },
    ],
    lessons: REACT_LESSONS,
  },

  // ── TypeScript ───────────────────────────────────────────────────────
  'typescript-basics': {
    id: 'typescript-basics',
    title: 'TypeScript Basics',
    language: 'typescript',
    color: '#3178c6',
    blurb: 'Types, interfaces, unions, generics — the typed JS subset that catches half your bugs at compile time.',
    estimatedHours: 2,
    externalResources: [
      { title: 'TypeScript Handbook', url: 'https://www.typescriptlang.org/docs/handbook/intro.html', type: 'book' },
      { title: 'type-challenges', url: 'https://github.com/type-challenges/type-challenges', type: 'repo' },
      { title: 'Total TypeScript (Matt Pocock) — free essentials', url: 'https://www.totaltypescript.com/tutorials/typescript-essentials', type: 'course' },
    ],
    lessons: TS_LESSONS,
  },

  // ── Go ───────────────────────────────────────────────────────────────
  'go-basics': {
    id: 'go-basics',
    title: 'Go',
    language: 'go',
    color: '#00add8',
    blurb: 'Concurrency-first language for servers and tooling. 20 lessons across Foundations and Concurrency & Stdlib.',
    estimatedHours: 4,
    externalResources: [
      { title: 'A Tour of Go', url: 'https://go.dev/tour/welcome/1', type: 'course' },
      { title: 'Go by Example', url: 'https://gobyexample.com/', type: 'blog' },
      { title: 'Effective Go', url: 'https://go.dev/doc/effective_go', type: 'book' },
      { title: 'The Go Programming Language (Donovan, Kernighan)', url: 'https://www.gopl.io/', type: 'book' },
    ],
    lessons: GO_LESSONS,
  },

  // ── Node.js ──────────────────────────────────────────────────────────
  'node-basics': {
    id: 'node-basics',
    title: 'Node.js Basics',
    language: 'javascript',
    color: '#3c873a',
    blurb: 'Node from V8 to production HTTP servers. 32 lessons across Foundations, Async & I/O, and HTTP & APIs.',
    estimatedHours: 6,
    externalResources: [
      { title: 'Node.js official docs', url: 'https://nodejs.org/api/', type: 'book' },
      { title: 'Node.js Design Patterns (Casciaro, Mammino)', url: 'https://www.nodejsdesignpatterns.com/', type: 'book' },
      { title: 'libuv design overview', url: 'https://docs.libuv.org/en/v1.x/design.html', type: 'blog' },
      { title: 'Express docs', url: 'https://expressjs.com/', type: 'book' },
    ],
    lessons: NODE_LESSONS,
  },

  // ── SQL ──────────────────────────────────────────────────────────────
  'sql-basics': {
    id: 'sql-basics',
    title: 'SQL Basics',
    language: 'sql',
    color: '#0075a8',
    blurb: 'From SELECT to query plans. 30 lessons across Foundations, Joins & Aggregation, and Performance & Schema.',
    estimatedHours: 5,
    externalResources: [
      { title: 'Use The Index, Luke!', url: 'https://use-the-index-luke.com/', type: 'book' },
      { title: 'PostgreSQL official docs', url: 'https://www.postgresql.org/docs/current/', type: 'book' },
      { title: 'Mode Analytics — SQL tutorial', url: 'https://mode.com/sql-tutorial/', type: 'course' },
      { title: 'Markus Winand — Modern SQL', url: 'https://modern-sql.com/', type: 'blog' },
    ],
    lessons: SQL_LESSONS,
  },

  // ── C++ ──────────────────────────────────────────────────────────────
  'cpp-basics': {
    id: 'cpp-basics',
    title: 'C++ Basics',
    language: 'cpp',
    color: '#00599C',
    blurb: 'Modern C++17 essentials: types, control flow, vectors, unordered_map.',
    estimatedHours: 2,
    externalResources: [
      { title: 'learncpp.com — Modern C++ tutorial', url: 'https://www.learncpp.com/', type: 'book' },
      { title: 'cppreference', url: 'https://en.cppreference.com/w/', type: 'book' },
      { title: 'The Cherno — Modern C++ YT series', url: 'https://www.youtube.com/c/TheChernoProject', type: 'video' },
    ],
    lessons: [
      {
        id: 'cpp1',
        title: '1. Hello + types',
        intro:
          'Every C++ program needs `main()`. Use `#include <iostream>` for I/O and `using namespace std;` to skip prefixes. Common types: `int`, `long long`, `double`, `bool`, `string` (from `<string>`).',
        code:
          '#include <iostream>\n#include <string>\nusing namespace std;\nint main() {\n  int x = 7;\n  string name = "PGcode";\n  cout << name << ": " << x << endl;\n}',
        exercise: {
          prompt: 'Print `Math: 95` using a string `subject` and an int `score`.',
          starter:
            '#include <iostream>\n#include <string>\nusing namespace std;\nint main() {\n  // your code here\n}\n',
          expected: 'Math: 95',
        },
        takeaways: [
          'Every program has int main() returning 0 on success.',
          '#include pulls in headers; <iostream> + <string> are the daily-driver pair.',
          'cout << x << endl writes one item per <<; endl flushes.',
          'Use long long for 64-bit ints; double for floating point.',
        ],
        mistakes: [
          'Forgetting #include <string> — the literal "..." is a const char* without it.',
          'Mixing <<: cout << "a" + "b" tries to add two const char* — undefined.',
          'Returning from main without 0 — most compilers default it, but be explicit.',
        ],
        next: { label: 'Control flow', href: '#/courses/cpp-basics/cpp2' },
      },
      {
        id: 'cpp2',
        title: '2. Control flow',
        intro:
          '`if`/`else if`/`else`, plus ternary `cond ? a : b`. `==` works for both primitives and `std::string`. Boolean operators: `&&`, `||`, `!`.',
        code:
          '#include <iostream>\nusing namespace std;\nint main() {\n  int temp = 72;\n  cout << (temp >= 80 ? "hot" : (temp >= 60 ? "nice" : "cold")) << endl;\n}',
        exercise: {
          prompt: 'Print "minor" if age = 17 < 18 else "adult".',
          starter:
            '#include <iostream>\nusing namespace std;\nint main() {\n  int age = 17;\n  // print appropriate label\n}\n',
          expected: 'minor',
        },
        takeaways: [
          'if / else if / else; switch needs break unless using [[fallthrough]].',
          '== works for std::string (member operator); &&, ||, ! for logical ops.',
          'Ternary cond ? a : b is an expression, useful in initializations.',
          'C++17 `if (auto x = expr; cond)` scopes x to the if/else block.',
        ],
        mistakes: [
          'Comparing C-style char* with == — compares pointers; use strcmp or std::string.',
          'Switch fall-through without [[fallthrough]] — warning, sometimes a bug.',
          'Assignment vs equality: if (x = 5) compiles, always true — enable -Wall.',
        ],
        next: { label: 'Vectors + loops', href: '#/courses/cpp-basics/cpp3' },
      },
      {
        id: 'cpp3',
        title: '3. Vectors + loops',
        intro:
          '`std::vector<T>` is the go-to dynamic array. `push_back`, `size()`, index with `[]`. Range-based for: `for (int x : v)`. Algorithm header has sort, etc.',
        code:
          '#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\nint main() {\n  vector<int> nums = {3, 1, 4, 1, 5};\n  sort(nums.begin(), nums.end());\n  int sum = 0;\n  for (int x : nums) sum += x;\n  cout << sum << endl;\n}',
        exercise: {
          prompt: 'Sum the evens from 1..10. Print 30.',
          starter:
            '#include <iostream>\nusing namespace std;\nint main() {\n  int total = 0;\n  for (int i = 1; i <= 10; i++) {\n    // add only evens\n  }\n  cout << total << endl;\n}\n',
          expected: '30',
        },
        takeaways: [
          'std::vector<T> is the default dynamic array — contiguous, cache-friendly.',
          'push_back amortizes O(1); reserve(n) preallocates to skip reallocations.',
          'Range-based for: for (auto& x : v) iterates by reference.',
          'size() returns size_t (unsigned) — beware comparing with int.',
        ],
        mistakes: [
          'Iterating with int i; i < v.size() — signed/unsigned compare warning.',
          'Holding iterators across push_back — invalidates on reallocation.',
          'Calling v[i] past the end — undefined behaviour; use .at(i) for bounds check.',
        ],
        next: { label: 'unordered_map', href: '#/courses/cpp-basics/cpp4' },
      },
      {
        id: 'cpp4',
        title: '4. unordered_map',
        intro:
          '`std::unordered_map<K, V>` is the hash table. Insert with `m[key] = v`; query with `m[key]` (default-constructs missing keys to zero — convenient for counts).',
        code:
          '#include <iostream>\n#include <unordered_map>\n#include <string>\nusing namespace std;\nint main() {\n  unordered_map<char, int> counts;\n  for (char ch : string("mississippi")) counts[ch]++;\n  cout << "m=" << counts[\'m\'] << " i=" << counts[\'i\'] << " s=" << counts[\'s\'] << " p=" << counts[\'p\'] << endl;\n}',
        exercise: {
          prompt: 'Build a count of [1,2,2,3,3,3] and print the count of 3.',
          starter:
            '#include <iostream>\n#include <unordered_map>\n#include <vector>\nusing namespace std;\nint main() {\n  vector<int> arr = {1, 2, 2, 3, 3, 3};\n  unordered_map<int, int> counts;\n  // count, then cout << counts[3]\n}\n',
          expected: '3',
        },
        takeaways: [
          'unordered_map is hashed, O(1) average; map is a red-black tree, O(log n) and sorted.',
          'm[k] default-constructs missing keys — convenient for counters.',
          'Use m.find(k) when you must distinguish missing from zero.',
          'Iteration order of unordered_map is unspecified.',
        ],
        mistakes: [
          'Calling m[k] in a const context — does not compile (modifies the map).',
          'Storing pointers into the map and relying on them after rehash — invalidated.',
          'Using a non-hashable struct as key without a std::hash specialization.',
        ],
        next: { label: 'Strings', href: '#/courses/cpp-basics/cpp5' },
      },
      {
        id: 'cpp5',
        title: '5. Strings',
        intro:
          '`std::string` (from `<string>`) is mutable, with `+`/`+=` concatenation, `.length()`, `.substr(pos, n)`, indexing via `s[i]`. `std::getline(cin, s)` reads a whole line. For splits or fancy ops, you typically reach for `<sstream>` (`std::stringstream`).',
        code:
          '#include <iostream>\n#include <sstream>\n#include <string>\nusing namespace std;\nint main() {\n  string s = "the quick brown fox";\n  stringstream ss(s);\n  string word; int n = 0;\n  while (ss >> word) n++;\n  cout << n << endl;\n}',
        exercise: {
          prompt: 'Given `string s = "hello world";`, print its length. Expected: 11.',
          starter:
            '#include <iostream>\n#include <string>\nusing namespace std;\nint main() {\n  string s = "hello world";\n  // print s.length()\n}\n',
          expected: '11',
        },
        takeaways: [
          'std::string owns its data and grows automatically.',
          '.size() and .length() are equivalent; both O(1).',
          'std::stringstream is the idiomatic way to split or parse formatted text.',
          'string_view (C++17) is a non-owning view — cheaper for read-only params.',
        ],
        mistakes: [
          'Mixing C-string functions (strlen, strcpy) with std::string — convert with .c_str().',
          'Returning a string_view of a local — dangling reference.',
          'Building strings with += inside a hot loop — fine for small N, costly for big N (reserve!).',
        ],
        next: { label: 'Sort & algorithms', href: '#/courses/cpp-basics/cpp6' },
      },
      {
        id: 'cpp6',
        title: '6. Sort & algorithms',
        intro:
          '`<algorithm>` is full of one-liners: `sort(begin, end)`, `reverse`, `max_element`, `accumulate` (from `<numeric>`). Pass a custom comparator: `sort(v.begin(), v.end(), greater<int>())` for descending. These are how interview C++ stays terse.',
        code:
          '#include <iostream>\n#include <vector>\n#include <algorithm>\n#include <numeric>\nusing namespace std;\nint main() {\n  vector<int> v = {3, 1, 4, 1, 5, 9, 2, 6};\n  sort(v.begin(), v.end());\n  cout << "min=" << v.front() << " max=" << v.back() << endl;\n  cout << "sum=" << accumulate(v.begin(), v.end(), 0) << endl;\n}',
        exercise: {
          prompt: 'Sort {5, 2, 9, 1, 7} ascending and print the second-smallest element. Expected: 2.',
          starter:
            '#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\nint main() {\n  vector<int> v = {5, 2, 9, 1, 7};\n  // sort and print v[1]\n}\n',
          expected: '2',
        },
        takeaways: [
          '<algorithm> works on iterator ranges (begin(), end()).',
          'sort is O(n log n) (intro-sort); stable_sort keeps equal-element order.',
          'accumulate (from <numeric>) folds with a binary op + init value.',
          'Custom comparators: pass a lambda or a function-object.',
        ],
        mistakes: [
          'Forgetting accumulate is in <numeric>, not <algorithm>.',
          'Passing accumulate an int init when summing long long — overflow.',
          'Comparator that returns true for equal items — strict weak ordering violated, UB.',
        ],
        next: { label: 'Smart pointers', href: '#/courses/cpp-basics/cpp7' },
      },
      {
        id: 'cpp7',
        title: '7. Smart pointers',
        intro:
          'Avoid raw `new`/`delete`. `std::unique_ptr<T>` owns its object exclusively and frees it on scope exit. `std::shared_ptr<T>` shares ownership via a ref-count. Create with `std::make_unique<T>(args...)` / `std::make_shared<T>(args...)`. Use `.get()` only when you need a raw pointer for legacy APIs.',
        code:
          '#include <iostream>\n#include <memory>\nusing namespace std;\nstruct Node { int v; Node(int x):v(x){ cout << "alloc " << v << endl; } ~Node(){ cout << "free " << v << endl; } };\nint main() {\n  auto p = make_unique<Node>(7);\n  cout << p->v << endl;\n  // p goes out of scope, Node is freed automatically\n}',
        exercise: {
          prompt: 'Create a `unique_ptr<int>` holding the value 42 using `make_unique`, then print the dereferenced value. Expected: `42`.',
          starter:
            '#include <iostream>\n#include <memory>\nusing namespace std;\nint main() {\n  // create unique_ptr<int> with value 42 and print *p\n}\n',
          expected: '42',
        },
        takeaways: [
          'unique_ptr is the default — sole owner, zero overhead vs raw pointer.',
          'shared_ptr ref-counts; useful when ownership is genuinely shared.',
          'Prefer make_unique / make_shared over `new` for exception safety.',
          'Pass smart pointers by const reference when you only need to use the object.',
        ],
        mistakes: [
          'Creating two shared_ptr from the same raw pointer — double-free.',
          'Cyclic shared_ptr — leak; break with weak_ptr.',
          'Storing unique_ptr in a STL container that copies — moves only; use emplace.',
        ],
        next: { label: 'Move semantics', href: '#/courses/cpp-basics/cpp8' },
      },
      {
        id: 'cpp8',
        title: '8. Move semantics',
        intro:
          'Move semantics let you transfer ownership of resources without a deep copy. `std::move(x)` casts to an rvalue, signalling "you can steal from me." A move constructor `T(T&&) noexcept` takes the resource and leaves the source empty. Standard containers (`vector`, `string`, `unique_ptr`) already implement moves — passing by value into a function then doing `member = std::move(arg)` is the idiomatic way to absorb a parameter.',
        code:
          '#include <iostream>\n#include <vector>\n#include <string>\nusing namespace std;\nint main() {\n  vector<string> a = {"a", "b", "c"};\n  vector<string> b = std::move(a); // moves contents, leaves a empty\n  cout << "a.size=" << a.size() << " b.size=" << b.size() << endl;\n}',
        exercise: {
          prompt: 'Move a `string s = "hello"` into a new string `t` using `std::move`. Print `t.length()` and `s.length()` (in that order, space-separated). Expected: `5 0`.',
          starter:
            '#include <iostream>\n#include <string>\nusing namespace std;\nint main() {\n  string s = "hello";\n  // move s into t, print "<t.len> <s.len>"\n}\n',
          expected: '5 0',
        },
        takeaways: [
          'std::move casts to rvalue — it does not actually move anything.',
          'Move constructors steal resources and leave the source valid but unspecified.',
          'Rule of zero: prefer types that need no custom destructor/copy/move.',
          'Pass-by-value + std::move(arg) is the idiomatic absorb-parameter pattern.',
        ],
        mistakes: [
          'Using a moved-from object — works for std::string but assume nothing.',
          'std::move on a const — silently no-ops, surprising performance regression.',
          'Returning std::move(x) at the end of a function — disables copy-elision (RVO).',
        ],
        next: { label: 'Templates', href: '#/courses/cpp-basics/cpp9' },
      },
      {
        id: 'cpp9',
        title: '9. Templates',
        intro:
          'Templates are how C++ does generics — instantiated at compile time, zero runtime overhead. `template<typename T> T max3(T a, T b, T c)` accepts any comparable type. Class templates: `template<class T> struct Box { T value; };`. Constrain with concepts (C++20): `template<std::integral T>`. Use `auto` for return-type deduction when the body is straightforward.',
        code:
          '#include <iostream>\n#include <string>\nusing namespace std;\ntemplate<typename T>\nT maxOf(T a, T b) { return a > b ? a : b; }\nint main() {\n  cout << maxOf(3, 7) << endl;\n  cout << maxOf(2.5, 1.2) << endl;\n  cout << maxOf(string("apple"), string("pear")) << endl;\n}',
        exercise: {
          prompt: 'Write a `template<typename T> T sum(T a, T b, T c)` returning a + b + c. Print `sum(1, 2, 3)`. Expected: `6`.',
          starter:
            '#include <iostream>\nusing namespace std;\n// add template<typename T> T sum(T a, T b, T c);\nint main() {\n  cout << sum(1, 2, 3) << endl;\n}\n',
          expected: '6',
        },
        takeaways: [
          'Templates instantiate at compile time — zero runtime overhead.',
          'template<typename T> and template<class T> are interchangeable.',
          'C++20 concepts (std::integral, std::regular) constrain template parameters.',
          'Template code must live in headers (or .ipp) — the compiler needs the body.',
        ],
        mistakes: [
          'Placing template definitions in a .cpp — linker errors on use.',
          'Long, opaque template error messages — use concepts to fail earlier.',
          'Mixing template types: sum<int>(1, 2L) — explicit specialization confuses deduction.',
        ],
        next: { label: 'STL algorithms + lambdas', href: '#/courses/cpp-basics/cpp10' },
      },
      {
        id: 'cpp10',
        title: '10. STL algorithms + lambdas',
        intro:
          '`<algorithm>` works on iterator ranges (`v.begin(), v.end()`) and pairs beautifully with lambdas. `count_if`, `find_if`, `transform`, `all_of`, `any_of`, `for_each`. Lambda syntax: `[capture](params) { body }` — capture by value `[=]`, by reference `[&]`, or specific (`[x, &y]`). Returns are deduced; specify with `-> T` if needed.',
        code:
          '#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\nint main() {\n  vector<int> v = {1, 2, 3, 4, 5, 6, 7, 8};\n  int evens = count_if(v.begin(), v.end(), [](int x) { return x % 2 == 0; });\n  cout << evens << endl;\n}',
        exercise: {
          prompt: 'Given `vector<int> v = {3, 1, 4, 1, 5, 9, 2, 6};`, use `count_if` with a lambda to count elements greater than 3. Print the result. Expected: `4`.',
          starter:
            '#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\nint main() {\n  vector<int> v = {3, 1, 4, 1, 5, 9, 2, 6};\n  // count elements > 3 with count_if + lambda, print result\n}\n',
          expected: '4',
        },
        takeaways: [
          'Lambdas: [capture](params) -> ret { body }; capture by value [=] or reference [&].',
          '<algorithm> + lambda turns most loops into one-liners.',
          'Generic lambdas (C++14): auto params let one lambda handle multiple types.',
          'std::function<R(Args...)> stores any callable but with allocation overhead.',
        ],
        mistakes: [
          'Capturing by reference and storing the lambda past the captured scope — dangling.',
          'Using auto for the result of count_if (it is iterator-based; this one returns difference_type).',
          'Lambdas with state in [&] modifying counters that were meant local.',
        ],
        next: { label: 'Algorithms: Two pointers', href: '#/learn/algorithms/two-pointers' },
      },
    ],
  },

  // ── Rust ─────────────────────────────────────────────────────────────
  'rust-basics': {
    id: 'rust-basics',
    title: 'Rust',
    language: 'rust',
    color: '#dea584',
    blurb: 'Ownership, borrowing, traits — the Rust mental model. 20 lessons across Foundations and Ownership, Lifetimes, Traits.',
    estimatedHours: 5,
    externalResources: [
      { title: 'The Rust Book', url: 'https://doc.rust-lang.org/book/', type: 'book' },
      { title: 'Rustlings — exercises', url: 'https://github.com/rust-lang/rustlings', type: 'repo' },
      { title: 'Rust By Example', url: 'https://doc.rust-lang.org/rust-by-example/', type: 'blog' },
      { title: 'Tokio tutorial', url: 'https://tokio.rs/tokio/tutorial', type: 'course' },
    ],
    lessons: RUST_LESSONS,
  },

};

// Surface metadata for the courses index (cards).
export const COURSE_CARDS = [
  {
    id: 'sql-usda',
    title: 'SQL Project: USDA Production',
    language: 'sql',
    color: '#0075a8',
    blurb: 'Real-world SQL project mirroring the UC Davis Coursera final. 8 graded questions covering JOINs, CTEs, window functions.',
    href: '#/playground/sql/usda',
    lessonCount: 8,
    estimatedHours: 2,
  },
  {
    id: 'python-basics',
    title: COURSES['python-basics'].title,
    language: 'python',
    color: COURSES['python-basics'].color,
    blurb: COURSES['python-basics'].blurb,
    href: '#/courses/python-basics',
    lessonCount: COURSES['python-basics'].lessons.length,
    estimatedHours: 3,
  },
  {
    id: 'javascript-basics',
    title: COURSES['javascript-basics'].title,
    language: 'javascript',
    color: COURSES['javascript-basics'].color,
    blurb: COURSES['javascript-basics'].blurb,
    href: '#/courses/javascript-basics',
    lessonCount: COURSES['javascript-basics'].lessons.length,
    estimatedHours: 3,
  },
  {
    id: 'react-basics',
    title: COURSES['react-basics'].title,
    language: 'javascript',
    color: COURSES['react-basics'].color,
    blurb: COURSES['react-basics'].blurb,
    href: '#/courses/react-basics',
    lessonCount: COURSES['react-basics'].lessons.length,
    estimatedHours: COURSES['react-basics'].estimatedHours,
  },
  {
    id: 'java-basics',
    title: COURSES['java-basics'].title,
    language: 'java',
    color: COURSES['java-basics'].color,
    blurb: COURSES['java-basics'].blurb,
    href: '#/courses/java-basics',
    lessonCount: COURSES['java-basics'].lessons.length,
    estimatedHours: 2,
  },
  {
    id: 'cpp-basics',
    title: COURSES['cpp-basics'].title,
    language: 'cpp',
    color: COURSES['cpp-basics'].color,
    blurb: COURSES['cpp-basics'].blurb,
    href: '#/courses/cpp-basics',
    lessonCount: COURSES['cpp-basics'].lessons.length,
    estimatedHours: 2,
  },
  {
    id: 'typescript-basics',
    title: COURSES['typescript-basics'].title,
    language: 'typescript',
    color: COURSES['typescript-basics'].color,
    blurb: COURSES['typescript-basics'].blurb,
    href: '#/courses/typescript-basics',
    lessonCount: COURSES['typescript-basics'].lessons.length,
    estimatedHours: COURSES['typescript-basics'].estimatedHours,
  },
  {
    id: 'go-basics',
    title: COURSES['go-basics'].title,
    language: 'go',
    color: COURSES['go-basics'].color,
    blurb: COURSES['go-basics'].blurb,
    href: '#/courses/go-basics',
    lessonCount: COURSES['go-basics'].lessons.length,
    estimatedHours: COURSES['go-basics'].estimatedHours,
  },
  {
    id: 'rust-basics',
    title: COURSES['rust-basics'].title,
    language: 'rust',
    color: COURSES['rust-basics'].color,
    blurb: COURSES['rust-basics'].blurb,
    href: '#/courses/rust-basics',
    lessonCount: COURSES['rust-basics'].lessons.length,
    estimatedHours: COURSES['rust-basics'].estimatedHours,
  },
  {
    id: 'node-basics',
    title: COURSES['node-basics'].title,
    language: 'javascript',
    color: COURSES['node-basics'].color,
    blurb: COURSES['node-basics'].blurb,
    href: '#/courses/node-basics',
    lessonCount: COURSES['node-basics'].lessons.length,
    estimatedHours: COURSES['node-basics'].estimatedHours,
  },
  {
    id: 'sql-basics',
    title: COURSES['sql-basics'].title,
    language: 'sql',
    color: COURSES['sql-basics'].color,
    blurb: COURSES['sql-basics'].blurb,
    href: '#/courses/sql-basics',
    lessonCount: COURSES['sql-basics'].lessons.length,
    estimatedHours: COURSES['sql-basics'].estimatedHours,
  },
];
