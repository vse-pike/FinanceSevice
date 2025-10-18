import { createContainer, asValue, AwilixContainer } from 'awilix';
import { CurrencyCatalog } from '@/shared/currency-catalog.js';
import { buildRateService } from './infrastructure/rate/index.js';
import { IRateService } from './infrastructure/rate/rate-http.service.js';
import { AssetDbService, IAssetDbService } from './infrastructure/db/asset-db.service.js';

export type AppCradle = {
  currencies: CurrencyCatalog;
  rateService: IRateService;
  assetDbService: IAssetDbService;
};

export type AppContainer = AwilixContainer<AppCradle>;

export async function makeContainer(): Promise<AppContainer> {
  const currencies = await CurrencyCatalog.fromFile('./src/shared/currencies.json');
  const rateService = buildRateService(currencies);
  const assetDbService = new AssetDbService();

  const c = createContainer<AppCradle>({ injectionMode: 'PROXY' });
  c.register({
    currencies: asValue(currencies),
    rateService: asValue(rateService),
    assetDbService: asValue(assetDbService),
  });

  return c;
}
