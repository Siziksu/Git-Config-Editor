import * as vscode from 'vscode'
import { GitExtension, API } from './git'
import { Keys } from './constants'
import { execFileAsync } from './functions'

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

  constructor() {
    const gitExtension = vscode.extensions.getExtension<GitExtension>('vscode.git')?.exports
    if (gitExtension) {
      this._api = gitExtension.getAPI(1)
      this._api.onDidChangeState(() => this.refresh())
      this._api.onDidOpenRepository((repo) => {
        this.refresh()
        repo.state.onDidChange(() => this.refresh())
      })
      this._api.repositories.forEach((repo) => {
        repo.state.onDidChange(() => this.refresh())
      })
    }
  }

  public get state(): GitData {
    return this._state
  }

  async refresh() {
    if (!this._api) {
      this._onDidChangeData.fire({})
      return
    }
    const repository = this._api.repositories[0]
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
