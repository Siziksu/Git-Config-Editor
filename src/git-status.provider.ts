import * as vscode from 'vscode'
import { Icons, Keys, ValueNotConfigured } from './constants'
import { GitRepositoryService } from './git-repository.service'
import { commandOpenInBrowser } from './functions'

class GitItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly description: string | undefined,
    public readonly icon: string | undefined,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly tooltip?: string,
    public readonly command?: vscode.Command,
    public readonly children?: GitItem[]
  ) {
    super(label, collapsibleState)
    if (icon) this.iconPath = new vscode.ThemeIcon(icon)
  }
}

const ERROR_ITEM = new GitItem('Warning', 'Git extension not available', 'warning', vscode.TreeItemCollapsibleState.None)

export class GitStatusProvider implements vscode.TreeDataProvider<GitItem> {
  constructor(private service: GitRepositoryService) {
    this.service.onDidChangeData(() => this._onDidChangeTreeData.fire())
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
    if (element) {
      return element.children ?? []
    }

    const state = this.service.state
    if (Object.keys(state).length === 0) {
      return []
    }

    let userName: string | undefined = undefined
    let userEmail: string | undefined = undefined
    let coreIgnoreCase: string | undefined = undefined
    let pullRebase: string | undefined = undefined
    let rerereEnabled: string | undefined = undefined
    let coreAutoCrLf: string | undefined = undefined
    let fetchPrune: string | undefined = undefined
    let branch: string | undefined = undefined
    let remote: string | undefined = undefined
    let web: string | undefined = undefined

    try {
      userName = state.localUserName || state.globalUserName || ValueNotConfigured
      userEmail = state.localUserEmail || state.globalUserEmail || ValueNotConfigured
      coreIgnoreCase = state.localCoreIgnoreCase || state.globalCoreIgnoreCase || state.systemCoreIgnoreCase || ValueNotConfigured
      pullRebase = state.localPullRebase || state.globalPullRebase || state.systemPullRebase || ValueNotConfigured
      rerereEnabled = state.localRerereEnabled || state.globalRerereEnabled || state.systemRerereEnabled || ValueNotConfigured
      coreAutoCrLf = state.localCoreAutoCrLf || state.globalCoreAutoCrLf || state.systemCoreAutoCrLf || ValueNotConfigured
      fetchPrune = state.localFetchPrune || state.globalFetchPrune || state.systemFetchPrune || ValueNotConfigured
      branch = state.branch || ValueNotConfigured
      remote = state.remote || ValueNotConfigured
      web = state.web || ValueNotConfigured
    } catch (e) {
      // Silent failure
    }

    const repoChildren = [
      new GitItem(
        'Remote',
        remote,
        Icons.Globe,
        vscode.TreeItemCollapsibleState.None,
        web ?? remote,
        web ? commandOpenInBrowser([web]) : undefined
      ),
      new GitItem('Branch', branch, Icons.GitBranch, vscode.TreeItemCollapsibleState.None)
    ]

    const configChildren = [
      new GitItem('User', userName, Icons.Account, vscode.TreeItemCollapsibleState.None, Keys.UserName),
      new GitItem('Email', userEmail, Icons.Mail, vscode.TreeItemCollapsibleState.None, Keys.UserEmail),
      new GitItem('Ignore Case', coreIgnoreCase, Icons.Item, vscode.TreeItemCollapsibleState.None, Keys.CoreIgnoreCase),
      new GitItem('Pull Rebase', pullRebase, Icons.Item, vscode.TreeItemCollapsibleState.None, Keys.PullRebase),
      new GitItem('Rerere', rerereEnabled, Icons.Item, vscode.TreeItemCollapsibleState.None, Keys.RerereEnabled),
      new GitItem('Auto CrLf', coreAutoCrLf, Icons.Item, vscode.TreeItemCollapsibleState.None, Keys.CoreAutoCrLf),
      new GitItem('Fetch Prune', fetchPrune, Icons.Item, vscode.TreeItemCollapsibleState.None, Keys.FetchPrune)
    ]

    return [
      new GitItem('Repository', undefined, 'repo', vscode.TreeItemCollapsibleState.Expanded, undefined, undefined, repoChildren),
      new GitItem('Values', undefined, Icons.SettingsGear, vscode.TreeItemCollapsibleState.Expanded, undefined, undefined, configChildren)
    ]
  }
}
