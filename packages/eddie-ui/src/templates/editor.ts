import type { ParseError } from "@tiddo/beancount-parser";
import type { BeancountFile } from "@tiddo/beancount-types";
import { HtmlString, html, joining } from "../html.ts";
import { directivesView } from "./directivesView.ts";

function pathBreadcrumbs(path: string): HtmlString {
  const segments = path.split("/").filter(Boolean);
  if (segments.length === 0)
    return html`<span class="segment">${path || "/"}</span>`;
  const parts = segments.flatMap((segment, i) => {
    const isLast = i === segments.length - 1;
    const seg = html`<span class="segment">${segment}</span>`;
    return isLast
      ? [seg]
      : [seg, html`<span class="separator" aria-hidden="true">/</span>`];
  });
  return parts.reduce((acc, part) => html`${acc}${part}`, HtmlString.EMPTY);
}

function editorHeader(options: {
  currentFile: string;
  showSaveButton: boolean;
}): HtmlString {
  const { currentFile, showSaveButton } = options;
  const saveBtn = showSaveButton
    ? html`<button type="button" class="editor-save-btn" id="editor-save-btn">Save</button>`
    : HtmlString.EMPTY;
  return html`
		<div class="editor-header">
			<nav class="breadcrumbs" aria-label="File path">${pathBreadcrumbs(currentFile)}</nav>
			${saveBtn}
		</div>
	`;
}

export type EditorState =
  | { type: "success"; value: BeancountFile }
  | { type: "error"; error: ParseError; content: string }
  | null;

function parseErrorSourceView(content: string, error: ParseError): HtmlString {
  const lines = content.split("\n");
  const errorLineIndex = Math.max(
    0,
    Math.min(error.line - 1, lines.length - 1),
  );
  const lineContent = lines[errorLineIndex] ?? "";
  const columnIndex = Math.max(
    0,
    Math.min(error.column - 1, lineContent.length),
  );

  const lineParts = lines.map((line, i) => {
    const lineNo = i + 1;
    const isErrorLine = i === errorLineIndex;
    if (!isErrorLine) {
      return html`<div class="source-line" data-line="${String(lineNo)}"><span class="line-no">${String(lineNo)}</span>${line}</div>`;
    }
    const before = lineContent.slice(0, columnIndex);
    const atColumn = lineContent.slice(columnIndex, columnIndex + 1) || " ";
    const after = lineContent.slice(columnIndex + 1);
    return html`<div class="source-line error-line" data-line="${String(lineNo)}"><span class="line-no">${String(lineNo)}</span>${before}<span class="error-column">${atColumn}</span>${after}</div>`;
  });

  const linesHtml = lineParts.reduce(joining(html`\n`), HtmlString.EMPTY);
  return html`
		<div class="parse-error-view">
			<div class="message error">${error.message} (line ${String(error.line)}, column ${String(error.column)})</div>
			<pre class="parse-error-source"><code>${linesHtml}</code></pre>
		</div>
	`;
}

export function editor(
  currentFile: string | null,
  state: EditorState,
): HtmlString {
  if (!currentFile) {
    return html`
			<main class="editor-container">
				<p class="no-file">Select a file from the workspace to begin editing</p>
			</main>
		`;
  }

  if (state === null) {
    return html`
			<main class="editor-container">
				${editorHeader({ currentFile, showSaveButton: false })}
				<p class="no-file">No content.</p>
			</main>
		`;
  }

  if (state.type === "error") {
    return html`
			<main class="editor-container">
				${editorHeader({ currentFile, showSaveButton: false })}
				${parseErrorSourceView(state.content, state.error)}
			</main>
		`;
  }

  return html`
		<main class="editor-container">
			${editorHeader({ currentFile, showSaveButton: true })}
			${directivesView(state.value, currentFile)}
		</main>
	`;
}
