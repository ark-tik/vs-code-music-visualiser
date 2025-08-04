declare module 'fft.js' {
    export default class FFT {
        constructor(size: number);
        toComplexArray(input: Float32Array): Float32Array;
        transform(output: Float32Array, input: Float32Array): void;
    }
}