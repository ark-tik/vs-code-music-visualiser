import { PvRecorder } from '@picovoice/pvrecorder-node';
import { AudioSource } from './audioSource';
import { Logger } from '../logger';

export class SystemAudioSource extends AudioSource {
    private recorder: PvRecorder | undefined;
    private selectedDeviceIndex: number = -1;

    get name(): string {
        return "System Audio Output";
    }

    async initialize(): Promise<void> {
        try {
            Logger.info('Initializing System Audio Source...');
            
            // List available devices and find loopback/monitor devices
            const loopbackDeviceIndex = await this.findLoopbackDevice();
            
            if (loopbackDeviceIndex === -1) {
                throw new Error('No system audio loopback device found. Please ensure your system has a monitor/loopback audio device enabled.');
            }

            Logger.info(`Using loopback device index: ${loopbackDeviceIndex}`);
            
            // Initialize PvRecorder with the loopback device
            const frameLength = 1024;
            this.selectedDeviceIndex = loopbackDeviceIndex;
            this.recorder = new PvRecorder(frameLength, this.selectedDeviceIndex);

            Logger.info('System audio capture initialized successfully');
        } catch (error) {
            Logger.error(`Failed to initialize system audio capture: ${error}`);
            throw new Error(`Failed to initialize system audio capture: ${error}`);
        }
    }

    async startCapture(): Promise<void> {
        if (!this.recorder) {
            throw new Error('System audio capture not initialized');
        }

        try {
            Logger.info('Starting system audio capture...');
            await this.recorder.start();
            this.isCapturing = true;

            // Start reading audio data
            this.startAudioLoop();

            Logger.info('System audio capture started successfully');
        } catch (error) {
            Logger.error(`Failed to start system audio capture: ${error}`);
            throw new Error(`Failed to start system audio capture: ${error}`);
        }
    }

    stopCapture(): void {
        if (this.recorder && this.isCapturing) {
            try {
                this.recorder.stop();
                this.recorder.release();
                this.isCapturing = false;
                Logger.info('System audio capture stopped');
            } catch (error) {
                Logger.error(`Error stopping system audio capture: ${error}`);
            }
        }
    }

    private async findLoopbackDevice(): Promise<number> {
        try {
            // Get list of available audio devices
            if (typeof (PvRecorder as any).getAvailableDevices !== 'function') {
                Logger.warn('Cannot list audio devices - using default device');
                return -1;
            }

            const devices = (PvRecorder as any).getAvailableDevices();
            Logger.info(`Found ${devices.length} audio devices:`);
            
            for (let i = 0; i < devices.length; i++) {
                const deviceName = devices[i].toLowerCase();
                Logger.info(`Device ${i}: ${devices[i]}`);
                
                // Look for common loopback/monitor device names
                if (this.isLoopbackDevice(deviceName)) {
                    Logger.info(`Found potential loopback device at index ${i}: ${devices[i]}`);
                    return i;
                }
            }

            // Platform-specific fallback logic
            const platform = process.platform;
            Logger.info(`Platform: ${platform}`);

            if (platform === 'linux') {
                // On Linux, look for PulseAudio monitor devices
                for (let i = 0; i < devices.length; i++) {
                    const deviceName = devices[i].toLowerCase();
                    if (deviceName.includes('monitor') || deviceName.includes('.monitor')) {
                        Logger.info(`Found Linux monitor device at index ${i}: ${devices[i]}`);
                        return i;
                    }
                }
            } else if (platform === 'win32') {
                // On Windows, look for "Stereo Mix" or similar
                for (let i = 0; i < devices.length; i++) {
                    const deviceName = devices[i].toLowerCase();
                    if (deviceName.includes('stereo mix') || deviceName.includes('what u hear')) {
                        Logger.info(`Found Windows loopback device at index ${i}: ${devices[i]}`);
                        return i;
                    }
                }
            } else if (platform === 'darwin') {
                // On macOS, look for Soundflower or other virtual devices
                for (let i = 0; i < devices.length; i++) {
                    const deviceName = devices[i].toLowerCase();
                    if (deviceName.includes('soundflower') || deviceName.includes('blackhole')) {
                        Logger.info(`Found macOS virtual device at index ${i}: ${devices[i]}`);
                        return i;
                    }
                }
            }

            Logger.warn('No loopback device found. Available devices:');
            devices.forEach((device: string, index: number) => {
                Logger.warn(`  ${index}: ${device}`);
            });

            return -1;
        } catch (error) {
            Logger.error(`Error finding loopback device: ${error}`);
            return -1;
        }
    }

    private isLoopbackDevice(deviceName: string): boolean {
        const loopbackKeywords = [
            'loopback',
            'monitor',
            'stereo mix',
            'what u hear',
            'what you hear',
            'speakers',
            'output',
            'soundflower',
            'blackhole',
            'virtual',
            'system audio'
        ];

        return loopbackKeywords.some(keyword => deviceName.includes(keyword));
    }

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
            Logger.error(`Error in system audio loop: ${error}`);
            // Stop capturing on persistent errors
            if (this.isCapturing) {
                Logger.warn('Stopping system audio capture due to persistent errors');
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

    // Helper method to get available devices for debugging
    static async listAvailableDevices(): Promise<string[]> {
        try {
            if (typeof (PvRecorder as any).getAvailableDevices === 'function') {
                return (PvRecorder as any).getAvailableDevices();
            }
            return [];
        } catch (error) {
            Logger.error(`Error listing devices: ${error}`);
            return [];
        }
    }
}