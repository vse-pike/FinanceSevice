export class ValidationException extends Error {
  code?: string;
  cleatState?: boolean;

  constructor(message: string, clearState?: boolean) {
    super(message);
    this.name = 'ValidationException';
    this.cleatState = clearState;
  }
}
