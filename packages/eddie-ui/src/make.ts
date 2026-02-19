import { join, relative } from "node:path";
import { changeExtension, fileExists, isNewer } from "@tiddo/eddie-utils/files";
import { distStaticDir, srcStaticDir } from "./paths.ts";
import { compileTs } from "./typescript.ts";

export async function make(dst: string): Promise<boolean> {
  const rel = relative(distStaticDir, dst);
  if (rel.startsWith("..") || rel.includes("..")) return false;
  if (!rel.endsWith(".js")) return false;

  const srcPath = join(srcStaticDir, changeExtension(rel, ".js", ".ts"));
  if (!(await fileExists(srcPath))) return false;

  if (!(await fileExists(dst)) || await isNewer(srcPath, dst)) {
    try {
      await compileTs({ src: srcPath, dest: dst });
    } catch {
      return false;
    }
  }

  return fileExists(dst);
}
