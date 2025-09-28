export type Ctx = import('telegraf').Context;

export interface Command {
  isFinished: boolean;
  execute(ctx: Ctx): Promise<void>;
  onUpdate?(ctx: Ctx): Promise<void>;
}
