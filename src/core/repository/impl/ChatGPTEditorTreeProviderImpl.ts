import * as vscode from "vscode";
import { container } from "tsyringe";
import { ChatGPTEditorStorage } from "../ChatGPTEditorStorage";
import { ChatGPTEditorTreeProvider, ChatGPTEditorTreeItem } from "../ChatGPTEditorTreeProvider";

/**
 * The functions that are published from endpoints are associated with the commands 
 * that are registered through the call of registerCommand(). 
 * However, ChatGPTEditorTreeProvider is not associated with any specific command. 
 * Therefore, from a dependency standpoint, endpoints and ChatGPTEditorTreeProvider are unrelated.
 */
export class ChatGPTEditorTreeProviderImpl
  implements ChatGPTEditorTreeProvider {
  public readonly storage: ChatGPTEditorStorage;

  dropMimeTypes = ["application/vnd.code.tree.chatgptEditorView"];
  dragMimeTypes = ["text/uri-list"];

  private _onDidChangeTreeData: vscode.EventEmitter<ChatGPTEditorTreeItem | undefined | null | void> = new vscode.EventEmitter<ChatGPTEditorTreeItem | undefined>();
  readonly onDidChangeTreeData: vscode.Event<ChatGPTEditorTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

  constructor() {
    this.storage = container.resolve<ChatGPTEditorStorage>("ChatGPTEditorStorage");
    this.refresh();
  }
  getTreeItem(element: ChatGPTEditorTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: ChatGPTEditorTreeItem): Thenable<ChatGPTEditorTreeItem[]> {
    // Synchronize the value of the elements property of this.storage with the latest state
    const result = this.storage.getElement(element?.id)?.childIds?.map((id) => {
      const currentElement = this.storage.getElement(id);
      if (!currentElement) { return; }
      return new ChatGPTEditorTreeItem(
        currentElement.data.label,
        currentElement.data.content,
        currentElement.childIds
          ? vscode.TreeItemCollapsibleState.Expanded
          : vscode.TreeItemCollapsibleState.None,
        currentElement.data.id,
      );
    }) ?? [];
    const newResult: ChatGPTEditorTreeItem[] = result.filter((item) => item !== undefined && item !== null) as ChatGPTEditorTreeItem[];
    return Promise.resolve(newResult);
  }

  refresh(): void {
    this._onDidChangeTreeData?.fire();
  }

  handleDrag(source: readonly ChatGPTEditorTreeItem[], dataTransfer: vscode.DataTransfer, token: vscode.CancellationToken): void | Thenable<void> {
    if (token.isCancellationRequested) {
      return;
    }

    if (source.length > 1) {
      throw new Error("Expected only one element to be dragged");
    }

    dataTransfer.set(
      "application/vnd.code.tree.chatgptEditorView",
      new vscode.DataTransferItem(source[0])
    );
  }

  handleDrop(target: ChatGPTEditorTreeItem | undefined, dataTransfer: vscode.DataTransfer, token: vscode.CancellationToken): void | Thenable<void> {
      if (token.isCancellationRequested) {
        return;
      }

      const transferItem = dataTransfer.get(
        "application/vnd.code.tree.chatgptEditorView"
      );

      if (!transferItem) {
        return;
      }

      return new Promise(async () => {
        await this.storage.moveElement(transferItem.value.id, target?.id);
        this.refresh();
      });
  }
}
