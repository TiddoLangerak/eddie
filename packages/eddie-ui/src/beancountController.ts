import { readFile, readdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { formatBeancountFile } from "@Tiddo/beancount-formatter";
import { parseBeancount } from "@Tiddo/beancount-parser";
import { HtmlString, html } from "./html.ts";
import { layout } from "./templates/layout.ts";

// Security: validate path is within workspace
function isValidPath(workspace: string, filePath: string): boolean {
  const resolved = resolve(workspace, filePath);
  return resolved.startsWith(workspace) && !filePath.includes("..");
}

export interface RouteContext {
  workspace: string;
}

async function getBeancountFiles(workspace: string): Promise<string[]> {
  const allFiles = await readdir(workspace);
  return allFiles.filter(
    (f) => f.endsWith(".bean") || f.endsWith(".beancount"),
  );
}

export async function handleView(
  ctx: RouteContext,
  file: string | null,
  saved = false,
): Promise<HtmlString> {
  const files = await getBeancountFiles(ctx.workspace);

  let content = "";
  if (file && isValidPath(ctx.workspace, file)) {
    content = await readFile(join(ctx.workspace, file), "utf-8");
  }

  const message = saved
    ? html`<div class="message success">Saved successfully</div>`
    : HtmlString.EMPTY;

  return layout(ctx.workspace, files, file, content, message);
}

export async function handleSave(
  ctx: RouteContext,
  file: string | string[] | undefined,
  content: string | string[] | undefined,
): Promise<{ redirect: string } | { html: HtmlString }> {
  const files = await getBeancountFiles(ctx.workspace);

  if (
    typeof file !== "string" ||
    typeof content !== "string" ||
    !file ||
    !content
  ) {
    const message = html`<div class="message error">Missing file or content</div>`;
    return {
      html: layout(
        ctx.workspace,
        files,
        typeof file === "string" ? file : null,
        typeof content === "string" ? content : "",
        message,
      ),
    };
  }

  if (!isValidPath(ctx.workspace, file)) {
    const message = html`<div class="message error">Invalid file path</div>`;
    return {
      html: layout(ctx.workspace, files, file, content, message),
    };
  }

  await writeFile(join(ctx.workspace, file), content);
  return { redirect: `/?file=${encodeURIComponent(file)}&saved=true` };
}

export async function handleParse(
  ctx: RouteContext,
  file: string | string[] | undefined,
  content: string | string[] | undefined,
): Promise<HtmlString> {
  const files = await getBeancountFiles(ctx.workspace);

  if (
    typeof file !== "string" ||
    typeof content !== "string" ||
    !file ||
    !content
  ) {
    const message = html`<div class="message error">Missing file or content</div>`;
    return layout(
      ctx.workspace,
      files,
      typeof file === "string" ? file : null,
      typeof content === "string" ? content : "",
      message,
    );
  }

  try {
    const parsed = parseBeancount(content);
    const message = html`
			<div class="message success">
				<strong>Parse successful</strong>
				<pre>${JSON.stringify(parsed, null, 2)}</pre>
			</div>
		`;
    return layout(ctx.workspace, files, file, content, message);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const message = html`
			<div class="message error">Parse error: ${errorMessage}</div>
		`;
    return layout(ctx.workspace, files, file, content, message);
  }
}

export async function handleFormat(
  ctx: RouteContext,
  file: string,
  content: string,
): Promise<HtmlString> {
  const files = await getBeancountFiles(ctx.workspace);

  try {
    const parsed = parseBeancount(content);
    const formatted = formatBeancountFile(parsed);
    const message = html`
      <div class="message success">Formatted successfully</div>
    `;
    return layout(ctx.workspace, files, file, formatted, message);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const message = html`
      <div class="message error">Format error: ${errorMessage}</div>
    `;
    return layout(ctx.workspace, files, file, content, message);
  }
}
