import * as vscode from 'vscode'
import { GitExtension, API } from './git'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

const UNKNOWN = 'Unknown'
const NOT_CONFIGURED = 'Not configured'

class GitItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly description: string | undefined,
    public readonly icon: string | undefined,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly tooltip?: string,
    public readonly command?: vscode.Command,
    public readonly key?: string,
    public readonly children?: GitItem[]
  ) {
    super(label, collapsibleState)
    this.description = description
    if (icon) this.iconPath = new vscode.ThemeIcon(icon)
    if (tooltip) this.tooltip = tooltip
    if (command) this.command = command
    if (key) this.contextValue = 'toggleConfig'
  }
}

const ERROR_ITEM = new GitItem(
  'Warning',
  'Git extension not available',
  'warning',
  vscode.TreeItemCollapsibleState.None
)

export class GitDataProvider implements vscode.TreeDataProvider<GitItem> {
  gitAPI: API | null = null

  constructor() {
    const gitExtension = vscode.extensions.getExtension<GitExtension>('vscode.git')?.exports
    if (gitExtension) {
      this.gitAPI = gitExtension.getAPI(1)
      this.gitAPI.onDidChangeState(() => this.refresh())
      this.gitAPI.onDidOpenRepository((repo) => {
        this.refresh()
        repo.state.onDidChange(() => this.refresh())
      })
      this.gitAPI.repositories.forEach((repo) => {
        repo.state.onDidChange(() => this.refresh())
      })
    }
  }

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
    if (this.gitAPI === null) return [ERROR_ITEM]

    const repository = this.gitAPI.repositories[0]
    if (repository === undefined) return [ERROR_ITEM]

    if (element) {
      return element.children ?? []
    }

    const state = repository.state
    const branch = state.HEAD?.name || 'HEAD detached'
    const remote: string | undefined = state.remotes[0]?.fetchUrl

    let web: string | undefined = undefined
    if (remote) {
      const match = remote.match(/github\.com[:/]([^/]+\/[^/]+?)(?:\.git)?$/)
      if (match) {
        web = `https://github.com/${match[1]}`
      }
    }

    let userName: string | undefined = undefined
    let userEmail: string | undefined = undefined
    let coreIgnoreCase: string | undefined = undefined
    let pullRebase: string | undefined = undefined
    let rerereEnabled: string | undefined = undefined

    const promises = [
      repository.getConfig('user.name'),
      repository.getConfig('user.email'),
      repository.getConfig('core.ignoreCase'),
      repository.getConfig('pull.rebase'),
      repository.getConfig('rerere.enabled'),

      repository.getGlobalConfig('user.name'),
      repository.getGlobalConfig('user.email'),
      repository.getGlobalConfig('core.ignoreCase'),
      repository.getGlobalConfig('pull.rebase'),
      repository.getGlobalConfig('rerere.enabled'),

      execAsync('git config --system --get core.ignoreCase')
        .then(({ stdout }) => stdout.trim())
        .catch(() => undefined),
      execAsync('git config --system --get pull.rebase')
        .then(({ stdout }) => stdout.trim())
        .catch(() => undefined),
      execAsync('git config --system --get rerere.enabled')
        .then(({ stdout }) => stdout.trim())
        .catch(() => undefined)
    ]

    try {
      const [
        name,
        email,
        ignoreCase,
        rebase,
        rerere,
        globalName,
        globalEmail,
        globalIgnoreCase,
        globalRebase,
        globalRerere,
        systemIgnoreCase,
        systemRebase,
        systemRerere
      ] = await Promise.all(promises)

      userName = name || globalName || NOT_CONFIGURED
      userEmail = email || globalEmail || NOT_CONFIGURED
      coreIgnoreCase = ignoreCase || globalIgnoreCase || systemIgnoreCase || NOT_CONFIGURED
      pullRebase = rebase || globalRebase || systemRebase || NOT_CONFIGURED
      rerereEnabled = rerere || globalRerere || systemRerere || NOT_CONFIGURED
    } catch (e) {
      // Silent failure
    }

    const getToggleIcon = (val: string | undefined) => {
      if (val?.toLowerCase() === 'true') return 'record'
      if (val?.toLowerCase() === 'false') return 'circle-large-outline'
      return 'gear'
    }

    const repoChildren = [
      new GitItem(
        'Remote',
        remote ?? UNKNOWN,
        'globe',
        vscode.TreeItemCollapsibleState.None,
        web ?? remote,
        remote
          ? {
              command: web ? 'vscode.open' : 'git-config-info.copyToClipboard',
              title: web ? 'Open in Browser' : 'Copy to clipboard',
              arguments: [web ?? remote]
            }
          : undefined
      ),
      new GitItem('Branch', branch, 'git-branch', vscode.TreeItemCollapsibleState.None)
    ]

    const identityChildren = [
      new GitItem('User', userName, 'account', vscode.TreeItemCollapsibleState.None, userName, {
        command: 'git-config-info.copyToClipboard',
        title: 'Copy to clipboard',
        arguments: [userName]
      }),
      new GitItem('Email', userEmail, 'mail', vscode.TreeItemCollapsibleState.None, userEmail, {
        command: 'git-config-info.copyToClipboard',
        title: 'Copy to clipboard',
        arguments: [userEmail]
      })
    ]

    const configChildren = [
      new GitItem(
        'IgnoreCase',
        coreIgnoreCase,
        getToggleIcon(coreIgnoreCase),
        vscode.TreeItemCollapsibleState.None,
        undefined,
        undefined,
        'core.ignoreCase'
      ),
      new GitItem(
        'Rebase',
        pullRebase,
        getToggleIcon(pullRebase),
        vscode.TreeItemCollapsibleState.None,
        undefined,
        undefined,
        'pull.rebase'
      ),
      new GitItem(
        'Rerere',
        rerereEnabled,
        getToggleIcon(rerereEnabled),
        vscode.TreeItemCollapsibleState.None,
        undefined,
        undefined,
        'rerere.enabled'
      )
    ]

    return [
      new GitItem(
        'Repository',
        undefined,
        'repo',
        vscode.TreeItemCollapsibleState.Expanded,
        undefined,
        undefined,
        undefined,
        repoChildren
      ),
      new GitItem(
        'Identity',
        undefined,
        'organization',
        vscode.TreeItemCollapsibleState.Expanded,
        undefined,
        undefined,
        undefined,
        identityChildren
      ),
      new GitItem(
        'Configuration',
        undefined,
        'settings-gear',
        vscode.TreeItemCollapsibleState.Expanded,
        undefined,
        undefined,
        undefined,
        configChildren
      )
    ]
  }
}
