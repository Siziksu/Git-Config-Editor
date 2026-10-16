import * as vscode from 'vscode'
import { join } from 'path'
import { execFileAsync, Commands, ValueNotConfigured } from './constants'
import { GitRepositoryService } from './git-repository.service'
import { GitInfoProvider } from './git-info.provider'
import { GitEditorProvider } from './git-editor.provider'

type LocalGlobal = 'local' | 'global'

export function activate(context: vscode.ExtensionContext) {
  const service = new GitRepositoryService()
  const infoProvider = new GitInfoProvider(service)
  const editorProvider = new GitEditorProvider(service)

  vscode.window.registerTreeDataProvider('viewGitInfo', infoProvider)
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
      const value = !item.description ? '' : item.description === ValueNotConfigured ? '' : item.description
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
        const msg = error instanceof Error ? error.message : 'Unknown error'
        vscode.window.showErrorMessage(`Key already unset`)
      }
    })
  }

  context.subscriptions.push(
    registerToggle(Commands.Toggle.Command, 'local'),
    registerSelect(Commands.Select.Command, 'local'),
    registerEdit(Commands.Edit.Command, 'local'),
    registerDelete(Commands.Delete.Command, 'local'),
    registerToggle(Commands.ToggleGlobal.Command, 'global'),
    registerSelect(Commands.SelectGlobal.Command, 'global'),
    registerEdit(Commands.EditGlobal.Command, 'global'),
    registerDelete(Commands.DeleteGlobal.Command, 'global'),

    vscode.commands.registerCommand(Commands.Refresh.Command, () => service.refresh()),

    vscode.commands.registerCommand(Commands.openGitFileCommand.Command, async () => {
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
          vscode.window.showWarningMessage(`Git extension not available.`)
        } else {
          vscode.window.showErrorMessage('Unknown error occurred while trying to open .git/config.')
        }
      }
    }),

    vscode.commands.registerCommand(Commands.CopyToClipboard.Command, async (value: string) => {
      if (value && value !== 'Unknown' && value !== 'Not configured') {
        await vscode.env.clipboard.writeText(value)
        vscode.window.showInformationMessage(`Copied "${value}" to the clipboard.`)
      }
    })
  )
}

export function deactivate() {}
