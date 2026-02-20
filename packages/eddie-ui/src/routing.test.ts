import { strict as assert } from "node:assert";
import type { IncomingMessage } from "node:http";
import { describe, it } from "node:test";
import { RouteBuilder } from "./routing.ts";

function mockReq(method: string, pathname: string): IncomingMessage {
  return {
    method,
    url: pathname,
    headers: { host: "localhost" },
  } as IncomingMessage;
}

describe("RouteBuilder", () => {
  it("build returns router that finds exact path match", () => {
    let handled = false;
    const router = new RouteBuilder()
      .on("GET", "/", () => {
        handled = true;
      })
      .build();
    const route = router.find(mockReq("GET", "/"));
    assert.ok(route !== null);
    assert.equal(typeof route.handle, "function");
    route.handle(mockReq("GET", "/"), {} as never);
    assert.equal(handled, true);
  });

  it("find returns null when method does not match", () => {
    const router = new RouteBuilder().on("GET", "/", () => {}).build();
    assert.equal(router.find(mockReq("POST", "/")), null);
  });

  it("find returns null when path does not match", () => {
    const router = new RouteBuilder().on("GET", "/", () => {}).build();
    assert.equal(router.find(mockReq("GET", "/other")), null);
  });

  it("onPrefix matches path starting with prefix", () => {
    let handled = false;
    const router = new RouteBuilder()
      .onPrefix("GET", "/static/", () => {
        handled = true;
      })
      .build();
    const route = router.find(mockReq("GET", "/static/foo.js"));
    assert.ok(route !== null);
    route.handle(mockReq("GET", "/static/foo.js"), {} as never);
    assert.equal(handled, true);
  });

  it("onPrefix does not match path without prefix", () => {
    const router = new RouteBuilder()
      .onPrefix("GET", "/static/", () => {})
      .build();
    assert.equal(router.find(mockReq("GET", "/other")), null);
    assert.equal(router.find(mockReq("GET", "/static")), null);
  });

  it("first matching route wins", () => {
    let first = false;
    let second = false;
    const router = new RouteBuilder()
      .on("GET", "/", () => {
        first = true;
      })
      .on("GET", "/", () => {
        second = true;
      })
      .build();
    const route = router.find(mockReq("GET", "/"));
    assert.ok(route !== null);
    route.handle(mockReq("GET", "/"), {} as never);
    assert.equal(first, true);
    assert.equal(second, false);
  });
});
