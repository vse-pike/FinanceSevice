import { Ctx } from '@/types/ctx.js';
import { InlineKeyboardMarkup } from 'telegraf/types';

export abstract class Command {
  isFinished: boolean = false;
  private editMsgId?: number;
  protected initialized: boolean = false;
  protected userMsgIds: number[] = [];

  abstract execute(ctx: Ctx): Promise<void>;

  protected trackUserMessage(ctx: Ctx) {
    const mid = ctx.message && 'message_id' in ctx.message ? ctx.message.message_id : undefined;
    if (mid) this.userMsgIds.push(mid);
  }

  protected async flushUserMessages(ctx: Ctx) {
    const chatId = ctx.chat!.id;

    this.userMsgIds.push(this.editMsgId!);
    ctx.telegram.deleteMessages(chatId, this.userMsgIds);

    this.userMsgIds = [];
  }

  protected async safeEdit(
    ctx: Ctx,
    text: string,
    keyboard?: InlineKeyboardMarkup,
    parseMode?: 'HTML' | 'MarkdownV2',
  ) {
    const extra = {
      ...(parseMode ? { parse_mode: parseMode } : {}),
      ...(keyboard ? { reply_markup: keyboard } : {}),
    };

    if (this.editMsgId) {
      await ctx.telegram
        .editMessageText(ctx.chat!.id, this.editMsgId, undefined, text, extra)
        .catch(async () => {
          const msg = await ctx.reply(text, extra);
          this.editMsgId = msg.message_id;
        });
      return;
    }

    const msg = await ctx.reply(text, extra);
    this.editMsgId = msg.message_id;
  }
}
