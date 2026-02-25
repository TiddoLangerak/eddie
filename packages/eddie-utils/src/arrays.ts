import { not } from "./predicates.ts";

export function distinct<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}

export function findIndex<T>(
  arr: T[],
  predicate: (item: T) => boolean,
): number | null {
  const i = arr.findIndex(predicate);
  return i === -1 ? null : i;
}

export function takeWhile<T>(arr: T[], predicate: (item: T) => boolean): T[] {
  const i = findIndex(arr, not(predicate));
  return arr.slice(0, i ?? arr.length);
}

export function dropWhile<T>(arr: T[], predicate: (item: T) => boolean): T[] {
  const i = findIndex(arr, not(predicate));
  return arr.slice(i ?? arr.length);
}

export function dropEnd<T>(arr: T[], predicate: (item: T) => boolean): T[] {
  return dropWhile([...arr].reverse(), predicate).reverse();
}
