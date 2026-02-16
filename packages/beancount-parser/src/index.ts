import type {
  BeancountFile,
  CommentOrBlank,
  Directive,
} from "@Tiddo/beancount-types";
import {
  createState,
  first,
  map,
  repeated,
  run,
  sequence,
} from "./combinators.ts";
import type { Parser } from "./combinators.ts";
import { directive } from "./directives.ts";
import { blankLinesAndComments } from "./primitives.ts";

export class ParseError extends Error {
  readonly line: number;
  readonly column: number;

  constructor(message: string, line: number, column: number) {
    super(message);
    this.line = line;
    this.column = column;
  }
}

const commentedDirective = map(
  sequence(blankLinesAndComments, directive),
  ([prefix, directive]) => ({
    prefix,
    directive,
  }),
);

const directives = repeated(commentedDirective);

const fileParser = map(
  sequence(directives, blankLinesAndComments),
  ([items, footer]) => ({
    items,
    footer,
  }),
);

/**
 * Parses a Beancount file string into a structured BeancountFile object.
 * Throws on first parse error.
 *
 * @param beancountFile - The raw Beancount file content as a string
 * @returns A parsed BeancountFile object
 */
export function parseBeancount(beancountFile: string): BeancountFile {
  const input = beancountFile.endsWith("\n")
    ? beancountFile
    : `${beancountFile}\n`;
  const result = run(fileParser, input);
  if (!result.ok) {
    throw new ParseError(
      result.message,
      result.position.line,
      result.position.column,
    );
  }
  if (result.state.input.length > 0) {
    throw new ParseError(
      "unparseable input",
      result.state.position.line,
      result.state.position.column,
    );
  }

  const { items, footer } = result.value;
  const directives = items.map(({ prefix, directive: dir }) => ({
    ...dir,
    formatting: {
      header: prefix,
      footer: dir.formatting.footer,
      inlineComment: dir.formatting.inlineComment,
    },
  }));

  return {
    directives,
    header: [],
    footer,
    metadata: { lineCount: beancountFile.split("\n").length },
  };
}
