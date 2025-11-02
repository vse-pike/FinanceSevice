import { loggers } from '@/logger.js';
import { httpGetJson } from './http.js';
import { ExchangeRateError, RateClient } from './rate.client.js';

type OEResponse = {
  result: 'success' | string;
  base_code: string;
  target_code: string;
  conversion_rate: number;
};

export class ExchangeRateFiatClient implements RateClient {
  private readonly baseUrl = 'https://v6.exchangerate-api.com';
  private readonly ttlMs: number;
  private cache = new Map<string, { v: number; ts: number }>();
  private logger = loggers.http.child({ client: this.baseUrl });

  constructor(
    private readonly apiKey: string,
    opts?: { ttlMs?: number },
  ) {
    if (!apiKey) throw new ExchangeRateError('Не передан ключ API');
    this.ttlMs = opts?.ttlMs ?? 60_000;
  }

  async getRate(from: string, to: string): Promise<number> {
    const f = from.toUpperCase();
    const t = to.toUpperCase();
    if (f === t) return 1;

    const cacheKey = `${f}->${t}`;
    const hit = this.cache.get(cacheKey);
    if (hit && Date.now() - hit.ts < this.ttlMs) return hit.v;

    const url = `${this.baseUrl}/v6/${this.apiKey}/pair/${encodeURIComponent(f)}/${encodeURIComponent(t)}`;

    try {
      this.logger.info({ from: f, to: t }, 'Получение курса фиатной валюты...');
      const data = await httpGetJson<OEResponse>(url);

      if (data.result !== 'success' || typeof data.conversion_rate !== 'number') {
        throw new ExchangeRateError(`Запрос с ошибкой для: ${f}->${t}`);
      }

      this.cache.set(cacheKey, { v: data.conversion_rate, ts: Date.now() });
      this.logger.info({ from: f, to: t, rate: data.conversion_rate }, 'Курс получен');
      return data.conversion_rate;
    } catch (e) {
      throw new ExchangeRateError(`Запрос завершился ошибкой`, e);
    }
  }
}
