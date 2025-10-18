import { Command } from '@/infrastructure/bot/command/command.js';
import { BusinessException } from '@/shared/business-exception.js';
import { db } from '@/infrastructure/db/db.js';
import { readCallbackData, readText } from '@/infrastructure/bot/command/command-helper.js';
import type { PortfolioCommandCtx } from './context.js';
import { SelectCurrencyPage } from './pages.js';
import { TelegramRender } from '@/infrastructure/bot/render/telegram-render.js';
import { Ctx } from '@/types/ctx.js';
import { Page } from '@/infrastructure/bot/render/render-engine.js';

export class PortfolioCommand extends Command {
  static name = '/portfolio';
  isFinished = false;

  private page!: Page<PortfolioCommandCtx>;
  private ctx!: PortfolioCommandCtx;

  async execute(ctx: Ctx): Promise<void> {
    if (!this.initialized) {
      await this.init(ctx);
      return;
    }
    await this.handleUpdate(ctx);
  }

  private async init(ctx: Ctx) {
    const extractedUser = await db.user.findUnique({ where: { telegramId: ctx.user.telegramId } });
    if (!extractedUser)
      throw new BusinessException('Пользователь не найден. Невозможно показать портфель.');

    this.ctx = {
      context: { userId: extractedUser.id },
      di: ctx.di,
      ui: { show: async (text: string) => await ctx.reply(text) },
    };

    this.page = new SelectCurrencyPage();

    const rawView = this.page.render(this.ctx);
    const renderedView = TelegramRender.render(rawView);
    await this.safeEdit(ctx, renderedView.text, renderedView.keyboard, renderedView.parseMode);
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
      await this.safeEdit(ctx, renderedView.text, renderedView.keyboard, renderedView.parseMode);
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
    await this.safeEdit(ctx, renderedView.text, renderedView.keyboard, renderedView.parseMode);
  }
}
