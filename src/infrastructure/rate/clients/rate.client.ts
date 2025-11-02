import { AppError } from '@/shared/business-exception.js';

export interface RateClient {
  getRate(from: string, to: string): Promise<number>;
}

export class ExchangeRateError extends AppError {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super();
    this.message = `${message}${cause ?? `: ${cause}`}`;
    this.name = 'ExchangeRateError';
  }
}
