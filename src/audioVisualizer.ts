import * as vscode from 'vscode';
import { AudioSource } from './audioSources/audioSource';
import { MicrophoneAudioSource } from './audioSources/microphoneAudioSource';
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

    constructor(audioSource?: AudioSource, useFFT: boolean = true) {
        this.audioSource = audioSource || new SystemAudioSource();
        this.frequencyAnalyzer = new FrequencyAnalyzer(useFFT);
        this.cursorController = new CursorController();
        
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
            throw error;
        }
    }

    async startMicrophoneMode(): Promise<void> {
        if (this.isRunning) {
            return;
        }

        Logger.info('Starting microphone mode for audio capture');
        this.audioSource = new MicrophoneAudioSource();
        
        try {
            await this.audioSource.initialize();
            await this.audioSource.startCapture();

            this.isRunning = true;
            this.startUpdateLoop();

            Logger.info('Microphone mode started successfully');
        } catch (error) {
            throw new Error(`Failed to start microphone mode: ${error}`);
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