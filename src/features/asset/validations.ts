import { z } from 'zod';
import { AssetType } from '@prisma/client';
import { CurrencyCatalog } from '@/shared/currency-catalog.js';
import { ConfirmAction } from './add/context.js';

export const NameSchema = z.string().trim().min(1, 'Название не может быть пустым');

export const CurrencyCodeSchema = (cat: CurrencyCatalog) =>
  z
    .string()
    .trim()
    .toUpperCase()
    .refine((c) => cat.has(c), { message: 'Неизвестная валюта' });

export const DecimalPositiveSchema = z.coerce
  .number()
  .transform((v) => (typeof v === 'number' ? Number(String(v).replace(/\s|,/g, '.')) : v))
  .refine((v) => Number.isFinite(v) && v > 0, { message: 'Значение должно быть > 0' });

export const DecimalNotZeroSchema = z.coerce
  .number()
  .transform((v) => (typeof v === 'number' ? Number(String(v).replace(/\s|,/g, '.')) : v))
  .refine((v) => Number.isFinite(v) && v >= 0, { message: 'Значение должно быть >= 0' });

export const AssetTypeSchema = z.enum(AssetType); //Добавить сообщение об ошибке

export const ConfirmActionSchema = z.enum(ConfirmAction); //Добавить сообщение об ошибке
