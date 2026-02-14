import { parseBeancount } from "@Tiddo/beancount-parser";
import { formatBeancountFile } from "@Tiddo/beancount-formatter";
const editor = document.getElementById("editor");
const parseBtn = document.getElementById("parse-btn");
const formatBtn = document.getElementById("format-btn");
const output = document.getElementById("output");
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
