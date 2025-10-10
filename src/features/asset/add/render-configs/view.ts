import { AssetType, ValuationMode } from '@prisma/client';
import { AddAssetModel } from '../context.js';

const AssetTypeLabel: Record<AssetType, string> = {
  FIAT: 'Фиатные счета',
  CRYPTO: 'Криптосчета',
  STOCK: 'Акции',
  RE: 'Недвижимость',
  DEBT: 'Займы',
  COMMODITY: 'Товар',
};

export function renderSummary(model: AddAssetModel, currentKey?: keyof AddAssetModel): string {
  const rows: Array<{
    label: string;
    key: keyof AddAssetModel;
    visible: boolean;
    fmt?: (v: any) => string;
  }> = [
    { label: 'Название', key: 'name', visible: true },
    { label: 'Тип', key: 'type', visible: true, fmt: (v: AssetType) => AssetTypeLabel[v] },
    {
      label: 'Валюта',
      key: 'currency',
      visible: model.valuationMode !== ValuationMode.MANUAL,
    },
    {
      label: 'Валюта оценки',
      key: 'currency',
      visible: model.valuationMode == ValuationMode.MANUAL,
    },
    {
      label: 'Кол-во',
      key: 'qty',
      visible: model.valuationMode !== ValuationMode.MANUAL,
      fmt: (v) => String(v),
    },
    {
      label: 'Итоговая стоимость по оценке',
      key: 'total',
      visible: model.valuationMode == ValuationMode.MANUAL,
      fmt: (v) => String(v),
    },
    {
      label: 'Остаток долга по оценке',
      key: 'debt',
      visible: model.valuationMode == ValuationMode.MANUAL,
      fmt: (v) => String(v),
    },
  ];

  const ICON = { not: '✖️', fill: '👉', ok: '✅' };
  const PH = { not: 'Не заполнено', fill: 'Заполняется' };

  const out: string[] = ['Добавление актива', ''];

  for (const r of rows) {
    if (!r.visible) continue;

    const filled = model[r.key] !== undefined;
    const filling = !filled && r.key === currentKey;

    const icon = filled ? ICON.ok : filling ? ICON.fill : ICON.not;
    const ph = filling ? PH.fill : PH.not;

    const raw = model[r.key];
    const val = raw === undefined ? ph : r.fmt ? r.fmt(raw) : String(raw);
    out.push(`${icon} ${r.label}: [${val}]`);
  }

  return out.join('\n');
}
