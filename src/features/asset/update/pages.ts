import { NextResult, Page, Result, ViewModel } from '@/infrastructure/bot/render/render-engine.js';
import {
  AssetIdSchema,
  DecimalNonNegSchema,
  DecimalPositiveSchema,
  UpdateMenuActionSchema,
} from '../validations.js';
import { UpdateCommandCtx, UpdateMenuAction } from './context.js';
import { Prisma, ValuationMode } from '@prisma/client';
import { prettyZodError } from '@/features/validation.js';
import { db } from '@/infrastructure/db/db.js';

export class AskAssetListPage implements Page<UpdateCommandCtx> {
  render(ctx: UpdateCommandCtx, error?: string): ViewModel {
    const nodes: ViewModel['nodes'] = [];
    nodes.push({ type: 'Title' as const, text: '🔧 Обновление актива' });
    nodes.push({
      type: 'Paragraph' as const,
      text:
        'Выберите актив для актуализации.\n\n' +
        'Доступные действия:\n' +
        '1) ✏️ Обновить поля (название, количество, сумма оценки, долг)\n' +
        '2) 🗑️ Удалить актив\n',
      // '3) ⚙️ Автообновление (для брокерских/криптокошельков)',
    });
    nodes.push({
      type: 'Keyboard',
      rows: ctx.context.assets!.map((a) => [{ text: `${a.name}`, cb: `asset:${a.id}` }]),
    });
    if (error) nodes.push({ type: 'Error' as const, text: error });
    return { nodes };
  }

  handleInput(ctx: UpdateCommandCtx, input: string): Result {
    const v = AssetIdSchema.safeParse(input);
    if (!v.success) return { success: false, message: prettyZodError(v.error) };

    const current = ctx.context.assets?.find((e) => e.id === v.data);
    ctx.context.model = current
      ? {
          id: current.id,
          type: current.type,
          name: current.name,
          valuationMode: current.valuationMode,
          currency: current.currency,
          qty: current.qty,
          total: current.total,
          debt: current.debt,
        }
      : undefined;

    return { success: true };
  }

  next(): NextResult<UpdateCommandCtx> {
    return { done: false as const, page: new AssetOptionPage() };
  }
}

export class AssetOptionPage implements Page<UpdateCommandCtx> {
  render(ctx: UpdateCommandCtx, error?: string): ViewModel {
    const nodes: ViewModel['nodes'] = [];
    nodes.push({ type: 'Title' as const, text: '⚙️ Действие с активом' });

    if (ctx.context.model?.valuationMode === ValuationMode.MARKET) {
      nodes.push({
        type: 'Paragraph' as const,
        text:
          `Актив: ${ctx.context.model?.name}\n` +
          `Валюта: ${ctx.context.model?.currency}\n` +
          `Кол-во: ${ctx.context.model?.qty}`,
      });
    } else {
      nodes.push({
        type: 'Paragraph' as const,
        text:
          `Актив: ${ctx.context.model?.name}\n` +
          `Валюта оценки: ${ctx.context.model?.currency}\n` +
          `Сумма оценки: ${ctx.context.model?.total}\n` +
          `Долг по оценке: ${ctx.context.model?.debt}`,
      });
    }

    nodes.push({
      type: 'Keyboard' as const,
      rows: [
        [{ text: '✏️ Обновить', cb: UpdateMenuAction.UPDATE }],
        [{ text: '🗑️ Удалить', cb: UpdateMenuAction.DELETE }],
      ],
    });

    if (error) nodes.push({ type: 'Error' as const, text: error });
    return { nodes };
  }

  handleInput(ctx: UpdateCommandCtx, input: string): Result {
    const v = UpdateMenuActionSchema.safeParse(input);
    if (!v.success) return { success: false, message: prettyZodError(v.error) };
    ctx.context.action = v.data;
    return { success: true };
  }

  async next(ctx: UpdateCommandCtx): Promise<NextResult<UpdateCommandCtx>> {
    if (ctx.context.action === UpdateMenuAction.UPDATE) {
      if (ctx.context.model?.valuationMode === ValuationMode.MARKET) {
        return { done: false as const, page: new UpdateQtyPage() };
      }
      if (ctx.context.model?.valuationMode === ValuationMode.MANUAL) {
        return { done: false as const, page: new UpdateTotalPage() };
      }
    }

    if (ctx.context.action === UpdateMenuAction.DELETE) {
      await db.asset.delete({ where: { id: ctx.context.model!.id } });

      ctx.ui?.show?.(`🗑️ Актив «${ctx.context.model?.name}» удалён`);
    }

    return { done: true };
  }
}

export class UpdateQtyPage implements Page<UpdateCommandCtx> {
  render(ctx: UpdateCommandCtx, error?: string): ViewModel {
    const m = ctx.context.model!;
    const nodes: ViewModel['nodes'] = [
      { type: 'Title' as const, text: '✏️ Обновить количество' },
      {
        type: 'FormRow' as const,
        label: 'Кол-во',
        value: undefined,
        state: 'fill' as const,
      },
    ];
    if (error) nodes.push({ type: 'Error' as const, text: error });
    nodes.push({ type: 'Prompt' as const, text: 'Введите новое количество 👇' });
    return { nodes };
  }

  handleInput(ctx: UpdateCommandCtx, input: string): Result {
    const v = DecimalPositiveSchema.safeParse(input);
    if (!v.success) return { success: false, message: prettyZodError(v.error) };
    ctx.context.model!.qty = new Prisma.Decimal(v.data);
    return { success: true };
  }

  async next(ctx: UpdateCommandCtx): Promise<NextResult<UpdateCommandCtx>> {
    const m = ctx.context.model!;
    await db.asset.update({
      where: {
        id: m.id,
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
    ctx.ui?.show?.(`✅ «${m.name}»: количество обновлено на ${m.qty} ${m.currency}`);
    return { done: true };
  }
}

export class UpdateTotalPage implements Page<UpdateCommandCtx> {
  render(ctx: UpdateCommandCtx, error?: string): ViewModel {
    const nodes: ViewModel['nodes'] = [
      { type: 'Title' as const, text: '✏️ Обновить сумму оценки' },
      {
        type: 'FormRow' as const,
        label: 'Сумма оценки',
        value: undefined,
        state: 'fill' as const,
      },
      {
        type: 'FormRow' as const,
        label: 'Остаток долга',
        value: undefined,
        state: 'not' as const,
      },
    ];
    if (error) nodes.push({ type: 'Error' as const, text: error });
    nodes.push({ type: 'Prompt' as const, text: 'Введите новую сумму оценки 👇' });
    return { nodes };
  }

  handleInput(ctx: UpdateCommandCtx, input: string): Result {
    const v = DecimalPositiveSchema.safeParse(input);
    if (!v.success) return { success: false, message: prettyZodError(v.error) };
    ctx.context.model!.total = new Prisma.Decimal(v.data);
    return { success: true };
  }

  next(): NextResult<UpdateCommandCtx> {
    return { done: false as const, page: new UpdateDebtPage() };
  }
}

export class UpdateDebtPage implements Page<UpdateCommandCtx> {
  render(ctx: UpdateCommandCtx, error?: string): ViewModel {
    const m = ctx.context.model!;
    const nodes: ViewModel['nodes'] = [
      { type: 'Title' as const, text: '✏️ Обновить остаток долга' },
      {
        type: 'FormRow' as const,
        label: 'Сумма оценки',
        value: new Prisma.Decimal(m.total!),
        state: 'ok' as const,
      },
      {
        type: 'FormRow' as const,
        label: 'Остаток долга',
        value: undefined,
        state: 'fill' as const,
      },
    ];
    if (error) nodes.push({ type: 'Error' as const, text: error });
    nodes.push({ type: 'Prompt' as const, text: 'Введите новый остаток долга 👇' });
    return { nodes };
  }

  handleInput(ctx: UpdateCommandCtx, input: string): Result {
    const v = DecimalNonNegSchema.safeParse(input);
    if (!v.success) return { success: false, message: prettyZodError(v.error) };
    ctx.context.model!.debt = new Prisma.Decimal(v.data);
    return { success: true };
  }

  async next(ctx: UpdateCommandCtx): Promise<NextResult<UpdateCommandCtx>> {
    const m = ctx.context.model!;
    await db.asset.update({
      where: {
        id: m.id,
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
    ctx.ui?.show?.(`✅ «${m.name}»: долг/оценка обновлены → ${m.debt}/${m.total} ${m.currency}`);
    return { done: true };
  }
}
