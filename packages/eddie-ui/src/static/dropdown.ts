/**
 * Reusable dropdown component with filtering and keyboard navigation.
 */

export interface DropdownOption {
  value: string;
  label: string;
}

export interface DropdownConfig {
  options: DropdownOption[];
  defaultValue?: string;
  placeholder?: string;
  onSelect: (value: string) => void;
  onCancel?: () => void;
}

export interface DropdownInstance {
  destroy: () => void;
  element: HTMLElement;
}

export function createDropdown(
  anchor: HTMLElement,
  config: DropdownConfig,
): DropdownInstance {
  const dropdown = document.createElement("div");
  dropdown.className = "dropdown";

  const input = document.createElement("input");
  input.type = "text";
  input.className = "dropdown-input";
  input.placeholder = config.placeholder ?? "Type to filter...";
  if (config.defaultValue) {
    input.value = config.defaultValue;
  }

  const list = document.createElement("ul");
  list.className = "dropdown-list";

  dropdown.appendChild(input);
  dropdown.appendChild(list);

  let filteredOptions = [...config.options];
  let selectedIndex = config.defaultValue
    ? config.options.findIndex((o) => o.value === config.defaultValue)
    : 0;

  function renderOptions(): void {
    list.innerHTML = "";
    filteredOptions.forEach((option, index) => {
      const li = document.createElement("li");
      li.className = "dropdown-option";
      if (index === selectedIndex) {
        li.classList.add("selected");
      }
      li.textContent = option.label;
      li.addEventListener("click", () => selectOption(option.value));
      li.addEventListener("mouseenter", () => {
        selectedIndex = index;
        renderOptions();
      });
      list.appendChild(li);
    });
    scrollSelectedIntoView();
  }

  function scrollSelectedIntoView(): void {
    const selected = list.querySelector(".selected");
    if (selected) {
      selected.scrollIntoView({ block: "nearest" });
    }
  }

  function filterOptions(query: string): void {
    const lowerQuery = query.toLowerCase();
    filteredOptions = config.options.filter(
      (o) =>
        o.label.toLowerCase().includes(lowerQuery) ||
        o.value.toLowerCase().includes(lowerQuery),
    );
    selectedIndex = 0;
    renderOptions();
  }

  function selectOption(value: string): void {
    config.onSelect(value);
    destroy();
  }

  function handleKeyDown(e: KeyboardEvent): void {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        selectedIndex = Math.min(selectedIndex + 1, filteredOptions.length - 1);
        renderOptions();
        break;
      case "ArrowUp":
        e.preventDefault();
        selectedIndex = Math.max(selectedIndex - 1, 0);
        renderOptions();
        break;
      case "Enter":
        e.preventDefault();
        if (filteredOptions[selectedIndex]) {
          selectOption(filteredOptions[selectedIndex].value);
        }
        break;
      case "Escape":
        e.preventDefault();
        config.onCancel?.();
        destroy();
        break;
      case "Tab":
        e.preventDefault();
        if (filteredOptions[selectedIndex]) {
          selectOption(filteredOptions[selectedIndex].value);
        }
        break;
    }
  }

  function handleInput(): void {
    filterOptions(input.value);
  }

  function handleClickOutside(e: MouseEvent): void {
    if (!dropdown.contains(e.target as Node)) {
      config.onCancel?.();
      destroy();
    }
  }

  function destroy(): void {
    input.removeEventListener("keydown", handleKeyDown);
    input.removeEventListener("input", handleInput);
    document.removeEventListener("click", handleClickOutside, true);
    dropdown.remove();
  }

  input.addEventListener("keydown", handleKeyDown);
  input.addEventListener("input", handleInput);
  document.addEventListener("click", handleClickOutside, true);

  positionDropdown(dropdown, anchor);
  document.body.appendChild(dropdown);

  renderOptions();
  input.focus();
  input.select();

  return { destroy, element: dropdown };
}

function positionDropdown(dropdown: HTMLElement, anchor: HTMLElement): void {
  const rect = anchor.getBoundingClientRect();
  dropdown.style.position = "fixed";
  dropdown.style.top = `${rect.top}px`;
  dropdown.style.left = `${rect.left}px`;
  dropdown.style.minWidth = `${Math.max(rect.width, 150)}px`;
}
