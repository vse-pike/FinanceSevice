import { db } from '@/infrastructure/db/db.js';
import { Prisma } from '@prisma/client';
import type { Asset } from './context.js';

const d = (v: number | string | Prisma.Decimal | null | undefined) =>
  v == null ? null : new Prisma.Decimal(v);

export async function updateAssetTx(userId: string, m: Required<Asset>) {
  return db.$transaction(async (tx) => {
    await tx.asset.update({
      where: {
        id: m.id,
        userId: userId,
      },
      data: {
        name: m.name,
        currency: m.currency,
        valuationMode: m.valuationMode,
        qty: new Prisma.Decimal(m.qty),
        total: d(m.total),
        debt: d(m.debt),
      },
    });

    await tx.assetCommit.create({
      data: {
        assetId: m.id,
        qty: new Prisma.Decimal(m.qty),
        total: d(m.total),
        debt: d(m.debt),
      },
    });
  });
}

export async function deleteAssetTx(assetId: string) {
  return db.$transaction(async (tx) => {
    await tx.asset.delete({ where: { id: assetId } });
  });
}
