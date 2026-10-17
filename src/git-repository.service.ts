import * as vscode from 'vscode'
import { GitExtension, API, Repository } from './git'
import { Keys } from './constants'
import { execFileAsync } from './functions'
import { join } from 'path'

export interface GitData {
  remote?: string
  branch?: string
  web?: string
  localUserName?: string
  localUserEmail?: string
  localCoreIgnoreCase?: string
  localPullRebase?: string
  localRerereEnabled?: string
  localCoreAutoCrLf?: string
  localFetchPrune?: string
  globalUserName?: string
  globalUserEmail?: string
  globalCoreIgnoreCase?: string
  globalPullRebase?: string
  globalRerereEnabled?: string
  globalCoreAutoCrLf?: string
  globalFetchPrune?: string
  systemCoreIgnoreCase?: string
  systemPullRebase?: string
  systemRerereEnabled?: string
  systemCoreAutoCrLf?: string
  systemFetchPrune?: string
}

export class GitRepositoryService {
  private _api: API | null = null
  private _state: GitData = {}

  private _onDidChangeData = new vscode.EventEmitter<GitData>()
  public readonly onDidChangeData = this._onDidChangeData.event

  private _repoDisposables = new Map<string, vscode.Disposable[]>()

  constructor(context: vscode.ExtensionContext) {
    this.init(context)
  }

  private async init(context: vscode.ExtensionContext) {
    const gitExtension = vscode.extensions.getExtension<GitExtension>('vscode.git')
    if (!gitExtension) return

    const exports = await gitExtension.activate()

    this._api = exports.getAPI(1)

    context.subscriptions.push(
      this._api.onDidOpenRepository((repo) => {
        this.setupRepositoryListeners(context, repo)
        this.refresh()
      }),
      this._api.onDidCloseRepository((repo) => {
        this.disposeRepository(repo)
        this.clear()
      }),
      this._api.onDidChangeState(() => {
        this.refresh()
      }),
      new vscode.Disposable(() => {
        this._repoDisposables.forEach((arr) => arr.forEach((d) => d.dispose()))
        this._repoDisposables.clear()
      })
    )

    this._api.repositories.forEach((repo) => {
      this.setupRepositoryListeners(context, repo)
    })

    this.refresh()
  }

  private setupRepositoryListenersOnly(repo: Repository) {
    const repoPath = repo.rootUri.fsPath
    if (this._repoDisposables.has(repoPath)) return
    const disposable = repo.state.onDidChange(() => this.refresh())
    this._repoDisposables.set(repoPath, [disposable])
  }

  private disposeRepositoryOnly(repo: Repository) {
    const repoPath = repo.rootUri.fsPath
    const disposables = this._repoDisposables.get(repoPath)
    if (disposables) {
      disposables.forEach((d) => d.dispose())
      this._repoDisposables.delete(repoPath)
    }
  }

  private setupRepositoryListeners(context: vscode.ExtensionContext, repo: Repository) {
    this.setupRepositoryListenersOnly(repo)
    const repoPath = repo.rootUri.fsPath

    const watcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(repo.rootUri, '.git'))

    watcher.onDidCreate(async () => {
      if (this._api) {
        await vscode.commands.executeCommand('git.refresh')
        const repoUpdated = this._api.repositories.find((r) => r.rootUri.fsPath === repoPath)
        if (repoUpdated) {
          this.setupRepositoryListenersOnly(repoUpdated)
        }
      }
      this.refresh()
    })

    watcher.onDidDelete(() => {
      this.disposeRepositoryOnly(repo)
      this.clear()
    })

    context.subscriptions.push(watcher)
  }

  private disposeRepository(repo: Repository) {
    this.disposeRepositoryOnly(repo)
    if (this._repoDisposables.size === 0) {
      this.clear()
    }
  }

  private clear() {
    this._state = {}
    this._onDidChangeData.fire({})
  }

  public get state(): GitData {
    return this._state
  }

  public async refresh() {
    const workspaceFolders = vscode.workspace.workspaceFolders
    if (!workspaceFolders) {
      this.clear()
      return
    }
    try {
      await vscode.workspace.fs.stat(vscode.Uri.file(join(workspaceFolders[0].uri.fsPath, '.git')))
    } catch {
      this.clear()
      return
    }

    if (!this._api) {
      this.clear()
      return
    }

    const repository: Repository | undefined = this._api.repositories[0]
    if (!repository) {
      this._state = {}
      this._onDidChangeData.fire({})
      return
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

    try {
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
      const output = await Promise.all(promises)

      this._state = {
        remote,
        branch,
        web,
        localUserName: output[0]?.trim(),
        localUserEmail: output[1]?.trim(),
        localCoreIgnoreCase: output[2]?.trim(),
        localPullRebase: output[3]?.trim(),
        localRerereEnabled: output[4]?.trim(),
        localCoreAutoCrLf: output[5]?.trim(),
        localFetchPrune: output[6]?.trim(),
        globalUserName: output[7]?.trim(),
        globalUserEmail: output[8]?.trim(),
        globalCoreIgnoreCase: output[9]?.trim(),
        globalPullRebase: output[10]?.trim(),
        globalRerereEnabled: output[11]?.trim(),
        globalCoreAutoCrLf: output[12]?.trim(),
        globalFetchPrune: output[13]?.trim(),
        systemCoreIgnoreCase: output[14]?.trim(),
        systemPullRebase: output[15]?.trim(),
        systemRerereEnabled: output[16]?.trim(),
        systemCoreAutoCrLf: output[17]?.trim(),
        systemFetchPrune: output[18]?.trim()
      }

      this._onDidChangeData.fire(this._state)
    } catch (error) {
      vscode.window.showErrorMessage(`Error reading Git: ${(error as Error).message}`)
    }
  }
}
