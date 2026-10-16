import * as vscode from 'vscode'
import { GitExtension, API } from './git'
import { execFileAsync, Commands, Contexts, Icons, Keys, Options } from './constants'

const ValueUnknown = 'Unknown'
const ValueNotConfigured = 'Not configured'

class GitItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly description: string | undefined,
    public readonly icon: string | undefined,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly tooltip?: string,
    public readonly command?: vscode.Command,
    public readonly context?: string,
    public readonly key?: string,
    public readonly options?: string[],
    public readonly children?: GitItem[]
  ) {
    super(label, collapsibleState)
    this.description = description
    if (icon) this.iconPath = new vscode.ThemeIcon(icon)
    if (tooltip) this.tooltip = tooltip
    if (command) this.command = command
    if (key) this.contextValue = context
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

    let userNameValue: string | undefined = undefined
    let userEmailValue: string | undefined = undefined
    let coreIgnoreCaseValue: string | undefined = undefined
    let pullRebaseValue: string | undefined = undefined
    let rerereEnabledValue: string | undefined = undefined
    let coreAutoCrLfValue: string | undefined = undefined
    let fetchPruneValue: string | undefined = undefined

    const promises = [
      repository.getConfig(Keys.UserName),
      repository.getConfig(Keys.UserEmail),
      repository.getConfig(Keys.CoreIgnoreCase),
      repository.getConfig(Keys.PullRebase),
      repository.getConfig(Keys.RerereEnabled),
      repository.getConfig(Keys.CoreAutoCrLf),
      repository.getConfig(Keys.FetchPrune),

      repository.getGlobalConfig(Keys.UserName),
      repository.getGlobalConfig(Keys.UserEmail),
      repository.getGlobalConfig(Keys.CoreIgnoreCase),
      repository.getGlobalConfig(Keys.PullRebase),
      repository.getGlobalConfig(Keys.RerereEnabled),
      repository.getGlobalConfig(Keys.CoreAutoCrLf),
      repository.getGlobalConfig(Keys.FetchPrune),

      execFileAsync('git', ['config', '--system', '--get', Keys.CoreIgnoreCase])
        .then(({ stdout }) => stdout.trim())
        .catch(() => undefined),
      execFileAsync('git', ['config', '--system', '--get', Keys.PullRebase])
        .then(({ stdout }) => stdout.trim())
        .catch(() => undefined),
      execFileAsync('git', ['config', '--system', '--get', Keys.RerereEnabled])
        .then(({ stdout }) => stdout.trim())
        .catch(() => undefined),
      execFileAsync('git', ['config', '--system', '--get', Keys.CoreAutoCrLf])
        .then(({ stdout }) => stdout.trim())
        .catch(() => undefined),
      execFileAsync('git', ['config', '--system', '--get', Keys.FetchPrune])
        .then(({ stdout }) => stdout.trim())
        .catch(() => undefined)
    ]

    try {
      const [
        _name,
        _email,
        _coreIgnoreCase,
        _pullRebase,
        _rerereEnabled,
        _coreAutoCrLf,
        _fetchPrune,
        globalName,
        globalEmail,
        globalCoreIgnoreCase,
        globalPullRebase,
        globalRerereEnabled,
        globalAutoCrLf,
        globalFetchPrune,
        systemCoreIgnoreCase,
        systemPullRebase,
        systemRerereEnabled,
        systemAutoCrLf,
        systemFetchPrune
      ] = await Promise.all(promises)

      userNameValue = _name || globalName || ValueNotConfigured
      userEmailValue = _email || globalEmail || ValueNotConfigured
      coreIgnoreCaseValue = _coreIgnoreCase || globalCoreIgnoreCase || systemCoreIgnoreCase || ValueNotConfigured
      pullRebaseValue = _pullRebase || globalPullRebase || systemPullRebase || ValueNotConfigured
      rerereEnabledValue = _rerereEnabled || globalRerereEnabled || systemRerereEnabled || ValueNotConfigured
      coreAutoCrLfValue = _coreAutoCrLf || globalAutoCrLf || systemAutoCrLf || ValueNotConfigured
      fetchPruneValue = _fetchPrune || globalFetchPrune || systemFetchPrune || ValueNotConfigured
    } catch (e) {
      // Silent failure
    }

    const getToggleIcon = (val: string | undefined) => {
      if (val?.toLowerCase() === 'true') return Icons.Unselected
      if (val?.toLowerCase() === 'false') return Icons.Selected
      return Icons.Gear
    }

    const repoChildren = [
      new GitItem(
        'Remote',
        remote ?? ValueUnknown,
        Icons.Globe,
        vscode.TreeItemCollapsibleState.None,
        web ?? remote,
        remote
          ? {
              command: web ? Commands.OpenInBrowser.Command : Commands.CopyToClipboard.Command,
              title: web ? Commands.OpenInBrowser.Title : Commands.CopyToClipboard.Title,
              arguments: [web ?? remote]
            }
          : undefined
      ),
      new GitItem('Branch', branch, Icons.GitBranch, vscode.TreeItemCollapsibleState.None)
    ]

    const identityChildren = [
      new GitItem(
        'User',
        userNameValue,
        Icons.Account,
        vscode.TreeItemCollapsibleState.None,
        Commands.CopyToClipboard.Title,
        {
          command: Commands.CopyToClipboard.Command,
          title: Commands.CopyToClipboard.Title,
          arguments: [userNameValue]
        },
        Contexts.Edit,
        Keys.UserName
      ),
      new GitItem(
        'Email',
        userEmailValue,
        Icons.Mail,
        vscode.TreeItemCollapsibleState.None,
        Commands.CopyToClipboard.Title,
        {
          command: Commands.CopyToClipboard.Command,
          title: Commands.CopyToClipboard.Title,
          arguments: [userEmailValue]
        },
        Contexts.Edit,
        Keys.UserEmail
      )
    ]

    const configChildren = [
      new GitItem(
        'Ignore Case',
        coreIgnoreCaseValue,
        getToggleIcon(coreIgnoreCaseValue),
        vscode.TreeItemCollapsibleState.None,
        undefined,
        undefined,
        Contexts.Toggle,
        Keys.CoreIgnoreCase
      ),
      new GitItem(
        'Pull Rebase',
        pullRebaseValue,
        getToggleIcon(pullRebaseValue),
        vscode.TreeItemCollapsibleState.None,
        undefined,
        undefined,
        Contexts.Toggle,
        Keys.PullRebase
      ),
      new GitItem(
        'Rerere',
        rerereEnabledValue,
        getToggleIcon(rerereEnabledValue),
        vscode.TreeItemCollapsibleState.None,
        undefined,
        undefined,
        Contexts.Toggle,
        Keys.RerereEnabled
      ),
      new GitItem(
        'Auto CrLf',
        coreAutoCrLfValue,
        Icons.Gear,
        vscode.TreeItemCollapsibleState.None,
        undefined,
        undefined,
        Contexts.Select,
        Keys.CoreAutoCrLf,
        Options.CoreAutoCrLf
      ),
      new GitItem(
        'Fetch Prune',
        fetchPruneValue,
        getToggleIcon(fetchPruneValue),
        vscode.TreeItemCollapsibleState.None,
        undefined,
        undefined,
        Contexts.Toggle,
        Keys.FetchPrune
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
        undefined,
        undefined,
        identityChildren
      ),
      new GitItem(
        'Configuration',
        undefined,
        Icons.SettingsGear,
        vscode.TreeItemCollapsibleState.Expanded,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        configChildren
      )
    ]
  }
}
