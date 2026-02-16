/**
 * Parser combinator infrastructure for Beancount parsing.
 */

export interface Position {
  line: number;
  column: number;
  offset: number;
}

export interface ParserState {
  input: string;
  position: Position;
  originalInput: string;
}

export type ParserSuccess<T> = { ok: true; value: T; state: ParserState };
export type ParserFailure = {
  ok: false;
  message: string;
  position: Position;
};
export type ParserResult<T> = ParserSuccess<T> | ParserFailure;

export type Parser<T> = (state: ParserState) => ParserResult<T>;

export type IntoStringParser =
  | Parser<string>
  | Parser<string | undefined>
  | string
  | RegExp;

export function intoStringParser(x: IntoStringParser): Parser<string> {
  if (typeof x === "string") return string(x);
  if (x instanceof RegExp) return regex(x);
  return map(x as Parser<string | undefined>, (s) => s ?? "");
}

function advancePosition(pos: Position, consumed: string): Position {
  let line = pos.line;
  let column = pos.column;
  let offset = pos.offset;
  for (let i = 0; i < consumed.length; i++) {
    if (consumed[i] === "\n") {
      line += 1;
      column = 1;
      offset += 1;
    } else {
      column += 1;
      offset += 1;
    }
  }
  return { line, column, offset };
}

export function createState(input: string): ParserState {
  return {
    input,
    position: { line: 1, column: 1, offset: 0 },
    originalInput: input,
  };
}

export function succeed<T>(value: T): Parser<T> {
  return (state) => ({ ok: true, value, state });
}

export function fail(message: string): Parser<never> {
  return (state) => ({
    ok: false,
    message,
    position: state.position,
  });
}

export function string(str: string): Parser<string> {
  return (state) => {
    const slice = state.input.slice(0, str.length);
    if (slice !== str) {
      return {
        ok: false,
        message: `Expected "${str}"`,
        position: state.position,
      };
    }
    const newPosition = advancePosition(state.position, str);
    return {
      ok: true,
      value: str,
      state: {
        ...state,
        input: state.input.slice(str.length),
        position: newPosition,
      },
    };
  };
}

export function regex(pattern: RegExp): Parser<string> {
  const anchored = new RegExp(
    pattern.source.startsWith("^") ? pattern.source : `^(?:${pattern.source})`,
    pattern.flags,
  );
  return (state) => {
    const match = state.input.match(anchored);
    if (!match) {
      return {
        ok: false,
        message: `Expected match for ${pattern}`,
        position: state.position,
      };
    }
    const value = match[0];
    if (value.length === 0) {
      return { ok: true, value: "", state };
    }
    const newPosition = advancePosition(state.position, value);
    return {
      ok: true,
      value,
      state: {
        ...state,
        input: state.input.slice(value.length),
        position: newPosition,
      },
    };
  };
}

export function map<T, U>(parser: Parser<T>, fn: (value: T) => U): Parser<U> {
  return (state) => {
    const result = parser(state);
    if (!result.ok) return result;
    return { ok: true, value: fn(result.value), state: result.state };
  };
}

export function join(parser: Parser<string[]>): Parser<string> {
  return map(parser, (parts) => parts.join(""));
}

export function stringSequence(
  first: IntoStringParser,
  ...rest: IntoStringParser[]
): Parser<string> {
  const parsers = [first, ...rest].map(intoStringParser);
  return join(sequence(parsers[0], ...parsers.slice(1)));
}

export function first<T1, T2>(p1: Parser<T1>, p2: Parser<T2>): Parser<T1 | T2>;
export function first<T>(parser: Parser<T>, ...parsers: Parser<T>[]): Parser<T>;
export function first<T>(
  parser: Parser<T>,
  ...parsers: Parser<T>[]
): Parser<T> {
  return (state) => {
    const failures: ParserFailure[] = [];
    const all = [parser, ...parsers];
    for (const p of all) {
      const result = p(state);
      if (result.ok) return result;
      failures.push(result);
    }
    const message = `All alternatives failed:\n${failures
      .map(
        (f, i) =>
          `  ${i + 1}) ${f.message} (line ${f.position.line}, column ${f.position.column})`,
      )
      .join("\n")}`;
    return { ok: false, message, position: state.position };
  };
}

export function sequence<TFirst, TRest extends unknown[]>(
  first: Parser<TFirst>,
  ...rest: { [K in keyof TRest]: Parser<TRest[K]> }
): Parser<[TFirst, ...TRest]> {
  const parsers = [first, ...rest] as Parser<unknown>[];
  return (state) => {
    const initial: ParserResult<unknown[]> = {
      ok: true,
      value: [],
      state,
    };
    const reduced = parsers.reduce<ParserResult<unknown[]>>((acc, p) => {
      if (!acc.ok) return acc;
      const result = p(acc.state);
      if (!result.ok) return result;
      return {
        ok: true,
        value: [...acc.value, result.value],
        state: result.state,
      };
    }, initial);
    return reduced as ParserResult<[TFirst, ...TRest]>;
  };
}

export function repeated<T>(parser: Parser<T>): Parser<T[]> {
  return (state) => {
    const results: T[] = [];
    let currentState = state;
    while (true) {
      const result = parser(currentState);
      if (!result.ok) break;
      if (result.state.position.offset <= currentState.position.offset) {
        throw new Error(
          `repeated: parser did not progress at line ${currentState.position.line}, column ${currentState.position.column}`,
        );
      }
      results.push(result.value);
      currentState = result.state;
    }
    return { ok: true, value: results, state: currentState };
  };
}

export function headTail<H, T>(
  headParser: Parser<H>,
  tailParser: Parser<T[]>,
): Parser<[H, ...T[]]> {
  return map(sequence(headParser, tailParser), ([first, rest]) => [
    first,
    ...rest,
  ]);
}

export function atLeastOnce<T>(parser: Parser<T>): Parser<T[]> {
  return headTail(parser, repeated(parser));
}

export function optional<T>(parser: Parser<T>): Parser<T | undefined> {
  return first(parser, succeed(undefined));
}

export function sepByAtLeastOnce<T>(
  parser: Parser<T>,
  separator: Parser<unknown>,
): Parser<T[]> {
  const sepThenItem = map(sequence(separator, parser), (pair) => pair[1]);
  return headTail(parser, repeated(sepThenItem));
}

export function sepBy<T>(
  parser: Parser<T>,
  separator: Parser<unknown>,
): Parser<T[]> {
  return first(sepByAtLeastOnce(parser, separator), succeed([] as T[]));
}

export function between<L, T, R>(
  open: Parser<L>,
  close: Parser<R>,
  parser: Parser<T>,
): Parser<T> {
  return map(sequence(open, parser, close), ([, value]) => value);
}

export function after<T>(
  prefix: Parser<unknown>,
  parser: Parser<T>,
): Parser<T> {
  return map(sequence(prefix, parser), ([, value]) => value);
}

export function peek<T>(parser: Parser<T>): Parser<T> {
  return (state) => {
    const result = parser(state);
    if (!result.ok) return result;
    return { ok: true, value: result.value, state };
  };
}

export function not<T>(parser: Parser<T>): Parser<null> {
  return (state) => {
    const result = parser(state);
    if (result.ok) {
      return {
        ok: false,
        message: "Unexpected match",
        position: state.position,
      };
    }
    return { ok: true, value: null, state };
  };
}

export function run<T>(parser: Parser<T>, input: string): ParserResult<T> {
  return parser(createState(input));
}
