import { stat } from "node:fs/promises";
import { basename, dirname, join } from "node:path";

/**
 * Search upward from startFolder for a path matching target (relative path).
 * Stops at endFolder (checks endFolder as well), does not search above endFolder.
 * Returns the absolute path to the first existing target, or null if not found.
 */
export async function findUp(
  target: string,
  startFolder: string,
  endFolder: string,
): Promise<string | null> {
  let dir = startFolder;
  for (;;) {
    const candidate = join(dir, target);
    try {
      await stat(candidate);
      return candidate;
    } catch {
      // path does not exist, continue
    }
    if (dir === endFolder) return null;
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

export function changeExtension(
  path: string,
  from: string,
  to: string,
): string {
  return join(dirname(path), basename(path, from) + to);
}

export async function isNewer(
  path: string,
  referencePath: string,
): Promise<boolean> {
  const pathStats = await stat(path);
  const refStats = await stat(referencePath);
  return pathStats.mtimeMs > refStats.mtimeMs;
}

export async function fileExists(path: string): Promise<boolean> {
  try {
    const stats = await stat(path);
    return stats.isFile();
  } catch {
    return false;
  }
}

export function normalizeLineEndings(input: string): string {
  const normalLineEndings = input.replaceAll("\r", "");
  return normalLineEndings.endsWith("\n")
    ? normalLineEndings
    : `${normalLineEndings}\n`;
}
