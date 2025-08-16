import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { AudioVisualizer } from './audioVisualizer';
import { Logger } from './logger';

let audioVisualizer: AudioVisualizer | undefined;

async function openDefaultVisualizationFile(context: vscode.ExtensionContext): Promise<void> {
    const config = vscode.workspace.getConfiguration('audioVisualizer');
    const useDefaultFile = config.get<boolean>('useDefaultVisualizationFile', true);
    
    if (!useDefaultFile) {
        return;
    }

    try {
        // Get the default visualization file from the extension's assets
        const defaultFilePath = path.join(context.extensionPath, 'assets', 'default-visualization.md');
        
        // Check if the file exists
        if (!fs.existsSync(defaultFilePath)) {
            Logger.debug('Default visualization file not found at: ' + defaultFilePath);
            return;
        }

        // Open the file
        const document = await vscode.workspace.openTextDocument(defaultFilePath);
        await vscode.window.showTextDocument(document);
        
        Logger.debug('Opened default visualization file for enhanced visual experience');
    } catch (error) {
        Logger.error(`Failed to open default visualization file: ${error}`);
    }
}

export function activate(context: vscode.ExtensionContext) {
    // Initialize logging
    Logger.initialize();
    Logger.info('Multiline Cursor Audio Visualizer activated');

    // Register commands

    const stopCommand = vscode.commands.registerCommand('audioVisualizer.stop', () => {
        if (audioVisualizer) {
            audioVisualizer.stop();
            audioVisualizer = undefined;
            vscode.window.showInformationMessage('Audio visualizer stopped');
        } else {
            vscode.window.showWarningMessage('Audio visualizer is not running');
        }
    });

    const configureCommand = vscode.commands.registerCommand('audioVisualizer.configure', () => {
        vscode.commands.executeCommand('workbench.action.openSettings', 'audioVisualizer');
    });


    const startMicrophoneCommand = vscode.commands.registerCommand('audioVisualizer.startMicrophone', async () => {
        if (audioVisualizer) {
            vscode.window.showWarningMessage('Audio visualizer is already running');
            return;
        }

        try {
            // Open default visualization file first
            await openDefaultVisualizationFile(context);
            
            Logger.debug('Starting audio visualizer with microphone');
            audioVisualizer = new AudioVisualizer();
            await audioVisualizer.startMicrophoneMode();
            vscode.window.showInformationMessage('Audio visualizer started with microphone');
        } catch (error) {
            Logger.error(`Error starting microphone mode: ${error}`);
            vscode.window.showErrorMessage(`Failed to start microphone mode: ${error}`);
        }
    });



    const startSystemAudioCommand = vscode.commands.registerCommand('audioVisualizer.startSystemAudio', async () => {
        if (audioVisualizer) {
            vscode.window.showWarningMessage('Audio visualizer is already running');
            return;
        }

        try {
            // Open default visualization file first
            await openDefaultVisualizationFile(context);
            
            Logger.debug('Starting audio visualizer in system audio mode');
            audioVisualizer = new AudioVisualizer(undefined, true); // Use FFT
            await audioVisualizer.startSystemAudioMode();
            vscode.window.showInformationMessage('Audio visualizer started with system audio output. Play audio on your computer to see visualization.');
        } catch (error) {
            Logger.error(`Error starting system audio mode: ${error}`);
            vscode.window.showErrorMessage(`Failed to start system audio mode: ${error}`);
        }
    });

    context.subscriptions.push(stopCommand, configureCommand, startMicrophoneCommand, startSystemAudioCommand);

    // Clean up on deactivation
    context.subscriptions.push(new vscode.Disposable(() => {
        if (audioVisualizer) {
            audioVisualizer.stop();
            audioVisualizer = undefined;
        }
    }));
}

export function deactivate() {
    if (audioVisualizer) {
        audioVisualizer.stop();
        audioVisualizer = undefined;
    }
}