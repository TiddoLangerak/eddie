import type { BeancountFile, Directive, Posting } from "@tiddo/beancount-types";

export interface BeancountData {
  file: string;
  model: BeancountFile;
}

function getData(): BeancountData | null {
  const el = document.getElementById("beancount-data");
  if (!el || !el.textContent) return null;
  try {
    // TODO: proper validation of parsed JSON instead of type assertion
    return JSON.parse(el.textContent) as BeancountData;
  } catch {
    return null;
  }
}

function getCurrentFile(): string {
  const app = document.getElementById("app");
  return app?.getAttribute("data-current-file") ?? "";
}

function getNumberAttribute(el: Element | null, attr: string): number | null {
  const value = el?.getAttribute(attr);
  if (value == null) return null;
  const n = parseInt(value, 10);
  return Number.isNaN(n) ? null : n;
}

function findPosting(directive: Directive, postingIndex: number): Posting | null {
  if (directive.type !== "transaction") return null;
  const p = directive.postings[postingIndex];
  return p ?? null;
}

/** Converts dash-separated field name to property path, e.g. "amount-number" -> ["amount", "number"]. */
function fieldPath(fieldName: string): string[] {
  return fieldName.split("-");
}

function setValue(obj: object, path: string[], value: unknown): void {
  const record = obj as Record<string, unknown>;
  const segments = path.slice(0, -1);
  const parent = segments.reduce(
    (current, key, i) => {
      const next = current[key];
      if (next == null) {
        current[key] = {};
      } else if (typeof next !== "object" || Array.isArray(next)) {
        const pathSoFar = path.slice(0, i + 1).join(".");
        throw new Error(`Expected object at path ${pathSoFar}, got ${typeof next}`);
      }
      return current[key] as Record<string, unknown>;
    },
    record,
  );
  parent[path[path.length - 1]] = value;
}

function initEditor(): void {
  const data = getData();
  if (!data?.model) return;

  const file = data.file || getCurrentFile();
  if (!file) return;

  const model = data.model;

  function onBlur(e: Event): void {
    const el = e.target as HTMLElement;
    const field = el.getAttribute("data-field");
    const row = el.closest("tr");
    const directiveIndex = getNumberAttribute(row, "data-directive-index");
    const postingIndex = getNumberAttribute(row, "data-posting-index");

    if (!field) return;
    if (directiveIndex == null) return;

    const directive = model.directives[directiveIndex];
    if (directive == null) return;
    const target =
      postingIndex != null ? findPosting(directive, postingIndex) : directive;
    if (target == null) return;

    const path = fieldPath(field);
    setValue(target, path, (el.textContent ?? "").trim());
  }

  document.querySelectorAll("[data-field][contenteditable=\"true\"]").forEach((el) => {
    el.addEventListener("blur", onBlur);
  });

  const saveBtn = document.getElementById("editor-save-btn");
  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      saveBtn.setAttribute("disabled", "true");
      fetch("/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file, model }),
      })
        .then((res) => {
          if (res.redirected) {
            window.location.href = res.url;
            return;
          }
          if (res.ok) return res.text().then(() => { window.location.reload(); });
          return res.text().then((t) => {
            saveBtn.removeAttribute("disabled");
            alert("Save failed: " + t);
          });
        })
        .catch((err) => {
          saveBtn.removeAttribute("disabled");
          alert("Save failed: " + (err instanceof Error ? err.message : String(err)));
        });
    });
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initEditor);
} else {
  initEditor();
}
