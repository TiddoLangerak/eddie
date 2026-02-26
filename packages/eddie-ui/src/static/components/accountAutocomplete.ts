/**
 * Account-specific autocomplete: wires the generic dropdown to account suggestions
 * (segment + full) and field behavior (getQuery, apply with focus, reopen on ":").
 */

import { buildSuggestions } from "../accountAutocomplete.ts";
import { focusAtEnd } from "../navigation/cursor.ts";
import { createAutocomplete } from "./autocomplete.ts";

export interface AccountAutocompleteInstance {
  destroy: () => void;
  isOpen: () => boolean;
  handleKeyDown: (e: KeyboardEvent) => boolean;
}

export function createAccountAutocomplete(
  field: HTMLElement,
  accounts: string[],
  onSelect: (value: string) => void,
): AccountAutocompleteInstance {
  function getQuery(): string {
    return (field.textContent ?? "").trim();
  }

  function getItems(): string[] {
    return buildSuggestions(accounts, getQuery());
  }

  const autocomplete = createAutocomplete({
    anchor: field,
    getItems,
    onSelect(value: string) {
      field.textContent = value;
      focusAtEnd(field);
      onSelect(value);
      if (value.endsWith(":")) {
        autocomplete.update();
      }
    },
    listClassName: "account-autocomplete dropdown",
    optionClassName: "dropdown-option account-autocomplete-option",
  });

  function handleInput(): void {
    autocomplete.update();
  }

  function handleFocus(): void {
    if (getQuery().length > 0) {
      autocomplete.update();
    }
  }

  field.addEventListener("input", handleInput);
  field.addEventListener("focus", handleFocus);

  return {
    destroy() {
      field.removeEventListener("input", handleInput);
      field.removeEventListener("focus", handleFocus);
      autocomplete.destroy();
    },
    isOpen: autocomplete.isOpen,
    handleKeyDown: autocomplete.handleKeyDown,
  };
}
