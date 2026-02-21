import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import * as ts from "typescript";

export async function compileTs(options: {
  src: string;
  dest: string;
}): Promise<void> {
  const { src, dest } = options;
  const source = await readFile(src, "utf-8");
  const out = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2020,
      rewriteRelativeImportExtensions: true,
    },
  });
  await mkdir(dirname(dest), { recursive: true });
  await writeFile(dest, out.outputText, "utf-8");
}
