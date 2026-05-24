const t=[{id:"r1",title:"1. Components & JSX",intro:"A React component is a function returning JSX — XML-like syntax that compiles to `React.createElement` calls. Each component is a self-contained UI building block. The root render mounts the tree.",code:`// In a real app this lives in App.jsx and uses ReactDOM.render.
function Greeting({ name }) {
  return \`Hello, \${name}!\`;
}
console.log(Greeting({ name: "PGcode" }));`,exercise:{prompt:'Write a `Hello(props)` function returning the string `Hi, <props.name>!`. Log Hello({ name: "Asha" }). Expected: Hi, Asha!',starter:`// function Hello(props) { ... }
// console.log(Hello({ name: "Asha" }));
`,expected:"Hi, Asha!"},takeaways:["A component is a function returning JSX (or null).","JSX compiles to React.createElement calls.","Components compose like functions — pass them in props, return them from helpers.","Capitalize component names; lowercase names are treated as DOM tags."],mistakes:["Returning multiple top-level elements without a Fragment <>...</>.","Forgetting that `class` becomes `className` in JSX.","Treating components like templates — they are functions, called per render."],next:{label:"Props vs state",href:"#/courses/react-basics/r2"}},{id:"r2",title:"2. Props vs state",intro:"Props are inputs — set by the parent, read-only inside the component. State is internal mutable data managed with `useState`. Re-renders are triggered by state changes (or new props).",code:`// Conceptual — useState lives inside a component.
// const [count, setCount] = React.useState(0);
// <button onClick={() => setCount(count + 1)}>{count}</button>
function sumProps({ a, b }) { return a + b; }
console.log(sumProps({ a: 3, b: 4 }));`,exercise:{prompt:"Write `multiplyProps({ a, b })` returning a * b. Log it for {a:6, b:7}. Expected: 42.",starter:`// function multiplyProps({ a, b }) { ... }
// console.log(multiplyProps({ a: 6, b: 7 }));
`,expected:"42"},takeaways:["Props flow downward — set by parent, read-only inside the child.","State (useState) is mutable, local, triggers re-render on change.","Lift state up to the closest common ancestor when siblings need it.","Treat state immutably — return new objects from setters."],mistakes:["Mutating state directly: arr.push(x) does not re-render. Use [...arr, x].","Setting state inside render — infinite loop.","Trying to mutate props — they are read-only by contract."],next:{label:"Event handlers",href:"#/courses/react-basics/r3"}},{id:"r3",title:"3. Event handlers",intro:"In JSX, attach handlers via camelCase props: `onClick`, `onChange`, `onSubmit`. The handler receives a React SyntheticEvent. Inline arrow functions are common but watch perf if a child re-renders on every render.",code:`// Pseudocode for an onClick handler:
function handleClick(e) {
  console.log("clicked at", e.target?.tagName || "(no element)");
}
handleClick({ target: { tagName: "BUTTON" } });`,exercise:{prompt:'Define `summarize(e)` that returns "type=" + e.type. Log summarize({type:"click"}). Expected: type=click.',starter:`// function summarize(e) { ... }
// console.log(summarize({ type: "click" }));
`,expected:"type=click"},takeaways:["Attach handlers via camelCase props: onClick, onChange, onSubmit.","The event is a React SyntheticEvent wrapping the native event.","e.preventDefault() stops form submission / link navigation.","Use useCallback when a child memoizes against the handler reference."],mistakes:["Calling the handler immediately: onClick={handle()} — fires on render.","Mutating state inside the handler — return new objects to setState.","Inline arrow over big trees of memoized children — busts React.memo."],next:{label:"Controlled inputs & forms",href:"#/courses/react-basics/r4"}},{id:"r4",title:"4. Controlled inputs & forms",intro:"A controlled input has its `value` bound to state and an `onChange` to update state. Validation runs on each change or on submit. Show error messages near the input field. `e.preventDefault()` in the form's onSubmit stops the page reload.",code:`function validateEmail(s) {
  return /^[^@]+@[^@]+\\.[^@]+$/.test(s);
}
console.log(validateEmail("a@b.co"), validateEmail("nope"));`,exercise:{prompt:'Write `isLongEnough(s, n)` returning true iff s.length >= n. Log isLongEnough("hello", 5). Expected: true.',starter:`// function isLongEnough(s, n) { ... }
`,expected:"true"},takeaways:["Controlled inputs bind value to state and update on onChange.","Uncontrolled inputs use refs and DOM defaults — simpler for one-shot reads.","e.preventDefault() in form onSubmit prevents the page reload.","Validate on change for live feedback; on submit for final gating."],mistakes:["Forgetting onChange on a controlled input — read-only field that swallows keys.","Using defaultValue + onChange — picks one model, not both.","Mutating the input value through DOM APIs — React overwrites it on re-render."],next:{label:"Lists & keys",href:"#/courses/react-basics/r5"}},{id:"r5",title:"5. Lists & keys",intro:"Render arrays with `arr.map(item => <Item key={item.id} {...item} />)`. The `key` prop tells React which element is which between re-renders — crucial for correctness and performance. Never use array index as key if the list reorders.",code:`const items = [
  { id: 1, name: "alpha" },
  { id: 2, name: "beta" },
  { id: 3, name: "gamma" },
];
console.log(items.map(i => i.name).join(", "));`,exercise:{prompt:"Given `[{id:1,v:10},{id:2,v:20},{id:3,v:30}]`, log the sum of v. Expected: 60.",starter:`const arr = [{id:1,v:10},{id:2,v:20},{id:3,v:30}];
// log sum of v
`,expected:"60"},takeaways:["Render arrays with .map and a stable `key` prop.","Keys should be stable IDs, not array indices (when order can change).","Mapping inline keeps the JSX declarative.","Avoid expensive transforms inside map — precompute in a useMemo."],mistakes:["Using array index as key for a reorderable list — produces UI bugs.","Missing key prop — warning, plus suboptimal reconciliation.","Generating new IDs on each render — defeats memoization."],next:{label:"useEffect",href:"#/courses/react-basics/r6"}},{id:"r6",title:"6. useEffect",intro:"`useEffect(fn, deps)` runs `fn` after render, and again any time a dep changes. Return a cleanup function to unwind subscriptions/timers — it runs before the next effect and on unmount. `deps = []` runs once on mount; `deps = undefined` runs on every render (almost always a bug). Use it for side effects that touch the outside world: fetch data, subscribe to events, set timeouts.",code:`function Clock() {
  const [t, setT] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => setT(x => x + 1), 1000);
    return () => clearInterval(id);  // cleanup on unmount
  }, []);
  return <div>{t}s</div>;
}
// Pure logic outside React:
console.log(typeof setInterval === "function");`,exercise:{prompt:"Without React, log how many ms `setTimeout` schedules for when called with `1000`. Expected: 1000.",starter:`const ms = 1000;
// log ms
`,expected:"1000"},takeaways:["useEffect(fn, deps) runs fn after commit, again when deps change.","Return a cleanup fn — runs before next effect and on unmount.","deps = [] runs once; omitting deps re-runs every render (almost always a bug).","Effects are for side effects: fetch, subscribe, time, log."],mistakes:["Missing a dep — stale closure reads old state.","Setting state unconditionally in an effect — infinite loop.","Doing pure derivations in an effect — compute during render or in useMemo."],next:{label:"useMemo & useCallback",href:"#/courses/react-basics/r7"}},{id:"r7",title:"7. useMemo & useCallback",intro:"`useMemo(() => compute(), [deps])` caches an expensive computed value across renders. `useCallback(fn, [deps])` caches a function reference (so it stays stable when passed to `React.memo` children). Don't reach for them by default — they cost memory and a deps comparison; profile first. Use when an effect depends on an object/function reference, or when a child is doing expensive work.",code:`function Sum({ nums }) {
  const total = React.useMemo(() => nums.reduce((a, b) => a + b, 0), [nums]);
  return <div>{total}</div>;
}
// Pure logic:
const nums = [1, 2, 3, 4, 5];
console.log(nums.reduce((a, b) => a + b, 0));`,exercise:{prompt:"Compute and log the sum of squares of `[2, 3, 4]`. Expected: 29.",starter:`const nums = [2, 3, 4];
// log sum of squares
`,expected:"29"},takeaways:["useMemo caches a computed value across renders when deps are equal.","useCallback caches a function reference — useful for memoized children.","Neither is free; both cost a deps comparison and memory.","Profile first — assume the runtime can usually handle work."],mistakes:["Wrapping everything in useMemo / useCallback — premature optimization.","Forgetting a dep — stale closure or stale value.","Using useMemo for side-effects (it is not guaranteed to run)."],next:{label:"Custom hooks",href:"#/courses/react-basics/r8"}},{id:"r8",title:"8. Custom hooks",intro:'A custom hook is just a function whose name starts with `use` that calls other hooks. They encapsulate reusable stateful logic without component nesting (Higher-Order Component / render-props problems). Examples: `useLocalStorage`, `useDebouncedValue`, `useFetch`. The "rules of hooks" still apply inside — same order every render, no conditionals around hook calls.',code:`// function useCounter(init = 0) {
//   const [n, setN] = React.useState(init);
//   const inc = () => setN(x => x + 1);
//   return { n, inc };
// }
// Pure logic of what useCounter does:
let n = 5;
n = n + 1;
console.log(n);`,exercise:{prompt:"Simulate a counter starting at 10, incremented 3 times. Log the final value. Expected: 13.",starter:`let n = 10;
// increment n three times
console.log(n);
`,expected:"13"},takeaways:["A custom hook is just a function starting with `use` that calls other hooks.","Encapsulates reusable logic without the wrapper-hell of HOCs.","Same rules-of-hooks apply inside — never conditional, same order each render.","Return a tuple, object, or single value — whatever feels natural to consume."],mistakes:["Naming without the `use` prefix — lint rule cannot enforce hook usage.","Calling hooks conditionally inside the custom hook.","Putting state in a hook used in many components and expecting it to be shared."],next:{label:"Context",href:"#/courses/react-basics/r9"}},{id:"r9",title:"9. Context",intro:"`React.createContext(default)` creates a context. Wrap a tree in `<Ctx.Provider value={...}>` so any descendant can read it via `useContext(Ctx)` — no prop-drilling. Best for cross-cutting data that rarely changes: theme, locale, current user. For frequently-changing state, prefer state managers (Zustand, Redux, TanStack Query) since every Context value change re-renders every consumer.",code:`// const ThemeCtx = React.createContext("light");
// const useTheme = () => React.useContext(ThemeCtx);
const theme = "dark";
console.log("theme is " + theme);`,exercise:{prompt:'Pretend the context value is "premium". Log `tier: premium`. Expected: `tier: premium`.',starter:`const tier = "premium";
// log "tier: <tier>"
`,expected:"tier: premium"},takeaways:["createContext + Provider lets any descendant read shared values without prop-drilling.","useContext(Ctx) reads the nearest Provider; falls back to the default value.","Every context change re-renders every consumer — split contexts by update frequency.","Great for theme, locale, current user, feature flags."],mistakes:["Putting frequently changing state in one big context — re-renders everything.","Using Context as a global mutable store — reach for a state manager instead.","Forgetting a Provider — consumers get the default and silently misbehave."],next:{label:"Suspense & lazy",href:"#/courses/react-basics/r10"}},{id:"r10",title:"10. Suspense & lazy",intro:'`React.lazy(() => import("./HeavyThing"))` creates a code-split component that loads on demand. Wrap it in `<Suspense fallback={<Skeleton />}>` so React knows what to render while the chunk is fetching. Same mechanism handles async data when you opt into React 19 server data, streaming SSR, and waterfalls. Splits big bundles without rearchitecting.',code:`// const HeavyChart = React.lazy(() => import("./HeavyChart"));
// <Suspense fallback={<div>Loading…</div>}><HeavyChart /></Suspense>
const loaded = false;
console.log(loaded ? "ready" : "Loading…");`,exercise:{prompt:"Log `Loading…` when `loaded = false`, else `ready`. Set `loaded = true`. Expected: `ready`.",starter:`const loaded = true;
// log appropriate string
`,expected:"ready"},takeaways:["React.lazy splits a component into its own chunk loaded on demand.","Wrap lazy components in <Suspense fallback={...}> for the loading UI.","Same machinery powers React 19 server data and streaming SSR.","Best for routes, modals, heavy editors — anything not needed on first paint."],mistakes:["Wrapping every component in lazy — too many round-trips, slow UX.","Forgetting the Suspense boundary — React throws.","Lazy-loading code used on initial render — defeats the purpose."],next:{label:"TypeScript: types & inference",href:"#/courses/typescript-basics/ts1"}}],n=[{id:"ts1",title:"1. Types & inference",intro:"TypeScript adds static types to JavaScript. Most of the time the compiler infers types — you only annotate when it can't guess (function parameters, hard cases). Core types: `string`, `number`, `boolean`, `string[]`, `{ x: number }`, plus literal types and unions.",code:`let name: string = "PGcode";
let score = 42; // inferred as number
let flags: boolean[] = [true, false];
console.log(name, score, flags);`,exercise:{prompt:'Declare `subject` as the string "Math" and `score` as number 95. Log "<subject>: <score>". Expected: Math: 95.',starter:`// your code here
`,expected:"Math: 95"},takeaways:["TypeScript layers static types over JS — inferred most of the time.","Core types: string, number, boolean, plus arrays and object shapes.",'Literal types ("on" | "off") plus unions model finite states.',"Annotate function params; let inference handle return types."],mistakes:["Over-annotating — clutters code; trust inference.","Using `any` to silence errors — defeats the whole point.","Assuming runtime checks are added — they are not; TS is a compile-time tool."],next:{label:"Functions with typed params",href:"#/courses/typescript-basics/ts2"}},{id:"ts2",title:"2. Functions with typed params",intro:"Annotate parameters explicitly. Return types are usually inferred; annotate when you want the compiler to enforce a specific contract. Use `?` for optional params and `=` for defaults.",code:'function greet(name: string, greeting: string = "Hi"): string {\n  return `${greeting}, ${name}!`;\n}\nconsole.log(greet("Asha"));',exercise:{prompt:"Write `add(a: number, b: number): number` returning a+b. Log add(2, 3). Expected: 5.",starter:`// define add
// console.log(add(2, 3));
`,expected:"5"},takeaways:["Annotate parameters explicitly; return types are usually inferred.","Optional params: param?: T. Default: param: T = value.","Rest params: ...args: T[] for variadic functions.","Function types: (a: number, b: number) => number."],mistakes:["Forgetting that optional and default are mutually exclusive sugar.","Mixing required params after optional ones — compile error.","Using `any` as parameter type — disables checks for the whole function."],next:{label:"Interfaces & type aliases",href:"#/courses/typescript-basics/ts3"}},{id:"ts3",title:"3. Interfaces & type aliases",intro:"`interface User { name: string; age: number; }` describes the shape of an object. `type` does the same plus supports unions and intersections. Use interfaces when you want extensibility, types when you need composition.",code:`interface User { name: string; age: number; admin?: boolean }
const u: User = { name: "Asha", age: 28 };
console.log(u.name, u.age);`,exercise:{prompt:"Define an interface `Point { x: number; y: number }`. Create p = {x: 3, y: 4}. Log p.x + p.y. Expected: 7.",starter:`// define Point and p
`,expected:"7"},takeaways:["interface describes object shape and is extensible (declaration merging).","type aliases support unions, intersections, and primitives.","Use interface for public API objects, type for unions and utility shapes.","Both compile to the same structural type-check."],mistakes:["Using interface for unions — does not work, use type.","Forgetting extends vs intersection — interface uses extends, type uses &.","Treating TypeScript types like classes — they vanish at runtime."],next:{label:"Union types & narrowing",href:"#/courses/typescript-basics/ts4"}},{id:"ts4",title:"4. Union types & narrowing",intro:"A param can be a union like `string | number`. Use `typeof` to narrow before operating: TS understands the narrowed branch.",code:`function len(x: string | number): number {
  if (typeof x === "string") return x.length;
  return String(x).length;
}
console.log(len("hello"), len(12345));`,exercise:{prompt:"Write `area(s: number | { w: number; h: number })` that returns s*s for a number or w*h for a rectangle. Log area(5) + area({w:3,h:4}). Expected: 37.",starter:`// define area
`,expected:"37"},takeaways:["Union types model alternatives; narrow them with typeof / instanceof / in.","After narrowing, TS knows the exact branch and allows safe access.","never is the type of impossible branches — useful for exhaustive checks.","Use discriminated unions when shapes share a common literal field."],mistakes:["Operating on a union before narrowing — type error on shared methods.",'Forgetting that `typeof null` is "object" — null needs an explicit check.',"Mixing union narrowing with `as` casts that lie about the type."],next:{label:"Generics",href:"#/courses/typescript-basics/ts5"}},{id:"ts5",title:"5. Generics",intro:"A generic lets a function or type work over many types while preserving the relationship. `function first<T>(arr: T[]): T | undefined { return arr[0]; }` — the return type matches the input element type.",code:`function first<T>(arr: T[]): T | undefined { return arr[0]; }
const n = first([1, 2, 3]);
const s = first(["a", "b"]);
console.log(n, s);`,exercise:{prompt:"Write `last<T>(arr: T[]): T | undefined`. Log last([10, 20, 30]). Expected: 30.",starter:`function last(arr) { return arr[0]; } // fix me
// console.log(last([10, 20, 30]));
`,expected:"30"},takeaways:["Generics parameterize types — function first<T>(arr: T[]): T.","Constraints: <T extends Comparable<T>> restricts the type set.","TypeScript infers most type arguments from usage.","Generic interfaces / types: interface Box<T> { value: T }."],mistakes:["Using `any` where a generic would do — loses type info downstream.","Over-constraining: <T extends string | number> when you only need one.","Confusing type parameters with values — they exist only at the type level."],next:{label:"Discriminated unions",href:"#/courses/typescript-basics/ts6"}},{id:"ts6",title:"6. Discriminated unions",intro:'A discriminated union shares a common literal field that lets TypeScript narrow safely in each branch. Pattern: every variant has `kind: "circle" | "square"` (or similar). TS knows which fields are valid inside each `if`.',code:`type Shape = { kind: "circle"; r: number } | { kind: "square"; side: number };
function area(s: Shape): number {
  if (s.kind === "circle") return Math.PI * s.r * s.r;
  return s.side * s.side;
}
console.log(area({ kind: "square", side: 4 }));`,exercise:{prompt:'Add a third variant `{ kind: "rect"; w: number; h: number }` and handle it. Log area({kind:"rect",w:3,h:4}). Expected: 12.',starter:`// extend Shape and area
`,expected:"12"},takeaways:["A common literal field (`kind`) lets TS narrow each branch safely.","Exhaustive switch on the discriminant + `never` default catches missing cases.","Avoids the type-cast / property-check ladder of plain unions.","Pairs naturally with React reducers and state machines."],mistakes:["Choosing a non-literal discriminator (e.g. string) — TS cannot narrow.","Forgetting the never assertion in the default branch — bugs slip in silently.","Two variants with the same discriminator value — TS cannot tell them apart."],next:{label:"Type guards",href:"#/courses/typescript-basics/ts7"}},{id:"ts7",title:"7. Type guards (user-defined)",intro:'A guard like `function isString(x: unknown): x is string { return typeof x === "string"; }` lets TS narrow inside `if (isString(x))`. The `x is string` return type is the magic — it teaches the compiler about your runtime check.',code:`function isUser(x: unknown): x is { name: string } {
  return typeof x === "object" && x !== null && "name" in x;
}
const u: unknown = { name: "Asha" };
if (isUser(u)) console.log(u.name.toUpperCase());`,exercise:{prompt:"Write isNumberArray(x: unknown): x is number[] and use it to safely sum the array. For [1,2,3] log 6.",starter:`// guard + sum
`,expected:"6"},takeaways:["A type predicate (x: unknown): x is Foo teaches TS about a runtime check.","After the guard, TS narrows the type inside the if-branch.","Combine with `unknown` for safe input parsing at API boundaries.","Use type predicates instead of `as` casts whenever possible."],mistakes:["Returning a truthy value from a guard without the `is` annotation — TS does not narrow.","Writing guards that lie about the type — runtime crashes later.","Re-implementing typeof / instanceof — TS already narrows on those."],next:{label:"Conditional types",href:"#/courses/typescript-basics/ts8"}},{id:"ts8",title:"8. Conditional types",intro:"`T extends U ? X : Y` returns one of two types based on whether T is assignable to U. Combine with `infer` to extract pieces — like the return type of a function: `type R<F> = F extends (...a: any[]) => infer R ? R : never;`.",code:`type NonNullableX<T> = T extends null | undefined ? never : T;
type A = NonNullableX<string | null>; // string
const x: A = "ok";
console.log(x);`,exercise:{prompt:'Define `ArrayElement<T>` = element type of T when T extends any[], else never. Show typeof ArrayElement<number[]> works by logging "number".',starter:`// type ArrayElement<T> = ...
console.log("number");
`,expected:"number"},takeaways:["T extends U ? X : Y returns one of two types based on assignability.","`infer R` extracts a type position (e.g. function return type).","Distributes over unions: T extends ... gets evaluated per member.","Powers ReturnType, Parameters, Awaited, NonNullable, and more."],mistakes:["Unintentional union distribution — wrap T in [T] to opt out.",'Deeply recursive conditional types — TS bails with "type too deep".',"Treating conditional types like runtime branches — they vanish at compile time."],next:{label:"Mapped types",href:"#/courses/typescript-basics/ts9"}},{id:"ts9",title:"9. Mapped types",intro:"Iterate over keys with `{ [K in keyof T]: ... }` to transform shapes. The standard library uses this: `Partial<T> = { [K in keyof T]?: T[K] }`. `Readonly<T>`, `Pick<T,K>`, `Omit<T,K>` all use the same mechanism.",code:`type ReadonlyX<T> = { readonly [K in keyof T]: T[K] };
const p: ReadonlyX<{x: number}> = { x: 1 };
console.log(p.x);`,exercise:{prompt:'Define `Nullable<T> = { [K in keyof T]: T[K] | null }`. Construct n: Nullable<{name: string}> = { name: null }. Log n.name ?? "default". Expected: default.',starter:`// type + value
`,expected:"default"},takeaways:["{ [K in keyof T]: ... } iterates keys and transforms shapes.","Modifiers: readonly, ?, plus - to remove them.","Underpins Partial, Required, Readonly, Pick, Omit, Record.","Combine with conditional types for advanced transformations."],mistakes:["Forgetting `as` clause when remapping keys — TS 4.1+ Template Literal Types.","Mapping over a non-object type — TS evaluates to never silently.","Trying to add methods through a mapped type — they vanish on instantiation."],next:{label:"Async typing & Promise<T>",href:"#/courses/typescript-basics/ts10"}},{id:"ts10",title:"10. Async typing & Promise<T>",intro:"`async function` always returns `Promise<T>`. Inside, `await p` unwraps to T. Use `Promise.all` (parallel) when independent. Type errors from `await` propagate as rejected promises — type the catch path.",code:`async function load(): Promise<string> { return "ok"; }
(async () => { const r = await load(); console.log(r); })();`,exercise:{prompt:"Write async function double(n: number): Promise<number> returning n*2. Await it on 7 and log the result. Expected: 14.",starter:`// async fn
`,expected:"14"},takeaways:["async functions always return Promise<T>.","await unwraps to T inside an async fn.","Promise.all preserves the tuple of types when arguments are typed.","Type the catch branch — caught values are unknown by default in modern TS."],mistakes:["Forgetting that catch receives `unknown` — narrow with instanceof Error.","Awaiting non-Promise values — fine but defeats the point.","Using Promise<void> when you really mean Promise<unknown>."],next:{label:"Utility types",href:"#/courses/typescript-basics/ts11"}},{id:"ts11",title:"11. Utility types",intro:"TypeScript ships a library of utility types built on mapped + conditional types. `Partial<T>` makes all fields optional; `Required<T>` does the inverse. `Pick<T, K>` keeps only listed keys; `Omit<T, K>` drops them. `Record<K, V>` is `{ [k in K]: V }`. `ReturnType<F>` and `Parameters<F>` introspect functions. `Awaited<T>` peels through nested promises. `NonNullable<T>` strips null and undefined. Use them to derive related shapes instead of duplicating annotations.",code:`interface User { id: number; name: string; admin?: boolean }
type PublicUser = Omit<User, "admin">;
type UserPatch = Partial<User>;
function make(): User { return { id: 1, name: "Asha" }; }
type R = ReturnType<typeof make>;
const u: R = make();
console.log(u.name);`,exercise:{prompt:'Given `interface Book { id: number; title: string; pages: number; }`, define `BookPreview = Pick<Book, "id" | "title">` and `b: BookPreview = { id: 1, title: "Dune" }`. Log `b.title`. Expected: `Dune`.',starter:`interface Book { id: number; title: string; pages: number; }
// type BookPreview = ...
// const b: BookPreview = ...
const b = { id: 1, title: "Dune" };
console.log(b.title);
`,expected:"Dune"},takeaways:["Partial / Required / Readonly toggle optionality / mutability across a type.","Pick / Omit slice an existing type by key.","Record<K, V> builds key-value shapes from a literal union.","ReturnType / Parameters / Awaited introspect functions and promises."],mistakes:['Using `Pick<T, "wrong">` — TS errors on unknown keys.',"Stacking Partial<Required<Partial<T>>> — same as Partial<T>; readable code wins.","Forgetting Awaited unwraps nested promises (a generalized ReturnType for async)."],next:{label:"Branded types",href:"#/courses/typescript-basics/ts12"}},{id:"ts12",title:"12. Branded types",intro:'Sometimes two values share a structural type but mean different things — a `UserId` and a `PostId` are both `number`, but mixing them is a bug. Branded types add a phantom field at the type level so they cannot be assigned to each other. Pattern: `type UserId = number & { readonly __brand: "UserId" }`. Construct via a smart constructor that asserts the brand. The brand never exists at runtime — pure compile-time discipline.',code:`type UserId = number & { readonly __brand: "UserId" };
type PostId = number & { readonly __brand: "PostId" };

function userId(n: number): UserId { return n as UserId; }
function postId(n: number): PostId { return n as PostId; }

function loadUser(id: UserId) { return \`user-\${id}\`; }
const u = userId(7);
console.log(loadUser(u));
// loadUser(postId(7)) // would not compile`,exercise:{prompt:'Define a branded `type Email = string & { readonly __brand: "Email" }` and a helper `email(s: string): Email`. Create an `Email` from `"a@b.co"` and log it. Expected: `a@b.co`.',starter:`// type Email = ...
// function email(s: string): Email { return s as Email; }
const e = "a@b.co";
console.log(e);
`,expected:"a@b.co"},takeaways:["Branded types prevent accidental mixing of structurally identical values.","The brand is a phantom property — zero runtime cost.","A smart constructor is the gatekeeper that asserts the brand.","Great for IDs, sanitized strings, validated payloads."],mistakes:["Casting raw values everywhere with `as Brand` — defeats the safety.","Forgetting `readonly` on the brand field — TS allows assignment in some cases.","Overusing brands for trivial values — adds friction without bug-prevention value."],next:{label:"Algorithms: Two pointers",href:"#/learn/algorithms/two-pointers"}}],s=[{id:"go1",title:"1. Hello + types",intro:"Go is statically typed but feels lightweight. `:=` declares + assigns with inferred type. Primitives: `int`, `int64`, `float64`, `bool`, `string`. Every program starts in `main()` of package `main`.",code:`package main
import "fmt"
func main() {
  name := "PGcode"
  x := 7
  fmt.Println(name, x)
}`,exercise:{prompt:'Print "Math: 95" using subject = "Math" and score = 95.',starter:`package main
import "fmt"
func main() {
  // your code
}
`,expected:"Math: 95"},takeaways:["Programs start at main.main; every file lives in a package.",":= declares + assigns with type inference; var declares explicitly.","Primitives: int, int64, float64, bool, string.","Exported names start with an uppercase letter; lowercase = package-private."],mistakes:["Using := for redeclaration on an existing variable in the same scope — compile error.","Lowercase function names accessed from another package — invisible.","Mixing int and int64 without explicit conversion."],next:{label:"Control flow",href:"#/courses/go-basics/go2"}},{id:"go2",title:"2. Control flow",intro:"Go has no parens around conditions but braces are mandatory. `if x > 0 { ... }`. Loops are all `for`; while-style: `for cond { }`; infinite: `for { }`.",code:`package main
import "fmt"
func main() {
  for i := 1; i <= 5; i++ { fmt.Println(i) }
}`,exercise:{prompt:"Sum integers 1..10 and print the total. Expected: 55.",starter:`package main
import "fmt"
func main() {
  total := 0
  // loop
  fmt.Println(total)
}
`,expected:"55"},takeaways:["No parens around conditions; braces are mandatory.","Only one loop keyword: for. Use for cond, for {}, for i := 0; ...; i++.","switch has implicit break; use fallthrough explicitly when needed.","if init; cond — scope a value to the if/else block."],mistakes:["Forgetting that switch in Go does not fall through by default.","Mixing post-statement-style for with break/continue can cause confusion.","Using ++/-- as expressions — they are statements only."],next:{label:"Slices",href:"#/courses/go-basics/go3"}},{id:"go3",title:"3. Slices",intro:"Slices are dynamic arrays. `nums := []int{1,2,3}`. Append with `append(nums, 4)`. Length: `len(nums)`. Range over both index and value: `for i, v := range nums { … }`.",code:`package main
import "fmt"
func main() {
  nums := []int{3, 1, 4, 1, 5}
  total := 0
  for _, v := range nums { total += v }
  fmt.Println(total)
}`,exercise:{prompt:"Given nums = []int{5, 2, 9, 1, 7}, print the maximum. Expected: 9.",starter:`package main
import "fmt"
func main() {
  nums := []int{5, 2, 9, 1, 7}
  // find max
}
`,expected:"9"},takeaways:["Slices are views over an underlying array with len + cap.","append grows the slice, possibly reallocating the backing array.","range yields index, value pairs (or just index if you omit the value).","A nil slice has len 0 and is safe to range / append."],mistakes:["Forgetting that append may or may not reallocate — sharing surprises follow.","Slicing with s[a:b] keeps a reference to the backing array — leaks memory.","Modifying a slice you passed without realizing the caller sees changes."],next:{label:"Maps",href:"#/courses/go-basics/go4"}},{id:"go4",title:"4. Maps",intro:'Go\'s hash map: `counts := map[string]int{}`. Read with `counts["key"]` (returns zero value if missing). Set with `counts[k] = v`. Test existence: `v, ok := counts[k]`.',code:`package main
import "fmt"
func main() {
  c := map[rune]int{}
  for _, ch := range "mississippi" { c[ch]++ }
  fmt.Println(c)
}`,exercise:{prompt:"Count occurrences of each value in []int{1,2,2,3,3,3} and print the count of 3. Expected: 3.",starter:`package main
import "fmt"
func main() {
  arr := []int{1, 2, 2, 3, 3, 3}
  c := map[int]int{}
  // count, then print c[3]
}
`,expected:"3"},takeaways:["Maps are hash tables; create with make(map[K]V) or a literal.","Missing keys return the zero value of V — handy for counters.",'v, ok := m[k] distinguishes "missing" from "zero".',"Iteration order is randomized — never rely on it."],mistakes:["Writing to a nil map — runtime panic. Use make.","Taking the address of a map value — not allowed.","Modifying a map while iterating — undefined behaviour."],next:{label:"Structs & methods",href:"#/courses/go-basics/go5"}},{id:"go5",title:"5. Structs & methods",intro:"Structs group fields. Methods attach to a receiver: `func (p Point) String() string`. Use a pointer receiver `(*Point)` when the method mutates the struct or the struct is large (avoid copy).",code:`package main
import "fmt"
type Point struct { X, Y int }
func (p Point) Sum() int { return p.X + p.Y }
func main() {
  p := Point{3, 4}
  fmt.Println(p.Sum())
}`,exercise:{prompt:"Add a Distance method that returns sqrt(X*X + Y*Y). Print Distance for Point{3,4}. Expected: 5.",starter:`package main
import (
  "fmt"
  "math"
)
type Point struct { X, Y int }
// add method
func main() {
  p := Point{3, 4}
  fmt.Println(math.Sqrt(0)) // replace
}
`,expected:"5"},takeaways:["Structs group fields with explicit types.","Methods bind to a receiver: func (p *Point) X() — pointer or value.","Pointer receivers mutate or avoid copies; value receivers copy.","Embedding (struct A inside B without a field name) gives promoted fields."],mistakes:["Mixing pointer and value receivers across a type — surprises on interface satisfaction.","Returning a pointer to a local — fine in Go (escape analysis); not in C/C++.","Forgetting that struct comparison is field-wise and requires comparable fields."],next:{label:"Interfaces",href:"#/courses/go-basics/go6"}},{id:"go6",title:"6. Interfaces",intro:"Interfaces in Go are implicitly satisfied — no `implements` keyword. If a type has all the methods, it satisfies the interface. `interface{}` (or `any` in Go 1.18+) accepts anything.",code:`package main
import "fmt"
type Stringer interface { String() string }
type P struct { x int }
func (p P) String() string { return fmt.Sprintf("P(%d)", p.x) }
func print(s Stringer) { fmt.Println(s) }
func main() { print(P{x: 42}) }`,exercise:{prompt:"Define interface Shape with method Area() float64. Implement Square{side float64}. Print Square{4}.Area(). Expected: 16.",starter:`package main
import "fmt"
// type Shape ...
// type Square ...
func main() {
  fmt.Println(0) // replace
}
`,expected:"16"},takeaways:["Interfaces are satisfied implicitly — no `implements` keyword.","Empty interface (interface{} / any) accepts anything.","Type assertions: x, ok := v.(T) recover the underlying type.","Keep interfaces small — io.Reader, io.Writer are the canonical examples."],mistakes:["Defining a giant interface upfront — accepted in OO languages, idiomatic anti-pattern in Go.","Forgetting `, ok` in a type assertion — panics on mismatch.","Nil-interface gotcha: an interface holding a typed nil pointer is not == nil."],next:{label:"Error handling",href:"#/courses/go-basics/go7"}},{id:"go7",title:"7. Error handling",intro:'Go uses explicit error returns: `result, err := op()`. Check `if err != nil { ... }`. Build errors with `errors.New("msg")` or `fmt.Errorf("ctx: %w", err)` to wrap.',code:`package main
import (
  "errors"
  "fmt"
)
func div(a, b int) (int, error) {
  if b == 0 { return 0, errors.New("divide by zero") }
  return a / b, nil
}
func main() {
  q, err := div(10, 2)
  if err != nil { fmt.Println(err); return }
  fmt.Println(q)
}`,exercise:{prompt:`Modify so calling div(10, 0) prints "divide by zero" (and exits). Don't crash.`,starter:`package main
import (
  "errors"
  "fmt"
)
func div(a, b int) (int, error) { return 0, errors.New("divide by zero") }
func main() {
  _, err := div(10, 0)
  if err != nil { fmt.Println(err) }
}
`,expected:"divide by zero"},takeaways:["Errors are values returned alongside the result.",'errors.New for simple messages; fmt.Errorf("ctx: %w", err) to wrap.',"errors.Is and errors.As unwrap and match sentinel / typed errors.","Always check err — silent _ = ignores bugs."],mistakes:["Ignoring err returns — Go vet catches some, not all.","Comparing wrapped errors with == — use errors.Is.","Panic-ing on recoverable errors — reserve panic for truly unrecoverable bugs."],next:{label:"Goroutines",href:"#/courses/go-basics/go8"}},{id:"go8",title:"8. Goroutines",intro:"A goroutine is a lightweight green thread. `go f()` schedules f to run concurrently. Cheap — millions are fine. Use sync primitives (channels, WaitGroup) to coordinate.",code:`package main
import (
  "fmt"
  "sync"
)
func main() {
  var wg sync.WaitGroup
  for i := 0; i < 3; i++ {
    wg.Add(1)
    go func(n int) { defer wg.Done(); fmt.Println(n) }(i)
  }
  wg.Wait()
}`,exercise:{prompt:"Spawn 5 goroutines that each add their index to a shared counter (use sync.Mutex). Print the final counter. Expected: 10.",starter:`package main
import (
  "fmt"
  "sync"
)
func main() {
  var (
    mu sync.Mutex
    wg sync.WaitGroup
    total int
  )
  // spawn
  wg.Wait()
  fmt.Println(total)
}
`,expected:"10"},takeaways:["go f() runs f concurrently — cheap and lightweight.",'sync.WaitGroup coordinates "wait for N to finish".',"sync.Mutex protects shared mutable state.","Prefer channels for communication; mutexes for state protection."],mistakes:["Forgetting wg.Add before go — wg.Wait returns immediately.","Capturing loop variable by reference in a goroutine — fixed in Go 1.22+ but be aware.","Sharing memory without synchronization — race detected with `go run -race`."],next:{label:"Channels",href:"#/courses/go-basics/go9"}},{id:"go9",title:"9. Channels",intro:"Channels are typed pipes between goroutines. `ch := make(chan int)`. Send: `ch <- 7`. Receive: `v := <-ch`. Unbuffered channels block until both sender and receiver are ready (synchronous handoff).",code:`package main
import "fmt"
func main() {
  ch := make(chan int, 3)
  ch <- 1; ch <- 2; ch <- 3
  close(ch)
  total := 0
  for v := range ch { total += v }
  fmt.Println(total)
}`,exercise:{prompt:"Start a goroutine that pushes 1..5 into a channel then closes it. The main goroutine sums and prints. Expected: 15.",starter:`package main
import "fmt"
func main() {
  ch := make(chan int, 5)
  // launch goroutine to push
  total := 0
  for v := range ch { total += v }
  fmt.Println(total)
}
`,expected:"15"},takeaways:["Channels are typed pipes between goroutines.","Unbuffered channels block until both sender and receiver are ready.","Buffered channels (make(chan T, N)) let the sender go ahead until full.",'close(ch) signals "no more values"; range stops naturally.'],mistakes:["Closing the same channel twice — panic.","Receiving from a closed channel — returns the zero value, never blocks.","Sending on a closed channel — panic. Always close from the producer."],next:{label:"Defer & cleanup",href:"#/courses/go-basics/go10"}},{id:"go10",title:"10. Defer & cleanup",intro:"`defer f()` schedules f to run when the surrounding function returns (even on panic). Use for closing files, releasing locks, restoring state. Deferred calls run in LIFO order.",code:`package main
import "fmt"
func main() {
  defer fmt.Println("third")
  defer fmt.Println("second")
  fmt.Println("first")
}`,exercise:{prompt:`Use defer to print "done" AFTER printing "work" inside main. Expected output:
work
done`,starter:`package main
import "fmt"
func main() {
  // your code
}
`,expected:`work
done`},takeaways:["defer schedules a call to run when the surrounding function returns.","Deferred calls run LIFO — last deferred is first to execute.","Args to a deferred call are evaluated at the defer point, not at run time.","Idiomatic for closing files, releasing locks, restoring state."],mistakes:["Deferring inside a loop — N deferred calls pile up until the function returns.","Expecting deferred args to capture the latest value — they capture at defer time.","Forgetting that defer also runs on panic — useful for crash recovery."],next:{label:"Algorithms: Two pointers",href:"#/learn/algorithms/two-pointers"}}],e={"python-basics":{id:"python-basics",title:"Python Basics",language:"python",color:"#3776AB",blurb:"From print() to dicts and functions — the 6 things you need before any LeetCode.",estimatedHours:2,externalResources:[{title:"MIT OCW 6.0001 — Intro to CS & Programming in Python (Fall 2016)",url:"https://ocw.mit.edu/courses/6-0001-introduction-to-computer-science-and-programming-in-python-fall-2016/",type:"course"},{title:"Python for Everybody (Coursera audit-free)",url:"https://www.coursera.org/specializations/python",type:"course"},{title:"Real Python — tutorials index",url:"https://realpython.com/",type:"blog"}],lessons:[{id:"p1",title:"1. Variables & types",intro:"Python is dynamically typed: a variable is just a name pointing at a value. The four core scalar types you'll use daily are `int`, `float`, `str`, and `bool`. Reassigning a variable doesn't change its old value — it points the name at a new object. Use `type(x)` to inspect what something is.",code:`x = 7
name = "PGcode"
pi = 3.14159
is_great = True

print(type(x), type(name), type(pi), type(is_great))`,exercise:{prompt:'Make `score` equal 95, `subject` equal "Math", then print them in the form `Math: 95`.',starter:`# write your code below
score = ...
subject = ...
print(...)
`,expected:"Math: 95"},takeaways:["Variables are names bound to objects; reassignment rebinds, not mutates.","The four daily scalar types are int, float, str, and bool.","Use type(x) when you are unsure what value a variable holds.",'f-strings (f"{var}") are the clearest way to interpolate.'],mistakes:["Confusing assignment (=) with equality comparison (==).",'Mixing int and str in concatenation: "Score: " + 95 raises TypeError — wrap in str().',"Assuming Python has type declarations like Java — it does not, but type hints are optional."],next:{label:"Conditionals",href:"#/courses/python-basics/p2"}},{id:"p2",title:"2. Conditionals",intro:"`if`/`elif`/`else` lets your code branch. Comparisons return booleans (`==`, `!=`, `<`, `>`, `<=`, `>=`). Combine them with `and`, `or`, `not`. Indentation defines the block — Python is strict about 4 spaces.",code:`temp = 72
if temp >= 80:
    print("hot")
elif temp >= 60:
    print("nice")
else:
    print("cold")`,exercise:{prompt:'Given `age = 17`, print "minor" if age < 18 else "adult".',starter:`age = 17
# print "minor" or "adult"
`,expected:"minor"},takeaways:["if / elif / else picks one branch; comparisons return booleans.","Combine conditions with and, or, not — not &&, ||, !.","Indentation defines the block; 4 spaces is the convention.","Ternary expression: value = a if cond else b."],mistakes:["Using = instead of == inside an if — Python catches it for plain names but it fails inside walrus contexts.","Mixing tabs and spaces in the same block raises IndentationError.","Forgetting the colon at the end of if / elif / else lines."],next:{label:"Loops",href:"#/courses/python-basics/p3"}},{id:"p3",title:"3. Loops",intro:"`for x in iterable` walks any sequence (list, string, range). `while cond:` repeats until the condition is false. `range(n)` generates 0..n-1 lazily. `break` exits the loop; `continue` skips to the next iteration.",code:`total = 0
for i in range(1, 6):
    total += i
print(total)  # 1+2+3+4+5 = 15`,exercise:{prompt:"Print the sum of even numbers from 1 to 10 (inclusive). Answer should be 30.",starter:`total = 0
for i in range(1, 11):
    # add only even numbers
    pass
print(total)
`,expected:"30"},takeaways:["for x in iterable walks lists, strings, ranges, generators — anything iterable.","range(start, stop, step) is lazy; convert with list(range(...)) only when needed.","break exits, continue skips to the next iteration.","while loops repeat until the condition becomes false."],mistakes:["Off-by-one with range — range(1, 10) does not include 10.","Mutating a list while iterating it (use a copy or build a new list).","Forgetting that for / else only fires when the loop completed without break."],next:{label:"Lists",href:"#/courses/python-basics/p4"}},{id:"p4",title:"4. Lists",intro:"Lists are ordered, mutable collections. Index with `lst[i]`, slice with `lst[a:b]`, append with `lst.append(x)`. Use `len(lst)` for length. Comprehensions like `[x*x for x in lst]` are the Pythonic way to map.",code:`nums = [3, 1, 4, 1, 5, 9, 2, 6]
print(nums[0], nums[-1])  # first, last
print(sorted(nums))
squares = [n*n for n in nums]
print(squares)`,exercise:{prompt:"Given the list `[5, 2, 9, 1, 7]`, print the maximum value.",starter:`nums = [5, 2, 9, 1, 7]
# print the max
`,expected:"9"},takeaways:["Lists are mutable, ordered, and indexed from 0; negative indices count from the end.","Slicing arr[a:b] is non-destructive; arr[:] makes a shallow copy.","append (O(1) amortized), insert (O(n)), pop() (O(1)), pop(0) (O(n)).","List comprehensions [expr for x in arr] beat manual loop+append for clarity."],mistakes:["Using `is` to compare list contents — use ==.","Aliasing: b = a does not copy; use a[:] or list(a) or copy.deepcopy for nested data.","IndexError on empty lists — guard with `if arr:` first."],next:{label:"Functions",href:"#/courses/python-basics/p5"}},{id:"p5",title:"5. Functions",intro:"Define a function with `def`. Parameters can have defaults. `return` sends a value back. Functions are first-class — pass them around and return them. Docstrings (triple-quoted strings as the first line of a body) document behaviour.",code:`def greet(name, greeting="Hello"):
    return f"{greeting}, {name}!"

print(greet("Asha"))
print(greet("Ben", greeting="Hi"))`,exercise:{prompt:"Define `square(n)` that returns n*n. Then print square(7).",starter:`def square(n):
    # return n*n
    pass

print(square(7))
`,expected:"49"},takeaways:["def declares a function; return sends a value back.","Default args (def f(x=0)) are evaluated once at definition — never use a mutable default.","Functions are first-class: assign them, pass them, return them.","*args / **kwargs collect extra positional / keyword arguments."],mistakes:["Mutable default arg trap: def f(xs=[]) shares the same list across calls.","Forgetting `return` — Python returns None implicitly.","Shadowing built-ins: naming a parameter `list` or `dict` hides the type."],next:{label:"Dictionaries",href:"#/courses/python-basics/p6"}},{id:"p6",title:"6. Dictionaries",intro:"Dicts are key→value maps with O(1) lookup. Build with `{}` or `dict()`. Access with `d[key]` (raises `KeyError` if missing) or `d.get(key, default)`. Iterate over keys, values, or items with `.keys()`, `.values()`, `.items()`. Hash maps are the most-used data structure in coding interviews.",code:`counts = {}
for ch in "mississippi":
    counts[ch] = counts.get(ch, 0) + 1
print(counts)`,exercise:{prompt:`Given the list \`["apple", "banana", "apple", "cherry", "banana", "apple"]\`, build a dict of word → count and print it. Expected: \`{'apple': 3, 'banana': 2, 'cherry': 1}\`.`,starter:`words = ["apple", "banana", "apple", "cherry", "banana", "apple"]
counts = {}
# count each word
# print(counts)
`,expected:"{'apple': 3, 'banana': 2, 'cherry': 1}"},takeaways:["Dicts are O(1) hash maps; keys must be hashable (immutable).","d.get(k, default) avoids KeyError when the key may not exist.","collections.defaultdict(int) is cleaner for counting.","Iteration order is insertion order (guaranteed since Python 3.7)."],mistakes:["Using a mutable type (list, dict) as a key — raises TypeError: unhashable.","d[k] raises KeyError if missing; prefer d.get(k) when absence is normal.","Mutating a dict while iterating its keys raises RuntimeError."],next:{label:"Strings",href:"#/courses/python-basics/p7"}},{id:"p7",title:"7. Strings",intro:'Strings are immutable sequences. Slice with `s[a:b]`, search with `in`, split with `.split(sep)`, join with `sep.join(list)`. Use f-strings (`f"x = {x}"`) for interpolation. Common methods: `.lower()`, `.upper()`, `.strip()`, `.replace(a, b)`, `.startswith()`, `.endswith()`.',code:`s = "  Hello, PGcode!  "
print(s.strip())
print(s.strip().lower())
print(",".join(["a", "b", "c"]))
name = "Asha"
print(f"Hi, {name}!")`,exercise:{prompt:'Given `s = "the quick brown fox"`, print the word count (number of whitespace-separated tokens). Expected: `4`.',starter:`s = "the quick brown fox"
# print the number of words
`,expected:"4"},takeaways:["Strings are immutable — every method returns a new string.","Slicing s[a:b:step] works just like list slicing.",'f-strings: f"x = {x:.2f}" supports format-spec for numbers and dates.','Use "".join(parts) instead of repeated += in a loop (O(n) vs O(n²)).'],mistakes:['Trying to mutate s[0] = "x" — TypeError, strings are immutable.','Forgetting that .split() without args splits on any whitespace; .split(" ") keeps empty tokens.',"Comparing strings with `is` instead of == (works for interned literals only by accident)."],next:{label:"Sets & tuples",href:"#/courses/python-basics/p8"}},{id:"p8",title:"8. Sets & tuples",intro:"A `set` is an unordered collection with no duplicates and O(1) membership tests (`x in s`). Build with `{1, 2, 3}` or `set(iterable)`. Tuples (`(1, 2, 3)`) are immutable lists — hashable, so they can be dict keys or set elements.",code:`nums = [1, 2, 2, 3, 3, 3, 4]
unique = set(nums)
print(sorted(unique))
print(3 in unique)
print(5 in unique)
point = (3, 4)
print(point[0], point[1])`,exercise:{prompt:"Given the list `[1, 1, 2, 3, 5, 5, 8, 13]`, print the number of distinct values. Expected: `6`.",starter:`arr = [1, 1, 2, 3, 5, 5, 8, 13]
# print the count of distinct values
`,expected:"6"},takeaways:["set has O(1) membership; built from any iterable.","Tuples are immutable lists — usable as dict keys and set elements.","Set operations: a | b (union), a & b (intersection), a - b (difference).","frozenset is the hashable, immutable cousin."],mistakes:["Using {} for an empty set — that is an empty dict. Use set().","Adding a list to a set: TypeError. Wrap with tuple() first.","Relying on set iteration order — it is not guaranteed."],next:{label:"List comprehensions",href:"#/courses/python-basics/p9"}},{id:"p9",title:"9. List comprehensions",intro:"Comprehensions are Python's most loved feature. `[expr for x in iter if cond]` builds a new list. Set comprehensions use `{}`. Dict comprehensions: `{k: v for ... }`. They are typically faster than equivalent for-loops and read more like math.",code:`squares = [x*x for x in range(10)]
evens = [x for x in squares if x % 2 == 0]
print(squares)
print(evens)
lengths = {w: len(w) for w in ["red", "blue", "yellow"]}
print(lengths)`,exercise:{prompt:"Using a list comprehension, build a list of squares of even numbers from 1..10 inclusive. Print it. Expected: `[4, 16, 36, 64, 100]`.",starter:`# squares = [...]
squares = []
print(squares)
`,expected:"[4, 16, 36, 64, 100]"},takeaways:["[expr for x in iter if cond] builds a new list.","Set comprehensions use {}; dict comprehensions {k: v for ...}.","Generator expressions (x for x in it) stream values without building a list.","Comprehensions are typically faster than for-loop + append."],mistakes:["Nesting too many for-clauses — past two levels readability suffers; use a real loop.","Side-effects inside a comprehension (print, db writes) are anti-pattern.","Confusing dict-vs-set literal: {x for x in it} is a set, {x: x for x in it} is a dict."],next:{label:"Decorators",href:"#/courses/python-basics/p10"}},{id:"p10",title:"10. Decorators",intro:"A decorator is a function that wraps another function to add behaviour without changing its body. `@decorator` above a `def` is sugar for `f = decorator(f)`. Common uses: logging, timing, caching, auth checks. Use `functools.wraps` to preserve the original function's name and docstring.",code:`from functools import wraps

def log_calls(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        print(f"calling {fn.__name__}({args})")
        return fn(*args, **kwargs)
    return wrapper

@log_calls
def add(a, b):
    return a + b

print(add(2, 3))`,exercise:{prompt:"Write a `@double_result` decorator that doubles whatever its wrapped function returns. Apply it to `triple(n)` (which returns n*3). Print `triple(5)`. Expected: `30`.",starter:`def double_result(fn):
    # return a wrapper that calls fn and doubles the result
    pass

@double_result
def triple(n):
    return n * 3

print(triple(5))
`,expected:"30"},takeaways:["A decorator is a function that takes a function and returns a function.","@deco above def f is shorthand for f = deco(f).","functools.wraps preserves __name__ and __doc__ of the wrapped function.","Decorators with arguments need an extra factory layer."],mistakes:['Forgetting functools.wraps — debuggers show "wrapper" instead of the real name.',"Returning the call result instead of the wrapper function from the decorator.","Capturing the wrong scope when stacking multiple decorators."],next:{label:"Generators",href:"#/courses/python-basics/p11"}},{id:"p11",title:"11. Generators",intro:"A generator function uses `yield` to produce values one at a time, lazily. It returns a generator object you iterate with `for x in gen` or `next(gen)`. Generators keep memory tiny when streaming large data. Generator expressions `(x*x for x in nums)` look like comprehensions but produce a generator instead of a list.",code:`def fib():
    a, b = 0, 1
    while True:
        yield a
        a, b = b, a + b

gen = fib()
first10 = [next(gen) for _ in range(10)]
print(first10)`,exercise:{prompt:"Write a generator `evens_up_to(n)` that yields all even numbers from 0 up to and including n. Use it to print `list(evens_up_to(10))`. Expected: `[0, 2, 4, 6, 8, 10]`.",starter:`def evens_up_to(n):
    # yield even numbers
    pass

print(list(evens_up_to(10)))
`,expected:"[0, 2, 4, 6, 8, 10]"},takeaways:["yield pauses the function and produces a value lazily.","next(gen) drives one step at a time; for-loops do this automatically.","Generator expressions (x*x for x in it) are memory-friendly.","yield from delegates to another iterable cleanly."],mistakes:["Treating a generator as a list — it is one-shot, exhausted after iteration.","Forgetting that the body does not run until next() is called.","Using return value in a generator — return inside yield-fns raises StopIteration.value."],next:{label:"Async / await",href:"#/courses/python-basics/p12"}},{id:"p12",title:"12. Async / await",intro:"`async def` declares a coroutine; calling it returns a coroutine object that must be awaited or scheduled. `await` suspends until the awaited coroutine resolves. `asyncio.gather(...)` runs many concurrently. Async shines for I/O-bound work (HTTP, DB, files) — not CPU-bound code, which still needs threads/processes.",code:`import asyncio

async def task(name, delay):
    await asyncio.sleep(delay)
    return f"{name} done after {delay}s"

async def main():
    results = await asyncio.gather(
        task("A", 0.1), task("B", 0.05), task("C", 0.02)
    )
    for r in results:
        print(r)

asyncio.run(main())`,exercise:{prompt:"Write `async def double(n)` that sleeps 0.01s then returns `n*2`. Use `asyncio.gather` to compute `double(1)`, `double(2)`, `double(3)` concurrently and print the sum. Expected: `12`.",starter:`import asyncio

async def double(n):
    # sleep 0.01 then return n*2
    pass

async def main():
    # gather three doubles and print sum
    pass

asyncio.run(main())
`,expected:"12"},takeaways:["async def declares a coroutine; calling it returns a coroutine object that must be awaited.","await pauses until the awaited coroutine resolves.","asyncio.gather(*tasks) runs them concurrently and returns results in order.","Async helps I/O-bound work; CPU-bound code still needs threads/processes."],mistakes:["Calling time.sleep inside async code — blocks the event loop. Use asyncio.sleep.","Forgetting to await a coroutine — it never runs, just creates an object.","Running asyncio.run inside an already-running loop (e.g. Jupyter) — raises RuntimeError."],next:{label:"Context managers",href:"#/courses/python-basics/p13"}},{id:"p13",title:"13. Context managers",intro:"`with` blocks call `__enter__` on entry and `__exit__` on exit — even if an exception is raised. The classic use is `with open(path) as f:` so the file always closes. Build your own with a class implementing `__enter__`/`__exit__`, or with `@contextmanager` from `contextlib` for a generator-based shortcut.",code:`from contextlib import contextmanager
import time

@contextmanager
def timer(label):
    t0 = time.time()
    yield
    print(f"{label}: {(time.time()-t0)*1000:.1f}ms")

with timer("sum"):
    total = sum(i*i for i in range(100_000))
print(total)`,exercise:{prompt:'Write a context manager `silent()` that suppresses any printed output inside its `with` block by temporarily replacing `sys.stdout` with `io.StringIO`. Use it to wrap a `print("hello")` call, then print "done" outside it. Expected output: `done`.',starter:`import sys, io
from contextlib import contextmanager

@contextmanager
def silent():
    # save sys.stdout, replace with StringIO, restore on exit
    pass

with silent():
    print("hello")
print("done")
`,expected:"done"},takeaways:["with calls __enter__ on entry, __exit__ on exit — even on exception.","@contextmanager from contextlib turns a generator into a context manager.","Use for resource lifecycle: files, locks, timers, transactions.","contextlib.ExitStack composes multiple context managers dynamically."],mistakes:["Forgetting to yield in a @contextmanager generator — silent breakage.","Raising inside __enter__ leaves the resource un-cleaned (use a try in setup).","Returning the manager instead of `with manager as x` and using x outside the block."],next:{label:"Dataclasses",href:"#/courses/python-basics/p14"}},{id:"p14",title:"14. Dataclasses",intro:"`@dataclass` auto-generates `__init__`, `__repr__`, and `__eq__` for a class whose body is mostly field declarations. It eliminates boilerplate for value types. Use `field(default_factory=list)` for mutable defaults. Add `frozen=True` to make instances immutable and hashable.",code:`from dataclasses import dataclass, field

@dataclass
class Point:
    x: int
    y: int
    tags: list = field(default_factory=list)

p = Point(3, 4, ["origin-adjacent"])
print(p)
print(p == Point(3, 4, ["origin-adjacent"]))`,exercise:{prompt:'Define a frozen dataclass `Book` with fields `title: str` and `pages: int`. Create two `Book("Dune", 412)` instances and print whether they\'re equal. Expected: `True`.',starter:`from dataclasses import dataclass

# define Book as a frozen dataclass

# create two equal instances and print the equality result
`,expected:"True"},takeaways:["@dataclass auto-generates __init__, __repr__, __eq__ from field annotations.","field(default_factory=list) avoids the mutable-default-arg trap.","frozen=True makes instances hashable + immutable (usable as dict keys).","slots=True (3.10+) shrinks memory and prevents new attribute creation."],mistakes:["Using a mutable default directly: tags: list = [] — shares the list across instances.","Annotating without an actual type (just `x:` with no type) — silently treated as a class var.","Forgetting eq=False when you want identity comparison instead of value equality."],next:{label:"Type hints in practice",href:"#/courses/python-basics/p15"}},{id:"p15",title:"15. Type hints in practice",intro:"Type hints aren't enforced at runtime but power editors, mypy, and reduce bugs in big codebases. Use `list[int]`, `dict[str, int]`, `tuple[int, str]` (Python 3.9+). Compose with `|` for unions (`int | None`). Use `typing.Optional[T]`, `Callable[[int, int], int]`, `TypeAlias` for clarity. Pair with `mypy` or `pyright` for static checking.",code:`from typing import Callable

Number = int | float

def apply(fn: Callable[[Number], Number], xs: list[Number]) -> list[Number]:
    return [fn(x) for x in xs]

print(apply(lambda x: x * 2, [1, 2.5, 3]))`,exercise:{prompt:"Write `def lengths(words: list[str]) -> dict[str, int]` that returns a dict mapping each word to its length. Print `lengths([\"a\", \"bb\", \"ccc\"])`. Expected: `{'a': 1, 'bb': 2, 'ccc': 3}`.",starter:`# add type hints
def lengths(words):
    pass

print(lengths(["a", "bb", "ccc"]))
`,expected:"{'a': 1, 'bb': 2, 'ccc': 3}"},takeaways:["Type hints are static metadata — Python does not enforce them at runtime.","Modern syntax: list[int], dict[str, int], tuple[int, str] (3.9+); int | None (3.10+).","typing.Callable, typing.Protocol, typing.TypeAlias model advanced shapes.","Pair with mypy or pyright for static checking in CI."],mistakes:["Believing type hints validate at runtime — they do not, you need pydantic or a checker.","Using List[int] / Dict[str, int] (deprecated typing forms) instead of list[int] / dict[str, int].","Forgetting to import Optional / Callable from typing."],next:{label:"Dataclasses deep-dive",href:"#/courses/python-basics/p16"}},{id:"p16",title:"16. Dataclasses deep-dive",intro:"Beyond the basic @dataclass: `field(init=False, repr=False)` controls each field individually, `__post_init__` runs after `__init__` for derived state, `kw_only=True` (3.10+) forbids positional args, and `slots=True` switches to __slots__ for ~30-40% memory savings. Pair with `typing.ClassVar[T]` to declare class-level constants the dataclass machinery should ignore. Compare equality is value-based by default — useful for snapshot tests.",code:`from dataclasses import dataclass, field
from typing import ClassVar

@dataclass(slots=True)
class Vector:
    x: float
    y: float
    magnitude: float = field(init=False)
    DIM: ClassVar[int] = 2

    def __post_init__(self):
        self.magnitude = (self.x ** 2 + self.y ** 2) ** 0.5

v = Vector(3.0, 4.0)
print(v.magnitude, Vector.DIM)`,exercise:{prompt:'Define a dataclass `Circle` with field `radius: float`, a derived `area: float` set in `__post_init__` using 3.14159 * r * r, and an `__init__`-excluded field `units: str = "m²"`. Print `Circle(2.0).area` rounded to 2 decimals. Expected: `12.57`.',starter:`from dataclasses import dataclass, field

@dataclass
class Circle:
    radius: float
    # area: float = field(init=False)
    # units: str = field(default="m²")
    # def __post_init__(self):
    #     ...

c = Circle(2.0)
print(round(c.area, 2))
`,expected:"12.57"},takeaways:["__post_init__ runs after the generated __init__ — perfect for derived fields.","field(init=False) excludes a field from __init__ and gives it a default value.","slots=True shrinks memory but breaks multiple inheritance.","ClassVar[T] marks a class-level constant the dataclass should not turn into a field."],mistakes:["Mutating a frozen=True dataclass — raises FrozenInstanceError.","Reordering fields so a non-default field follows a default field — TypeError at class creation.","Forgetting field() when the default is a list/dict — shared mutable state across instances."],next:{label:"Performance profiling",href:"#/courses/python-basics/p17"}},{id:"p17",title:"17. Performance profiling",intro:"Measure before you optimize. `time.perf_counter()` is the right clock for wall-time deltas. `timeit.timeit(stmt, number=N)` runs a micro-benchmark with garbage-collection paused. `cProfile` profiles function-call counts and cumulative time; `pstats` formats the report. For memory, `tracemalloc.start(); snap = tracemalloc.take_snapshot()` shows the top allocators. The 80/20 rule applies: typically one or two hot lines dominate.",code:`import time
import timeit

N = 100_000
t0 = time.perf_counter()
total = sum(i * i for i in range(N))
print(f"sum took {(time.perf_counter() - t0) * 1000:.2f} ms, total = {total}")

list_time = timeit.timeit("[x*x for x in range(1000)]", number=1000)
gen_time = timeit.timeit("sum(x*x for x in range(1000))", number=1000)
print(f"list: {list_time:.3f}s, gen-sum: {gen_time:.3f}s")`,exercise:{prompt:"Use `time.perf_counter()` to measure how long `sum(range(100_000))` takes. Print the literal string `done` (timings vary per run, so we cannot match exact ms). Expected: `done`.",starter:`import time
t0 = time.perf_counter()
# compute sum(range(100_000))
elapsed = time.perf_counter() - t0
# print "done"
`,expected:"done"},takeaways:["time.perf_counter() is monotonic and the highest-resolution clock available.","timeit pauses GC and runs many trials — best for micro-benchmarks.","cProfile + pstats shows function-level cumulative time and call counts.","tracemalloc identifies memory hot-spots without external tools."],mistakes:["Using time.time() for benchmarks — it can run backwards on NTP adjustments.","Benchmarking inside Jupyter without %timeit — the harness adds variance.","Optimizing without a profiler — guessing the hot path is wrong more often than right."],next:{label:"Algorithms: Two pointers",href:"#/learn/algorithms/two-pointers"}}]},"javascript-basics":{id:"javascript-basics",title:"JavaScript Basics",language:"javascript",color:"#F7DF1E",blurb:"The ES2020+ subset that covers 95% of frontend + LeetCode JS.",estimatedHours:2,externalResources:[{title:"javascript.info — Modern JavaScript Tutorial",url:"https://javascript.info/",type:"blog"},{title:"MDN — Learn web development",url:"https://developer.mozilla.org/en-US/docs/Learn",type:"course"},{title:"You Don't Know JS (book series, GitHub free)",url:"https://github.com/getify/You-Dont-Know-JS",type:"book"}],lessons:[{id:"j1",title:"1. let, const & types",intro:"Modern JS uses `let` for variables that change and `const` for ones that don't. Avoid `var` — its scoping is confusing. The primitive types you'll use most are `number`, `string`, `boolean`, plus objects and arrays. `typeof x` tells you the type.",code:`const name = "PGcode";
let score = 42;
score += 8;
console.log(name, score, typeof score);`,exercise:{prompt:'Declare `subject` as "Math" with const, `score` as 95 with let, then log them in `Math: 95` format.',starter:`// your code here
`,expected:"Math: 95"},takeaways:["const for values that never reassign; let for ones that do; avoid var.",'typeof returns a string like "number", "string", "object", "function".',"JS has dynamic typing — a variable can hold any type, any time.","Numbers are 64-bit floats; use BigInt for integers above 2^53."],mistakes:["Using var — function-scoped and hoisted, easy to misuse.","Comparing with == — does coercion. Use === everywhere.",'Assuming `typeof null === "null"` — it is "object" (a long-standing bug).'],next:{label:"Conditionals",href:"#/courses/javascript-basics/j2"}},{id:"j2",title:"2. Conditionals",intro:"`if`/`else if`/`else` work like most languages. Use `===` and `!==` (strict equality) — never `==` (it does coercion). Ternaries `cond ? a : b` are great for one-liners.",code:`const temp = 72;
let label;
if (temp >= 80) label = "hot";
else if (temp >= 60) label = "nice";
else label = "cold";
console.log(label);`,exercise:{prompt:'Given `age = 17`, print "minor" if age < 18 else "adult".',starter:`const age = 17;
// log "minor" or "adult"
`,expected:"minor"},takeaways:["Always use === / !== — never ==.","Ternaries (cond ? a : b) are great for short branches.",'Falsy values: false, 0, "", null, undefined, NaN — everything else is truthy.',"?? gives a default only for null/undefined; || treats all falsy as missing."],mistakes:["`if (x = 5)` is an assignment, not comparison — always truthy.","Assuming 0 || x returns 0 — it does not, because 0 is falsy.","Switch fall-through without a break statement (sometimes intended, often a bug)."],next:{label:"Loops & arrays",href:"#/courses/javascript-basics/j3"}},{id:"j3",title:"3. Loops & arrays",intro:"Use `for (let i = 0; i < arr.length; i++)` for index-based loops, `for (const x of arr)` for value iteration. Arrays have `.map`, `.filter`, `.reduce`, `.forEach` — most algorithms become one-liners.",code:`const nums = [1, 2, 3, 4, 5];
const sum = nums.reduce((a, b) => a + b, 0);
const squares = nums.map(n => n * n);
console.log(sum, squares.join(","));`,exercise:{prompt:"Print the sum of even numbers from 1 to 10. Expected: 30.",starter:`let total = 0;
for (let i = 1; i <= 10; i++) {
  // add only evens
}
console.log(total);
`,expected:"30"},takeaways:["for...of iterates values; for...in iterates keys (rarely what you want on arrays).","Array methods .map / .filter / .reduce are pure — they return new arrays.","Spread (...) clones; Array.from(iter) turns an iterable into an array.",".forEach has no return value; chain with .map when building data."],mistakes:["for...in on an array — iterates string keys, includes inherited props.","Mutating an array inside .map — return a new value instead.","Off-by-one with arr.length: indices go 0..length-1."],next:{label:"Functions & arrows",href:"#/courses/javascript-basics/j4"}},{id:"j4",title:"4. Functions & arrows",intro:"Two forms: `function name(...)` (hoisted) and `const name = (...) => ...` (not hoisted). Arrows have no own `this` — they capture the enclosing one. Use default params for nice ergonomics.",code:`const square = n => n * n;
function greet(name, greeting = "Hello") {
  return \`\${greeting}, \${name}!\`;
}
console.log(square(7));
console.log(greet("Asha"));`,exercise:{prompt:"Define `factorial(n)` that returns n!. Print factorial(5). Expected: 120.",starter:`function factorial(n) {
  // compute n!
}
console.log(factorial(5));
`,expected:"120"},takeaways:["function declarations are hoisted; const arrow assignments are not.","Arrows have no own `this` — they inherit from the enclosing scope.","Default params: function f(x = 10).","Rest params: function f(...args) collects extras into an array."],mistakes:["Using `this` inside an arrow expecting it to bind to the caller — it does not.","Forgetting `return` in a multi-line arrow body — () => { x } returns undefined.","Recursing on a named function expression and getting `f is not defined` after refactoring."],next:{label:"Objects & destructuring",href:"#/courses/javascript-basics/j5"}},{id:"j5",title:"5. Objects & destructuring",intro:"Objects map string keys to values. Use dot or bracket access. Destructure to pull fields out concisely. Spread (`...`) clones and merges.",code:`const user = { name: "Asha", age: 28, role: "dev" };
const { name, role } = user;
const updated = { ...user, age: 29 };
console.log(name, role, updated.age);`,exercise:{prompt:"Given `{ a: 1, b: 2, c: 3 }`, log the sum of its values. Expected: 6.",starter:`const obj = { a: 1, b: 2, c: 3 };
// sum the values
`,expected:"6"},takeaways:["Object.keys / values / entries iterate object data safely.","Destructuring with renaming + defaults: const { x: a = 0 } = obj.","Spread on objects shallow-copies and merges: { ...a, ...b }.","Computed property keys: { [dynamicKey]: value }."],mistakes:["Spread is shallow — nested objects still share references.",'Using objects as map-keys — keys become string "[object Object]".',"Forgetting that destructure-default only fires for `undefined`, not `null`."],next:{label:"Map for counts",href:"#/courses/javascript-basics/j6"}},{id:"j6",title:"6. Map for counts",intro:"`Map` is JS's hash map — keys can be any type, iteration order is insertion order. Use `map.get(k)`, `map.set(k, v)`, `map.has(k)`. The most common interview pattern: count-the-thing.",code:`const counts = new Map();
for (const ch of "mississippi") {
  counts.set(ch, (counts.get(ch) || 0) + 1);
}
for (const [k, v] of counts) console.log(k, v);`,exercise:{prompt:"Given `[1,2,2,3,3,3]`, log the count of 3. Expected: 3.",starter:`const arr = [1,2,2,3,3,3];
const counts = new Map();
// build counts then log the count of 3
`,expected:"3"},takeaways:["Map keys can be any type, including objects and functions.","Map preserves insertion order during iteration.","map.get / set / has / delete are all O(1) amortized.","Prefer Map over a plain object when keys are dynamic or non-string."],mistakes:["Using `{}` as a hash map and tripping over inherited keys like __proto__.","Calling map[key] — that does not work; use map.get(key).","Forgetting that map.size is a property, not map.length or map.size()."],next:{label:"Strings & templates",href:"#/courses/javascript-basics/j7"}},{id:"j7",title:"7. Strings & template literals",intro:"Strings are primitives but have methods via auto-boxing. Slice with `slice(a, b)`, find with `indexOf` / `includes`, split with `split(sep)`, join with `arr.join(sep)`. Template literals `` `Hi ${name}` `` are the modern way to interpolate. Strings are immutable — every method returns a new string.",code:`const s = "the quick brown fox";
console.log(s.split(" ").length);
console.log(s.toUpperCase());
const name = "Asha";
console.log(\`Hi, \${name}!\`);`,exercise:{prompt:'Given `s = "hello world"`, log the string reversed. Expected: `dlrow olleh`.',starter:`const s = "hello world";
// log s reversed (hint: split, reverse, join)
`,expected:"dlrow olleh"},takeaways:["Strings are immutable primitives with method access via auto-boxing.","Template literals (`Hi ${name}`) handle interpolation cleanly.","Use String.raw for paths and regex sources to avoid escape hell.",'For unicode-aware iteration use [...str] or Array.from(str), not str.split("").'],mistakes:['split("") breaks surrogate-pair emoji and accented characters.',"Comparing strings with < / > works code-point-wise — not locale-aware.","Reassigning s[0] silently no-ops in non-strict mode."],next:{label:"Set & uniqueness",href:"#/courses/javascript-basics/j8"}},{id:"j8",title:"8. Set & uniqueness",intro:"`Set` holds unique values, with O(1) `has`/`add`/`delete`. Build from an iterable: `new Set([1,1,2])`. Convert back to an array with `[...set]` or `Array.from(set)`. Great for dedup + membership.",code:`const arr = [1, 2, 2, 3, 3, 3, 4];
const unique = [...new Set(arr)];
console.log(unique);
const seen = new Set();
seen.add("a");
console.log(seen.has("a"), seen.has("b"));`,exercise:{prompt:"Given `[1, 1, 2, 3, 5, 5, 8, 13]`, log the count of distinct values. Expected: 6.",starter:`const arr = [1, 1, 2, 3, 5, 5, 8, 13];
// log the distinct-count
`,expected:"6"},takeaways:["Set holds unique values; has / add / delete are O(1).","new Set(iterable) builds from any iterable in one line.","[...set] or Array.from(set) converts back.","Sets compare by reference for objects — { id: 1 } added twice still has size 2."],mistakes:["Expecting object equality to deduplicate — Set uses reference equality.","Calling set.length — it is set.size.","Iterating with for...in (gives string keys, not values)."],next:{label:"Promises & async/await",href:"#/courses/javascript-basics/j9"}},{id:"j9",title:"9. Promises & async/await",intro:"A Promise represents a future value. `async` functions implicitly return Promises; `await` pauses until a Promise resolves. Errors propagate through try/catch around `await`. Most modern APIs (`fetch`, `setTimeout` via wrappers) speak Promises.",code:`function delay(ms, value) {
  return new Promise(resolve => setTimeout(() => resolve(value), ms));
}
(async () => {
  const a = await delay(10, "hello");
  const b = await delay(10, "world");
  console.log(\`\${a} \${b}\`);
})();`,exercise:{prompt:'Use the `delay(ms, v)` helper to log "ready" after 10ms. Expected stdout: `ready`.',starter:`function delay(ms, value) {
  return new Promise(resolve => setTimeout(() => resolve(value), ms));
}
// write an async IIFE that awaits delay and logs the value
`,expected:"ready"},takeaways:["A Promise represents a future value; async functions return Promises.","await pauses inside an async fn until the awaited Promise settles.","Promise.all runs many in parallel; Promise.allSettled never short-circuits.","Errors surface via try/catch around await or .catch on the chain."],mistakes:["Forgetting await — you operate on the Promise object, not the value.","Mixing .then chains with await without catching rejections.","Awaiting inside a forEach — forEach ignores the returned promise; use for...of."],next:{label:"JSON & string formats",href:"#/courses/javascript-basics/j10"}},{id:"j10",title:"10. JSON & string formats",intro:"JSON is the lingua franca of web APIs. `JSON.stringify(obj)` serializes; `JSON.parse(str)` deserializes. Strings cannot represent functions, undefined, or circular references — only primitives, arrays, and plain objects.",code:`const user = { name: "Asha", age: 28, roles: ["dev", "admin"] };
const json = JSON.stringify(user);
console.log(json);
const back = JSON.parse(json);
console.log(back.name, back.roles.length);`,exercise:{prompt:'Given `JSON.parse(\'{"x":3,"y":4}\')`, log the sum x + y. Expected: 7.',starter:`const o = JSON.parse('{"x":3,"y":4}');
// log o.x + o.y
`,expected:"7"},takeaways:["JSON.stringify serializes only primitives, arrays, plain objects.","JSON.parse throws on malformed input — wrap in try/catch.","Use the replacer arg of stringify to redact secrets or skip fields.","JSON.stringify(obj, null, 2) prints indented output for logs."],mistakes:["Stringifying values containing Date — becomes a string, no reverse hydration.","Trying to stringify circular references — throws TypeError.","Trusting JSON.parse output shape without validation (use zod / yup in production)."],next:{label:"Map / filter / reduce",href:"#/courses/javascript-basics/j11"}},{id:"j11",title:"11. Map, filter, reduce",intro:"The trio every JS interview tests. `map(fn)` transforms each element. `filter(pred)` keeps matching elements. `reduce(fn, init)` accumulates a single value. Each returns a new array — never mutates.",code:`const nums = [1, 2, 3, 4, 5, 6];
const doubled = nums.map(n => n * 2);
const evens = nums.filter(n => n % 2 === 0);
const sum = nums.reduce((a, b) => a + b, 0);
console.log(doubled.join(","));
console.log(evens.join(","));
console.log(sum);`,exercise:{prompt:"Given `[1,2,3,4,5,6,7,8,9,10]`, log the sum of squares of even numbers. Expected: 220.",starter:`const nums = [1,2,3,4,5,6,7,8,9,10];
// chain filter().map().reduce()
`,expected:"220"},takeaways:[".map transforms; .filter keeps; .reduce collapses to one value.","Each call returns a new array — chain freely without mutating source.","reduce takes (acc, x) => newAcc and an init value; the init makes types stable.","Skip reduce when a simple for-loop reads more clearly."],mistakes:["Forgetting the reducer init value on a possibly-empty array — TypeError.","Returning undefined from .map by missing `return` in a block body.","Chaining many maps when one would do — costs an allocation each."],next:{label:"Closures",href:"#/courses/javascript-basics/j12"}},{id:"j12",title:"12. Closures",intro:"A closure is a function plus the variables it captured from its outer scope. The captured variables stay alive even after the outer function returns. Closures power module patterns, currying, and most callbacks.",code:`function counter() {
  let n = 0;
  return () => ++n;
}
const c = counter();
console.log(c(), c(), c());`,exercise:{prompt:"Write `makeAdder(x)` that returns a function adding x to its argument. Log makeAdder(5)(3). Expected: 8.",starter:`// function makeAdder(x) { ... }
// console.log(makeAdder(5)(3));
`,expected:"8"},takeaways:["A closure captures variables from its enclosing lexical scope.","Captured variables stay alive as long as the closure does.","Powers currying, partial application, module patterns, callbacks.","Each call to the outer function creates a fresh closure with its own captured state."],mistakes:["Capturing `i` from a var-based loop — every closure sees the final value. Use let.","Building memory leaks by holding closures over large data structures.","Confusing closure scope with `this` binding — they are independent."],next:{label:"Closures deep dive",href:"#/courses/javascript-basics/j13"}},{id:"j13",title:"13. Closures deep dive",intro:"Lexical scope means a function remembers where it was *defined*, not where it was called. An IIFE `(function(){...})()` runs immediately and gives you a private scope. The classic interview trap: a `var` loop that captures the same `i` for every callback — `let` fixes it because it is block-scoped.",code:`const makeCounter = (function () {
  let n = 0;
  return { inc: () => ++n, get: () => n };
})();
makeCounter.inc();
makeCounter.inc();
console.log(makeCounter.get());`,exercise:{prompt:"Write `once(fn)` that returns a wrapper running `fn` only the first time and returning the cached result thereafter. Call it twice with `() => 42` and log both results space-separated. Expected: `42 42`.",starter:`function once(fn) {
  // capture called + result via closure
}
const f = once(() => 42);
console.log(f(), f());
`,expected:"42 42"},takeaways:["Lexical scope binds to where a function is defined, not where it is called.","IIFEs (function(){})() give you a private scope without polluting globals.","Modules + IIFEs power the classic library wrapping pattern.","Closures + memoization underpin React hooks, signals, and observables."],mistakes:["Believing setTimeout inside a loop snapshots the var — only let / const do.","Leaking large captures by reference — destructure smaller pieces if needed.","Mixing `this` and closure scope — they answer different questions."],next:{label:"Prototypes",href:"#/courses/javascript-basics/j14"}},{id:"j14",title:"14. Prototypes & inheritance",intro:"Every JS object has a hidden `[[Prototype]]` link. Lookups walk that chain until they hit `null`. `Object.create(proto)` makes a new object with the given prototype. ES6 `class` is sugar over the same prototype machinery — no new inheritance model, just nicer syntax.",code:`class Animal {
  constructor(name) { this.name = name; }
  speak() { return \`\${this.name} makes a sound\`; }
}
class Dog extends Animal {
  speak() { return \`\${this.name} barks\`; }
}
const d = new Dog("Rex");
console.log(d.speak());
console.log(d instanceof Animal);`,exercise:{prompt:'Using `Object.create`, build `proto = { greet() { return "hi " + this.name; } }` and an object `u` with `name: "Asha"` whose prototype is `proto`. Log `u.greet()`. Expected: `hi Asha`.',starter:`const proto = { greet() { return "hi " + this.name; } };
// const u = Object.create(...)
// u.name = ...
// console.log(u.greet());
`,expected:"hi Asha"},takeaways:["Every object has a [[Prototype]] reachable via Object.getPrototypeOf.","Method lookups walk the prototype chain until they hit null.","class extends Base is sugar over the prototype mechanism.","Object.create(null) makes a truly empty dict with no inherited keys."],mistakes:["Mutating Object.prototype — pollutes every object on the page.","Forgetting super(args) inside a subclass constructor — ReferenceError on `this`.","Assuming `instanceof` works across realms (iframes) — it does not."],next:{label:"`this` binding",href:"#/courses/javascript-basics/j15"}},{id:"j15",title:"15. `this` binding",intro:"Four rules in priority order: `new` binds `this` to the new object; explicit `call`/`apply`/`bind` win next; implicit binding uses the object before the dot; otherwise `this` is `undefined` in strict mode (the global in sloppy). Arrow functions ignore all of this and capture `this` lexically — that is why they are the right choice inside `setTimeout` and `map` callbacks.",code:`const user = {
  name: "Asha",
  hi() { return \`hi \${this.name}\`; },
};
const loose = user.hi;
const bound = user.hi.bind(user);
console.log(user.hi());
console.log(bound());
console.log(user.hi.call({ name: "Ravi" }));`,exercise:{prompt:"Given `const obj = { x: 10, get() { return this.x; } }`, use `.call` to invoke `obj.get` with a `this` of `{ x: 99 }` and log the result. Expected: 99.",starter:`const obj = { x: 10, get() { return this.x; } };
// use obj.get.call(...) and log it
`,expected:"99"},takeaways:["new > explicit (call/apply/bind) > implicit (obj.fn()) > default (undefined or global).","Arrow functions lock in `this` lexically — perfect inside callbacks.",".bind returns a new bound function; .call / .apply invoke immediately.","Strict mode sets default `this` to undefined; sloppy mode uses global."],mistakes:["Detaching a method: const f = obj.method; f() — `this` is lost.","Using arrow methods on classes expecting `this` to bind — but then you cannot rebind.","Calling .bind in render — creates a new function each call, defeating memoization."],next:{label:"Error handling",href:"#/courses/javascript-basics/j16"}},{id:"j16",title:"16. Error handling",intro:"`throw` accepts any value but always throw an `Error` (or subclass) so you get a stack. `try/catch/finally` runs the `finally` block whether or not it threw — perfect for cleanup. Built-in subclasses: `TypeError`, `RangeError`, `SyntaxError`. In async code, `await` rethrows the rejection so a single `try/catch` covers it.",code:`function divide(a, b) {
  if (b === 0) throw new RangeError("divide by zero");
  return a / b;
}
try {
  console.log(divide(10, 0));
} catch (e) {
  console.log(e.name + ": " + e.message);
} finally {
  console.log("done");
}`,exercise:{prompt:'Wrap `JSON.parse("not json")` in try/catch and log "bad json" on failure. Expected: `bad json`.',starter:`try {
  // JSON.parse("not json")
} catch (e) {
  // log "bad json"
}
`,expected:"bad json"},takeaways:["Always throw Error or a subclass — get a stack trace.","finally runs no matter what — perfect for cleanup.","await inside try/catch handles rejected promises naturally.","Custom Error subclasses (class NotFoundError extends Error) clarify intent."],mistakes:["Throwing strings or numbers — no stack, brittle for catch blocks.","Empty catch blocks swallow bugs — log or rethrow.","Forgetting that errors in setTimeout callbacks bypass surrounding try/catch."],next:{label:"ES modules",href:"#/courses/javascript-basics/j17"}},{id:"j17",title:"17. ES modules",intro:'ESM is the standard module system. `export default x` exports one value imported as any name; `export const foo` is a named export imported via `import { foo }`. `import "./styles.css"` is a side-effect import that runs the module for its effects only. Because imports are static, bundlers can tree-shake — drop named exports nothing imports.',code:`// math.js
// export const add = (a, b) => a + b;
// export default (a, b) => a * b;
//
// main.js
// import multiply, { add } from "./math.js";
// console.log(add(2, 3), multiply(2, 3));
console.log("ESM is static + tree-shakeable");`,exercise:{prompt:"Simulate a module: define `add` and `mul` on an object `mod`, then destructure and log `add(2,3)` and `mul(2,3)` space-separated. Expected: `5 6`.",starter:`const mod = {
  add: (a, b) => a + b,
  mul: (a, b) => a * b,
};
// const { add, mul } = mod;
// console.log(add(2,3), mul(2,3));
`,expected:"5 6"},takeaways:["ESM is the standard: import / export, statically analysed.","Default export: one per module; named exports: many, by name.","Side-effect imports run a module without binding any name.","Tree-shaking drops unused named exports at build time."],mistakes:["Mixing ESM and CommonJS in the same file — bundlers tolerate it, runtimes may not.","Importing a default export by destructuring: import { default as x } is verbose; just import x.","Forgetting the .js extension in browser ESM — required."],next:{label:"TypeScript types & inference",href:"#/courses/typescript-basics/ts1"}}]},"java-basics":{id:"java-basics",title:"Java Basics",language:"java",color:"#E76F00",blurb:"The Java you need for FAANG interview solutions: types, control flow, methods, collections.",estimatedHours:2,externalResources:[{title:"dev.java — Java tutorial (Oracle)",url:"https://dev.java/learn/",type:"course"},{title:"Stanford CS106A Programming Methodology",url:"https://see.stanford.edu/Course/CS106A",type:"course"},{title:"Baeldung — Java articles index",url:"https://www.baeldung.com/java-tutorial",type:"blog"}],lessons:[{id:"jv1",title:"1. Hello + types",intro:"Every Java program lives in a class. `main` is the entry point. The primitive types are `int`, `long`, `double`, `boolean`, `char`. `String` is an object. Variables must be declared with a type.",code:`public class Main {
  public static void main(String[] args) {
    int x = 7;
    String name = "PGcode";
    System.out.println(name + ": " + x);
  }
}`,exercise:{prompt:"Print `Math: 95` using a String `subject` and an int `score`.",starter:`public class Main {
  public static void main(String[] args) {
    // declare subject and score
    // print "<subject>: <score>"
  }
}
`,expected:"Math: 95"},takeaways:["Every program lives in a class; main is the entry point.","Primitives (int, long, double, boolean, char) hold values directly.","String is a reference type; literals are interned.","System.out.println auto-flushes a newline."],mistakes:["Forgetting `public static` on main — JVM cannot find it.","Treating String like a primitive — use .equals, not ==.","Mixing int/long without an L suffix — silent overflow."],next:{label:"Control flow",href:"#/courses/java-basics/jv2"}},{id:"jv2",title:"2. Control flow",intro:"`if`/`else if`/`else`, plus `switch`. Use `==` only for primitives. For Strings use `.equals()`. Boolean operators: `&&`, `||`, `!`.",code:`public class Main {
  public static void main(String[] args) {
    int temp = 72;
    String label = (temp >= 80) ? "hot" : (temp >= 60 ? "nice" : "cold");
    System.out.println(label);
  }
}`,exercise:{prompt:'Print "minor" if age = 17 < 18 else "adult".',starter:`public class Main {
  public static void main(String[] args) {
    int age = 17;
    // print appropriate label
  }
}
`,expected:"minor"},takeaways:["if / else if / else, plus switch (modern switch expressions in 14+).","Use .equals for object equality; == compares references for objects.","Logical operators: && and || short-circuit; & and | do not.","Ternaries are fine for short branches."],mistakes:['Using == for String — passes for interned literals, fails for new String("...").',"Forgetting a `break` in classic switch — fall-through.","Assigning inside if: if (x = 5) — compile error in Java (unlike C)."],next:{label:"Methods + arrays",href:"#/courses/java-basics/jv3"}},{id:"jv3",title:"3. Methods + arrays",intro:"Methods need an explicit return type. Arrays are fixed-size: `int[] arr = new int[5]`. `arr.length` (not `arr.length()`). Use `Arrays.toString(arr)` to print.",code:`import java.util.Arrays;
public class Main {
  static int sum(int[] xs) { int s = 0; for (int x : xs) s += x; return s; }
  public static void main(String[] args) {
    int[] nums = {1, 2, 3, 4, 5};
    System.out.println(sum(nums));
    System.out.println(Arrays.toString(nums));
  }
}`,exercise:{prompt:"Compute sum of even numbers 1..10 and print 30.",starter:`public class Main {
  public static void main(String[] args) {
    int total = 0;
    for (int i = 1; i <= 10; i++) {
      // add only evens
    }
    System.out.println(total);
  }
}
`,expected:"30"},takeaways:["Method signature: returnType name(paramType param, ...) — always declared explicitly.","Arrays are fixed-size and length is a field, not a method.","Enhanced-for (for (int x : arr)) walks values without an index.","Arrays.toString / Arrays.deepToString print arrays sensibly."],mistakes:["Calling arr.length() — it is arr.length (no parens).","ArrayIndexOutOfBoundsException from off-by-one in loops.","Returning a primitive from a method declared to return its wrapper — auto-unboxing surprises."],next:{label:"HashMap",href:"#/courses/java-basics/jv4"}},{id:"jv4",title:"4. HashMap",intro:"`HashMap<K, V>` is Java's hash table. `put`, `get`, `containsKey`. `getOrDefault(key, default)` is your friend for counting. Don't forget the import.",code:`import java.util.HashMap;
import java.util.Map;
public class Main {
  public static void main(String[] args) {
    Map<Character, Integer> counts = new HashMap<>();
    for (char ch : "mississippi".toCharArray()) {
      counts.put(ch, counts.getOrDefault(ch, 0) + 1);
    }
    System.out.println(counts);
  }
}`,exercise:{prompt:"Build a count of [1,2,2,3,3,3] and print the count of 3. Expected: 3.",starter:`import java.util.HashMap;
import java.util.Map;
public class Main {
  public static void main(String[] args) {
    int[] arr = {1, 2, 2, 3, 3, 3};
    Map<Integer, Integer> counts = new HashMap<>();
    // count, then print counts.get(3)
  }
}
`,expected:"3"},takeaways:["HashMap<K, V> is O(1) average; null keys / values allowed.","getOrDefault(key, default) avoids manual containsKey checks.","putIfAbsent / computeIfAbsent enable concise lazy-init patterns.","Iteration order is undefined — use LinkedHashMap for insertion order."],mistakes:["Concurrent modification: iterating + put() throws ConcurrentModificationException.","Storing primitives directly — autoboxing turns them into Integer (slower, more memory).","Assuming TreeMap-style ordering — HashMap is unordered."],next:{label:"ArrayList",href:"#/courses/java-basics/jv5"}},{id:"jv5",title:"5. ArrayList",intro:"`ArrayList<T>` is Java's dynamic array. `add`, `get(i)`, `size()`, `set(i, x)`. Iterate with enhanced-for: `for (Integer x : list)`. Use `List.of(1, 2, 3)` for immutable factory.",code:`import java.util.ArrayList;
import java.util.List;
public class Main {
  public static void main(String[] args) {
    List<Integer> nums = new ArrayList<>(List.of(1, 2, 3, 4));
    nums.add(5);
    int sum = 0;
    for (int x : nums) sum += x;
    System.out.println(sum);
  }
}`,exercise:{prompt:"Build an ArrayList of evens from 2 to 10 (inclusive) and print its size. Expected: 5.",starter:`import java.util.ArrayList;
public class Main {
  public static void main(String[] args) {
    ArrayList<Integer> evens = new ArrayList<>();
    // populate evens
    System.out.println(evens.size());
  }
}
`,expected:"5"},takeaways:["ArrayList<T> wraps a resizing array — O(1) amortized add, O(n) middle insert.","Use List.of for immutable small literals; new ArrayList<>(...) when you need to mutate.","size() (not length); use get(i) and set(i, v) for index access.","Iterate with enhanced-for; remove safely via Iterator.remove()."],mistakes:["Modifying a List.of(...) — throws UnsupportedOperationException.","Calling .length on an ArrayList — it is .size().","Forgetting that subList shares storage with the original list."],next:{label:"Strings",href:"#/courses/java-basics/jv6"}},{id:"jv6",title:"6. Strings",intro:"Strings are immutable in Java. Common ops: `.length()`, `.charAt(i)`, `.substring(a, b)`, `.split(regex)`, `.toLowerCase()`, `.trim()`. Build long strings with `StringBuilder` (mutable, O(1) append) — concatenating `String` in a loop is O(n²).",code:`public class Main {
  public static void main(String[] args) {
    String s = "  Hello, PGcode!  ";
    System.out.println(s.trim().toLowerCase());
    StringBuilder sb = new StringBuilder();
    for (int i = 0; i < 5; i++) sb.append("ab");
    System.out.println(sb);
  }
}`,exercise:{prompt:'Given `String s = "the quick brown fox";`, print the word count (split on space). Expected: 4.',starter:`public class Main {
  public static void main(String[] args) {
    String s = "the quick brown fox";
    // print number of words
  }
}
`,expected:"4"},takeaways:["String is immutable — every method returns a new instance.","StringBuilder gives O(1) amortized append for hot loops.",".split takes a regex; escape special chars or use Pattern.quote.","String.format / String.join cover most formatting needs."],mistakes:["Concatenating in a loop with + — produces O(n²) garbage.",'split(".") matches everything because . is a regex meta-character.',"Comparing string content with == — passes for literals, fails for `new String`."],next:{label:"Collections framework",href:"#/courses/java-basics/jv7"}},{id:"jv7",title:"7. Collections framework",intro:"The Java Collections Framework gives you `List`, `Set`, `Queue`, `Deque`, `Map` interfaces with multiple implementations. Pick by ordering and performance needs: `ArrayList` for indexed access, `LinkedList`/`ArrayDeque` for queues, `HashSet` for fast membership, `TreeMap`/`TreeSet` for sorted keys, `PriorityQueue` for heap operations. `Collections.sort`, `Collections.reverse`, `Collections.unmodifiableList` are the common utilities.",code:`import java.util.*;
public class Main {
  public static void main(String[] args) {
    PriorityQueue<Integer> pq = new PriorityQueue<>();
    for (int x : new int[]{5, 2, 9, 1, 7}) pq.offer(x);
    StringBuilder out = new StringBuilder();
    while (!pq.isEmpty()) { out.append(pq.poll()).append(' '); }
    System.out.println(out.toString().trim());
  }
}`,exercise:{prompt:"Use a `TreeSet<Integer>` to deduplicate `{4, 1, 3, 1, 4, 2}` and print the elements in ascending order separated by spaces. Expected: `1 2 3 4`.",starter:`import java.util.*;
public class Main {
  public static void main(String[] args) {
    int[] arr = {4, 1, 3, 1, 4, 2};
    // dedupe with TreeSet and print elements separated by spaces
  }
}
`,expected:"1 2 3 4"},takeaways:["Interfaces (List, Set, Queue, Map) describe contracts; pick an impl by trade-off.","ArrayDeque is the modern Queue / Deque (avoid old Stack and LinkedList).","PriorityQueue is a binary heap; pass a Comparator for custom order.","TreeMap / TreeSet keep keys sorted — useful for range queries."],mistakes:["Choosing LinkedList for indexed access — get(i) is O(n).","Using HashSet but expecting iteration order to be stable.","Comparing wrapper Integers with == across boxing — fails outside [-128, 127]."],next:{label:"Streams",href:"#/courses/java-basics/jv8"}},{id:"jv8",title:"8. Streams",intro:"The Streams API (Java 8+) gives you a functional pipeline over collections. `.stream()`, then transform with `.map`, `.filter`, `.sorted`, `.distinct`, terminate with `.collect`, `.count`, `.reduce`, `.forEach`. Streams are lazy: nothing runs until the terminal operation. Use `mapToInt` / `sum` for primitive performance.",code:`import java.util.*;
import java.util.stream.*;
public class Main {
  public static void main(String[] args) {
    int sumOfSquaresOfEvens = IntStream.rangeClosed(1, 10)
        .filter(n -> n % 2 == 0)
        .map(n -> n * n)
        .sum();
    System.out.println(sumOfSquaresOfEvens);
  }
}`,exercise:{prompt:"Given the list `[3, 1, 4, 1, 5, 9, 2, 6]`, use a Stream to count distinct values greater than 2 and print the result. Expected: `5`.",starter:`import java.util.*;
import java.util.stream.*;
public class Main {
  public static void main(String[] args) {
    List<Integer> nums = List.of(3, 1, 4, 1, 5, 9, 2, 6);
    // count distinct values > 2 using streams, then print
  }
}
`,expected:"5"},takeaways:["Streams are lazy: nothing runs until a terminal op (collect/count/sum/reduce).","Use IntStream / LongStream / DoubleStream for primitive perf.","collect with Collectors.toList / toMap / groupingBy is the typical sink.","Stream pipelines are one-shot — they cannot be reused."],mistakes:["Reusing a stream after a terminal op — IllegalStateException.","Calling .parallel() on tiny work — overhead dominates.","Mixing stateful side-effects with stream ops — order is not guaranteed."],next:{label:"Optional",href:"#/courses/java-basics/jv9"}},{id:"jv9",title:"9. Optional",intro:"`Optional<T>` is the type-safe alternative to returning null. Build with `Optional.of(x)`, `Optional.empty()`, `Optional.ofNullable(maybe)`. Consume with `.isPresent()`, `.ifPresent(c)`, `.orElse(default)`, `.map(fn)`, `.flatMap(fn)`. Never call `.get()` without first checking presence — it throws if empty.",code:`import java.util.*;
public class Main {
  static Optional<Integer> firstEven(int[] xs) {
    for (int x : xs) if (x % 2 == 0) return Optional.of(x);
    return Optional.empty();
  }
  public static void main(String[] args) {
    System.out.println(firstEven(new int[]{1, 3, 4, 6}).orElse(-1));
    System.out.println(firstEven(new int[]{1, 3, 5}).orElse(-1));
  }
}`,exercise:{prompt:"Write `Optional<Integer> maxOf(int[] xs)` that returns the max or `Optional.empty()` for an empty array. Print `maxOf(new int[]{3,9,5}).orElse(-1)`. Expected: `9`.",starter:`import java.util.*;
public class Main {
  static Optional<Integer> maxOf(int[] xs) {
    // return max wrapped in Optional, or empty
    return Optional.empty();
  }
  public static void main(String[] args) {
    System.out.println(maxOf(new int[]{3,9,5}).orElse(-1));
  }
}
`,expected:"9"},takeaways:['Optional<T> models "value or absence" without nulls.',"orElse / orElseGet / orElseThrow each cover a different fallback strategy.","map / flatMap chain transformations without explicit null checks.","Never store Optional as a field — designed for return types only."],mistakes:["Calling .get() without isPresent — throws NoSuchElementException.","Using Optional.of(null) — throws NPE; use ofNullable.","Returning Optional<List<T>> — usually return an empty list instead."],next:{label:"Concurrency basics",href:"#/courses/java-basics/jv10"}},{id:"jv10",title:"10. Concurrency basics",intro:"Modern Java concurrency is built on the `ExecutorService` + `Future` model. Don't `new Thread()` manually. Create a pool with `Executors.newFixedThreadPool(n)`, submit `Callable<T>` tasks, collect `Future<T>` results. Always shut the pool down (`.shutdown()` + `.awaitTermination(...)`). Use `CompletableFuture` for composition (`.thenApply`, `.thenCombine`).",code:`import java.util.concurrent.*;
public class Main {
  public static void main(String[] args) throws Exception {
    ExecutorService pool = Executors.newFixedThreadPool(3);
    Future<Integer> a = pool.submit(() -> 1 + 2);
    Future<Integer> b = pool.submit(() -> 4 + 5);
    Future<Integer> c = pool.submit(() -> 10);
    System.out.println(a.get() + b.get() + c.get());
    pool.shutdown();
  }
}`,exercise:{prompt:"Use a fixed thread pool of 2 to submit two `Callable<Integer>` tasks: one returning `42`, one returning `8`. Print their sum. Expected: `50`.",starter:`import java.util.concurrent.*;
public class Main {
  public static void main(String[] args) throws Exception {
    ExecutorService pool = Executors.newFixedThreadPool(2);
    // submit two tasks, get results, print sum, shutdown
  }
}
`,expected:"50"},takeaways:["ExecutorService manages a thread pool — never `new Thread()` manually.","submit returns Future<T>; .get() blocks until the task completes.","CompletableFuture composes async ops with .thenApply / .thenCombine.","Always shut the pool down with shutdown + awaitTermination."],mistakes:["Forgetting shutdown — JVM hangs waiting for non-daemon threads.","Sharing mutable state across pool threads without synchronization.","Calling .get() with no timeout — risks indefinite blocking."],next:{label:"Generics deep-dive",href:"#/courses/java-basics/jv11"}},{id:"jv11",title:"11. Generics deep-dive",intro:"Generics let one class/method work over many types with compile-time safety. `class Box<T>` is parameterized; `<T extends Comparable<T>>` constrains. Wildcards: `List<? extends Number>` (read-only producer), `List<? super Integer>` (write consumer) — PECS: Producer Extends, Consumer Super. Type erasure means generics vanish at runtime; you can't do `new T[]` directly.",code:`import java.util.*;
public class Main {
  static <T extends Comparable<T>> T maxOf(List<T> xs) {
    T best = xs.get(0);
    for (T x : xs) if (x.compareTo(best) > 0) best = x;
    return best;
  }
  public static void main(String[] args) {
    System.out.println(maxOf(List.of(3, 9, 5, 1)));
    System.out.println(maxOf(List.of("pear", "apple", "kiwi")));
  }
}`,exercise:{prompt:"Write a generic `<T> List<T> reverse(List<T> xs)` that returns a new list in reverse order. Print `reverse(List.of(1,2,3))`. Expected: `[3, 2, 1]`.",starter:`import java.util.*;
public class Main {
  static <T> List<T> reverse(List<T> xs) {
    // build and return reversed list
    return new ArrayList<>();
  }
  public static void main(String[] args) {
    System.out.println(reverse(List.of(1,2,3)));
  }
}
`,expected:"[3, 2, 1]"},takeaways:["Generics give compile-time type safety with zero runtime cost (erasure).","<T extends Comparable<T>> constrains T to types you can compare.","PECS: Producer Extends, Consumer Super for wildcard usage.","You cannot create T[] or `instanceof T` due to type erasure."],mistakes:["Raw types (List instead of List<T>) — defeats type safety.","Mixing <? extends T> and writes — wildcards are read-only producers.","Forgetting that arrays are covariant but generics are invariant."],next:{label:"Lambda expressions",href:"#/courses/java-basics/jv12"}},{id:"jv12",title:"12. Lambda expressions",intro:"Lambdas are concise instances of functional interfaces — interfaces with one abstract method. Syntax: `(params) -> expr` or `(params) -> { ...; return v; }`. The compiler matches them to `Runnable`, `Comparator<T>`, `Function<T, R>`, `Predicate<T>`, `Consumer<T>`, `Supplier<T>`, etc. Method references (`String::length`, `System.out::println`) are even tighter. Lambdas capture effectively-final variables; you cannot reassign captured locals.",code:`import java.util.*;
import java.util.function.*;
public class Main {
  public static void main(String[] args) {
    Function<Integer, Integer> square = x -> x * x;
    Predicate<Integer> isPos = n -> n > 0;
    Comparator<String> byLen = Comparator.comparingInt(String::length);

    System.out.println(square.apply(7));
    System.out.println(isPos.test(-3));
    List<String> words = new ArrayList<>(List.of("a", "ccc", "bb"));
    words.sort(byLen);
    System.out.println(words);
  }
}`,exercise:{prompt:"Use a `BinaryOperator<Integer>` lambda that multiplies its two inputs, then call `.apply(6, 7)` and print the result. Expected: `42`.",starter:`import java.util.function.*;
public class Main {
  public static void main(String[] args) {
    BinaryOperator<Integer> mul = null; // replace with lambda
    // System.out.println(mul.apply(6, 7));
  }
}
`,expected:"42"},takeaways:["A lambda is a typed instance of a functional interface.","Method references (Class::method) are shorthand for forwarding lambdas.","Captured locals must be effectively final.","Common types: Function, Predicate, Consumer, Supplier, BiFunction."],mistakes:["Modifying a captured local — compile error.","Using `this` inside a lambda expecting enclosing-class binding — it does what you think (lexical), unlike anonymous inner classes.","Forgetting to import java.util.function.*."],next:{label:"Streams parallelism",href:"#/courses/java-basics/jv13"}},{id:"jv13",title:"13. Streams parallelism",intro:"Add `.parallel()` to a stream and the work is split across the common ForkJoinPool. This is great for CPU-bound work over large collections where the operations are stateless and associative. It is NOT a free win — overhead, ordering, and shared state can erase gains or introduce subtle bugs. Use `reduce(identity, op)` with associative ops; avoid `forEach` for ordered output (use `forEachOrdered`).",code:`import java.util.stream.*;
public class Main {
  public static void main(String[] args) {
    long total = IntStream.rangeClosed(1, 1_000_000).parallel()
        .filter(n -> n % 2 == 0)
        .mapToLong(n -> (long) n * n)
        .sum();
    System.out.println(total);
  }
}`,exercise:{prompt:"Use a parallel `IntStream.rangeClosed(1, 10)` to compute the sum of squares (1+4+9+...+100). Print the result. Expected: `385`.",starter:`import java.util.stream.*;
public class Main {
  public static void main(String[] args) {
    // parallel sum of squares 1..10
  }
}
`,expected:"385"},takeaways:[".parallel() splits work across the common ForkJoinPool.","Operations should be stateless, side-effect-free, and associative.","Use reduce(identity, op) for safe combination.","Parallelism pays off only beyond a few thousand elements of CPU work."],mistakes:["Mutating shared state inside a parallel stream — race conditions.","Using forEach when ordered output matters — use forEachOrdered.","Calling .parallel() on small data — overhead beats any speed-up."],next:{label:"Algorithms: Sorting",href:"#/learn/algorithms/heap-sort"}}]},"react-basics":{id:"react-basics",title:"React Basics",language:"javascript",color:"#61dafb",blurb:"Components, JSX, props vs state, events, controlled forms, lists & keys. Five lessons to get you productive.",estimatedHours:1.5,externalResources:[{title:"react.dev — Learn React",url:"https://react.dev/learn",type:"course"},{title:"Kent C. Dodds blog",url:"https://kentcdodds.com/blog",type:"blog"},{title:"Epic React (Kent C. Dodds, free intro)",url:"https://www.epicreact.dev/",type:"course"}],lessons:t},"typescript-basics":{id:"typescript-basics",title:"TypeScript Basics",language:"typescript",color:"#3178c6",blurb:"Types, interfaces, unions, generics — the typed JS subset that catches half your bugs at compile time.",estimatedHours:2,externalResources:[{title:"TypeScript Handbook",url:"https://www.typescriptlang.org/docs/handbook/intro.html",type:"book"},{title:"type-challenges",url:"https://github.com/type-challenges/type-challenges",type:"repo"},{title:"Total TypeScript (Matt Pocock) — free essentials",url:"https://www.totaltypescript.com/tutorials/typescript-essentials",type:"course"}],lessons:n},"go-basics":{id:"go-basics",title:"Go Basics",language:"go",color:"#00add8",blurb:"Go in 4 lessons: types, control flow, slices, maps. Enough to start solving LeetCode in Go.",estimatedHours:1.5,externalResources:[{title:"A Tour of Go",url:"https://go.dev/tour/welcome/1",type:"course"},{title:"Go by Example",url:"https://gobyexample.com/",type:"blog"},{title:"Effective Go",url:"https://go.dev/doc/effective_go",type:"book"}],lessons:s},"cpp-basics":{id:"cpp-basics",title:"C++ Basics",language:"cpp",color:"#00599C",blurb:"Modern C++17 essentials: types, control flow, vectors, unordered_map.",estimatedHours:2,externalResources:[{title:"learncpp.com — Modern C++ tutorial",url:"https://www.learncpp.com/",type:"book"},{title:"cppreference",url:"https://en.cppreference.com/w/",type:"book"},{title:"The Cherno — Modern C++ YT series",url:"https://www.youtube.com/c/TheChernoProject",type:"video"}],lessons:[{id:"cpp1",title:"1. Hello + types",intro:"Every C++ program needs `main()`. Use `#include <iostream>` for I/O and `using namespace std;` to skip prefixes. Common types: `int`, `long long`, `double`, `bool`, `string` (from `<string>`).",code:`#include <iostream>
#include <string>
using namespace std;
int main() {
  int x = 7;
  string name = "PGcode";
  cout << name << ": " << x << endl;
}`,exercise:{prompt:"Print `Math: 95` using a string `subject` and an int `score`.",starter:`#include <iostream>
#include <string>
using namespace std;
int main() {
  // your code here
}
`,expected:"Math: 95"},takeaways:["Every program has int main() returning 0 on success.","#include pulls in headers; <iostream> + <string> are the daily-driver pair.","cout << x << endl writes one item per <<; endl flushes.","Use long long for 64-bit ints; double for floating point."],mistakes:['Forgetting #include <string> — the literal "..." is a const char* without it.','Mixing <<: cout << "a" + "b" tries to add two const char* — undefined.',"Returning from main without 0 — most compilers default it, but be explicit."],next:{label:"Control flow",href:"#/courses/cpp-basics/cpp2"}},{id:"cpp2",title:"2. Control flow",intro:"`if`/`else if`/`else`, plus ternary `cond ? a : b`. `==` works for both primitives and `std::string`. Boolean operators: `&&`, `||`, `!`.",code:`#include <iostream>
using namespace std;
int main() {
  int temp = 72;
  cout << (temp >= 80 ? "hot" : (temp >= 60 ? "nice" : "cold")) << endl;
}`,exercise:{prompt:'Print "minor" if age = 17 < 18 else "adult".',starter:`#include <iostream>
using namespace std;
int main() {
  int age = 17;
  // print appropriate label
}
`,expected:"minor"},takeaways:["if / else if / else; switch needs break unless using [[fallthrough]].","== works for std::string (member operator); &&, ||, ! for logical ops.","Ternary cond ? a : b is an expression, useful in initializations.","C++17 `if (auto x = expr; cond)` scopes x to the if/else block."],mistakes:["Comparing C-style char* with == — compares pointers; use strcmp or std::string.","Switch fall-through without [[fallthrough]] — warning, sometimes a bug.","Assignment vs equality: if (x = 5) compiles, always true — enable -Wall."],next:{label:"Vectors + loops",href:"#/courses/cpp-basics/cpp3"}},{id:"cpp3",title:"3. Vectors + loops",intro:"`std::vector<T>` is the go-to dynamic array. `push_back`, `size()`, index with `[]`. Range-based for: `for (int x : v)`. Algorithm header has sort, etc.",code:`#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;
int main() {
  vector<int> nums = {3, 1, 4, 1, 5};
  sort(nums.begin(), nums.end());
  int sum = 0;
  for (int x : nums) sum += x;
  cout << sum << endl;
}`,exercise:{prompt:"Sum the evens from 1..10. Print 30.",starter:`#include <iostream>
using namespace std;
int main() {
  int total = 0;
  for (int i = 1; i <= 10; i++) {
    // add only evens
  }
  cout << total << endl;
}
`,expected:"30"},takeaways:["std::vector<T> is the default dynamic array — contiguous, cache-friendly.","push_back amortizes O(1); reserve(n) preallocates to skip reallocations.","Range-based for: for (auto& x : v) iterates by reference.","size() returns size_t (unsigned) — beware comparing with int."],mistakes:["Iterating with int i; i < v.size() — signed/unsigned compare warning.","Holding iterators across push_back — invalidates on reallocation.","Calling v[i] past the end — undefined behaviour; use .at(i) for bounds check."],next:{label:"unordered_map",href:"#/courses/cpp-basics/cpp4"}},{id:"cpp4",title:"4. unordered_map",intro:"`std::unordered_map<K, V>` is the hash table. Insert with `m[key] = v`; query with `m[key]` (default-constructs missing keys to zero — convenient for counts).",code:`#include <iostream>
#include <unordered_map>
#include <string>
using namespace std;
int main() {
  unordered_map<char, int> counts;
  for (char ch : string("mississippi")) counts[ch]++;
  cout << "m=" << counts['m'] << " i=" << counts['i'] << " s=" << counts['s'] << " p=" << counts['p'] << endl;
}`,exercise:{prompt:"Build a count of [1,2,2,3,3,3] and print the count of 3.",starter:`#include <iostream>
#include <unordered_map>
#include <vector>
using namespace std;
int main() {
  vector<int> arr = {1, 2, 2, 3, 3, 3};
  unordered_map<int, int> counts;
  // count, then cout << counts[3]
}
`,expected:"3"},takeaways:["unordered_map is hashed, O(1) average; map is a red-black tree, O(log n) and sorted.","m[k] default-constructs missing keys — convenient for counters.","Use m.find(k) when you must distinguish missing from zero.","Iteration order of unordered_map is unspecified."],mistakes:["Calling m[k] in a const context — does not compile (modifies the map).","Storing pointers into the map and relying on them after rehash — invalidated.","Using a non-hashable struct as key without a std::hash specialization."],next:{label:"Strings",href:"#/courses/cpp-basics/cpp5"}},{id:"cpp5",title:"5. Strings",intro:"`std::string` (from `<string>`) is mutable, with `+`/`+=` concatenation, `.length()`, `.substr(pos, n)`, indexing via `s[i]`. `std::getline(cin, s)` reads a whole line. For splits or fancy ops, you typically reach for `<sstream>` (`std::stringstream`).",code:`#include <iostream>
#include <sstream>
#include <string>
using namespace std;
int main() {
  string s = "the quick brown fox";
  stringstream ss(s);
  string word; int n = 0;
  while (ss >> word) n++;
  cout << n << endl;
}`,exercise:{prompt:'Given `string s = "hello world";`, print its length. Expected: 11.',starter:`#include <iostream>
#include <string>
using namespace std;
int main() {
  string s = "hello world";
  // print s.length()
}
`,expected:"11"},takeaways:["std::string owns its data and grows automatically.",".size() and .length() are equivalent; both O(1).","std::stringstream is the idiomatic way to split or parse formatted text.","string_view (C++17) is a non-owning view — cheaper for read-only params."],mistakes:["Mixing C-string functions (strlen, strcpy) with std::string — convert with .c_str().","Returning a string_view of a local — dangling reference.","Building strings with += inside a hot loop — fine for small N, costly for big N (reserve!)."],next:{label:"Sort & algorithms",href:"#/courses/cpp-basics/cpp6"}},{id:"cpp6",title:"6. Sort & algorithms",intro:"`<algorithm>` is full of one-liners: `sort(begin, end)`, `reverse`, `max_element`, `accumulate` (from `<numeric>`). Pass a custom comparator: `sort(v.begin(), v.end(), greater<int>())` for descending. These are how interview C++ stays terse.",code:`#include <iostream>
#include <vector>
#include <algorithm>
#include <numeric>
using namespace std;
int main() {
  vector<int> v = {3, 1, 4, 1, 5, 9, 2, 6};
  sort(v.begin(), v.end());
  cout << "min=" << v.front() << " max=" << v.back() << endl;
  cout << "sum=" << accumulate(v.begin(), v.end(), 0) << endl;
}`,exercise:{prompt:"Sort {5, 2, 9, 1, 7} ascending and print the second-smallest element. Expected: 2.",starter:`#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;
int main() {
  vector<int> v = {5, 2, 9, 1, 7};
  // sort and print v[1]
}
`,expected:"2"},takeaways:["<algorithm> works on iterator ranges (begin(), end()).","sort is O(n log n) (intro-sort); stable_sort keeps equal-element order.","accumulate (from <numeric>) folds with a binary op + init value.","Custom comparators: pass a lambda or a function-object."],mistakes:["Forgetting accumulate is in <numeric>, not <algorithm>.","Passing accumulate an int init when summing long long — overflow.","Comparator that returns true for equal items — strict weak ordering violated, UB."],next:{label:"Smart pointers",href:"#/courses/cpp-basics/cpp7"}},{id:"cpp7",title:"7. Smart pointers",intro:"Avoid raw `new`/`delete`. `std::unique_ptr<T>` owns its object exclusively and frees it on scope exit. `std::shared_ptr<T>` shares ownership via a ref-count. Create with `std::make_unique<T>(args...)` / `std::make_shared<T>(args...)`. Use `.get()` only when you need a raw pointer for legacy APIs.",code:`#include <iostream>
#include <memory>
using namespace std;
struct Node { int v; Node(int x):v(x){ cout << "alloc " << v << endl; } ~Node(){ cout << "free " << v << endl; } };
int main() {
  auto p = make_unique<Node>(7);
  cout << p->v << endl;
  // p goes out of scope, Node is freed automatically
}`,exercise:{prompt:"Create a `unique_ptr<int>` holding the value 42 using `make_unique`, then print the dereferenced value. Expected: `42`.",starter:`#include <iostream>
#include <memory>
using namespace std;
int main() {
  // create unique_ptr<int> with value 42 and print *p
}
`,expected:"42"},takeaways:["unique_ptr is the default — sole owner, zero overhead vs raw pointer.","shared_ptr ref-counts; useful when ownership is genuinely shared.","Prefer make_unique / make_shared over `new` for exception safety.","Pass smart pointers by const reference when you only need to use the object."],mistakes:["Creating two shared_ptr from the same raw pointer — double-free.","Cyclic shared_ptr — leak; break with weak_ptr.","Storing unique_ptr in a STL container that copies — moves only; use emplace."],next:{label:"Move semantics",href:"#/courses/cpp-basics/cpp8"}},{id:"cpp8",title:"8. Move semantics",intro:'Move semantics let you transfer ownership of resources without a deep copy. `std::move(x)` casts to an rvalue, signalling "you can steal from me." A move constructor `T(T&&) noexcept` takes the resource and leaves the source empty. Standard containers (`vector`, `string`, `unique_ptr`) already implement moves — passing by value into a function then doing `member = std::move(arg)` is the idiomatic way to absorb a parameter.',code:`#include <iostream>
#include <vector>
#include <string>
using namespace std;
int main() {
  vector<string> a = {"a", "b", "c"};
  vector<string> b = std::move(a); // moves contents, leaves a empty
  cout << "a.size=" << a.size() << " b.size=" << b.size() << endl;
}`,exercise:{prompt:'Move a `string s = "hello"` into a new string `t` using `std::move`. Print `t.length()` and `s.length()` (in that order, space-separated). Expected: `5 0`.',starter:`#include <iostream>
#include <string>
using namespace std;
int main() {
  string s = "hello";
  // move s into t, print "<t.len> <s.len>"
}
`,expected:"5 0"},takeaways:["std::move casts to rvalue — it does not actually move anything.","Move constructors steal resources and leave the source valid but unspecified.","Rule of zero: prefer types that need no custom destructor/copy/move.","Pass-by-value + std::move(arg) is the idiomatic absorb-parameter pattern."],mistakes:["Using a moved-from object — works for std::string but assume nothing.","std::move on a const — silently no-ops, surprising performance regression.","Returning std::move(x) at the end of a function — disables copy-elision (RVO)."],next:{label:"Templates",href:"#/courses/cpp-basics/cpp9"}},{id:"cpp9",title:"9. Templates",intro:"Templates are how C++ does generics — instantiated at compile time, zero runtime overhead. `template<typename T> T max3(T a, T b, T c)` accepts any comparable type. Class templates: `template<class T> struct Box { T value; };`. Constrain with concepts (C++20): `template<std::integral T>`. Use `auto` for return-type deduction when the body is straightforward.",code:`#include <iostream>
#include <string>
using namespace std;
template<typename T>
T maxOf(T a, T b) { return a > b ? a : b; }
int main() {
  cout << maxOf(3, 7) << endl;
  cout << maxOf(2.5, 1.2) << endl;
  cout << maxOf(string("apple"), string("pear")) << endl;
}`,exercise:{prompt:"Write a `template<typename T> T sum(T a, T b, T c)` returning a + b + c. Print `sum(1, 2, 3)`. Expected: `6`.",starter:`#include <iostream>
using namespace std;
// add template<typename T> T sum(T a, T b, T c);
int main() {
  cout << sum(1, 2, 3) << endl;
}
`,expected:"6"},takeaways:["Templates instantiate at compile time — zero runtime overhead.","template<typename T> and template<class T> are interchangeable.","C++20 concepts (std::integral, std::regular) constrain template parameters.","Template code must live in headers (or .ipp) — the compiler needs the body."],mistakes:["Placing template definitions in a .cpp — linker errors on use.","Long, opaque template error messages — use concepts to fail earlier.","Mixing template types: sum<int>(1, 2L) — explicit specialization confuses deduction."],next:{label:"STL algorithms + lambdas",href:"#/courses/cpp-basics/cpp10"}},{id:"cpp10",title:"10. STL algorithms + lambdas",intro:"`<algorithm>` works on iterator ranges (`v.begin(), v.end()`) and pairs beautifully with lambdas. `count_if`, `find_if`, `transform`, `all_of`, `any_of`, `for_each`. Lambda syntax: `[capture](params) { body }` — capture by value `[=]`, by reference `[&]`, or specific (`[x, &y]`). Returns are deduced; specify with `-> T` if needed.",code:`#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;
int main() {
  vector<int> v = {1, 2, 3, 4, 5, 6, 7, 8};
  int evens = count_if(v.begin(), v.end(), [](int x) { return x % 2 == 0; });
  cout << evens << endl;
}`,exercise:{prompt:"Given `vector<int> v = {3, 1, 4, 1, 5, 9, 2, 6};`, use `count_if` with a lambda to count elements greater than 3. Print the result. Expected: `4`.",starter:`#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;
int main() {
  vector<int> v = {3, 1, 4, 1, 5, 9, 2, 6};
  // count elements > 3 with count_if + lambda, print result
}
`,expected:"4"},takeaways:["Lambdas: [capture](params) -> ret { body }; capture by value [=] or reference [&].","<algorithm> + lambda turns most loops into one-liners.","Generic lambdas (C++14): auto params let one lambda handle multiple types.","std::function<R(Args...)> stores any callable but with allocation overhead."],mistakes:["Capturing by reference and storing the lambda past the captured scope — dangling.","Using auto for the result of count_if (it is iterator-based; this one returns difference_type).","Lambdas with state in [&] modifying counters that were meant local."],next:{label:"Algorithms: Two pointers",href:"#/learn/algorithms/two-pointers"}}]},"rust-basics":{id:"rust-basics",title:"Rust Basics",language:"rust",color:"#dea584",blurb:"Ownership, borrowing, traits, error handling, iterators, async — the Rust mental model in six lessons.",estimatedHours:2.5,externalResources:[{title:"The Rust Book",url:"https://doc.rust-lang.org/book/",type:"book"},{title:"Rustlings — exercises",url:"https://github.com/rust-lang/rustlings",type:"repo"},{title:"Rust By Example",url:"https://doc.rust-lang.org/rust-by-example/",type:"blog"}],lessons:[{id:"rs1",title:"1. Hello + types",intro:"Every Rust binary has `fn main()`. Variables are `let x = 5;` (immutable by default) — add `mut` to allow rebinding via assignment. Common scalar types: `i32`, `i64`, `f64`, `bool`, `char`, `&str`/`String`. Rust infers types but you can annotate: `let n: i64 = 42;`.",code:`fn main() {
    let x = 7;
    let name = "PGcode";
    let pi: f64 = 3.14159;
    println!("{name}: {x}, pi = {pi}");
}`,exercise:{prompt:'Declare `subject = "Math"` and `score = 95`, then print `Math: 95` using a format string.',starter:`fn main() {
    // your code
}
`,expected:"Math: 95"},takeaways:["let bindings are immutable by default; add mut to allow reassignment.","Type inference handles most cases; annotate when the compiler asks.",'println!("{var}") interpolates named values; {:?} prints Debug form.',"&str is a borrowed slice; String is owned and heap-allocated."],mistakes:["Trying to mutate without mut — compile error.","Mixing &str and String without conversion — use .to_string() or as &str.","Integer literals default to i32 — annotate if you need u64 or i128."],next:{label:"Ownership & borrowing",href:"#/courses/rust-basics/rs2"}},{id:"rs2",title:"2. Ownership & borrowing",intro:"Every value has exactly one owner. Assigning to another binding moves ownership (the original can no longer be used). Borrow with `&` (immutable, many at once) or `&mut` (exclusive, one at a time). The compiler enforces these rules at compile time — no garbage collector, no data races.",code:`fn main() {
    let s = String::from("hello");
    let len = take_len(&s);  // borrow, not move
    println!("{s} has length {len}");
}
fn take_len(s: &String) -> usize { s.len() }`,exercise:{prompt:'Write `fn first_char(s: &String) -> char` that returns the first character of `s`. In `main`, build `s = String::from("rust")`, call it, and print the result. Expected: `r`.',starter:`fn first_char(s: &String) -> char {
    // s.chars().next().unwrap()
    ' '
}
fn main() {
    let s = String::from("rust");
    println!("{}", first_char(&s));
}
`,expected:"r"},takeaways:["Every value has exactly one owner; assignment moves ownership.","&T gives a shared immutable borrow; &mut T gives an exclusive mutable borrow.","Borrow rules are enforced at compile time — no GC, no data races.","When the owner goes out of scope, the value is dropped."],mistakes:['Trying to use a moved value — "value borrowed after move" compile error.',"Holding &T and &mut T at the same time — exclusive borrow violated.","Confusing borrowing rules with reference counting — they are different mechanisms."],next:{label:"Structs + traits",href:"#/courses/rust-basics/rs3"}},{id:"rs3",title:"3. Structs + traits",intro:"Structs are named records: `struct Point { x: i32, y: i32 }`. Methods go in `impl Point { fn distance(&self, other: &Point) -> f64 { ... } }`. Traits are interfaces: define `trait Area { fn area(&self) -> f64; }` and `impl Area for Rectangle { ... }`. Derive common traits (`#[derive(Debug, Clone, PartialEq)]`) instead of writing them by hand.",code:`#[derive(Debug)]
struct Rect { w: f64, h: f64 }
impl Rect {
    fn area(&self) -> f64 { self.w * self.h }
}
fn main() {
    let r = Rect { w: 3.0, h: 4.0 };
    println!("{:.1}", r.area());
}`,exercise:{prompt:"Add a `perimeter(&self) -> f64` method to `Rect` returning `2*(w+h)`. Print `r.perimeter()` for `Rect { w: 3.0, h: 4.0 }`. Expected: `14`.",starter:`struct Rect { w: f64, h: f64 }
impl Rect {
    // add perimeter(&self) -> f64
}
fn main() {
    let r = Rect { w: 3.0, h: 4.0 };
    println!("{}", r.perimeter() as i32);
}
`,expected:"14"},takeaways:["Structs group related fields; impl blocks attach methods.","Traits are interfaces; impl Trait for Type implements them.","Derive common traits with #[derive(Debug, Clone, PartialEq)].","Default trait methods let you share behaviour across implementors."],mistakes:["Forgetting #[derive(Debug)] before using {:?} format.","Defining a method without &self / &mut self / self — compile error.","Trying to overload functions — Rust has no overloading; use traits or generics."],next:{label:"Result & Option",href:"#/courses/rust-basics/rs4"}},{id:"rs4",title:"4. Result & Option",intro:"Rust replaces exceptions with `Result<T, E>` for failures and `Option<T>` for absence. Match on them, or use `?` to propagate errors up. `unwrap()` panics if empty — fine for prototypes, never for production. `map`, `and_then`, `unwrap_or` chain cleanly.",code:`fn divide(a: i32, b: i32) -> Result<i32, String> {
    if b == 0 { Err(String::from("div by zero")) } else { Ok(a / b) }
}
fn main() {
    match divide(10, 2) {
        Ok(v) => println!("got {v}"),
        Err(e) => println!("error: {e}"),
    }
}`,exercise:{prompt:"Write `fn first_even(xs: &[i32]) -> Option<i32>` returning the first even number or `None`. Print `first_even(&[1, 3, 4, 6]).unwrap()`. Expected: `4`.",starter:`fn first_even(xs: &[i32]) -> Option<i32> {
    // iterate, return Some(x) on first even, else None
    None
}
fn main() {
    println!("{}", first_even(&[1, 3, 4, 6]).unwrap());
}
`,expected:"4"},takeaways:["Result<T, E> models recoverable errors; Option<T> models absence.","? propagates the error / None up to the caller.","match handles every variant; if let is the one-arm shortcut.","map / and_then / unwrap_or chain transformations cleanly."],mistakes:["Calling .unwrap on a probably-None value — panics in production.","Forgetting to import std::error::Error when defining custom errors.","Ignoring Result return value — the compiler warns; explicit `let _ = ` silences correctly."],next:{label:"Iterators & closures",href:"#/courses/rust-basics/rs5"}},{id:"rs5",title:"5. Iterators & closures",intro:"Iterators are lazy — chained ops like `.filter`, `.map`, `.take` build a pipeline that runs only on a terminal call (`.collect`, `.sum`, `.count`, `.fold`). Closures are anonymous functions: `|x| x * 2`. They can capture variables by reference (default), by mutable reference, or by value with `move |...|`. This is how Rust matches the expressiveness of Python comprehensions while staying zero-cost.",code:`fn main() {
    let total: i32 = (1..=10)
        .filter(|n| n % 2 == 0)
        .map(|n| n * n)
        .sum();
    println!("{total}");  // 4+16+36+64+100 = 220
}`,exercise:{prompt:"Given `let v = vec![3, 1, 4, 1, 5, 9, 2, 6];`, use iterators to count elements greater than 3 and print the result. Expected: `4`.",starter:`fn main() {
    let v = vec![3, 1, 4, 1, 5, 9, 2, 6];
    // chain filter + count
}
`,expected:"4"},takeaways:["Iterators are lazy — pipelines run only on a terminal call.","Closures: |x| expr, |x| { ...; v }; move |...| moves captures.",".collect::<Vec<_>>() materializes; .sum, .count, .fold accumulate.","Use .into_iter for owning iteration, .iter for shared refs, .iter_mut for mutable."],mistakes:["Forgetting to consume the iterator — nothing runs.","Using .iter when you need ownership; the compiler will tell you to use into_iter.","Building a Vec just to throw it away — chain .sum or .count instead."],next:{label:"Async with Tokio",href:"#/courses/rust-basics/rs6"}},{id:"rs6",title:"6. Async with Tokio",intro:"Rust async is poll-based and zero-cost. Declare `async fn` and `await` futures. You need a runtime to actually run them — Tokio is the standard. `#[tokio::main]` on `main` lets you await at the top level. `tokio::join!` runs multiple futures concurrently. Use async only for I/O — CPU-bound work should still use threads (`std::thread` or Rayon).",code:`// Conceptual — would compile with tokio in Cargo.toml.
// #[tokio::main]
// async fn main() {
//     let (a, b) = tokio::join!(
//         async { 1 + 2 },
//         async { 3 + 4 }
//     );
//     println!("{}", a + b);
// }
fn main() { println!("10"); }`,exercise:{prompt:"No runtime in the sandbox — print the literal `10` (which is what `tokio::join!(async{4}, async{6})` would produce when summed). Expected: `10`.",starter:`fn main() {
    // print 10
}
`,expected:"10"},takeaways:["async fn returns a future; .await drives it forward.","You need a runtime (Tokio, async-std) to actually execute futures.","tokio::join! polls multiple futures concurrently and collects their outputs.","Async excels at I/O; CPU-bound work belongs in threads or Rayon."],mistakes:["Forgetting to .await — you have a future, not a value.","Blocking inside async with std::thread::sleep — freezes the whole executor.","Mixing runtimes (Tokio + async-std) — they have incompatible reactors."],next:{label:"Lifetimes deep-dive",href:"#/courses/rust-basics/rs7"}},{id:"rs7",title:"7. Lifetimes deep-dive",intro:"Lifetimes are how Rust proves references stay valid. Most are elided automatically, but you must write them when a function takes multiple references and returns one. `fn longest<'a>(x: &'a str, y: &'a str) -> &'a str` says: \"the returned ref lives at least as long as the shorter of x and y.\" `'static` means \"lives for the whole program.\" Lifetimes do not change runtime behaviour — they are checked and erased at compile time.",code:`fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() >= y.len() { x } else { y }
}
fn main() {
    let a = String::from("alphabet");
    let b = String::from("bee");
    println!("{}", longest(&a, &b));
}`,exercise:{prompt:"Write `fn first_word<'a>(s: &'a str) -> &'a str` returning the substring up to the first space (or the whole string if no space). Print `first_word(\"hello world\")`. Expected: `hello`.",starter:`fn first_word<'a>(s: &'a str) -> &'a str {
    // find first ' ' and return &s[..idx], else s
    s
}
fn main() {
    println!("{}", first_word("hello world"));
}
`,expected:"hello"},takeaways:["Lifetimes annotate references so the borrow checker can prove validity.","Three elision rules cover most one-input / one-output cases.","'static means the reference lives for the entire program.","Lifetimes are erased at compile time — no runtime cost."],mistakes:["Adding lifetimes everywhere instead of letting elision work.","Tying two unrelated references together with a single 'a — over-constrains callers.","Confusing 'static with leaking memory — they are unrelated concepts."],next:{label:"Smart pointers (Box / Rc / Arc)",href:"#/courses/rust-basics/rs8"}},{id:"rs8",title:"8. Smart pointers: Box / Rc / Arc",intro:"Rust's smart pointers express different ownership models. `Box<T>` is heap allocation with a single owner — use for recursive types, large values, or trait objects (`Box<dyn Trait>`). `Rc<T>` is single-threaded reference counting; clone the Rc to share. `Arc<T>` is the atomic, thread-safe variant — clone freely across threads. For shared mutable state, combine with `RefCell` (single-threaded) or `Mutex`/`RwLock` (multi-threaded).",code:`use std::rc::Rc;
#[derive(Debug)]
enum List { Cons(i32, Box<List>), Nil }
fn main() {
    let xs = List::Cons(1, Box::new(List::Cons(2, Box::new(List::Nil))));
    println!("{:?}", xs);
    let a = Rc::new(String::from("shared"));
    let b = Rc::clone(&a);
    println!("count = {}, value = {}", Rc::strong_count(&a), b);
}`,exercise:{prompt:"Build `Rc<i32>` holding the value `7`, clone it twice, and print the strong reference count. Expected: `3`.",starter:`use std::rc::Rc;
fn main() {
    let a = Rc::new(7);
    // clone twice and print Rc::strong_count(&a)
}
`,expected:"3"},takeaways:["Box<T> owns one heap value; ideal for recursive enums and trait objects.","Rc<T> shares ownership in a single thread via reference counting.","Arc<T> is Rc's atomic, thread-safe cousin — pay for it only when needed.","For interior mutability: RefCell (single thread) or Mutex / RwLock (multi)."],mistakes:["Using Rc across threads — not Send. Use Arc.","Creating cycles with Rc / Arc — leaks; break with Weak.","Reaching for RefCell when a simple &mut would compile."],next:{label:"Error patterns",href:"#/courses/rust-basics/rs9"}},{id:"rs9",title:"9. Error patterns",intro:'Idiomatic Rust errors propagate with `?` and carry context. For application code, the `anyhow` crate gives a single `anyhow::Result<T>` plus `.context("doing X")`. For library code, define a custom error enum (manually or with `thiserror`) so callers can match on variants. `Box<dyn std::error::Error>` is the lowest-common-denominator type when crates differ. Convert errors with `From` implementations so `?` "just works."',code:`use std::num::ParseIntError;
#[derive(Debug)]
enum MyError { ParseFailed(String) }
impl From<ParseIntError> for MyError {
    fn from(e: ParseIntError) -> Self { MyError::ParseFailed(e.to_string()) }
}
fn parse_double(s: &str) -> Result<i32, MyError> {
    let n: i32 = s.parse()?; // ParseIntError -> MyError via From
    Ok(n * 2)
}
fn main() {
    match parse_double("21") {
        Ok(v) => println!("{v}"),
        Err(e) => println!("error: {e:?}"),
    }
}`,exercise:{prompt:'Write `fn safe_div(a: i32, b: i32) -> Result<i32, String>` returning `Err("divide by zero".into())` when b is 0, else `Ok(a / b)`. Print `safe_div(10, 2).unwrap()`. Expected: `5`.',starter:`fn safe_div(a: i32, b: i32) -> Result<i32, String> {
    // return Err on b == 0, Ok otherwise
    Ok(0)
}
fn main() {
    println!("{}", safe_div(10, 2).unwrap());
}
`,expected:"5"},takeaways:["Use ? to propagate errors with zero ceremony.","anyhow::Result for apps; custom enum (or thiserror) for libraries.","Implement From<OtherError> for MyError so ? converts automatically.",'Add .context("what was happening") to make production logs useful.'],mistakes:["Returning Box<dyn Error> from a library — callers lose the ability to match variants.","Stringly-typed errors — fine for app code, painful for libraries.","Calling .unwrap in production paths — prefer ? or explicit error handling."],next:{label:"Algorithms: Two pointers",href:"#/learn/algorithms/two-pointers"}}]}},r=[{id:"sql-basics",title:"SQL Basics",language:"sql",color:"#0075a8",blurb:"Learn SQL from scratch in 10 graded lessons. Familiar employees/departments schema; SELECT, WHERE, JOIN, GROUP BY, subqueries, CTEs.",href:"#/playground/sql/sql-basics",lessonCount:10,estimatedHours:2},{id:"sql-usda",title:"SQL: USDA Agricultural Production",language:"sql",color:"#0075a8",blurb:"Real-world SQL project mirroring the UC Davis Coursera final. 8 graded questions covering JOINs, CTEs, window functions.",href:"#/playground/sql/usda",lessonCount:8,estimatedHours:2},{id:"python-basics",title:e["python-basics"].title,language:"python",color:e["python-basics"].color,blurb:e["python-basics"].blurb,href:"#/courses/python-basics",lessonCount:e["python-basics"].lessons.length,estimatedHours:3},{id:"javascript-basics",title:e["javascript-basics"].title,language:"javascript",color:e["javascript-basics"].color,blurb:e["javascript-basics"].blurb,href:"#/courses/javascript-basics",lessonCount:e["javascript-basics"].lessons.length,estimatedHours:3},{id:"react-basics",title:e["react-basics"].title,language:"javascript",color:e["react-basics"].color,blurb:e["react-basics"].blurb,href:"#/courses/react-basics",lessonCount:e["react-basics"].lessons.length,estimatedHours:e["react-basics"].estimatedHours},{id:"java-basics",title:e["java-basics"].title,language:"java",color:e["java-basics"].color,blurb:e["java-basics"].blurb,href:"#/courses/java-basics",lessonCount:e["java-basics"].lessons.length,estimatedHours:2},{id:"cpp-basics",title:e["cpp-basics"].title,language:"cpp",color:e["cpp-basics"].color,blurb:e["cpp-basics"].blurb,href:"#/courses/cpp-basics",lessonCount:e["cpp-basics"].lessons.length,estimatedHours:2},{id:"typescript-basics",title:e["typescript-basics"].title,language:"typescript",color:e["typescript-basics"].color,blurb:e["typescript-basics"].blurb,href:"#/courses/typescript-basics",lessonCount:e["typescript-basics"].lessons.length,estimatedHours:e["typescript-basics"].estimatedHours},{id:"go-basics",title:e["go-basics"].title,language:"go",color:e["go-basics"].color,blurb:e["go-basics"].blurb,href:"#/courses/go-basics",lessonCount:e["go-basics"].lessons.length,estimatedHours:e["go-basics"].estimatedHours},{id:"rust-basics",title:e["rust-basics"].title,language:"rust",color:e["rust-basics"].color,blurb:e["rust-basics"].blurb,href:"#/courses/rust-basics",lessonCount:e["rust-basics"].lessons.length,estimatedHours:e["rust-basics"].estimatedHours}];export{r as C,e as a};
