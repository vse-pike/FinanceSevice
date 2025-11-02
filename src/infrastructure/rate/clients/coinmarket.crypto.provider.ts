import { loggers } from '@/logger.js';
import { httpGetJson } from './http.js';
import { RateClient, ExchangeRateError } from './rate.client.js';

type CmcQuote = { price: number };
type CmcDataPerSymbol = { quote: Record<string, CmcQuote | undefined> };
type CmcResponse = { data?: Record<string, CmcDataPerSymbol | undefined>; status?: unknown };

export class CoinMarketCapCryptoClient implements RateClient {
  private readonly baseUrl = 'https://pro-api.coinmarketcap.com';
  private readonly ttlMs: number;
  private cache = new Map<string, { v: number; ts: number }>();
  private logger = loggers.http.child({ client: this.baseUrl });

  constructor(
    private readonly apiKey: string,
    opts?: { ttlMs?: number },
  ) {
    if (!apiKey) throw new ExchangeRateError('Не передан ключ API');
    this.ttlMs = opts?.ttlMs ?? 30_000;
  }

  async getRate(from: string, to: string): Promise<number> {
    const f = from.toUpperCase();
    const t = to.toUpperCase();
    if (f === t) return 1;

    const cacheKey = `${f}->${t}`;
    const hit = this.cache.get(cacheKey);
    if (hit && Date.now() - hit.ts < this.ttlMs) return hit.v;

    const url = `${this.baseUrl}/v1/cryptocurrency/quotes/latest?symbol=${encodeURIComponent(f)}&convert=${encodeURIComponent(t)}`;

    try {
      this.logger.info({ from: f, to: t }, 'Получение курса фиатной валюты...');
      const json = await httpGetJson<CmcResponse>(url, {
        headers: { 'X-CMC_PRO_API_KEY': this.apiKey },
      });

      const price = json.data?.[f]?.quote?.[t]?.price;
      if (typeof price !== 'number' || !Number.isFinite(price)) {
        throw new ExchangeRateError(`Запрос с ошибкой для: ${f}->${t}`);
      }

      this.cache.set(cacheKey, { v: price, ts: Date.now() });
      this.logger.info({ from: f, to: t, rate: price }, 'Курс получен');
      return price;
    } catch (err) {
      throw new ExchangeRateError(`Запрос завершился ошибкой`, err);
    }
  }
}
