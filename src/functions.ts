import * as vscode from 'vscode'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { Commands } from './constants'

export const execFileAsync = promisify(execFile)

export function openInBrowserCommand(args: any[]): vscode.Command {
  return {
    command: Commands.OpenInBrowser,
    title: 'Open in Browser',
    arguments: args
  }
}

export function copyToClipboardCommand(text: string | undefined): vscode.Command {
  return {
    command: Commands.CopyToClipboard,
    title: 'Copy to Clipboard',
    arguments: [text]
  }
}

export function openGitFileCommand(): vscode.Command {
  return {
    command: Commands.OpenGitFileCommand,
    title: 'Open .git/config',
    arguments: []
  }
}

export function openGitFileGlobalCommand(): vscode.Command {
  return {
    command: Commands.OpenGitFileGlobalCommand,
    title: 'Open ~/.gitconfig',
    arguments: []
  }
}
