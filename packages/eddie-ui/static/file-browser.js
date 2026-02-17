(function () {
  var STORAGE_KEY_PREFIX = "eddie-filetree-";

  function getStorageKey() {
    var aside = document.querySelector(".file-browser");
    var workspace = aside && aside.dataset.workspace;
    return workspace ? STORAGE_KEY_PREFIX + workspace : null;
  }

  function loadState() {
    var key = getStorageKey();
    if (!key) return { expandedPaths: [], showOtherFiles: false };
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return { expandedPaths: [], showOtherFiles: false };
      var data = JSON.parse(raw);
      return {
        expandedPaths: Array.isArray(data.expandedPaths) ? data.expandedPaths : [],
        showOtherFiles: Boolean(data.showOtherFiles),
      };
    } catch (_) {
      return { expandedPaths: [], showOtherFiles: false };
    }
  }

  function saveState(expandedPaths, showOtherFiles) {
    var key = getStorageKey();
    if (!key) return;
    try {
      localStorage.setItem(
        key,
        JSON.stringify({ expandedPaths: expandedPaths, showOtherFiles: showOtherFiles }),
      );
    } catch (_) {}
  }

  function getExpandedPaths() {
    var paths = [];
    document.querySelectorAll(".file-tree-folder:not(.collapsed)").forEach(function (folder) {
      var path = folder.dataset.folderPath;
      if (path) paths.push(path);
    });
    return paths;
  }

  function toggleFolder(folder, onAfterToggle) {
    var children = folder.querySelector(":scope > .file-tree-folder-children");
    var btn = folder.querySelector(":scope > .file-tree-folder-header .file-tree-folder-toggle");
    if (!children || !btn) return;
    folder.classList.toggle("collapsed");
    var isExpanded = !folder.classList.contains("collapsed");
    btn.setAttribute("aria-expanded", isExpanded ? "true" : "false");
    if (onAfterToggle) onAfterToggle();
  }

  function initShowOtherFiles(state) {
    var checkbox = document.getElementById("file-browser-show-other");
    var tree = document.querySelector(".file-tree");
    if (!checkbox || !tree) return;
    checkbox.checked = state.showOtherFiles;
    tree.classList.toggle("show-other-files", state.showOtherFiles);
    checkbox.addEventListener("change", function () {
      tree.classList.toggle("show-other-files", checkbox.checked);
      saveState(getExpandedPaths(), checkbox.checked);
    });
  }

  function restoreExpandedState(expandedPaths) {
    if (!expandedPaths.length) return;
    var set = new Set(expandedPaths);
    document.querySelectorAll(".file-tree-folder").forEach(function (folder) {
      var path = folder.dataset.folderPath;
      if (path && set.has(path)) {
        folder.classList.remove("collapsed");
        var btn = folder.querySelector(":scope > .file-tree-folder-header .file-tree-folder-toggle");
        if (btn) btn.setAttribute("aria-expanded", "true");
      }
    });
  }

  function initFileTree() {
    var state = loadState();
    restoreExpandedState(state.expandedPaths);

    document.querySelectorAll(".file-tree-folder").forEach(function (folder) {
      if (folder.dataset.initialized) return;
      folder.dataset.initialized = "true";

      var header = folder.querySelector(":scope > .file-tree-folder-header");
      if (header) {
        header.addEventListener("click", function () {
          toggleFolder(folder, function () {
            saveState(getExpandedPaths(), document.getElementById("file-browser-show-other").checked);
          });
        });
      }
    });
    initShowOtherFiles(state);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initFileTree);
  } else {
    initFileTree();
  }
})();
