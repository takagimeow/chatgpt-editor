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
    elements.get(parentId)?.childIds?.push(data.id);
    
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
    const defaultElements = this.loadDefaultElements();
    if (!json) { return defaultElements; }
    let tree: TreeElement[];
    try {
      tree = JSON.parse(json) as TreeElement[];
    } catch (error) {
      return defaultElements;
    }

    if (!Array.isArray(tree)) { return defaultElements; }
    const elements = defaultElements; // new Map<string, TreeElement>();
    tree.forEach((element) => {
      elements.set(element.data.id, element);
      if (!element.parentId) {
        this.rootId = element.data.id;
      }
    });
    return elements;
  }

  private loadDefaultElements(): Elements {
    const elements = new Map<string, TreeElement>();
    const root: TreeElementData = {
      id: this.rootId !== "" ? this.rootId : nanoid(),
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

  private isFolder(element: TreeElement): boolean {
    return element.childIds !== null;
  }
  async createFolder(name: string, relativeToId?: string | undefined): Promise<void> {
    const relativeToElement = this.getElement(relativeToId);

    if (!relativeToElement) {
      return;
    }

    const parentId = this.isFolder(relativeToElement)
      ? relativeToElement?.data.id
      : relativeToElement?.parentId;
    
    if (!parentId) {
      return;
    }

    const folder: TreeElementData = {
      id: nanoid(),
      label: name,
      context: "",
      content: "",
    };

    const elements = this.load();
    elements.set(folder.id, {
      childIds: [],
      data: folder,
      parentId,
    });
    elements.get(parentId)?.childIds?.push(folder.id);
    await this.save(elements);
  }

  async moveElement(sourceId: string, targetId?: string | undefined): Promise<void> {
    if (targetId === sourceId) {
      return;
    }

    const sourceElement = this.getElement(sourceId);
    const targetElement = this.getElement(targetId);

    if (!sourceElement || !targetElement) {
      return;
    }

    const newParentId = this.isFolder(targetElement)
      ? targetElement.data.id
      : targetElement.parentId;
    
    if (!newParentId) {
      return;
    }

    let tempId: string | undefined = newParentId;
    while (tempId) {
      const currentElement = this.getElement(tempId);
      // Do not move if the ID of the parent element to which you are moving matches the sourceId
      if (
        !currentElement ||
        currentElement?.data.id === sourceId ||
        currentElement?.parentId === sourceId
      ) {
        return;
      }
      // Exit the loop when you finally reach the root element
      tempId = currentElement?.parentId;
    }

    // Get the parent element before moving before executing the move.
    const previousParent = this.getElement(sourceElement.parentId);
    if (!previousParent) {
      return;
    }
    // Remove the ID of the element to be moved from the parent element's childIds
    previousParent?.childIds?.splice(
      previousParent.childIds.indexOf(sourceId),
      1
    );

    const newParentElement = this.getElement(newParentId);
    if (!newParentElement) {
      return;
    }
    sourceElement.parentId = newParentId;
    newParentElement?.childIds?.push(sourceId);

    const elements = this.load();
    elements.set(previousParent?.data.id, previousParent)
    elements.set(sourceId, sourceElement);
    elements.set(newParentId, newParentElement);

    await this.save(elements);
  }

  async renameElement(id: string, newName: string): Promise<void> {
    const element = this.getElement(id);
    if (!element) {
      return;
    }
    element.data.label = newName;
    const elements = this.load();
    elements.set(id, element);
    await this.save(elements);
  }
}