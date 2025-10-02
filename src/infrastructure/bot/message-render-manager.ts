import type { InlineKeyboardMarkup } from 'telegraf/types';

export class MessageRenderManager<TField extends string, TState extends string> {
  private values: Partial<Record<TField, unknown>> = {};
  private status: Partial<Record<TField, FieldProgress>> = {};
  private nextField?: TField;
  private state?: TState;
  private ctx: any;

  constructor(private cfg: RenderConfig<TField, TState>) {}

  setContext(ctx: any) {
    this.ctx = ctx;
    return this;
  }

  setState(s: TState) {
    this.state = s;
    return this;
  }

  startFilling(field: TField) {
    this.nextField = field;
    if (this.status[field] !== FieldProgress.FILLED) this.status[field] = FieldProgress.FILLING;
    return this;
  }

  updateField(field: TField, value: unknown) {
    this.values[field] = value;
    this.status[field] = FieldProgress.FILLED;
    if (this.nextField === field) this.nextField = undefined;
    return this;
  }

  resetField(field: TField) {
    delete this.values[field];
    this.status[field] = FieldProgress.NOT_FILLED;
    if (this.nextField === field) this.nextField = undefined;
    return this;
  }

  render(): { text: string; keyboard?: Keyboard } {
    const lines: string[] = [];
    this.pushTitle(lines);
    this.pushStateMessage(lines);
    this.pushFieldRows(lines);
    return { text: lines.join('\n'), keyboard: this.currentKeyboard() };
  }

  private pushTitle(out: string[]) {
    const t = typeof this.cfg.title === 'function' ? this.cfg.title(this.ctx) : this.cfg.title;
    out.push(t, '');
  }

  private pushStateMessage(out: string[]) {
    if (!this.state || !this.cfg.messages) return;
    const msg = this.cfg.messages[this.state]?.(this.ctx);
    if (msg) out.push(msg, '');
  }

  private pushFieldRows(out: string[]) {
    for (const key of this.cfg.order) {
      const def = this.cfg.fields[key];
      if (!def) continue;
      if (def.hidden?.(this.ctx)) continue;

      const prog = this.progressOf(key);
      const icon = this.cfg.icons?[prog] : undefined;
      const placeholders = this.cfg.placeholders?[prog] : undefined;

      const raw = this.values[key];
      const val =
        raw === undefined ? placeholders : def.format ? def.format(raw) : String(raw);

      out.push(`${icon} ${def.label}: [${val}]`);
    }
  }

  private currentKeyboard(): Keyboard {
    return this.state ? this.cfg.keyboards?.[this.state]?.(this.ctx) : undefined;
  }

  private progressOf(key: TField): FieldProgress {
    let p = this.status[key] ?? FieldProgress.NOT_FILLED;
    if (this.nextField === key && p !== FieldProgress.FILLED) p = FieldProgress.FILLING;
    return p;
  }
}

type Keyboard = InlineKeyboardMarkup | undefined;

export interface FieldConfig<TValue = unknown> {
  label: string;
  format?: (v: TValue) => string;
  hidden?: (ctx: any) => boolean;
}

export interface RenderConfig<TField extends string, TState extends string> {
  title: string | ((ctx: any) => string);
  order: readonly TField[];
  fields: Record<TField, FieldConfig>;

  icons?: Partial<Record<FieldProgress, string>>;
  placeholders?: Partial<Record<FieldProgress, string>>;
  messages?: Partial<Record<TState, (ctx: any) => string | undefined>>;
  keyboards?: Partial<Record<TState, (ctx: any) => Keyboard>>;
}

export enum FieldProgress {
  NOT_FILLED = 'NOT_FILLED',
  FILLING = 'FILLING',
  FILLED = 'FILLED',
}
