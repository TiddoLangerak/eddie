import { stat } from "node:fs/promises";
import { basename, dirname, join } from "node:path";

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
