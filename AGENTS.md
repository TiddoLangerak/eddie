## Code style

- **Strip types:** We use "strip types" (e.g. `tsc --noEmit` or a strip-only transpiler). Only use TypeScript features that can be removed without compilation—types, interfaces, type annotations, generics. Avoid constructs that require the TypeScript compiler to emit different JavaScript (e.g. enums that emit runtime code, `namespace`, or other emit-dependent features).
- **No `any` types or unsafe casts** (e.g. avoid `as unknown as T`, avoid `as T` etc.). Use proper typing, generics, or type guards. For runtime validation (e.g. JSON or form data), use eddie-parry. In tests, unsafe casts are fully acceptable. `as const` is fine.
- **Type top-level parry parsers:** When defining a parser that is the root of a parse (e.g. for a request body or a config file), pass the parsed value type as a generic (e.g. `const myParser = object<MyType>({ ... })`) so the parsed value type is clear and correct.
- **Keep methods/functions small.** Prefer single responsibility; extract helpers when logic grows. Functions shouldn't usually grow beyond 20loc, preferably even under 10loc, and ideally around 5loc.
- **Multiline blocks use braces:** Multiline if/else/for/while bodies must have braces; do not use single-statement shorthand for multiline bodies.
- **Prefer functional-style iteration** over vanilla `for` loops: use `.map()`, `.filter()`, `.reduce()`, `.find()`, `.some()`, `.every()` etc.
- **Dependencies:** We do not use third-party dependencies besides TypeScript. Prefer the standard library and in-repo packages; do not add new npm dependencies (e.g. no bundlers, no extra runtimes). When something would require a new dependency, solve it with TypeScript and Node built-ins instead.
- **General-purpose utilities go in eddie-utils:** When writing reusable helper functions (string manipulation, async utilities, object helpers, etc.), put them in `@tiddo/eddie-utils` rather than in application-specific packages. This keeps utilities discoverable and avoids duplication.
- **Format using Biome:** Run `npm run format` to format code.
- **Be conservative with comments:** Comments aren't usually needed. Prefer descriptive naming instead.
- **Don't explicitly assign `name` on custom errors.** Omit `this.name = "MyError"` in Error subclasses; use `instanceof` or properties to identify errors in tests and call sites.
- **No dynamic imports:** Put imports at the top, not inline.
- **Node built-ins:** Use the `node:` prefix for Node.js built-in modules (e.g. `node:fs/promises`, `node:path`, `node:assert`, `node:test`).
- **Relative imports:** Use explicit `.ts` extension in relative imports (e.g. `from "./foo.ts"`). Package imports use bare specifiers (e.g. `@tiddo/eddie-utils/files`).
- **Type-only imports:** Use `import type` for imports that are only used as types.
- **Write tests** for new and changed behavior. Co-locate or mirror test layout (e.g. `*.test.ts` / `*.spec.ts` next to source or under `__tests__`). Use `node:test` for tests that don't require a browser, and playwright for anything that needs the DOM. It's not needed to write type-level tests.
- **Use describe/it for tests.** Use Node’s built-in test runner: `describe` and `it` from `node:test`, and `strict as assert` from `node:assert`. Group tests by class/function under test. E.g. :
  ```
  describe('myFunction', () => {
      it('does something', () => {})
      it('does something else', () => {})
  })
  ```
- **Order functions so the file reads top-to-bottom.** Put entry-point or “main” logic at the top of the file; put helper/implementation functions below it. When reading from line 1 downward, the reader should see the high-level flow first and encounter each function’s definition only after seeing where it is called. Do not put helpers at the top and main logic at the bottom.
- **Disposable resources:** Prefer `await using` for resources that must be closed or torn down (e.g. servers, file handles, connections). Implement `Symbol.asyncDispose` on wrappers when the underlying value doesn't support it. Use a small helper that returns a promise of a disposable so tests and call sites can do `await using x = await withResource(...)` and get automatic cleanup on scope exit.
- **Only use ES modules.** This also means that script tags need to have `type="module"`.

---

## Agentic workflow

- **Plans should be focussed and to the point.** Avoid unnecessary detail or scope creep; keep task breakdowns concise and actionable.
- **Start with the model, especially for plans.** Before jumping into implementation, we first want to understand and model the underlying general principals involved. Ideally, the features are almost an emergent property of the model. So start with creating a model, and then build the fetaures on top of that.
- **Run `nvm use` before npm/node commands.** Always run `nvm use` before executing any npm or node commands to ensure the correct Node.js version is active.
- **Don't use `npx` commands.**. Instead, suggest operations to be added to `package.json` scripts.
- **Update AGENTS.md with new learnings.** You are constantly improving yourself, so keep updating AGENTS.md based on patterns encountered in sessions.
- **When in worktrees, commit changes.** When working in a worktree, commit your changes to a branch while making them.
- **Run checks when making changes**. We have `npm run checks` for checks without end-to-end tests, and `npm run checks:all` for checks with end-to-end tests.
- **Use `nvm use && npm run format` to fix formatting issues.** Note that this command changes files, so make sure to refresh your context.
- **Keep READMEs up-to-date when making changes.** When you change a package’s behavior, API, or scripts, update the relevant README so it stays accurate.
- **Use squash merges when merging.**
- **Merge to main locally.** If main is already checked out in another worktree, then cd into that twork tree, stash, merge, unstash.
