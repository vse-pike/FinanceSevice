import { db } from '@/infrastructure/db/db.js';
import { Prisma } from '@prisma/client';
import type { AddAssetModel } from './context.js';

const d = (v: number | string | Prisma.Decimal | null | undefined) =>
  v == null ? null : new Prisma.Decimal(v);

export async function saveAssetTx(userId: string, m: Required<AddAssetModel>) {
  await db.$transaction(async (tx) => {
    const asset = await tx.asset.create({
      data: {
        userId: userId,
        name: m.name,
        type: m.type,
        currency: m.currency,
        qty: d(m.qty)!,
        valuationMode: m.valuationMode,
        total: d(m.total),
        debt: d(m.debt),
      },
    });

    await tx.assetCommit.create({
      data: {
        assetId: asset.id,
        qty: d(m.qty)!,
        total: d(m.total),
        debt: d(m.debt),
      },
    });
  });
}
