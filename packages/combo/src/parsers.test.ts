import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { run, string } from "./combinators.ts";
import {
  afterOptionalWhitespace,
  afterWhitespace,
  blankLine,
  isoDate,
  lineComment,
  lineEnd,
  newline,
  number,
  optionalWhitespace,
  quotedString,
  restOfLine,
  whitespace,
} from "./parsers.ts";

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

describe("isoDate", () => {
  it("parses YYYY-MM-DD format", () => {
    const result = run(isoDate, "2024-01-15");
    assert.ok(result.ok);
    assert.equal(result.value, "2024-01-15");
  });
});
