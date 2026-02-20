import { strict as assert } from "node:assert";
import {
  type IncomingMessage,
  type ServerResponse,
  createServer,
} from "node:http";
import { describe, it } from "node:test";
import { HtmlString, html } from "./html.ts";
import { sendError, sendHtml, sendRedirect, sendResponse } from "./response.ts";

describe("sendHtml", () => {
  it("sends 200 and html content type by default", async () => {
    const r = await createResponse((res) => {
      sendHtml(res, html`<p>hi</p>`);
    });
    assert.equal(r.status, 200);
    assert.equal(r.headers.get("Content-Type"), "text/html; charset=utf-8");
    assert.equal(await r.text(), "<p>hi</p>");
  });

  it("sends given status when provided", async () => {
    const r = await createResponse((res) => {
      sendHtml(res, HtmlString.EMPTY, 404);
    });
    assert.equal(r.status, 404);
  });
});

describe("sendRedirect", () => {
  it("sends 302 and Location header", async () => {
    const r = await createResponse((res) => sendRedirect(res, "/other"));
    assert.equal(r.status, 302);
    assert.equal(r.headers.get("Location"), "/other");
  });
});

describe("sendError", () => {
  it("sends status and text/plain body", async () => {
    const r = await createResponse((res) => sendError(res, "Not found", 404));
    assert.equal(r.status, 404);
    assert.equal(r.headers.get("Content-Type"), "text/plain");
    assert.equal(await r.text(), "Not found");
  });

  it("defaults to 400 status", async () => {
    const r = await createResponse((res) => sendError(res, "Bad"));
    assert.equal(r.status, 400);
    assert.equal(await r.text(), "Bad");
  });
});

describe("sendResponse", () => {
  it("sends redirect for response.redirect", async () => {
    const r = await createResponse((res) =>
      sendResponse(res, { redirect: "/target" }),
    );
    assert.equal(r.status, 302);
    assert.equal(r.headers.get("Location"), "/target");
  });

  it("sends html and 200 for response.html without status", async () => {
    const r = await createResponse((res) =>
      sendResponse(res, { html: html`ok` }),
    );
    assert.equal(r.status, 200);
    assert.equal(await r.text(), "ok");
  });

  it("sends html with response.status when provided", async () => {
    const r = await createResponse((res) =>
      sendResponse(res, { html: html`error`, status: 500 }),
    );
    assert.equal(r.status, 500);
    assert.equal(await r.text(), "error");
  });
});

async function createResponse(
  handle: (res: ServerResponse) => void,
): Promise<Response> {
  await using server = await createTestServer((_req, res) => handle(res));
  const r = await fetch(server.baseUrl, { redirect: "manual" });
  return r;
}

async function createTestServer(
  handle: (req: IncomingMessage, res: ServerResponse) => void,
): Promise<{
  baseUrl: string;
  [Symbol.asyncDispose]: () => Promise<void>;
}> {
  const server = createServer(handle);
  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve());
  });
  const port = (server.address() as { port: number }).port;
  const baseUrl = `http://127.0.0.1:${port}`;
  return {
    baseUrl,
    async [Symbol.asyncDispose]() {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    },
  };
}
