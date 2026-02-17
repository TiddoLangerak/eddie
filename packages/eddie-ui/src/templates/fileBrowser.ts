import { HtmlString, html, joining } from "../html.ts";

type TreeEntry =
  | { type: "file"; name: string; path: string; isBeancount: boolean }
  | {
      type: "folder";
      name: string;
      children: TreeEntry[];
      hasBeancountDescendant?: boolean;
    };

function addPath(
  level: TreeEntry[],
  parts: string[],
  fullPath: string,
  isBeancount: boolean,
): void {
  if (parts.length === 1) {
    const existing = level.find(
      (e): e is TreeEntry & { type: "file" } =>
        e.type === "file" && e.path === fullPath,
    );
    if (existing) {
      existing.isBeancount = existing.isBeancount || isBeancount;
      return;
    }
    level.push({ type: "file", name: parts[0], path: fullPath, isBeancount });
    return;
  }
  const [head, ...rest] = parts;
  let folder = level.find(
    (e): e is TreeEntry & { type: "folder" } =>
      e.type === "folder" && e.name === head,
  );
  if (!folder) {
    folder = { type: "folder", name: head, children: [] };
    level.push(folder);
  }
  addPath(folder.children, rest, fullPath, isBeancount);
}

function sortEntries(entries: TreeEntry[]): void {
  entries.sort((a, b) => {
    if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  for (const e of entries) {
    if (e.type === "folder") sortEntries(e.children);
  }
}

function hasBeancountInSubtree(entry: TreeEntry): boolean {
  if (entry.type === "file") return entry.isBeancount;
  const hasBeancount = entry.children.some(hasBeancountInSubtree);
  entry.hasBeancountDescendant = hasBeancount;
  return hasBeancount;
}

function buildFileTree(
  files: { path: string; isBeancount: boolean }[],
): TreeEntry[] {
  const root: TreeEntry[] = [];
  for (const { path: filePath, isBeancount } of files) {
    addPath(root, filePath.split("/"), filePath, isBeancount);
  }
  sortEntries(root);
  for (const entry of root) {
    hasBeancountInSubtree(entry);
  }
  return root;
}

function renderTreeEntry(
  entry: TreeEntry,
  currentFile: string | null,
  depth: number,
): HtmlString {
  if (entry.type === "file") {
    const active =
      entry.isBeancount && entry.path === currentFile ? "active" : "";
    const other = entry.isBeancount ? "" : " file-tree-file-other";
    if (entry.isBeancount) {
      const query = new HtmlString(`file=${encodeURIComponent(entry.path)}`);
      return html`
			<li class="file-tree-file ${active}${other}" data-depth="${String(depth)}">
				<div class="file-tree-row">
					<span class="file-tree-icon" aria-hidden="true"></span>
					<a class="file-tree-name" href="/?${query}">${entry.name}</a>
				</div>
			</li>
		`;
    }
    return html`
			<li class="file-tree-file ${active}${other}" data-depth="${String(depth)}">
				<div class="file-tree-row">
					<span class="file-tree-icon" aria-hidden="true"></span>
					<span class="file-tree-name">${entry.name}</span>
				</div>
			</li>
		`;
  }

  const childrenHtml = entry.children
    .map((child) => renderTreeEntry(child, currentFile, depth + 1))
    .reduce(joining(""), HtmlString.EMPTY);

  const hasBeancountClass = entry.hasBeancountDescendant
    ? " file-tree-folder-has-beancount"
    : "";
  const collapsedClass = " collapsed";

  return html`
		<li class="file-tree-folder${hasBeancountClass}${collapsedClass}" data-depth="${String(depth)}" data-folder="${entry.name}">
			<div class="file-tree-row file-tree-folder-header">
				<span class="file-tree-icon">
					<button type="button" class="file-tree-folder-toggle" aria-expanded="false" aria-label="Toggle ${entry.name}">
						<span class="file-tree-chevron" aria-hidden="true">▼</span>
					</button>
				</span>
				<span class="file-tree-name">${entry.name}</span>
			</div>
			<ul class="file-tree-folder-children">
				${childrenHtml}
			</ul>
		</li>
	`;
}

export function fileBrowser(
  workspace: string,
  files: { path: string; isBeancount: boolean }[],
  currentFile: string | null,
): HtmlString {
  const tree = buildFileTree(files);
  const treeHtml = tree
    .map((entry) => renderTreeEntry(entry, currentFile, 0))
    .reduce(joining(""), HtmlString.EMPTY);

  return html`
		<aside class="file-browser">
			<h2>Workspace Files</h2>
			<div class="workspace-path">${workspace}</div>
			<label class="file-browser-toggle">
				<input type="checkbox" id="file-browser-show-other" class="file-browser-show-other" aria-label="Show non-beancount files">
				Show all files
			</label>
			<ul class="file-tree">
				${treeHtml}
			</ul>
		</aside>
	`;
}
