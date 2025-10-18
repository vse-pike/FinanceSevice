import { CurrencyCatalog } from '@/shared/currency-catalog.js';
import { CoinMarketCapCryptoClient } from './clients/coinmarket.crypto.provider.js';
import { ExchangeRateFiatClient } from './clients/exchangerate.fiat.provider.js';
import { IRateService, RateService } from './rate-http.service.js';
import { env } from '@/env.js';

export function buildRateService(catalog: CurrencyCatalog): IRateService {
  const fiat = new ExchangeRateFiatClient(env.OER_API_KEY!);
  const crypto = new CoinMarketCapCryptoClient(env.CMC_API_KEY!);

  return new RateService(fiat, crypto, {
    has: (c: string) => catalog.has(c),
    kindOf: (c: string) => catalog.kindOf(c),
  });
}
