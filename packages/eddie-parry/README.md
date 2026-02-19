# @tiddo/eddie-parry

A small runtime validation library for parsing unknown data (e.g. JSON, form payloads) into typed values. Parsers take `unknown` and return a result that is either a typed value or an error with a path-aware message.

## Installation

From the monorepo root:

```bash
npm install
```

In another project, depend on `@tiddo/eddie-parry` and use the package exports.

## Usage

Define a parser by composing primitives and combinators, then call it with `unknown` data. Use `isOk` / `isErr` to handle the result.

```ts
import { isErr, object, string, number } from "@tiddo/eddie-parry";

const userParser = object({
  name: string(),
  age: number(),
});

const result = userParser(jsonFromNetwork);
if (isErr(result)) {
  console.error(result.error("body")); // e.g. "body.age is not a number"
  return;
}
// result.value is { name: string; age: number }
console.log(result.value.name, result.value.age);
```

## Result type

Every parser returns a `ParryResult<T>`:

- **Success:** `{ value: T }`
- **Failure:** `{ error: (ref: string) => string }` — call `error(ref)` to get a message; the ref is used as the path prefix (e.g. `"body"` → `"body.field is not a string"`).

Helpers:

- `isOk(result)` — type guard for success
- `isErr(result)` — type guard for failure
- `ok(value)` / `err((ref) => message)` — construct results (mainly for custom parsers)

## Parsers

### Primitives

| Parser    | Type      | Accepts                    |
| --------- | --------- | -------------------------- |
| `string()`| `string`  | string                     |
| `number()`| `number`  | number (rejects NaN)       |
| `boolean()` | `boolean` | true / false             |
| `date()`  | `Date`    | `Date` instance            |
| `unknown()` | `unknown` | any value (no validation) |

### Combinators

| Parser | Description |
|--------|-------------|
| `object(shape)` | Object with required keys; each key has a parser. Fails on non-object, missing keys, or when a field parser fails. Error messages include the path (e.g. `root.foo.bar`). |
| `array(parser)` | Array of values each parsed by `parser`. Fails on non-array or first element that fails (index in path, e.g. `arr[1]`). |
| `tuple(...parsers)` | Fixed-length array; each index has its own parser. Fails on wrong length or type at any index. |
| `literal(...values)` | Value must be one of the given primitives (string, number, boolean, null, undefined). |
| `oneOf(...parsers)` | Tries each parser in order; succeeds on first match, fails with combined message if all fail. |
| `optional(parser)` | Accepts `undefined` or the parsed value. |
| `nullable(parser)` | Accepts `null` or the parsed value. |
| `record()` | Any plain object; returns `Record<string, unknown>`. |

### Types

- `ParryParser<T>` — `(value: unknown) => ParryResult<T>`
- `ParryResult<T>` — `{ value: T } | { error: (ref: string) => string }`
- `ObjectShape<T>` — object type whose values are `ParryParser`s for the fields of `T` (used with `object()`)

## Examples

**Optional and nullable fields:**

```ts
const schema = object({
  name: string(),
  email: optional(string()),
  middleName: nullable(string()),
});
```

**Discriminated union (e.g. with `kind`):**

```ts
const variant = oneOf(
  object({ kind: literal("a"), value: string() }),
  object({ kind: literal("b"), count: number() })
);
```

**Nested structures:**

```ts
const parser = object({
  id: string(),
  tags: array(string()),
  meta: object({
    created: date(),
    flags: tuple(boolean(), boolean()),
  }),
});
```
