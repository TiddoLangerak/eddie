/**
 * Lexical (token-level) parsers for Beancount.
 */

import {
  after,
  between,
  first,
  map,
  optional,
  regex,
  sepByAtLeastOnce,
  string,
  stringSequence,
} from "./combinators.ts";
import type { Parser } from "./combinators.ts";

export const whitespace: Parser<string> = regex(/[ \t]+/);

export function afterWhitespace<T>(parser: Parser<T>): Parser<T> {
  return after(whitespace, parser);
}

export const optionalWhitespace: Parser<string> = regex(/[ \t]*/);

export function afterOptionalWhitespace<T>(parser: Parser<T>): Parser<T> {
  return after(optionalWhitespace, parser);
}

export const lineComment: Parser<string> = stringSequence(";", /[^\n]*/);

export const blankLine: Parser<string> = stringSequence(
  optionalWhitespace,
  "\n",
);

export const date: Parser<string> = regex(/[0-9]{4}-[0-9]{2}-[0-9]{2}/);

export const currency: Parser<string> = regex(/[A-Z0-9]+/);

const accountSegment = regex(/[A-Z][A-Za-z0-9_-]*/);
export const account: Parser<string> = map(
  sepByAtLeastOnce(accountSegment, string(":")),
  (parts) => parts.join(":"),
);

const integerPart = regex(/-?[0-9]+/);
const decimalPart = regex(/\.[0-9]+/);
const exponentPart = regex(/[eE][+-]?[0-9]+/);

export const number: Parser<string> = stringSequence(
  integerPart,
  optional(decimalPart),
  optional(exponentPart),
);

function quotedStringWith(quote: string): Parser<string> {
  const content = regex(new RegExp(`[^${quote}\\n]*`));
  return between(string(quote), string(quote), content);
}

export const quotedString: Parser<string> = first(
  quotedStringWith('"'),
  quotedStringWith("'"),
);

export const tag: Parser<string> = stringSequence("#", /[a-zA-Z0-9_-]+/);

export const link: Parser<string> = stringSequence("^", /[a-zA-Z0-9_-]+/);

export const flag: Parser<string> = first(string("*"), string("!"));

export const boolean: Parser<boolean> = first(
  map(string("TRUE"), () => true),
  map(string("FALSE"), () => false),
);

export const key: Parser<string> = regex(/[a-z][a-z0-9_-]*/);

export const newline: Parser<string> = string("\n");

export const lineEnd: Parser<string> = afterOptionalWhitespace(newline);

/** Only for directives that parse the rest of the line (e.g. open). */
export const restOfLine: Parser<string> = regex(/[^\n]*/);
