import { db } from '@/infrastructure/db/db.js';
import { Prisma } from '@prisma/client';
import { AddCommandContext } from './context.js';

const d = (v: number | string | Prisma.Decimal | null | undefined) =>
  v == null ? null : new Prisma.Decimal(v);

export async function saveAssetTx(userId: string, c: Required<AddCommandContext>) {
  await db.$transaction(async (tx) => {
    const asset = await tx.asset.create({
      data: {
        userId: userId,
        name: c.name,
        type: c.type,
        currency: c.currency,
        qty: d(c.qty)!,
        valuationMode: c.valuationMode,
        total: d(c.total),
        debt: d(c.debt),
      },
    });

    await tx.assetCommit.create({
      data: {
        assetId: asset.id,
        qty: d(c.qty)!,
        total: d(c.total),
        debt: d(c.debt),
      },
    });
  });
}
