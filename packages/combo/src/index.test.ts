import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import {
  after,
  afterOptionalWhitespace,
  afterWhitespace,
  atLeastOnce,
  between,
  blankLine,
  createState,
  fail,
  first,
  headTail,
  join,
  lineComment,
  lineEnd,
  map,
  newline,
  not,
  number,
  optional,
  optionalWhitespace,
  peek,
  quotedString,
  regex,
  repeated,
  restOfLine,
  run,
  sepBy,
  sepByAtLeastOnce,
  sequence,
  string,
  stringSequence,
  succeed,
  whitespace,
} from "./index.ts";

describe("succeed", () => {
  it("returns value without consuming input", () => {
    const p = succeed(42);
    const result = run(p, "hello");
    assert.ok(result.ok);
    assert.equal(result.value, 42);
    assert.equal(result.state.input, "hello");
  });
});

describe("fail", () => {
  it("returns failure", () => {
    const p = fail("oops");
    const result = run(p, "hello");
    assert.ok(!result.ok);
    assert.equal(result.message, "oops");
  });
});

describe("string", () => {
  it("matches exact string", () => {
    const result = run(string("hi"), "hi there");
    assert.ok(result.ok);
    assert.equal(result.value, "hi");
    assert.equal(result.state.input, " there");
  });

  it("fails on mismatch", () => {
    const result = run(string("hi"), "ho");
    assert.ok(!result.ok);
  });
});

describe("map", () => {
  it("transforms result", () => {
    const p = map(string("42"), (s) => Number(s));
    const result = run(p, "42");
    assert.ok(result.ok);
    assert.equal(result.value, 42);
  });
});

describe("first", () => {
  it("returns first successful parser", () => {
    const p = first(string("a"), string("b"), string("c"));
    const rB = run(p, "b");
    assert.ok(rB.ok);
    assert.equal(rB.value, "b");
    assert.ok(run(p, "c").ok);
    assert.ok(!run(p, "d").ok);
  });
});

describe("sequence", () => {
  it("runs parsers in order", () => {
    const p = sequence(string("a"), string("b"), string("c"));
    const result = run(p, "abc");
    assert.ok(result.ok);
    assert.deepEqual(result.value, ["a", "b", "c"]);
    assert.equal(result.state.input, "");
  });
});

describe("repeated", () => {
  it("parses zero or more", () => {
    const p = repeated(string("a"));
    const r0 = run(p, "b");
    assert.ok(r0.ok);
    assert.equal(r0.value.length, 0);
    const r2 = run(p, "aab");
    assert.ok(r2.ok);
    assert.equal(r2.value.length, 2);
  });

  it("throws when subparser does not progress", () => {
    const p = repeated(succeed(1));
    assert.throws(() => run(p, "foo"), /repeated: parser did not progress/);
  });
});

describe("atLeastOnce", () => {
  it("requires one or more", () => {
    const p = atLeastOnce(string("a"));
    assert.ok(!run(p, "b").ok);
    const r = run(p, "aa");
    assert.ok(r.ok);
    assert.equal(r.value.length, 2);
  });
});

describe("optional", () => {
  it("returns result on success", () => {
    const p = optional(string("x"));
    const result = run(p, "x");
    assert.ok(result.ok);
    assert.equal(result.value, "x");
    assert.equal(result.state.input, "");
  });

  it("returns undefined on failure", () => {
    const p = optional(string("x"));
    const result = run(p, "y");
    assert.ok(result.ok);
    assert.equal(result.value, undefined);
    assert.equal(result.state.input, "y");
  });
});

describe("between", () => {
  it("parses content between delimiters", () => {
    const p = between(string("("), string(")"), string("x"));
    const result = run(p, "(x)");
    assert.ok(result.ok);
    assert.equal(result.value, "x");
  });
});

describe("sepBy", () => {
  it("does not consume trailing separator", () => {
    const p = sepBy(string("a"), string(","));
    const result = run(p, "a,a,a,");
    assert.ok(result.ok);
    assert.deepEqual(result.value, ["a", "a", "a"]);
    assert.equal(
      result.state.input,
      ",",
      "trailing comma must not be consumed",
    );
  });
});

describe("regex", () => {
  it("matches pattern and consumes input", () => {
    const p = regex(/[a-z]+/);
    const result = run(p, "hello123");
    assert.ok(result.ok);
    assert.equal(result.value, "hello");
    assert.equal(result.state.input, "123");
  });

  it("fails when pattern does not match", () => {
    const p = regex(/[0-9]+/);
    const result = run(p, "abc");
    assert.ok(!result.ok);
  });

  it("succeeds with empty string on zero-length match", () => {
    const p = regex(/[ \t]*/);
    const result = run(p, "x");
    assert.ok(result.ok);
    assert.equal(result.value, "");
    assert.equal(result.state.input, "x");
  });
});

describe("join", () => {
  it("joins string array result into single string", () => {
    const p = join(sequence(string("a"), string("b"), string("c")));
    const result = run(p, "abc");
    assert.ok(result.ok);
    assert.equal(result.value, "abc");
  });
});

describe("stringSequence", () => {
  it("parses sequence of strings and regex and joins result", () => {
    const p = stringSequence("hello", /[ \t]+/, "world");
    const result = run(p, "hello \t world");
    assert.ok(result.ok);
    assert.equal(result.value, "hello \t world");
  });
});

describe("headTail", () => {
  it("parses head then tail and returns [head, ...tail]", () => {
    const p = headTail(string("a"), repeated(string("b")));
    const result = run(p, "abb");
    assert.ok(result.ok);
    assert.deepEqual(result.value, ["a", "b", "b"]);
  });
});

describe("sepByAtLeastOnce", () => {
  it("parses one or more items with separator", () => {
    const p = sepByAtLeastOnce(string("n"), string(","));
    const result = run(p, "n,n,n");
    assert.ok(result.ok);
    assert.deepEqual(result.value, ["n", "n", "n"]);
  });

  it("fails when no item matches", () => {
    const p = sepByAtLeastOnce(string("n"), string(","));
    const result = run(p, "x");
    assert.ok(!result.ok);
  });
});

describe("after", () => {
  it("parses prefix then parser and returns parser result only", () => {
    const p = after(string(" "), string("x"));
    const result = run(p, " xy");
    assert.ok(result.ok);
    assert.equal(result.value, "x");
    assert.equal(result.state.input, "y");
  });
});

describe("peek", () => {
  it("returns parsed value but does not consume input", () => {
    const p = peek(string("ab"));
    const result = run(p, "abc");
    assert.ok(result.ok);
    assert.equal(result.value, "ab");
    assert.equal(result.state.input, "abc");
  });
});

describe("not", () => {
  it("succeeds with null when parser fails", () => {
    const p = not(string("a"));
    const result = run(p, "b");
    assert.ok(result.ok);
    assert.equal(result.value, null);
    assert.equal(result.state.input, "b");
  });

  it("fails when parser matches", () => {
    const p = not(string("a"));
    const result = run(p, "a");
    assert.ok(!result.ok);
  });
});

describe("run", () => {
  it("returns success result for succeeding parser", () => {
    const result = run(succeed(42), "ignored");
    assert.ok(result.ok);
    assert.equal(result.value, 42);
  });

  it("returns failure result for failing parser", () => {
    const result = run(fail("err"), "ignored");
    assert.ok(!result.ok);
    assert.equal(result.message, "err");
  });
});

describe("createState", () => {
  it("creates state with given input and initial position", () => {
    const state = createState("foo");
    assert.equal(state.input, "foo");
    assert.equal(state.position.line, 1);
    assert.equal(state.position.column, 1);
    assert.equal(state.position.offset, 0);
  });
});

describe("whitespace", () => {
  it("matches spaces and tabs", () => {
    const result = run(whitespace, "  \t x");
    assert.ok(result.ok);
    assert.equal(result.value, "  \t ");
    assert.equal(result.state.input, "x");
  });

  it("fails on no whitespace", () => {
    const result = run(whitespace, "x");
    assert.ok(!result.ok);
  });
});

describe("optionalWhitespace", () => {
  it("matches empty string when no whitespace", () => {
    const result = run(optionalWhitespace, "x");
    assert.ok(result.ok);
    assert.equal(result.value, "");
    assert.equal(result.state.input, "x");
  });
});

describe("afterWhitespace", () => {
  it("parses content after required whitespace", () => {
    const p = afterWhitespace(string("x"));
    const result = run(p, " x");
    assert.ok(result.ok);
    assert.equal(result.value, "x");
  });
});

describe("afterOptionalWhitespace", () => {
  it("parses content with or without leading whitespace", () => {
    const p = afterOptionalWhitespace(string("x"));
    assert.ok(run(p, "x").ok);
    assert.ok(run(p, " x").ok);
  });
});

describe("newline", () => {
  it("matches newline character", () => {
    const result = run(newline, "\n");
    assert.ok(result.ok);
    assert.equal(result.state.input, "");
  });
});

describe("lineEnd", () => {
  it("matches optional whitespace followed by newline", () => {
    const result = run(lineEnd, "  \n");
    assert.ok(result.ok);
  });
});

describe("blankLine", () => {
  it("matches whitespace-only line", () => {
    const result = run(blankLine, "  \n");
    assert.ok(result.ok);
    assert.equal(result.value, "  \n");
  });
});

describe("restOfLine", () => {
  it("matches everything until newline", () => {
    const result = run(restOfLine, "hello world\n");
    assert.ok(result.ok);
    assert.equal(result.value, "hello world");
    assert.equal(result.state.input, "\n");
  });
});

describe("number", () => {
  it("parses integer", () => {
    const result = run(number, "42");
    assert.ok(result.ok);
    assert.equal(result.value, "42");
  });

  it("parses negative decimal", () => {
    const result = run(number, "-3.14");
    assert.ok(result.ok);
    assert.equal(result.value, "-3.14");
  });

  it("parses scientific notation", () => {
    const result = run(number, "1.5e10");
    assert.ok(result.ok);
    assert.equal(result.value, "1.5e10");
  });
});

describe("quotedString", () => {
  it("parses double-quoted string", () => {
    const result = run(quotedString, '"hello"');
    assert.ok(result.ok);
    assert.equal(result.value, "hello");
  });

  it("parses single-quoted string", () => {
    const result = run(quotedString, "'world'");
    assert.ok(result.ok);
    assert.equal(result.value, "world");
  });
});

describe("lineComment", () => {
  it("parses comment with given prefix", () => {
    const semicolonComment = lineComment(";");
    const result = run(semicolonComment, "; this is a comment\n");
    assert.ok(result.ok);
    assert.equal(result.value, "; this is a comment");
    assert.equal(result.state.input, "\n");
  });

  it("works with different prefix", () => {
    const hashComment = lineComment("#");
    const result = run(hashComment, "# a comment");
    assert.ok(result.ok);
    assert.equal(result.value, "# a comment");
  });
});
