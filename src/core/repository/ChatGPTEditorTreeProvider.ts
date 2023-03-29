import * as vscode from "vscode";

export class ChatGPTTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public content: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public id: string,
  ) {
    super(label, collapsibleState);

    this.id = id;
    this.tooltip = content;

    // TODO: Check if setting this resourceUri property causes any　performance issues
    this.resourceUri = vscode.Uri.file(`./some-file`);
    this.command = {
      arguments: [this.id],
      command: "chatgpt-editor.insertResponse",
      title: "Insert content",
      tooltip: "Insert content",
    };
  }
}

export interface ChatGPTEditorTreeProvider extends vscode.TreeDataProvider<ChatGPTTreeItem> {
  refresh(): void;
}