## Code style

- **No `any` types or unsafe casts** (e.g. avoid `as unknown as T`). Use proper typing, generics, or type guards.
- **Keep methods/functions small.** Prefer single responsibility; extract helpers when logic grows.
- **Prefer functional-style iteration** over vanilla `for` loops: use `.map()`, `.filter()`, `.reduce()`, `.find()`, `.some()`, `.every()` etc. where it improves readability.
- **Write tests** for new and changed behavior. Co-locate or mirror test layout (e.g. `*.test.ts` / `*.spec.ts` next to source or under `__tests__`).
- **Dependencies:** Prefer minimal dependencies; use the standard library where it's enough; when adding a dependency, note why it's needed (e.g. in a comment or PR).

---

## Agentic workflow

- **Update this file when useful.** If feedback during work suggests a new rule or clarification, add or adjust it in AGENTS.md and mention the change to the user.
