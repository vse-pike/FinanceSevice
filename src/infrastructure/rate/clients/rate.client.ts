export interface RateClient {
  getRate(from: string, to: string): Promise<number>;
}

export class ExchangeRateError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'ExchangeRateError';
  }
}
