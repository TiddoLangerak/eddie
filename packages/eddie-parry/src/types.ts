export type ParryResult<T> = { value: T } | { error: (ref: string) => string };

export type ParryParser<T> = (value: unknown) => ParryResult<T>;

export function ok<T>(value: T): ParryResult<T> {
  return { value };
}

export function err<T>(message: (ref: string) => string): ParryResult<T> {
  return { error: message };
}

export function isOk<T>(result: ParryResult<T>): result is { value: T } {
  return "value" in result;
}

export function isErr<T>(
  result: ParryResult<T>,
): result is { error: (ref: string) => string } {
  return "error" in result;
}
