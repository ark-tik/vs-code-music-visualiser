# Architecture

## Overview

The VS Code Music Visualizer captures audio, analyzes frequencies via FFT, and maps them to multiline cursor positions in real-time.

## System Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Audio Sources │────▶  Frequency       │────▶  Cursor        │
│                 │    │  Analyzer        │    │  Controller     │  
│ • Microphone    │    │                  │    │                 │
│ • System Audio  │    │ • FFT/DFT        │    │ • Line mapping  │
│                 │    │ • Binning        │    │ • Position calc │
│                 │    │ • Smoothing      │    │ • VS Code API   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   VS Code       │
                       │   Editor        │
                       │                 │
                       │ • Multiline     │
                       │   cursors       │
                       │ • Real-time     │  
                       │   updates       │
                       └─────────────────┘
```

## Core Components

### AudioSource Interface
Base class for audio input implementations:
- **MicrophoneAudioSource**: Real-time microphone capture via `@picovoice/pvrecorder-node`
- **SystemAudioSource**: Loopback capture of computer audio output

### FFTProvider Interface  
Frequency analysis algorithms:
- **DFTProvider**: Simple Discrete Fourier Transform (O(N²))
- **FFTProvider**: Fast Fourier Transform (O(N log N))
- **FFTJSProvider**: External library wrapper

### FrequencyAnalyzer
Orchestrates audio-to-frequency conversion:
- Takes 1024-sample audio frames
- Applies FFT/DFT transformation  
- Outputs frequency bins with magnitudes
- Handles frequency range configuration

### CursorController
Maps frequency data to cursor positions:
- Each line represents a frequency band
- Horizontal position represents magnitude
- Configurable cursor count and sensitivity
- Updates VS Code `editor.selections`

### AudioVisualizer
Main coordinator:
- Manages component lifecycle
- Runs 60 FPS update loop
- Handles error recovery

## Data Flow

1. **Audio Capture**: 1024 samples captured at 44.1kHz
2. **FFT Analysis**: Time domain → frequency spectrum (512 bins)
3. **Frequency Binning**: 512 bins grouped into cursor bins
4. **Cursor Mapping**: Frequency data → VS Code cursor positions
5. **Display Update**: Editor shows multiline cursors

## Configuration

VS Code settings:
- `audioVisualizer.sensitivity` (0.1-5.0): Amplitude multiplier
- `audioVisualizer.cursorCount` (8-256): Number of frequency bands
- `audioVisualizer.updateRate` (30-120): Refresh rate in FPS
- `audioVisualizer.smoothing` (0.0-1.0): Movement fluidity

## Extension Points

### New Audio Sources
```typescript
export class CustomAudioSource extends AudioSource {
  get name(): string { return "Custom"; }
  async initialize(): Promise<void> { /* setup */ }
  async startCapture(): Promise<void> { /* begin */ }
  stopCapture(): void { /* cleanup */ }
}
```

### New FFT Algorithms
```typescript
export class CustomFFT extends FFTProvider {
  get name(): string { return "Custom FFT"; }
  transform(input: Float32Array): { real: number[], imag: number[] }
}
```

## Dependencies

- **@picovoice/pvrecorder-node**: Cross-platform audio capture
- **fft.js**: Fast Fourier Transform library  
- **node-wav**: WAV file processing