import { $Enums, Prisma } from '@prisma/client';

export type AssetDbModel = {
  name: string;
  id: string;
  createdAt: Date;
  userId: string;
  type: $Enums.AssetType;
  currency: string;
  qty: Prisma.Decimal;
  valuationMode: $Enums.ValuationMode;
  total: Prisma.Decimal | null;
  debt: Prisma.Decimal | null;
};
