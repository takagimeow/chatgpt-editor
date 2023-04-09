import * as vscode from "vscode";
import { Config } from "../Config";

export class ConfigImpl implements Config {
  private config: vscode.WorkspaceConfiguration;
  constructor() {
    this.config = vscode.workspace.getConfiguration("chatgpt-editor");
  }
  getInsertType(): string {
    this.refresh();
    const insertType = this.config.get<string>("insertType") ?? "content-with-context";
    return insertType;
  }

  // If this method is not called, the old configuration data is used
  // If you want to get the new configuration values, call this method
  private refresh() {
    this.config = vscode.workspace.getConfiguration("chatgpt-editor");
  }
}