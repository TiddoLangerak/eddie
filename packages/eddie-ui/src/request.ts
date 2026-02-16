import type { IncomingMessage } from "node:http";

export async function readBody(req: IncomingMessage): Promise<string> {
  const chunks = await Array.fromAsync(req);
  return Buffer.concat(chunks).toString("utf-8");
}

export function parseFormData(body: string): Record<string, string | string[]> {
  const parsed = new URLSearchParams(body);
  const result: Record<string, string | string[]> = {};
  for (const [key, value] of parsed.entries()) {
    const existing = result[key];
    if (existing === undefined) {
      result[key] = value;
    } else if (Array.isArray(existing)) {
      existing.push(value);
    } else {
      result[key] = [existing, value];
    }
  }
  return result;
}
