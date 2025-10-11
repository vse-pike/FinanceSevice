import { StartCommand } from '@/features/users/start/сommand.js';
import type { Command } from './command.js';
import { AddAssetCommand } from '@/features/asset/add/command.js';
import { UpdateAssetCommand } from '@/features/asset/update/command.js';

export class CommandFactory {
  private registry = new Map<string, () => Command>();

  constructor() {
    this.registry.set(StartCommand.name, () => new StartCommand());
    this.registry.set(AddAssetCommand.name, () => new AddAssetCommand());
    this.registry.set(UpdateAssetCommand.name, () => new UpdateAssetCommand());
  }

  create(name: string): Command | undefined {
    const factory = this.registry.get(name);
    return factory ? factory() : undefined;
  }
}
