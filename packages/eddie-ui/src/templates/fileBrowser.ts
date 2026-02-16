import { HtmlString, html, joining } from "../html.ts";

export function fileBrowser(
  workspace: string,
  files: string[],
  currentFile: string | null,
): HtmlString {
  return html`
		<aside class="file-browser">
			<h2>Workspace Files</h2>
			<div class="workspace-path">${workspace}</div>
			<ul class="file-list">
				${files
          .map(
            (file) => html`
							<li class="${file === currentFile ? "active" : ""}">
								<a href="/?file=${file}">${file}</a>
							</li>
						`,
          )
          .reduce(joining(""), HtmlString.EMPTY)}
			</ul>
		</aside>
	`;
}
