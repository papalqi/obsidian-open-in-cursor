# Open in Cursor

A simple Obsidian plugin that bridges Obsidian with Cursor editor, allowing you to quickly open and edit your notes in Cursor.

[中文文档](./README.zh.md)

## Features

- 🚀 Open current note in Cursor with one click
- 💡 Smart window management (tracks window process ID)
- 🎯 Command palette support
- 📝 Status bar button for quick access

## Installation

### From Obsidian Community Plugins

1. Open Obsidian Settings
2. Go to `Community Plugins`
3. Disable `Safe Mode`
4. Click `Browse` and search for "Open in Cursor"
5. Click Install
6. Enable the plugin

### Manual Installation

1. Download the latest release
2. Extract and copy `main.js` and `manifest.json` to your vault's `.obsidian/plugins/open-in-cursor/` directory
3. Restart Obsidian
4. Enable the plugin in Settings

## Usage

### First-time Setup

1. Find "Open in Cursor" in Obsidian Settings
2. Set the Cursor executable path (e.g., `C:\Users\username\AppData\Local\Programs\Cursor\Cursor.exe`)

### How to Use

There are two ways to open the current note in Cursor:

1. Click the "Open in Cursor" button in the status bar
2. Execute "Open current file in Cursor" from the command palette (`Ctrl/Cmd + P`)

### Window Management

- A new Cursor window will open on first use
- Subsequent operations will open files in the initially opened window
- If you need to use a new window, click the "Reset" button in plugin settings

## FAQ

1. **Can't find Cursor?**
   - Make sure Cursor editor is installed
   - Configure the correct Cursor executable path in plugin settings

2. **Opens new window every time?**
   - Check if you accidentally closed the initially opened Cursor window
   - Click the "Reset" button in settings to restart window management

3. **Keyboard shortcut conflict?**
   - You can customize the shortcut in Obsidian's hotkey settings

## Contributing

Issues and Pull Requests are welcome!

## License

MIT License 