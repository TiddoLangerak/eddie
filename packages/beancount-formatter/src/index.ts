import type {
  Amount,
  Balance,
  BeancountFile,
  Close,
  CommentOrBlank,
  Commodity,
  Custom,
  Directive,
  Document,
  Event,
  Note,
  Open,
  Pad,
  Posting,
  Price,
  Query,
  Transaction,
} from "@Tiddo/beancount-types";
import { unreachable } from "@Tiddo/eddie-utils/unreachable";

/**
 * Formats a BeancountFile object back into a Beancount file string.
 *
 * @param file - The BeancountFile object to format
 * @returns A formatted Beancount file string
 */
export function formatBeancountFile(file: BeancountFile): string {
  const header = file.header?.map(formatCommentOrBlank) ?? [];
  const directives = file.directives.map(formatDirective);
  const footer = file.footer?.map(formatCommentOrBlank) ?? [];

  return [...header, ...directives, ...footer].join("\n");
}

function formatCommentOrBlank(item: CommentOrBlank): string {
  switch (item.kind) {
    case "blank":
      return "";
    case "comment":
      return formatComment(item.comment);
    default:
      unreachable(item);
  }
}

function appendInlineComment(
  formattedDirective: string,
  inlineComment: string | undefined,
): string {
  if (!inlineComment) {
    return formattedDirective;
  }

  const lines = formattedDirective.split("\n");
  lines[0] += ` ${formatComment(inlineComment)}`;
  return lines.join("\n");
}

function formatDirective(directive: Directive): string {
  const headerLines =
    directive.formatting?.header?.map(formatCommentOrBlank) ?? [];

  let formattedDirective = "";
  switch (directive.type) {
    case "transaction":
      formattedDirective = formatTransaction(directive);
      break;
    case "balance":
      formattedDirective = formatBalance(directive);
      break;
    case "open":
      formattedDirective = formatOpen(directive);
      break;
    case "close":
      formattedDirective = formatClose(directive);
      break;
    case "commodity":
      formattedDirective = formatCommodity(directive);
      break;
    case "pad":
      formattedDirective = formatPad(directive);
      break;
    case "note":
      formattedDirective = formatNote(directive);
      break;
    case "document":
      formattedDirective = formatDocument(directive);
      break;
    case "price":
      formattedDirective = formatPrice(directive);
      break;
    case "event":
      formattedDirective = formatEvent(directive);
      break;
    case "query":
      formattedDirective = formatQuery(directive);
      break;
    case "custom":
      formattedDirective = formatCustom(directive);
      break;
    default:
      unreachable(directive);
  }

  formattedDirective = appendInlineComment(
    formattedDirective,
    directive.formatting?.inlineComment,
  );

  const footerLines =
    directive.formatting?.footer?.map(formatCommentOrBlank) ?? [];

  return [...headerLines, formattedDirective, ...footerLines].join("\n");
}

function formatTransaction(txn: Transaction): string {
  const parts = [txn.date, txn.flag];

  if (txn.payee) {
    parts.push(quoted(txn.payee));
  }

  parts.push(quoted(txn.narration));

  const tags = txn.tags?.map((tag) => `#${tag}`) ?? [];
  const links = txn.links?.map((link) => `^${link}`) ?? [];

  const headerLine = [...parts, ...tags, ...links].join(" ");

  const metadataHeaderLines =
    txn.metadataHeader?.map((item) => `  ${formatCommentOrBlank(item)}`) ?? [];

  const metadataLines = txn.metadata
    ? Object.entries(txn.metadata).map(
        ([key, value]) => `  ${key}: ${formatMetadataValue(value)}`,
      )
    : [];

  const postingLines = txn.postings.map(formatPosting);

  return [
    headerLine,
    ...metadataHeaderLines,
    ...metadataLines,
    ...postingLines,
  ].join("\n");
}

function formatPosting(posting: Posting): string {
  const commentsBefore =
    posting.formatting?.header?.map(
      (comment) => `  ${formatCommentOrBlank(comment)}`,
    ) ?? [];

  let postingLine = `  ${posting.account}`;

  if (posting.amount) {
    postingLine += `  ${formatAmount(posting.amount)}`;
  }

  if (posting.cost) {
    postingLine += ` {${formatAmount(posting.cost)}}`;
  }

  if (posting.price) {
    postingLine += ` @ ${formatAmount(posting.price)}`;
  }

  if (posting.formatting?.inlineComment) {
    postingLine += `  ${formatComment(posting.formatting.inlineComment)}`;
  }

  const metadataLines = posting.metadata
    ? Object.entries(posting.metadata).map(
        ([key, value]) => `    ${key}: ${formatMetadataValue(value)}`,
      )
    : [];

  const commentsAfter =
    posting.formatting?.footer?.map(
      (comment) => `  ${formatCommentOrBlank(comment)}`,
    ) ?? [];

  return [
    ...commentsBefore,
    postingLine,
    ...metadataLines,
    ...commentsAfter,
  ].join("\n");
}

function formatBalance(balance: Balance): string {
  return `${balance.date} balance ${balance.account} ${formatAmount(balance.amount)}`;
}

function formatOpen(open: Open): string {
  let result = `${open.date} open ${open.account}`;

  if (open.currencies && open.currencies.length > 0) {
    result += ` ${open.currencies.join(",")}`;
  }

  if (open.booking) {
    result += ` ${quoted(open.booking)}`;
  }

  return result;
}

function formatClose(close: Close): string {
  return `${close.date} close ${close.account}`;
}

function formatCommodity(commodity: Commodity): string {
  return `${commodity.date} commodity ${commodity.currency}`;
}

function formatPad(pad: Pad): string {
  return `${pad.date} pad ${pad.account} ${pad.sourceAccount}`;
}

function formatNote(note: Note): string {
  return `${note.date} note ${note.account} ${quoted(note.comment)}`;
}

function formatDocument(document: Document): string {
  return `${document.date} document ${document.account} ${quoted(document.filename)}`;
}

function formatPrice(price: Price): string {
  return `${price.date} price ${price.currency} ${formatAmount(price.amount)}`;
}

function formatEvent(event: Event): string {
  return `${event.date} event ${quoted(event.eventType)} ${quoted(event.description)}`;
}

function formatQuery(query: Query): string {
  return `${query.date} query ${quoted(query.name)} ${quoted(query.queryString)}`;
}

function formatCustom(custom: Custom): string {
  const values = custom.values
    .map((v: unknown) => formatCustomValue(v))
    .join(" ");
  return `${custom.date} custom ${quoted(custom.customType)} ${values}`;
}

function formatAmount(amount: Amount): string {
  return `${amount.number} ${amount.currency}`;
}

function formatComment(comment: string): string {
  return comment.startsWith(";") ? comment : `; ${comment}`;
}

function formatMetadataValue(value: unknown): string {
  if (typeof value === "string") {
    return quoted(value);
  }
  if (typeof value === "boolean") {
    return value ? "TRUE" : "FALSE";
  }
  if (typeof value === "number") {
    return String(value);
  }
  if (value === null || value === undefined) {
    return "NULL";
  }
  return JSON.stringify(value);
}

function formatCustomValue(value: unknown): string {
  if (typeof value === "string") {
    return quoted(value);
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return JSON.stringify(value);
}

function escapeString(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function quoted(str: string): string {
  return `"${escapeString(str)}"`;
}
