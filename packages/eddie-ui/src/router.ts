import { readFile, stat } from "node:fs/promises";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { RouteContext } from "./beancountController.ts";
import {
  handleFormat,
  handleParse,
  handleSave,
  handleView,
} from "./beancountController.ts";
import {
  FormDataParseError,
  formString,
  parseFormData,
  readBody,
} from "./request.ts";
import { sendError, sendHtml, sendRedirect } from "./response.ts";
import { RouteBuilder, type Router } from "./routing.ts";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
};

export function createRouter(ctx: RouteContext): Router {
  const builder = new RouteBuilder();

  builder.on("GET", "/", async (req, res) => {
    const url = new URL(req.url ?? "", `http://${req.headers.host}`);
    const file = url.searchParams.get("file");
    const saved = url.searchParams.has("saved");
    const { status, content } = await handleView(ctx, file, saved);
    sendHtml(res, content, status);
  });

  builder.on("POST", "/save", async (req, res) => {
    const body = await readBody(req);
    const formData = parseFormData(body);
    try {
      const file = formString(formData.file);
      const content = formString(formData.content);
      const result = await handleSave(ctx, file, content);
      if ("redirect" in result) {
        sendRedirect(res, result.redirect);
      } else {
        sendHtml(res, result.html);
      }
    } catch (err) {
      if (err instanceof FormDataParseError) {
        sendError(res, err.message, 400);
        return;
      }
      throw err;
    }
  });

  builder.on("POST", "/parse", async (req, res) => {
    const body = await readBody(req);
    const formData = parseFormData(body);
    try {
      const file = formString(formData.file);
      const content = formString(formData.content);
      const html = await handleParse(ctx, file, content);
      sendHtml(res, html);
    } catch (err) {
      if (err instanceof FormDataParseError) {
        sendError(res, err.message, 400);
        return;
      }
      throw err;
    }
  });

  builder.on("POST", "/format", async (req, res) => {
    const body = await readBody(req);
    const formData = parseFormData(body);
    try {
      const file = formString(formData.file);
      const content = formString(formData.content);
      const html = await handleFormat(ctx, file, content);
      sendHtml(res, html);
    } catch (err) {
      if (err instanceof FormDataParseError) {
        sendError(res, err.message, 400);
        return;
      }
      throw err;
    }
  });

  builder.onPrefix("GET", "/static/", async (req, res) => {
    const url = new URL(req.url ?? "", `http://${req.headers.host}`);
    const relativePath = url.pathname.slice("/static/".length);

    if (relativePath.includes("..") || relativePath.startsWith("/")) {
      sendError(res, "Invalid path", 400);
      return;
    }

    const staticDir = join(__dirname, "..", "static");
    const filePath = join(staticDir, relativePath);

    if (!filePath.startsWith(staticDir)) {
      sendError(res, "Invalid path", 400);
      return;
    }

    try {
      const stats = await stat(filePath);
      if (!stats.isFile()) {
        sendError(res, "Not found", 404);
        return;
      }

      const content = await readFile(filePath);
      const ext = extname(filePath);
      const mimeType = MIME_TYPES[ext] || "application/octet-stream";
      res.writeHead(200, { "Content-Type": mimeType });
      res.end(content);
    } catch {
      sendError(res, "Not found", 404);
    }
  });

  return builder.build();
}
