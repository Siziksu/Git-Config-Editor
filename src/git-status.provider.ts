import * as vscode from 'vscode'
import { Icons, Keys, Labels, Text } from './constants'
import { GitRepositoryService } from './git-repository.service'
import { copyToClipboardCommand, openInBrowserCommand } from './functions'

const None = vscode.TreeItemCollapsibleState.None
const Expanded = vscode.TreeItemCollapsibleState.Expanded

class GitItem extends vscode.TreeItem {
  constructor(
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly icon: string | undefined,
    public readonly label: string,
    public readonly description: string | undefined,
    public readonly tooltip?: string,
    public readonly command?: vscode.Command,
    public readonly children?: GitItem[]
  ) {
    super(label, collapsibleState)
    if (icon) this.iconPath = new vscode.ThemeIcon(icon)
  }
}

export class GitStatusProvider implements vscode.TreeDataProvider<GitItem> {
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

    let userName: string | undefined = undefined
    let userEmail: string | undefined = undefined
    let coreIgnoreCase: string | undefined = undefined
    let pullRebase: string | undefined = undefined
    let rerereEnabled: string | undefined = undefined
    let coreAutoCrLf: string | undefined = undefined
    let fetchPrune: string | undefined = undefined
    let branch: string | undefined = undefined
    let remote: string | undefined = undefined
    let url: string | undefined = undefined

    try {
      userName = state.localUserName || state.globalUserName || Text.NotConfigured
      userEmail = state.localUserEmail || state.globalUserEmail || Text.NotConfigured
      coreIgnoreCase = state.localCoreIgnoreCase || state.globalCoreIgnoreCase || state.systemCoreIgnoreCase || Text.NotConfigured
      pullRebase = state.localPullRebase || state.globalPullRebase || state.systemPullRebase || Text.NotConfigured
      rerereEnabled = state.localRerereEnabled || state.globalRerereEnabled || state.systemRerereEnabled || Text.NotConfigured
      coreAutoCrLf = state.localCoreAutoCrLf || state.globalCoreAutoCrLf || state.systemCoreAutoCrLf || Text.NotConfigured
      fetchPrune = state.localFetchPrune || state.globalFetchPrune || state.systemFetchPrune || Text.NotConfigured
      branch = state.branch || Text.NotConfigured
      remote = state.remote || Text.NotConfigured
      url = state.web
    } catch (e) {
      // Silent failure
    }

    const repositoryChildren = [
      new GitItem(None, Icons.Globe, Labels.Remote, remote, url ?? remote, url ? openInBrowserCommand([url]) : undefined),
      new GitItem(None, Icons.GitBranch, 'Branch', branch)
    ]

    const statusChildren = [
      new GitItem(None, Icons.Account, Labels.User, userName, Text.CopyToClipboard, copyToClipboardCommand(userName)),
      new GitItem(None, Icons.Mail, Labels.Email, userEmail, Text.CopyToClipboard, copyToClipboardCommand(userEmail)),
      new GitItem(None, Icons.Item, Labels.IgnoreCase, coreIgnoreCase, Keys.CoreIgnoreCase),
      new GitItem(None, Icons.Item, Labels.PullRebase, pullRebase, Keys.PullRebase),
      new GitItem(None, Icons.Item, Labels.Rerere, rerereEnabled, Keys.RerereEnabled),
      new GitItem(None, Icons.Item, Labels.AutoCrLf, coreAutoCrLf, Keys.CoreAutoCrLf),
      new GitItem(None, Icons.Item, Labels.FetchPrune, fetchPrune, Keys.FetchPrune)
    ]

    return [
      new GitItem(Expanded, Icons.Repo, Labels.Repository, undefined, undefined, undefined, repositoryChildren),
      new GitItem(Expanded, Icons.SettingsGear, Labels.Values, undefined, undefined, undefined, statusChildren)
    ]
  }
}
