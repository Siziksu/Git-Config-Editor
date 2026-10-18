import * as vscode from 'vscode'
import { openGitFileCommand, openGitFileGlobalCommand } from './functions'
import { Text } from './constants'

class GitItem extends vscode.TreeItem {
  constructor(
    public readonly icon: string | undefined,
    public readonly label: string,
    public readonly description: string | undefined,
    public readonly tooltip?: string,
    public readonly command?: vscode.Command
  ) {
    super(label, vscode.TreeItemCollapsibleState.None)
    if (icon) this.iconPath = new vscode.ThemeIcon(icon)
  }
}

export class GitFilesProvider implements vscode.TreeDataProvider<GitItem> {
  constructor() {}

  getTreeItem(element: GitItem): vscode.TreeItem {
    return element
  }

  async getChildren(element?: GitItem): Promise<GitItem[]> {
    if (element) {
      return []
    }

    return [
      new GitItem('file', 'Local file', Text.LocalGitFile, 'Open Git Local File', openGitFileCommand()),
      new GitItem('file', 'Global file', Text.GlobalGitFile, 'Open Git Global File', openGitFileGlobalCommand())
    ]
  }
}
