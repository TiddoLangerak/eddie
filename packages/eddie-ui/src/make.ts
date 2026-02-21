import { mkdir } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { changeExtension, fileExists, isNewer } from "@tiddo/eddie-utils/files";
import { distStaticDir, srcStaticDir } from "./paths.ts";
import { resolvePkgPath } from "./pkgResolve.ts";
import { compileTs } from "./typescript.ts";

export type Rule = {
  matches: (rel: string) => boolean;
  source: (rel: string) => Promise<string | null>;
  make: (dst: string) => Promise<void>;
};

const PKGS_PREFIX = "_pkgs/";

const pkgsRule: Rule = {
  matches: (rel) => rel.startsWith(PKGS_PREFIX),
  source: async (rel) => {
    const pkgsPath = rel.slice(PKGS_PREFIX.length);
    const src = await resolvePkgPath(pkgsPath);
    return src?.endsWith(".ts") ? src : null;
  },
  make: async (dst) => {
    await mkdir(dirname(dst), { recursive: true });
    const rel = relative(distStaticDir, dst);
    const src = await resolvePkgPath(rel.slice(PKGS_PREFIX.length));
    if (src != null) await compileTs({ src, dest: dst });
  },
};

const staticTsRule: Rule = {
  matches: (rel) => rel.endsWith(".js"),
  source: async (rel) => {
    const srcPath = join(srcStaticDir, changeExtension(rel, ".js", ".ts"));
    return (await fileExists(srcPath)) ? srcPath : null;
  },
  make: async (dst) => {
    const rel = relative(distStaticDir, dst);
    const srcPath = join(srcStaticDir, changeExtension(rel, ".js", ".ts"));
    await compileTs({ src: srcPath, dest: dst });
  },
};

const RULES: Rule[] = [pkgsRule, staticTsRule];

export async function make(dst: string): Promise<boolean> {
  const rel = relative(distStaticDir, dst);
  if (rel.startsWith("..") || rel.includes("..")) return false;

  const rule = RULES.find((r) => r.matches(rel));
  if (rule == null) return false;

  const src = await rule.source(rel);
  if (src == null) return false;

  const dstExists = await fileExists(dst);
  const shouldCompile = !dstExists || (await isNewer(src, dst));
  if (shouldCompile) {
    try {
      await rule.make(dst);
    } catch {
      return false;
    }
  }

  return fileExists(dst);
}
