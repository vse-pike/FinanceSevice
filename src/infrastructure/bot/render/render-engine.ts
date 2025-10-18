import { Prisma } from '@prisma/client';
import type { InlineKeyboardMarkup } from 'telegraf/types';

export type Result = { success: boolean; message?: string };

export type NextResult<T> = { done: true } | { done: false; page: Page<T> };

export interface Page<T> {
  render(ctx: T, error?: string): ViewModel;
  handleInput(ctx: T, input: string): Result | Promise<Result>;
  next(ctx?: T): NextResult<T> | Promise<NextResult<T>>;
}

export type ViewModel = { nodes: UiNode[] };

export type UiNode =
  | { type: 'Title'; text: string }
  | { type: 'Paragraph'; text: string }
  | { type: 'Divider' }
  | { type: 'Error'; text: string }
  | { type: 'Prompt'; text: string }
  | {
      type: 'FormRow';
      label: string;
      value?: string | number | null | Prisma.Decimal;
      state?: 'not' | 'fill' | 'ok';
    }
  | {
      type: 'Row';
      label: string;
      value: string | number | null | undefined | Prisma.Decimal;
      boldLabel?: boolean;
      bullet?: boolean;
    }
  | { type: 'Keyboard'; rows: Array<Array<{ text: string; cb: any }>> };

export type View = {
  text: string;
  keyboard?: InlineKeyboardMarkup;
  parseMode?: 'HTML' | 'MarkdownV2';
};
