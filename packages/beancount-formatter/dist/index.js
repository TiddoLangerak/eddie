/**
 * Formats a BeancountFile object back into a Beancount file string.
 *
 * @param file - The BeancountFile object to format
 * @returns A formatted Beancount file string
 */
export function formatBeancountFile(file) {
  // Stub implementation - returns minimal string
  // TODO: Implement actual Beancount formatting logic
  const lines = [];
  for (const directive of file.directives) {
    lines.push(formatDirective(directive));
  }
  return lines.join("\n");
}
function formatDirective(directive) {
  if (directive.type === "transaction") {
    return formatTransaction(directive);
  }
  // Add other directive types as needed
  return `; ${directive.type} directive`;
}
function formatTransaction(txn) {
  const parts = [txn.date, txn.flag];
  if (txn.payee) parts.push(`"${txn.payee}"`);
  parts.push(`"${txn.narration}"`);
  let result = parts.join(" ");
  for (const posting of txn.postings) {
    result += `\n  ${posting.account}`;
    if (posting.amount) {
      result += ` ${formatAmount(posting.amount)}`;
    }
  }
  return result;
}
function formatAmount(amount) {
  return `${amount.number} ${amount.currency}`;
}
