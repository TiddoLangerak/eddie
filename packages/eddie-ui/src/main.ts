import { parseBeancount } from "@Tiddo/beancount-parser";
import { formatBeancountFile } from "@Tiddo/beancount-formatter";

function getElementByIdTyped<T extends HTMLElement>(
  id: string,
  elementType: { new (): T },
): T {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Element with id '${id}' not found`);
  }
  if (!(element instanceof elementType)) {
    throw new Error(
      `Element with id '${id}' is not of expected type ${elementType.name}`,
    );
  }
  return element;
}

const editor = getElementByIdTyped("editor", HTMLTextAreaElement);
const parseBtn = getElementByIdTyped("parse-btn", HTMLButtonElement);
const formatBtn = getElementByIdTyped("format-btn", HTMLButtonElement);
const output = getElementByIdTyped("output", HTMLPreElement);

parseBtn.addEventListener("click", () => {
  const content = editor.value;
  try {
    const parsed = parseBeancount(content);
    output.textContent = JSON.stringify(parsed, null, 2);
  } catch (error) {
    output.textContent = `Parse error: ${error}`;
  }
});

formatBtn.addEventListener("click", () => {
  const content = editor.value;
  try {
    const parsed = parseBeancount(content);
    const formatted = formatBeancountFile(parsed);
    editor.value = formatted;
    output.textContent = "Formatted successfully";
  } catch (error) {
    output.textContent = `Format error: ${error}`;
  }
});
