export interface FFTResult {
    real: Float32Array;
    imag: Float32Array;
}

export abstract class FFTProvider {
    abstract transform(input: Float32Array): FFTResult;
    abstract get name(): string;
}

// Simple DFT implementation (slow but works)
export class DFTProvider extends FFTProvider {
    get name(): string {
        return "DFT";
    }

    transform(input: Float32Array): FFTResult {
        const N = input.length;
        const real = new Float32Array(N);
        const imag = new Float32Array(N);

        for (let k = 0; k < N; k++) {
            let sumReal = 0;
            let sumImag = 0;
            
            for (let n = 0; n < N; n++) {
                const angle = -2 * Math.PI * k * n / N;
                sumReal += input[n] * Math.cos(angle);
                sumImag += input[n] * Math.sin(angle);
            }
            
            real[k] = sumReal;
            imag[k] = sumImag;
        }

        return { real, imag };
    }
}

// Fast FFT implementation (Cooley-Tukey algorithm)
export class FFTProvider_CooleyTukey extends FFTProvider {
    get name(): string {
        return "Cooley-Tukey FFT";
    }

    transform(input: Float32Array): FFTResult {
        const N = input.length;
        
        // Ensure N is a power of 2
        const powerOf2 = Math.pow(2, Math.floor(Math.log2(N)));
        const paddedInput = new Float32Array(powerOf2);
        paddedInput.set(input.slice(0, powerOf2));
        
        return this.fftRecursive(paddedInput, new Float32Array(powerOf2));
    }
    
    private fftRecursive(real: Float32Array, imag: Float32Array): FFTResult {
        const N = real.length;
        
        if (N <= 1) {
            return { real: new Float32Array(real), imag: new Float32Array(imag) };
        }
        
        // Bit-reversal permutation
        for (let i = 0; i < N; i++) {
            const j = this.bitReverse(i, Math.log2(N));
            if (i < j) {
                [real[i], real[j]] = [real[j], real[i]];
                [imag[i], imag[j]] = [imag[j], imag[i]];
            }
        }
        
        // Cooley-Tukey FFT
        for (let size = 2; size <= N; size *= 2) {
            const halfSize = size / 2;
            const step = 2 * Math.PI / size;
            
            for (let i = 0; i < N; i += size) {
                for (let j = 0; j < halfSize; j++) {
                    const u = i + j;
                    const v = i + j + halfSize;
                    
                    const angle = -j * step;
                    const cos = Math.cos(angle);
                    const sin = Math.sin(angle);
                    
                    const tReal = real[v] * cos - imag[v] * sin;
                    const tImag = real[v] * sin + imag[v] * cos;
                    
                    real[v] = real[u] - tReal;
                    imag[v] = imag[u] - tImag;
                    real[u] = real[u] + tReal;
                    imag[u] = imag[u] + tImag;
                }
            }
        }
        
        return { real, imag };
    }
    
    private bitReverse(num: number, bits: number): number {
        let result = 0;
        for (let i = 0; i < bits; i++) {
            result = (result << 1) | (num & 1);
            num >>= 1;
        }
        return result;
    }
}

// FFT.js library wrapper (if we want to try fixing it later)
export class FFTJSProvider extends FFTProvider {
    private fft: any;

    constructor(size: number) {
        super();
        try {
            // Uncomment when we want to try fft.js again
            // const FFT = require('fft.js');
            // this.fft = new FFT(size);
            throw new Error("fft.js provider disabled - use DFT or Cooley-Tukey instead");
        } catch (error) {
            throw new Error(`Failed to initialize fft.js: ${error}`);
        }
    }

    get name(): string {
        return "fft.js";
    }

    transform(input: Float32Array): FFTResult {
        // Implementation would go here when fft.js is working
        throw new Error("fft.js provider not implemented");
    }
}