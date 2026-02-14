/**
 * Core types for Beancount file structure
 */

export interface FormattingInfo {
  commentsBefore?: string[];
  commentsAfter?: string[];
  commentsInline?: string[];
  blankLinesBefore?: number;
}

export interface BeancountFile {
  directives: Directive[];
  metadata?: Record<string, unknown>;
  headerComments?: string[];
  footerComments?: string[];
}

export type Directive =
  | Transaction
  | Balance
  | Open
  | Close
  | Commodity
  | Pad
  | Note
  | Document
  | Price
  | Event
  | Query
  | Custom;

export interface Transaction {
  type: "transaction";
  date: string;
  flag: string;
  payee?: string;
  narration: string;
  tags?: string[];
  links?: string[];
  postings: Posting[];
  metadata?: Record<string, unknown>;
  formatting?: FormattingInfo;
}

export interface Posting {
  account: string;
  amount?: Amount;
  cost?: Amount;
  price?: Amount;
  metadata?: Record<string, unknown>;
  formatting?: FormattingInfo;
}

export interface Amount {
  number: string;
  currency: string;
}

export interface Balance {
  type: "balance";
  date: string;
  account: string;
  amount: Amount;
  formatting?: FormattingInfo;
}

export interface Open {
  type: "open";
  date: string;
  account: string;
  currencies?: string[];
  booking?: string;
  formatting?: FormattingInfo;
}

export interface Close {
  type: "close";
  date: string;
  account: string;
  formatting?: FormattingInfo;
}

export interface Commodity {
  type: "commodity";
  date: string;
  currency: string;
  formatting?: FormattingInfo;
}

export interface Pad {
  type: "pad";
  date: string;
  account: string;
  sourceAccount: string;
  formatting?: FormattingInfo;
}

export interface Note {
  type: "note";
  date: string;
  account: string;
  comment: string;
  formatting?: FormattingInfo;
}

export interface Document {
  type: "document";
  date: string;
  account: string;
  filename: string;
  formatting?: FormattingInfo;
}

export interface Price {
  type: "price";
  date: string;
  currency: string;
  amount: Amount;
  formatting?: FormattingInfo;
}

export interface Event {
  type: "event";
  date: string;
  eventType: string;
  description: string;
  formatting?: FormattingInfo;
}

export interface Query {
  type: "query";
  date: string;
  name: string;
  queryString: string;
  formatting?: FormattingInfo;
}

export interface Custom {
  type: "custom";
  date: string;
  customType: string;
  values: unknown[];
  formatting?: FormattingInfo;
}
