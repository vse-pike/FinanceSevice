import { ICommand } from './command/command.js';

export class UserStateContainer {
  private states = new Map<bigint, ICommand>();

  get(userId: bigint) {
    return this.states.get(userId);
  }

  set(userId: bigint, cmd: ICommand) {
    this.states.set(userId, cmd);
  }

  clear(userId: bigint) {
    this.states.delete(userId);
  }
}
