import type {
  Page,
  Result,
  NextResult,
  ViewModel,
  UiNode,
} from '@/infrastructure/bot/render/render-engine.js';
import type { SnapshotCommandCtx } from './context.js';
import { Prisma } from '@prisma/client';
import { fmtNum, typeLabel } from '@/features/helpers.js';
import { db } from '@/infrastructure/db/db.js';
import { SnapPeriodSchema } from './validations.js';
import { prettyZodError } from '@/features/validation.js';
import { FinanceCalculator } from '../finance-calculator.js';

export class SelectSnapshotsPage implements Page<SnapshotCommandCtx> {
  render(ctx: SnapshotCommandCtx, error?: string): ViewModel {
    const nodes: UiNode[] = [];

    nodes.push({ type: 'Title', text: '📆 Снапшоты' });
    nodes.push({ type: 'Paragraph', text: 'Выберите период:' });
    nodes.push({
      type: 'Keyboard',
      rows: [
        [{ text: 'Месяц', cb: 'p:MONTH' }],
        [{ text: 'Квартал', cb: 'p:QUARTER' }],
        [{ text: 'Год', cb: 'p:YEAR' }],
        [{ text: 'Всё', cb: 'p:ALL' }],
      ],
    });
    if (error) nodes.push({ type: 'Error', text: error });
    return { nodes };
  }

  handleInput(ctx: SnapshotCommandCtx, input: string): Result {
    const v = SnapPeriodSchema.safeParse(input);
    if (!v.success) return { success: false, message: prettyZodError(v.error) };

    ctx.context.period = v.data;
    return { success: true };
  }

  async next(ctx: SnapshotCommandCtx): Promise<NextResult<SnapshotCommandCtx>> {
    const { from, to } = periodRange(ctx.context.period!);

    const shots = await db.dailySnapshot.findMany({
      where: {
        userId: ctx.context.userId,
        ...(from ? { dateTime: { gte: from, lt: to } } : { dateTime: { lt: to } }),
      },
      orderBy: { dateTime: 'asc' },
    });

    if (shots.length === 0) {
      ctx.ui?.show?.('Портфель пуст или снапшоты еще не успели сформироваться.');
      return { done: true };
    }

    const { items, totals, snapshotsCount } = FinanceCalculator.calculateSnapshotsDeltaUSD(shots);

    ctx.context.items = items;
    ctx.context.totals = totals;
    ctx.context.snapshotsCount = snapshotsCount;

    return { done: false, page: new ShowSnapshotsPage() };
  }
}

export class ShowSnapshotsPage implements Page<SnapshotCommandCtx> {
  render(ctx: SnapshotCommandCtx, error?: string): ViewModel {
    const nodes: ViewModel['nodes'] = [{ type: 'Title', text: '📆 Снапшоты' }];

    const period = ctx.context.period!;
    nodes.push({ type: 'Paragraph', text: `Период: ${labelPeriod(period)}` });
    nodes.push({
      type: 'Row',
      label: 'Кол-во снапшотов по каждому активу',
      value: ctx.context.snapshotsCount,
      boldLabel: true,
    });
    nodes.push({ type: 'Divider' });

    if (!ctx.context.items?.length) {
      nodes.push({ type: 'Paragraph', text: 'Нет данных для выбранного периода.' });
      return { nodes };
    }

    nodes.push({
      type: 'Row',
      label: '🟢 Суммарная NET (USD)',
      value: fmtNum(ctx.context.totals!.usd.endNet),
      boldLabel: true,
    });

    nodes.push({ type: 'Divider' });

    for (const it of ctx.context.items) {
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
      nodes.push({
        type: 'Row',
        label: 'Кол-во',
        value: it.qty,
        boldLabel: true,
        bullet: true,
      });
      nodes.push({
        type: 'Row',
        label: 'Исходная валюта',
        value: it.currency,
        boldLabel: true,
        bullet: true,
      });

      const u = it.usd;
      // NET
      nodes.push({
        type: 'Row',
        label: 'NET (USD)',
        value: fmtNum(u.endNet),
        boldLabel: true,
        bullet: true,
      });
      // Δ NET
      if (u.deltaNet) {
        nodes.push({
          type: 'Row',
          label: `${arrow(u.deltaNet)} Δ NET`,
          value: `${fmtNum(u.deltaNet)}${pct(u.deltaNetPct)}`,
          boldLabel: true,
          bullet: true,
        });
      }
      if (u.market || u.actions) {
        const m = u.market ?? new Prisma.Decimal(0);
        const a = u.actions ?? new Prisma.Decimal(0);

        nodes.push({
          type: 'Row',
          label: `${arrow(m)} ↳ Рынок`,
          value: `${fmtNum(m)} ${pct(u.marketPct)}`,
          bullet: true,
        });
        nodes.push({
          type: 'Row',
          label: `${arrow(a)} ↳ Действия`,
          value: `${fmtNum(a)} ${pct(u.actionsPct)}`,
          bullet: true,
        });
      }

      nodes.push({ type: 'Divider' });
    }

    if (error) nodes.push({ type: 'Error', text: error });
    return { nodes };
  }

  async handleInput(): Promise<Result> {
    return { success: true };
  }

  async next(): Promise<NextResult<SnapshotCommandCtx>> {
    return { done: true };
  }
}

function labelPeriod(p: string): string {
  switch (p) {
    case 'MONTH':
      return 'последний месяц';
    case 'QUARTER':
      return 'последний квартал';
    case 'YEAR':
      return 'последний год';
    case 'ALL':
      return 'всё время';
    default:
      return p;
  }
}

function periodRange(period: 'MONTH' | 'QUARTER' | 'YEAR' | 'ALL'): {
  from?: Date;
  to: Date;
} {
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const to = new Date(today);
  to.setUTCDate(to.getUTCDate() + 1);

  if (period === 'ALL') return { to };

  const from = new Date(today);
  switch (period) {
    case 'MONTH':
      from.setUTCMonth(from.getUTCMonth() - 1);
      break;
    case 'QUARTER':
      from.setUTCMonth(from.getUTCMonth() - 3);
      break;
    case 'YEAR':
      from.setUTCFullYear(from.getUTCFullYear() - 1);
      break;
  }
  return { from, to };
}

const pct = (v?: number) =>
  v != null ? ` (${new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(v)}%)` : '';

const arrow = (v: Prisma.Decimal) => (v.gt(0) ? '📈' : v.lt(0) ? '📉' : '➖');
