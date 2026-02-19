import { join } from "node:path";
import { type BeancountFile, beancountFile } from "@tiddo/beancount-types";
import { isErr, object, string } from "@tiddo/eddie-parry";
import { fileExists } from "@tiddo/eddie-utils/files";
import type { RouteContext } from "./beancountController.ts";
import {
  handleFormat,
  handleParse,
  handleSave,
  handleView,
} from "./beancountController.ts";
import { HttpResponseError } from "./errors.ts";
import { make } from "./make.ts";
import { distStaticDir, staticDir } from "./paths.ts";
import { formString, parseFormData, readBody } from "./request.ts";
import { sendError, sendFile, sendHtml, sendResponse } from "./response.ts";
import { RouteBuilder, type Router } from "./routing.ts";

const saveBody = object({ file: string(), model: beancountFile });

function parseSaveBody(body: string): { file: string; model: BeancountFile } {
  let json: unknown;
  try {
    json = JSON.parse(body);
  } catch {
    throw new HttpResponseError("Invalid JSON body", 400);
  }
  const parsed = saveBody(json);
  if (isErr(parsed)) {
    throw new HttpResponseError(`Invalid body: ${parsed.error("body")}`, 400);
  }
  return parsed.value;
}

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
    const { file, model } = parseSaveBody(body);
    const result = await handleSave(ctx, file, model);
    sendResponse(res, result);
  });

  builder.on("POST", "/parse", async (req, res) => {
    const body = await readBody(req);
    const formData = parseFormData(body);
    const file = formString(formData, "file");
    const content = formString(formData, "content");
    const html = await handleParse(ctx, file, content);
    sendHtml(res, html);
  });

  builder.on("POST", "/format", async (req, res) => {
    const body = await readBody(req);
    const formData = parseFormData(body);
    const file = formString(formData, "file");
    const content = formString(formData, "content");
    const html = await handleFormat(ctx, file, content);
    sendHtml(res, html);
  });

  builder.onPrefix("GET", "/static/", async (req, res) => {
    const url = new URL(req.url ?? "", `http://${req.headers.host}`);
    const relativePath = url.pathname.slice("/static/".length);

    if (relativePath.includes("..") || relativePath.startsWith("/")) {
      sendError(res, "Invalid path", 400);
      return;
    }

    const plainPath = join(staticDir, relativePath);

    if (await fileExists(plainPath)) {
      await sendFile(res, plainPath);
      return;
    }

    const distPath = join(distStaticDir, relativePath);
    if (!(await make(distPath))) {
      sendError(res, "Not found", 404);
      return;
    }
    await sendFile(res, distPath);
  });

  return builder.build();
}
