import type { BeancountFile, Directive } from "@Tiddo/beancount-types";

/**
 * Parses a Beancount file string into a structured BeancountFile object.
 *
 * @param beancountFile - The raw Beancount file content as a string
 * @returns A parsed BeancountFile object
 */
export function parseBeancount(beancountFile: string): BeancountFile {
  // Stub implementation - returns empty structure
  // TODO: Implement actual Beancount parsing logic
  const lines = beancountFile.trim().split("\n");
  const directives: Directive[] = [];

  // Placeholder: just return empty structure
  return {
    directives,
    metadata: {
      lineCount: lines.length,
    },
  };
}
