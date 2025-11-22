import { Prisma, ValuationMode } from '@prisma/client';
import { MinimalSnapshot, SnapshotDeltaResult, SnapshotItemUSD, ValuesJson } from './models.js';
import { toDecimal } from '../helpers.js';

export class FinanceCalculator {
  /**
   * Принимает массив снапшотов за период (любой порядок),
   * группирует по assetId (берёт первый = start и последний = end),
   * и считает:
   *  - ΔNET
   *  - вклад рынка (priceΔ * startQty) для MARKET
   *  - вклад действий (ΔNET - market)
   * Возвращает items и totals (сумма endNet по USD).
   */
  static calculateSnapshotsDeltaUSD(shots: MinimalSnapshot[]): SnapshotDeltaResult {
    if (!shots.length) {
      return { items: [], totals: { usd: { endNet: new Prisma.Decimal(0) } }, snapshotsCount: 0 };
    }

    const counts: Record<string, number> = {};

    for (const shot of shots) {
      const key = String(shot.assetId);
      counts[key] = (counts[key] || 0) + 1;
    }

    const maxCount = Math.max(...Object.values(counts));

    const startByAsset = new Map<string, MinimalSnapshot>();
    const endByAsset = new Map<string, MinimalSnapshot>();

    for (const s of shots) {
      const id = s.assetId;
      if (!startByAsset.has(id)) startByAsset.set(id, s);
      endByAsset.set(id, s);
    }

    const items: SnapshotItemUSD[] = [];
    let totalEndNetUsd = new Prisma.Decimal(0);

    for (const [assetId, end] of endByAsset.entries()) {
      const start = startByAsset.get(assetId)!;

      const sVals = start.valuesJson as ValuesJson;
      const eVals = end.valuesJson as ValuesJson;

      const sQty = toDecimal(start.qty);
      const eUsd = eVals.USD;
      const sUsd = sVals.USD;

      const sNetUsd = toDecimal(sUsd?.net);
      const eNetUsd = toDecimal(eUsd?.net);

      const sPriceUsd = sUsd?.price != null ? toDecimal(sUsd.price) : undefined;
      const ePriceUsd = eUsd?.price != null ? toDecimal(eUsd.price) : undefined;

      // ΔNET
      const deltaNetUsd = eNetUsd.sub(sNetUsd);

      let marketUsd = new Prisma.Decimal(0);
      let actionsUsd = new Prisma.Decimal(0);

      if (end.valuationMode === ValuationMode.MARKET) {
        if (sPriceUsd && ePriceUsd) {
          marketUsd = sQty.mul(ePriceUsd.sub(sPriceUsd));
          actionsUsd = deltaNetUsd.sub(marketUsd);
        } else {
          actionsUsd = deltaNetUsd;
        }
      } else {
        actionsUsd = deltaNetUsd;
      }

      const pct = (part: Prisma.Decimal, base: Prisma.Decimal) =>
        Number(part.div(base).mul(100).toFixed(2));

      totalEndNetUsd = totalEndNetUsd.add(eNetUsd);

      items.push({
        assetId,
        name: end.name,
        currency: end.currency,
        type: end.type,
        qty: toDecimal(end.qty),
        valuationMode: end.valuationMode,
        usd: {
          startNet: sNetUsd,
          endNet: eNetUsd,
          deltaNet: deltaNetUsd,
          deltaNetPct: pct(deltaNetUsd, sNetUsd),
          market: marketUsd,
          marketPct: pct(marketUsd, sNetUsd),
          actions: actionsUsd,
          actionsPct: pct(actionsUsd, sNetUsd),
        },
      });
    }

    return { items, totals: { usd: { endNet: totalEndNetUsd } }, snapshotsCount: maxCount };
  }
}
