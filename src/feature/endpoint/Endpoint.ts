import { ChatGPTEditorTreeProvider, ChatGPTEditorTreeItem } from "../../core/repository/ChatGPTEditorTreeProvider";

/*
TODO: Create a method type that returns a function
The return value of the function type that is returned is void.
*/
export interface Endpoint {
  chatgptEditorTreeProvider: ChatGPTEditorTreeProvider;
  saveReponse(context: string, content: string, label: string): Promise<void>;
  insertResponse(): (id: string) => void;
  deleteResponse(): (item: ChatGPTEditorTreeItem) => Promise<void>;
  refresh(): () => void;
  renameResponse(): (item: ChatGPTEditorTreeItem) => Promise<void>;
  createFolder(): (item?: ChatGPTEditorTreeItem) => Promise<void>;
}