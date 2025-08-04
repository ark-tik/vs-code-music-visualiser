import * as fs from 'fs';
import * as path from 'path';
import { AudioSource } from './audioSource';
import { Logger } from '../logger';

const wav = require('node-wav');

export class FileAudioSource extends AudioSource {
    private interval: NodeJS.Timeout | undefined;
    private audioData: Float32Array = new Float32Array(0);
    private currentPosition: number = 0;
    private frameSize: number = 1024;
    private sampleRate: number = 44100;
    private fileSampleRate: number = 44100;

    constructor(private filePath: string, private playbackRate: number = 60) {
        super();
    }

    get name(): string {
        return `File: ${path.basename(this.filePath)}`;
    }

    async initialize(): Promise<void> {
        try {
            Logger.info(`Loading audio file: ${this.filePath}`);
            
            // Check if file exists
            if (!fs.existsSync(this.filePath)) {
                throw new Error(`Audio file not found: ${this.filePath}`);
            }
            
            // Load the actual audio file
            await this.loadAudioFile();
            
            Logger.info(`File audio source initialized: ${this.audioData.length} samples at ${this.fileSampleRate}Hz`);
        } catch (error) {
            throw new Error(`Failed to load audio file: ${error}`);
        }
    }

    private async loadAudioFile(): Promise<void> {
        const ext = path.extname(this.filePath).toLowerCase();
        
        switch (ext) {
            case '.wav':
                await this.loadWavFile();
                break;
            case '.mp3':
                throw new Error('MP3 files not yet supported. Please use WAV files.');
            default:
                throw new Error(`Unsupported audio format: ${ext}. Supported formats: .wav`);
        }
    }

    private async loadWavFile(): Promise<void> {
        try {
            // Read the WAV file
            const buffer = fs.readFileSync(this.filePath);
            const result = wav.decode(buffer);
            
            Logger.debug(`WAV file info: ${result.channelData.length} channels, ${result.sampleRate}Hz, ${result.channelData[0].length} samples`);
            
            this.fileSampleRate = result.sampleRate;
            
            // Convert to mono if stereo by averaging channels
            let monoData: Float32Array;
            if (result.channelData.length === 1) {
                // Already mono
                monoData = result.channelData[0];
            } else {
                // Convert stereo/multi-channel to mono
                const sampleCount = result.channelData[0].length;
                monoData = new Float32Array(sampleCount);
                
                for (let i = 0; i < sampleCount; i++) {
                    let sum = 0;
                    for (let channel = 0; channel < result.channelData.length; channel++) {
                        sum += result.channelData[channel][i];
                    }
                    monoData[i] = sum / result.channelData.length;
                }
                
                Logger.debug(`Converted ${result.channelData.length} channels to mono`);
            }
            
            // Resample if necessary (simple decimation/interpolation)
            if (this.fileSampleRate !== this.sampleRate) {
                Logger.debug(`Resampling from ${this.fileSampleRate}Hz to ${this.sampleRate}Hz`);
                this.audioData = this.resampleAudio(monoData, this.fileSampleRate, this.sampleRate);
            } else {
                this.audioData = monoData;
            }
            
            const durationSeconds = this.audioData.length / this.sampleRate;
            Logger.info(`Loaded WAV file: ${this.audioData.length} samples, ${durationSeconds.toFixed(2)}s duration`);
            
        } catch (error) {
            throw new Error(`Failed to parse WAV file: ${error}`);
        }
    }

    private resampleAudio(input: Float32Array, fromRate: number, toRate: number): Float32Array {
        if (fromRate === toRate) {
            return input;
        }
        
        const ratio = fromRate / toRate;
        const outputLength = Math.floor(input.length / ratio);
        const output = new Float32Array(outputLength);
        
        for (let i = 0; i < outputLength; i++) {
            const sourceIndex = i * ratio;
            const floorIndex = Math.floor(sourceIndex);
            const ceilIndex = Math.min(floorIndex + 1, input.length - 1);
            const fraction = sourceIndex - floorIndex;
            
            // Linear interpolation
            output[i] = input[floorIndex] * (1 - fraction) + input[ceilIndex] * fraction;
        }
        
        return output;
    }

    async startCapture(): Promise<void> {
        Logger.info('Starting file audio playback');
        this.isCapturing = true;
        this.currentPosition = 0;
        
        // Calculate interval for desired playback rate
        const intervalMs = 1000 / this.playbackRate;
        
        this.interval = setInterval(() => {
            this.readNextFrame();
        }, intervalMs);
        
        Logger.debug(`File audio capture started at ${this.playbackRate} FPS`);
    }

    stopCapture(): void {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = undefined;
        }
        this.isCapturing = false;
        Logger.debug('File audio capture stopped');
    }

    private readNextFrame(): void {
        if (!this.isCapturing || this.currentPosition >= this.audioData.length) {
            // Loop back to beginning
            this.currentPosition = 0;
        }

        const endPosition = Math.min(this.currentPosition + this.frameSize, this.audioData.length);
        const frame = this.audioData.slice(this.currentPosition, endPosition);
        
        // Pad with zeros if frame is too short
        const paddedFrame = new Float32Array(this.frameSize);
        paddedFrame.set(frame);
        
        this.addAudioFrame(paddedFrame);
        this.currentPosition += this.frameSize;
        
        // Log progress occasionally
        if (this.currentPosition % (this.sampleRate * 2) === 0) {
            const timeSeconds = this.currentPosition / this.sampleRate;
            Logger.debug(`File playback: ${timeSeconds.toFixed(1)}s`);
        }
    }

    // Method to set custom audio data (for testing)
    setAudioData(data: Float32Array, sampleRate: number = 44100): void {
        this.audioData = data;
        this.sampleRate = sampleRate;
        this.currentPosition = 0;
        Logger.debug(`Custom audio data set: ${data.length} samples`);
    }
}