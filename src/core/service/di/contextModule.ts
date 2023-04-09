import { container } from "tsyringe";
import * as vscode from "vscode";

export function contextModule(context: vscode.ExtensionContext) {
  container.register<vscode.ExtensionContext>("ExtensionContext", { useValue: context });
}