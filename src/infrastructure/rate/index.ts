import { CurrencyCatalog } from '@/shared/currency-catalog.js';
import { CoinMarketCapCryptoClient } from './clients/coinmarket.crypto.provider.js';
import { ExchangeRateFiatClient } from './clients/exchangerate.fiat.provider.js';
import { RateResolver } from './resolver.js';
import { env } from '@/shared/env.js';

export function buildRateResolver(catalog: CurrencyCatalog) {
  const fiat = new ExchangeRateFiatClient(env.OER_API_KEY!);
  const crypto = new CoinMarketCapCryptoClient(env.CMC_API_KEY!);

  return new RateResolver(fiat, crypto, {
    has: (c: string) => catalog.has(c),
    kindOf: (c: string) => catalog.kindOf(c),
  });
}
