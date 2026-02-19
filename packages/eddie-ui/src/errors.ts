export class HttpResponseError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

export class FormDataParseError extends HttpResponseError {
  readonly field: string;

  constructor(field: string, message: string) {
    super(`${message} (field: ${field})`, 400);
    this.field = field;
  }
}
