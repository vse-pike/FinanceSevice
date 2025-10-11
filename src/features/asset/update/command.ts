import {
  readCallbackData,
  readText,
  TelegramUser,
} from '@/infrastructure/bot/command/command-helper.js';
import { Command, Ctx } from '@/infrastructure/bot/command/command.js';
import { db } from '@/infrastructure/db/db.js';
import { BusinessException } from '@/shared/business-exception.js';
import { Asset, UpdateCommandCtx, UpdateAssetCtx } from './context.js';
import { InlineKeyboardMarkup } from 'telegraf/types';
import { AssetDbModel } from './asset-db.model.js';
import { TelegramRender } from '@/infrastructure/bot/render/telegram-render.js';
import { Page } from '@/infrastructure/bot/render/render-engine.js';
import { AskAssetListPage } from './command-pages.js';
import { deleteAssetTx, updateAssetTx } from './update.db-service.js';

export class UpdateAssetCommand implements Command {
  static name = '/update_asset';
  isFinished = false;

  private editMsgId?: number;
  private initialized = false;
  private userMsgIds: number[] = [];

  private ctx!: UpdateCommandCtx;
  private page!: Page<UpdateCommandCtx>;

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
    if (!user) throw new BusinessException('Пользователь не найден. Невозможно обновить актив.');

    const services = {
      updateAsset: async (m: Required<Asset>) => {
        await updateAssetTx(String(user.id), m);
      },
      deleteAsset: async (assetId: string) => {
        await deleteAssetTx(assetId);
      },
    };

    this.ctx = {
      context: {
        model: {} as Asset,
      } as UpdateAssetCtx,
      services,
      deps: { currencies: ctx.state.currencies },
      ui: { show: async (text) => await ctx.reply(text) },
    };

    const assets: AssetDbModel[] = await db.asset.findMany({
      where: { userId: user.id },
    });

    this.ctx.context.assets = assets;

    this.page = new AskAssetListPage();

    const rawView = this.page.render(this.ctx);
    const renderedView = TelegramRender.render(rawView);
    await this.safeEdit(ctx, renderedView.text, renderedView.keyboard);
    this.initialized = true;
  }

  private async handleUpdate(ctx: Ctx) {
    const input = readCallbackData(ctx) ?? readText(ctx);
    if (!input) return;

    this.trackUserMessage(ctx);

    const result = await this.page.handleInput(this.ctx, input);

    if (!result.success) {
      const rawView = this.page.render(this.ctx, result.message);
      const renderedView = TelegramRender.render(rawView);
      await this.safeEdit(ctx, renderedView.text, renderedView.keyboard);
      return;
    }

    const next = await this.page.next(this.ctx);

    if (next.done) {
      await this.flushUserMessages(ctx);
      this.isFinished = true;
      return;
    }

    this.page = next.page;

    const rawView = this.page.render(this.ctx);
    const renderedView = TelegramRender.render(rawView);
    await this.safeEdit(ctx, renderedView.text, renderedView.keyboard);
  }

  private trackUserMessage(ctx: Ctx) {
    const mid = ctx.message && 'message_id' in ctx.message ? ctx.message.message_id : undefined;
    if (mid) this.userMsgIds.push(mid);
  }

  private async flushUserMessages(ctx: Ctx) {
    const chatId = ctx.chat!.id;

    this.userMsgIds.push(this.editMsgId!);
    ctx.telegram.deleteMessages(chatId, this.userMsgIds);

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
