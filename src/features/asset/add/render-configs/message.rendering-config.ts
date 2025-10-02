import type { InlineKeyboardMarkup } from 'telegraf/types';
import { AssetType } from '@prisma/client';
import { FieldProgress, type RenderConfig } from '@/infrastructure/bot/message-render-manager.js';
import { AddAssetState } from '../state.js';
import { AddAssetField } from '../input-payload.js';
import { keyboards } from './keyboard.render-config.js';

type Ctx = { type?: AssetType };

export const addAssetViewConfig: RenderConfig<AddAssetField, AddAssetState> = {
  title: () => 'Добавление актива',

  order: [
    AddAssetField.NAME,
    AddAssetField.TYPE,
    AddAssetField.UNIT,
    AddAssetField.QTY,
    AddAssetField.VAL_CURRENCY,
    AddAssetField.TOTAL,
    AddAssetField.DEBT,
  ] as const,

  fields: {
    [AddAssetField.NAME]: { label: 'Название' },
    [AddAssetField.TYPE]: { label: 'Тип актива' },

    [AddAssetField.UNIT]: {
      label: 'Валюта/единица',
      hidden: (ctx: Ctx) => ctx?.type === AssetType.RE,
    },
    [AddAssetField.QTY]: {
      label: 'Кол-во',
      hidden: (ctx: Ctx) => ctx?.type === AssetType.RE,
      format: (v) => String(v),
    },

    [AddAssetField.VAL_CURRENCY]: {
      label: 'Валюта оценки',
      hidden: (ctx: Ctx) => ctx?.type !== AssetType.RE,
    },
    [AddAssetField.TOTAL]: {
      label: 'Итоговая стоимость',
      hidden: (ctx: Ctx) => ctx?.type !== AssetType.RE,
      format: (v) => String(v),
    },
    [AddAssetField.DEBT]: {
      label: 'Остаток долга',
      hidden: (ctx: Ctx) => ctx?.type !== AssetType.RE,
      format: (v) => String(v),
    },
  },

  messages: {
    [AddAssetState.ASK_NAME]: () => 'Введите название актива',
    [AddAssetState.ASK_TYPE]: () => 'Выберите тип актива',
    [AddAssetState.ASK_UNIT]: () => 'Укажите валюту/единицу',
    [AddAssetState.ASK_QTY]: () => 'Введите количество',
    [AddAssetState.ASK_VAL_CURRENCY]: () => 'Укажите валюту оценки',
    [AddAssetState.ASK_TOTAL]: () => 'Введите итоговую стоимость (например: 7000000)',
    [AddAssetState.ASK_DEBT]: () => 'Введите остаток долга (0, если нет)',
    [AddAssetState.CONFIRM]: () => 'Подтвердите добавление',
  },

  icons: {
    [FieldProgress.NOT_FILLED]: '✖️',
    [FieldProgress.FILLING]: '👉',
    [FieldProgress.FILLED]: '✅',
  },
  placeholders: {
    [FieldProgress.NOT_FILLED]: 'Не заполнено',
    [FieldProgress.FILLING]: 'Заполняется...',
    [FieldProgress.FILLED]: '',
  },

  keyboards: {
    [AddAssetState.ASK_TYPE]: (): InlineKeyboardMarkup => keyboards.type().reply_markup,
    [AddAssetState.CONFIRM]: (): InlineKeyboardMarkup => keyboards.confirm().reply_markup,
  },
};
