import { AssetType, Prisma } from '@prisma/client';

export function typeLabel(t?: AssetType): string | undefined {
  if (!t) return undefined;
  switch (t) {
    case AssetType.RE:
      return 'Недвижимость';
    case AssetType.STOCK:
      return 'Акции';
    case AssetType.CRYPTO:
      return 'Крипто счета';
    case AssetType.DEBT:
      return 'Займы';
    case AssetType.FIAT:
      return 'Фиатные счета';
    case AssetType.COMMODITY:
      return 'Товары';
  }
}

export function fmtNum(value: Prisma.Decimal | number | null | undefined): string {
  const n =
    value instanceof Prisma.Decimal
      ? Number(value.toFixed(8))
      : typeof value === 'number'
        ? value
        : 0;

  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  }).format(n);
}

export function fmtPercent(frac: Prisma.Decimal): string {
  const n = Number(frac.mul(100).toFixed(6));
  return `${new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n)}%`;
}

export function toDecimal(v: number | string | Prisma.Decimal) {
  return new Prisma.Decimal(v);
}
