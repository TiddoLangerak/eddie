import {
  first,
  map,
  regex,
  sepByAtLeastOnce,
  string,
  stringSequence,
} from "@tiddo/combo/combinators";
import type { Parser } from "@tiddo/combo/combinators";
import {
  afterOptionalWhitespace,
  afterWhitespace,
  blankLine,
  isoDate,
  lineComment as lineCommentWith,
  lineEnd,
  newline,
  number,
  optionalWhitespace,
  quotedString,
  restOfLine,
  whitespace,
} from "@tiddo/combo/parsers";

export {
  afterOptionalWhitespace,
  afterWhitespace,
  blankLine,
  lineEnd,
  newline,
  number,
  optionalWhitespace,
  quotedString,
  restOfLine,
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
