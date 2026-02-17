import { HtmlString, html } from "../html.ts";
import type { EditorState } from "./editor.ts";
import { editor } from "./editor.ts";
import { fileBrowser } from "./fileBrowser.ts";

export function layout(
  workspace: string,
  files: string[],
  currentFile: string | null,
  message: HtmlString = HtmlString.EMPTY,
  state: EditorState = null,
): HtmlString {
  return html`<!DOCTYPE html>
		<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>Eddie - Beancount Editor</title>
				<link rel="stylesheet" href="/static/style.css">
			</head>
			<body>
				<div id="app">
					<h1>Eddie - Beancount Editor</h1>
					${message}
					<div class="layout">
						${fileBrowser(workspace, files, currentFile)}
						${editor(currentFile, state)}
					</div>
				</div>
			</body>
		</html>`;
}
