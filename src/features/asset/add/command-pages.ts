// features/asset/add/pages/command-pages.ts
import { AssetType, ValuationMode } from '@prisma/client';
import { ConfirmAction, type AddAssetCtx } from './context.js';
import {
  NameSchema,
  AssetTypeSchema,
  CurrencyCodeSchema,
  DecimalPositiveSchema,
  DecimalNotZeroSchema,
  ConfirmActionSchema,
} from '../validations.js';
import type {
  NextResult,
  Page,
  Result,
  ViewModel,
} from '@/infrastructure/bot/render/render-engine.js';

function isMarket(m: AddAssetCtx['context']): boolean {
  return !!m.type && ![AssetType.RE, AssetType.COMMODITY].find((e) => e === m.type);
}

function typeLabel(t?: AssetType): string | undefined {
  if (!t) return undefined;
  switch (t) {
    case AssetType.RE:
      return 'Недвижимость';
    case AssetType.STOCK:
      return 'Акции';
    case AssetType.CRYPTO:
      return 'Крипто';
    case AssetType.DEBT:
      return 'Займы';
    case AssetType.FIAT:
      return 'Фиатные счета';
    case AssetType.COMMODITY:
      return 'Коммодити';
  }
}

export class AskNamePage implements Page<AddAssetCtx> {
  render(ctx: AddAssetCtx, error?: string): ViewModel {
    const m = ctx.context;
    const nodes: ViewModel['nodes'] = [];
    nodes.push({ type: 'Title' as const, text: 'Добавление актива' });
    nodes.push({
      type: 'FormRow' as const,
      label: 'Название',
      value: m.name ?? undefined,
      state: m.name ? ('ok' as const) : ('fill' as const),
    });
    nodes.push({ type: 'FormRow' as const, label: 'Тип', value: undefined, state: 'not' as const });
    nodes.push({
      type: 'FormRow' as const,
      label: 'Валюта',
      value: undefined,
      state: 'not' as const,
    });
    nodes.push({
      type: 'FormRow' as const,
      label: 'Кол-во',
      value: undefined,
      state: 'not' as const,
    });
    if (error) nodes.push({ type: 'Error' as const, text: error });
    nodes.push({ type: 'Prompt' as const, text: 'Введите название актива 👇' });
    return { nodes };
  }

  handleInput(ctx: AddAssetCtx, input: string): Result {
    const v = NameSchema.safeParse(input);
    if (!v.success) return { success: false, message: v.error.message };
    ctx.context.name = v.data;
    return { success: true };
  }

  next(): NextResult<AddAssetCtx> {
    return { done: false, page: new AskTypePage() };
  }
}

export class AskTypePage implements Page<AddAssetCtx> {
  render(ctx: AddAssetCtx, error?: string): ViewModel {
    const m = ctx.context;
    const nodes: ViewModel['nodes'] = [];
    nodes.push({ type: 'Title' as const, text: 'Добавление актива' });
    nodes.push({
      type: 'FormRow' as const,
      label: 'Название',
      value: m.name!,
      state: 'ok' as const,
    });
    nodes.push({
      type: 'FormRow' as const,
      label: 'Тип',
      value: typeLabel(m.type),
      state: m.type ? ('ok' as const) : ('fill' as const),
    });

    if (isMarket(m)) {
      nodes.push({
        type: 'FormRow' as const,
        label: 'Валюта',
        value: undefined,
        state: 'not' as const,
      });
      nodes.push({
        type: 'FormRow' as const,
        label: 'Кол-во',
        value: undefined,
        state: 'not' as const,
      });
    } else {
      nodes.push({
        type: 'FormRow' as const,
        label: 'Валюта оценки',
        value: undefined,
        state: 'not' as const,
      });
      nodes.push({
        type: 'FormRow' as const,
        label: 'Итоговая стоимость',
        value: undefined,
        state: 'not' as const,
      });
      nodes.push({
        type: 'FormRow' as const,
        label: 'Остаток долга',
        value: undefined,
        state: 'not' as const,
      });
    }

    if (error) nodes.push({ type: 'Error' as const, text: error });
    nodes.push({ type: 'Prompt' as const, text: 'Выберите тип актива 👇' });
    nodes.push({
      type: 'Keyboard' as const,
      rows: [
        [{ text: '🏢 Недвижимость', cb: String(AssetType.RE) }],
        [{ text: '📈 Акции', cb: String(AssetType.STOCK) }],
        [{ text: '💸 Крипто счета', cb: String(AssetType.CRYPTO) }],
        [{ text: '🤝 Займы', cb: String(AssetType.DEBT) }],
        [{ text: '💵 Фиатные счета', cb: String(AssetType.FIAT) }],
        [{ text: '📦 Товары', cb: String(AssetType.COMMODITY) }],
      ],
    });
    return { nodes };
  }

  handleInput(ctx: AddAssetCtx, input: string): Result {
    const v = AssetTypeSchema.safeParse(input);
    if (!v.success) return { success: false, message: v.error.message };
    ctx.context.type = v.data;
    ctx.context.valuationMode =
      v.data === AssetType.RE || v.data === AssetType.COMMODITY
        ? ValuationMode.MANUAL
        : ValuationMode.MARKET;
    return { success: true };
  }

  next(): NextResult<AddAssetCtx> {
    return { done: false, page: new AskCurrencyPage() };
  }
}

export class AskCurrencyPage implements Page<AddAssetCtx> {
  render(ctx: AddAssetCtx, error?: string): ViewModel {
    const m = ctx.context;
    const nodes: ViewModel['nodes'] = [];

    nodes.push({ type: 'Title' as const, text: 'Добавление актива' });
    nodes.push({
      type: 'FormRow' as const,
      label: 'Название',
      value: m.name!,
      state: 'ok' as const,
    });
    nodes.push({
      type: 'FormRow' as const,
      label: 'Тип',
      value: typeLabel(m.type as AssetType),
      state: 'ok' as const,
    });
    nodes.push({
      type: 'FormRow' as const,
      label: isMarket(m) ? 'Валюта' : 'Валюта оценки',
      value: m.currency ?? undefined,
      state: m.currency ? ('ok' as const) : ('fill' as const),
    });

    if (!isMarket(m)) {
      nodes.push({
        type: 'FormRow' as const,
        label: 'Итоговая стоимость',
        value: undefined,
        state: 'not' as const,
      });
      nodes.push({
        type: 'FormRow' as const,
        label: 'Остаток долга',
        value: undefined,
        state: 'not' as const,
      });
    } else {
      nodes.push({
        type: 'FormRow' as const,
        label: 'Кол-во',
        value: undefined,
        state: 'not' as const,
      });
    }

    if (error) nodes.push({ type: 'Error' as const, text: error });
    nodes.push({ type: 'Prompt' as const, text: 'Укажите валюту (например: USD, KZT, RUB) 👇' });
    return { nodes };
  }

  handleInput(ctx: AddAssetCtx, input: string): Result {
    const v = CurrencyCodeSchema(ctx.deps.currencies).safeParse(input);
    if (!v.success) return { success: false, message: v.error.message };
    ctx.context.currency = v.data;
    return { success: true };
  }

  next(ctx: AddAssetCtx): NextResult<AddAssetCtx> {
    return isMarket(ctx.context)
      ? { done: false, page: new AskQtyPage() }
      : { done: false, page: new AskTotalPage() };
  }
}

export class AskQtyPage implements Page<AddAssetCtx> {
  render(ctx: AddAssetCtx, error?: string): ViewModel {
    const m = ctx.context;
    const nodes: ViewModel['nodes'] = [];
    nodes.push({ type: 'Title' as const, text: 'Добавление актива' });
    nodes.push({
      type: 'FormRow' as const,
      label: 'Название',
      value: m.name!,
      state: 'ok' as const,
    });
    nodes.push({
      type: 'FormRow' as const,
      label: 'Тип',
      value: typeLabel(m.type as AssetType),
      state: 'ok' as const,
    });
    nodes.push({
      type: 'FormRow' as const,
      label: 'Валюта',
      value: m.currency!,
      state: 'ok' as const,
    });
    nodes.push({
      type: 'FormRow' as const,
      label: 'Кол-во',
      value: m.qty != null ? String(m.qty) : undefined,
      state: m.qty ? ('ok' as const) : ('fill' as const),
    });
    if (error) nodes.push({ type: 'Error' as const, text: error });
    nodes.push({ type: 'Prompt' as const, text: 'Введите количество актива 👇' });
    return { nodes };
  }

  handleInput(ctx: AddAssetCtx, input: string): Result {
    const v = DecimalPositiveSchema.safeParse(input);
    if (!v.success) return { success: false, message: v.error.message };
    ctx.context.qty = v.data;
    return { success: true };
  }

  next(): NextResult<AddAssetCtx> {
    return { done: false, page: new ConfirmPage() };
  }
}

export class AskTotalPage implements Page<AddAssetCtx> {
  render(ctx: AddAssetCtx, error?: string): ViewModel {
    const m = ctx.context;
    const nodes: ViewModel['nodes'] = [];
    nodes.push({ type: 'Title' as const, text: 'Добавление актива' });
    nodes.push({
      type: 'FormRow' as const,
      label: 'Название',
      value: m.name!,
      state: 'ok' as const,
    });
    nodes.push({
      type: 'FormRow' as const,
      label: 'Тип',
      value: typeLabel(m.type as AssetType),
      state: 'ok' as const,
    });
    nodes.push({
      type: 'FormRow' as const,
      label: 'Валюта оценки',
      value: m.currency!,
      state: 'ok' as const,
    });
    nodes.push({
      type: 'FormRow' as const,
      label: 'Итоговая стоимость',
      value: m.total != null ? String(m.total) : undefined,
      state: m.total ? ('ok' as const) : ('fill' as const),
    });
    nodes.push({
      type: 'FormRow' as const,
      label: 'Остаток долга',
      value: undefined,
      state: 'not' as const,
    });
    if (error) nodes.push({ type: 'Error' as const, text: error });
    nodes.push({
      type: 'Prompt' as const,
      text: 'Введите итоговую стоимость (например: 7 000 000) 👇',
    });
    return { nodes };
  }

  handleInput(ctx: AddAssetCtx, input: string): Result {
    const v = DecimalPositiveSchema.safeParse(input);
    if (!v.success) return { success: false, message: v.error.message };
    ctx.context.total = v.data;
    return { success: true };
  }

  next(): NextResult<AddAssetCtx> {
    return { done: false, page: new AskDebtPage() };
  }
}

export class AskDebtPage implements Page<AddAssetCtx> {
  render(ctx: AddAssetCtx, error?: string): ViewModel {
    const m = ctx.context;
    const nodes: ViewModel['nodes'] = [];
    nodes.push({ type: 'Title' as const, text: 'Добавление актива' });
    nodes.push({
      type: 'FormRow' as const,
      label: 'Название',
      value: m.name!,
      state: 'ok' as const,
    });
    nodes.push({
      type: 'FormRow' as const,
      label: 'Тип',
      value: typeLabel(m.type as AssetType),
      state: 'ok' as const,
    });
    nodes.push({
      type: 'FormRow' as const,
      label: 'Валюта оценки',
      value: m.currency!,
      state: 'ok' as const,
    });
    nodes.push({
      type: 'FormRow' as const,
      label: 'Итоговая стоимость',
      value: String(m.total!),
      state: 'ok' as const,
    });
    nodes.push({
      type: 'FormRow' as const,
      label: 'Остаток долга',
      value: m.debt != null ? String(m.debt) : undefined,
      state: m.debt ? ('ok' as const) : ('fill' as const),
    });
    if (error) nodes.push({ type: 'Error' as const, text: error });
    nodes.push({ type: 'Prompt' as const, text: 'Введите остаток долга (0, если нет) 👇' });
    return { nodes };
  }

  handleInput(ctx: AddAssetCtx, input: string): Result {
    const v = DecimalNotZeroSchema.safeParse(input);
    if (!v.success) return { success: false, message: v.error.message };
    ctx.context.debt = v.data;
    return { success: true };
  }

  next(): NextResult<AddAssetCtx> {
    return { done: false, page: new ConfirmPage() };
  }
}

export class ConfirmPage implements Page<AddAssetCtx> {
  render(ctx: AddAssetCtx, error?: string): ViewModel {
    const m = ctx.context;
    const nodes: ViewModel['nodes'] = [];
    nodes.push({ type: 'Title' as const, text: 'Добавление актива' });
    nodes.push({
      type: 'FormRow' as const,
      label: 'Название',
      value: m.name!,
      state: 'ok' as const,
    });
    nodes.push({
      type: 'FormRow' as const,
      label: 'Тип',
      value: typeLabel(m.type as AssetType),
      state: 'ok' as const,
    });

    if (m.valuationMode === ValuationMode.MARKET) {
      nodes.push({
        type: 'FormRow' as const,
        label: 'Валюта',
        value: m.currency!,
        state: 'ok' as const,
      });
      nodes.push({
        type: 'FormRow' as const,
        label: 'Кол-во',
        value: String(m.qty!),
        state: 'ok' as const,
      });
    } else {
      nodes.push({
        type: 'FormRow' as const,
        label: 'Валюта оценки',
        value: m.currency!,
        state: 'ok' as const,
      });
      nodes.push({
        type: 'FormRow' as const,
        label: 'Итоговая стоимость',
        value: String(m.total!),
        state: 'ok' as const,
      });
      nodes.push({
        type: 'FormRow' as const,
        label: 'Остаток долга',
        value: String(m.debt!),
        state: 'ok' as const,
      });
    }

    if (error) nodes.push({ type: 'Error' as const, text: error });
    nodes.push({ type: 'Prompt' as const, text: 'Подтвердите добавление 👇' });
    nodes.push({
      type: 'Keyboard' as const,
      rows: [
        [{ text: '✅ Сохранить', cb: String(ConfirmAction.APPROVE) }],
        [{ text: '❌ Отменить', cb: String(ConfirmAction.DECLINE) }],
      ],
    });
    return { nodes };
  }

  handleInput(ctx: AddAssetCtx, input: string): Result {
    const v = ConfirmActionSchema.safeParse(input);
    if (!v.success) return { success: false, message: v.error.message };
    ctx.context.confirm = v.data;
    return { success: true };
  }

  async next(ctx: AddAssetCtx): Promise<NextResult<AddAssetCtx>> {
    const m = ctx.context;
    if (m.confirm === ConfirmAction.APPROVE) {
      await ctx.services.saveAsset({
        name: m.name!,
        type: m.type!,
        currency: m.currency!,
        valuationMode: m.valuationMode!,
        qty: m.valuationMode === ValuationMode.MANUAL ? 1 : m.qty!,
        total: m.valuationMode === ValuationMode.MANUAL ? m.total! : null,
        debt: m.valuationMode === ValuationMode.MANUAL ? m.debt! : null,
        confirm: ConfirmAction.APPROVE,
      });
      ctx.ui?.show?.('✅ Актив сохранён');
    } else {
      ctx.ui?.show?.('❌ Добавление отменено');
    }
    return { done: true };
  }
}
