import "reflect-metadata";
import { suite, test, beforeEach } from "mocha";
import { container } from "tsyringe";
import * as assert from "assert";
import { ChatGPTEditorTreeProviderImpl } from "../../../../core/repository/impl/ChatGPTEditorTreeProviderImpl";
import { ChatGPTEditorTreeItem } from "../../../../core/repository/ChatGPTEditorTreeProvider";
import * as vscode from "vscode";

suite("ChatGPTEditorTreeProviderImpl", () => {
  suite("getChildren", () => {
    beforeEach(() => {
      container.reset();
    });
    test("should return empty array when childIds of root element is empty", async () => {
      // Arrange
      // Mock getElement in ChatGPTEditorStorage
      const mockGetElement = () => {
        return {
          childIds: [],
        };
      };
      const mockChatGPTEditorStorage = {
        getElement: mockGetElement,
      };
      // Register ChatGPTEditorStorage stubs to containers
      container.register("ChatGPTEditorStorage", { useValue: mockChatGPTEditorStorage });
      // Act
      const treeProvider = new ChatGPTEditorTreeProviderImpl();
      // Assert
      const result = await treeProvider.getChildren();
      assert.ok(result.length === 0);
    });
    test("should return array with two elements when childIds of root element has two elements", async () => {
      // Arrange
      // Mock getElement in ChatGPTEditorStorage
      const mockGetElement = (id?: string) => {
        if (id === undefined) {
          return {
            childIds: ["id1", "id2"],
          };
        }
        switch (id) {
          case "id1":
            return {
              data: {
                id: id,
                label: "label1",
                content: "content1"
              }
            };
          case "id2":
            return {
              data: {
                id: id,
                label: "label2",
                content: "content2",
              }
            };
        }
      };
      const mockChatGPTEditorStorage = {
        getElement: mockGetElement,
      };
      // Register ChatGPTEditorStorage stubs to containers
      container.register("ChatGPTEditorStorage", { useValue: mockChatGPTEditorStorage });
      // Act
      const treeProvider = new ChatGPTEditorTreeProviderImpl();
      // Assert
      const result = await treeProvider.getChildren();
      assert.ok(result.length === 2);
      assert.ok(result[0].id === "id1");
      assert.ok(result[1].id === "id2");
    });
  });

  suite("getTreeItem", () => {
    beforeEach(() => {
      container.reset();
      container.register("ChatGPTEditorStorage", {
        useValue: {}
      });
    });
    test("should return the same argument", async () => {
      const treeProvider = new ChatGPTEditorTreeProviderImpl();
      const mockElement: ChatGPTEditorTreeItem = new ChatGPTEditorTreeItem(
        "",
        "",
        vscode.TreeItemCollapsibleState.None,
        "id1"
      );
      const result = treeProvider.getTreeItem(mockElement);
      assert.ok(result.id === mockElement.id);
    });
  });
});