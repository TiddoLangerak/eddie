export class HtmlString {
  static readonly EMPTY = new HtmlString("");
  private readonly html: string;

  constructor(html: string) {
    this.html = html;
  }
  toString(): string {
    return this.html;
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
  return new HtmlString(result);
}

export function joining(
  separator: string | HtmlString = "",
): (acc: HtmlString, item: HtmlString) => HtmlString {
  const safeSeparator = escapeHtml(separator);
  return (acc, item) => {
    if (acc === HtmlString.EMPTY) return item;
    return new HtmlString(acc.toString() + safeSeparator + item.toString());
  };
}
