## Code style

- **Strip types:** We use "strip types" (e.g. `tsc --noEmit` or a strip-only transpiler). Only use TypeScript features that can be removed without compilation—types, interfaces, type annotations, generics. Avoid constructs that require the TypeScript compiler to emit different JavaScript (e.g. enums that emit runtime code, `namespace`, or other emit-dependent features).
- **No `any` types or unsafe casts** (e.g. avoid `as unknown as T`, avoid `as T` etc.). Use proper typing, generics, or type guards.
- **Keep methods/functions small.** Prefer single responsibility; extract helpers when logic grows.
- **Prefer functional-style iteration** over vanilla `for` loops: use `.map()`, `.filter()`, `.reduce()`, `.find()`, `.some()`, `.every()` etc.
- **Write tests** for new and changed behavior. Co-locate or mirror test layout (e.g. `*.test.ts` / `*.spec.ts` next to source or under `__tests__`). Tests aren't needed for `beancount-types`.
- **Dependencies:** Prefer minimal dependencies; use the standard library where it's enough; when adding a dependency, note why it's needed (e.g. in a comment or PR).
- **Format using Biome:** Run `npm run format` to format code.
- **Be conservative with comments:** Comments aren't usually needed. Prefer descriptive naming instead.
- **No dynamic imports:** Put imports at the top, not inline.

---

## Agentic workflow

- **Plans should be focussed and to the point.** Avoid unnecessary detail or scope creep; keep task breakdowns concise and actionable.
- **Run `nvm use` before npm/node commands.** Always run `nvm use` before executing any npm or node commands to ensure the correct Node.js version is active.
- **Don't use `npx` commands.**. Instead, suggest operations to be added to `package.json` scripts.
- **Update this file when useful.** If feedback during work suggests a new rule or clarification, add or adjust it in AGENTS.md and mention the change to the user.
