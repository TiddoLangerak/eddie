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

function directiveSummary(
  d: Directive,
  currentFile: string | null,
): HtmlString {
  switch (d.type) {
    case "transaction": {
      const payeeNarration =
        d.payee != null ? `${d.payee} — ${d.narration}` : d.narration;
      const tagsLinks = [
        ...d.tags.map((tag) => tag),
        ...d.links.map((link) => link),
      ];
      const meta = tagsLinks.length > 0 ? ` [${tagsLinks.join(" ")}]` : "";
      return html`<span class="directive-summary">${payeeNarration}${meta}</span>`;
    }
    case "balance":
      return html`<span class="directive-summary">${d.account}: ${formatAmount(d.amount)}</span>`;
    case "open":
      return html`<span class="directive-summary">${d.account}${d.commodities.length > 0 ? ` (${d.commodities.join(", ")})` : ""}</span>`;
    case "close":
      return html`<span class="directive-summary">${d.account}</span>`;
    case "commodity":
      return html`<span class="directive-summary">${d.commodity}</span>`;
    case "pad":
      return html`<span class="directive-summary">${d.account} ← ${d.sourceAccount}</span>`;
    case "note":
      return html`<span class="directive-summary">${d.account}: ${d.comment}</span>`;
    case "document":
      return html`<span class="directive-summary">${d.account}: ${d.filename}</span>`;
    case "price":
      return html`<span class="directive-summary">${d.commodity} = ${formatAmount(d.amount)}</span>`;
    case "event":
      return html`<span class="directive-summary">${d.eventType}: ${d.description}</span>`;
    case "query":
      return html`<span class="directive-summary">${d.name}</span>`;
    case "custom":
      return html`<span class="directive-summary">${d.customType} ${d.values.map(String).join(" ")}</span>`;
    case "include": {
      const href = `?file=${encodeURIComponent(resolveIncludePath(currentFile, d.filename))}`;
      return html`<span class="directive-summary"><a href="${href}" class="include-link">${d.filename}</a></span>`;
    }
    case "plugin":
      return html`<span class="directive-summary">${d.module}${d.config != null ? ` ${d.config}` : ""}</span>`;
    case "option":
      return html`<span class="directive-summary">${d.name} = ${d.value}</span>`;
    default:
      return unreachable(d);
  }
}

function postingRow(p: Posting): HtmlString {
  const amountStr = p.amount != null ? formatAmount(p.amount) : "";
  const costStr = p.cost != null ? `{${formatAmount(p.cost)}}` : "";
  const priceStr = p.price != null ? `@ ${formatAmount(p.price)}` : "";
  const parts = [p.account, amountStr, costStr, priceStr].filter(Boolean);
  return html`<tr class="posting-row"><td colspan="3" class="posting-cell">${parts.join(" ")}</td></tr>`;
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
  const summary = directiveSummary(d, currentFile);
  const base = html`<tr class="directive-row directive-type-${typeLabel}" data-directive-index="${String(index)}">
		<td class="directive-date">${directiveDate(d)}</td>
		<td class="directive-type">${typeLabel}</td>
		<td class="directive-details">${summary}</td>
	</tr>`;

  if (d.type === "transaction") {
    const postingRows = d.postings
      .map((p) => postingRow(p))
      .reduce(joining(html`\n`), HtmlString.EMPTY);
    return new HtmlString(
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
