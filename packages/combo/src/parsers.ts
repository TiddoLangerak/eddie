import {
  after,
  between,
  first,
  optional,
  regex,
  string,
  stringSequence,
} from "./combinators.ts";
import type { Parser } from "./combinators.ts";

export const whitespace: Parser<string> = regex(/[ \t]+/);

export const optionalWhitespace: Parser<string> = regex(/[ \t]*/);

export function afterWhitespace<T>(parser: Parser<T>): Parser<T> {
  return after(whitespace, parser);
}

export function afterOptionalWhitespace<T>(parser: Parser<T>): Parser<T> {
  return after(optionalWhitespace, parser);
}

export const newline: Parser<string> = string("\n");

export const lineEnd: Parser<string> = afterOptionalWhitespace(newline);

export const blankLine: Parser<string> = stringSequence(
  optionalWhitespace,
  "\n",
);

export const restOfLine: Parser<string> = regex(/[^\n]*/);

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

export function lineComment(prefix: string): Parser<string> {
  return stringSequence(prefix, restOfLine);
}

export const isoDate: Parser<string> = regex(/[0-9]{4}-[0-9]{2}-[0-9]{2}/);
