-- 81: add the Compilers & Interpreters module so /learn/compilers/* concepts can be imported.
-- Idempotent: ON CONFLICT (slug) DO UPDATE keeps the row in sync on re-run.
-- Position 37 slots it after Data Engineering (36). Covers the full front-to-back
-- pipeline of turning source text into running behaviour: lexing, parsing, semantic
-- analysis and type checking, and code generation / interpretation.

INSERT INTO public."PGcode_modules" (slug, name, description, position, icon)
VALUES (
  'compilers',
  'Compilers & Interpreters',
  'How a programming language turns text into behaviour — scanning raw source into a token stream with a hand-rolled lexer and DFA-style state machine, parsing those tokens into an abstract syntax tree with recursive descent and precedence climbing, walking the tree to resolve scopes and check types against a symbol table, and finally lowering the AST into a tree-walking interpreter, a stack-machine bytecode VM, or native code — with interactive lexer, parse-tree, type-checker, and code-generation visualizations.',
  37,
  'Binary'
)
ON CONFLICT (slug) DO UPDATE
  SET name = EXCLUDED.name,
      description = EXCLUDED.description,
      position = EXCLUDED.position,
      icon = EXCLUDED.icon;
