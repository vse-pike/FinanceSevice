import { z } from 'zod';
import { AssetType } from '@prisma/client';
import { CurrencyCatalog } from '@/shared/currency-catalog.js';
import { ConfirmAction } from './add/context.js';
import { UpdateMenuAction } from './update/context.js';

export const NameSchema = z.string().trim().min(1, 'Название не может быть пустым');

export const CurrencyCodeSchema = (cat: CurrencyCatalog) =>
  z
    .string()
    .trim()
    .toUpperCase()
    .refine((c) => cat.has(c), { message: 'Неизвестная валюта' });

export const DecimalPositiveSchema = z
  .string()
  .trim()
  .transform((s) => s.replace(/\s/g, '').replace(',', '.'))
  .refine((s) => /^[-+]?\d+(\.\d+)?$/.test(s), {
    message: 'Введите корректное число',
  })
  .transform((s) => Number(s))
  .refine((n) => n > 0, { message: 'Значение должно быть > 0' });

export const DecimalNonNegSchema = z
  .string()
  .trim()
  .transform((s) => s.replace(/\s/g, '').replace(',', '.'))
  .refine((s) => /^[-+]?\d+(\.\d+)?$/.test(s), {
    message: 'Введите корректное число',
  })
  .transform((s) => Number(s))
  .refine((n) => n >= 0, { message: 'Значение должно быть ≥ 0' });

export const AssetTypeSchema = z.enum(AssetType); //Добавить сообщение об ошибке

export const ConfirmActionSchema = z.enum(ConfirmAction); //Добавить сообщение об ошибке

export const UpdateMenuActionSchema = z.enum(UpdateMenuAction);

export const AssetIdSchema = z
  .string()
  .regex(/^asset:(.+)$/, 'Неизвестный актив')
  .transform((v) => v.replace(/^asset:/, ''));
