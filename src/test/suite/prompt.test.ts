/* eslint-disable @typescript-eslint/naming-convention */
import * as assert from "assert";
import * as vscode from "vscode";
import * as sinon from "sinon";
import * as tsChatgpt from "ts-chatgpt";
import { faker } from "@faker-js/faker";

const mockData = {
  id: `chatcmpl-${faker.random.alphaNumeric}`,
  object: "chat.completion",
  created: Math.floor(Date.now() / 1000),
  model: "gpt-3.5-turbo-0301",
  usage: { prompt_tokens: 42, completion_tokens: 27, total_tokens: 69 },
  choices: [
    {
      message: {
        role: "assistant",
        content:
          "\n" +
          "\n" +
          "She loved ChatGPT, the one platform that sparked a passion within her. With it, she developed beautiful, inventive applications.",
      },
      finish_reason: "stop",
      index: 0,
    },
  ],
};

suite("chatgpt-editor.prompt command", () => {
  test("should activate", async () => {
    const extension = vscode.extensions.getExtension("takagimeow.chatgpt-editor");
    await extension?.activate();
  });
  test("should insert the return value of prompt() at the end of the editor", async () => {
    // Arrange
    const selectedText = "Hello, how are you?";
    const apiKey = "testApiKey";
    const model = "gpt-3.5-turbo";
    const temperature = 0.1;
    // Open a new document
    const document = await vscode.workspace.openTextDocument({
      content: selectedText,
    });
    await vscode.window.showTextDocument(document);
    const editor = vscode.window.activeTextEditor;
    const selection = editor?.selection;
    // Select text
    editor!.selections = [new vscode.Selection(0, 0, 0, selectedText.length)];
    // Update settings
    const mockConfig = vscode.workspace.getConfiguration("chatgpt-editor");
    await mockConfig.update("apiKey", apiKey, true);
    await mockConfig.update("model", model, true);
    await mockConfig.update("temperature", temperature, true);
    // Stub prompt function from ts-chatgpt
    sinon.stub(tsChatgpt, "prompt").resolves(mockData);

    // Act
    await vscode.commands.executeCommand("chatgpt-editor.prompt");
    // Assert
    assert.strictEqual(
      document?.getText(),
      `${selectedText}${mockData.choices[0].message.content}`
    );
  });
});
