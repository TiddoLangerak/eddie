import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export const eddieUiPackageDir = join(__dirname, "..");
export const staticDir = join(__dirname, "..", "static");
export const srcStaticDir = join(__dirname, "..", "src", "static");
export const distStaticDir = join(__dirname, "..", "dist", "static");
export const repoRoot = findRepoRoot();

function findRepoRoot(): string {
  let dir = join(__dirname, "..");
  while (true) {
    const pkgPath = join(dir, "package.json");
    if (existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, "utf-8")) as {
          name?: string;
        };
        if (pkg.name === "@tiddo/eddie") return dir;
      } catch {
        // ignore invalid JSON
      }
    }
    const parent = dirname(dir);
    if (parent === dir) {
      throw new Error(
        'Repo root not found: no package.json with name "@tiddo/eddie"',
      );
    }
    dir = parent;
  }
}
