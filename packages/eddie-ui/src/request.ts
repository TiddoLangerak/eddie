import type { IncomingMessage } from "node:http";

export class FormDataParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FormDataParseError";
  }
}

export type FormDataValue = string | string[] | undefined | null;

export function formStringArray(raw: FormDataValue): string[] {
  if (raw === undefined || raw === null) {
    return [];
  }
  if (Array.isArray(raw)) {
    return raw;
  }
  return [raw];
}

export function formString(raw: FormDataValue): string {
  if (raw === undefined || raw === null) {
    throw new FormDataParseError("Missing required field");
  }
  if (Array.isArray(raw)) {
    throw new FormDataParseError("Expected single value, got multiple");
  }
  return raw;
}

export function formStringOrNull(raw: FormDataValue): string | null {
  if (raw === undefined || raw === null) {
    return null;
  }
  if (Array.isArray(raw)) {
    throw new FormDataParseError(
      "Expected single value or missing, got multiple",
    );
  }
  return raw;
}

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
