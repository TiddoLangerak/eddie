import type { IncomingMessage } from "node:http";
import { FormDataParseError } from "./errors.ts";

export type FormDataRecord = Record<string, string | string[]>;

export type FormDataValue = string | string[] | undefined;

function getRaw(record: FormDataRecord, key: string): FormDataValue {
  return record[key];
}

export function formStringArray(record: FormDataRecord, key: string): string[] {
  const raw = getRaw(record, key);
  if (raw === undefined) {
    return [];
  }
  if (Array.isArray(raw)) {
    return raw;
  }
  return [raw];
}

export function formString(record: FormDataRecord, key: string): string {
  const raw = getRaw(record, key);
  if (raw === undefined) {
    throw new FormDataParseError(key, "Missing required field");
  }
  if (Array.isArray(raw)) {
    throw new FormDataParseError(key, "Expected single value, got multiple");
  }
  return raw;
}

export function formStringOrNull(
  record: FormDataRecord,
  key: string,
): string | null {
  const raw = getRaw(record, key);
  if (raw === undefined) {
    return null;
  }
  if (Array.isArray(raw)) {
    throw new FormDataParseError(
      key,
      "Expected single value or missing, got multiple",
    );
  }
  return raw;
}

export async function readBody(req: IncomingMessage): Promise<string> {
  const chunks = await Array.fromAsync(req);
  return Buffer.concat(chunks).toString("utf-8");
}

export function parseFormData(body: string): FormDataRecord {
  const parsed = new URLSearchParams(body);
  return Array.from(parsed.entries()).reduce<FormDataRecord>(
    (result, [key, value]) => {
      const existing = result[key];
      if (existing === undefined) {
        result[key] = value;
      } else if (Array.isArray(existing)) {
        existing.push(value);
      } else {
        result[key] = [existing, value];
      }
      return result;
    },
    {},
  );
}
