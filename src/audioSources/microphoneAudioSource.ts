import { PvRecorder } from '@picovoice/pvrecorder-node';
import { AudioSource } from './audioSource';
import { Logger } from '../logger';

export class MicrophoneAudioSource extends AudioSource {
    private recorder: PvRecorder | undefined;

    get name(): string {
        return "Microphone";
    }

    async initialize(): Promise<void> {
        try {
            Logger.debug('Initializing PvRecorder');
            
            // List available devices first
            try {
                if (typeof (PvRecorder as any).getAudioDevices === 'function') {
                    const devices = (PvRecorder as any).getAudioDevices();
                    Logger.debug(`Available audio devices: ${JSON.stringify(devices)}`);
                }
                if (typeof (PvRecorder as any).getDefaultAudioDevice === 'function') {
                    Logger.debug(`Default device index: ${(PvRecorder as any).getDefaultAudioDevice()}`);
                }
            } catch (deviceError) {
                Logger.debug(`Could not list audio devices: ${deviceError}`);
            }
            
            // Initialize PvRecorder for cross-platform audio capture
            const frameLength = 1024;
            const deviceIndex = -1; // Use default device
            this.recorder = new PvRecorder(frameLength, deviceIndex);

            Logger.debug('Audio capture initialized successfully');
        } catch (error) {
            Logger.error(`Failed to initialize PvRecorder: ${error}`);
            throw new Error(`Failed to initialize audio capture: ${error}`);
        }
    }

    async startCapture(): Promise<void> {
        if (!this.recorder) {
            throw new Error('Audio capture not initialized');
        }

        try {
            Logger.debug('Starting PvRecorder');
            await this.recorder.start();
            this.isCapturing = true;

            // Start reading audio data
            this.startAudioLoop();

            Logger.debug('Audio capture started successfully');
        } catch (error) {
            Logger.error(`Failed to start PvRecorder: ${error}`);
            throw new Error(`Failed to start audio capture: ${error}`);
        }
    }

    stopCapture(): void {
        if (this.recorder && this.isCapturing) {
            this.recorder.stop();
            this.recorder.release();
            this.isCapturing = false;
            Logger.debug('Audio capture stopped');
        }
    }

    // Inherited from AudioSource base class

    private async startAudioLoop(): Promise<void> {
        if (!this.recorder || !this.isCapturing) {
            return;
        }

        try {
            const audioFrame = await this.recorder.read();

            // Convert Int16Array to Float32Array
            const floatFrame = new Float32Array(audioFrame.length);
            for (let i = 0; i < audioFrame.length; i++) {
                floatFrame[i] = audioFrame[i] / 32768.0; // Normalize to [-1, 1]
            }

            // Add frame using parent class method
            this.addAudioFrame(floatFrame);

            // Continue the loop only if still capturing
            if (this.isCapturing) {
                setImmediate(() => this.startAudioLoop());
            }
        } catch (error) {
            Logger.error(`Error in audio loop: ${error}`);
            // Stop capturing on persistent errors
            if (this.isCapturing) {
                Logger.info('Stopping audio capture due to persistent errors');
                this.isCapturing = false;
                if (this.recorder) {
                    try {
                        this.recorder.stop();
                        this.recorder.release();
                    } catch (stopError) {
                        Logger.error(`Error stopping recorder: ${stopError}`);
                    }
                }
            }
        }
    }
}