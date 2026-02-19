export class HtmlString {
  static readonly EMPTY = HtmlString.unsafe("");
  private readonly html: string;

  private constructor(html: string) {
    this.html = html;
  }

  static unsafe(html: string): HtmlString {
    return new HtmlString(html);
  }

  toString(): string {
    return this.html;
  }

  /**
   * Returns a complete <script type="application/json" id="..."> tag with the
   * object as JSON content, escaped for safe embedding.
   */
  static jsonScript(obj: unknown, id: string): HtmlString {
    const raw = JSON.stringify(obj);
    const safeContent = raw
      .replace(/&/g, "\\u0026")
      .replace(/</g, "\\u003c")
      .replace(/>/g, "\\u003e");
    return html`<script type="application/json" id="${id}">${HtmlString.unsafe(safeContent)}</script>`;
  }
}

function escapeHtml(unsafe: unknown): string {
  if (unsafe instanceof HtmlString) return unsafe.toString();
  const str = String(unsafe ?? "");
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function html(
  strings: TemplateStringsArray,
  ...values: unknown[]
): HtmlString {
  let result = strings[0];
  for (let i = 0; i < values.length; i++) {
    result += escapeHtml(values[i]) + strings[i + 1];
  }
  return HtmlString.unsafe(result);
}

export function joining(
  separator: string | HtmlString = "",
): (acc: HtmlString, item: HtmlString) => HtmlString {
  const safeSeparator = escapeHtml(separator);
  return (acc, item) => {
    if (acc === HtmlString.EMPTY) return item;
    return HtmlString.unsafe(acc.toString() + safeSeparator + item.toString());
  };
}
