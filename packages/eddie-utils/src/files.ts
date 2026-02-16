export function normalizeLineEndings(input: string): string {
  const normalLineEndings = input.replaceAll("\r", "");
  return normalLineEndings.endsWith("\n")
    ? normalLineEndings
    : `${normalLineEndings}\n`;
}
