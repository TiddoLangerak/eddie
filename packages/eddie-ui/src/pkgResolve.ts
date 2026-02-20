import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import {
  type ParryParser,
  isErr,
  object,
  oneOf,
  optional,
  recordOf,
  string,
} from "@tiddo/eddie-parry";
import { findUp } from "@tiddo/eddie-utils/files";
import { removeOptionalPrefix } from "@tiddo/eddie-utils/strings";
import { eddieUiPackageDir, repoRoot } from "./paths.ts";

const CONDITIONS = ["development", "import", "default"] as const;

type Mapping = string | Record<string, string>;
type Exports = Record<string, Mapping>;

const mapping = oneOf<Mapping>(string(), recordOf(string()));

type PackageJson = { main?: string; exports?: Exports };

const packageJson: ParryParser<PackageJson> = object({
  main: optional(string()),
  exports: optional(recordOf(mapping)),
});

function pickExport(
  mapping: Mapping,
  conditions: readonly string[],
): string | null {
  if (typeof mapping === "string") return mapping;
  const value = conditions.map((c) => mapping[c]).find((v) => v != null);
  return value ?? null;
}

function matchExportKey(
  key: string,
  subpath: string,
): { matched: boolean; starMatchPart: string | null } {
  if (key === ".") {
    return {
      matched: subpath === "",
      starMatchPart: null,
    };
  }
  const stripped = removeOptionalPrefix(key, "./");
  if (stripped.includes("*")) {
    const parts = stripped.split("*");
    if (parts.length > 2)
      throw new Error("Only single * supported in export key");
    const [beforeStar, afterStar = ""] = parts;
    if (!subpath.startsWith(beforeStar) || !subpath.endsWith(afterStar))
      return { matched: false, starMatchPart: null };
    return {
      matched: true,
      starMatchPart: subpath.slice(
        beforeStar.length,
        subpath.length - afterStar.length,
      ),
    };
  }
  return {
    matched: subpath === stripped,
    starMatchPart: null,
  };
}

function substitutePattern(pattern: string, star: string): string {
  return pattern.replace("*", star);
}

function parsePkgsPath(pkgsPath: string): { pkgName: string; subpath: string } {
  const segments = pkgsPath.split("/").filter(Boolean);
  if (segments.length === 0) {
    throw new Error("Invalid _pkgs path: empty path");
  }
  if (segments[0].startsWith("@") && segments.length >= 2) {
    return {
      pkgName: `${segments[0]}/${segments[1]}`,
      subpath: segments.slice(2).join("/"),
    };
  }
  return {
    pkgName: segments[0],
    subpath: segments.slice(1).join("/"),
  };
}

async function findPackageRoot(pkgName: string): Promise<string | null> {
  const pkgJsonPath = await findUp(
    `node_modules/${pkgName}/package.json`,
    eddieUiPackageDir,
    repoRoot,
  );
  if (pkgJsonPath == null) return null;
  return dirname(pkgJsonPath);
}

async function readPackageJson(pkgRoot: string): Promise<PackageJson | null> {
  let json: unknown;
  try {
    json = JSON.parse(await readFile(join(pkgRoot, "package.json"), "utf-8"));
  } catch {
    return null;
  }
  const parsed = packageJson(json);
  if (isErr(parsed)) return null;
  return parsed.value;
}

function buildExportsMap(pkgJson: PackageJson): Exports {
  return {
    ...(pkgJson.main != null ? { ".": pkgJson.main } : {}),
    ...(pkgJson.exports ?? {}),
  };
}

function resolveExportPath(exportMap: Exports, subpath: string): string | null {
  const target = subpath || ".";
  let pathSegment: string | null = null;
  const mapping = exportMap[target];
  if (mapping != null) pathSegment = pickExport(mapping, CONDITIONS);

  if (pathSegment == null) {
    for (const key of Object.keys(exportMap)) {
      if (key === ".") continue;
      const { matched, starMatchPart } = matchExportKey(key, subpath);
      if (!matched) continue;
      const exp = exportMap[key];
      const chosen = pickExport(exp, CONDITIONS);
      if (chosen != null) {
        pathSegment =
          starMatchPart != null
            ? substitutePattern(chosen, starMatchPart)
            : chosen;
        break;
      }
    }
  }

  return pathSegment;
}

/**
 * Resolve a specifier (path after /static/_pkgs/) to an absolute filesystem path.
 * Uses Node package resolution honoring package.json "exports" with "development" condition.
 * Returns null if resolution fails or resolved path is outside repo root.
 */
export async function resolvePkgPath(pkgsPath: string): Promise<string | null> {
  const { pkgName, subpath } = parsePkgsPath(pkgsPath);

  const pkgRoot = await findPackageRoot(pkgName);
  if (pkgRoot == null) return null;

  const pkgJson = await readPackageJson(pkgRoot);
  if (pkgJson == null) return null;

  const exportMap = buildExportsMap(pkgJson);
  if (Object.keys(exportMap).length === 0) return null;

  const pathSegment = resolveExportPath(exportMap, subpath);
  if (pathSegment == null) return null;

  return join(pkgRoot, pathSegment);
}
