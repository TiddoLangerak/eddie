/**
 * Directive type selector using the reusable dropdown component.
 */

import { type DropdownOption, createDropdown } from "../dropdown.ts";

const DIRECTIVE_TYPES: DropdownOption[] = [
  { value: "transaction", label: "txn" },
  { value: "balance", label: "balance" },
  { value: "open", label: "open" },
  { value: "close", label: "close" },
  { value: "commodity", label: "commodity" },
  { value: "pad", label: "pad" },
  { value: "note", label: "note" },
  { value: "document", label: "document" },
  { value: "price", label: "price" },
  { value: "event", label: "event" },
  { value: "query", label: "query" },
  { value: "custom", label: "custom" },
  { value: "include", label: "include" },
  { value: "plugin", label: "plugin" },
  { value: "option", label: "option" },
];

export interface TypeSelectorCallbacks {
  onTypeSelected: (type: string) => void;
  onCancel: () => void;
}

export function showTypeSelector(
  anchor: HTMLElement,
  callbacks: TypeSelectorCallbacks,
): void {
  createDropdown(anchor, {
    options: DIRECTIVE_TYPES,
    defaultValue: "transaction",
    placeholder: "Select directive type...",
    onSelect: callbacks.onTypeSelected,
    onCancel: callbacks.onCancel,
  });
}
