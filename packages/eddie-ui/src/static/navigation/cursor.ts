/**
 * Cursor position and focus utilities for contenteditable elements.
 */

export function getCaretPosition(el: HTMLElement): number {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return 0;
  const range = selection.getRangeAt(0);
  if (!el.contains(range.startContainer)) return 0;
  const preCaretRange = range.cloneRange();
  preCaretRange.selectNodeContents(el);
  preCaretRange.setEnd(range.startContainer, range.startOffset);
  return preCaretRange.toString().length;
}

export function getTextLength(el: HTMLElement): number {
  return (el.textContent ?? "").length;
}

export function isAtEnd(el: HTMLElement): boolean {
  return getCaretPosition(el) >= getTextLength(el);
}

export function isAtStart(el: HTMLElement): boolean {
  return getCaretPosition(el) === 0;
}

export function isEmpty(el: HTMLElement): boolean {
  const text = el.textContent ?? "";
  return text.trim().length === 0;
}

export function focusAtStart(el: HTMLElement): void {
  el.focus();
  const range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(true);
  const selection = window.getSelection();
  if (selection) {
    selection.removeAllRanges();
    selection.addRange(range);
  }
}

export function focusAtEnd(el: HTMLElement): void {
  el.focus();
  const range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(false);
  const selection = window.getSelection();
  if (selection) {
    selection.removeAllRanges();
    selection.addRange(range);
  }
}
