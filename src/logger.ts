import * as vscode from 'vscode';

export class Logger {
    private static outputChannel: vscode.OutputChannel;
    private static debugEnabled: boolean = false;

    static initialize(): void {
        Logger.outputChannel = vscode.window.createOutputChannel('Audio Visualizer');
        Logger.updateDebugSetting();
    }

    static updateDebugSetting(): void {
        const config = vscode.workspace.getConfiguration('audioVisualizer');
        Logger.debugEnabled = config.get<boolean>('enableDebugLogging', false);
    }

    static info(message: string): void {
        const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
        Logger.outputChannel.appendLine(`[${timestamp}] INFO: ${message}`);
    }

    static debug(message: string): void {
        if (Logger.debugEnabled) {
            const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
            Logger.outputChannel.appendLine(`[${timestamp}] DEBUG: ${message}`);
        }
    }

    static warn(message: string): void {
        const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
        Logger.outputChannel.appendLine(`[${timestamp}] WARN: ${message}`);
    }

    static error(message: string): void {
        const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
        Logger.outputChannel.appendLine(`[${timestamp}] ERROR: ${message}`);
    }

    static show(): void {
        Logger.outputChannel.show();
    }

    static get isDebugEnabled(): boolean {
        return Logger.debugEnabled;
    }
}