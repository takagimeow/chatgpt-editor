import * as vscode from "vscode";
import { container } from "tsyringe";
import { ChatGPTEditorStorage } from "../ChatGPTEditorStorage";
import { ChatGPTEditorTreeProvider, ChatGPTTreeItem } from "../ChatGPTEditorTreeProvider";

/**
 * The functions that are published from endpoints are associated with the commands 
 * that are registered through the call of registerCommand(). 
 * However, ChatGPTEditorTreeProvider is not associated with any specific command. 
 * Therefore, from a dependency standpoint, endpoints and ChatGPTEditorTreeProvider are unrelated.
 */
export class ChatGPTEditorTreeProviderImpl implements ChatGPTEditorTreeProvider {
  public readonly storage: ChatGPTEditorStorage;
  public readonly context: vscode.ExtensionContext;

  private _onDidChangeTreeData: vscode.EventEmitter<ChatGPTTreeItem | undefined | null | void> = new vscode.EventEmitter<ChatGPTTreeItem | undefined>();
  readonly onDidChangeTreeData: vscode.Event<ChatGPTTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

  constructor() {
    this.storage = container.resolve<ChatGPTEditorStorage>("ChatGPTEditorStorage");
    this.context = container.resolve<vscode.ExtensionContext>("ExtensionContext");
    this.refresh();
  }
  getTreeItem(element: ChatGPTTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: ChatGPTTreeItem): Thenable<ChatGPTTreeItem[]> {
    // Synchronize the value of the elements property of this.storage with the latest state
    const result = this.storage.getElement(element?.id)?.childIds?.map((id) => {
      const currentElement = this.storage.getElement(id);
      if (!currentElement) { return; }
      return new ChatGPTTreeItem(
        currentElement.data.label,
        currentElement.data.content,
        vscode.TreeItemCollapsibleState.None,
        currentElement.data.id,
      );
    }) ?? [];
    const newResult: ChatGPTTreeItem[] = result.filter((item) => item !== undefined && item !== null) as ChatGPTTreeItem[];
    return Promise.resolve(newResult);
  }

  refresh(): void {
    this._onDidChangeTreeData?.fire();
  }
}
