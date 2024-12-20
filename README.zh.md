# Open in Cursor

一个简单的 Obsidian 插件，让你能够快速在 [Cursor](https://cursor.sh/) 编辑器中打开当前的笔记文件。

## 功能特点

- 🚀 一键在 Cursor 中打开当前笔记
- 💡 智能窗口管理（自动复用已打开的 Cursor 窗口）
- ⌨️ 支持快捷键（默认为 `Ctrl/Cmd + Shift + C`）
- 🎯 支持命令面板操作
- 📝 底部状态栏快捷按钮

## 安装方法

### 从 Obsidian 社区插件市场安装

1. 打开 Obsidian 设置
2. 进入 `社区插件`
3. 关闭 `安全模式`
4. 点击 `浏览` 并搜索 "Open in Cursor"
5. 点击安装
6. 启用插件

### 手动安装

1. 下载最新的 release
2. 解压后将 `main.js` 和 `manifest.json` 复制到你的 vault 目录下的 `.obsidian/plugins/open-in-cursor/` 文件夹中
3. 重启 Obsidian
4. 在设置中启用插件

## 使用方法

### 首次使用配置

1. 在 Obsidian 设置中找到 "Open in Cursor"
2. 设置 Cursor 可执行文件路径（例如：`C:\Users\username\AppData\Local\Programs\Cursor\Cursor.exe`）

### 使用方式

有三种方式可以在 Cursor 中打开当前笔记：

1. 点击底部状态栏的 "Open in Cursor" 按钮
2. 使用快捷键 `Ctrl/Cmd + Shift + C`
3. 通过命令面板（`Ctrl/Cmd + P`）执行 "在 Cursor 中打开当前文件" 命令

### 窗口管理

- 首次使用时会打开新的 Cursor 窗口
- 之后的操作都会在首次打开的窗口中打开文件
- 如果需要重新使用新窗口，可以在插件设置中点击"重置"按钮

## 常见问题

1. **找不到 Cursor？**
   - 确保已经安装了 Cursor 编辑器
   - 在插件设置中正确配置 Cursor 可执行文件路径

2. **每次都打开新窗口？**
   - 检查是否意外关闭了首次打开的 Cursor 窗口
   - 可以在设置中点击"重置"按钮，重新开始窗口管理

3. **快捷键冲突？**
   - 可以在 Obsidian 的快捷键设置中自定义新的快捷键

## 贡献指南

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License 