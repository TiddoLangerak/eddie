import { type ParryParser, type ParryResult, err, ok } from "./types.ts";

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

export function object<T extends Record<string, unknown>>(
  shape: ObjectShape<T>,
): ParryParser<T> {
  return (value) => {
    if (!isRecord(value)) {
      return err((ref) => `${ref} is not an object`);
    }
    const entries = Object.entries(shape) as [
      keyof T,
      ParryParser<T[keyof T]>,
    ][];
    const parsedEntries = entries.map(([key]) => ({
      key,
      parsed: shape[key](value[String(key)]),
    }));
    const firstErr = parsedEntries.find((entry) => "error" in entry.parsed);
    if (firstErr && "error" in firstErr.parsed) {
      const errResult = firstErr.parsed;
      const key = firstErr.key;
      return {
        error: (r) =>
          errResult.error(r ? `${r}.${String(key)}` : String(key)),
      };
    }
    const result = Object.fromEntries(
      parsedEntries
        .filter(
          (entry): entry is { key: keyof T; parsed: { value: T[keyof T] } } =>
            "value" in entry.parsed,
        )
        .map((entry) => [entry.key, entry.parsed.value]),
    ) as T;
    return ok(result);
  };
}

export function array<T>(parser: ParryParser<T>): ParryParser<T[]> {
  return (value) => {
    if (!Array.isArray(value)) {
      return err((ref) => `${ref} is not an array`);
    }
    const results = value.map((item, i) => ({ i, result: parser(item) }));
    const firstErr = results.find((entry) => "error" in entry.result);
    if (firstErr && "error" in firstErr.result) {
      const errResult = firstErr.result;
      const { i } = firstErr;
      return {
        error: (r) => errResult.error(r ? `${r}[${i}]` : `[${i}]`),
      };
    }
    const out: T[] = results.map((entry) =>
      "value" in entry.result ? entry.result.value : undefined,
    ) as T[];
    return ok(out);
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
    const results = parsers.map((p, i) => ({ i, result: p(value[i]) }));
    const firstErr = results.find((entry) => "error" in entry.result);
    if (firstErr && "error" in firstErr.result) {
      const errResult = firstErr.result;
      const { i } = firstErr;
      return {
        error: (r) => errResult.error(r ? `${r}[${i}]` : `[${i}]`),
      };
    }
    const out = results.map((entry) =>
      "value" in entry.result ? entry.result.value : undefined,
    );
    return ok(out as T);
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

export function union<T>(...parsers: ParryParser<T>[]): ParryParser<T> {
  return (value) => {
    const results = parsers.map((p) => p(value));
    const firstOk = results.find((r): r is { value: T } => "value" in r);
    if (firstOk) return firstOk;
    const errors = results
      .filter((r): r is { error: (ref: string) => string } => "error" in r)
      .map((r) => r.error("value"));
    return err(
      (ref) => `${ref} did not match any variant: ${errors.join("; ")}`,
    );
  };
}

export function optional<T>(
  parser: ParryParser<T>,
): ParryParser<T | undefined> {
  return union(parser, literal(undefined));
}

export function nullable<T>(parser: ParryParser<T>): ParryParser<T | null> {
  return union(parser, literal(null));
}
