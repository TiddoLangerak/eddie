import { dirname, join } from "node:path";
import type {
  Amount,
  BeancountFile,
  Directive,
  Posting,
} from "@tiddo/beancount-types";
import { unreachable } from "@tiddo/eddie-utils/unreachable";
import { HtmlString, html, joining } from "../html.ts";

function formatAmount(a: Amount): string {
  return `${a.number} ${a.commodity}`;
}

function resolveIncludePath(
  currentFile: string | null,
  filename: string,
): string {
  if (!currentFile) return filename;
  const resolved = join(dirname(currentFile), filename);
  return resolved.replace(/\\/g, "/");
}

function editableSpan(field: string, text: string): HtmlString {
  return html`<span contenteditable="true" data-field="${field}">${text}</span>`;
}

function directiveDetailsCell(
  d: Directive,
  currentFile: string | null,
): HtmlString {
  switch (d.type) {
    case "transaction": {
      const payeePart =
        d.payee != null
          ? html`${editableSpan("payee", d.payee)} — `
          : HtmlString.EMPTY;
      return html`${payeePart}${editableSpan("narration", d.narration)}`;
    }
    case "balance":
      return html`${editableSpan("account", d.account)}: ${editableSpan("amount-number", d.amount.number)} ${editableSpan("amount-commodity", d.amount.commodity)}`;
    case "open":
      return html`${editableSpan("account", d.account)}`;
    case "close":
      return html`${editableSpan("account", d.account)}`;
    case "commodity":
      return html`${editableSpan("commodity", d.commodity)}`;
    case "pad":
      return html`${editableSpan("account", d.account)} ← ${editableSpan("sourceAccount", d.sourceAccount)}`;
    case "note":
      return html`${editableSpan("account", d.account)}: ${editableSpan("comment", d.comment)}`;
    case "document":
      return html`${editableSpan("account", d.account)}: ${editableSpan("filename", d.filename)}`;
    case "price":
      return html`${editableSpan("commodity", d.commodity)} = ${editableSpan("amount-number", d.amount.number)} ${editableSpan("amount-commodity", d.amount.commodity)}`;
    case "event":
      return html`${editableSpan("eventType", d.eventType)}: ${editableSpan("description", d.description)}`;
    case "query":
      return html`${editableSpan("name", d.name)}`;
    case "custom":
      return html`${editableSpan("customType", d.customType)} ${d.values.map(String).join(" ")}`;
    case "include": {
      const href = `?file=${encodeURIComponent(resolveIncludePath(currentFile, d.filename))}`;
      return html`<a href="${href}" class="include-link">${d.filename}</a>`;
    }
    case "plugin":
      return html`${d.module}${d.config != null ? ` ${d.config}` : ""}`;
    case "option":
      return html`${d.name} = ${d.value}`;
    default:
      return unreachable(d);
  }
}

function postingRow(
  p: Posting,
  directiveIndex: number,
  postingIndex: number,
): HtmlString {
  const accountSpan = editableSpan("account", p.account);
  let amountPart = HtmlString.EMPTY;
  if (p.amount != null) {
    amountPart = html` ${editableSpan("amount-number", p.amount.number)} ${editableSpan("amount-commodity", p.amount.commodity)}`;
  }
  const costStr = p.cost != null ? ` {${formatAmount(p.cost)}}` : "";
  const priceStr = p.price != null ? ` @ ${formatAmount(p.price)}` : "";
  return html`<tr class="posting-row" data-directive-index="${directiveIndex}" data-posting-index="${postingIndex}"><td colspan="3" class="posting-cell">${accountSpan}${amountPart}${costStr}${priceStr}</td></tr>`;
}

function directiveDate(d: Directive): string {
  switch (d.type) {
    case "include":
    case "plugin":
    case "option":
      return "";
    default:
      return d.date;
  }
}

function directiveRow(
  d: Directive,
  index: number,
  currentFile: string | null,
): HtmlString {
  const typeLabel = d.type === "transaction" ? "txn" : d.type;
  const dateStr = directiveDate(d);
  const dateCell =
    dateStr !== ""
      ? html`<td class="directive-date">${editableSpan("date", dateStr)}</td>`
      : html`<td class="directive-date"></td>`;
  const details = directiveDetailsCell(d, currentFile);
  const base = html`<tr class="directive-row directive-type-${typeLabel}" data-directive-index="${String(index)}">
		${dateCell}
		<td class="directive-type">${typeLabel}</td>
		<td class="directive-details">${details}</td>
	</tr>`;

  if (d.type === "transaction") {
    const postingRows = d.postings
      .map((p, i) => postingRow(p, index, i))
      .reduce(joining(html`\n`), HtmlString.EMPTY);
    return HtmlString.unsafe(
      base.toString() + (postingRows.toString() ? postingRows.toString() : ""),
    );
  }
  return base;
}

export function directivesView(
  parsed: BeancountFile,
  currentFile: string | null = null,
): HtmlString {
  const rows = parsed.directives
    .map((d, i) => directiveRow(d, i, currentFile))
    .reduce(joining(html`\n`), HtmlString.EMPTY);

  if (parsed.directives.length === 0) {
    return html`
			<div class="directives-empty">No directives in this file.</div>
		`;
  }

  return html`
		<div class="directives-view">
			<table class="directives-table">
				<thead>
					<tr>
						<th class="col-date">Date</th>
						<th class="col-type">Type</th>
						<th class="col-details">Details</th>
					</tr>
				</thead>
				<tbody>
					${rows}
				</tbody>
			</table>
		</div>
	`;
}
