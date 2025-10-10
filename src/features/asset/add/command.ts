import type { Command, Ctx } from '@/infrastructure/bot/command.js';
import { BusinessException } from '@/shared/business-exception.js';
import { db } from '@/infrastructure/db/db.js';
import { AddAssetCtx, AddAssetModel } from './context.js';
import { readCallbackData, readText, TelegramUser } from '@/infrastructure/bot/command-helper.js';
import { AskNamePage } from './pages/command-pages.js';
import type { InlineKeyboardMarkup } from 'telegraf/types';
import { saveAssetTx } from './db-service.js';
import { Page } from '@/infrastructure/bot/pages/contract.js';

export class AddAssetCommand implements Command {
  static name = '/add_asset';
  isFinished = false;

  private editMsgId?: number;
  private initialized = false;
  private userMsgIds: number[] = [];

  private ctx!: AddAssetCtx;
  private page!: Page<AddAssetCtx>;

  async execute(ctx: Ctx): Promise<void> {
    if (!this.initialized) {
      await this.init(ctx);
      return;
    }
    await this.handleUpdate(ctx);
  }

  private async init(ctx: Ctx) {
    const telegramUser: TelegramUser = ctx.state.user;
    const user = await db.user.findUnique({ where: { telegramId: telegramUser.telegramId } });
    if (!user) throw new BusinessException('Пользователь не найден. Невозможно добавить актив.');

    const services = {
      saveAsset: async (m: Required<AddAssetModel>) => {
        await saveAssetTx(String(user.id), m);
      },
    };

    this.ctx = {
      model: {} as AddAssetModel,
      services,
      deps: { currencies: ctx.state.currencies },
    };

    this.page = new AskNamePage();

    const v = this.page.render(this.ctx);

    await this.safeEdit(ctx, v.text);

    this.initialized = true;
  }

  private async handleUpdate(ctx: Ctx) {
    const input = readCallbackData(ctx) ?? readText(ctx);
    if (!input) return;

    this.trackUserMessage(ctx);

    const result = await this.page.handleInput(this.ctx, input);

    if (!result.success) {
      const v = this.page.render(this.ctx, result.message);
      await this.safeEdit(ctx, v.text, v.keyboard);
      return;
    }

    const next = await this.page.next(this.ctx);

    if (next.done) {
      const v = this.page.render(this.ctx);
      await this.safeEdit(ctx, v.text);
      await this.flushUserMessages(ctx);
      this.isFinished = true;
      return;
    }

    this.page = next.page;

    const v = this.page.render(this.ctx);

    await this.safeEdit(ctx, v.text, v.keyboard);
  }

  private trackUserMessage(ctx: Ctx) {
    const mid = ctx.message && 'message_id' in ctx.message ? ctx.message.message_id : undefined;
    if (mid) this.userMsgIds.push(mid);
  }

  private async flushUserMessages(ctx: Ctx) {
    const chatId = ctx.chat!.id;
    for (const id of this.userMsgIds) {
      ctx.telegram.deleteMessage(chatId, id).catch(() => {});
    }
    this.userMsgIds = [];
  }

  private async safeEdit(ctx: Ctx, text: string, keyboard?: InlineKeyboardMarkup) {
    const extra = keyboard ? { reply_markup: keyboard } : undefined;
    if (this.editMsgId) {
      await ctx.telegram.editMessageText(ctx.chat!.id, this.editMsgId, undefined, text, extra);
      return;
    }
    const msg = await ctx.reply(text, extra);
    this.editMsgId = msg.message_id;
  }
}
