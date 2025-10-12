import { httpGetJson } from './http.js';
import { RateClient, ExchangeRateError } from './rate.client.js';

type CmcQuote = { price: number };
type CmcDataPerSymbol = { quote: Record<string, CmcQuote | undefined> };
type CmcResponse = { data?: Record<string, CmcDataPerSymbol | undefined>; status?: unknown };

export class CoinMarketCapCryptoClient implements RateClient {
  private readonly baseUrl = 'https://pro-api.coinmarketcap.com';
  private readonly ttlMs: number;
  private cache = new Map<string, { v: number; ts: number }>();

  constructor(
    private readonly apiKey: string,
    opts?: { ttlMs?: number },
  ) {
    if (!apiKey) throw new ExchangeRateError('CMC: API key is required');
    this.ttlMs = opts?.ttlMs ?? 30_000;
  }

  async getRate(from: string, to: string): Promise<number> {
    const f = from.toUpperCase();
    const t = to.toUpperCase();
    if (f === t) return 1;

    const cacheKey = `${f}->${t}`;
    const hit = this.cache.get(cacheKey);
    if (hit && Date.now() - hit.ts < this.ttlMs) return hit.v;

    const url = `${this.baseUrl}/v2/cryptocurrency/quotes/latest?symbol=${encodeURIComponent(f)}&convert=${encodeURIComponent(t)}`;

    let json: CmcResponse;
    try {
      json = await httpGetJson<CmcResponse>(url, {
        headers: { 'X-CMC_PRO_API_KEY': this.apiKey },
        timeoutMs: 10_000,
      });
    } catch (e) {
      throw new ExchangeRateError(`CMC: request failed`, e);
    }

    const sym = json.data?.[f];
    const q = sym?.quote?.[t];
    const price = q?.price;

    if (typeof price !== 'number' || !Number.isFinite(price)) {
      throw new ExchangeRateError(`CMC: quote not found for ${f}->${t}`);
    }

    this.cache.set(cacheKey, { v: price, ts: Date.now() });
    return price;
  }
}
