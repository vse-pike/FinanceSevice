import { AssetType } from '@prisma/client';

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
