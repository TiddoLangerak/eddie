import { strict as assert } from "node:assert";
import { mkdtempDisposable, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import {
  changeExtension,
  fileExists,
  isNewer,
  normalizeLineEndings,
} from "./files.ts";

describe("changeExtension", () => {
  it("replaces extension when from matches", () => {
    assert.equal(
      changeExtension("/a/b/foo.bean", ".bean", ".json"),
      "/a/b/foo.json",
    );
  });

  it("appends new extension when from does not match", () => {
    assert.equal(
      changeExtension("/a/b/foo.bean", ".json", ".txt"),
      "/a/b/foo.bean.txt",
    );
  });

  it("handles path without directory", () => {
    assert.equal(changeExtension("file.bean", ".bean", ".txt"), "file.txt");
  });

  it("handles empty from and to", () => {
    assert.equal(changeExtension("/a/file.bean", ".bean", ""), "/a/file");
  });
});

describe("normalizeLineEndings", () => {
  it("strips carriage return", () => {
    assert.equal(normalizeLineEndings("a\r\nb"), "a\nb\n");
  });

  it("adds trailing newline when missing", () => {
    assert.equal(normalizeLineEndings("a"), "a\n");
  });

  it("leaves input unchanged when already ending with newline", () => {
    assert.equal(normalizeLineEndings("a\n"), "a\n");
  });

  it("strips CR and adds newline when needed", () => {
    assert.equal(normalizeLineEndings("a\r"), "a\n");
  });
});

describe("fileExists", () => {
  it("returns true for existing file", async () => {
    await using dir = await mkdtempDisposable(join(tmpdir(), "eddie-utils-"));
    const file = join(dir.path, "f");
    await writeFile(file, "");
    assert.equal(await fileExists(file), true);
  });

  it("returns false for non-existent path", async () => {
    assert.equal(await fileExists("/nonexistent/path/xyz"), false);
  });
});

describe("isNewer", () => {
  it("returns true when path is newer than reference", async () => {
    await using dir = await mkdtempDisposable(join(tmpdir(), "eddie-utils-"));
    const ref = join(dir.path, "ref");
    const newer = join(dir.path, "newer");
    await writeFile(ref, "ref");
    await new Promise((r) => setTimeout(r, 10));
    await writeFile(newer, "newer");
    assert.equal(await isNewer(newer, ref), true);
  });

  it("returns false when path is older than reference", async () => {
    await using dir = await mkdtempDisposable(join(tmpdir(), "eddie-utils-"));
    const older = join(dir.path, "older");
    const ref = join(dir.path, "ref");
    await writeFile(older, "older");
    await new Promise((r) => setTimeout(r, 10));
    await writeFile(ref, "ref");
    assert.equal(await isNewer(older, ref), false);
  });
});
