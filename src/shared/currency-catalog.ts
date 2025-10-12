import { readFile } from 'node:fs/promises';
import z from 'zod';

export enum CurrencyKind {
  FIAT = 'FIAT',
  CRYPTO = 'CRYPTO',
}

const CurrencyJsonSchema = z.array(
  z.object({
    code: z.string().toUpperCase(),
    value: z.object({
      name: z
        .string()
        .trim()
        .transform((s) => s.toUpperCase()),
      type: z.enum(CurrencyKind),
    }),
  }),
);

type CurrencyJsonItem = z.infer<typeof CurrencyJsonSchema>[number];
type CurrencyValue = CurrencyJsonItem['value'];

export class CurrencyCatalog {
  private byCode = new Map<string, CurrencyValue>();

  static async fromFile(path: string): Promise<CurrencyCatalog> {
    const raw = await readFile(path, 'utf-8');
    const data = CurrencyJsonSchema.parse(JSON.parse(raw));

    const catalog = new CurrencyCatalog();
    for (const { code, value } of data) {
      catalog.byCode.set(code, value);
    }
    return catalog;
  }

  has(code: string): boolean {
    return this.byCode.has(code.toUpperCase());
  }

  kindOf(code: string): CurrencyKind | undefined {
    return this.byCode.get(code.toUpperCase())?.type;
  }

  get(code: string): CurrencyJsonItem | undefined {
    const key = code.toUpperCase();
    const value = this.byCode.get(key);
    if (!value) return undefined;
    return { code: key, value };
  }

  codes(): string[] {
    return [...this.byCode.keys()];
  }

  all(): CurrencyJsonItem[] {
    return [...this.byCode.entries()].map(([code, value]) => ({ code, value }));
  }
}
