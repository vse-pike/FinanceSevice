import { Prisma, ValuationMode } from '@prisma/client';
import { db } from '../db/db.js';
import { FastifyInstance } from 'fastify';

export async function buildDailySnapshots(app: FastifyInstance) {
  const rateService = app.di.resolve('rateService');
  const assets = await db.asset.findMany({});

  for (const a of assets) {
    const [usd, rub] = await Promise.all([
      computeOne(a, 'USD', rateService),
      computeOne(a, 'RUB', rateService),
    ]);

    const valuesJson = { USD: usd.values, RUB: rub.values };
    const metaJson = {
      rates: {
        USD: usd.rate ? { from: a.currency, rate: usd.rate } : undefined,
        RUB: rub.rate ? { from: a.currency, rate: rub.rate } : undefined,
      },
      source: { at: new Date().toISOString() },
    };

    await db.dailySnapshot.create({
      data: {
        assetId: a.id,
        userId: a.userId,
        name: a.name,
        type: a.type,
        currency: a.currency,
        qty: a.qty,
        valuationMode: a.valuationMode,
        total: a.total,
        debt: a.debt,
        valuesJson: valuesJson,
        metaJson: metaJson,
      },
    });
  }
}

async function computeOne(
  a: {
    valuationMode: ValuationMode;
    currency: string;
    qty: Prisma.Decimal;
    total: Prisma.Decimal | null;
    debt: Prisma.Decimal | null;
  },
  target: string,
  rateService: {
    convertAmount: (amount: Prisma.Decimal, from: string, to: string) => Promise<Prisma.Decimal>;
    convertTotalAmountWithDebt: (
      total: Prisma.Decimal,
      debt: Prisma.Decimal,
      from: string,
      to: string,
    ) => Promise<{ totalAmount: Prisma.Decimal; debtAmount: Prisma.Decimal }>;
  },
): Promise<{
  values: { price?: string; gross: string; debt?: string; net: string };
  rate?: number;
}> {
  if (a.valuationMode === ValuationMode.MARKET) {
    const gross = await rateService.convertAmount(a.qty, a.currency, target);
    const net = gross;

    const price = gross.div(a.qty);

    return {
      values: {
        price: price.toString(),
        gross: gross.toString(),
        debt: '0',
        net: net.toString(),
      },
      rate: Number(price!.toString()),
    };
  }

  const conv = await rateService.convertTotalAmountWithDebt(a.total!, a.debt!, a.currency, target);

  const gross = conv.totalAmount;
  const net = conv.totalAmount.sub(conv.debtAmount);

  return {
    values: {
      price: undefined,
      gross: gross.toString(),
      debt: conv.debtAmount.toString(),
      net: net.toString(),
    },
    rate: undefined,
  };
}
