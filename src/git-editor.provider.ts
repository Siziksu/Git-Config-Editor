import * as vscode from 'vscode'
import { Contexts, Icons, Keys, Options, ValueNotConfigured } from './constants'
import { GitRepositoryService } from './git-repository.service'

class GitItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly description: string | undefined,
    public readonly icon: string | undefined,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly context?: string,
    public readonly key?: string,
    public readonly options?: string[],
    public readonly children?: GitItem[]
  ) {
    super(label, collapsibleState)
    this.description = description
    if (icon) this.iconPath = new vscode.ThemeIcon(icon)
    if (key) this.contextValue = context
  }
}

const ERROR_ITEM = new GitItem('Warning', 'Git extension not available', 'warning', vscode.TreeItemCollapsibleState.None)

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
      return [ERROR_ITEM]
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
      localUserName = state.localUserName || ValueNotConfigured
      localUserEmail = state.localUserEmail || ValueNotConfigured
      localCoreIgnoreCase = state.localCoreIgnoreCase || ValueNotConfigured
      localPullRebase = state.localPullRebase || ValueNotConfigured
      localRerereEnabled = state.localRerereEnabled || ValueNotConfigured
      localCoreAutoCrLf = state.localCoreAutoCrLf || ValueNotConfigured
      localFetchPrune = state.localFetchPrune || ValueNotConfigured

      globalUserName = state.globalUserName || ValueNotConfigured
      globalUserEmail = state.globalUserEmail || ValueNotConfigured
      globalCoreIgnoreCase = state.globalCoreIgnoreCase || ValueNotConfigured
      globalPullRebase = state.globalPullRebase || ValueNotConfigured
      globalRerereEnabled = state.globalRerereEnabled || ValueNotConfigured
      globalCoreAutoCrLf = state.globalCoreAutoCrLf || ValueNotConfigured
      globalFetchPrune = state.globalFetchPrune || ValueNotConfigured
    } catch (e) {
      // Silent failure
    }

    const configLocalChildren = [
      new GitItem('User', localUserName, Icons.Account, vscode.TreeItemCollapsibleState.None, Contexts.Edit, Keys.UserName),
      new GitItem('Email', localUserEmail, Icons.Mail, vscode.TreeItemCollapsibleState.None, Contexts.Edit, Keys.UserEmail),
      new GitItem(
        'Ignore Case',
        localCoreIgnoreCase,
        Icons.Item,
        vscode.TreeItemCollapsibleState.None,
        Contexts.Toggle,
        Keys.CoreIgnoreCase
      ),
      new GitItem('Pull Rebase', localPullRebase, Icons.Item, vscode.TreeItemCollapsibleState.None, Contexts.Toggle, Keys.PullRebase),
      new GitItem('Rerere', localRerereEnabled, Icons.Item, vscode.TreeItemCollapsibleState.None, Contexts.Toggle, Keys.RerereEnabled),
      new GitItem(
        'Auto CrLf',
        localCoreAutoCrLf,
        Icons.Item,
        vscode.TreeItemCollapsibleState.None,
        Contexts.Select,
        Keys.CoreAutoCrLf,
        Options.CoreAutoCrLf
      ),
      new GitItem('Fetch Prune', localFetchPrune, Icons.Item, vscode.TreeItemCollapsibleState.None, Contexts.Toggle, Keys.FetchPrune)
    ]

    const configGlobalChildren = [
      new GitItem('User', globalUserName, Icons.Account, vscode.TreeItemCollapsibleState.None, Contexts.EditGlobal, Keys.UserName),
      new GitItem('Email', globalUserEmail, Icons.Mail, vscode.TreeItemCollapsibleState.None, Contexts.EditGlobal, Keys.UserEmail),
      new GitItem(
        'Ignore Case',
        globalCoreIgnoreCase,
        Icons.Item,
        vscode.TreeItemCollapsibleState.None,
        Contexts.ToggleGlobal,
        Keys.CoreIgnoreCase
      ),
      new GitItem(
        'Pull Rebase',
        globalPullRebase,
        Icons.Item,
        vscode.TreeItemCollapsibleState.None,
        Contexts.ToggleGlobal,
        Keys.PullRebase
      ),
      new GitItem(
        'Rerere',
        globalRerereEnabled,
        Icons.Item,
        vscode.TreeItemCollapsibleState.None,
        Contexts.ToggleGlobal,
        Keys.RerereEnabled
      ),
      new GitItem(
        'Auto CrLf',
        globalCoreAutoCrLf,
        Icons.Item,
        vscode.TreeItemCollapsibleState.None,
        Contexts.SelectGlobal,
        Keys.CoreAutoCrLf,
        Options.CoreAutoCrLf
      ),
      new GitItem('Fetch Prune', globalFetchPrune, Icons.Item, vscode.TreeItemCollapsibleState.None, Contexts.ToggleGlobal, Keys.FetchPrune)
    ]

    return [
      new GitItem(
        'Local Git',
        undefined,
        Icons.SettingsGear,
        vscode.TreeItemCollapsibleState.Expanded,
        undefined,
        undefined,
        undefined,
        configLocalChildren
      ),
      new GitItem(
        'Global Git',
        undefined,
        Icons.SettingsGear,
        vscode.TreeItemCollapsibleState.Expanded,
        undefined,
        undefined,
        undefined,
        configGlobalChildren
      )
    ]
  }
}
