export type Predicate<T> = (value: T) => boolean;

export function not<T>(predicate: Predicate<T>): Predicate<T> {
  return (value: T) => !predicate(value);
}
