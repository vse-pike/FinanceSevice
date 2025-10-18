import { z } from 'zod';

export const CurrencySchema = z
  .string()
  .regex(/^cur:(?:[A-Z]{2,10}|DEFAULT)$/, 'Неизвестная валюта')
  .transform((v) => v.replace(/^cur:/, ''));
