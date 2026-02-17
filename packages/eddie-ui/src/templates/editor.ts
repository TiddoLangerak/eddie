import type { BeancountFile } from "@tiddo/beancount-types";
import type { ParseError } from "@tiddo/beancount-parser";
import { HtmlString, html, joining } from "../html.ts";
import { directivesView } from "./directivesView.ts";

export type EditorState =
  | { tag: "parsed"; value: BeancountFile }
  | { tag: "parseError"; error: ParseError; content: string }
  | null;

function parseErrorSourceView(content: string, error: ParseError): HtmlString {
  const lines = content.split("\n");
  const errorLineIndex = Math.max(0, Math.min(error.line - 1, lines.length - 1));
  const lineContent = lines[errorLineIndex] ?? "";
  const columnIndex = Math.max(0, Math.min(error.column - 1, lineContent.length));

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

export function editor(currentFile: string | null, state: EditorState): HtmlString {
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
				<div class="editor-header">
					<span class="current-file">${currentFile}</span>
				</div>
				<p class="no-file">No content.</p>
			</main>
		`;
  }

  if (state.tag === "parseError") {
    return html`
			<main class="editor-container">
				<div class="editor-header">
					<span class="current-file">${currentFile}</span>
				</div>
				${parseErrorSourceView(state.content, state.error)}
			</main>
		`;
  }

  return html`
		<main class="editor-container">
			<div class="editor-header">
				<span class="current-file">${currentFile}</span>
			</div>
			${directivesView(state.value)}
		</main>
	`;
}
