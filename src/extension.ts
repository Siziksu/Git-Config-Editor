import * as vscode from 'vscode'
import { join } from 'path'
import { GitDataProvider } from './provider'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export function activate(context: vscode.ExtensionContext) {
  const gitDataProvider = new GitDataProvider()

  vscode.window.registerTreeDataProvider('gitEditorView', gitDataProvider)

  let toggleGitConfigCommand = vscode.commands.registerCommand('git-config-info.toggleGitConfig', async (item: any) => {
    if (!item || !item.key) return

    const key = item.key
    const currentValue = item.description
    const newValue = currentValue?.toLowerCase() === 'true' ? 'false' : 'true'

    try {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
      const options = workspaceFolder ? { cwd: workspaceFolder } : {}

      await execAsync(`git config ${key} ${newValue}`, options)

      vscode.window.showInformationMessage(`Git config updated: ${key} = ${newValue}`)

      gitDataProvider.refresh()
    } catch (error: any) {
      if (error instanceof Error) {
        vscode.window.showErrorMessage(`Error while changing git config: ${error.message}`)
      } else {
        vscode.window.showErrorMessage('Unknown error occurred while changing git config.')
      }
    }
  })

  let openConfigFileCommand = vscode.commands.registerCommand('git-config-info.openGitConfigFile', async () => {
    const workspaceFolders = vscode.workspace.workspaceFolders
    if (!workspaceFolders) {
      vscode.window.showErrorMessage('There is no open workspace.')
      return
    }

    const rootPath = workspaceFolders[0].uri.fsPath
    const path = join(rootPath, '.git', 'config')
    const file = vscode.Uri.file(path)

    try {
      const document = await vscode.workspace.openTextDocument(file)
      await vscode.window.showTextDocument(document, { preview: false })
    } catch (error) {
      if (error instanceof Error) {
        vscode.window.showErrorMessage(`Could not open .git/config: ${error.message}`)
      } else {
        vscode.window.showErrorMessage('Unknown error occurred while trying to open .git/config.')
      }
    }
  })

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

  context.subscriptions.push(copyCommand, refreshCommand, toggleGitConfigCommand, openConfigFileCommand)
}

export function deactivate() {}
