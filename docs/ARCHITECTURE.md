# Audio Visualizer VS Code Extension - Architecture

## Overview

The Audio Visualizer extension captures audio data, analyzes its frequency spectrum, and visualizes it using VS Code's multiline cursor feature. The extension creates cursors positioned based on audio frequency magnitudes.

## Architecture Diagram

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   VS Code       │    │   Extension      │    │   Audio         │
│   Editor        │◄───┤   Commands       │────┤   Visualizer    │
│                 │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                        │
                       ┌────────────────────────────────┼────────────────────────────────┐
                       │                                │                                │
                       ▼                                ▼                                ▼
            ┌─────────────────┐              ┌─────────────────┐              ┌─────────────────┐
            │  Audio Sources  │              │ Frequency       │              │ Cursor          │
            │                 │              │ Analyzer        │              │ Controller      │
            │ ┌─────────────┐ │              │                 │              │                 │
            │ │ Microphone  │ │              │ ┌─────────────┐ │              │                 │
            │ │ Audio       │ │              │ │ FFT         │ │              │                 │
            │ │ Source      │ │              │ │ Providers   │ │              │                 │
            │ └─────────────┘ │              │ │             │ │              │                 │
            │ ┌─────────────┐ │              │ │ ┌─────────┐ │ │              │                 │
            │ │ Test Audio  │ │──────────────┤ │ │   DFT   │ │ │──────────────┤                 │
            │ │ Source      │ │              │ │ └─────────┘ │ │              │                 │
            │ └─────────────┘ │              │ │ ┌─────────┐ │ │              │                 │
            │ ┌─────────────┐ │              │ │ │Cooley-  │ │ │              │                 │
            │ │ File Audio  │ │              │ │ │Tukey    │ │ │              │                 │
            │ │ Source      │ │              │ │ │FFT      │ │ │              │                 │
            │ └─────────────┘ │              │ │ └─────────┘ │ │              │                 │
            └─────────────────┘              │ └─────────────┘ │              │                 │
                                             └─────────────────┘              └─────────────────┘
```

## Core Components

### 1. AudioSource (Abstract Base Class)
**Location**: `src/audioSource.ts`

Defines the interface for all audio input sources:
- `initialize()`: Set up the audio source
- `startCapture()`: Begin audio data collection  
- `stopCapture()`: Stop audio data collection
- `getLatestAudioData()`: Get most recent audio frame
- `name`: Human-readable source identifier

### 2. Audio Source Implementations

#### MicrophoneAudioSource
**Location**: `src/audioCapture.ts`
- Uses `@picovoice/pvrecorder-node` for cross-platform microphone access
- Captures real-time audio input from system microphone
- Converts Int16 samples to Float32 normalized data
- Handles audio device enumeration and selection

#### TestAudioSource  
**Location**: `src/testAudioCapture.ts`
- Generates synthetic sine wave audio for testing
- Creates 440Hz tone with configurable amplitude
- No hardware dependencies - always works
- Useful for debugging visualization logic

#### FileAudioSource
**Location**: `src/fileAudioSource.ts`
- Simulates audio file playback (generates sample data)
- Supports looping playback at configurable frame rates
- Extensible for real audio file formats (WAV, MP3, etc.)
- Good for testing with known audio patterns

### 3. FFTProvider (Abstract Base Class)
**Location**: `src/fftProvider.ts`

Abstract interface for frequency analysis algorithms:
- `transform(input: Float32Array)`: Convert time domain to frequency domain
- `name`: Algorithm identifier

#### FFT Implementations

**DFTProvider**: Simple Discrete Fourier Transform
- O(N²) complexity - slow but accurate
- Good for small sample sizes (≤256 samples)
- Educational/debugging purposes

**FFTProvider_CooleyTukey**: Fast Fourier Transform
- O(N log N) complexity - much faster
- Requires power-of-2 sample sizes
- Production-ready for larger sample sizes (≥512 samples)

**FFTJSProvider**: External library wrapper (placeholder)
- Placeholder for potential fft.js integration
- Currently disabled due to API issues

### 4. FrequencyAnalyzer
**Location**: `src/frequencyAnalyzer.ts`

Orchestrates frequency analysis:
- Takes audio samples and returns frequency data
- Uses configurable FFT provider for actual analysis
- Calculates magnitudes, dominant frequency, total energy
- Provides frequency binning for visualization

**FrequencyData Interface**:
```typescript
{
    frequencies: number[];     // Hz values for each bin
    magnitudes: number[];      // Amplitude for each frequency
    dominantFrequency: number; // Strongest frequency component
    totalEnergy: number;       // Sum of squared magnitudes
}
```

### 5. CursorController
**Location**: `src/cursorController.ts`

Maps frequency data to cursor positions:
- Takes FrequencyData and creates VS Code Selection objects
- Maps frequency bins to document lines (spectral spread)
- Maps magnitude to horizontal position (amplitude)
- Handles cursor count configuration and sensitivity
- Updates editor.selections to create multiline cursors

### 6. AudioVisualizer (Main Orchestrator)
**Location**: `src/audioVisualizer.ts`

Coordinates all components:
- Manages audio source lifecycle
- Runs update loop at configurable FPS (default 60)
- Connects frequency analysis to cursor visualization
- Handles error recovery and fallback modes

### 7. Extension Entry Point
**Location**: `src/extension.ts`

VS Code extension interface:
- Registers commands for different visualization modes
- Creates AudioVisualizer instances with appropriate sources
- Handles VS Code lifecycle (activate/deactivate)

## Data Flow

1. **Audio Capture**: AudioSource captures raw audio samples (Float32Array)
2. **Frequency Analysis**: FrequencyAnalyzer + FFTProvider convert to frequency spectrum
3. **Cursor Mapping**: CursorController maps frequency data to cursor positions
4. **Visualization**: VS Code editor displays multiline cursors
5. **Update Loop**: Process repeats at 60 FPS for real-time visualization

## Configuration

VS Code settings control visualization behavior:
- `audioVisualizer.sensitivity`: Amplitude multiplier (0.1-5.0)
- `audioVisualizer.cursorCount`: Number of cursors (8-256)  
- `audioVisualizer.updateRate`: Refresh rate in FPS (30-120)
- `audioVisualizer.frequencyRange`: Min/max Hz for analysis

## Commands

- **"Audio Visualizer: Start"**: Microphone with FFT fallback to test
- **"Audio Visualizer: Start (Test Mode)"**: Synthetic audio with FFT
- **"Audio Visualizer: Start (Test Mode - DFT)"**: Synthetic audio with DFT
- **"Audio Visualizer: Start (File Mode)"**: File playback with FFT
- **"Audio Visualizer: Stop"**: Stop any active visualization

## Extension Points

The architecture supports easy extension:

1. **New Audio Sources**: Implement AudioSource interface
   - System audio capture (loopback)
   - Network audio streams
   - Audio buffer playback

2. **New FFT Algorithms**: Implement FFTProvider interface
   - GPU-accelerated FFT
   - Windowing functions (Hamming, Blackman, etc.)
   - Real-time filtering

3. **New Visualization Modes**: Extend CursorController
   - Different cursor positioning algorithms
   - Color-coded cursors (if supported)
   - 3D visualization concepts

## Dependencies

- **@picovoice/pvrecorder-node**: Cross-platform audio capture
- **@types/vscode**: VS Code extension API types
- **TypeScript**: Language and compilation

## Performance Considerations

- **FFT vs DFT**: Use FFT for >256 samples, DFT for smaller sizes
- **Update Rate**: 60 FPS balances smoothness vs CPU usage
- **Buffer Management**: Limited to 10 audio frames in memory
- **Sample Rate**: Assumes 44.1kHz audio (configurable in FileAudioSource)

## Debugging

1. **Test Mode**: Synthetic audio eliminates hardware variables
2. **File Mode**: Reproducible audio patterns for consistent testing
3. **Console Logging**: Detailed logs for each processing stage
4. **DFT Mode**: Slower but more predictable than FFT for validation