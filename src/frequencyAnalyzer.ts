import { FFTProvider, DFTProvider, FFTProvider_CooleyTukey } from './fftProviders/fftProvider';
import { Logger } from './logger';

export interface FrequencyData {
    frequencies: number[];
    magnitudes: number[];
    dominantFrequency: number;
    totalEnergy: number;
}


export class FrequencyAnalyzer {
    private fftProvider: FFTProvider;
    private windowSize: number = 512; // Power of 2 for FFT
    

    constructor(useFFT: boolean = true) {
        // Choose FFT implementation
        if (useFFT) {
            this.fftProvider = new FFTProvider_CooleyTukey();
            Logger.info(`Using ${this.fftProvider.name} for frequency analysis`);
        } else {
            this.fftProvider = new DFTProvider();
            this.windowSize = 256; // Smaller for DFT performance
            Logger.info(`Using ${this.fftProvider.name} for frequency analysis`);
        }
    }

    analyze(audioData: Float32Array): FrequencyData {
        Logger.debug(`${this.fftProvider.name} Input: ${audioData.length} samples, first 5: [${Array.from(audioData.slice(0, 5)).map(x => x.toFixed(3)).join(', ')}]`);
        
        // Use configured window size
        const effectiveWindowSize = Math.min(audioData.length, this.windowSize);
        const input = audioData.slice(0, effectiveWindowSize);

        // Check input RMS before transformation
        const inputRMS = Math.sqrt(input.reduce((sum, x) => sum + x * x, 0) / input.length);
        Logger.debug(`Input RMS: ${inputRMS.toFixed(6)}`);

        // Perform frequency transformation
        const { real, imag } = this.fftProvider.transform(input);

        // Calculate magnitudes
        const magnitudes: number[] = [];
        const frequencies: number[] = [];
        const sampleRate = 44100; // Assume 44.1kHz sample rate

        for (let i = 0; i < effectiveWindowSize / 2; i++) {
            const magnitude = Math.sqrt(real[i] * real[i] + imag[i] * imag[i]);
            magnitudes.push(magnitude);
            frequencies.push((i * sampleRate) / effectiveWindowSize);
        }

        // Find dominant frequency
        let maxMagnitude = 0;
        let dominantFrequency = 0;
        for (let i = 0; i < magnitudes.length; i++) {
            if (magnitudes[i] > maxMagnitude) {
                maxMagnitude = magnitudes[i];
                dominantFrequency = frequencies[i];
            }
        }

        // Calculate total energy
        const totalEnergy = magnitudes.reduce((sum, mag) => sum + mag * mag, 0);
        Logger.debug(`${this.fftProvider.name} Output: ${magnitudes.length} bins, max magnitude: ${Math.max(...magnitudes).toFixed(6)}, total energy: ${totalEnergy.toFixed(6)}`);

        return {
            frequencies,
            magnitudes,
            dominantFrequency,
            totalEnergy
        };
    }

    // Get frequency bins for specific ranges
    getFrequencyBins(data: FrequencyData, binCount: number): number[] {
        const bins: number[] = [];
        const binSize = Math.floor(data.magnitudes.length / binCount);

        for (let i = 0; i < binCount; i++) {
            const start = i * binSize;
            const end = Math.min(start + binSize, data.magnitudes.length);

            let binValue = 0;
            for (let j = start; j < end; j++) {
                binValue += data.magnitudes[j];
            }

            bins.push(binValue / binSize);
        }

        return bins;
    }

}