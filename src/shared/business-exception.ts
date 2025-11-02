export abstract class AppError {
  name?: string;
  message?: string;
}

export class BusinessException extends AppError {
  cleatState?: boolean;

  constructor(message: string, clearState?: boolean) {
    super();
    this.message = message;
    this.name = 'BusinessException';
    this.cleatState = clearState;
  }
}
