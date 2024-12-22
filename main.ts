import { 
    App, 
    Plugin, 
    PluginSettingTab, 
    Setting, 
    TAbstractFile,
    TFile, 
    TFolder,
    Notice,
    FileSystemAdapter
} from 'obsidian';
import { exec, ExecException } from 'child_process';
import { join } from 'path';

interface OpenInCursorSettings {
    cursorPath: string;
    isFirstOpen: boolean;
    cursorPid: number | null;
}

interface ExecCallbackType {
    (error: ExecException | null, stdout: string, stderr: string): void;
}

class OpenInCursorSettingTab extends PluginSettingTab {
    plugin: OpenInCursorPlugin;

    constructor(app: App, plugin: OpenInCursorPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();
        containerEl.createEl('h2', { text: 'Open in Cursor Settings' });

        new Setting(containerEl)
            .setName('Cursor 可执行文件路径')
            .setDesc('设置 Cursor 编辑器的可执行文件路径（例如：C:\\Users\\username\\AppData\\Local\\Programs\\Cursor\\Cursor.exe）')
            .addText(text => text
                .setPlaceholder('输入 Cursor 可执行文件的完整路径')
                .setValue(this.plugin.settings.cursorPath)
                .onChange(async (value) => {
                    this.plugin.settings.cursorPath = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('重置 Cursor 窗口')
            .setDesc('重置 Cursor 窗口状态，下次打开时将使用新窗口')
            .addButton(button => button
                .setButtonText('重置')
                .onClick(async () => {
                    this.plugin.settings.isFirstOpen = true;
                    this.plugin.settings.cursorPid = null;
                    await this.plugin.saveSettings();
                    new Notice('Cursor 窗口状态已重置');
                }));
    }
}

const DEFAULT_SETTINGS: OpenInCursorSettings = {
    cursorPath: '',
    isFirstOpen: true,
    cursorPid: null
};

export default class OpenInCursorPlugin extends Plugin {
    settings: OpenInCursorSettings;

    async onload(): Promise<void> {
        await this.loadSettings();
        
        this.addCommand({
            id: 'open-in-cursor',
            name: '在 Cursor 中打开当前文件',
            callback: () => {
                const activeFile = this.app.workspace.getActiveFile();
                if (activeFile) {
                    this.openInCursor([activeFile.path]);
                } else {
                    new Notice('No active file');
                }
            }
        });
        
        const statusBarItem = this.addStatusBarItem();
        const statusBarButton = statusBarItem.createEl('span', {
            text: 'Open in Cursor',
            cls: 'cursor-bridge-status-button'
        });

        statusBarButton.onclick = () => {
            const activeFile = this.app.workspace.getActiveFile();
            if (activeFile) {
                this.openInCursor([activeFile.path]);
            } else {
                new Notice('No active file');
            }
        };

        this.addSettingTab(new OpenInCursorSettingTab(this.app, this));
    }

    async loadSettings(): Promise<void> {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings(): Promise<void> {
        await this.saveData(this.settings);
    }

    async openInCursor(paths: string[]): Promise<void> {
        const cursorPath = this.settings.cursorPath || 'cursor';
        
        if (this.settings.cursorPid) {
            try {
                const checkCommand = process.platform === 'win32' 
                    ? `tasklist /FI "PID eq ${this.settings.cursorPid}" /NH`
                    : `ps -p ${this.settings.cursorPid} -o pid=`;
                
                exec(checkCommand, (error: ExecException | null, stdout: string) => {
                    if (error || !stdout.includes(String(this.settings.cursorPid))) {
                        this.settings.isFirstOpen = true;
                        this.settings.cursorPid = null;
                        this.saveSettings();
                    }
                });
            } catch (e) {
                console.error('Error checking Cursor process:', e);
            }
        }

        const adapter = this.app.vault.adapter;
        const vaultPath = adapter instanceof FileSystemAdapter ? adapter.getBasePath() : '';
        
        if (!vaultPath) {
            new Notice('Unable to get vault path');
            return;
        }

        const convertPath = (p: string): string => join(vaultPath, p);
        const directories = paths.filter(p => this.app.vault.getAbstractFileByPath(p) instanceof TFolder);
        const files = paths.filter(p => this.app.vault.getAbstractFileByPath(p) instanceof TFile);

        const useNewWindow = this.settings.isFirstOpen;
        const windowFlag = useNewWindow ? '--new-window' : '';

        if (directories.length > 0) {
            const fullPath = convertPath(directories[0]);
            const command = `"${cursorPath}" ${windowFlag} "${fullPath}"`;
            
            const childProcess = exec(command, ((error: ExecException | null, stdout: string, stderr: string) => {
                if (error) {
                    new Notice('Failed to open in Cursor');
                    return;
                }
                if (this.settings.isFirstOpen && childProcess.pid) {
                    this.settings.isFirstOpen = false;
                    this.settings.cursorPid = childProcess.pid;
                    this.saveSettings();
                }
                new Notice('Directory opened in Cursor');
            }) as ExecCallbackType);
        } else if (files.length > 0) {
            const fullPaths = files.map(convertPath);
            const command = `"${cursorPath}" ${windowFlag} ${fullPaths.map(p => `"${p}"`).join(' ')}`;
            
            const childProcess = exec(command, ((error: ExecException | null, stdout: string, stderr: string) => {
                if (error) {
                    new Notice('Failed to open in Cursor');
                    return;
                }
                if (this.settings.isFirstOpen && childProcess.pid) {
                    this.settings.isFirstOpen = false;
                    this.settings.cursorPid = childProcess.pid;
                    this.saveSettings();
                }
                new Notice('Files opened in Cursor');
            }) as ExecCallbackType);
        } else {
            new Notice('No files or directories selected');
        }
    }
}