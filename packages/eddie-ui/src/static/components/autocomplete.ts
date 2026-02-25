/**
 * General-purpose inline autocomplete dropdown: positions a list below an anchor,
 * handles keyboard (ArrowUp/Down, Enter, Tab, Escape), click outside, and blur.
 * Consumer supplies getItems() and calls update() when the anchor content changes.
 */

export interface AutocompleteInstance {
  update: () => void;
  close: () => void;
  destroy: () => void;
  isOpen: () => boolean;
  handleKeyDown: (e: KeyboardEvent) => boolean;
}

export interface AutocompleteOptions {
  anchor: HTMLElement;
  getItems: () => string[];
  onSelect: (value: string) => void;
  listClassName?: string;
  optionClassName?: string;
}

export function createAutocomplete(
  options: AutocompleteOptions,
): AutocompleteInstance {
  const {
    anchor,
    getItems,
    onSelect,
    listClassName = "dropdown",
    optionClassName = "dropdown-option",
  } = options;

  let listEl: HTMLElement | null = null;
  let selectedIndex = 0;
  let items: string[] = [];

  function isOpen(): boolean {
    return listEl?.isConnected ?? false;
  }

  function close(): void {
    if (listEl) {
      listEl.remove();
      listEl = null;
    }
    items = [];
  }

  function render(): void {
    if (!listEl) return;
    const ul = listEl.querySelector("ul");
    if (!ul) return;
    ul.innerHTML = "";
    items.forEach((s, i) => {
      const li = document.createElement("li");
      li.className = optionClassName;
      if (i === selectedIndex) li.classList.add("selected");
      li.textContent = s;
      li.addEventListener("click", () => apply(s));
      li.addEventListener("mouseenter", () => {
        for (const child of ul.children) {
          if (child instanceof HTMLElement) child.classList.remove("selected");
        }
        li.classList.add("selected");
        selectedIndex = i;
      });
      ul.appendChild(li);
    });
    const selected = ul.querySelector(".selected");
    if (selected) selected.scrollIntoView({ block: "nearest" });
  }

  function apply(value: string): void {
    onSelect(value);
    close();
  }

  function update(): void {
    items = getItems();
    if (items.length === 0) {
      close();
      return;
    }
    selectedIndex = 0;
    if (!listEl) {
      listEl = document.createElement("div");
      listEl.className = listClassName;
      listEl.addEventListener("mousedown", (e) => e.preventDefault(), {
        capture: true,
      });
      const ul = document.createElement("ul");
      ul.className = "dropdown-list";
      listEl.appendChild(ul);
      document.body.appendChild(listEl);
    }
    render();
    positionList();
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (listEl?.isConnected) positionList();
      });
    });
  }

  function positionList(): void {
    if (!listEl) return;
    const rect = anchor.getBoundingClientRect();
    const minWidth = Math.max(rect.width, 180);
    listEl.style.position = "fixed";
    listEl.style.left = `${rect.left}px`;
    listEl.style.minWidth = `${minWidth}px`;
    listEl.style.top = "auto";
    listEl.style.bottom = "auto";
    const listHeight = listEl.offsetHeight;
    const spaceBelow = window.innerHeight - rect.bottom;
    if (spaceBelow < listHeight) {
      listEl.style.top = "auto";
      listEl.style.bottom = `${window.innerHeight - rect.top}px`;
    } else {
      listEl.style.bottom = "auto";
      listEl.style.top = `${rect.bottom}px`;
    }
  }

  function handleKeyDown(e: KeyboardEvent): boolean {
    if (!isOpen()) return false;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
        render();
        return true;
      case "ArrowUp":
        e.preventDefault();
        selectedIndex = Math.max(selectedIndex - 1, 0);
        render();
        return true;
      case "Enter":
      case "Tab":
        e.preventDefault();
        if (items[selectedIndex] != null) {
          apply(items[selectedIndex]);
        }
        return true;
      case "Escape":
        e.preventDefault();
        close();
        return true;
      default:
        return false;
    }
  }

  function handleBlur(): void {
    setTimeout(() => {
      if (
        !anchor.contains(document.activeElement) &&
        !listEl?.contains(document.activeElement)
      ) {
        close();
      }
    }, 0);
  }

  function handleClickOutside(e: MouseEvent): void {
    const target = e.target as Node;
    if (listEl?.contains(target) || anchor.contains(target)) return;
    close();
  }

  anchor.addEventListener("blur", handleBlur);
  document.addEventListener("click", handleClickOutside, true);

  return {
    update,
    close,
    destroy() {
      close();
      anchor.removeEventListener("blur", handleBlur);
      document.removeEventListener("click", handleClickOutside, true);
    },
    isOpen,
    handleKeyDown,
  };
}
