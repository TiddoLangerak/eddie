import type { Dirent } from "node:fs";
import { readFile, readdir, writeFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import { formatBeancountFile } from "@tiddo/beancount-formatter";
import { ParseError, parseBeancount } from "@tiddo/beancount-parser";
import type { BeancountFile } from "@tiddo/beancount-types";
import { fileExists } from "@tiddo/eddie-utils/files";
import { getWorkspaceAccounts } from "./accounts.ts";
import { HtmlString, html } from "./html.ts";
import type { HttpResponse } from "./response.ts";
import type { EditorState } from "./templates/editor.ts";
import { layout } from "./templates/layout.ts";

function tryParse(content: string): EditorState {
  try {
    return { type: "success", value: parseBeancount(content) };
  } catch (error: unknown) {
    if (error instanceof ParseError) {
      return { type: "error", error: error, content };
    }
    throw error;
  }
}

// Security: validate path is within workspace
function isValidPath(workspace: string, filePath: string): boolean {
  const resolved = resolve(workspace, filePath);
  return resolved.startsWith(workspace) && !filePath.includes("..");
}

export interface RouteContext {
  workspace: string;
}

export type ViewResponse = { status: number; content: HtmlString };

function isBeancountFile(name: string): boolean {
  return name.endsWith(".bean") || name.endsWith(".beancount");
}

function relativePathFromDirent(workspace: string, entry: Dirent): string {
  const fullPath =
    entry.path ??
    (entry.parentPath ? `${entry.parentPath}/${entry.name}` : entry.name);
  return relative(workspace, fullPath);
}

export type WorkspaceFile = { path: string; isBeancount: boolean };

export async function getWorkspaceFiles(
  workspace: string,
): Promise<WorkspaceFile[]> {
  const entries = await readdir(workspace, {
    recursive: true,
    withFileTypes: true,
  });
  const files = entries
    .filter((entry) => entry.isFile())
    .map((entry) => ({
      path: relativePathFromDirent(workspace, entry),
      isBeancount: isBeancountFile(entry.name),
    }))
    .filter((f) => isValidPath(workspace, f.path));
  return [...files].sort((a, b) => a.path.localeCompare(b.path));
}

export async function getBeancountFiles(workspace: string): Promise<string[]> {
  const files = await getWorkspaceFiles(workspace);
  return files.filter((f) => f.isBeancount).map((f) => f.path);
}

export async function handleView(
  ctx: RouteContext,
  file: string | null,
  saved = false,
): Promise<ViewResponse> {
  const files = await getWorkspaceFiles(ctx.workspace);

  if (!file) {
    return {
      status: 200,
      content: layout({
        workspace: ctx.workspace,
        files,
        currentFile: null,
        message: HtmlString.EMPTY,
        state: null,
        accounts: [],
      }),
    };
  }

  if (!isValidPath(ctx.workspace, file)) {
    const message = html`<div class="message error">Invalid file path</div>`;
    return {
      status: 400,
      content: layout({
        workspace: ctx.workspace,
        files,
        currentFile: file,
        message,
        state: null,
        accounts: [],
      }),
    };
  }

  const fullPath = join(ctx.workspace, file);
  if (!(await fileExists(fullPath))) {
    const message = html`<div class="message error">File not found: ${file}</div>`;
    return {
      status: 404,
      content: layout({
        workspace: ctx.workspace,
        files,
        currentFile: file,
        message,
        state: null,
        accounts: [],
      }),
    };
  }

  const accounts = await getWorkspaceAccounts(
    ctx.workspace,
    await getBeancountFiles(ctx.workspace),
  );
  const content = await readFile(fullPath, "utf-8");
  const state = tryParse(content);
  const message = saved
    ? html`<div class="message success">Saved successfully</div>`
    : HtmlString.EMPTY;

  return {
    status: 200,
    content: layout({
      workspace: ctx.workspace,
      files,
      currentFile: file,
      message,
      state,
      accounts,
    }),
  };
}

export async function handleSave(
  ctx: RouteContext,
  file: string,
  model: BeancountFile,
): Promise<HttpResponse> {
  const files = await getWorkspaceFiles(ctx.workspace);

  if (!file) {
    const message = html`<div class="message error">Missing file</div>`;
    const content = formatBeancountFile(model);
    const state = tryParse(content);
    return {
      html: layout({
        workspace: ctx.workspace,
        files,
        currentFile: null,
        message,
        state,
        accounts: [],
      }),
      status: 400,
    };
  }

  if (!isValidPath(ctx.workspace, file)) {
    const message = html`<div class="message error">Invalid file path</div>`;
    const state: EditorState = { type: "success", value: model };
    const accounts = await getWorkspaceAccounts(
      ctx.workspace,
      await getBeancountFiles(ctx.workspace),
    );
    return {
      html: layout({
        workspace: ctx.workspace,
        files,
        currentFile: file,
        message,
        state,
        accounts,
      }),
      status: 400,
    };
  }

  try {
    const formatted = formatBeancountFile(model);
    await writeFile(join(ctx.workspace, file), formatted);
    return { redirect: `/?file=${encodeURIComponent(file)}&saved=true` };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const message = html`
      <div class="message error">Save error: ${errorMessage}</div>
    `;
    const state: EditorState = { type: "success", value: model };
    const accounts = await getWorkspaceAccounts(
      ctx.workspace,
      await getBeancountFiles(ctx.workspace),
    );
    return {
      html: layout({
        workspace: ctx.workspace,
        files,
        currentFile: file,
        message,
        state,
        accounts,
      }),
      status: 400,
    };
  }
}

export async function handleParse(
  ctx: RouteContext,
  file: string,
  content: string,
): Promise<HtmlString> {
  const files = await getWorkspaceFiles(ctx.workspace);

  if (!file || !content) {
    const message = html`<div class="message error">Missing file or content</div>`;
    const state = tryParse(content);
    return layout({
      workspace: ctx.workspace,
      files,
      currentFile: file || null,
      message,
      state,
      accounts: [],
    });
  }

  const state = tryParse(content);
  const message =
    state?.type === "success"
      ? html`
			<div class="message success">
				<strong>Parse successful</strong>
				<pre>${JSON.stringify(state.value, null, 2)}</pre>
			</div>
		`
      : HtmlString.EMPTY;
  const accounts = await getWorkspaceAccounts(
    ctx.workspace,
    await getBeancountFiles(ctx.workspace),
  );
  return layout({
    workspace: ctx.workspace,
    files,
    currentFile: file,
    message,
    state,
    accounts,
  });
}

export async function handleFormat(
  ctx: RouteContext,
  file: string,
  content: string,
): Promise<HtmlString> {
  const files = await getWorkspaceFiles(ctx.workspace);

  try {
    const parsed = parseBeancount(content);
    const formatted = formatBeancountFile(parsed);
    const message = html`
      <div class="message success">Formatted successfully</div>
    `;
    const state = tryParse(formatted);
    const accounts = await getWorkspaceAccounts(
      ctx.workspace,
      await getBeancountFiles(ctx.workspace),
    );
    return layout({
      workspace: ctx.workspace,
      files,
      currentFile: file,
      message,
      state,
      accounts,
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof ParseError
        ? `${error.message} at line ${error.line}, column ${error.column}`
        : error instanceof Error
          ? error.message
          : String(error);
    const message = html`
      <div class="message error">Format error: ${errorMessage}</div>
    `;
    const state = tryParse(content);
    return layout({
      workspace: ctx.workspace,
      files,
      currentFile: file,
      message,
      state,
      accounts: [],
    });
  }
}
