import { BusinessException } from '@/shared/business-exception.js';
import { CurrencyKind } from '@/shared/currency-catalog.js';
import { RateClient } from './clients/rate.client.js';
import { Prisma } from '@prisma/client';

export interface CurrencyCatalogExtension {
  kindOf(code: string): CurrencyKind | undefined;
  has(code: string): boolean;
}

export interface IRateService {
  convertAmount(amount: Prisma.Decimal, from: string, to: string): Promise<Prisma.Decimal>;
  convertTotalAmountWithDebt(
    totalAmount: Prisma.Decimal,
    debt: Prisma.Decimal,
    from: string,
    to: string,
  ): Promise<{ totalAmount: Prisma.Decimal; debtAmount: Prisma.Decimal }>;
}

export class RateService implements IRateService {
  constructor(
    private readonly fiat: RateClient,
    private readonly crypto: RateClient,
    private readonly catalog: CurrencyCatalogExtension,
  ) {}

  private async getRate(from: string, to: string): Promise<number> {
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

  async convertAmount(amount: Prisma.Decimal, from: string, to: string): Promise<Prisma.Decimal> {
    const rate = await this.getRate(from, to);

    return amount.mul(new Prisma.Decimal(rate));
  }

  async convertTotalAmountWithDebt(
    totalAmount: Prisma.Decimal,
    debtAmount: Prisma.Decimal,
    from: string,
    to: string,
  ): Promise<{ totalAmount: Prisma.Decimal; debtAmount: Prisma.Decimal }> {
    const rate = await this.getRate(from, to);

    const dRate = new Prisma.Decimal(rate);

    const totalAmountConverted = totalAmount.mul(dRate);
    const debtAmountConverted = debtAmount.mul(dRate);

    return {
      totalAmount: totalAmountConverted,
      debtAmount: debtAmountConverted,
    };
  }
}
