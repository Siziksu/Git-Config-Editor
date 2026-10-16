import * as vscode from 'vscode'
import { join } from 'path'
import { GitDataProvider } from './provider'
import { execFileAsync, Commands } from './constants'

export function activate(context: vscode.ExtensionContext) {
  const gitDataProvider = new GitDataProvider()

  vscode.window.registerTreeDataProvider('viewGitEditor', gitDataProvider)

  let toggleCommand = vscode.commands.registerCommand(Commands.Toggle.Command, async (item: any) => {
    if (!item || !item.key) return

    const key = item.key
    const currentValue = item.description
    const newValue = currentValue?.toLowerCase() === 'true' ? 'false' : 'true'

    try {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
      const options = workspaceFolder ? { cwd: workspaceFolder } : {}

      await execFileAsync('git', ['config', key, newValue], options)

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

  let selectCommand = vscode.commands.registerCommand(Commands.Select.Command, async (item: any) => {
    if (!item || !item.key || !item.options) return

    const key = item.key
    const options = item.options

    const newValue = await vscode.window.showQuickPick(options, {
      placeHolder: 'Select behaviour',
      title: 'Git Editor'
    })

    if (newValue) {
      try {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
        const options = workspaceFolder ? { cwd: workspaceFolder } : {}

        await execFileAsync('git', ['config', key, newValue], options)

        vscode.window.showInformationMessage(`Git config updated: ${key} = ${newValue}`)

        gitDataProvider.refresh()
      } catch (error: any) {
        if (error instanceof Error) {
          vscode.window.showErrorMessage(`Error while changing git config: ${error.message}`)
        } else {
          vscode.window.showErrorMessage('Unknown error occurred while changing git config.')
        }
      }
    }
  })

  let editCommand = vscode.commands.registerCommand(Commands.Edit.Command, async (item: any) => {
    if (!item || !item.key) return

    const key = item.key
    const current = item.description || ''

    const input = await vscode.window.showInputBox({
      title: 'Git Editor: Change Value',
      prompt: 'Enter the new value',
      value: current,
      placeHolder: 'New value',

      // It is mandatory to ensure that the user does not leave the name field empty
      validateInput: (text) => {
        return text.trim().length === 0 ? 'The new value cannot be empty' : null
      }
    })

    if (input !== undefined && input.trim().length > 0) {
      const newValue = input.trim()
      try {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
        const options = workspaceFolder ? { cwd: workspaceFolder } : {}

        await execFileAsync('git', ['config', key, newValue], options)

        vscode.window.showInformationMessage(`Git config updated: ${key} = ${newValue}`)

        gitDataProvider.refresh()
      } catch (error) {
        if (error instanceof Error) {
          vscode.window.showErrorMessage(`Error while changing git config: ${error.message}`)
        } else {
          vscode.window.showErrorMessage('Unknown error occurred while changing git config.')
        }
      }
    }
  })

  let openConfigFileCommand = vscode.commands.registerCommand(Commands.openGitFileCommand.Command, async () => {
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

  let refreshCommand = vscode.commands.registerCommand(Commands.Refresh.Command, () => {
    gitDataProvider.refresh()
  })

  let copyToClipboardCommand = vscode.commands.registerCommand(
    Commands.CopyToClipboard.Command,
    async (value: string) => {
      if (value && value !== 'Unknown' && value !== 'Not configured') {
        await vscode.env.clipboard.writeText(value)
        // Displays a floating notification that disappears on its own
        vscode.window.showInformationMessage(`Copied "${value}" to the clipboard.`)
      }
    }
  )

  context.subscriptions.push(
    copyToClipboardCommand,
    refreshCommand,
    toggleCommand,
    selectCommand,
    editCommand,
    openConfigFileCommand
  )
}

export function deactivate() {}
