import { container } from "tsyringe";
import { ChatGPTEditorStorage } from "../ChatGPTEditorStorage";
import { ChatGPTEditorTreeProvider } from "../ChatGPTEditorTreeProvider";
import { ChatGPTEditorStorageImpl } from "../impl/ChatGPTEditorStorageImpl";
import { ChatGPTEditorTreeProviderImpl } from "../impl/ChatGPTEditorTreeProviderImpl";

export function repositoryModule() {
  container.register<ChatGPTEditorStorage>("ChatGPTEditorStorage", {
    useClass: ChatGPTEditorStorageImpl
  });
  container.register<ChatGPTEditorTreeProvider>("ChatGPTEditorTreeProvider", {
    useClass: ChatGPTEditorTreeProviderImpl,
  });
}