import "reflect-metadata";
import { suite, test, beforeEach } from "mocha";
import { container } from "tsyringe";
import * as assert from "assert";
import { ChatGPTEditorStorageImpl } from "../../../../core/repository/impl/ChatGPTEditorStorageImpl";
import { nanoid } from "nanoid";
import * as vscode from "vscode";
import * as sinon from "sinon";
import { Elements } from "../../../../core/repository/ChatGPTEditorStorage";

suite("ChatGPTEditorStorageImpl", () => {
  const rootId = nanoid();
  const childId1 = nanoid();
  const childId2 = nanoid();
  const elements = [
    {
      data: {
        id: rootId,
        label: "root",
        context: "",
        content: "",
      },
      childIds: [
        childId1,
        childId2,
      ],
    },
    {
      data: {
        id: childId1,
        label: "child1",
        context: "context1",
        content: "content1",
      },
      parentId: rootId,
    },
    {
      data: {
        id: childId2,
        label: "child2",
        context: "context2",
        content: "content2",
      },
      parentId: rootId,
    },
  ];
  const value = JSON.stringify(elements);
  suite("getElement", async () => {
    // load() is called. So mock globalState and test for empty and non-empty cases
    // If id is undefined, the value of this.rootId is assigned to providedOrRootId
    beforeEach(() => {
      container.reset();
    });
    test("should return array with root element when load() returns empty array", () => {
      // Mock globalState so that get() returns an empty array
      const globalState = {
        get: () => [],
      };
      container.register("GlobalState", { useValue: globalState });

      const storage = new ChatGPTEditorStorageImpl();
      const element = storage.getElement();
      assert.equal(element?.data.label, "root");
    });

    test("should return TreeElement when load() returns value and id is not undefined", () => {
      const globalState = {
        get: () => value,
      };
      container.register("GlobalState", { useValue: globalState });
      const result = new ChatGPTEditorStorageImpl().getElement(childId1);
      assert.equal(result?.data.label, "child1");
    });
    test("should return root element when load() returns value and id is undefined", () => {
      const globalState = {
        get: () => value,
      };
      container.register("GlobalState", { useValue: globalState });
      const result = new ChatGPTEditorStorageImpl().getElement();
      assert.equal(result?.data.label, "root");
    });
  });
  suite("deleteElement", () => {
    beforeEach(() => {
      container.reset();
    });
    test("should call save() with elements after delete", async () => {
      // Stub vscode.window.showInformationMessage to return "Yes
      const stubbed = sinon.stub(vscode.window, "showInformationMessage").resolves("Yes" as any);
      const globalState = {
        get: () => value,
        save: () => null,
      };
      container.register("GlobalState", { useValue: globalState });
      // stub save() to make sure a specific value is passed as an argument
      const storage = new ChatGPTEditorStorageImpl();
      const save = sinon.spy(storage, "save");

      await storage.deleteElement(childId1);
      const expected: Elements = new Map<string, any>();
      expected.set(rootId, {
        data: {
          id: rootId,
          label: "root",
          context: "",
          content: "",
        },
        childIds: [
          childId2,
        ],
      });
      expected.set(childId2, {
        data: {
          id: childId2,
          label: "child2",
          context: "context2",
          content: "content2",
        },
        childIds: [],
        parentId: rootId,
      });
      const captured = save.getCall(0).args[0];
      assert.ok(save.calledOnce);
      assert.equal(captured.get(childId1), undefined);
      assert.equal(captured.get(childId2)?.data.label, expected.get(childId2)?.data.label);
      assert.equal(captured.get(rootId)?.data.label, expected.get(rootId)?.data.label);

      stubbed.restore();
    });
    test("should not call save() when answer is No", async () => {
      const stubbed = sinon.stub(vscode.window, "showInformationMessage").resolves("No" as any);
      const globalState = {
        get: () => value,
        save: () => null,
      };
      container.register("GlobalState", { useValue: globalState });
      const storage = new ChatGPTEditorStorageImpl();
      const save = sinon.spy(storage, "save");

      await storage.deleteElement(childId1);
      assert.ok(save.notCalled);

      stubbed.restore();
    });
  });

  suite("saveContent", () => {
    beforeEach(() => {
      container.reset();
    });
    test("should call save() with elements after saveContent", async () => {
      const globalState = {
        get: () => value,
        save: () => null,
      };
      container.register("GlobalState", { useValue: globalState });
      const storage = new ChatGPTEditorStorageImpl();
      const save = sinon.spy(storage, "save");
      await storage.saveContent("new context", "new content", "new label");

      const captured = save.getCall(0).args[0];
      assert.ok(save.calledOnce);
      assert.equal(captured.size, 4);
    });
  });

  suite("load", () => {
    test("should return default value when json is empty", () => {
      const globalState = {
        get: () => ""
      };
      container.register("GlobalState", { useValue: globalState });
      const result = new ChatGPTEditorStorageImpl().load();
      result.forEach((element) => {
        console.log("element", element);
      });
      assert.equal(result.size, 1);
    });
    test("should return default value when json is invalid", () => {
      const globalState = {
        get: () => "Hello World",
      };
      container.register("GlobalState", { useValue: globalState });
      const result = new ChatGPTEditorStorageImpl().load();
      assert.equal(result.size, 1);
    });
    test("should return default value when tree is not array", () => {
      const globalState = {
        get: () => "{ \"tree\": \"Hello World\" }}",
      };
      container.register("GlobalState", { useValue: globalState });
      const result = new ChatGPTEditorStorageImpl().load()
      assert.equal(result.size, 1);
    });
    test("should return default value when tree is empty array", () => {
      const globalState = {
        get: () => "[]",
      };
      container.register("GlobalState", { useValue: globalState });
      const result = new ChatGPTEditorStorageImpl().load()
      assert.equal(result.size, 1);
    });
    test("should return TreeElement[] when json is valid", () => {
      const globalState = {
        get: () => value,
      };
      container.register("GlobalState", { useValue: globalState });
      const storage = new ChatGPTEditorStorageImpl();
      const result = storage.load();
      assert.equal(result.size, 3);
    });
  });
  suite("createFolder", () => {
    test("should do nothing when relativeToId is not found", () => {
      const globalState = {
        get: () => value,
        save: () => null,
      };
      container.register("GlobalState", { useValue: globalState });
      const storage = new ChatGPTEditorStorageImpl();
      const save = sinon.spy(storage, "save");
      storage.createFolder("new folder", "not found");
      assert.ok(save.notCalled);
    });
    test("should do nothing when parentId is empty string", () => {
      const globalState = {
        get: () => value,
        save: () => null,
      };
      container.register("GlobalState", { useValue: globalState });
      const storage = new ChatGPTEditorStorageImpl();
      sinon.stub(storage, "getElement").resolves({
        childIds: [],
        parentId: "hello world",
      });
      const save = sinon.spy(storage, "save");
      storage.createFolder("new folder", childId1);
      assert.ok(save.notCalled);
    });
    test("should call save() with new elements when folder is created", async () => {
      const globalState = {
        get: () => value,
        save: () => null,
      };
      container.register("GlobalState", { useValue: globalState });
      const storage = new ChatGPTEditorStorageImpl();
      const save = sinon.spy(storage, "save");
      storage.createFolder("new folder", childId1);

      const captured = save.getCall(0).args[0];
      assert.ok(save.called);
      assert.equal(captured.size, 4);
    });
  });

  suite("moveElement", () => {
    test("should not call save() when targetId and sourceId are same", () => {
      container.register("GlobalState", { useValue: {} });
      const storage = new ChatGPTEditorStorageImpl();
      const save = sinon.spy(storage, "save");
      storage.moveElement(childId1, childId1);
      assert.ok(save.notCalled);
    });
    test("should not call save() when sourceElement or targetElement is not found", () => {
      container.register("GlobalState", {
        useValue: {
          get: () => value,
        }
      });
      const storage = new ChatGPTEditorStorageImpl();
      const save = sinon.spy(storage, "save");
      storage.moveElement(childId1, "not found");
      assert.ok(save.notCalled);
    });
    test("should not call save() when parent of targetElement has sourceElement", () => {
      // childId1 for the child element of root
      // childId2 as a child element of childId1
      // This time, we assume that childId1 is moved as a child element of childId2.
      const elements = [
        {
          data: {
            id: rootId,
            label: "root",
            context: "",
            content: "",
          },
          childIds: [
            childId1,
          ],
        },
        {
          data: {
            id: childId1,
            label: "child1",
            context: "",
            content: "",
          },
          parentId: rootId,
          childIds: [
            childId2
          ],
        },
        {
          data: {
            id: childId2,
            label: "child2",
            context: "",
            content: "",
          },
          parentId: childId1,
          childIds: [],
        },
      ];
      // change the parentId of the childId2 element to childId1
      container.register("GlobalState", {
        useValue: {
          get: () => JSON.stringify(elements),
        }
      });
      const storage = new ChatGPTEditorStorageImpl();
      const save = sinon.spy(storage, "save");
      storage.moveElement(childId1, childId2);
      assert.ok(save.notCalled);
    });
    test("should not call save() when newParentId is not found", () => {
      const elements = [
        {
          data: {
            id: rootId,
            label: "root",
            context: "",
            content: "",
          },
          childIds: [
            childId1,
            childId2,
          ],
        },
        {
          data: {
            id: childId1,
            label: "child1",
            context: "context1",
            content: "content1",
          },
          parentId: rootId,
        },
        {
          data: {
            id: childId2,
            label: "child2",
            context: "context2",
            content: "content2",
          },
          parentId: "not found",
        },
      ];
      container.register("GlobalState", {
        useValue: {
          get: () => JSON.stringify(elements),
        }
      });
      const storage = new ChatGPTEditorStorageImpl();
      const save = sinon.spy(storage, "save");
      storage.moveElement(childId1, childId2);
      assert.ok(save.notCalled);
    });
    test("should call save() when element is moved", () => {
      const elements = [
        {
          data: {
            id: rootId,
            label: "root",
            context: "",
            content: "",
          },
          childIds: [
            childId1,
            childId2,
          ],
        },
        {
          data: {
            id: childId1,
            label: "child1",
            context: "context1",
            content: "content1",
          },
          parentId: rootId,
        },
        {
          data: {
            id: childId2,
            label: "child2",
            context: "",
            content: "",
          },
          parentId: rootId,
          childIds: [],
        },
      ];
      container.register("GlobalState", {
        useValue: {
          get: () => JSON.stringify(elements),
        }
      });
      const storage = new ChatGPTEditorStorageImpl();
      const save = sinon.spy(storage, "save");
      storage.moveElement(childId1, childId2);
      assert.ok(save.called);
    });
  });
  suite("renameElement", () => {
    test("should not call save() when element is not found", () => {
      container.register("GlobalState", {
        useValue: {
          get: () => value,
        }
      });
      const storage = new ChatGPTEditorStorageImpl();
      const save = sinon.spy(storage, "save");
      storage.renameElement("not found", "new name");
      assert.ok(save.notCalled);
    });
    test("should call save() when element is renamed", () => {
      container.register("GlobalState", {
        useValue: {
          get: () => value,
        }
      });
      const storage = new ChatGPTEditorStorageImpl();
      const save = sinon.spy(storage, "save");
      storage.renameElement(childId1, "new name");
      assert.ok(save.called);
    });
  });
});
