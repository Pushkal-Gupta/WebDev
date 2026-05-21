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
  },
];

// ── Go Basics ────────────────────────────────────────────────────
const GO_LESSONS = [
  {
    id: 'go1', title: '1. Hello + types',
    intro: 'Go is statically typed but feels lightweight. `:=` declares + assigns with inferred type. Primitives: `int`, `int64`, `float64`, `bool`, `string`. Every program starts in `main()` of package `main`.',
    code: 'package main\nimport "fmt"\nfunc main() {\n  name := "PGcode"\n  x := 7\n  fmt.Println(name, x)\n}',
    exercise: {
      prompt: 'Print "Math: 95" using subject = "Math" and score = 95.',
      starter: 'package main\nimport "fmt"\nfunc main() {\n  // your code\n}\n',
      expected: 'Math: 95',
    },
  },
  {
    id: 'go2', title: '2. Control flow',
    intro: 'Go has no parens around conditions but braces are mandatory. `if x > 0 { ... }`. Loops are all `for`; while-style: `for cond { }`; infinite: `for { }`.',
    code: 'package main\nimport "fmt"\nfunc main() {\n  for i := 1; i <= 5; i++ { fmt.Println(i) }\n}',
    exercise: {
      prompt: 'Sum integers 1..10 and print the total. Expected: 55.',
      starter: 'package main\nimport "fmt"\nfunc main() {\n  total := 0\n  // loop\n  fmt.Println(total)\n}\n',
      expected: '55',
    },
  },
  {
    id: 'go3', title: '3. Slices',
    intro: 'Slices are dynamic arrays. `nums := []int{1,2,3}`. Append with `append(nums, 4)`. Length: `len(nums)`. Range over both index and value: `for i, v := range nums { … }`.',
    code: 'package main\nimport "fmt"\nfunc main() {\n  nums := []int{3, 1, 4, 1, 5}\n  total := 0\n  for _, v := range nums { total += v }\n  fmt.Println(total)\n}',
    exercise: {
      prompt: 'Given nums = []int{5, 2, 9, 1, 7}, print the maximum. Expected: 9.',
      starter: 'package main\nimport "fmt"\nfunc main() {\n  nums := []int{5, 2, 9, 1, 7}\n  // find max\n}\n',
      expected: '9',
    },
  },
  {
    id: 'go4', title: '4. Maps',
    intro: 'Go\'s hash map: `counts := map[string]int{}`. Read with `counts["key"]` (returns zero value if missing). Set with `counts[k] = v`. Test existence: `v, ok := counts[k]`.',
    code: 'package main\nimport "fmt"\nfunc main() {\n  c := map[rune]int{}\n  for _, ch := range "mississippi" { c[ch]++ }\n  fmt.Println(c)\n}',
    exercise: {
      prompt: 'Count occurrences of each value in []int{1,2,2,3,3,3} and print the count of 3. Expected: 3.',
      starter: 'package main\nimport "fmt"\nfunc main() {\n  arr := []int{1, 2, 2, 3, 3, 3}\n  c := map[int]int{}\n  // count, then print c[3]\n}\n',
      expected: '3',
    },
  },
  {
    id: 'go5', title: '5. Structs & methods',
    intro: 'Structs group fields. Methods attach to a receiver: `func (p Point) String() string`. Use a pointer receiver `(*Point)` when the method mutates the struct or the struct is large (avoid copy).',
    code: 'package main\nimport "fmt"\ntype Point struct { X, Y int }\nfunc (p Point) Sum() int { return p.X + p.Y }\nfunc main() {\n  p := Point{3, 4}\n  fmt.Println(p.Sum())\n}',
    exercise: {
      prompt: 'Add a Distance method that returns sqrt(X*X + Y*Y). Print Distance for Point{3,4}. Expected: 5.',
      starter: 'package main\nimport (\n  "fmt"\n  "math"\n)\ntype Point struct { X, Y int }\n// add method\nfunc main() {\n  p := Point{3, 4}\n  fmt.Println(math.Sqrt(0)) // replace\n}\n',
      expected: '5',
    },
  },
  {
    id: 'go6', title: '6. Interfaces',
    intro: 'Interfaces in Go are implicitly satisfied — no `implements` keyword. If a type has all the methods, it satisfies the interface. `interface{}` (or `any` in Go 1.18+) accepts anything.',
    code: 'package main\nimport "fmt"\ntype Stringer interface { String() string }\ntype P struct { x int }\nfunc (p P) String() string { return fmt.Sprintf("P(%d)", p.x) }\nfunc print(s Stringer) { fmt.Println(s) }\nfunc main() { print(P{x: 42}) }',
    exercise: {
      prompt: 'Define interface Shape with method Area() float64. Implement Square{side float64}. Print Square{4}.Area(). Expected: 16.',
      starter: 'package main\nimport "fmt"\n// type Shape ...\n// type Square ...\nfunc main() {\n  fmt.Println(0) // replace\n}\n',
      expected: '16',
    },
  },
  {
    id: 'go7', title: '7. Error handling',
    intro: 'Go uses explicit error returns: `result, err := op()`. Check `if err != nil { ... }`. Build errors with `errors.New("msg")` or `fmt.Errorf("ctx: %w", err)` to wrap.',
    code: 'package main\nimport (\n  "errors"\n  "fmt"\n)\nfunc div(a, b int) (int, error) {\n  if b == 0 { return 0, errors.New("divide by zero") }\n  return a / b, nil\n}\nfunc main() {\n  q, err := div(10, 2)\n  if err != nil { fmt.Println(err); return }\n  fmt.Println(q)\n}',
    exercise: {
      prompt: 'Modify so calling div(10, 0) prints "divide by zero" (and exits). Don\'t crash.',
      starter: 'package main\nimport (\n  "errors"\n  "fmt"\n)\nfunc div(a, b int) (int, error) { return 0, errors.New("divide by zero") }\nfunc main() {\n  _, err := div(10, 0)\n  if err != nil { fmt.Println(err) }\n}\n',
      expected: 'divide by zero',
    },
  },
  {
    id: 'go8', title: '8. Goroutines',
    intro: 'A goroutine is a lightweight green thread. `go f()` schedules f to run concurrently. Cheap — millions are fine. Use sync primitives (channels, WaitGroup) to coordinate.',
    code: 'package main\nimport (\n  "fmt"\n  "sync"\n)\nfunc main() {\n  var wg sync.WaitGroup\n  for i := 0; i < 3; i++ {\n    wg.Add(1)\n    go func(n int) { defer wg.Done(); fmt.Println(n) }(i)\n  }\n  wg.Wait()\n}',
    exercise: {
      prompt: 'Spawn 5 goroutines that each add their index to a shared counter (use sync.Mutex). Print the final counter. Expected: 10.',
      starter: 'package main\nimport (\n  "fmt"\n  "sync"\n)\nfunc main() {\n  var (\n    mu sync.Mutex\n    wg sync.WaitGroup\n    total int\n  )\n  // spawn\n  wg.Wait()\n  fmt.Println(total)\n}\n',
      expected: '10',
    },
  },
  {
    id: 'go9', title: '9. Channels',
    intro: 'Channels are typed pipes between goroutines. `ch := make(chan int)`. Send: `ch <- 7`. Receive: `v := <-ch`. Unbuffered channels block until both sender and receiver are ready (synchronous handoff).',
    code: 'package main\nimport "fmt"\nfunc main() {\n  ch := make(chan int, 3)\n  ch <- 1; ch <- 2; ch <- 3\n  close(ch)\n  total := 0\n  for v := range ch { total += v }\n  fmt.Println(total)\n}',
    exercise: {
      prompt: 'Start a goroutine that pushes 1..5 into a channel then closes it. The main goroutine sums and prints. Expected: 15.',
      starter: 'package main\nimport "fmt"\nfunc main() {\n  ch := make(chan int, 5)\n  // launch goroutine to push\n  total := 0\n  for v := range ch { total += v }\n  fmt.Println(total)\n}\n',
      expected: '15',
    },
  },
  {
    id: 'go10', title: '10. Defer & cleanup',
    intro: '`defer f()` schedules f to run when the surrounding function returns (even on panic). Use for closing files, releasing locks, restoring state. Deferred calls run in LIFO order.',
    code: 'package main\nimport "fmt"\nfunc main() {\n  defer fmt.Println("third")\n  defer fmt.Println("second")\n  fmt.Println("first")\n}',
    exercise: {
      prompt: 'Use defer to print "done" AFTER printing "work" inside main. Expected output:\nwork\ndone',
      starter: 'package main\nimport "fmt"\nfunc main() {\n  // your code\n}\n',
      expected: 'work\ndone',
    },
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
    lessons: TS_LESSONS,
  },

  // ── Go ───────────────────────────────────────────────────────────────
  'go-basics': {
    id: 'go-basics',
    title: 'Go Basics',
    language: 'go',
    color: '#00add8',
    blurb: 'Go in 4 lessons: types, control flow, slices, maps. Enough to start solving LeetCode in Go.',
    estimatedHours: 1.5,
    lessons: GO_LESSONS,
  },

  // ── C++ ──────────────────────────────────────────────────────────────
  'cpp-basics': {
    id: 'cpp-basics',
    title: 'C++ Basics',
    language: 'cpp',
    color: '#00599C',
    blurb: 'Modern C++17 essentials: types, control flow, vectors, unordered_map.',
    estimatedHours: 2,
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
      },
    ],
  },

  // ── Rust ─────────────────────────────────────────────────────────────
  'rust-basics': {
    id: 'rust-basics',
    title: 'Rust Basics',
    language: 'rust',
    color: '#dea584',
    blurb: 'Ownership, borrowing, traits, error handling, iterators, async — the Rust mental model in six lessons.',
    estimatedHours: 2.5,
    lessons: [
      {
        id: 'rs1',
        title: '1. Hello + types',
        intro:
          'Every Rust binary has `fn main()`. Variables are `let x = 5;` (immutable by default) — add `mut` to allow rebinding via assignment. Common scalar types: `i32`, `i64`, `f64`, `bool`, `char`, `&str`/`String`. Rust infers types but you can annotate: `let n: i64 = 42;`.',
        code:
          'fn main() {\n    let x = 7;\n    let name = "PGcode";\n    let pi: f64 = 3.14159;\n    println!("{name}: {x}, pi = {pi}");\n}',
        exercise: {
          prompt: 'Declare `subject = "Math"` and `score = 95`, then print `Math: 95` using a format string.',
          starter: 'fn main() {\n    // your code\n}\n',
          expected: 'Math: 95',
        },
      },
      {
        id: 'rs2',
        title: '2. Ownership & borrowing',
        intro:
          'Every value has exactly one owner. Assigning to another binding moves ownership (the original can no longer be used). Borrow with `&` (immutable, many at once) or `&mut` (exclusive, one at a time). The compiler enforces these rules at compile time — no garbage collector, no data races.',
        code:
          'fn main() {\n    let s = String::from("hello");\n    let len = take_len(&s);  // borrow, not move\n    println!("{s} has length {len}");\n}\nfn take_len(s: &String) -> usize { s.len() }',
        exercise: {
          prompt: 'Write `fn first_char(s: &String) -> char` that returns the first character of `s`. In `main`, build `s = String::from("rust")`, call it, and print the result. Expected: `r`.',
          starter: 'fn first_char(s: &String) -> char {\n    // s.chars().next().unwrap()\n    \' \'\n}\nfn main() {\n    let s = String::from("rust");\n    println!("{}", first_char(&s));\n}\n',
          expected: 'r',
        },
      },
      {
        id: 'rs3',
        title: '3. Structs + traits',
        intro:
          'Structs are named records: `struct Point { x: i32, y: i32 }`. Methods go in `impl Point { fn distance(&self, other: &Point) -> f64 { ... } }`. Traits are interfaces: define `trait Area { fn area(&self) -> f64; }` and `impl Area for Rectangle { ... }`. Derive common traits (`#[derive(Debug, Clone, PartialEq)]`) instead of writing them by hand.',
        code:
          '#[derive(Debug)]\nstruct Rect { w: f64, h: f64 }\nimpl Rect {\n    fn area(&self) -> f64 { self.w * self.h }\n}\nfn main() {\n    let r = Rect { w: 3.0, h: 4.0 };\n    println!("{:.1}", r.area());\n}',
        exercise: {
          prompt: 'Add a `perimeter(&self) -> f64` method to `Rect` returning `2*(w+h)`. Print `r.perimeter()` for `Rect { w: 3.0, h: 4.0 }`. Expected: `14`.',
          starter: 'struct Rect { w: f64, h: f64 }\nimpl Rect {\n    // add perimeter(&self) -> f64\n}\nfn main() {\n    let r = Rect { w: 3.0, h: 4.0 };\n    println!("{}", r.perimeter() as i32);\n}\n',
          expected: '14',
        },
      },
      {
        id: 'rs4',
        title: '4. Result & Option',
        intro:
          'Rust replaces exceptions with `Result<T, E>` for failures and `Option<T>` for absence. Match on them, or use `?` to propagate errors up. `unwrap()` panics if empty — fine for prototypes, never for production. `map`, `and_then`, `unwrap_or` chain cleanly.',
        code:
          'fn divide(a: i32, b: i32) -> Result<i32, String> {\n    if b == 0 { Err(String::from("div by zero")) } else { Ok(a / b) }\n}\nfn main() {\n    match divide(10, 2) {\n        Ok(v) => println!("got {v}"),\n        Err(e) => println!("error: {e}"),\n    }\n}',
        exercise: {
          prompt: 'Write `fn first_even(xs: &[i32]) -> Option<i32>` returning the first even number or `None`. Print `first_even(&[1, 3, 4, 6]).unwrap()`. Expected: `4`.',
          starter: 'fn first_even(xs: &[i32]) -> Option<i32> {\n    // iterate, return Some(x) on first even, else None\n    None\n}\nfn main() {\n    println!("{}", first_even(&[1, 3, 4, 6]).unwrap());\n}\n',
          expected: '4',
        },
      },
      {
        id: 'rs5',
        title: '5. Iterators & closures',
        intro:
          'Iterators are lazy — chained ops like `.filter`, `.map`, `.take` build a pipeline that runs only on a terminal call (`.collect`, `.sum`, `.count`, `.fold`). Closures are anonymous functions: `|x| x * 2`. They can capture variables by reference (default), by mutable reference, or by value with `move |...|`. This is how Rust matches the expressiveness of Python comprehensions while staying zero-cost.',
        code:
          'fn main() {\n    let total: i32 = (1..=10)\n        .filter(|n| n % 2 == 0)\n        .map(|n| n * n)\n        .sum();\n    println!("{total}");  // 4+16+36+64+100 = 220\n}',
        exercise: {
          prompt: 'Given `let v = vec![3, 1, 4, 1, 5, 9, 2, 6];`, use iterators to count elements greater than 3 and print the result. Expected: `4`.',
          starter: 'fn main() {\n    let v = vec![3, 1, 4, 1, 5, 9, 2, 6];\n    // chain filter + count\n}\n',
          expected: '4',
        },
      },
      {
        id: 'rs6',
        title: '6. Async with Tokio',
        intro:
          'Rust async is poll-based and zero-cost. Declare `async fn` and `await` futures. You need a runtime to actually run them — Tokio is the standard. `#[tokio::main]` on `main` lets you await at the top level. `tokio::join!` runs multiple futures concurrently. Use async only for I/O — CPU-bound work should still use threads (`std::thread` or Rayon).',
        code:
          '// Conceptual — would compile with tokio in Cargo.toml.\n// #[tokio::main]\n// async fn main() {\n//     let (a, b) = tokio::join!(\n//         async { 1 + 2 },\n//         async { 3 + 4 }\n//     );\n//     println!("{}", a + b);\n// }\nfn main() { println!("10"); }',
        exercise: {
          prompt: 'No runtime in the sandbox — print the literal `10` (which is what `tokio::join!(async{4}, async{6})` would produce when summed). Expected: `10`.',
          starter: 'fn main() {\n    // print 10\n}\n',
          expected: '10',
        },
      },
    ],
  },
};

// Surface metadata for the courses index (cards).
export const COURSE_CARDS = [
  {
    id: 'sql-basics',
    title: 'SQL Basics',
    language: 'sql',
    color: '#0075a8',
    blurb: 'Learn SQL from scratch in 10 graded lessons. Familiar employees/departments schema; SELECT, WHERE, JOIN, GROUP BY, subqueries, CTEs.',
    href: '#/playground/sql/sql-basics',
    lessonCount: 10,
    estimatedHours: 2,
  },
  {
    id: 'sql-usda',
    title: 'SQL: USDA Agricultural Production',
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
];
