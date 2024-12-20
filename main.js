'use strict';

var obsidian = require('obsidian');
var child_process = require('child_process');
var path = require('path');

function _interopNamespace(e) {
    if (e && e.__esModule) return e;
    var n = Object.create(null);
    if (e) {
        Object.keys(e).forEach(function (k) {
            if (k !== 'default') {
                var d = Object.getOwnPropertyDescriptor(e, k);
                Object.defineProperty(n, k, d.get ? d : {
                    enumerable: true,
                    get: function () { return e[k]; }
                });
            }
        });
    }
    n["default"] = e;
    return Object.freeze(n);
}

var path__namespace = /*#__PURE__*/_interopNamespace(path);

/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

class OpenInCursorSettings {
    constructor() {
        this.cursorPath = '';
        this.isFirstOpen = true;
        this.cursorPid = null;
    }
}

class OpenInCursorSettingTab extends obsidian.PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display() {
        const {containerEl} = this;
        containerEl.empty();
        containerEl.createEl('h2', {text: 'Open in Cursor Settings'});

        new obsidian.Setting(containerEl)
            .setName('Cursor 可执行文件路径')
            .setDesc('设置 Cursor 编辑器的可执行文件路径（例如：C:\\Users\\username\\AppData\\Local\\Programs\\Cursor\\Cursor.exe）')
            .addText(text => text
                .setPlaceholder('输入 Cursor 可执行文件的完整路径')
                .setValue(this.plugin.settings.cursorPath)
                .onChange(async (value) => {
                    this.plugin.settings.cursorPath = value;
                    await this.plugin.saveSettings();
                }));

        new obsidian.Setting(containerEl)
            .setName('重置 Cursor 窗口')
            .setDesc('重置 Cursor 窗口状态，下次打开时将使用新窗口')
            .addButton(button => button
                .setButtonText('重置')
                .onClick(async () => {
                    this.plugin.settings.isFirstOpen = true;
                    this.plugin.settings.cursorPid = null;
                    await this.plugin.saveSettings();
                    new obsidian.Notice('Cursor 窗口状态已重置');
                }));
    }
}

class OpenInCursorPlugin extends obsidian.Plugin {
    async onload() {
        await this.loadSettings();
        
        console.log('OpenInCursor plugin is loading...');
        
        // 添加命令
        this.addCommand({
            id: 'open-in-cursor',
            name: '在 Cursor 中打开当前文件',
            callback: () => {
                const activeFile = this.app.workspace.getActiveFile();
                if (activeFile) {
                    console.log('Opening active file in Cursor:', activeFile.path);
                    this.openInVSCode([activeFile.path]);
                } else {
                    new obsidian.Notice('No active file');
                }
            },
            hotkeys: [
                {
                    modifiers: ["Mod", "Shift"],
                    key: "c"
                }
            ]
        });
        
        // 创建底部状态栏按钮
        const statusBarItem = this.addStatusBarItem();
        const statusBarButton = statusBarItem.createEl('span', {
            text: 'Open in Cursor',
            cls: 'cursor-bridge-status-button',
            attr: {
                style: 'cursor: pointer; padding: 0 8px; border-radius: 4px; margin: 0 4px;'
            }
        });

        // 添加鼠标悬停效果
        statusBarButton.addEventListener('mouseenter', () => {
            statusBarButton.style.backgroundColor = 'var(--interactive-accent)';
            statusBarButton.style.color = 'var(--text-on-accent)';
        });
        statusBarButton.addEventListener('mouseleave', () => {
            statusBarButton.style.backgroundColor = '';
            statusBarButton.style.color = '';
        });

        statusBarButton.addEventListener('click', () => {
            // 直接调用命令的回调函数
            this.app.commands.executeCommandById('cursor-bridge:open-in-cursor');
        });

        this.addSettingTab(new OpenInCursorSettingTab(this.app, this));
        console.log('OpenInCursor plugin loaded successfully');
    }

    async loadSettings() {
        this.settings = Object.assign(new OpenInCursorSettings(), await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    openInVSCode(paths) {
        return __awaiter(this, void 0, void 0, function* () {
            const cursorPath = this.settings.cursorPath || 'cursor';
            
            // 首先检查是否有已保存的 Cursor 进程
            if (this.settings.cursorPid) {
                try {
                    // 检查进程是否还在运行
                    const checkCommand = process.platform === 'win32' 
                        ? `tasklist /FI "PID eq ${this.settings.cursorPid}" /NH`
                        : `ps -p ${this.settings.cursorPid} -o pid=`;
                    
                    child_process.exec(checkCommand, (error, stdout) => {
                        if (error || !stdout.includes(String(this.settings.cursorPid))) {
                            // 进程不存在，重置状态
                            console.log('Saved Cursor process not found, resetting state');
                            this.settings.isFirstOpen = true;
                            this.settings.cursorPid = null;
                            this.saveSettings();
                        }
                    });
                } catch (e) {
                    console.error('Error checking Cursor process:', e);
                }
            }

            // Get vault path using FileSystemAdapter
            const adapter = this.app.vault.adapter;
            const vaultPath = adapter instanceof obsidian.FileSystemAdapter ? adapter.getBasePath() : '';
            if (!vaultPath) {
                new obsidian.Notice('Unable to get vault path');
                return;
            }
            const convertPath = (p) => path__namespace.join(vaultPath, p);
            const directories = paths.filter(p => this.app.vault.getAbstractFileByPath(p) instanceof obsidian.TFolder);
            const files = paths.filter(p => this.app.vault.getAbstractFileByPath(p) instanceof obsidian.TFile);

            // 根据是否是第一次打开决定是否使用新窗口
            const useNewWindow = this.settings.isFirstOpen;
            const windowFlag = useNewWindow ? '--new-window' : '';

            if (directories.length > 0) {
                const fullPath = convertPath(directories[0]);
                const command = `"${cursorPath}" ${windowFlag} "${fullPath}"`;
                const childProcess = child_process.exec(command, (error, stdout, stderr) => {
                    if (error) {
                        new obsidian.Notice('Failed to open in Cursor');
                        return;
                    }
                    if (stderr) {
                        console.error(`stderr: ${stderr}`);
                    }
                    if (stdout) {
                        console.log(`stdout: ${stdout}`);
                    }
                    if (this.settings.isFirstOpen) {
                        this.settings.isFirstOpen = false;
                        this.settings.cursorPid = childProcess.pid;
                        this.saveSettings();
                        console.log('Saved Cursor PID:', childProcess.pid);
                    }
                    new obsidian.Notice('Directory opened in Cursor');
                });
            }
            else if (files.length > 0) {
                const fullPaths = files.map(convertPath);
                const command = `"${cursorPath}" ${windowFlag} ${fullPaths.map(p => `"${p}"`).join(' ')}`;
                console.log('Opening files:', fullPaths);
                console.log('Executing command:', command);
                const childProcess = child_process.exec(command, (error, stdout, stderr) => {
                    if (error) {
                        new obsidian.Notice('Failed to open in Cursor');
                        return;
                    }
                    if (this.settings.isFirstOpen) {
                        this.settings.isFirstOpen = false;
                        this.settings.cursorPid = childProcess.pid;
                        this.saveSettings();
                        console.log('Saved Cursor PID:', childProcess.pid);
                    }
                    new obsidian.Notice('Files opened in Cursor');
                });
            }
            else {
                new obsidian.Notice('No files or directories selected');
            }
        });
    }
}

module.exports = OpenInCursorPlugin;

/* nosourcemap */