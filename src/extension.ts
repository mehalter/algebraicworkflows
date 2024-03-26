import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("algebraicworkflows.editor", () => {
      AlgebraicWorkflowsPanel.createOrShow(context.extensionUri);
    }),
  );
}

function getWebviewOptions(
  extensionUri: vscode.Uri,
): vscode.WebviewOptions & vscode.WebviewPanelOptions {
  return {
    // Enable javascript in the webview
    enableScripts: true,

    // Enable maintaining session when hidden (TODO: move this to save/restore state for persistence)
    retainContextWhenHidden: true,

    // And restrict the webview to only loading content from our extension's `media` directory.
    localResourceRoots: [
      vscode.Uri.joinPath(extensionUri, "media"),
      vscode.Uri.joinPath(extensionUri, "lib", "out"),
    ],
  };
}

/**
 * Manages semagrams webview panels
 */
class AlgebraicWorkflowsPanel {
  /**
   * Track the currently panel. Only allow a single panel to exist at a time.
   */
  public static currentPanel: AlgebraicWorkflowsPanel | undefined = undefined;

  public static readonly viewType = "algebraicworkflows";

  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];

  public static createOrShow(extensionUri: vscode.Uri) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    // If we already have a panel, show it.
    const currentPanel = AlgebraicWorkflowsPanel.currentPanel;
    if (currentPanel) {
      currentPanel._panel.reveal(column);
      return;
    }

    // Otherwise, create a new panel.
    const panel = vscode.window.createWebviewPanel(
      `${AlgebraicWorkflowsPanel.viewType}_editor`,
      "algebraicworkflows",
      column || vscode.ViewColumn.One,
      getWebviewOptions(extensionUri),
    );

    AlgebraicWorkflowsPanel.currentPanel = new AlgebraicWorkflowsPanel(
      panel,
      extensionUri,
    );
  }

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;
    this._extensionUri = extensionUri;

    // Set the webview's initial html content
    this._update();

    // Listen for when the panel is disposed
    // This happens when the user closes the panel or when the panel is closed programmatically
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // Update the content based on view changes
    this._panel.onDidChangeViewState(
      (e) => {
        if (this._panel.visible) {
          this._update();
        }
      },
      null,
      this._disposables,
    );

    // Handle messages from the webview
    this._panel.webview.onDidReceiveMessage(
      (message) => {
        switch (message.command) {
          case "alert":
            vscode.window.showInformationMessage(message.text);
            return;
        }
      },
      null,
      this._disposables,
    );
  }

  public doRefactor() {
    // Send a message to the webview webview.
    // You can send any JSON serializable data.
    this._panel.webview.postMessage({ command: "refactor" });
  }

  public dispose() {
    AlgebraicWorkflowsPanel.currentPanel = undefined;

    // Clean up our resources
    this._panel.dispose();

    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }

  private _update() {
    const webview = this._panel.webview;
    this._panel.title = "AlgebraicWorkflows";
    this._panel.webview.html = this._getHtmlForWebview(webview);
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const appPathOnDisk = vscode.Uri.joinPath(
      this._extensionUri,
      "lib",
      "out",
      "app",
      "fullLinkJS.dest",
      "main.js",
    );

    // And the uri we use to load this script in the webview
    const appUri = webview.asWebviewUri(appPathOnDisk);

    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "style.css"),
    );

    return `<!DOCTYPE html>
			<html lang="en">
			<head>
    		<meta charset="utf-8">
    		<meta http-equiv="x-ua-compatible" content="ie=edge">
    		<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.4/dist/katex.min.css" integrity="sha384-vKruj+a13U8yHIkAyGgK1J3ArTLzrFGBbBc0tDp4ad/EyewESeXE/Iv67Aj8gKZ0" crossorigin="anonymous">
    		<title>AlgebraicWorkflows</title>
    		<meta name="description" content="">
    		<meta name="viewport" content="width=device-width, initial-scale=1">
    		<link rel="stylesheet" href="${styleUri}">

				<meta name="viewport" content="width=device-width, initial-scale=1.0">
			</head>
			<body>
    		<div id="app-container" />
        <script type="module">
          import { App } from '${appUri}'
          App.main(document.getElementById("app-container"))
        </script>
			</body>
			</html>`;
  }
}