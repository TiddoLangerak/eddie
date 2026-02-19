import { readFile } from "node:fs/promises";
import type { ServerResponse } from "node:http";
import { extname } from "node:path";
import type { HtmlString } from "./html.ts";

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
};

export type HttpResponse =
  | { redirect: string }
  | { html: HtmlString; status?: number };

export function sendHtml(
  res: ServerResponse,
  html: HtmlString,
  status = 200,
): void {
  res.writeHead(status, { "Content-Type": "text/html; charset=utf-8" });
  res.end(html.toString());
}

export function sendRedirect(res: ServerResponse, location: string) {
  res.writeHead(302, { Location: location });
  res.end();
}

export function sendError(res: ServerResponse, message: string, status = 400) {
  res.writeHead(status, { "Content-Type": "text/plain" });
  res.end(message);
}

export async function sendFile(
  res: ServerResponse,
  path: string,
): Promise<void> {
  try {
    const content = await readFile(path);
    const ext = extname(path);
    const mimeType = MIME_TYPES[ext] ?? "application/octet-stream";
    res.writeHead(200, { "Content-Type": mimeType });
    res.end(content);
  } catch {
    sendError(res, "Not found", 404);
  }
}

export function sendResponse(
  res: ServerResponse,
  response: HttpResponse,
): void {
  if ("redirect" in response) {
    sendRedirect(res, response.redirect);
  } else {
    sendHtml(res, response.html, response.status ?? 200);
  }
}
