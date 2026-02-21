import {
  afterOptionalWhitespace,
  afterWhitespace,
  blankLine,
  first,
  isoDate,
  lineComment as lineCommentWith,
  lineEnd,
  map,
  newline,
  number,
  optionalWhitespace,
  quotedString,
  regex,
  sepByAtLeastOnce,
  string,
  stringSequence,
  whitespace,
} from "@tiddo/combo";
import type { Parser } from "@tiddo/combo";

export {
  afterOptionalWhitespace,
  afterWhitespace,
  blankLine,
  lineEnd,
  newline,
  number,
  optionalWhitespace,
  quotedString,
  whitespace,
};

export const lineComment: Parser<string> = lineCommentWith(";");

export { isoDate as date };

export const commodity: Parser<string> = regex(/[A-Z0-9-]+/);

const accountSegment = regex(/[A-Za-z0-9_-]*/);
export const account: Parser<string> = map(
  sepByAtLeastOnce(accountSegment, string(":")),
  (parts) => parts.join(":"),
);

export const tag: Parser<string> = map(
  stringSequence("#", /[a-zA-Z0-9_-]+/),
  (fullTag) => fullTag.slice(1),
);

export const link: Parser<string> = map(
  stringSequence("^", /[a-zA-Z0-9_-]+/),
  (fullLink) => fullLink.slice(1),
);

export const flag: Parser<string> = first(string("*"), string("!"));

export const boolean: Parser<boolean> = first(
  map(string("TRUE"), () => true),
  map(string("FALSE"), () => false),
);

export const key: Parser<string> = regex(/[a-z][a-z0-9_-]*/);

export const restOfLine: Parser<string> = regex(/[^\n]*/);
