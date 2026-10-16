# Git Editor

A clean and intuitive Visual Studio Code extension to displays and edit the current project's Git configuration details in the Activity Bar. Also can open to edit the file directly.

## Features

- **Hierarchical Collapsible Views:** 3 clean, expandable categories (`Repository`, `Identity`, and `Configuration`) to improve visual structure and clean clutter.
- **Repository group**: `Remote URL` and `Active Branch`, displaying the name of the branch you are currently working on, and the `origin` fetch URL. Click to open it directly in your web browser (supports automatic SSH to HTTPS conversion for GitHub/GitLab).
- **Identity group**: Displays the `user.name` and `user.email` configured for the projet. Click to copy.
- **Configuration group**: Inline interactive configuration toggles (switch-like behavior) for:
  - `pull.rebase`
  - `core.gnoreCase`
  - `rerere.enabled`
  - `core.autocrlf`
  - `fetch.prune`
- **Live Reactivity & Manual Refresh:** Automatically updates whenever you switch branches or make changes. Also has a manual refresh button available in the view toolbar.

## Requirements

This extension relies on the built-in VS Code Git extension (`vscode.git`) to fetch repository states and local configs safely.

## Extension Settings

This extension contributes the following settings/views:

- `Git Details View`: The sidebar view container where all the Git metadata is neatly listed.
- `Refresh Git Details`: A toolbar command to force a manual refresh of the data.
- `Oen Git Config File`: A toolbar command to open the project's Git config file.

## Known Issues

## Release Notes

### 1.3.0

- Now it is possible to edit `user.name`and `user.email`.
- Added `core.autocrlf` and `fetch.prune` to the **Configuration group**.
- Options like `core.autocrlf` now can be edit using a dropdown.

### 1.2.0

- New name to align it with the program's new features.
- New toolbar command to open the project's Git config file in the current workspace.
- New icon for the extension.

### 1.1.1

- **Fixed Initialization Race Condition:** Solved an issue where the active branch name appeared empty or failed to load when VS Code opened directly into the extension view before the built-in Git extension finished indexing the workspace.
- **Brand New Extension Icon:** Refreshed the extension's visual identity with a brand new, cleaner, and modern custom icon for the VS Code Marketplace.

### 1.1.0

- **Hierarchical Collapsible Views:** Reorganized the entire sidebar into 3 clean, expandable categories (`Repository`, `Identity`, and `Configuration`) to improve visual structure and clean clutter.
- **Interactive Configuration Toggles:** Added inline switch-like behavior for `pull.rebase`, `core.gnoreCase`, and `rerere.enabled` inside the new Configuration group.
- **Inline Row Actions:** Added hover button interactions to execute `git config` modifiers instantly without leaving the panel.
- **Dynamic Codicons:** Implemented visual checkbox indicators reflecting real-time Git status changes.

### 1.0.1

- Added a custom extension icon.
- **Rebase:** Displays the local or global `pull.rebase` configured for Git.
- **Rerere:** Displays the local or global `rerere.enabled` configured for Git.
- **IgnoreCase:** Displays the local or global `core.ignorecase` configured for Git.

### 1.0.0

- Initial release of Git Config Info Sidebar.
- Added support for Branch, Remote URL, User Name, and User Email.
- Implemented clipboard copying and external browser linking capabilities.
- Integrated sidebar icons using native Codicons.
