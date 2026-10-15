import * as vscode from 'vscode'
import { GitDataProvider } from './provider'

export function activate(context: vscode.ExtensionContext) {
  const gitDataProvider = new GitDataProvider()

  vscode.window.registerTreeDataProvider('gitDetailsView', gitDataProvider)

  let refreshCommand = vscode.commands.registerCommand('git-config-info.refreshGitDetails', () => {
    gitDataProvider.refresh()
  })

  let copyCommand = vscode.commands.registerCommand('git-config-info.copyToClipboard', async (value: string) => {
    if (value && value !== 'Unknown' && value !== 'Not configured') {
      await vscode.env.clipboard.writeText(value)
      // Displays a floating notification that disappears on its own
      vscode.window.showInformationMessage(`Copied "${value}" to the clipboard.`)
    }
  })

  context.subscriptions.push(refreshCommand, copyCommand)
}

export function deactivate() {}
