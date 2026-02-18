import { stat } from "node:fs/promises";

/**
 * Returns true if the path exists and is a regular file, false otherwise.
 */
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
