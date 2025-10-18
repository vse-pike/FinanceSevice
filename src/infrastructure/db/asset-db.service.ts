import { AssetType, Prisma, ValuationMode } from '@prisma/client';
import { db } from './db.js';

export type Asset = {
  id: string;
  name: string;
  type: AssetType;
  currency: string;
  qty: Prisma.Decimal;
  valuationMode: ValuationMode;
  total: Prisma.Decimal | null;
  debt: Prisma.Decimal | null;
};

export type AssetInput = Omit<Asset, 'id'>;

export interface IAssetDbService {
  listAssets(userId: string): Promise<Asset[]>;
  saveAssetTx(userId: string, c: AssetInput): Promise<void>;
  updateAssetTx(userId: string, m: Required<Asset>): Promise<void>;
  deleteAssetTx(assetId: string): Promise<void>;
}

export class AssetDbService implements IAssetDbService {
  d(v: number | string | Prisma.Decimal | null | undefined) {
    return v == null ? null : new Prisma.Decimal(v);
  }

  async listAssets(userId: string): Promise<Asset[]> {
    const assets = await db.asset.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });

    return assets.map((a) => ({
      id: a.id,
      name: a.name,
      type: a.type,
      currency: a.currency,
      qty: a.qty,
      valuationMode: a.valuationMode,
      total: a.total ?? null,
      debt: a.debt ?? null,
    }));
  }

  async saveAssetTx(userId: string, c: AssetInput): Promise<void> {
    await db.$transaction(async (tx) => {
      const asset = await tx.asset.create({
        data: {
          userId: userId,
          name: c.name,
          type: c.type,
          currency: c.currency,
          qty: c.qty,
          valuationMode: c.valuationMode,
          total: c.total,
          debt: c.debt,
        },
      });

      await tx.assetCommit.create({
        data: {
          assetId: asset.id,
          qty: this.d(c.qty)!,
          total: this.d(c.total),
          debt: this.d(c.debt),
        },
      });
    });
  }

  async updateAssetTx(userId: string, m: Required<Asset>) {
    await db.$transaction(async (tx) => {
      await tx.asset.update({
        where: {
          id: m.id,
          userId: userId,
        },
        data: {
          name: m.name,
          currency: m.currency,
          valuationMode: m.valuationMode,
          qty: m.qty,
          total: m.total,
          debt: m.debt,
        },
      });

      await tx.assetCommit.create({
        data: {
          assetId: m.id,
          qty: m.qty,
          total: m.total,
          debt: m.debt,
        },
      });
    });
  }

  async deleteAssetTx(assetId: string) {
    await db.$transaction(async (tx) => {
      await tx.asset.delete({ where: { id: assetId } });
    });
  }
}
