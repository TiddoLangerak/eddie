import { mkdir } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { changeExtension, fileExists, isNewer } from "@tiddo/eddie-utils/files";
import { distStaticDir, srcStaticDir } from "./paths.ts";
import { resolvePkgPath } from "./pkgResolve.ts";
import { compileTs } from "./typescript.ts";

export type Rule = {
  matches: (rel: string) => boolean;
  source: (rel: string) => Promise<string | null>;
  dest: (rel: string) => string;
  make: (dst: string, src: string) => Promise<void>;
};

const PKGS_PREFIX = "_pkgs/";

function pkgPathFromRel(rel: string): string {
  const withoutPrefix = rel.slice(PKGS_PREFIX.length);
  return withoutPrefix.endsWith(".js")
    ? withoutPrefix.slice(0, -".js".length)
    : withoutPrefix;
}

const pkgsRule: Rule = {
  matches: (rel) => rel.startsWith(PKGS_PREFIX),
  source: async (rel) => {
    const src = await resolvePkgPath(pkgPathFromRel(rel));
    return src?.endsWith(".ts") ? src : null;
  },
  dest: (rel) => (rel.endsWith(".js") ? rel : `${rel}.js`),
  make: async (dst, src) => {
    await mkdir(dirname(dst), { recursive: true });
    await compileTs({ src, dest: dst });
  },
};

const staticTsRule: Rule = {
  matches: (rel) => rel.endsWith(".js"),
  source: async (rel) => {
    const srcPath = join(srcStaticDir, changeExtension(rel, ".js", ".ts"));
    return (await fileExists(srcPath)) ? srcPath : null;
  },
  dest: (rel) => rel,
  make: async (dst, src) => {
    await compileTs({ src, dest: dst });
  },
};

const RULES: Rule[] = [pkgsRule, staticTsRule];

export async function make(requestedPath: string): Promise<string | null> {
  const rel = relative(distStaticDir, requestedPath);
  if (rel.startsWith("..") || rel.includes("..")) return null;

  const rule = RULES.find((r) => r.matches(rel));
  if (rule == null) return null;

  const src = await rule.source(rel);
  if (src == null) return null;

  const dst = join(distStaticDir, rule.dest(rel));
  const dstExists = await fileExists(dst);
  const shouldCompile = !dstExists || (await isNewer(src, dst));
  if (shouldCompile) {
    try {
      await rule.make(dst, src);
    } catch {
      return null;
    }
  }

  return (await fileExists(dst)) ? dst : null;
}
