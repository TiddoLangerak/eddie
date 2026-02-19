import {
  type ParryParser,
  type ParryResult,
  err,
  isErr,
  isOk,
  ok,
} from "./types.ts";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isMemberOf<T>(set: Set<T>, value: unknown): value is T {
  return set.has(value as T);
}

export function string(): ParryParser<string> {
  return (value) => {
    if (typeof value === "string") return ok(value);
    return err((ref) => `${ref} is not a string`);
  };
}

export function number(): ParryParser<number> {
  return (value) => {
    if (typeof value === "number" && !Number.isNaN(value)) return ok(value);
    return err((ref) => `${ref} is not a number`);
  };
}

export function boolean(): ParryParser<boolean> {
  return (value) => {
    if (typeof value === "boolean") return ok(value);
    return err((ref) => `${ref} is not a boolean`);
  };
}

export function date(): ParryParser<Date> {
  return (value) => {
    if (value instanceof Date) return ok(value);
    return err((ref) => `${ref} is not a Date`);
  };
}

export type ObjectShape<T> = { [K in keyof T]: ParryParser<T[K]> };

export function object<T extends object>(
  shape: ObjectShape<T>,
): ParryParser<T> {
  return (value) => {
    if (!isRecord(value)) {
      return err((ref) => `${ref} is not an object`);
    }
    type Key = keyof T & string;
    const entries = Object.entries(shape) as [Key, ParryParser<T[Key]>][];
    const missingKey = entries.find(([key]) => !Object.hasOwn(value, key))?.[0];
    if (missingKey !== undefined) {
      return err((r) => `${r}.${missingKey} is missing`);
    }
    const reduced = entries.reduce<ParryResult<T>>(
      (acc, [key]) => {
        if (isErr(acc)) return acc;
        const parsed = shape[key](value[key]);
        if (isErr(parsed)) return err((r) => parsed.error(`${r}.${key}`));
        acc.value[key] = parsed.value;
        return acc;
      },
      ok({} as T),
    );
    if (isErr(reduced)) return reduced;
    return ok(reduced.value);
  };
}

export function array<T>(parser: ParryParser<T>): ParryParser<T[]> {
  return (value) => {
    if (!Array.isArray(value)) {
      return err((ref) => `${ref} is not an array`);
    }
    const out = new Array(value.length) as T[];
    const reduced = value.reduce<ParryResult<T[]>>((acc, item, i) => {
      if (isErr(acc)) return acc;
      const parsed = parser(item);
      if (isErr(parsed)) return err((r) => parsed.error(`${r}[${i}]`));
      acc.value[i] = parsed.value;
      return acc;
    }, ok(out));
    if (isErr(reduced)) return reduced;
    return ok(reduced.value);
  };
}

type TupleParsers<T extends unknown[]> = { [I in keyof T]: ParryParser<T[I]> };

export function tuple<T extends [unknown, ...unknown[]]>(
  ...parsers: TupleParsers<T>
): ParryParser<T> {
  return (value) => {
    if (!Array.isArray(value)) {
      return err((ref) => `${ref} is not an array`);
    }
    if (value.length !== parsers.length) {
      return err(
        (ref) =>
          `${ref} expected tuple of length ${parsers.length}, got ${value.length}`,
      );
    }
    const out = new Array(parsers.length) as T;
    const reduced = parsers.reduce<ParryResult<T>>((acc, p, i) => {
      if (isErr(acc)) return acc;
      const parsed = p(value[i]);
      if (isErr(parsed)) return err((r) => parsed.error(`${r}[${i}]`));
      acc.value[i] = parsed.value;
      return acc;
    }, ok(out));
    if (isErr(reduced)) return reduced;
    return ok(reduced.value);
  };
}

export function literal<
  const T extends string | number | boolean | null | undefined,
>(...values: T[]): ParryParser<T> {
  const set = new Set(values);
  return (value) => {
    if (isMemberOf(set, value)) return ok(value);
    return err(
      (ref) =>
        `${ref} expected one of [${[...set].map((v) => JSON.stringify(v)).join(", ")}], got ${JSON.stringify(value)}`,
    );
  };
}

export function oneOf<T>(...parsers: ParryParser<T>[]): ParryParser<T> {
  return (value) => {
    const results = parsers.map((p) => p(value));
    const firstOk = results.find((r): r is { value: T } => isOk(r));
    if (firstOk) return firstOk;
    const errors = results
      .filter((r): r is { error: (ref: string) => string } => isErr(r))
      .map((r) => r.error("value"));
    return err(
      (ref) => `${ref} did not match any variant: ${errors.join("; ")}`,
    );
  };
}

export function optional<T>(
  parser: ParryParser<T>,
): ParryParser<T | undefined> {
  return oneOf(parser, literal(undefined));
}

export function nullable<T>(parser: ParryParser<T>): ParryParser<T | null> {
  return oneOf(parser, literal(null));
}

export function record(): ParryParser<Record<string, unknown>> {
  return (value) => {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      return err((ref) => `${ref} is not an object`);
    }
    return ok(Object.fromEntries(Object.entries(value)));
  };
}

export function unknown(): ParryParser<unknown> {
  return (v) => ok(v);
}
