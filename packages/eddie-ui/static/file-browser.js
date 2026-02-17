(function () {
  function toggleFolder(folder) {
    var children = folder.querySelector(":scope > .file-tree-folder-children");
    var btn = folder.querySelector(":scope > .file-tree-folder-header .file-tree-folder-toggle");
    if (!children || !btn) return;
    folder.classList.toggle("collapsed");
    var isExpanded = !folder.classList.contains("collapsed");
    btn.setAttribute("aria-expanded", isExpanded ? "true" : "false");
  }

  function initShowOtherFiles() {
    var checkbox = document.getElementById("file-browser-show-other");
    var tree = document.querySelector(".file-tree");
    if (!checkbox || !tree) return;
    checkbox.addEventListener("change", function () {
      tree.classList.toggle("show-other-files", checkbox.checked);
    });
  }

  function initFileTree() {
    document.querySelectorAll(".file-tree-folder").forEach(function (folder) {
      if (folder.dataset.initialized) return;
      folder.dataset.initialized = "true";

      var header = folder.querySelector(":scope > .file-tree-folder-header");
      if (header) {
        header.addEventListener("click", function () {
          toggleFolder(folder);
        });
      }
    });
    initShowOtherFiles();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initFileTree);
  } else {
    initFileTree();
  }
})();
