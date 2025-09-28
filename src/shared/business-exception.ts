export class BusinessException extends Error {
  code?: string;
  cleatState?: boolean;

  constructor(message: string, clearState?: boolean) {
    super(message);
    this.name = 'BusinessException';
    this.cleatState = clearState;
  }
}
