import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { parseBeancount } from "@tiddo/beancount-parser";
import type { BeancountFile, Directive } from "@tiddo/beancount-types";
import { distinct } from "@tiddo/eddie-utils/arrays";
import { unreachable } from "@tiddo/eddie-utils/unreachable";

export function getAccountsFromDirective(d: Directive): string[] {
  switch (d.type) {
    case "transaction":
      return d.postings.map((p) => p.account).filter(Boolean);
    case "open":
    case "balance":
    case "close":
    case "note":
    case "document":
      return d.account ? [d.account] : [];
    case "pad":
      return [d.account, d.sourceAccount].filter(Boolean);
    case "include":
    case "plugin":
    case "option":
    case "commodity":
    case "price":
    case "event":
    case "query":
    case "custom":
      return [];
    default:
      return unreachable(d);
  }
}

export function extractAccountsFromFile(model: BeancountFile): string[] {
  return distinct(model.directives.flatMap(getAccountsFromDirective)).sort();
}

export async function getWorkspaceAccounts(
  workspace: string,
  beancountFilePaths: string[],
): Promise<string[]> {
  const parseFile = async (filePath: string): Promise<string[]> => {
    const fullPath = join(workspace, filePath);
    try {
      const content = await readFile(fullPath, "utf-8");
      return extractAccountsFromFile(parseBeancount(content));
    } catch {
      return [];
    }
  };
  const allAccounts = (
    await Promise.all(beancountFilePaths.map(parseFile))
  ).flat();
  return distinct(allAccounts).sort();
}
