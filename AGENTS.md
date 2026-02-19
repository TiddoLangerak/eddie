## Code style

- **Strip types:** We use "strip types" (e.g. `tsc --noEmit` or a strip-only transpiler). Only use TypeScript features that can be removed without compilation—types, interfaces, type annotations, generics. Avoid constructs that require the TypeScript compiler to emit different JavaScript (e.g. enums that emit runtime code, `namespace`, or other emit-dependent features).
- **No `any` types or unsafe casts** (e.g. avoid `as unknown as T`, avoid `as T` etc.). Use proper typing, generics, or type guards. For runtime validation (e.g. JSON or form data), use eddie-parry. In tests, unsafe casts are fully acceptable. `as const` is fine.
- **Keep methods/functions small.** Prefer single responsibility; extract helpers when logic grows.
- **Prefer functional-style iteration** over vanilla `for` loops: use `.map()`, `.filter()`, `.reduce()`, `.find()`, `.some()`, `.every()` etc.
- **Write tests** for new and changed behavior. Co-locate or mirror test layout (e.g. `*.test.ts` / `*.spec.ts` next to source or under `__tests__`). Tests aren't needed for `beancount-types`.
- **Dependencies:** Prefer minimal dependencies; use the standard library where it's enough; when adding a dependency, note why it's needed (e.g. in a comment or PR).
- **Format using Biome:** Run `npm run format` to format code.
- **Be conservative with comments:** Comments aren't usually needed. Prefer descriptive naming instead.
- **No dynamic imports:** Put imports at the top, not inline.
- **Node built-ins:** Use the `node:` prefix for Node.js built-in modules (e.g. `node:fs/promises`, `node:path`, `node:assert`, `node:test`).
- **Relative imports:** Use explicit `.ts` extension in relative imports (e.g. `from "./foo.ts"`). Package imports use bare specifiers (e.g. `@tiddo/eddie-utils/files`).
- **Type-only imports:** Use `import type` for imports that are only used as types.
- **Use describe/it for tests.** Use Node’s built-in test runner: `describe` and `it` from `node:test`, and `strict as assert` from `node:assert`. Group tests by class/function under test. E.g. :
  ```
  describe('myFunction', () => {
      it('does something', () => {})
      it('does something else', () => {})
  })
  ```
- **Order functions so the file reads top-to-bottom.** Put entry-point or “main” logic at the top of the file; put helper/implementation functions below it. When reading from line 1 downward, the reader should see the high-level flow first and encounter each function’s definition only after seeing where it is called. Do not put helpers at the top and main logic at the bottom.

---

## Agentic workflow

- **Plans should be focussed and to the point.** Avoid unnecessary detail or scope creep; keep task breakdowns concise and actionable.
- **Run `nvm use` before npm/node commands.** Always run `nvm use` before executing any npm or node commands to ensure the correct Node.js version is active.
- **Don't use `npx` commands.**. Instead, suggest operations to be added to `package.json` scripts.
- **Update AGENTS.md with new learnings.** You are constantly improving yourself, so keep updating AGENTS.md based on patterns encountered in sessions.
- **When in worktrees, commit changes.** When working in a worktree, commit your changes to a branch while making them.
- **Typecheck & test when making changes**. If either fails, fix it, unless requested not to.
- **Use `nvm use && npm run format` to fix formatting issues.** Note that this command changes files, so make sure to refresh your context.
- **Keep READMEs up-to-date when making changes.** When you change a package’s behavior, API, or scripts, update the relevant README so it stays accurate.
