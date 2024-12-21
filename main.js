'use strict';

var obsidian = require('obsidian');
var child_process = require('child_process');
var path = require('path');

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

typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};

class OpenInCursorSettingTab extends obsidian.PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }
    display() {
        const { containerEl } = this;
        containerEl.empty();
        containerEl.createEl('h2', { text: 'Open in Cursor Settings' });
        new obsidian.Setting(containerEl)
            .setName('Cursor 可执行文件路径')
            .setDesc('设置 Cursor 编辑器的可执行文件路径（例如：C:\\Users\\username\\AppData\\Local\\Programs\\Cursor\\Cursor.exe）')
            .addText(text => text
            .setPlaceholder('输入 Cursor 可执行文件的完整路径')
            .setValue(this.plugin.settings.cursorPath)
            .onChange((value) => __awaiter(this, void 0, void 0, function* () {
            this.plugin.settings.cursorPath = value;
            yield this.plugin.saveSettings();
        })));
        new obsidian.Setting(containerEl)
            .setName('重置 Cursor 窗口')
            .setDesc('重置 Cursor 窗口状态，下次打开时将使用新窗口')
            .addButton(button => button
            .setButtonText('重置')
            .onClick(() => __awaiter(this, void 0, void 0, function* () {
            this.plugin.settings.isFirstOpen = true;
            this.plugin.settings.cursorPid = null;
            yield this.plugin.saveSettings();
            new obsidian.Notice('Cursor 窗口状态已重置');
        })));
    }
}
const DEFAULT_SETTINGS = {
    cursorPath: '',
    isFirstOpen: true,
    cursorPid: null
};
class OpenInCursorPlugin extends obsidian.Plugin {
    onload() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.loadSettings();
            console.log('OpenInCursor plugin is loading...');
            this.addCommand({
                id: 'open-in-cursor',
                name: '在 Cursor 中打开当前文件',
                callback: () => {
                    const activeFile = this.app.workspace.getActiveFile();
                    if (activeFile) {
                        console.log('Opening active file in Cursor:', activeFile.path);
                        this.openInCursor([activeFile.path]);
                    }
                    else {
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
            const statusBarItem = this.addStatusBarItem();
            const statusBarButton = statusBarItem.createEl('span', {
                text: 'Open in Cursor',
                cls: 'cursor-bridge-status-button',
                attr: {
                    style: 'cursor: pointer; padding: 0 8px; border-radius: 4px; margin: 0 4px;'
                }
            });
            statusBarButton.addEventListener('mouseenter', () => {
                statusBarButton.style.backgroundColor = 'var(--interactive-accent)';
                statusBarButton.style.color = 'var(--text-on-accent)';
            });
            statusBarButton.addEventListener('mouseleave', () => {
                statusBarButton.style.backgroundColor = '';
                statusBarButton.style.color = '';
            });
            // statusBarButton.addEventListener('click', () => {
            //     this.app.commands.executeCommandById('cursor-bridge:open-in-cursor');
            // });
            this.addSettingTab(new OpenInCursorSettingTab(this.app, this));
            console.log('OpenInCursor plugin loaded successfully');
        });
    }
    loadSettings() {
        return __awaiter(this, void 0, void 0, function* () {
            this.settings = Object.assign({}, DEFAULT_SETTINGS, yield this.loadData());
        });
    }
    saveSettings() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.saveData(this.settings);
        });
    }
    openInCursor(paths) {
        return __awaiter(this, void 0, void 0, function* () {
            const cursorPath = this.settings.cursorPath || 'cursor';
            if (this.settings.cursorPid) {
                try {
                    const checkCommand = process.platform === 'win32'
                        ? `tasklist /FI "PID eq ${this.settings.cursorPid}" /NH`
                        : `ps -p ${this.settings.cursorPid} -o pid=`;
                    child_process.exec(checkCommand, (error, stdout) => {
                        if (error || !stdout.includes(String(this.settings.cursorPid))) {
                            console.log('Saved Cursor process not found, resetting state');
                            this.settings.isFirstOpen = true;
                            this.settings.cursorPid = null;
                            this.saveSettings();
                        }
                    });
                }
                catch (e) {
                    console.error('Error checking Cursor process:', e);
                }
            }
            const adapter = this.app.vault.adapter;
            const vaultPath = adapter instanceof obsidian.FileSystemAdapter ? adapter.getBasePath() : '';
            if (!vaultPath) {
                new obsidian.Notice('Unable to get vault path');
                return;
            }
            const convertPath = (p) => path.join(vaultPath, p);
            const directories = paths.filter(p => this.app.vault.getAbstractFileByPath(p) instanceof obsidian.TFolder);
            const files = paths.filter(p => this.app.vault.getAbstractFileByPath(p) instanceof obsidian.TFile);
            const useNewWindow = this.settings.isFirstOpen;
            const windowFlag = useNewWindow ? '--new-window' : '';
            if (directories.length > 0) {
                const fullPath = convertPath(directories[0]);
                const command = `"${cursorPath}" ${windowFlag} "${fullPath}"`;
                const childProcess = child_process.exec(command, ((error, stdout, stderr) => {
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
                    if (this.settings.isFirstOpen && childProcess.pid) {
                        this.settings.isFirstOpen = false;
                        this.settings.cursorPid = childProcess.pid;
                        this.saveSettings();
                        console.log('Saved Cursor PID:', childProcess.pid);
                    }
                    new obsidian.Notice('Directory opened in Cursor');
                }));
            }
            else if (files.length > 0) {
                const fullPaths = files.map(convertPath);
                const command = `"${cursorPath}" ${windowFlag} ${fullPaths.map(p => `"${p}"`).join(' ')}`;
                console.log('Opening files:', fullPaths);
                console.log('Executing command:', command);
                const childProcess = child_process.exec(command, ((error, stdout, stderr) => {
                    if (error) {
                        new obsidian.Notice('Failed to open in Cursor');
                        return;
                    }
                    if (this.settings.isFirstOpen && childProcess.pid) {
                        this.settings.isFirstOpen = false;
                        this.settings.cursorPid = childProcess.pid;
                        this.saveSettings();
                        console.log('Saved Cursor PID:', childProcess.pid);
                    }
                    new obsidian.Notice('Files opened in Cursor');
                }));
            }
            else {
                new obsidian.Notice('No files or directories selected');
            }
        });
    }
}

module.exports = OpenInCursorPlugin;
