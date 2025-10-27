import { createContainer, asValue, AwilixContainer } from 'awilix';
import { CurrencyCatalog } from '@/shared/currency-catalog.js';
import { buildRateService } from './infrastructure/rate/index.js';
import { IRateService } from './infrastructure/rate/rate-http.service.js';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const jsonPath = path.resolve(__dirname, './shared/currencies.json');

export type AppCradle = {
  currencies: CurrencyCatalog;
  rateService: IRateService;
};

export type AppContainer = AwilixContainer<AppCradle>;

export async function makeContainer(): Promise<AppContainer> {
  const currencies = await CurrencyCatalog.fromFile(jsonPath);
  const rateService = buildRateService(currencies);

  const c = createContainer<AppCradle>({ injectionMode: 'PROXY' });
  c.register({
    currencies: asValue(currencies),
    rateService: asValue(rateService),
  });

  return c;
}
