import { strict as assert } from "node:assert";
import { mkdir, mkdtempDisposable, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { getBeancountFiles } from "./beancountController.ts";

describe("getBeancountFiles", () => {
  it("returns only beancount files from the workspace root", async () => {
    await using dir = await mkdtempDisposable(
      join(tmpdir(), "eddie-getBeancount-"),
    );
    await writeFile(join(dir.path, "main.bean"), "");
    await writeFile(join(dir.path, "other.beancount"), "");
    await writeFile(join(dir.path, "readme.txt"), "");

    const files = await getBeancountFiles(dir.path);

    assert.deepEqual(files, ["main.bean", "other.beancount"]);
  });

  it("returns beancount files from nested directories", async () => {
    await using dir = await mkdtempDisposable(
      join(tmpdir(), "eddie-getBeancount-"),
    );
    await writeFile(join(dir.path, "a.bean"), "");
    await mkdir(join(dir.path, "subdir"), { recursive: true });
    await writeFile(join(dir.path, "subdir", "b.bean"), "");
    await mkdir(join(dir.path, "subdir", "nested"), { recursive: true });
    await writeFile(join(dir.path, "subdir", "nested", "c.beancount"), "");
    await writeFile(join(dir.path, "subdir", "notes.txt"), "");

    const files = await getBeancountFiles(dir.path);

    assert.deepEqual(files, [
      "a.bean",
      "subdir/b.bean",
      "subdir/nested/c.beancount",
    ]);
  });

  it("excludes non-files and paths with ..", async () => {
    await using dir = await mkdtempDisposable(
      join(tmpdir(), "eddie-getBeancount-"),
    );
    await writeFile(join(dir.path, "only.bean"), "");
    await mkdir(join(dir.path, "empty"), { recursive: true });

    const files = await getBeancountFiles(dir.path);

    assert.deepEqual(files, ["only.bean"]);
  });

  it("returns sorted list", async () => {
    await using dir = await mkdtempDisposable(
      join(tmpdir(), "eddie-getBeancount-"),
    );
    await mkdir(join(dir.path, "z"), { recursive: true });
    await mkdir(join(dir.path, "a"), { recursive: true });
    await writeFile(join(dir.path, "z", "file.bean"), "");
    await writeFile(join(dir.path, "a", "file.bean"), "");

    const files = await getBeancountFiles(dir.path);

    assert.deepEqual(files, ["a/file.bean", "z/file.bean"]);
  });
});
