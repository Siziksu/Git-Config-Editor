import * as vscode from 'vscode'
import { join } from 'path'
import { Commands, Text } from './constants'
import { GitRepositoryService } from './git-repository.service'
import { GitStatusProvider } from './git-status.provider'
import { GitEditorProvider } from './git-editor.provider'
import { execFileAsync } from './functions'

type LocalGlobal = 'local' | 'global'

export function activate(context: vscode.ExtensionContext) {
  const service = new GitRepositoryService()

  const statusProvider = new GitStatusProvider(service)
  const editorProvider = new GitEditorProvider(service)

  vscode.window.registerTreeDataProvider('viewGitStatus', statusProvider)
  vscode.window.registerTreeDataProvider('viewGitEditor', editorProvider)

  async function saveGitConfig(key: string, value: string, scope: LocalGlobal) {
    try {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
      const options = workspaceFolder ? { cwd: workspaceFolder } : {}

      const args = ['config']
      if (scope === 'global') args.push('--global')
      args.push(key, value)

      await execFileAsync('git', args, options)
      vscode.window.showInformationMessage(`Git config updated: ${key} = ${value}`)

      await service.refresh()
    } catch (error: any) {
      const msg = error instanceof Error ? error.message : 'Unknown error'
      vscode.window.showErrorMessage(`Error while changing git config: ${msg}`)
    }
  }

  const registerToggle = (commandId: string, scope: LocalGlobal) => {
    return vscode.commands.registerCommand(commandId, async (item: any) => {
      if (!item || !item.key) return
      const newValue = item.description?.toLowerCase() === 'true' ? 'false' : 'true'
      await saveGitConfig(item.key, newValue, scope)
    })
  }

  const registerSelect = (commandId: string, scope: LocalGlobal) => {
    return vscode.commands.registerCommand(commandId, async (item: any) => {
      if (!item || !item.key || !item.options) return
      const newValue = await vscode.window.showQuickPick(item.options, {
        placeHolder: 'Select behaviour',
        title: 'Git Editor'
      })
      if (newValue) await saveGitConfig(item.key, newValue, scope)
    })
  }

  function registerEdit(commandId: string, scope: LocalGlobal) {
    return vscode.commands.registerCommand(commandId, async (item: any) => {
      const value = !item.description ? '' : item.description === Text.NotConfigured ? '' : item.description
      if (!item || !item.key) return
      const input = await vscode.window.showInputBox({
        title: 'Git Editor: Change Value',
        prompt: 'Enter the new value',
        value: value,
        placeHolder: 'New value',
        validateInput: (text) => (text.trim().length === 0 ? 'The new value cannot be empty' : null)
      })
      if (input !== undefined && input.trim().length > 0) {
        await saveGitConfig(item.key, input.trim(), scope)
      }
    })
  }

  function registerDelete(commandId: string, scope: LocalGlobal) {
    return vscode.commands.registerCommand(commandId, async (item: any) => {
      if (!item || !item.key) return
      try {
        const key = item.key

        const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
        const options = workspaceFolder ? { cwd: workspaceFolder } : {}

        const args = ['config']
        if (scope === 'global') args.push('--global')
        args.push('--unset')
        args.push(key)

        await execFileAsync('git', args, options)
        vscode.window.showInformationMessage(`Git key unset: ${key}`)

        await service.refresh()
      } catch (error: any) {
        vscode.window.showErrorMessage(`Key already unset`)
      }
    })
  }

  context.subscriptions.push(
    vscode.commands.registerCommand(Commands.GitInit, async () => {
      try {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
        const options = workspaceFolder ? { cwd: workspaceFolder } : {}

        await execFileAsync('git', ['init'], options)
        vscode.window.showInformationMessage(`Git repository initialized`)

        await service.refresh()
      } catch (error: any) {
        vscode.window.showErrorMessage(`Error initializing the repository`)
      }
    }),

    registerToggle(Commands.Toggle, 'local'),
    registerSelect(Commands.Select, 'local'),
    registerEdit(Commands.Edit, 'local'),
    registerDelete(Commands.Delete, 'local'),
    registerToggle(Commands.ToggleGlobal, 'global'),
    registerSelect(Commands.SelectGlobal, 'global'),
    registerEdit(Commands.EditGlobal, 'global'),
    registerDelete(Commands.DeleteGlobal, 'global'),

    vscode.commands.registerCommand(Commands.Refresh, () => service.refresh()),

    vscode.commands.registerCommand(Commands.OpenGitFileCommand, async () => {
      const workspaceFolders = vscode.workspace.workspaceFolders
      if (!workspaceFolders) {
        vscode.window.showErrorMessage('There is no open workspace.')
        return
      }

      const file = vscode.Uri.file(join(workspaceFolders[0].uri.fsPath, '.git', 'config'))
      try {
        const document = await vscode.workspace.openTextDocument(file)
        await vscode.window.showTextDocument(document, { preview: false })
      } catch (error) {
        if (error instanceof Error) {
          vscode.window.showWarningMessage(Text.GitNotAvailable)
        } else {
          vscode.window.showErrorMessage('Unknown error occurred while trying to open .git/config.')
        }
      }
    }),

    vscode.commands.registerCommand(Commands.CopyToClipboard, async (value: string) => {
      if (value && value !== 'Unknown' && value !== 'Not configured') {
        await vscode.env.clipboard.writeText(value)
        vscode.window.showInformationMessage(`Copied "${value}" to the clipboard.`)
      }
    })
  )
}

export function deactivate() {}
