import { StartCommand } from '@/features/users/start/сommand.js';
import type { ICommand } from './command.js';
import { AddAssetCommand } from '@/features/asset/add/command.js';
import { UpdateAssetCommand } from '@/features/asset/update/command.js';
import { PortfolioCommand } from '@/features/portfolio/show-protfolio/command.js';

export class CommandFactory {
  private registry = new Map<string, () => ICommand>();

  constructor() {
    this.registry.set(StartCommand.name, () => new StartCommand());
    this.registry.set(AddAssetCommand.name, () => new AddAssetCommand());
    this.registry.set(UpdateAssetCommand.name, () => new UpdateAssetCommand());
    this.registry.set(PortfolioCommand.name, () => new PortfolioCommand());
  }

  create(name: string): ICommand | undefined {
    const factory = this.registry.get(name);
    return factory ? factory() : undefined;
  }
}
