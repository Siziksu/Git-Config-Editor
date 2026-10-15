import * as vscode from 'vscode'
import { GitExtension, API } from './git'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

class GitItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly description: string,
    icon: string,
    tooltip: string,
    command: vscode.Command
  ) {
    super(label, vscode.TreeItemCollapsibleState.None)
    this.description = description
    this.iconPath = new vscode.ThemeIcon(icon)
    this.tooltip = tooltip
    this.command = command
  }
}

const UNKNOWN = 'Unknown'
const ERROR_ITEM = new GitItem('Warning', 'Git extension not available', 'warning', 'Warning', {
  command: '',
  title: ''
})

export class GitDataProvider implements vscode.TreeDataProvider<GitItem> {
  gitAPI: API | null = null

  constructor() {
    const gitExtension = vscode.extensions.getExtension<GitExtension>('vscode.git')?.exports
    if (gitExtension) {
      this.gitAPI = gitExtension.getAPI(1)
      this.gitAPI.onDidChangeState(() => this.refresh())
      this.gitAPI.repositories.forEach((repo) => {
        repo.state.onDidChange(() => this.refresh())
      })
    }
  }

  // Event required to notify VS Code to refresh the interface
  private _onDidChangeTreeData: vscode.EventEmitter<GitItem | undefined | null | void> = new vscode.EventEmitter<
    GitItem | undefined | null | void
  >()
  readonly onDidChangeTreeData: vscode.Event<GitItem | undefined | null | void> = this._onDidChangeTreeData.event

  refresh(): void {
    this._onDidChangeTreeData.fire()
  }

  getTreeItem(element: GitItem): vscode.TreeItem {
    return element
  }

  async getChildren(element?: GitItem): Promise<GitItem[]> {
    if (element) return [ERROR_ITEM]
    if (this.gitAPI === null) return [ERROR_ITEM]

    const repository = this.gitAPI.repositories[0]
    if (repository === undefined) return [ERROR_ITEM]

    const state = repository.state
    const branch = state.HEAD?.name || 'HEAD detached'
    const remote = state.remotes[0]?.fetchUrl || UNKNOWN

    let web: string | undefined = undefined
    if (remote !== UNKNOWN) {
      const match = remote.match(/github\.com[:/]([^/]+\/[^/]+?)(?:\.git)?$/)
      if (match) {
        web = `https://github.com/${match[1]}`
      }
    }

    let userName = UNKNOWN
    let userEmail = UNKNOWN
    try {
      const [name, email] = await Promise.all([repository.getConfig('user.name'), repository.getConfig('user.email')])
      if (name) userName = name
      if (email) userEmail = email
    } catch (e) {
      // Silent failure
    }
    if (userName === UNKNOWN) {
      try {
        const { stdout } = await execAsync('git config --global user.name')
        if (stdout.trim()) userName = stdout.trim()
      } catch (e) {}
    }

    if (userEmail === UNKNOWN) {
      try {
        const { stdout } = await execAsync('git config --global user.email')
        if (stdout.trim()) userEmail = stdout.trim()
      } catch (e) {}
    }

    const items: GitItem[] = []

    items.push(
      new GitItem('Branch', branch, 'git-branch', branch, {
        command: 'git-config-info.copyToClipboard',
        title: 'Copy to clipboard',
        arguments: [branch]
      })
    )
    items.push(
      new GitItem('Remote', remote, 'globe', web ?? remote, {
        command: web ? 'vscode.open' : 'git-config-info.copyToClipboard',
        title: web ? 'Open in Browser' : 'Copy to clipboard',
        arguments: [web ?? remote]
      })
    )
    items.push(
      new GitItem('User', userName, 'account', userName, {
        command: 'git-config-info.copyToClipboard',
        title: 'Copy to clipboard',
        arguments: [userName]
      })
    )
    items.push(
      new GitItem('Email', userEmail, 'mail', userEmail, {
        command: 'git-config-info.copyToClipboard',
        title: 'Copy to clipboard',
        arguments: [userEmail]
      })
    )

    return items
  }
}
