import { readFile } from 'node:fs/promises';
import z from 'zod';

export const CurrencyJsonSchema = z.array(
  z.object({
    name: z.string(),
    value: z.object({
      code: z.string().trim().toUpperCase(),
    }),
  }),
);

export type CurrencyJson = z.infer<typeof CurrencyJsonSchema>;

export class CurrencyCatalog {
  private byCode = new Map<string, string>();

  static async fromFile(path: string): Promise<CurrencyCatalog> {
    const raw = await readFile(path, 'utf-8');
    const json: Array<{ name: string; value: { code: string } }> = JSON.parse(raw);

    const catalog = new CurrencyCatalog();
    for (const item of json) {
      catalog.byCode.set(item.value.code.toUpperCase(), item.name);
    }
    return catalog;
  }

  replace(data: CurrencyJson): void {
    this.byCode.clear();
    for (const item of data) {
      const code = item.value.code.toUpperCase();
      this.byCode.set(item.name, code);
    }
  }

  has(code: string): boolean {
    return this.byCode.has(code.toUpperCase());
  }
  get(code: string): string | undefined {
    return this.byCode.get(code.toUpperCase());
  }
  codes(): string[] {
    return [...this.byCode.keys()];
  }
}
