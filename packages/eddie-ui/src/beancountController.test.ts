import { strict as assert } from "node:assert";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { getBeancountFiles } from "./beancountController.ts";

describe("getBeancountFiles", () => {
  it("returns only beancount files from the workspace root", async () => {
    const dir = await mkdtemp(join(tmpdir(), "eddie-getBeancount-"));
    await writeFile(join(dir, "main.bean"), "");
    await writeFile(join(dir, "other.beancount"), "");
    await writeFile(join(dir, "readme.txt"), "");

    const files = await getBeancountFiles(dir);

    assert.deepEqual(files, ["main.bean", "other.beancount"]);
  });

  it("returns beancount files from nested directories", async () => {
    const dir = await mkdtemp(join(tmpdir(), "eddie-getBeancount-"));
    await writeFile(join(dir, "a.bean"), "");
    await mkdir(join(dir, "subdir"), { recursive: true });
    await writeFile(join(dir, "subdir", "b.bean"), "");
    await mkdir(join(dir, "subdir", "nested"), { recursive: true });
    await writeFile(join(dir, "subdir", "nested", "c.beancount"), "");
    await writeFile(join(dir, "subdir", "notes.txt"), "");

    const files = await getBeancountFiles(dir);

    assert.deepEqual(files, [
      "a.bean",
      "subdir/b.bean",
      "subdir/nested/c.beancount",
    ]);
  });

  it("excludes non-files and paths with ..", async () => {
    const dir = await mkdtemp(join(tmpdir(), "eddie-getBeancount-"));
    await writeFile(join(dir, "only.bean"), "");
    await mkdir(join(dir, "empty"), { recursive: true });

    const files = await getBeancountFiles(dir);

    assert.deepEqual(files, ["only.bean"]);
  });

  it("returns sorted list", async () => {
    const dir = await mkdtemp(join(tmpdir(), "eddie-getBeancount-"));
    await mkdir(join(dir, "z"), { recursive: true });
    await mkdir(join(dir, "a"), { recursive: true });
    await writeFile(join(dir, "z", "file.bean"), "");
    await writeFile(join(dir, "a", "file.bean"), "");

    const files = await getBeancountFiles(dir);

    assert.deepEqual(files, ["a/file.bean", "z/file.bean"]);
  });
});
