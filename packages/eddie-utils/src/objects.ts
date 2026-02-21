export type PathSegment = string | number;

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

export function expectRecord(
  value: unknown,
  path: string,
): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new Error(`Expected object at path ${path}, got ${typeof value}`);
  }
  return value;
}

export function expectArray(value: unknown, path: string): unknown[] {
  if (!isArray(value)) {
    throw new Error(`Expected array at path ${path}, got ${typeof value}`);
  }
  return value;
}

export function getProperty(
  container: Record<string, unknown> | unknown[],
  key: PathSegment,
  path: string,
): unknown {
  if (typeof key === "number") {
    return expectArray(container, path)[key];
  }
  return expectRecord(container, path)[key];
}

export function setProperty(
  container: Record<string, unknown> | unknown[],
  key: PathSegment,
  value: unknown,
  path: string,
): void {
  if (typeof key === "number") {
    expectArray(container, path)[key] = value;
  } else {
    expectRecord(container, path)[key] = value;
  }
}

export function setValue(
  obj: Record<string, unknown> | unknown[],
  path: PathSegment[],
  value: unknown,
): void {
  const segments = path.slice(0, -1);
  const lastKey = path[path.length - 1];

  const parent = segments.reduce<Record<string, unknown> | unknown[]>(
    (current, key, i) => {
      const pathSoFar = path.slice(0, i).join(".");
      const next = getProperty(current, key, pathSoFar);

      if (next == null) {
        const nextKey = path[i + 1];
        const empty: Record<string, unknown> | unknown[] =
          typeof nextKey === "number" ? [] : {};
        setProperty(current, key, empty, pathSoFar);
        return empty;
      }

      if (!isRecord(next) && !isArray(next)) {
        const fullPath = path.slice(0, i + 1).join(".");
        throw new Error(
          `Expected object or array at path ${fullPath}, got ${typeof next}`,
        );
      }

      return next;
    },
    obj,
  );

  const parentPath = segments.join(".");
  setProperty(parent, lastKey, value, parentPath);
}
