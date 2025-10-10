import { FieldPage } from './abstract-page.js';
import { AssetType, ValuationMode } from '@prisma/client';
import { AddAssetCtx, AddAssetModel } from '../context.js';
import { keyboards, ConfirmAction } from '../render-configs/keyboard.js';
import { renderSummary } from '../render-configs/view.js';
import {
  NameSchema,
  AssetTypeSchema,
  CurrencyCodeSchema,
  DecimalPositiveSchema,
  DecimalNotZeroSchema,
  ConfirmActionSchema,
} from '../validations.js';
import { Result, View } from '@/infrastructure/bot/pages/contract.js';

export class AskNamePage extends FieldPage<AddAssetCtx> {
  constructor() {
    super('name');
  }
  protected renderContent(ctx: AddAssetCtx, current?: keyof AddAssetModel): string {
    const summary = renderSummary(ctx.model, current);
    const prompt = 'Введите название актива 👇';
    return [summary, '', prompt].join('\n');
  }
  handleInput(ctx: AddAssetCtx, input: string): Result {
    const v = NameSchema.safeParse(input);
    if (!v.success) return { success: false, message: v.error.message };
    ctx.model.name = v.data;
    return { success: true };
  }
  next() {
    return { done: false as const, page: new AskTypePage() };
  }
}

export class AskTypePage extends FieldPage<AddAssetCtx> {
  constructor() {
    super('type');
  }
  protected renderContent(ctx: AddAssetCtx, current?: keyof AddAssetModel): string {
    const summary = renderSummary(ctx.model, current);
    const prompt = 'Выберите тип актива 👇';
    return [summary, '', prompt].join('\n');
  }
  protected keyboard() {
    return keyboards.type();
  }
  handleInput(ctx: AddAssetCtx, input: string): Result {
    const v = AssetTypeSchema.safeParse(input);
    if (!v.success) return { success: false, message: v.error.message };
    ctx.model.type = v.data;
    ctx.model.valuationMode =
      v.data === AssetType.RE || v.data === AssetType.COMMODITY
        ? ValuationMode.MANUAL
        : ValuationMode.MARKET;
    return { success: true };
  }
  next() {
    return { done: false as const, page: new AskCurrencyPage() };
  }
}

export class AskCurrencyPage extends FieldPage<AddAssetCtx> {
  constructor() {
    super('currency');
  }
  protected renderContent(ctx: AddAssetCtx, current?: keyof AddAssetModel): string {
    const summary = renderSummary(ctx.model, current);
    const prompt = 'Укажите валюту (например: USD, KZT, RUB) 👇';
    return [summary, '', prompt].join('\n');
  }
  handleInput(ctx: AddAssetCtx, input: string): Result {
    const v = CurrencyCodeSchema(ctx.deps.currencies).safeParse(input);
    if (!v.success) return { success: false, message: v.error.message };
    ctx.model.currency = v.data;
    return { success: true };
  }
  next(ctx: AddAssetCtx) {
    const page =
      ctx.model.valuationMode === ValuationMode.MANUAL ? new AskTotalPage() : new AskQtyPage();
    return { done: false as const, page: page };
  }
}

export class AskQtyPage extends FieldPage<AddAssetCtx> {
  constructor() {
    super('qty');
  }
  protected renderContent(ctx: AddAssetCtx, current?: keyof AddAssetModel): string {
    const summary = renderSummary(ctx.model, current);
    const prompt = 'Введите количество актива 👇';
    return [summary, '', prompt].join('\n');
  }
  handleInput(ctx: AddAssetCtx, input: string): Result {
    const v = DecimalPositiveSchema.safeParse(input);
    if (!v.success) return { success: false, message: v.error.message };
    ctx.model.qty = v.data;
    return { success: true };
  }
  next() {
    return { done: false as const, page: new ConfirmPage() };
  }
}

export class AskTotalPage extends FieldPage<AddAssetCtx> {
  constructor() {
    super('total');
  }
  protected renderContent(ctx: AddAssetCtx, current?: keyof AddAssetModel): string {
    const summary = renderSummary(ctx.model, current);
    const prompt = 'Введите итоговую стоимость (например: 7 000 000) 👇';
    return [summary, '', prompt].join('\n');
  }
  handleInput(ctx: AddAssetCtx, input: string): Result {
    const v = DecimalPositiveSchema.safeParse(input);
    if (!v.success) return { success: false, message: v.error.message };
    ctx.model.total = v.data;
    return { success: true };
  }
  next() {
    return { done: false as const, page: new AskDebtPage() };
  }
}

export class AskDebtPage extends FieldPage<AddAssetCtx> {
  constructor() {
    super('debt');
  }
  protected renderContent(ctx: AddAssetCtx, current?: keyof AddAssetModel): string {
    const summary = renderSummary(ctx.model, current);
    const prompt = 'Введите остаток долга (0, если нет) 👇';
    return [summary, '', prompt].join('\n');
  }
  handleInput(ctx: AddAssetCtx, input: string): Result {
    const v = DecimalNotZeroSchema.safeParse(input);
    if (!v.success) return { success: false, message: v.error.message };
    ctx.model.debt = v.data;
    return { success: true };
  }
  next() {
    return { done: false as const, page: new ConfirmPage() };
  }
}

export class ConfirmPage extends FieldPage<AddAssetCtx> {
  constructor() {
    super('confirm');
  }
  protected keyboard() {
    return keyboards.confirm();
  }
  protected renderContent(ctx: AddAssetCtx, current?: keyof AddAssetModel): string {
    const summary = renderSummary(ctx.model, current);
    const prompt = 'Подтвердите добавление 👇';
    return [summary, '', prompt].join('\n');
  }
  handleInput(ctx: AddAssetCtx, input: string): Result {
    const v = ConfirmActionSchema.safeParse(input);
    if (!v.success) return { success: false, message: v.error.message };
    ctx.model.confirm = v.data;
    return { success: true };
  }
  async next(ctx: AddAssetCtx) {
    const m = ctx.model;

    if (ctx.model.confirm == ConfirmAction.APPROVE) {
      const payload: Required<AddAssetModel> = {
        name: m.name!,
        type: m.type!,
        currency: m.currency!,
        valuationMode: m.valuationMode!,
        qty: m.valuationMode === ValuationMode.MANUAL ? 1 : m.qty!,
        total: m.valuationMode === ValuationMode.MANUAL ? m.total! : null,
        debt: m.valuationMode === ValuationMode.MANUAL ? m.debt! : null,
        confirm: m.confirm!,
      };

      await ctx.services.saveAsset(payload);
    }

    this.render = (ctx: AddAssetCtx) => ({
      text:
        ctx.model.confirm === ConfirmAction.APPROVE
          ? '✅ Актив сохранён'
          : '❌ Добавление отменено',
    });

    return { done: true as const };
  }
}
