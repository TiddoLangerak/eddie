import { HtmlString, html } from "../html.ts";
import type { BeancountData } from "../static/editor.ts";
import type { EditorState } from "./editor.ts";
import { editor } from "./editor.ts";
import { fileBrowser } from "./fileBrowser.ts";

import type { WorkspaceFile } from "../beancountController.ts";

export interface LayoutOptions {
  workspace: string;
  files: WorkspaceFile[];
  currentFile?: string | null;
  message?: HtmlString;
  state?: EditorState | null;
}

export function layout(options: LayoutOptions): HtmlString {
  const {
    workspace,
    files,
    currentFile = null,
    message = HtmlString.EMPTY,
    state = null,
  } = options;
  const beancountData: BeancountData | null =
    currentFile != null && state?.type === "success"
      ? { file: currentFile, model: state.value }
      : null;
  const dataScript =
    beancountData != null
      ? html`
				${HtmlString.jsonScript(beancountData, "beancount-data")}
				<script type="module" src="/static/editor.js"></script>
			`
      : HtmlString.EMPTY;
  return html`<!DOCTYPE html>
		<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>Eddie - Beancount Editor</title>
				<link rel="stylesheet" href="/static/style.css">
			</head>
			<body>
				<div id="app" data-current-file="${currentFile ?? ""}">
					<h1>Eddie - Beancount Editor</h1>
					${message}
					<div class="layout">
						${fileBrowser(workspace, files, currentFile)}
						${editor(currentFile, state)}
					</div>
				</div>
				<script src="/static/file-browser.js"></script>
				${dataScript}
			</body>
		</html>`;
}
