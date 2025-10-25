import type {
  Page,
  Result,
  NextResult,
  ViewModel,
  UiNode,
} from '@/infrastructure/bot/render/render-engine.js';
import type { PortfolioCommandCtx } from './context.js';
import { CurrencySchema } from './validation.js';
import { prettyZodError } from '@/features/validation.js';
import { Prisma, ValuationMode } from '@prisma/client';
import { fmtNum, fmtPercent, typeLabel } from '@/features/helpers.js';
import { db } from '@/infrastructure/db/db.js';

export class SelectCurrencyPage implements Page<PortfolioCommandCtx> {
  render(ctx: PortfolioCommandCtx, error?: string): ViewModel {
    const rows = ctx.di.currencies.all().map((c) => [{ text: c.code, cb: `cur:${c.code}` }]);
    rows.unshift([{ text: 'В исходных', cb: 'cur:DEFAULT' }]);

    const nodes: UiNode[] = [
      { type: 'Title', text: '📊 Портфель' },
      { type: 'Paragraph', text: 'Укажите, в перерасчёте какой валюты вывести активы:' },
      { type: 'Keyboard', rows },
    ];
    if (error) nodes.push({ type: 'Error', text: error });

    return { nodes };
  }

  handleInput(ctx: PortfolioCommandCtx, input: string): Result {
    const v = CurrencySchema.safeParse(input);
    if (!v.success) return { success: false, message: prettyZodError(v.error) };
    ctx.context.targetCurrency = v.data;
    return { success: true };
  }

  async next(ctx: PortfolioCommandCtx): Promise<NextResult<PortfolioCommandCtx>> {
    const assets = await db.asset.findMany({
      where: { userId: ctx.context.userId },
      orderBy: { createdAt: 'asc' },
    });

    const targetCurrency = ctx.context.targetCurrency!;

    let gross = new Prisma.Decimal(0);
    let debt = new Prisma.Decimal(0);

    if (targetCurrency !== 'DEFAULT') {
      const converted = assets.map(async (it) => {
        if (it.valuationMode === ValuationMode.MARKET) {
          const value = await ctx.di.rateService.convertAmount(it.qty, it.currency, targetCurrency);

          gross = gross.add(value);

          return { ...it, qty: value };
        }

        if (it.valuationMode === ValuationMode.MANUAL) {
          const { totalAmount, debtAmount } = await ctx.di.rateService.convertTotalAmountWithDebt(
            it.total!,
            it.debt!,
            it.currency,
            targetCurrency,
          );

          gross = gross.add(totalAmount);
          debt = debt.add(debtAmount);

          return { ...it, total: totalAmount, debt: debtAmount };
        }

        return it;
      });

      const convertedAssets = await Promise.all(converted);

      ctx.context.assets = convertedAssets;
      ctx.context.gross = gross;
      ctx.context.debt = debt;
      ctx.context.net = gross.sub(debt);
    } else {
      ctx.context.assets = assets;
      ctx.context.gross = undefined;
      ctx.context.debt = undefined;
      ctx.context.net = undefined;
    }

    if (ctx.context.assets!.length === 0) {
      ctx.ui?.show?.('Портфель пуст.');
      return { done: true };
    }

    return { done: false, page: new ShowPortfolioPage() };
  }
}

export class ShowPortfolioPage implements Page<PortfolioCommandCtx> {
  render(ctx: PortfolioCommandCtx, error?: string): ViewModel {
    const nodes: ViewModel['nodes'] = [{ type: 'Title', text: '📊 Портфель' }];

    const tgt = ctx.context.targetCurrency!;
    const hasConversion = tgt !== 'DEFAULT';

    if (hasConversion) {
      nodes.push({ type: 'Paragraph', text: `Ваши активы в валюте ${tgt}:` });
      nodes.push({ type: 'Divider' });

      const gross = ctx.context.gross!;
      const debt = ctx.context.debt!;
      const net = ctx.context.net;

      nodes.push({ type: 'Row', label: '🟡 Стоимость', value: fmtNum(gross), boldLabel: true });
      nodes.push({ type: 'Row', label: '🟠 Долг', value: fmtNum(debt), boldLabel: true });
      nodes.push({ type: 'Row', label: '🟢 Чистая', value: fmtNum(net), boldLabel: true });
    } else {
      nodes.push({ type: 'Paragraph', text: 'Ваши активы в исходных валютах:' });
    }

    for (const it of ctx.context.assets!) {
      nodes.push({ type: 'Divider' });
      nodes.push({
        type: 'Row',
        label: 'Название',
        value: it.name,
        boldLabel: true,
        bullet: true,
      });
      nodes.push({
        type: 'Row',
        label: 'Тип',
        value: typeLabel(it.type),
        boldLabel: true,
        bullet: true,
      });

      if (it.valuationMode === ValuationMode.MARKET) {
        if (hasConversion) {
          nodes.push({
            type: 'Row',
            label: 'Сумма',
            value: fmtNum(it.qty),
            boldLabel: true,
            bullet: true,
          });
        } else {
          nodes.push({
            type: 'Row',
            label: 'Валюта',
            value: it.currency,
            boldLabel: true,
            bullet: true,
          });
          nodes.push({
            type: 'Row',
            label: 'Кол-во',
            value: fmtNum(it.qty),
            boldLabel: true,
            bullet: true,
          });
        }
      } else {
        if (hasConversion) {
          nodes.push({
            type: 'Row',
            label: 'Оценка',
            value: fmtNum(it.total),
            boldLabel: true,
            bullet: true,
          });
          nodes.push({
            type: 'Row',
            label: 'Долг',
            value: fmtNum(it.debt),
            boldLabel: true,
            bullet: true,
          });

          const perNet = it.total!.sub(it.debt!);
          nodes.push({
            type: 'Row',
            label: 'Чистая',
            value: fmtNum(perNet),
            boldLabel: true,
            bullet: true,
          });
        } else {
          nodes.push({
            type: 'Row',
            label: 'Валюта',
            value: it.currency,
            boldLabel: true,
            bullet: true,
          });
          nodes.push({
            type: 'Row',
            label: 'Оценка',
            value: fmtNum(it.total),
            boldLabel: true,
            bullet: true,
          });
          nodes.push({
            type: 'Row',
            label: 'Долг',
            value: fmtNum(it.debt),
            boldLabel: true,
            bullet: true,
          });
        }
      }

      if (hasConversion && ctx.context.gross) {
        const gross = ctx.context.gross;
        const perTotal = it.valuationMode === ValuationMode.MARKET ? it.qty! : it.total!;

        if (gross.gt(0) && perTotal.gte(0)) {
          const share = perTotal.div(gross);
          nodes.push({
            type: 'Row',
            label: 'Доля',
            value: fmtPercent(share),
            boldLabel: true,
            bullet: true,
          });
        }
      }
    }

    if (error) nodes.push({ type: 'Error', text: error });
    return { nodes };
  }

  async handleInput(): Promise<Result> {
    return { success: true };
  }

  async next(): Promise<NextResult<PortfolioCommandCtx>> {
    return { done: true };
  }
}
