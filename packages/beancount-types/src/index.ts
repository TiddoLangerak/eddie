/**
 * Core types for Beancount file structure
 */

export type CommentOrBlank =
  | { kind: "blank" }
  | { kind: "comment"; comment: string };

export interface FormattingInfo {
  header: CommentOrBlank[];
  footer: CommentOrBlank[];
  inlineComment: string | undefined;
}

export interface BeancountFile {
  directives: Directive[];
  header: CommentOrBlank[];
  footer: CommentOrBlank[];
  metadata: Record<string, unknown>;
}

export type Directive =
  | Transaction
  | Include
  | Plugin
  | Option
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

export interface Include {
  type: "include";
  filename: string;
  tags?: string[];
  links?: string[];
  formatting: FormattingInfo;
}

export interface Plugin {
  type: "plugin";
  module: string;
  config?: string;
  tags?: string[];
  links?: string[];
  formatting: FormattingInfo;
}

export interface Option {
  type: "option";
  name: string;
  value: string;
  tags?: string[];
  links?: string[];
  formatting: FormattingInfo;
}

export interface Transaction {
  type: "transaction";
  date: string;
  flag: string;
  payee?: string;
  narration: string;
  tags: string[];
  links: string[];
  postings: Posting[];
  metadata: Record<string, unknown>;
  metadataHeader: CommentOrBlank[]; // Comments/blanks before metadata
  formatting: FormattingInfo;
}

export interface Posting {
  account: string;
  amount?: Amount;
  cost?: Amount;
  price?: Amount;
  metadata: Record<string, unknown>;
  formatting: FormattingInfo;
}

export interface Amount {
  number: string;
  commodity: string;
}

export interface Balance {
  type: "balance";
  date: string;
  account: string;
  amount: Amount;
  tags?: string[];
  links?: string[];
  formatting: FormattingInfo;
}

export interface Open {
  type: "open";
  date: string;
  account: string;
  commodities: string[];
  booking?: string;
  tags?: string[];
  links?: string[];
  formatting: FormattingInfo;
}

export interface Close {
  type: "close";
  date: string;
  account: string;
  tags?: string[];
  links?: string[];
  formatting: FormattingInfo;
}

export interface Commodity {
  type: "commodity";
  date: string;
  commodity: string;
  tags?: string[];
  links?: string[];
  formatting: FormattingInfo;
}

export interface Pad {
  type: "pad";
  date: string;
  account: string;
  sourceAccount: string;
  tags?: string[];
  links?: string[];
  formatting: FormattingInfo;
}

export interface Note {
  type: "note";
  date: string;
  account: string;
  comment: string;
  tags?: string[];
  links?: string[];
  formatting: FormattingInfo;
}

export interface Document {
  type: "document";
  date: string;
  account: string;
  filename: string;
  tags?: string[];
  links?: string[];
  formatting: FormattingInfo;
}

export interface Price {
  type: "price";
  date: string;
  commodity: string;
  amount: Amount;
  tags?: string[];
  links?: string[];
  formatting: FormattingInfo;
}

export interface Event {
  type: "event";
  date: string;
  eventType: string;
  description: string;
  tags?: string[];
  links?: string[];
  formatting: FormattingInfo;
}

export interface Query {
  type: "query";
  date: string;
  name: string;
  queryString: string;
  tags?: string[];
  links?: string[];
  formatting: FormattingInfo;
}

export interface Custom {
  type: "custom";
  date: string;
  customType: string;
  values: unknown[];
  tags?: string[];
  links?: string[];
  formatting: FormattingInfo;
}

export {
  isErr,
  isOk,
  parseBeancountFile,
} from "./parser.ts";
