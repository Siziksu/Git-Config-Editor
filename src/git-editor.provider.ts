import * as vscode from 'vscode'
import { Contexts, Icons, Keys, Options, Text } from './constants'
import { GitRepositoryService } from './git-repository.service'

class GitItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly description: string | undefined,
    public readonly icon: string | undefined,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly tooltip?: string,
    public readonly key?: string,
    public readonly context?: string,
    public readonly options?: string[],
    public readonly children?: GitItem[]
  ) {
    super(label, collapsibleState)
    if (icon) this.iconPath = new vscode.ThemeIcon(icon)
    if (key) this.contextValue = context
  }
}

export class GitEditorProvider implements vscode.TreeDataProvider<GitItem> {
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
      return [new GitItem('Warning', Text.GitNotAvailable, 'warning', vscode.TreeItemCollapsibleState.None)]
    }

    let localUserName: string | undefined = undefined
    let localUserEmail: string | undefined = undefined
    let localCoreIgnoreCase: string | undefined = undefined
    let localPullRebase: string | undefined = undefined
    let localRerereEnabled: string | undefined = undefined
    let localCoreAutoCrLf: string | undefined = undefined
    let localFetchPrune: string | undefined = undefined
    let globalUserName: string | undefined = undefined
    let globalUserEmail: string | undefined = undefined
    let globalCoreIgnoreCase: string | undefined = undefined
    let globalPullRebase: string | undefined = undefined
    let globalRerereEnabled: string | undefined = undefined
    let globalCoreAutoCrLf: string | undefined = undefined
    let globalFetchPrune: string | undefined = undefined

    try {
      localUserName = state.localUserName || Text.NotConfigured
      localUserEmail = state.localUserEmail || Text.NotConfigured
      localCoreIgnoreCase = state.localCoreIgnoreCase || Text.NotConfigured
      localPullRebase = state.localPullRebase || Text.NotConfigured
      localRerereEnabled = state.localRerereEnabled || Text.NotConfigured
      localCoreAutoCrLf = state.localCoreAutoCrLf || Text.NotConfigured
      localFetchPrune = state.localFetchPrune || Text.NotConfigured

      globalUserName = state.globalUserName || Text.NotConfigured
      globalUserEmail = state.globalUserEmail || Text.NotConfigured
      globalCoreIgnoreCase = state.globalCoreIgnoreCase || Text.NotConfigured
      globalPullRebase = state.globalPullRebase || Text.NotConfigured
      globalRerereEnabled = state.globalRerereEnabled || Text.NotConfigured
      globalCoreAutoCrLf = state.globalCoreAutoCrLf || Text.NotConfigured
      globalFetchPrune = state.globalFetchPrune || Text.NotConfigured
    } catch (e) {
      // Silent failure
    }

    const configLocalChildren = [
      new GitItem('User', localUserName, Icons.Account, vscode.TreeItemCollapsibleState.None, Keys.UserName, Keys.UserName, Contexts.Edit),
      new GitItem('Email', localUserEmail, Icons.Mail, vscode.TreeItemCollapsibleState.None, Keys.UserEmail, Keys.UserEmail, Contexts.Edit),
      new GitItem(
        'Ignore Case',
        localCoreIgnoreCase,
        Icons.Item,
        vscode.TreeItemCollapsibleState.None,
        Keys.CoreIgnoreCase,
        Keys.CoreIgnoreCase,
        Contexts.Toggle
      ),
      new GitItem(
        'Pull Rebase',
        localPullRebase,
        Icons.Item,
        vscode.TreeItemCollapsibleState.None,
        Keys.PullRebase,
        Keys.PullRebase,
        Contexts.Toggle
      ),
      new GitItem(
        'Rerere',
        localRerereEnabled,
        Icons.Item,
        vscode.TreeItemCollapsibleState.None,
        Keys.RerereEnabled,
        Keys.RerereEnabled,
        Contexts.Toggle
      ),
      new GitItem(
        'Auto CrLf',
        localCoreAutoCrLf,
        Icons.Item,
        vscode.TreeItemCollapsibleState.None,
        Keys.CoreAutoCrLf,
        Keys.CoreAutoCrLf,
        Contexts.Select,
        Options.CoreAutoCrLf
      ),
      new GitItem(
        'Fetch Prune',
        localFetchPrune,
        Icons.Item,
        vscode.TreeItemCollapsibleState.None,
        Keys.FetchPrune,
        Keys.FetchPrune,
        Contexts.Toggle
      )
    ]

    const configGlobalChildren = [
      new GitItem(
        'User',
        globalUserName,
        Icons.Account,
        vscode.TreeItemCollapsibleState.None,
        Keys.UserName,
        Keys.UserName,
        Contexts.EditGlobal
      ),
      new GitItem(
        'Email',
        globalUserEmail,
        Icons.Mail,
        vscode.TreeItemCollapsibleState.None,
        Keys.UserEmail,
        Keys.UserEmail,
        Contexts.EditGlobal
      ),
      new GitItem(
        'Ignore Case',
        globalCoreIgnoreCase,
        Icons.Item,
        vscode.TreeItemCollapsibleState.None,
        Keys.CoreIgnoreCase,
        Keys.CoreIgnoreCase,
        Contexts.ToggleGlobal
      ),
      new GitItem(
        'Pull Rebase',
        globalPullRebase,
        Icons.Item,
        vscode.TreeItemCollapsibleState.None,
        Keys.PullRebase,
        Keys.PullRebase,
        Contexts.ToggleGlobal
      ),
      new GitItem(
        'Rerere',
        globalRerereEnabled,
        Icons.Item,
        vscode.TreeItemCollapsibleState.None,
        Keys.RerereEnabled,
        Keys.RerereEnabled,
        Contexts.ToggleGlobal
      ),
      new GitItem(
        'Auto CrLf',
        globalCoreAutoCrLf,
        Icons.Item,
        vscode.TreeItemCollapsibleState.None,
        Keys.CoreAutoCrLf,
        Keys.CoreAutoCrLf,
        Contexts.SelectGlobal,
        Options.CoreAutoCrLf
      ),
      new GitItem(
        'Fetch Prune',
        globalFetchPrune,
        Icons.Item,
        vscode.TreeItemCollapsibleState.None,
        Keys.FetchPrune,
        Keys.FetchPrune,
        Contexts.ToggleGlobal
      )
    ]

    return [
      new GitItem(
        'Local',
        '.git/config',
        Icons.SettingsGear,
        vscode.TreeItemCollapsibleState.Expanded,
        undefined,
        undefined,
        undefined,
        undefined,
        configLocalChildren
      ),
      new GitItem(
        'Global',
        '~/.gitconfig',
        Icons.SettingsGear,
        vscode.TreeItemCollapsibleState.Expanded,
        undefined,
        undefined,
        undefined,
        undefined,
        configGlobalChildren
      )
    ]
  }
}
