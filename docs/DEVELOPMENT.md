# Development Guide

## Prerequisites

- **Node.js** 18+
- **VS Code** 1.74+  
- **TypeScript** 4.9+

## Build from Source

```bash
git clone https://github.com/ark-tik/vs-code-music-visualiser.git
cd vs-code-music-visualiser
npm install
npm run compile
```

## Development Workflow

### Testing Extension
Press `F5` in VS Code to launch Extension Development Host

### Package for Distribution
```bash
npm install -g @vscode/vsce
vsce package
```

### Available Commands
- `npm run compile` - Build TypeScript
- `npm run watch` - Continuous compilation
- `node list-audio-devices.js` - Test audio device discovery

## Project Structure

```
src/
├── audioSources/           # Audio input implementations
│   ├── microphoneAudioSource.ts   # Microphone capture
│   └── systemAudioSource.ts       # System audio loopback
├── fftProviders/           # Frequency analysis
│   └── fftProvider.ts      # FFT/DFT implementations
├── audioVisualizer.ts      # Main orchestration
├── frequencyAnalyzer.ts    # Audio → frequency conversion
├── cursorController.ts     # Frequency → cursor mapping
└── extension.ts            # VS Code integration
```

## Audio Sources

### Microphone Input
- Uses `@picovoice/pvrecorder-node` for cross-platform capture
- Works immediately without setup
- Best for live audio, streaming

### System Audio (Loopback)
- **macOS**: Requires BlackHole + Multi-Output Device setup
- **Windows**: Enable "Stereo Mix" in recording devices  
- **Linux**: Uses PulseAudio monitor devices
- Best for music visualization

## Testing Audio Setup

```bash
node list-audio-devices.js
```
Shows available devices and identifies loopback sources.

## Extension Points

### New Audio Sources
Implement `AudioSource` interface:
```typescript
export class CustomAudioSource extends AudioSource {
  get name(): string { return "Custom Source"; }
  async initialize(): Promise<void> { /* setup */ }
  async startCapture(): Promise<void> { /* begin */ }
  stopCapture(): void { /* cleanup */ }
}
```

### New FFT Algorithms
Implement `FFTProvider` interface:
```typescript
export class CustomFFT extends FFTProvider {
  get name(): string { return "Custom FFT"; }
  transform(input: Float32Array): { real: number[], imag: number[] }
}
```

## Dependencies

- **@picovoice/pvrecorder-node**: Cross-platform audio capture
- **fft.js**: Fast Fourier Transform library
- **node-wav**: WAV file processing (system audio fallback)

## Performance Notes

- **FFT vs DFT**: Use FFT for >256 samples, DFT for smaller sizes
- **Update Rate**: 60 FPS balances smoothness vs CPU usage
- **Buffer Management**: Limited to 10 audio frames in memory
- **Sample Rate**: Assumes 44.1kHz audio input