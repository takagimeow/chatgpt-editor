import "reflect-metadata";
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { ChatGPT, ChatGPTError, GPTModel, prompt } from "ts-chatgpt";
import { Endpoint } from "./feature/endpoint/Endpoint";
import { container } from "tsyringe";
import { serviceModule } from "./core/service/di/serviceModule";
import { contextModule } from "./core/service/di/contextModule";
import { repositoryModule } from "./core/repository/di/repositoryModule";
import { featureModule } from "./feature/di/featureModule";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "chatgpt-editor" is now active!');
	// Register a service
	contextModule(context);
	serviceModule();
	repositoryModule();
	featureModule();
	const endpoint = container.resolve<Endpoint>("Endpoint");

	// Create a tree view
	context.subscriptions.push(
		vscode.window.createTreeView("chatgptEditorView", {
			treeDataProvider: endpoint.chatgptEditorTreeProvider,
			showCollapseAll: true,
			canSelectMany: false,
			dragAndDropController: endpoint.chatgptEditorTreeProvider,
		})
	);
	// Register command
	context.subscriptions.push(
		vscode.commands.registerCommand("chatgpt-editor.refresh", endpoint.refresh()),
		vscode.commands.registerCommand("chatgpt-editor.deleteResponse", endpoint.deleteResponse()),
		vscode.commands.registerCommand("chatgpt-editor.insertResponse", endpoint.insertResponse()),
		vscode.commands.registerCommand("chatgpt-editor.renameResponse", endpoint.renameResponse()),
		vscode.commands.registerCommand("chatgpt-editor.createFolder", endpoint.createFolder()),
		vscode.commands.registerCommand("chatgpt-editor.prompt", async () => { // Retrieve settings
			const config = vscode.workspace.getConfiguration("chatgpt-editor");
			// Obtain an API key
			const apikey = config.get("apiKey") as string | undefined;
			// Obtain a model
			const model = config.get("model") as GPTModel | undefined;
			// Get temperature
			const temperature = config.get("temperature") as number | undefined;
			if (!apikey && typeof apikey !== "string") {
				vscode.window.showErrorMessage("API key is not set.");
				return;
			}
			if (!model && typeof model !== "string") {
				vscode.window.showErrorMessage("No model is set.");
				return;
			}
			await vscode.window.withProgress({
				location: vscode.ProgressLocation.Notification,
				title: "Prompting selected texts...",
				cancellable: true
			}, async (progress, token) => {
				return new Promise(async (resolve) => { // Processing when canceled
					const customCancellationToken = new vscode.CancellationTokenSource();

					token.onCancellationRequested(() => {
						customCancellationToken?.dispose();
						// customCancellationToken = null;

						vscode.window.showInformationMessage("Cancelled the progress");
						resolve(null);
						return;
					});

					// Obtain a selection
					const editor = vscode.window.activeTextEditor;
					const selections = editor?.selections.filter((selection) => !selection.isEmpty);
					if (!selections || selections.length === 0) {
						return;
					}
					// Get the text of the selected range
					const texts = selections.map((selection) => editor?.document.getText(selection));

					// Ask ChatGPT
					const messages = await Promise.all(texts.map(async (text, index) => {
						const response = await prompt({
							model: model,
							messages: [
								{
									role: "user",
									content: text ?? ""
								},
							],
							options: {
								apiKey: apikey,
								temperature: temperature
							}
						});
						// verify whether the reponse contains an "error" property
						if (response && "error" in response) {
							const data = response as ChatGPTError;
							return data.error.message;
						}
						// verify whther the response contains a "choices" property
						if (response && "choices" in response) {
							const data = response as ChatGPT;
							const choices = data.choices ?? [];
							return choices[0].message.content;
						}
						return "";
					}));

					// Save to global state received from ChatGPT
					await Promise.all(messages.map(async (message, index) => {
						// The label passed as the second argument is displayed in the tree view
						// used as the title of the element
						const label = texts[index]?.slice(0, 100) ?? message.slice(0, 100);
						console.log("label: ", label);
						await endpoint.saveReponse(
							texts[index] ?? "",
							message,
							label,
						);
					}));

					// Insert text at the end of the editor where the focus resides
					await editor?.edit((textEditor: vscode.TextEditorEdit) => {
						for (const index in selections) {
							const selection = selections[index];
							const text = texts[index];
							const message = messages[index];
							if (selection && text && !token.isCancellationRequested) { // Check if selection.end contains \n
								const end = selection.end;
								const line = editor?.document.lineAt(end.line);
								const endText = line?.text.substring(end.character);
								if (endText === "") {
									textEditor.insert(selection.end, message);
								} else {
									textEditor.insert(selection.end, "\n" + message);
								}
							}
						}
					});
					resolve(null);
				});
			});
		}));

	vscode.workspace.onDidChangeConfiguration((event: vscode.ConfigurationChangeEvent) => {
		const config = vscode.workspace.getConfiguration("chatgpt");
		if (event.affectsConfiguration("chatgpt-editor.apikey")) { }
	});
}

// This method is called when the extension is disabled.
// the deactive method should be invoked when the extension becomes disabled.
export function deactivate() { }
