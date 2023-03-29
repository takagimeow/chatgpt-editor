import { container } from "tsyringe";
import * as vscode from "vscode";
import { GlobalState } from "../GlobalState";

export class GlobalStateImpl implements GlobalState {
  private context: vscode.ExtensionContext;
  constructor() {
    this.context = container.resolve<vscode.ExtensionContext>("ExtensionContext");
  }

  async save(key: string, value: string): Promise<void> {
    await this.context.globalState.update(key, value);
  }

  get(key: string): string | undefined {
    return this.context.globalState.get(key);
  }
}