import * as vscode from "vscode";
import { nanoid } from "nanoid";
import { container } from "tsyringe";
import { TreeElementData } from "../../model/TreeElementData";
import { TreeElement } from "../../model/TreeElement";
import { Elements, ChatGPTEditorStorage } from "../ChatGPTEditorStorage";
import { GlobalState } from "../../service/globalState/GlobalState";

export class ChatGPTEditorStorageImpl implements ChatGPTEditorStorage {
  private rootId = "";
  private storageKey = "storage-key";
  private globalState: GlobalState;

  constructor() {
    this.globalState = container.resolve<GlobalState>("GlobalState");
    // This method is only called during development in the local environment
    // this.globalState.clear(this.storageKey);
  }

  getElement(id?: string): TreeElement | undefined {
    const elements = this.load();
    const providedOrRootId = id ?? this.rootId;

    const result = elements.get(providedOrRootId);

    return result || undefined;
  }

  async deleteElement(id: string): Promise<void> {
    const messageForUser = "Are you sure you want to delete this element?";

    const answer = await vscode.window.showInformationMessage(messageForUser, { modal: true }, "Yes", "No");

    if (answer !== "Yes") {
      return;
    }
    const elements = this.load();
    elements.delete(id);
    await this.save(elements);
  }

  async saveContent(context: string, content: string, label: string): Promise<void> {
    const elements = this.load();
    const parentId = this.rootId;
    const data: TreeElementData = {
      id: nanoid(),
      label,
      context,
      content,
    };
    elements.set(data.id, { data, parentId });
    this.getElement(parentId)?.childIds?.push(data.id);
    await this.save(elements);
  }

  getContext(id: string): string {
    return this.getElement(id)?.data.context ?? "";
  }
  getContent(id: string): string {
    return this.getElement(id)?.data.content?.toString() ?? "";
  }
  getContextAndContent(id: string): string {
    const element = this.getElement(id);
    return `${element?.data.context}\n${element?.data.content}`;
  }

  serialize(elements: Elements): string {
    return JSON.stringify([...elements.values()]);
  }

  deserialize(json: string): Elements {
    const elements = this.loadDefaultElements();

    if (!json) { return elements; }
    let tree: TreeElement[];
    try {
      tree = JSON.parse(json) as TreeElement[];
    } catch (error) {
      return elements;
    }

    if (!Array.isArray(tree)) { return elements; }

    tree.forEach((element) => {
      elements.set(element.data.id, element);
      if (!element.parentId) {
        this.rootId = element.data.id;
      }
    });
    console.log("elements: ", elements);
    return elements;
  }

  private loadDefaultElements(): Elements {
    const elements = new Map<string, TreeElement>();
    const root: TreeElementData = {
      id: nanoid(),
      label: "root",
      context: "",
      content: "",
    };
    this.rootId = root.id;
    elements.set(root.id, {
      data: root,
      childIds: []
    });
    return elements;
  }

  async save(elements: Elements): Promise<void> {
    await this.globalState.save(this.storageKey, this.serialize(elements));
    return;
  }

  load(): Elements {
    const value = this.globalState.get(this.storageKey);
    const elements = this.deserialize(value || "[]");
    return elements;
  }
}