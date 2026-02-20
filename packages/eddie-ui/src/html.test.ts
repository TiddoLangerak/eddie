import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { HtmlString, html, joining } from "./html.ts";

describe("HtmlString", () => {
  it("EMPTY has empty string content", () => {
    assert.equal(HtmlString.EMPTY.toString(), "");
  });

  it("unsafe wraps string and toString returns it", () => {
    const h = html`<p>hi</p>`;
    assert.equal(h.toString(), "<p>hi</p>");
  });
});

describe("html", () => {
  it("returns literal when no values", () => {
    const h = html`hello`;
    assert.equal(h.toString(), "hello");
  });

  it("escapes string values", () => {
    const h = html`<span>${"<script>&\"'"}</span>`;
    assert.equal(h.toString(), "<span>&lt;script&gt;&amp;&quot;&#39;</span>");
  });

  it("uses HtmlString values as-is", () => {
    const inner = html`<b>bold</b>`;
    const h = html`<div>${inner}</div>`;
    assert.equal(h.toString(), "<div><b>bold</b></div>");
  });

  it("coerces null/undefined to empty string", () => {
    const h = html`a${null}b${undefined}c`;
    assert.equal(h.toString(), "abc");
  });
});

describe("joining", () => {
  it("returns first item when acc is EMPTY", () => {
    const items = [html`a`];
    assert.equal(items.reduce(joining(", "), HtmlString.EMPTY).toString(), "a");
  });

  it("concatenates with separator", () => {
    const items = [html`a`, html`b`];
    assert.equal(
      items.reduce(joining(", "), HtmlString.EMPTY).toString(),
      "a, b",
    );
  });

  it("escapes string separator", () => {
    const items = [html`a`, html`b`];
    assert.equal(
      items.reduce(joining("<"), HtmlString.EMPTY).toString(),
      "a&lt;b",
    );
  });

  it("uses html separator as-is without escaping", () => {
    const items = [html`a`, html`b`];
    assert.equal(
      items.reduce(joining(html`<em>-</em>`), HtmlString.EMPTY).toString(),
      "a<em>-</em>b",
    );
  });

  it("default separator is empty", () => {
    const items = [html`a`, html`b`];
    assert.equal(items.reduce(joining(), HtmlString.EMPTY).toString(), "ab");
  });
});

describe("HtmlString.jsonScript", () => {
  it("embeds JSON in script tag with given id", () => {
    const h = HtmlString.jsonScript({ x: 1 }, "data");
    const s = h.toString();
    assert.ok(s.startsWith('<script type="application/json" id="data">'));
    assert.ok(s.endsWith("</script>"));
    assert.ok(s.includes('{"x":1}'));
  });

  it("escapes JSON content for safe embedding", () => {
    const h = HtmlString.jsonScript({ tag: "<script>&" }, "data");
    const s = h.toString();
    assert.ok(s.includes("\\u003c")); // <
    assert.ok(s.includes("\\u003e")); // >
    assert.ok(s.includes("\\u0026")); // &
  });
});
