import { BusinessException } from '@/shared/business-exception.js';
import { CurrencyKind } from '@/shared/currency-catalog.js';
import { RateClient } from './clients/rate.client.js';

export interface CurrencyCatalogExtension {
  kindOf(code: string): CurrencyKind | undefined;
  has(code: string): boolean;
}

export class RateResolver implements RateClient {
  constructor(
    private readonly fiat: RateClient,
    private readonly crypto: RateClient,
    private readonly catalog: CurrencyCatalogExtension,
  ) {}

  async getRate(from: string, to: string): Promise<number> {
    from = from.toUpperCase();
    to = to.toUpperCase();
    if (from === to) return 1;

    if (!this.catalog.has(from) || !this.catalog.has(to)) {
      throw new BusinessException(`Неизвестная пара валют: ${from}/${to}`);
    }

    const kFrom = this.catalog.kindOf(from);
    const kTo = this.catalog.kindOf(to);

    if (kFrom === CurrencyKind.FIAT && kTo === CurrencyKind.FIAT) {
      return this.fiat.getRate(from, to);
    }
    return this.crypto.getRate(from, to);
  }
}
