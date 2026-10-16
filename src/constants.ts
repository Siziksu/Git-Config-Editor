import { execFile } from 'child_process'
import { promisify } from 'util'

export const execFileAsync = promisify(execFile)

export const Commands = {
  CopyToClipboard: {
    Command: 'git-config-info.copyToClipboard',
    Title: 'Copy to Clipboard'
  },
  Edit: {
    Command: 'git-config-info.editCommand',
    Title: 'Edit Text'
  },
  Toggle: {
    Command: 'git-config-info.toggleCommand',
    Title: 'Toggle Option'
  },
  Select: {
    Command: 'git-config-info.selectCommand',
    Title: 'Select Option'
  },
  openGitFileCommand: {
    Command: 'git-config-info.openGitFileCommand',
    Title: 'Open Git Config File'
  },
  Refresh: {
    Command: 'git-config-info.refreshViewCommand',
    Title: 'Refresh View'
  },
  OpenInBrowser: {
    Command: 'vscode.open',
    Title: 'Open in Browser'
  }
}

export const Options = {
  CoreAutoCrLf: ['input', 'true', 'false']
}

export const Keys = {
  UserName: 'user.name',
  UserEmail: 'user.email',
  CoreIgnoreCase: 'core.ignoreCase',
  PullRebase: 'pull.rebase',
  RerereEnabled: 'rerere.enabled',
  CoreAutoCrLf: 'core.autocrlf',
  FetchPrune: 'fetch.prune'
}

export const Icons = {
  Account: 'account',
  Mail: 'mail',
  Globe: 'globe',
  Unselected: 'record',
  Selected: 'circle-large-outline',
  Gear: 'gear',
  SettingsGear: 'settings-gear',
  GitBranch: 'git-branch'
}

export const Contexts = {
  Toggle: 'ViewItemContextToggle',
  Select: 'ViewItemContextSelect',
  Edit: 'ViewItemContextEdit'
}
