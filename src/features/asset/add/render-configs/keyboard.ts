import { Markup } from 'telegraf';
import { AssetType } from '@prisma/client';

export const keyboards = {
  type: () =>
    Markup.inlineKeyboard([
      [Markup.button.callback('🏢 Недвижимость', AssetType.RE)],
      [Markup.button.callback('📦 Товары', AssetType.COMMODITY)],
      [Markup.button.callback('📈 Акции', AssetType.STOCK)],
      [Markup.button.callback('💸 Крипто счета', AssetType.CRYPTO)],
      [Markup.button.callback('🤝 Займы', AssetType.DEBT)],
      [Markup.button.callback('💵 Фиатные счета', AssetType.FIAT)],
    ]).reply_markup,
  confirm: () =>
    Markup.inlineKeyboard([
      [Markup.button.callback('✅ Сохранить', ConfirmAction.APPROVE)],
      [Markup.button.callback('✖️ Отменить', ConfirmAction.DECLINE)],
    ]).reply_markup,
};

export enum ConfirmAction {
  APPROVE = 'APPROVE',
  DECLINE = 'DECLINE',
}
