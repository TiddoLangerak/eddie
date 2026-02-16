import { strict as assert } from "node:assert";
import { resolve } from "node:path";
import { describe, it } from "node:test";
import { parseArgs } from "./cli.ts";

describe("parseArgs", () => {
  it("returns defaults when no args provided", () => {
    const config = parseArgs(["node", "script.js"]);
    assert.equal(config.workspace, resolve(""));
    assert.equal(config.port, 3000);
  });

  it("parses workspace with equals syntax", () => {
    const config = parseArgs([
      "node",
      "script.js",
      "--workspace=/path/to/files",
    ]);
    assert.equal(config.workspace, resolve("/path/to/files"));
  });

  it("parses workspace with space syntax", () => {
    const config = parseArgs([
      "node",
      "script.js",
      "--workspace",
      "/path/to/files",
    ]);
    assert.equal(config.workspace, resolve("/path/to/files"));
  });

  it("parses port with equals syntax", () => {
    const config = parseArgs(["node", "script.js", "--port=8080"]);
    assert.equal(config.port, 8080);
  });

  it("parses port with space syntax", () => {
    const config = parseArgs(["node", "script.js", "--port", "8080"]);
    assert.equal(config.port, 8080);
  });

  it("parses multiple args with mixed syntax", () => {
    const config = parseArgs([
      "node",
      "script.js",
      "--workspace=/my/files",
      "--port",
      "4000",
    ]);
    assert.equal(config.workspace, resolve("/my/files"));
    assert.equal(config.port, 4000);
  });

  it("uses first value when arg specified multiple times", () => {
    const config = parseArgs([
      "node",
      "script.js",
      "--port=3000",
      "--port",
      "4000",
    ]);
    assert.equal(config.port, 3000);
  });
});
