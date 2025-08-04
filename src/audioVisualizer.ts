import * as vscode from 'vscode';
import { AudioSource } from './audioSources/audioSource';
import { MicrophoneAudioSource } from './audioSources/microphoneAudioSource';
import { TestAudioSource } from './audioSources/testAudioSource';
import { FileAudioSource } from './audioSources/fileAudioSource';
import { SystemAudioSource } from './audioSources/systemAudioSource';
import { FrequencyAnalyzer } from './frequencyAnalyzer';
import { CursorController } from './cursorController';
import { Logger } from './logger';

export class AudioVisualizer {
    private audioSource: AudioSource;
    private frequencyAnalyzer: FrequencyAnalyzer;
    private cursorController: CursorController;
    private isRunning: boolean = false;
    private updateInterval: NodeJS.Timeout | undefined;

    constructor(private editor: vscode.TextEditor, audioSource?: AudioSource, useFFT: boolean = true) {
        this.audioSource = audioSource || new MicrophoneAudioSource();
        this.frequencyAnalyzer = new FrequencyAnalyzer(useFFT);
        this.cursorController = new CursorController(editor);
        
        Logger.debug(`Audio visualizer created with ${this.audioSource.name} source`);
    }

    async start(): Promise<void> {
        if (this.isRunning) {
            return;
        }

        try {
            Logger.info(`Starting ${this.audioSource.name} audio source`);
            await this.audioSource.initialize();
            await this.audioSource.startCapture();

            this.isRunning = true;
            this.startUpdateLoop();

            vscode.window.showInformationMessage(`Audio visualizer started with ${this.audioSource.name}`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            Logger.error(`Audio source failed: ${errorMessage}`);
            
            // Only auto-fallback if using microphone source
            if (this.audioSource instanceof MicrophoneAudioSource) {
                Logger.info('Microphone failed, falling back to test mode');
                this.audioSource = new TestAudioSource();
                try {
                    await this.audioSource.initialize();
                    await this.audioSource.startCapture();

                    this.isRunning = true;
                    this.startUpdateLoop();

                    vscode.window.showInformationMessage('Audio visualizer started with test audio (microphone failed)');
                } catch (testError) {
                    throw new Error(`Both microphone and test audio failed: ${testError}`);
                }
            } else {
                throw error;
            }
        }
    }

    async startTestMode(): Promise<void> {
        if (this.isRunning) {
            return;
        }

        Logger.info('Starting test mode with synthetic audio');
        this.audioSource = new TestAudioSource();
        
        try {
            await this.audioSource.initialize();
            await this.audioSource.startCapture();

            this.isRunning = true;
            this.startUpdateLoop();

            Logger.info('Test mode started successfully');
        } catch (error) {
            throw new Error(`Failed to start test mode: ${error}`);
        }
    }

    async startFileMode(filePath: string): Promise<void> {
        if (this.isRunning) {
            return;
        }

        Logger.info(`Starting file mode with audio file: ${filePath}`);
        this.audioSource = new FileAudioSource(filePath);
        
        try {
            await this.audioSource.initialize();
            await this.audioSource.startCapture();

            this.isRunning = true;
            this.startUpdateLoop();

            Logger.info('File mode started successfully');
        } catch (error) {
            throw new Error(`Failed to start file mode: ${error}`);
        }
    }


    async startSystemAudioMode(): Promise<void> {
        if (this.isRunning) {
            return;
        }

        Logger.info('Starting system audio mode for loopback audio capture');
        this.audioSource = new SystemAudioSource();
        
        try {
            await this.audioSource.initialize();
            await this.audioSource.startCapture();

            this.isRunning = true;
            this.startUpdateLoop();

            Logger.info('System audio mode started successfully');
        } catch (error) {
            throw new Error(`Failed to start system audio mode: ${error}`);
        }
    }

    stop(): void {
        if (!this.isRunning) {
            return;
        }

        this.isRunning = false;

        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = undefined;
        }

        this.audioSource.stopCapture();
        this.cursorController.clearCursors();
    }

    private startUpdateLoop(): void {
        const config = vscode.workspace.getConfiguration('audioVisualizer');
        const updateRate = config.get<number>('updateRate', 60);
        const interval = 1000 / updateRate;

        this.updateInterval = setInterval(() => {
            this.updateVisualization();
        }, interval);
    }

    private updateVisualization(): void {
        if (!this.isRunning) {
            return;
        }

        const audioData = this.audioSource.getLatestAudioData();
        if (!audioData) {
            return;
        }

        const frequencyData = this.frequencyAnalyzer.analyze(audioData);
        this.cursorController.updateCursors(frequencyData);
    }
}