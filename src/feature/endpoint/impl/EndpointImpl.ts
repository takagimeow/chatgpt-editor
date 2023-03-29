import { container } from "tsyringe";
import { ChatGPTEditorStorage } from "../../../core/repository/ChatGPTEditorStorage";
import { Endpoint } from "../Endpoint";
import * as vscode from "vscode";
import { Config } from "../../../core/service/config/Config";
import { ChatGPTEditorTreeProvider, ChatGPTTreeItem } from "../../../core/repository/ChatGPTEditorTreeProvider";

export class EndpointImpl implements Endpoint {
  private _chatgptEditorTreeProvider: ChatGPTEditorTreeProvider;
  private _chatgptEditorStorage: ChatGPTEditorStorage;
  private _config: Config;
  public readonly chatgptEditorTreeProvider: ChatGPTEditorTreeProvider;

  constructor() {
    this._chatgptEditorStorage = container.resolve<ChatGPTEditorStorage>("ChatGPTEditorStorage");
    this._chatgptEditorTreeProvider = container.resolve<ChatGPTEditorTreeProvider>("ChatGPTEditorTreeProvider");
    this._config = container.resolve<Config>("Config");
    this.chatgptEditorTreeProvider = this._chatgptEditorTreeProvider;
  }
  public refresh(): () => void {
    return () => {
      console.log("refresh!")
      this._chatgptEditorTreeProvider.refresh();
    };
  }
  public async saveReponse(context: string, content: string, label: string): Promise<void> {
    await this._chatgptEditorStorage.saveContent(context, content, label);
    this._chatgptEditorTreeProvider.refresh();
  }
  public insertResponse(): (id: string) => void {
    return (id: string) => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showInformationMessage(
          "Open a file in the editor to insert a snippet."
        );
        return;
      }
      const insertType = this._config.getInsertType();
      let content = "";
      switch (insertType) {
        case "content":
          content = this._chatgptEditorStorage.getContent(id);
          break;
        case "context":
          content = this._chatgptEditorStorage.getContext(id);
          break;
        default:
          content = this._chatgptEditorStorage.getContextAndContent(id);
          break;
      }
      if (!content) {
        vscode.window.showInformationMessage(
          "Could not retrieve content"
        );
        return;
      }
      editor.edit((builder) => {
        builder.insert(editor.selection.start, content);
      });
    };
  }
  public deleteResponse(): (item: ChatGPTTreeItem) => Promise<void> {
    return async (item: ChatGPTTreeItem) => {
      if (!item) {
        // TODO: When testing, find out how to mock this vscode.window.showInformationMessage()
        vscode.window.showInformationMessage(
          'Delete a reponse by right clicking on it in the list selecting "Delete"'
        );
        return;
      }
      await this._chatgptEditorStorage.deleteElement(item.id);
      this._chatgptEditorTreeProvider.refresh();
    };
  }
}
