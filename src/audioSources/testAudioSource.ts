import { AudioSource } from './audioSource';
import { Logger } from '../logger';

export class TestAudioSource extends AudioSource {
    private interval: NodeJS.Timeout | undefined;

    get name(): string {
        return "Test (Synthetic)";
    }

    async initialize(): Promise<void> {
        Logger.debug('Test audio capture initialized (generating fake data)');
    }

    async startCapture(): Promise<void> {
        Logger.debug('Starting test audio capture');
        this.isCapturing = true;
        
        // Generate fake audio data for testing
        this.interval = setInterval(() => {
            const frameLength = 1024;
            const frame = new Float32Array(frameLength);
            
            // Simple single sine wave for testing
            const frequency = 440; // 440 Hz A note
            const amplitude = 0.5; // Strong amplitude
            
            for (let i = 0; i < frameLength; i++) {
                frame[i] = amplitude * Math.sin(2 * Math.PI * frequency * i / 44100);
            }
            
            // Log sample values
            if (this.audioBuffer.length === 0) {
                Logger.debug(`Test audio first 5 samples: [${Array.from(frame.slice(0, 5)).map(x => x.toFixed(3)).join(', ')}]`);
            }
            
            this.addAudioFrame(frame);
            
            // Log less frequently to avoid spam
            if (this.audioBuffer.length % 60 === 0) {
                Logger.debug(`Generated test frame with ${frameLength} samples`);
            }
        }, 16); // ~60 FPS
        
        Logger.debug('Test audio capture started');
    }

    stopCapture(): void {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = undefined;
        }
        this.isCapturing = false;
        Logger.debug('Test audio capture stopped');
    }

    // Inherited from AudioSource base class
}