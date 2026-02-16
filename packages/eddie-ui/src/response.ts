import type { ServerResponse } from "node:http";

export function sendHtml(
  res: ServerResponse,
  html: { toString(): string },
  status = 200,
) {
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
