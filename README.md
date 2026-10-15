# Git Config Info

A clean and intuitive Visual Studio Code extension that displays the current project's Git configuration details directly in your Activity Bar.

## Features

- 🌿 **Active Branch:** Displays the name of the branch you are currently working on. Click to copy it to your clipboard.
- 🔗 **Remote URL:** Shows the `origin` fetch URL. Click to open it directly in your web browser (supports automatic SSH to HTTPS conversion for GitHub/GitLab).
- 👤 **User Name:** Displays the local or global `user.name` configured for Git. Click to copy.
- ✉️ **User Email:** Displays the local or global `user.email` configured for Git. Click to copy.
- 🔄 **Live Reactivity & Manual Refresh:** Automatically updates whenever you switch branches or make changes, with a manual refresh button available in the view toolbar.

## Requirements

This extension relies on the built-in VS Code Git extension (`vscode.git`) to fetch repository states and local configs safely. Ensure Git is installed and initialized in your workspace.

## Extension Settings

This extension contributes the following settings/views:

- `gitDetailsView`: The sidebar view container where all the Git metadata is neatly listed.
- `git-config-info.refreshGitDetails`: A toolbar navigation command to force a manual refresh of the data.

## Known Issues

- If your workspace does not contain a valid Git repository, the sidebar will gracefully display a warning item instead of breaking.

## Release Notes

### 1.0.0

- Initial release of Git Config Info Sidebar.
- Added support for Branch, Remote URL, User Name, and User Email.
- Implemented clipboard copying and external browser linking capabilities.
- Integrated sidebar icons using native Codicons.
