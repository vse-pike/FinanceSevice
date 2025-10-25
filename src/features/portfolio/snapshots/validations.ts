import { z } from 'zod';

export const SnapCurrencySchema = z
  .enum(['cur:USD', 'cur:RUB'])
  .transform((v) => v.replace('cur:', ''));

export const SnapPeriodSchema = z
  .enum(['p:MONTH', 'p:QUARTER', 'p:YEAR', 'p:ALL'])
  .transform((v) => v.replace('p:', '') as 'MONTH' | 'QUARTER' | 'YEAR' | 'ALL');
