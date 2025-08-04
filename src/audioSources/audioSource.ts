export abstract class AudioSource {
    protected isCapturing: boolean = false;
    protected audioBuffer: Float32Array[] = [];

    abstract initialize(): Promise<void>;
    abstract startCapture(): Promise<void>;
    abstract stopCapture(): void;
    abstract get name(): string;

    getLatestAudioData(): Float32Array | null {
        if (this.audioBuffer.length === 0) {
            return null;
        }
        return this.audioBuffer[this.audioBuffer.length - 1];
    }

    protected addAudioFrame(frame: Float32Array): void {
        this.audioBuffer.push(frame);
        // Keep only the last 10 frames to prevent memory issues
        if (this.audioBuffer.length > 10) {
            this.audioBuffer.shift();
        }
    }

    get isActive(): boolean {
        return this.isCapturing;
    }
}