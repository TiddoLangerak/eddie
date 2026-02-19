const STORAGE_KEY_PREFIX = "eddie-filetree-";

interface FileBrowserState {
  expandedPaths: string[];
  showOtherFiles: boolean;
}

function getStorageKey(): string | null {
  const aside = document.querySelector(".file-browser");
  const workspace =
    aside instanceof HTMLElement ? aside.dataset.workspace : undefined;
  return workspace ? STORAGE_KEY_PREFIX + workspace : null;
}

function loadState(): FileBrowserState {
  const key = getStorageKey();
  if (!key) return { expandedPaths: [], showOtherFiles: false };
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return { expandedPaths: [], showOtherFiles: false };
    const data = JSON.parse(raw) as Partial<FileBrowserState>;
    return {
      expandedPaths: Array.isArray(data.expandedPaths)
        ? data.expandedPaths
        : [],
      showOtherFiles: Boolean(data.showOtherFiles),
    };
  } catch {
    return { expandedPaths: [], showOtherFiles: false };
  }
}

function saveState(expandedPaths: string[], showOtherFiles: boolean): void {
  const key = getStorageKey();
  if (!key) return;
  try {
    localStorage.setItem(
      key,
      JSON.stringify({ expandedPaths, showOtherFiles }),
    );
  } catch {}
}

function getExpandedPaths(): string[] {
  const paths: string[] = [];
  for (const folder of document.querySelectorAll(
    ".file-tree-folder:not(.collapsed)",
  )) {
    const path =
      folder instanceof HTMLElement ? folder.dataset.folderPath : undefined;
    if (path) paths.push(path);
  }
  return paths;
}

function toggleFolder(
  folder: Element,
  onAfterToggle: (() => void) | undefined,
): void {
  const children = folder.querySelector(":scope > .file-tree-folder-children");
  const btn = folder.querySelector(
    ":scope > .file-tree-folder-header .file-tree-folder-toggle",
  );
  if (!children || !btn) return;
  folder.classList.toggle("collapsed");
  const isExpanded = !folder.classList.contains("collapsed");
  btn.setAttribute("aria-expanded", isExpanded ? "true" : "false");
  if (onAfterToggle) onAfterToggle();
}

function initShowOtherFiles(state: FileBrowserState): void {
  const checkbox = document.getElementById("file-browser-show-other");
  const tree = document.querySelector(".file-tree");
  if (!checkbox || !(checkbox instanceof HTMLInputElement) || !tree) return;
  checkbox.checked = state.showOtherFiles;
  tree.classList.toggle("show-other-files", state.showOtherFiles);
  checkbox.addEventListener("change", () => {
    tree.classList.toggle("show-other-files", checkbox.checked);
    saveState(getExpandedPaths(), checkbox.checked);
  });
}

function restoreExpandedState(expandedPaths: string[]): void {
  if (!expandedPaths.length) return;
  const set = new Set(expandedPaths);
  for (const folder of document.querySelectorAll(".file-tree-folder")) {
    const path =
      folder instanceof HTMLElement ? folder.dataset.folderPath : undefined;
    if (path && set.has(path)) {
      folder.classList.remove("collapsed");
      const btn = folder.querySelector(
        ":scope > .file-tree-folder-header .file-tree-folder-toggle",
      );
      if (btn) btn.setAttribute("aria-expanded", "true");
    }
  }
}

function initFileTree(): void {
  const state = loadState();
  restoreExpandedState(state.expandedPaths);

  for (const folder of document.querySelectorAll(".file-tree-folder")) {
    if (folder instanceof HTMLElement && folder.dataset.initialized) continue;
    if (folder instanceof HTMLElement) folder.dataset.initialized = "true";

    const header = folder.querySelector(":scope > .file-tree-folder-header");
    if (header) {
      header.addEventListener("click", () => {
        toggleFolder(folder, () => {
          const otherCheckbox = document.getElementById(
            "file-browser-show-other",
          );
          const showOther =
            otherCheckbox instanceof HTMLInputElement
              ? otherCheckbox.checked
              : false;
          saveState(getExpandedPaths(), showOther);
        });
      });
    }
  }
  initShowOtherFiles(state);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initFileTree);
} else {
  initFileTree();
}
