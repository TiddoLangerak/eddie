import { type HtmlString, html } from "../html.ts";

export function editor(
  currentFile: string | null,
  content: string,
): HtmlString {
  if (!currentFile) {
    return html`
			<main class="editor-container">
				<p class="no-file">Select a file from the workspace to begin editing</p>
			</main>
		`;
  }

  return html`
		<main class="editor-container">
			<div class="editor-header">
				<span class="current-file">Editing: ${currentFile}</span>
			</div>
			<form method="POST">
				<input type="hidden" name="file" value="${currentFile}">
				<textarea name="content" id="editor">${content}</textarea>
				<div class="controls">
					<button type="submit" formaction="/save">Save</button>
					<button type="submit" formaction="/parse">Parse</button>
					<button type="submit" formaction="/format">Format</button>
				</div>
			</form>
		</main>
	`;
}
