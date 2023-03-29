import { TreeElement } from "../model/TreeElement";

export type Elements = Map<string, TreeElement>;

export interface ChatGPTEditorStorage {
  getElement(id?: string): TreeElement | undefined;
  deleteElement(id: string): Promise<void>;
  saveContent(context: string, content: string, label: string): Promise<void>;
  getContext(id: string): string;
  getContent(id: string): string;
  getContextAndContent(id: string): string;
  save(elements: Elements): Promise<void>; // Called from saveContent()
  load(): Elements;
}