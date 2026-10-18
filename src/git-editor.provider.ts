import * as vscode from 'vscode'
import { Contexts, Icons, Keys, Labels, Options, Text } from './constants'
import { GitRepositoryService } from './git-repository.service'

const None = vscode.TreeItemCollapsibleState.None
const Expanded = vscode.TreeItemCollapsibleState.Expanded

class GitItem extends vscode.TreeItem {
  constructor(
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly icon: string | undefined,
    public readonly label: string,
    public readonly description: string | undefined,
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
  private _onDidChangeTreeData: vscode.EventEmitter<GitItem | undefined | null | void> = new vscode.EventEmitter<
    GitItem | undefined | null | void
  >()
  readonly onDidChangeTreeData: vscode.Event<GitItem | undefined | null | void> = this._onDidChangeTreeData.event

  constructor(
    context: vscode.ExtensionContext,
    private service: GitRepositoryService
  ) {
    context.subscriptions.push(
      this.service.onDidChangeData(() => {
        this.refresh()
      }),
      this._onDidChangeTreeData
    )
  }

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
      return [new GitItem(None, Icons.Warning, Labels.Warning, Text.GitNotAvailable)]
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
      new GitItem(None, Icons.Account, Labels.User, localUserName, Keys.UserName, Keys.UserName, Contexts.Edit),
      new GitItem(None, Icons.Mail, Labels.Email, localUserEmail, Keys.UserEmail, Keys.UserEmail, Contexts.Edit),
      new GitItem(None, Icons.Item, Labels.IgnoreCase, localCoreIgnoreCase, Keys.CoreIgnoreCase, Keys.CoreIgnoreCase, Contexts.Toggle),
      new GitItem(None, Icons.Item, Labels.PullRebase, localPullRebase, Keys.PullRebase, Keys.PullRebase, Contexts.Toggle),
      new GitItem(None, Icons.Item, Labels.Rerere, localRerereEnabled, Keys.RerereEnabled, Keys.RerereEnabled, Contexts.Toggle),
      new GitItem(
        None,
        Icons.Item,
        Labels.AutoCrLf,
        localCoreAutoCrLf,
        Keys.CoreAutoCrLf,
        Keys.CoreAutoCrLf,
        Contexts.Select,
        Options.CoreAutoCrLf
      ),
      new GitItem(None, Icons.Item, Labels.FetchPrune, localFetchPrune, Keys.FetchPrune, Keys.FetchPrune, Contexts.Toggle)
    ]

    const configGlobalChildren = [
      new GitItem(None, Icons.Account, Labels.User, globalUserName, Keys.UserName, Keys.UserName, Contexts.EditGlobal),
      new GitItem(None, Icons.Mail, Labels.Email, globalUserEmail, Keys.UserEmail, Keys.UserEmail, Contexts.EditGlobal),
      new GitItem(
        None,
        Icons.Item,
        Labels.IgnoreCase,
        globalCoreIgnoreCase,
        Keys.CoreIgnoreCase,
        Keys.CoreIgnoreCase,
        Contexts.ToggleGlobal
      ),
      new GitItem(None, Icons.Item, Labels.PullRebase, globalPullRebase, Keys.PullRebase, Keys.PullRebase, Contexts.ToggleGlobal),
      new GitItem(None, Icons.Item, Labels.Rerere, globalRerereEnabled, Keys.RerereEnabled, Keys.RerereEnabled, Contexts.ToggleGlobal),
      new GitItem(
        None,
        Icons.Item,
        Labels.AutoCrLf,
        globalCoreAutoCrLf,
        Keys.CoreAutoCrLf,
        Keys.CoreAutoCrLf,
        Contexts.SelectGlobal,
        Options.CoreAutoCrLf
      ),
      new GitItem(None, Icons.Item, Labels.FetchPrune, globalFetchPrune, Keys.FetchPrune, Keys.FetchPrune, Contexts.ToggleGlobal)
    ]

    return [
      new GitItem(
        Expanded,
        Icons.SettingsGear,
        Labels.Local,
        Text.LocalGitFile,
        undefined,
        undefined,
        undefined,
        undefined,
        configLocalChildren
      ),
      new GitItem(
        Expanded,
        Icons.SettingsGear,
        Labels.Global,
        Text.GlobalGitFile,
        undefined,
        undefined,
        undefined,
        undefined,
        configGlobalChildren
      )
    ]
  }
}
